import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { ActivityLog } from '../activity-log/activity-log.entity';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { Invoice, InvoiceLineItem } from '../invoices/invoice.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { PdfService } from '../pdf/pdf.service';
import {
  ClientNotification,
  ClientNotificationType,
} from '../portal/client-notification.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Tenant } from '../tenants/tenant.entity';
import {
  Proposal,
  ProposalAuditEntry,
  ProposalBlock,
  ProposalStatus,
} from './proposal.entity';

export type CreateProposalDto = {
  clientId: string;
  title: string;
  status?: ProposalStatus;
  blocks?: ProposalBlock[];
  totalAmount?: number;
  validUntil?: string | Date | null;
  notes?: string | null;
  terms?: string | null;
};

export type UpdateProposalDto = Partial<CreateProposalDto> & {
  signedAt?: string | Date | null;
  signatureData?: string | null;
  signatureIp?: string | null;
  signatureMethod?: string | null;
  aadhaarEsignStatus?: string | null;
  aadhaarEsignReference?: string | null;
  aadhaarEsignRequestedAt?: string | Date | null;
  aadhaarEsignCompletedAt?: string | Date | null;
  auditTrail?: ProposalAuditEntry[];
};

export type SignProposalResult = {
  id: string;
  status: ProposalStatus;
  signedAt: Date;
};

export type CompanyProposalDetail = Omit<
  Proposal,
  | 'aadhaarEsignStatus'
  | 'aadhaarEsignReference'
  | 'aadhaarEsignRequestedAt'
  | 'aadhaarEsignCompletedAt'
> & {
  aadhaarAttachmentNotice: string | null;
};

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(BusinessSettings)
    private readonly businessSettingsRepository: Repository<BusinessSettings>,
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepository: Repository<ActivityLog>,
    @InjectRepository(ClientNotification)
    private readonly notificationsRepository: Repository<ClientNotification>,
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(dto: CreateProposalDto, tenantId: string): Promise<Proposal> {
    if (!dto.clientId?.trim()) {
      throw new BadRequestException('clientId is required');
    }

    await this.assertClientBelongsToTenant(dto.clientId, tenantId);

    const blocks = this.normalizeBlocks(dto.blocks ?? []);
    if (
      dto.status === ProposalStatus.SENT &&
      !this.hasValidSignatureBlock(blocks)
    ) {
      throw new BadRequestException(
        'A completed signature section is required before sending a proposal',
      );
    }

    if (dto.status === ProposalStatus.SENT) {
      await this.subscriptionsService.assertCanSendDocument(tenantId);
    }

    const proposal = this.proposalsRepository.create({
      tenantId,
      clientId: dto.clientId,
      title: dto.title,
      status: dto.status ?? ProposalStatus.DRAFT,
      blocks,
      totalAmount: dto.totalAmount ?? this.calculateTotalAmount(blocks),
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      portalToken: await this.generatePortalToken(),
      notes: dto.notes ?? null,
      terms: dto.terms ?? null,
      auditTrail: [
        this.createAuditEntry('PROPOSAL_CREATED', 'company', null, {
          status: dto.status ?? ProposalStatus.DRAFT,
        }),
      ],
    });

    const savedProposal = await this.proposalsRepository.save(proposal);
    if (savedProposal.status === ProposalStatus.SENT) {
      await this.createProposalSentNotification(savedProposal);
    }

    return savedProposal;
  }

  findAll(tenantId: string): Promise<Proposal[]> {
    return this.proposalsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Proposal> {
    const proposal = await this.proposalsRepository.findOne({
      where: { id, tenantId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  async findCompanyProposalDetails(
    id: string,
    tenantId: string,
    userId?: string | null,
  ): Promise<CompanyProposalDetail> {
    const proposal = await this.findOne(id, tenantId);
    await this.activityLogsRepository.save(
      this.activityLogsRepository.create({
        tenantId,
        entityType: 'proposal',
        entityId: proposal.id,
        action: 'COMPANY_VIEWED_PROPOSAL_STATUS',
        userId: userId ?? null,
        metadata: {
          companyId: tenantId,
          clientId: proposal.clientId,
          proposalId: proposal.id,
          aadhaarDocumentAttached: proposal.aadhaarDocumentAttached,
        },
      }),
    );

    const {
      aadhaarEsignStatus,
      aadhaarEsignReference,
      aadhaarEsignRequestedAt,
      aadhaarEsignCompletedAt,
      ...safeProposal
    } = proposal;
    void aadhaarEsignStatus;
    void aadhaarEsignReference;
    void aadhaarEsignRequestedAt;
    void aadhaarEsignCompletedAt;

    return {
      ...safeProposal,
      aadhaarAttachmentNotice: proposal.aadhaarDocumentAttached
        ? 'Aadhaar document attached by client'
        : null,
    };
  }

  async update(
    id: string,
    dto: UpdateProposalDto,
    tenantId: string,
  ): Promise<Proposal> {
    const proposal = await this.findOne(id, tenantId);
    if (dto.clientId && dto.clientId !== proposal.clientId) {
      await this.assertClientBelongsToTenant(dto.clientId, tenantId);
    }

    const blocks = dto.blocks ? this.normalizeBlocks(dto.blocks) : undefined;
    if (
      dto.status === ProposalStatus.SENT &&
      proposal.status !== ProposalStatus.SENT
    ) {
      await this.subscriptionsService.assertCanSendDocument(tenantId);
    }

    const updatedProposal = this.proposalsRepository.merge(proposal, {
      clientId: dto.clientId ?? proposal.clientId,
      title: dto.title ?? proposal.title,
      status: dto.status ?? proposal.status,
      blocks: blocks ?? proposal.blocks,
      totalAmount:
        dto.totalAmount ??
        (blocks ? this.calculateTotalAmount(blocks) : proposal.totalAmount),
      validUntil:
        dto.validUntil === undefined
          ? proposal.validUntil
          : dto.validUntil
            ? new Date(dto.validUntil)
            : null,
      signedAt:
        dto.signedAt === undefined
          ? proposal.signedAt
          : dto.signedAt
            ? new Date(dto.signedAt)
            : null,
      signatureData: dto.signatureData ?? proposal.signatureData,
      signatureIp: dto.signatureIp ?? proposal.signatureIp,
      signatureMethod: dto.signatureMethod ?? proposal.signatureMethod,
      aadhaarEsignStatus: dto.aadhaarEsignStatus ?? proposal.aadhaarEsignStatus,
      aadhaarEsignReference:
        dto.aadhaarEsignReference ?? proposal.aadhaarEsignReference,
      aadhaarEsignRequestedAt:
        dto.aadhaarEsignRequestedAt === undefined
          ? proposal.aadhaarEsignRequestedAt
          : dto.aadhaarEsignRequestedAt
            ? new Date(dto.aadhaarEsignRequestedAt)
            : null,
      aadhaarEsignCompletedAt:
        dto.aadhaarEsignCompletedAt === undefined
          ? proposal.aadhaarEsignCompletedAt
          : dto.aadhaarEsignCompletedAt
            ? new Date(dto.aadhaarEsignCompletedAt)
            : null,
      auditTrail: dto.auditTrail ?? proposal.auditTrail,
      notes: dto.notes ?? proposal.notes,
      terms: dto.terms ?? proposal.terms,
    });

    const savedProposal = await this.proposalsRepository.save(updatedProposal);
    if (
      savedProposal.status === ProposalStatus.SENT &&
      proposal.status !== ProposalStatus.SENT
    ) {
      await this.createProposalSentNotification(savedProposal);
    }

    return savedProposal;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const proposal = await this.findOne(id, tenantId);
    const result = await this.proposalsRepository.delete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException('Proposal not found');
    }

    await this.notificationsRepository.save(
      this.notificationsRepository.create({
        tenantId,
        clientId: proposal.clientId,
        type: ClientNotificationType.PROPOSAL_DELETED,
        title: `Proposal deleted: ${proposal.title}`,
        message:
          'This proposal was deleted by the company and is no longer available for review.',
        invoiceId: null,
        proposalId: proposal.id,
        amount: Number(proposal.totalAmount),
        dueDate: proposal.validUntil,
        metadata: { source: 'proposal_deleted' },
      }),
    );
  }

  async generatePdf(id: string, tenantId: string): Promise<Buffer> {
    const proposal = await this.findOne(id, tenantId);
    const [client, tenant, settings] = await Promise.all([
      this.clientsRepository.findOne({
        where: { id: proposal.clientId, tenantId },
      }),
      this.tenantsRepository.findOne({ where: { id: tenantId } }),
      this.businessSettingsRepository.findOne({ where: { tenantId } }),
    ]);

    return this.pdfService.renderProposal({
      proposal,
      client,
      company: {
        name: tenant?.name ?? settings?.legalName ?? 'Company',
        legalName: settings?.legalName,
        gstin: settings?.gstin ?? tenant?.gstin,
        state: settings?.sellerState,
        currency: settings?.baseCurrency ?? tenant?.currency,
        logoUrl: this.absoluteLogoUrl(tenant?.logoUrl),
        logoAltText: tenant?.logoAltText,
      },
    });
  }

  async reorderBlocks(
    id: string,
    blockIds: string[],
    tenantId: string,
  ): Promise<Proposal> {
    const proposal = await this.findOne(id, tenantId);

    if (blockIds.length !== proposal.blocks.length) {
      throw new BadRequestException(
        'Block ids must include every proposal block',
      );
    }

    const blocksById = new Map(
      proposal.blocks.map((block) => [block.id, block]),
    );
    const reorderedBlocks = blockIds.map((blockId, index) => {
      const block = blocksById.get(blockId);

      if (!block) {
        throw new BadRequestException(`Unknown block id: ${blockId}`);
      }

      return { ...block, order: index };
    });

    proposal.blocks = reorderedBlocks;
    return this.proposalsRepository.save(proposal);
  }

  async sign(
    portalToken: string,
    signatureData: string,
    ip: string,
    signatureMethod?: string,
  ): Promise<SignProposalResult> {
    const proposal = await this.getByPortalToken(portalToken);
    const signedAt = new Date();
    const method = signatureMethod === 'DRAWN' ? 'DRAWN' : 'DRAWN';

    proposal.signatureData = signatureData;
    proposal.signatureIp = ip;
    proposal.signedAt = signedAt;
    proposal.signatureMethod = method;
    proposal.status = ProposalStatus.SIGNED;
    proposal.auditTrail = this.appendAudit(proposal, {
      event: 'CLIENT_SIGNED',
      actor: 'client',
      ip,
      metadata: {
        method,
        signedAt: signedAt.toISOString(),
      },
    });

    await this.proposalsRepository.save(proposal);

    return {
      id: proposal.id,
      status: proposal.status,
      signedAt,
    };
  }

  async convertToInvoice(id: string, tenantId: string): Promise<Invoice> {
    const proposal = await this.findOne(id, tenantId);
    const invoice = await this.invoicesService.create(
      {
        clientId: proposal.clientId,
        lineItems: this.extractInvoiceLineItems(proposal),
        dueDate: proposal.validUntil ?? this.defaultDueDate(),
        notes: proposal.notes,
        terms: proposal.terms,
      },
      tenantId,
    );

    proposal.status = ProposalStatus.CONVERTED;
    await this.proposalsRepository.save(proposal);

    return invoice;
  }

  async getByPortalToken(token: string): Promise<Proposal> {
    const proposal = await this.proposalsRepository.findOne({
      where: { portalToken: token },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  private async generatePortalToken(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const portalToken = randomUUID();
      const existingProposal = await this.proposalsRepository.findOne({
        where: { portalToken },
        select: { id: true },
      });

      if (!existingProposal) {
        return portalToken;
      }
    }

    throw new BadRequestException('Unable to generate a unique portal token');
  }

  private normalizeBlocks(blocks: ProposalBlock[]): ProposalBlock[] {
    return [...blocks]
      .sort((a, b) => a.order - b.order)
      .map((block, index) => ({ ...block, order: index }));
  }

  private appendAudit(
    proposal: Proposal,
    entry: Omit<ProposalAuditEntry, 'id' | 'at'>,
  ): ProposalAuditEntry[] {
    return [
      ...(proposal.auditTrail ?? []),
      this.createAuditEntry(
        entry.event,
        entry.actor,
        entry.ip ?? null,
        entry.metadata,
      ),
    ];
  }

  private createAuditEntry(
    event: string,
    actor: string,
    ip?: string | null,
    metadata?: Record<string, unknown>,
  ): ProposalAuditEntry {
    return {
      id: randomUUID(),
      event,
      actor,
      at: new Date().toISOString(),
      ip: ip ?? null,
      metadata: metadata ?? {},
    };
  }

  private calculateTotalAmount(blocks: ProposalBlock[]): number {
    const lineItems = this.extractLineItemsFromBlocks(blocks);

    if (lineItems.length === 0) {
      return 0;
    }

    return this.roundCurrency(
      lineItems.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const discount = Number(item.discount ?? 0);
        const gstRate = Number(item.gstRate ?? 0);
        const taxableAmount = quantity * unitPrice - discount;
        const tax = taxableAmount * (gstRate > 1 ? gstRate / 100 : gstRate);

        return sum + taxableAmount + tax;
      }, 0),
    );
  }

  private extractInvoiceLineItems(proposal: Proposal): InvoiceLineItem[] {
    const lineItems = this.extractLineItemsFromBlocks(proposal.blocks);

    if (lineItems.length > 0) {
      return lineItems;
    }

    return [
      {
        description: proposal.title,
        quantity: 1,
        unitPrice: Number(proposal.totalAmount),
        gstRate: 0,
      },
    ];
  }

  private extractLineItemsFromBlocks(
    blocks: ProposalBlock[],
  ): InvoiceLineItem[] {
    const pricingBlock = blocks.find((block) =>
      ['lineItems', 'line_items', 'pricing', 'estimate'].includes(block.type),
    );
    const content = pricingBlock?.content ?? {};
    const maybeItems = content.lineItems ?? content.items;

    if (!Array.isArray(maybeItems)) {
      return [];
    }

    return maybeItems.map((item) => {
      const record = item as Record<string, unknown>;
      const description = this.resolveLineItemDescription(record);

      return {
        description,
        quantity: Number(record.quantity ?? 1),
        unitPrice: Number(record.unitPrice ?? record.price ?? record.rate ?? 0),
        gstRate: Number(record.gstRate ?? record.taxRate ?? 0),
        discount: Number(record.discount ?? 0),
      };
    });
  }

  private defaultDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }

  private resolveLineItemDescription(record: Record<string, unknown>): string {
    const description = record.description ?? record.name;

    return typeof description === 'string' && description.trim().length > 0
      ? description
      : 'Proposal item';
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async assertClientBelongsToTenant(
    clientId: string,
    tenantId: string,
  ): Promise<void> {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId, tenantId },
      select: { id: true },
    });

    if (!client) {
      throw new BadRequestException('Client does not belong to this workspace');
    }
  }

  private hasValidSignatureBlock(blocks: ProposalBlock[]): boolean {
    const signatureBlock = blocks.find((block) => block.type === 'signature');

    if (!signatureBlock) {
      return false;
    }

    const content = signatureBlock.content;

    return [
      content.heading,
      content.acceptanceText,
      content.signerName,
      content.signerTitle,
    ].every((value) => typeof value === 'string' && value.trim().length > 0);
  }

  private async createProposalSentNotification(
    proposal: Proposal,
  ): Promise<void> {
    await this.notificationsRepository.save(
      this.notificationsRepository.create({
        tenantId: proposal.tenantId,
        clientId: proposal.clientId,
        type: ClientNotificationType.PROPOSAL_SENT,
        title: `Proposal sent: ${proposal.title}`,
        message: `A proposal for ${Number(proposal.totalAmount).toFixed(2)} is ready for review in your client portal.`,
        invoiceId: null,
        proposalId: proposal.id,
        amount: Number(proposal.totalAmount),
        dueDate: proposal.validUntil,
        metadata: { source: 'proposal_status_sent' },
      }),
    );
  }

  private absoluteLogoUrl(logoUrl?: string | null): string | null {
    if (!logoUrl) return null;
    if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith('data:'))
      return logoUrl;
    const base =
      process.env.API_PUBLIC_URL ??
      `http://localhost:${process.env.PORT ?? 3001}`;
    return `${base.replace(/\/$/, '')}${logoUrl}`;
  }
}
