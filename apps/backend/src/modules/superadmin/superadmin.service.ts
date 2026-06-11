import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../activity-log/activity-log.entity';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { DocumentRecord } from '../compliance/document-record.entity';
import { EInvoiceRecord } from '../compliance/e-invoice-record.entity';
import { GstReport } from '../compliance/gst-report.entity';
import { IntegrationConnection } from '../compliance/integration-connection.entity';
import { KhataEntry } from '../compliance/khata-entry.entity';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { ClientPortalOtp } from '../portal/client-portal-otp.entity';
import { ProposalApprovalDocument } from '../portal/proposal-approval-document.entity';
import { Proposal, ProposalStatus } from '../proposals/proposal.entity';
import {
  DemoRequest,
  DemoRequestStatus,
} from '../subscriptions/demo-request.entity';
import { SubscriptionPayment } from '../subscriptions/subscription-payment.entity';
import { TemplatesService } from '../templates/templates.service';
import { Tenant, TenantStatus } from '../tenants/tenant.entity';
import { TeamTask } from '../users/team-task.entity';
import { User, UserRole } from '../users/user.entity';

export type PlatformTenant = {
  id: string;
  name: string;
  subdomain: string;
  gstin: string | null;
  countryCode: string;
  currency: string;
  status: string;
  createdAt: Date;
  userCount: number;
  logoUrl: string | null;
  logoAltText: string | null;
  clientCount: number;
  invoiceCount: number;
  proposalCount: number;
  plan: string;
  billingCycle: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionCurrentPeriodEndsAt: Date | null;
};

export type PlatformUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  tenantId: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  companyLogoUrl: string | null;
  companyLogoAltText: string | null;
  tenantStatus: string | null;
};

export type PlatformRecord = Record<
  string,
  string | number | boolean | null | Date
>;

export type PlatformSummary = {
  tenants: number;
  users: number;
  activeUsers: number;
  owners: number;
  clients: number;
  proposals: number;
  approvedProposals: number;
  pendingProposals: number;
  invoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  payments: number;
  paidPayments: number;
  failedPayments: number;
  templates: number;
  revenueCollected: number;
};

export type PlatformClient = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  state: string | null;
  tenantId: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  companyLogoUrl: string | null;
  companyLogoAltText: string | null;
  createdAt: Date;
};

export type PlatformProposal = {
  id: string;
  title: string;
  status: string;
  totalAmount: string;
  clientId: string;
  clientName: string | null;
  tenantId: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  companyLogoUrl: string | null;
  companyLogoAltText: string | null;
  portalToken: string;
  signedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlatformInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  totalTax: string;
  dueDate: Date;
  clientId: string;
  clientName: string | null;
  tenantId: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  companyLogoUrl: string | null;
  companyLogoAltText: string | null;
  irn: string | null;
  createdAt: Date;
};

export type PlatformPayment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string | null;
  status: string;
  amount: string;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  tenantId: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  companyLogoUrl: string | null;
  companyLogoAltText: string | null;
  createdAt: Date;
};

export type PlatformTemplate = {
  slug: string;
  title: string;
  category: string;
  description: string;
  popularity: number;
  usageCount: number;
  tags: string[];
};

export type UpdatePlatformTenantDto = {
  name?: string;
  subdomain?: string;
  gstin?: string | null;
  countryCode?: string;
  currency?: string;
  status?: TenantStatus;
};

export type UpdatePlatformClientDto = {
  name?: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  state?: string | null;
};

export type UpdateDemoRequestDto = {
  status?: DemoRequestStatus;
};

@Injectable()
export class SuperadminService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepository: Repository<ActivityLog>,
    @InjectRepository(BusinessSettings)
    private readonly businessSettingsRepository: Repository<BusinessSettings>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(ClientPortalOtp)
    private readonly clientPortalOtpRepository: Repository<ClientPortalOtp>,
    @InjectRepository(DocumentRecord)
    private readonly documentRecordsRepository: Repository<DocumentRecord>,
    @InjectRepository(DemoRequest)
    private readonly demoRequestsRepository: Repository<DemoRequest>,
    @InjectRepository(EInvoiceRecord)
    private readonly eInvoiceRecordsRepository: Repository<EInvoiceRecord>,
    @InjectRepository(GstReport)
    private readonly gstReportsRepository: Repository<GstReport>,
    @InjectRepository(IntegrationConnection)
    private readonly integrationConnectionsRepository: Repository<IntegrationConnection>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(KhataEntry)
    private readonly khataEntriesRepository: Repository<KhataEntry>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(ProposalApprovalDocument)
    private readonly proposalApprovalDocumentsRepository: Repository<ProposalApprovalDocument>,
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    @InjectRepository(SubscriptionPayment)
    private readonly subscriptionPaymentsRepository: Repository<SubscriptionPayment>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(TeamTask)
    private readonly teamTasksRepository: Repository<TeamTask>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly templatesService: TemplatesService,
  ) {}

  async getSummary(): Promise<PlatformSummary> {
    const [
      tenants,
      users,
      activeUsers,
      owners,
      clients,
      proposals,
      approvedProposals,
      pendingProposals,
      invoices,
      paidInvoices,
      payments,
      paidPayments,
      failedPayments,
      templates,
      revenueRow,
    ] = await Promise.all([
      this.tenantsRepository.count(),
      this.usersRepository.count(),
      this.usersRepository.count({ where: { isActive: true } }),
      this.usersRepository.count({ where: { role: UserRole.OWNER } }),
      this.clientsRepository.count(),
      this.proposalsRepository.count(),
      this.proposalsRepository.count({
        where: { status: ProposalStatus.APPROVED },
      }),
      this.proposalsRepository.count({
        where: { status: ProposalStatus.SENT },
      }),
      this.invoicesRepository.count(),
      this.invoicesRepository.count({ where: { status: InvoiceStatus.PAID } }),
      this.paymentsRepository.count(),
      this.paymentsRepository.count({ where: { status: PaymentStatus.PAID } }),
      this.paymentsRepository.count({
        where: { status: PaymentStatus.FAILED },
      }),
      Promise.resolve(this.templatesService.findAll().length),
      this.paymentsRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.status = :status', { status: 'PAID' })
        .getRawOne<{ total: string }>(),
    ]);

    return {
      tenants,
      users,
      activeUsers,
      owners,
      clients,
      proposals,
      approvedProposals,
      pendingProposals,
      invoices,
      paidInvoices,
      unpaidInvoices: Math.max(invoices - paidInvoices, 0),
      payments,
      paidPayments,
      failedPayments,
      templates,
      revenueCollected: Number(revenueRow?.total ?? 0),
    };
  }

  async findTenants(): Promise<PlatformTenant[]> {
    const rows = await this.tenantsRepository
      .createQueryBuilder('tenant')
      .leftJoin(User, 'platform_user', 'platform_user."tenantId" = tenant.id')
      .select([
        'tenant.id AS id',
        'tenant.name AS name',
        'tenant.subdomain AS subdomain',
        'tenant.gstin AS gstin',
        'tenant."countryCode" AS "countryCode"',
        'tenant.currency AS currency',
        'tenant.status AS status',
        'tenant."createdAt" AS "createdAt"',
        'tenant."logoUrl" AS "logoUrl"',
        'tenant."logoAltText" AS "logoAltText"',
        'tenant.plan AS plan',
        'tenant."billingCycle" AS "billingCycle"',
        'tenant."subscriptionStatus" AS "subscriptionStatus"',
        'tenant."trialEndsAt" AS "trialEndsAt"',
        'tenant."subscriptionCurrentPeriodEndsAt" AS "subscriptionCurrentPeriodEndsAt"',
        'COUNT(DISTINCT platform_user.id)::int AS "userCount"',
        'COUNT(DISTINCT client.id)::int AS "clientCount"',
        'COUNT(DISTINCT invoice.id)::int AS "invoiceCount"',
        'COUNT(DISTINCT proposal.id)::int AS "proposalCount"',
      ])
      .leftJoin(Client, 'client', 'client."tenantId" = tenant.id')
      .leftJoin(Invoice, 'invoice', 'invoice."tenantId" = tenant.id')
      .leftJoin(Proposal, 'proposal', 'proposal."tenantId" = tenant.id')
      .groupBy('tenant.id')
      .orderBy('tenant."createdAt"', 'DESC')
      .getRawMany<PlatformTenant>();

    return rows;
  }

  async updateTenant(
    id: string,
    dto: UpdatePlatformTenantDto,
  ): Promise<PlatformTenant> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Company not found');
    }

    tenant.name = dto.name?.trim() || tenant.name;
    tenant.subdomain = dto.subdomain?.trim().toLowerCase() || tenant.subdomain;
    tenant.gstin =
      dto.gstin === undefined ? tenant.gstin : dto.gstin?.trim() || null;
    tenant.countryCode =
      dto.countryCode?.trim().toUpperCase() || tenant.countryCode;
    tenant.currency = dto.currency?.trim().toUpperCase() || tenant.currency;
    tenant.status = dto.status ?? tenant.status;

    await this.tenantsRepository.save(tenant);
    const tenants = await this.findTenants();
    return tenants.find((item) => item.id === id) as PlatformTenant;
  }

  async deleteTenant(id: string): Promise<void> {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Company not found');
    }

    await Promise.all([
      this.activityLogsRepository.delete({ tenantId: id }),
      this.businessSettingsRepository.delete({ tenantId: id }),
      this.clientPortalOtpRepository.delete({ tenantId: id }),
      this.paymentsRepository.delete({ tenantId: id }),
      this.proposalApprovalDocumentsRepository.delete({ companyId: id }),
      this.subscriptionPaymentsRepository.delete({ tenantId: id }),
      this.eInvoiceRecordsRepository.delete({ tenantId: id }),
      this.gstReportsRepository.delete({ tenantId: id }),
      this.documentRecordsRepository.delete({ tenantId: id }),
      this.khataEntriesRepository.delete({ tenantId: id }),
      this.integrationConnectionsRepository.delete({ tenantId: id }),
      this.teamTasksRepository.delete({ tenantId: id }),
    ]);
    await Promise.all([
      this.invoicesRepository.delete({ tenantId: id }),
      this.proposalsRepository.delete({ tenantId: id }),
      this.clientsRepository.delete({ tenantId: id }),
      this.usersRepository.delete({ tenantId: id }),
    ]);
    await this.tenantsRepository.delete({ id });
  }

  async findUsers(): Promise<PlatformUser[]> {
    const users = await this.usersRepository.find({
      relations: {
        tenant: true,
      },
      order: {
        email: 'ASC',
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name ?? null,
      tenantSubdomain: user.tenant?.subdomain ?? null,
      companyLogoUrl: user.tenant?.logoUrl ?? null,
      companyLogoAltText: user.tenant?.logoAltText ?? null,
      tenantStatus: user.tenant?.status ?? null,
    }));
  }

  async deleteUser(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException(
        'You cannot delete your own superadmin account.',
      );
    }

    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ([UserRole.OWNER, UserRole.SUPERADMIN].includes(user.role)) {
      throw new BadRequestException(
        'Owner and superadmin users cannot be deleted here.',
      );
    }

    await this.activityLogsRepository.update({ userId: id }, { userId: null });
    await this.usersRepository.delete({ id });
  }

  async findClients(): Promise<PlatformClient[]> {
    return this.clientsRepository
      .createQueryBuilder('client')
      .leftJoin(Tenant, 'tenant', 'tenant.id = client."tenantId"')
      .select([
        'client.id AS id',
        'client.name AS name',
        'client."companyName" AS "companyName"',
        'client.email AS email',
        'client.phone AS phone',
        'client.gstin AS gstin',
        'client.state AS state',
        'client."tenantId" AS "tenantId"',
        'tenant.name AS "tenantName"',
        'tenant.subdomain AS "tenantSubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant."logoAltText" AS "companyLogoAltText"',
        'tenant.status AS "tenantStatus"',
        'client."createdAt" AS "createdAt"',
      ])
      .orderBy('client."createdAt"', 'DESC')
      .getRawMany<PlatformClient>();
  }

  async updateClient(
    id: string,
    dto: UpdatePlatformClientDto,
  ): Promise<PlatformClient> {
    const client = await this.clientsRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    client.name = dto.name?.trim() || client.name;
    client.companyName =
      dto.companyName === undefined
        ? client.companyName
        : dto.companyName?.trim() || null;
    client.email =
      dto.email === undefined
        ? client.email
        : dto.email?.trim().toLowerCase() || null;
    client.phone =
      dto.phone === undefined ? client.phone : dto.phone?.trim() || null;
    client.gstin =
      dto.gstin === undefined
        ? client.gstin
        : dto.gstin?.trim().toUpperCase() || null;
    client.state =
      dto.state === undefined
        ? client.state
        : dto.state?.trim().toUpperCase() || null;

    await this.clientsRepository.save(client);
    const clients = await this.findClients();
    return clients.find((item) => item.id === id) as PlatformClient;
  }

  async deleteClient(id: string): Promise<void> {
    const client = await this.clientsRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await Promise.all([
      this.paymentsRepository
        .createQueryBuilder()
        .delete()
        .where(
          '"invoiceId" IN (SELECT id FROM invoices WHERE "clientId" = :id)',
          {
            id,
          },
        )
        .execute(),
      this.khataEntriesRepository.delete({ clientId: id }),
      this.documentRecordsRepository.delete({ clientId: id }),
    ]);
    await Promise.all([
      this.invoicesRepository.delete({ clientId: id }),
      this.proposalsRepository.delete({ clientId: id }),
    ]);
    await this.clientsRepository.delete({ id });
  }

  async findProposals(): Promise<PlatformProposal[]> {
    const rows = await this.proposalsRepository
      .createQueryBuilder('proposal')
      .leftJoin(Tenant, 'tenant', 'tenant.id = proposal."tenantId"')
      .leftJoin(Client, 'client', 'client.id = proposal."clientId"')
      .select([
        'proposal.id AS id',
        'proposal.title AS title',
        'proposal.status AS status',
        'proposal."totalAmount" AS "totalAmount"',
        'proposal."clientId" AS "clientId"',
        'client.name AS "clientName"',
        'proposal."tenantId" AS "tenantId"',
        'tenant.name AS "tenantName"',
        'tenant.subdomain AS "tenantSubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant."logoAltText" AS "companyLogoAltText"',
        'tenant.status AS "tenantStatus"',
        'proposal."portalToken" AS "portalToken"',
        'proposal."signedAt" AS "signedAt"',
        'proposal."createdAt" AS "createdAt"',
        'proposal."updatedAt" AS "updatedAt"',
      ])
      .orderBy('proposal."createdAt"', 'DESC')
      .getRawMany<PlatformProposal>();

    return rows;
  }

  async deleteProposal(id: string): Promise<void> {
    const proposal = await this.proposalsRepository.findOne({ where: { id } });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    await Promise.all([
      this.proposalApprovalDocumentsRepository.delete({ proposalId: id }),
      this.activityLogsRepository.delete({
        entityType: 'proposal',
        entityId: id,
      }),
    ]);
    await this.proposalsRepository.delete({ id });
  }

  async findInvoices(): Promise<PlatformInvoice[]> {
    const rows = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoin(Tenant, 'tenant', 'tenant.id = invoice."tenantId"')
      .leftJoin(Client, 'client', 'client.id = invoice."clientId"')
      .select([
        'invoice.id AS id',
        'invoice."invoiceNumber" AS "invoiceNumber"',
        'invoice.status AS status',
        'invoice.total AS total',
        'invoice."totalTax" AS "totalTax"',
        'invoice."dueDate" AS "dueDate"',
        'invoice."clientId" AS "clientId"',
        'client.name AS "clientName"',
        'invoice."tenantId" AS "tenantId"',
        'tenant.name AS "tenantName"',
        'tenant.subdomain AS "tenantSubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant."logoAltText" AS "companyLogoAltText"',
        'tenant.status AS "tenantStatus"',
        'invoice.irn AS irn',
        'invoice."createdAt" AS "createdAt"',
      ])
      .orderBy('invoice."createdAt"', 'DESC')
      .getRawMany<PlatformInvoice>();

    return rows;
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.invoicesRepository.findOne({ where: { id } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await Promise.all([
      this.paymentsRepository.delete({ invoiceId: id }),
      this.eInvoiceRecordsRepository.delete({ invoiceId: id }),
      this.activityLogsRepository.delete({
        entityType: 'invoice',
        entityId: id,
      }),
    ]);
    await this.invoicesRepository.delete({ id });
  }

  async findPayments(): Promise<PlatformPayment[]> {
    const rows = await this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoin(Tenant, 'tenant', 'tenant.id = payment."tenantId"')
      .leftJoin(Invoice, 'invoice', 'invoice.id = payment."invoiceId"')
      .select([
        'payment.id AS id',
        'payment."invoiceId" AS "invoiceId"',
        'invoice."invoiceNumber" AS "invoiceNumber"',
        'payment.status AS status',
        'payment.amount AS amount',
        'payment.currency AS currency',
        'payment."razorpayOrderId" AS "razorpayOrderId"',
        'payment."razorpayPaymentId" AS "razorpayPaymentId"',
        'payment."tenantId" AS "tenantId"',
        'tenant.name AS "tenantName"',
        'tenant.subdomain AS "tenantSubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant."logoAltText" AS "companyLogoAltText"',
        'tenant.status AS "tenantStatus"',
        'payment."createdAt" AS "createdAt"',
      ])
      .orderBy('payment."createdAt"', 'DESC')
      .getRawMany<PlatformPayment>();

    return rows;
  }

  async deletePayment(id: string): Promise<void> {
    const result = await this.paymentsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Payment not found');
    }
  }

  async findDemoRequests(): Promise<PlatformRecord[]> {
    return this.demoRequestsRepository
      .createQueryBuilder('request')
      .select([
        'request.id AS id',
        'request.name AS name',
        'request.email AS email',
        'request.company AS company',
        'request.phone AS phone',
        'request."teamSize" AS "teamSize"',
        'request.status AS status',
        'request."createdAt" AS "createdAt"',
      ])
      .orderBy('request."createdAt"', 'DESC')
      .take(500)
      .getRawMany<PlatformRecord>();
  }

  async updateDemoRequest(
    id: string,
    dto: UpdateDemoRequestDto,
  ): Promise<PlatformRecord> {
    const request = await this.demoRequestsRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Demo request not found');
    }

    if (dto.status && Object.values(DemoRequestStatus).includes(dto.status)) {
      request.status = dto.status;
    }

    await this.demoRequestsRepository.save(request);
    const requests = await this.findDemoRequests();
    return requests.find((item) => item.id === id) as PlatformRecord;
  }

  async deleteDemoRequest(id: string): Promise<void> {
    const result = await this.demoRequestsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Demo request not found');
    }
  }

  async findSubscriptions(): Promise<PlatformRecord[]> {
    return this.subscriptionPaymentsRepository
      .createQueryBuilder('payment')
      .leftJoin(Tenant, 'tenant', 'tenant.id = payment."tenantId"')
      .select([
        'payment.id AS id',
        'tenant.id AS "tenantId"',
        'tenant.name AS "companyName"',
        'tenant.subdomain AS "companySubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant.status AS "tenantStatus"',
        'payment.plan AS plan',
        'payment."billingCycle" AS "billingCycle"',
        'payment.amount AS amount',
        'payment.currency AS currency',
        'payment.status AS status',
        'tenant."subscriptionStatus" AS "subscriptionStatus"',
        'tenant."subscriptionCurrentPeriodEndsAt" AS "subscriptionCurrentPeriodEndsAt"',
        'tenant."trialEndsAt" AS "trialEndsAt"',
        'payment."createdAt" AS "createdAt"',
      ])
      .orderBy('payment."createdAt"', 'DESC')
      .take(500)
      .getRawMany<PlatformRecord>();
  }

  async deleteSubscription(id: string): Promise<void> {
    const result = await this.subscriptionPaymentsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Subscription payment not found');
    }
  }

  findTemplates(): PlatformTemplate[] {
    return this.templatesService.findAll().map((template) => ({
      slug: template.slug,
      title: template.title,
      category: template.category,
      description: template.description,
      popularity: template.popularity,
      usageCount: template.usageCount,
      tags: template.tags,
    }));
  }

  async findGstReports(): Promise<PlatformRecord[]> {
    return this.gstReportsRepository
      .createQueryBuilder('report')
      .leftJoin(Tenant, 'tenant', 'tenant.id = report."tenantId"')
      .select([
        'report.id AS id',
        'tenant.id AS "tenantId"',
        'tenant.name AS "companyName"',
        'tenant.subdomain AS "companySubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant."logoAltText" AS "companyLogoAltText"',
        'tenant.status AS "tenantStatus"',
        'report.type AS type',
        'report.period AS period',
        'report.status AS status',
        'jsonb_array_length(report.rows)::int AS "rowCount"',
        'report."createdAt" AS "createdAt"',
      ])
      .orderBy('report."createdAt"', 'DESC')
      .getRawMany<PlatformRecord>();
  }

  async deleteGstReport(id: string): Promise<void> {
    const result = await this.gstReportsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('GST report not found');
    }
  }

  async findEInvoices(): Promise<PlatformRecord[]> {
    return this.eInvoiceRecordsRepository
      .createQueryBuilder('record')
      .leftJoin(Tenant, 'tenant', 'tenant.id = record."tenantId"')
      .leftJoin(Invoice, 'invoice', 'invoice.id = record."invoiceId"')
      .select([
        'record.id AS id',
        'tenant.id AS "tenantId"',
        'tenant.name AS "companyName"',
        'tenant.subdomain AS "companySubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant.status AS "tenantStatus"',
        'record.status AS status',
        'invoice."invoiceNumber" AS "invoiceNumber"',
        'record.irn AS irn',
        'record."createdAt" AS "createdAt"',
      ])
      .orderBy('record."createdAt"', 'DESC')
      .getRawMany<PlatformRecord>();
  }

  async deleteEInvoice(id: string): Promise<void> {
    const result = await this.eInvoiceRecordsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('E-invoice record not found');
    }
  }

  async findKhataEntries(): Promise<PlatformRecord[]> {
    return this.khataEntriesRepository
      .createQueryBuilder('entry')
      .leftJoin(Tenant, 'tenant', 'tenant.id = entry."tenantId"')
      .leftJoin(Client, 'client', 'client.id = entry."clientId"')
      .select([
        'entry.id AS id',
        'tenant.id AS "tenantId"',
        'tenant.name AS "companyName"',
        'tenant.subdomain AS "companySubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant.status AS "tenantStatus"',
        'entry.type AS type',
        'client."companyName" AS "clientCompanyName"',
        'client.name AS "clientName"',
        'entry.amount AS amount',
        'entry."outstandingAmount" AS "outstandingAmount"',
        'entry."dueDate" AS "dueDate"',
        'entry."createdAt" AS "createdAt"',
      ])
      .orderBy('entry."createdAt"', 'DESC')
      .getRawMany<PlatformRecord>();
  }

  async deleteKhataEntry(id: string): Promise<void> {
    const result = await this.khataEntriesRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Khata entry not found');
    }
  }

  async findDocuments(): Promise<PlatformRecord[]> {
    return this.documentRecordsRepository
      .createQueryBuilder('document')
      .leftJoin(Tenant, 'tenant', 'tenant.id = document."tenantId"')
      .select([
        'document.id AS id',
        'tenant.id AS "tenantId"',
        'tenant.name AS "companyName"',
        'tenant.subdomain AS "companySubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant.status AS "tenantStatus"',
        'document.type AS type',
        'document.status AS status',
        'document.title AS title',
        'document.amount AS amount',
        'document.currency AS currency',
        'document."createdAt" AS "createdAt"',
      ])
      .orderBy('document."createdAt"', 'DESC')
      .getRawMany<PlatformRecord>();
  }

  async deleteDocument(id: string): Promise<void> {
    const result = await this.documentRecordsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Document not found');
    }
  }

  async findIntegrations(): Promise<PlatformRecord[]> {
    return this.integrationConnectionsRepository
      .createQueryBuilder('integration')
      .leftJoin(Tenant, 'tenant', 'tenant.id = integration."tenantId"')
      .select([
        'integration.id AS id',
        'tenant.id AS "tenantId"',
        'tenant.name AS "companyName"',
        'tenant.subdomain AS "companySubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant.status AS "tenantStatus"',
        'integration.provider AS provider',
        'integration.status AS status',
        'integration."lastError" AS "lastError"',
        'integration."updatedAt" AS "updatedAt"',
      ])
      .orderBy('integration."updatedAt"', 'DESC')
      .getRawMany<PlatformRecord>();
  }

  async deleteIntegration(id: string): Promise<void> {
    const result = await this.integrationConnectionsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Integration not found');
    }
  }

  async findAuditLogs(): Promise<PlatformRecord[]> {
    return this.activityLogsRepository
      .createQueryBuilder('log')
      .leftJoin(Tenant, 'tenant', 'tenant.id = log."tenantId"')
      .leftJoin(User, 'user', 'user.id = log."userId"')
      .select([
        'log.id AS id',
        'tenant.id AS "tenantId"',
        'tenant.name AS "companyName"',
        'tenant.subdomain AS "companySubdomain"',
        'tenant."logoUrl" AS "companyLogoUrl"',
        'tenant.status AS "tenantStatus"',
        'log."entityType" AS "entityType"',
        'log.action AS action',
        'user.role AS "actorRole"',
        'log."createdAt" AS "createdAt"',
      ])
      .orderBy('log."createdAt"', 'DESC')
      .take(500)
      .getRawMany<PlatformRecord>();
  }

  async deleteAuditLog(id: string): Promise<void> {
    const result = await this.activityLogsRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('Audit log not found');
    }
  }

  async getAnalytics(): Promise<PlatformRecord[]> {
    const summary = await this.getSummary();
    return [
      { metric: 'Companies', current: summary.tenants, category: 'Growth' },
      { metric: 'Users', current: summary.users, category: 'Access' },
      { metric: 'Clients', current: summary.clients, category: 'CRM' },
      { metric: 'Proposals', current: summary.proposals, category: 'Sales' },
      { metric: 'Invoices', current: summary.invoices, category: 'Billing' },
      { metric: 'Payments', current: summary.payments, category: 'Revenue' },
      {
        metric: 'Revenue collected',
        current: summary.revenueCollected,
        category: 'Revenue',
      },
    ];
  }

  async getGlobalSettings(): Promise<PlatformRecord[]> {
    const summary = await this.getSummary();
    return [
      {
        setting: 'Platform companies',
        scope: 'Global',
        value: summary.tenants,
        status: 'LIVE',
      },
      {
        setting: 'Templates available',
        scope: 'Global',
        value: summary.templates,
        status: 'LIVE',
      },
      {
        setting: 'JWT security',
        scope: 'Auth',
        value: process.env.JWT_SECRET ? 'Configured' : 'Dev fallback',
        status: process.env.JWT_SECRET ? 'READY' : 'REVIEW',
      },
      {
        setting: 'SMTP email',
        scope: 'Email',
        value:
          process.env.SMTP_HOST || process.env.MAIL_HOST
            ? 'Configured'
            : 'Not configured',
        status:
          process.env.SMTP_HOST || process.env.MAIL_HOST ? 'READY' : 'REVIEW',
      },
      {
        setting: 'Logo storage',
        scope: 'Files',
        value: 'Local uploads',
        status: 'LIVE',
      },
    ];
  }

  async getSystemHealth(): Promise<PlatformRecord[]> {
    const [tenants, users, invoices, payments] = await Promise.all([
      this.tenantsRepository.count(),
      this.usersRepository.count(),
      this.invoicesRepository.count(),
      this.paymentsRepository.count(),
    ]);

    return [
      {
        service: 'API',
        status: 'OPERATIONAL',
        detail: 'Nest application responding',
        checkedAt: new Date(),
      },
      {
        service: 'Database',
        status: 'HEALTHY',
        detail: `${tenants} companies, ${users} users`,
        checkedAt: new Date(),
      },
      {
        service: 'Billing records',
        status: 'LIVE',
        detail: `${invoices} invoices, ${payments} payments`,
        checkedAt: new Date(),
      },
      {
        service: 'Email SMTP',
        status:
          process.env.SMTP_HOST || process.env.MAIL_HOST ? 'READY' : 'REVIEW',
        detail:
          process.env.SMTP_HOST || process.env.MAIL_HOST
            ? 'Configured'
            : 'Not configured',
        checkedAt: new Date(),
      },
      {
        service: 'File storage',
        status: 'LIVE',
        detail: 'Company logos served from uploads',
        checkedAt: new Date(),
      },
    ];
  }
}
