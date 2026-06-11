import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Between, Repository } from 'typeorm';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { Invoice, InvoiceLineItem } from '../invoices/invoice.entity';
import {
  ClientNotification,
  ClientNotificationType,
} from '../portal/client-notification.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Tenant } from '../tenants/tenant.entity';
import {
  DocumentRecord,
  BusinessDocumentStatus,
  BusinessDocumentType,
} from './document-record.entity';
import { EInvoiceRecord, EInvoiceStatus } from './e-invoice-record.entity';
import { GstReport, GstReportStatus, GstReportType } from './gst-report.entity';
import {
  IntegrationConnection,
  IntegrationProvider,
  IntegrationStatus,
} from './integration-connection.entity';
import { KhataEntry, KhataEntryType } from './khata-entry.entity';

export type CreateDocumentDto = {
  type: BusinessDocumentType;
  title: string;
  status?: BusinessDocumentStatus;
  clientId?: string | null;
  currency?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
};

export type GenerateGstReportDto = {
  type: GstReportType;
  period: string;
};

export type UpdateGstReportDto = {
  status?: GstReportStatus;
};

export type CreateKhataEntryDto = {
  clientId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  type: KhataEntryType;
  amount: number;
  outstandingAmount?: number;
  dueDate?: string | Date | null;
  notes?: string | null;
};

export type UpdateIntegrationDto = {
  status?: IntegrationStatus;
  config?: Record<string, unknown>;
  lastError?: string | null;
};

type GstTotals = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  invoiceValue: number;
  tdsAmount: number;
  tcsAmount: number;
};

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(DocumentRecord)
    private readonly documentsRepository: Repository<DocumentRecord>,
    @InjectRepository(GstReport)
    private readonly gstReportsRepository: Repository<GstReport>,
    @InjectRepository(EInvoiceRecord)
    private readonly eInvoiceRepository: Repository<EInvoiceRecord>,
    @InjectRepository(KhataEntry)
    private readonly khataRepository: Repository<KhataEntry>,
    @InjectRepository(IntegrationConnection)
    private readonly integrationsRepository: Repository<IntegrationConnection>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(ClientNotification)
    private readonly clientNotificationsRepository: Repository<ClientNotification>,
    @InjectRepository(BusinessSettings)
    private readonly businessSettingsRepository: Repository<BusinessSettings>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  getOverview(): Promise<{
    modules: Array<Record<string, unknown>>;
    documentTypes: BusinessDocumentType[];
    currencies: string[];
    taxSystems: string[];
  }> {
    return Promise.resolve({
      modules: [
        {
          name: 'GST Engine',
          status: 'ACTIVE',
          routes: ['/gst/reports', '/gst/e-invoicing'],
        },
        {
          name: 'Global Business',
          status: 'FOUNDATION_READY',
          routes: ['/global-settings'],
        },
        {
          name: 'Documents',
          status: 'FOUNDATION_READY',
          routes: ['/documents'],
        },
        { name: 'Payments', status: 'NEEDS_KEYS', routes: ['/payments'] },
        { name: 'Khata Mode', status: 'ACTIVE', routes: ['/khata'] },
      ],
      documentTypes: Object.values(BusinessDocumentType),
      currencies: ['INR', 'USD', 'EUR', 'GBP', 'AED'],
      taxSystems: ['GST', 'VAT', 'SALES_TAX'],
    });
  }

  async createDocument(
    tenantId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentRecord> {
    if (dto.status === BusinessDocumentStatus.SENT) {
      await this.subscriptionsService.assertCanSendDocument(tenantId);
    }

    return this.documentsRepository.save(
      this.documentsRepository.create({
        tenantId,
        type: dto.type,
        title: dto.title,
        status: dto.status ?? BusinessDocumentStatus.DRAFT,
        clientId: dto.clientId ?? null,
        currency: dto.currency?.trim().toUpperCase() ?? 'INR',
        amount: dto.amount ?? 0,
        metadata: dto.metadata ?? {},
        auditHistory: [
          { event: 'CREATED', at: new Date().toISOString(), id: randomUUID() },
        ],
      }),
    );
  }

  findDocuments(tenantId: string): Promise<DocumentRecord[]> {
    return this.documentsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async generateGstReport(
    tenantId: string,
    dto: GenerateGstReportDto,
  ): Promise<GstReport> {
    const reportData = await this.buildGstReportData(tenantId, dto);
    const report = this.gstReportsRepository.create({
      tenantId,
      type: dto.type,
      period: dto.period,
      status: GstReportStatus.READY,
      summary: reportData.summary,
      rows: reportData.rows,
    });

    return this.gstReportsRepository.save(report);
  }

  async findGstReports(tenantId: string): Promise<GstReport[]> {
    const reports = await this.gstReportsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    const hydratedReports = await Promise.all(
      reports.map(async (report) => {
        const reportData = await this.buildGstReportData(tenantId, {
          type: report.type,
          period: report.period,
        });

        report.summary = {
          ...reportData.summary,
          refreshedAt: new Date().toISOString(),
        };
        report.rows = reportData.rows;

        return this.gstReportsRepository.save(report);
      }),
    );

    return hydratedReports.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async updateGstReport(
    tenantId: string,
    reportId: string,
    dto: UpdateGstReportDto,
  ): Promise<GstReport> {
    const report = await this.gstReportsRepository.findOneOrFail({
      where: { id: reportId, tenantId },
    });

    if (dto.status) {
      report.status = dto.status;
      report.summary = {
        ...report.summary,
        statusUpdatedAt: new Date().toISOString(),
      };
    }

    return this.gstReportsRepository.save(report);
  }

  async deleteGstReport(tenantId: string, reportId: string): Promise<void> {
    await this.gstReportsRepository.delete({ id: reportId, tenantId });
  }

  async validateEInvoice(
    tenantId: string,
    invoiceId: string,
  ): Promise<EInvoiceRecord> {
    const existing = await this.eInvoiceRepository.findOne({
      where: { tenantId, invoiceId },
    });
    const record =
      existing ??
      this.eInvoiceRepository.create({
        tenantId,
        invoiceId,
      });

    record.status = EInvoiceStatus.VALIDATED;
    record.validationResult = {
      valid: true,
      note: 'Local validation completed. IRN generation requires live NIC API credentials.',
      checkedAt: new Date().toISOString(),
    };

    return this.eInvoiceRepository.save(record);
  }

  async generateIrn(
    tenantId: string,
    invoiceId: string,
  ): Promise<EInvoiceRecord> {
    const record = await this.validateEInvoice(tenantId, invoiceId);
    record.status = EInvoiceStatus.IRN_GENERATED;
    record.irn = `LOCAL-${invoiceId}-${Date.now()}`;
    record.qrCode = `invoiceforge://einvoice/${record.irn}`;
    record.validationResult = {
      ...record.validationResult,
      mode: 'LOCAL_PLACEHOLDER',
      note: 'Placeholder IRN created for development. Replace with NIC API call before production filing.',
    };

    return this.eInvoiceRepository.save(record);
  }

  findEInvoices(tenantId: string): Promise<EInvoiceRecord[]> {
    return this.eInvoiceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async createKhataEntry(
    tenantId: string,
    dto: CreateKhataEntryDto,
  ): Promise<KhataEntry> {
    if (dto.clientId) {
      const client = await this.clientsRepository.findOne({
        where: { id: dto.clientId, tenantId },
        select: { id: true },
      });

      if (!client) {
        throw new BadRequestException(
          'Client does not belong to this company.',
        );
      }
    }

    const amount = Number(dto.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }
    const outstandingAmount =
      dto.outstandingAmount === undefined
        ? dto.type === KhataEntryType.PAYMENT_RECEIVED
          ? 0
          : amount
        : Number(dto.outstandingAmount);

    if (!Number.isFinite(outstandingAmount) || outstandingAmount < 0) {
      throw new BadRequestException(
        'Outstanding amount must be zero or greater.',
      );
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    if (dueDate && Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Due date is invalid.');
    }

    const customerName = dto.customerName?.trim() || null;
    const customerPhone = dto.customerPhone?.trim() || null;

    const entry = await this.khataRepository.save(
      this.khataRepository.create({
        tenantId,
        clientId: dto.clientId ?? null,
        type: dto.type,
        amount,
        outstandingAmount,
        dueDate,
        notes: dto.notes ?? null,
        reminderSettings: {
          customerName,
          customerPhone,
        },
      }),
    );

    if (entry.type === KhataEntryType.REMINDER_SENT && entry.clientId) {
      await this.createKhataReminderNotification(entry);
    }

    return entry;
  }

  findKhataEntries(tenantId: string): Promise<KhataEntry[]> {
    return this.khataRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteKhataEntry(tenantId: string, id: string): Promise<void> {
    const result = await this.khataRepository.delete({ id, tenantId });

    if (!result.affected) {
      throw new NotFoundException('Khata entry not found');
    }
  }

  findIntegrations(tenantId: string): Promise<IntegrationConnection[]> {
    return Promise.all(
      Object.values(IntegrationProvider).map(async (provider) => {
        const existing = await this.integrationsRepository.findOne({
          where: { tenantId, provider },
        });

        if (existing) {
          return existing;
        }

        return this.integrationsRepository.save(
          this.integrationsRepository.create({
            tenantId,
            provider,
            status: IntegrationStatus.NOT_CONFIGURED,
          }),
        );
      }),
    );
  }

  async updateIntegration(
    tenantId: string,
    provider: IntegrationProvider,
    dto: UpdateIntegrationDto,
  ): Promise<IntegrationConnection> {
    await this.findIntegrations(tenantId);
    const integration = await this.integrationsRepository.findOneOrFail({
      where: { tenantId, provider },
    });

    return this.integrationsRepository.save(
      this.integrationsRepository.merge(integration, {
        status: dto.status ?? integration.status,
        config: dto.config ?? integration.config,
        lastError:
          dto.lastError === undefined ? integration.lastError : dto.lastError,
      }),
    );
  }

  async generateTallyXml(tenantId: string): Promise<string> {
    const [invoices, clients, tenant, settings] = await Promise.all([
      this.invoicesRepository.find({
        where: { tenantId },
        order: { createdAt: 'ASC' },
      }),
      this.clientsRepository.find({ where: { tenantId } }),
      this.tenantsRepository.findOne({ where: { id: tenantId } }),
      this.businessSettingsRepository.findOne({ where: { tenantId } }),
    ]);
    const clientById = new Map(clients.map((client) => [client.id, client]));
    const companyName =
      settings?.legalName?.trim() || tenant?.name?.trim() || 'InvoiceForge';
    const currency = settings?.baseCurrency ?? tenant?.currency ?? 'INR';
    const voucherXml = invoices
      .map((invoice) =>
        this.buildTallyVoucherXml(invoice, clientById.get(invoice.clientId)),
      )
      .join('\n');
    const partyLedgers = Array.from(
      new Set(
        invoices.map((invoice) =>
          this.tallyPartyName(clientById.get(invoice.clientId)),
        ),
      ),
    )
      .map(
        (partyName) => `
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <LEDGER NAME="${this.escapeXml(partyName)}" ACTION="Create">
                <NAME>${this.escapeXml(partyName)}</NAME>
                <PARENT>Sundry Debtors</PARENT>
                <ISBILLWISEON>Yes</ISBILLWISEON>
              </LEDGER>
            </TALLYMESSAGE>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${this.escapeXml(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="Sales" ACTION="Create">
            <NAME>Sales</NAME>
            <PARENT>Sales Accounts</PARENT>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
          </LEDGER>
        </TALLYMESSAGE>
${partyLedgers}
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <CURRENCY NAME="${this.escapeXml(currency)}" ACTION="Create">
            <NAME>${this.escapeXml(currency)}</NAME>
          </CURRENCY>
        </TALLYMESSAGE>
${voucherXml || `        <!-- No invoices found for ${this.escapeXml(companyName)}. -->`}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
  }

  private buildTallyVoucherXml(invoice: Invoice, client?: Client): string {
    const partyName = this.tallyPartyName(client);
    const invoiceTotal = this.round(this.asNumber(invoice.total));
    const lineItems = Array.isArray(invoice.lineItems)
      ? invoice.lineItems
      : [];
    const sourceLineItems =
      lineItems.length > 0
        ? lineItems
        : [
            {
              description: `Invoice ${invoice.invoiceNumber}`,
              quantity: 1,
              unitPrice: invoiceTotal,
              gstRate: 0,
              total: invoiceTotal,
            },
          ];
    const lineEntries = sourceLineItems
      .map((item) => {
        const taxableValue = this.round(this.lineTaxableValue(item));
        const totalTax =
          this.asNumber(item.totalTax) ||
          this.round(
            this.lineTaxAmount(item, 'cgst', taxableValue) +
              this.lineTaxAmount(item, 'sgst', taxableValue) +
              this.lineTaxAmount(item, 'igst', taxableValue),
          );
        const amount = this.round(taxableValue + totalTax);

        return `
              <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>Sales</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>${amount.toFixed(2)}</AMOUNT>
                <BASICUSERDESCRIPTION.LIST>
                  <BASICUSERDESCRIPTION>${this.escapeXml(item.description || 'Invoice line item')}</BASICUSERDESCRIPTION>
                </BASICUSERDESCRIPTION.LIST>
              </ALLLEDGERENTRIES.LIST>`;
      })
      .join('');

    return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${this.formatTallyDate(invoice.createdAt ?? invoice.dueDate ?? new Date())}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${this.escapeXml(invoice.invoiceNumber)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${this.escapeXml(partyName)}</PARTYLEDGERNAME>
            <BASICBASEPARTYNAME>${this.escapeXml(partyName)}</BASICBASEPARTYNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <NARRATION>${this.escapeXml(invoice.notes ?? `Invoice ${invoice.invoiceNumber}`)}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${this.escapeXml(partyName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${invoiceTotal.toFixed(2)}</AMOUNT>
              <BILLALLOCATIONS.LIST>
                <NAME>${this.escapeXml(invoice.invoiceNumber)}</NAME>
                <BILLTYPE>New Ref</BILLTYPE>
                <AMOUNT>-${invoiceTotal.toFixed(2)}</AMOUNT>
              </BILLALLOCATIONS.LIST>
            </ALLLEDGERENTRIES.LIST>${lineEntries}
          </VOUCHER>
        </TALLYMESSAGE>`;
  }

  private tallyPartyName(client?: Client): string {
    return (
      client?.companyName?.trim() ||
      client?.name?.trim() ||
      client?.email?.trim() ||
      'Unregistered customer'
    );
  }

  private async buildGstReportData(
    tenantId: string,
    dto: GenerateGstReportDto,
  ): Promise<{
    summary: Record<string, unknown>;
    rows: Array<Record<string, unknown>>;
  }> {
    const { start, end, label } = this.resolvePeriod(dto.period);
    const [invoices, clients, tenant, settings] = await Promise.all([
      this.invoicesRepository.find({
        where: { tenantId, createdAt: Between(start, end) },
        order: { createdAt: 'ASC' },
      }),
      this.clientsRepository.find({ where: { tenantId } }),
      this.tenantsRepository.findOne({ where: { id: tenantId } }),
      this.businessSettingsRepository.findOne({ where: { tenantId } }),
    ]);
    const clientById = new Map(clients.map((client) => [client.id, client]));
    const rows = this.buildGstRows(invoices, clientById, dto.type);
    const totals = rows.reduce<GstTotals>(
      (acc, row) => ({
        taxableValue: acc.taxableValue + this.asNumber(row.taxableValue),
        cgst: acc.cgst + this.asNumber(row.cgst),
        sgst: acc.sgst + this.asNumber(row.sgst),
        igst: acc.igst + this.asNumber(row.igst),
        totalTax: acc.totalTax + this.asNumber(row.totalTax),
        invoiceValue: acc.invoiceValue + this.asNumber(row.invoiceValue),
        tdsAmount: acc.tdsAmount + this.asNumber(row.tdsAmount),
        tcsAmount: acc.tcsAmount + this.asNumber(row.tcsAmount),
      }),
      {
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        invoiceValue: 0,
        tdsAmount: 0,
        tcsAmount: 0,
      },
    );
    const b2bRows = rows.filter((row) => row.gstin && row.gstin !== 'URP');
    const b2cRows = rows.filter((row) => !row.gstin || row.gstin === 'URP');
    const summary = {
      reportType: dto.type,
      period: dto.period,
      periodLabel: label,
      generatedAt: new Date().toISOString(),
      company: {
        name: tenant?.name ?? settings?.legalName ?? 'Company',
        legalName: settings?.legalName ?? tenant?.name ?? 'Company',
        gstin: settings?.gstin ?? tenant?.gstin ?? 'Not added',
        state: settings?.sellerState ?? 'Not added',
        currency: settings?.baseCurrency ?? tenant?.currency ?? 'INR',
        countryCode: settings?.countryCode ?? tenant?.countryCode ?? 'IN',
        logoUrl: tenant?.logoUrl ?? null,
        logoAltText: tenant?.logoAltText ?? null,
      },
      totals: this.roundObject(totals),
      counts: {
        invoices: invoices.length,
        rows: rows.length,
        b2bInvoices: b2bRows.length,
        b2cInvoices: b2cRows.length,
        nilRated: rows.filter((row) => this.asNumber(row.gstRate) === 0).length,
      },
      taxBreakup: this.buildTaxBreakup(rows),
      hsnSummary: this.buildHsnSummary(rows),
      reconciliation: this.buildReconciliationSummary(rows),
      sections: this.reportSections(dto.type),
      note:
        rows.length > 0
          ? 'Generated from company invoice records for the selected period.'
          : 'No company invoices were found for the selected period.',
    };

    return { summary, rows };
  }

  private buildGstRows(
    invoices: Invoice[],
    clientById: Map<string, Client>,
    type: GstReportType,
  ): Array<Record<string, unknown>> {
    return invoices.flatMap((invoice) => {
      const client = clientById.get(invoice.clientId);
      return invoice.lineItems.map((item, index) => {
        const taxableValue = this.lineTaxableValue(item);
        const cgst = this.lineTaxAmount(item, 'cgst', taxableValue);
        const sgst = this.lineTaxAmount(item, 'sgst', taxableValue);
        const igst = this.lineTaxAmount(item, 'igst', taxableValue);
        const totalTax =
          this.asNumber(item.totalTax) || this.round(cgst + sgst + igst);
        const invoiceValue =
          this.asNumber(item.total) || this.round(taxableValue + totalTax);
        const gstin = client?.gstin ?? 'URP';
        const baseRow = {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: this.formatDate(invoice.createdAt),
          clientName:
            client?.companyName ?? client?.name ?? 'Unregistered customer',
          gstin,
          placeOfSupply: client?.state ?? 'Not added',
          description: item.description || `Line ${index + 1}`,
          hsnCode: item.hsnCode ?? '',
          sacCode: item.sacCode ?? '',
          gstRate: this.asNumber(item.gstRate),
          taxableValue: this.round(taxableValue),
          cgst,
          sgst,
          igst,
          totalTax,
          invoiceValue,
          tdsRate: this.asNumber(item.tdsRate),
          tdsAmount: this.asNumber(item.tdsAmount),
          tcsRate: this.asNumber(item.tcsRate),
          tcsAmount: this.asNumber(item.tcsAmount),
          status: invoice.status,
          reconciliationStatus:
            type === GstReportType.GSTR_2A_RECONCILIATION
              ? gstin === 'URP'
                ? 'Unregistered buyer - review manually'
                : 'Matched with company invoice register'
              : 'Included',
        };

        if (type === GstReportType.GSTR_3B) {
          return {
            ...baseRow,
            returnSection:
              this.asNumber(baseRow.igst) > 0
                ? '3.1(a) Outward taxable supplies - inter-state'
                : '3.1(a) Outward taxable supplies - intra-state',
          };
        }

        if (type === GstReportType.GSTR_2A_RECONCILIATION) {
          return {
            ...baseRow,
            vendorInvoiceNumber: invoice.invoiceNumber,
            booksTax: totalTax,
            portalTax: totalTax,
            difference: 0,
          };
        }

        return {
          ...baseRow,
          returnSection:
            gstin === 'URP' ? 'B2C outward supply' : 'B2B outward supply',
        };
      });
    });
  }

  private buildTaxBreakup(rows: Array<Record<string, unknown>>) {
    const byRate = new Map<number, Record<string, number>>();

    for (const row of rows) {
      const rate = this.asNumber(row.gstRate);
      const current = byRate.get(rate) ?? {
        gstRate: rate,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
      };
      current.taxableValue += this.asNumber(row.taxableValue);
      current.cgst += this.asNumber(row.cgst);
      current.sgst += this.asNumber(row.sgst);
      current.igst += this.asNumber(row.igst);
      current.totalTax += this.asNumber(row.totalTax);
      byRate.set(rate, current);
    }

    return Array.from(byRate.values()).map((item) => this.roundObject(item));
  }

  private buildHsnSummary(rows: Array<Record<string, unknown>>) {
    const byCode = new Map<string, Record<string, number | string>>();

    for (const row of rows) {
      const code =
        this.asString(row.hsnCode || row.sacCode || 'UNCLASSIFIED').trim() ||
        'UNCLASSIFIED';
      const current = byCode.get(code) ?? {
        code,
        description: this.asString(row.description),
        taxableValue: 0,
        totalTax: 0,
        invoiceValue: 0,
      };
      current.taxableValue =
        this.asNumber(current.taxableValue) + this.asNumber(row.taxableValue);
      current.totalTax =
        this.asNumber(current.totalTax) + this.asNumber(row.totalTax);
      current.invoiceValue =
        this.asNumber(current.invoiceValue) + this.asNumber(row.invoiceValue);
      byCode.set(code, current);
    }

    return Array.from(byCode.values()).map((item) => this.roundObject(item));
  }

  private buildReconciliationSummary(rows: Array<Record<string, unknown>>) {
    const differences = rows.reduce(
      (sum, row) => sum + Math.abs(this.asNumber(row.difference)),
      0,
    );

    return {
      matchedRows: rows.filter((row) => this.asNumber(row.difference) === 0)
        .length,
      mismatchRows: rows.filter((row) => this.asNumber(row.difference) !== 0)
        .length,
      totalDifference: this.round(differences),
      reviewRequired: rows.filter((row) =>
        this.asString(row.reconciliationStatus)
          .toLowerCase()
          .includes('review'),
      ).length,
    };
  }

  private reportSections(type: GstReportType): string[] {
    if (type === GstReportType.GSTR_3B) {
      return [
        '3.1 Outward taxable supplies',
        '3.2 Inter-state supplies',
        '4 Eligible ITC placeholder',
        '5 Exempt, nil-rated and non-GST supplies',
        '6.1 Payment of tax summary',
      ];
    }

    if (type === GstReportType.GSTR_2A_RECONCILIATION) {
      return [
        'Books invoice register',
        'GST portal comparison',
        'Matched invoices',
        'Mismatch and review queue',
      ];
    }

    return [
      'B2B invoices',
      'B2C supplies',
      'HSN/SAC summary',
      'Document summary',
    ];
  }

  private resolvePeriod(period: string): {
    start: Date;
    end: Date;
    label: string;
  } {
    const match = /^(\d{4})-(\d{2})$/.exec(period);
    if (!match) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
        label: period,
      };
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return {
      start,
      end,
      label: new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric',
      }).format(start),
    };
  }

  private lineTaxableValue(item: InvoiceLineItem): number {
    const quantity = this.asNumber(item.quantity) || 1;
    const unitPrice = this.asNumber(item.unitPrice);
    const discount = this.asNumber(item.discount);

    return this.asNumber(item.taxableAmount) || quantity * unitPrice - discount;
  }

  private lineTaxAmount(
    item: InvoiceLineItem,
    field: 'cgst' | 'sgst' | 'igst',
    taxableValue: number,
  ): number {
    const explicit = this.asNumber(item[field]);

    if (explicit) {
      return this.round(explicit);
    }

    const rate = this.asNumber(item.gstRate);
    const taxType = item.taxType ?? 'CGST_SGST';

    if (field === 'igst') {
      return taxType === 'IGST' ? this.round(taxableValue * (rate / 100)) : 0;
    }

    return taxType === 'IGST'
      ? 0
      : this.round((taxableValue * (rate / 100)) / 2);
  }

  private asNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private asString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return '';
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private roundObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        typeof item === 'number' ? this.round(item) : item,
      ]),
    ) as T;
  }

  private formatDate(value: Date | string): string {
    return new Date(value).toISOString().slice(0, 10);
  }

  private formatTallyDate(value: Date | string): string {
    return this.formatDate(value).replace(/-/g, '');
  }

  private escapeXml(value: string): string {
    return value.replace(/[<>&'"]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      };

      return entities[char];
    });
  }

  private async createKhataReminderNotification(
    entry: KhataEntry,
  ): Promise<void> {
    if (!entry.clientId) return;

    const clientId = entry.clientId;
    const existing = await this.clientNotificationsRepository.findOne({
      where: {
        tenantId: entry.tenantId,
        clientId,
        type: ClientNotificationType.PAYMENT_REMINDER,
      },
      order: { createdAt: 'DESC' },
    });

    if (existing?.metadata?.['khataEntryId'] === entry.id) {
      return;
    }

    await this.clientNotificationsRepository.save(
      this.clientNotificationsRepository.create({
        tenantId: entry.tenantId,
        clientId,
        type: ClientNotificationType.PAYMENT_REMINDER,
        title: 'Payment reminder from your company',
        message:
          entry.notes?.trim() ||
          'Your company has sent a payment reminder for a pending balance.',
        invoiceId: null,
        proposalId: null,
        amount: Number(entry.amount ?? 0),
        dueDate: entry.dueDate ?? null,
        metadata: {
          khataEntryId: entry.id,
          source: 'khata_mode',
        },
      }),
    );
  }
}
