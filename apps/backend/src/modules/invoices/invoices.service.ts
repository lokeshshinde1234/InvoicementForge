import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { Invoice, InvoiceLineItem, InvoiceStatus } from './invoice.entity';
import { PdfService } from '../pdf/pdf.service';
import { PortalMailService } from '../portal/portal-mail.service';
import {
  ClientNotification,
  ClientNotificationType,
} from '../portal/client-notification.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Tenant } from '../tenants/tenant.entity';

export type CreateInvoiceDto = {
  clientId: string;
  lineItems: InvoiceLineItem[];
  dueDate: string | Date;
  status?: InvoiceStatus;
  notes?: string | null;
  terms?: string | null;
  irn?: string | null;
  qrCode?: string | null;
};

export type UpdateInvoiceDto = Partial<CreateInvoiceDto> & {
  status?: InvoiceStatus;
};

export type InvoiceFilters = {
  status?: InvoiceStatus;
  clientId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
};

export type SendInvoiceResult = {
  invoiceId: string;
  status: InvoiceStatus;
  sent: boolean;
  delivered: boolean;
  deliveryMode: 'smtp' | 'resend' | 'log';
  clientEmail: string;
};

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(BusinessSettings)
    private readonly businessSettingsRepository: Repository<BusinessSettings>,
    @InjectRepository(ClientNotification)
    private readonly notificationsRepository: Repository<ClientNotification>,
    private readonly pdfService: PdfService,
    private readonly portalMailService: PortalMailService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(dto: CreateInvoiceDto, tenantId: string): Promise<Invoice> {
    if (!dto.clientId?.trim()) {
      throw new BadRequestException('clientId is required');
    }

    if (!dto.lineItems?.length) {
      throw new BadRequestException('At least one line item is required');
    }

    await this.assertClientBelongsToTenant(dto.clientId, tenantId);

    if (dto.status === InvoiceStatus.SENT) {
      await this.subscriptionsService.assertCanSendDocument(tenantId);
    }

    const totals = this.calculateTotals(dto.lineItems);
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const invoice = this.invoicesRepository.create({
      tenantId,
      clientId: dto.clientId,
      invoiceNumber,
      status: dto.status ?? InvoiceStatus.DRAFT,
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      totalTax: totals.totalTax,
      total: totals.total,
      dueDate: new Date(dto.dueDate),
      notes: dto.notes ?? null,
      terms: dto.terms ?? null,
      irn: dto.irn ?? null,
      qrCode: dto.qrCode ?? null,
    });

    return this.invoicesRepository.save(invoice);
  }

  async findAll(
    tenantId: string,
    filters: InvoiceFilters = {},
  ): Promise<Invoice[]> {
    const where: FindOptionsWhere<Invoice> = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.search) {
      where.invoiceNumber = ILike(`%${filters.search}%`);
    }

    if (filters.dueFrom && filters.dueTo) {
      where.dueDate = Between(
        new Date(filters.dueFrom),
        new Date(filters.dueTo),
      );
    } else if (filters.dueFrom) {
      where.dueDate = MoreThanOrEqual(new Date(filters.dueFrom));
    } else if (filters.dueTo) {
      where.dueDate = LessThanOrEqual(new Date(filters.dueTo));
    }

    return this.invoicesRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(
    id: string,
    dto: UpdateInvoiceDto,
    tenantId: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);
    if (dto.clientId && dto.clientId !== invoice.clientId) {
      await this.assertClientBelongsToTenant(dto.clientId, tenantId);
    }

    const totals = dto.lineItems
      ? this.calculateTotals(dto.lineItems)
      : undefined;

    if (
      dto.status === InvoiceStatus.SENT &&
      invoice.status !== InvoiceStatus.SENT
    ) {
      await this.subscriptionsService.assertCanSendDocument(tenantId);
    }

    const updatedInvoice = this.invoicesRepository.merge(invoice, {
      clientId: dto.clientId ?? invoice.clientId,
      status: dto.status ?? invoice.status,
      lineItems: totals?.lineItems ?? invoice.lineItems,
      subtotal: totals?.subtotal ?? invoice.subtotal,
      totalTax: totals?.totalTax ?? invoice.totalTax,
      total: totals?.total ?? invoice.total,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate,
      notes: dto.notes ?? invoice.notes,
      terms: dto.terms ?? invoice.terms,
      irn: dto.irn ?? invoice.irn,
      qrCode: dto.qrCode ?? invoice.qrCode,
    });

    return this.invoicesRepository.save(updatedInvoice);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const invoice = await this.findOne(id, tenantId);
    const result = await this.invoicesRepository.delete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException('Invoice not found');
    }

    await this.notificationsRepository.save(
      this.notificationsRepository.create({
        tenantId,
        clientId: invoice.clientId,
        type: ClientNotificationType.INVOICE_DELETED,
        title: `Invoice ${invoice.invoiceNumber} deleted`,
        message:
          'This invoice was deleted by the company and is no longer available for payment.',
        invoiceId: invoice.id,
        proposalId: null,
        amount: Number(invoice.total),
        dueDate: invoice.dueDate,
        metadata: { source: 'invoice_deleted' },
      }),
    );
  }

  async generatePdf(id: string, tenantId: string): Promise<Buffer> {
    const invoice = await this.findOne(id, tenantId);
    const [client, tenant, settings] = await Promise.all([
      this.clientsRepository.findOne({
        where: { id: invoice.clientId, tenantId },
      }),
      this.tenantsRepository.findOne({ where: { id: tenantId } }),
      this.businessSettingsRepository.findOne({ where: { tenantId } }),
    ]);

    return this.pdfService.renderInvoice({
      invoice,
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

  async sendEmail(id: string, tenantId: string): Promise<SendInvoiceResult> {
    const invoice = await this.findOne(id, tenantId);
    const [client, tenant, settings] = await Promise.all([
      this.clientsRepository.findOne({
        where: { id: invoice.clientId, tenantId },
      }),
      this.tenantsRepository.findOne({ where: { id: tenantId } }),
      this.businessSettingsRepository.findOne({ where: { tenantId } }),
    ]);

    if (!client?.email) {
      throw new BadRequestException(
        'Client email is required before sending this invoice.',
      );
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      await this.subscriptionsService.assertCanSendDocument(tenantId);
      invoice.status = InvoiceStatus.SENT;
      await this.invoicesRepository.save(invoice);
    }

    const delivery = await this.portalMailService.sendInvoiceNotification({
      email: client.email,
      clientName: client.name || client.companyName || 'Client',
      companyName: settings?.legalName || tenant?.name || 'Company',
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      currency: settings?.baseCurrency ?? tenant?.currency ?? 'INR',
      dueDate: invoice.dueDate,
      portalUrl: this.portalLoginUrl(),
    });

    await this.notificationsRepository.save(
      this.notificationsRepository.create({
        tenantId,
        clientId: client.id,
        type: ClientNotificationType.INVOICE_SENT,
        title: `Invoice ${invoice.invoiceNumber} sent`,
        message: `A new invoice for ${Number(invoice.total).toFixed(2)} is available in your client portal.`,
        invoiceId: invoice.id,
        proposalId: null,
        amount: Number(invoice.total),
        dueDate: invoice.dueDate,
        metadata: { deliveryMode: delivery.mode },
      }),
    );

    return {
      invoiceId: invoice.id,
      status: invoice.status,
      sent: true,
      delivered: delivery.delivered,
      deliveryMode: delivery.mode,
      clientEmail: client.email,
    };
  }

  private portalLoginUrl(): string {
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
      .split(',')
      .map((url) => url.trim())
      .find(Boolean);

    return `${frontendUrl ?? 'http://localhost:3000'}/portal/login`;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const latestInvoice = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.invoiceNumber LIKE :prefix', {
        prefix: `${prefix}%`,
      })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    const latestSequence = latestInvoice
      ? Number(latestInvoice.invoiceNumber.replace(prefix, ''))
      : 0;
    const nextSequence = String(latestSequence + 1).padStart(3, '0');

    return `${prefix}${nextSequence}`;
  }

  private calculateTotals(lineItems: InvoiceLineItem[]): {
    lineItems: InvoiceLineItem[];
    subtotal: number;
    totalTax: number;
    total: number;
  } {
    const taxedLineItems = lineItems.map((lineItem) => {
      const quantity = Number(lineItem.quantity);
      const unitPrice = Number(lineItem.unitPrice);
      const discount = Number(lineItem.discount ?? 0);
      const gstRate = Number(lineItem.gstRate);
      const taxableAmount = this.roundCurrency(quantity * unitPrice - discount);
      const totalTax = this.roundCurrency(
        taxableAmount * (gstRate > 1 ? gstRate / 100 : gstRate),
      );

      return {
        ...lineItem,
        discount,
        taxableAmount,
        totalTax,
        total: this.roundCurrency(taxableAmount + totalTax),
      };
    });

    const subtotal = this.roundCurrency(
      taxedLineItems.reduce((sum, item) => sum + (item.taxableAmount ?? 0), 0),
    );
    const totalTax = this.roundCurrency(
      taxedLineItems.reduce((sum, item) => sum + (item.totalTax ?? 0), 0),
    );

    return {
      lineItems: taxedLineItems,
      subtotal,
      totalTax,
      total: this.roundCurrency(subtotal + totalTax),
    };
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
