import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
} from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { Repository } from 'typeorm';
import { ActivityLog } from '../activity-log/activity-log.entity';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { KhataEntry, KhataEntryType } from '../compliance/khata-entry.entity';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { PdfService } from '../pdf/pdf.service';
import {
  Proposal,
  ProposalApprovalStatus,
  ProposalStatus,
} from '../proposals/proposal.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ClientPortalOtp } from './client-portal-otp.entity';
import {
  ClientNotification,
  ClientNotificationType,
} from './client-notification.entity';
import { PortalMailService } from './portal-mail.service';
import {
  ProposalApprovalDocument,
  ProposalApprovalDocumentStatus,
} from './proposal-approval-document.entity';

export type PortalTokenPayload = {
  sub: string;
  email: string;
  tenantId: string;
  clientId: string;
  type: 'client_portal';
};

export type PortalLoginRequest = {
  email?: string;
  companyId?: string;
  password?: string;
};

export type PortalPasswordRequest = PortalLoginRequest & {
  newPassword?: string;
  confirmPassword?: string;
};

type PortalSummary = {
  client: Pick<Client, 'id' | 'name' | 'companyName' | 'email' | 'phone'>;
  company: Pick<
    Tenant,
    'id' | 'name' | 'subdomain' | 'logoUrl' | 'logoAltText'
  >;
  documents: {
    proposals: Array<
      Pick<
        Proposal,
        | 'id'
        | 'title'
        | 'status'
        | 'totalAmount'
        | 'createdAt'
        | 'approvalStatus'
        | 'aadhaarDocumentAttached'
      >
    >;
    invoices: Array<
      Pick<Invoice, 'id' | 'invoiceNumber' | 'status' | 'total' | 'dueDate'>
    >;
  };
  notifications: Array<
    Pick<
      ClientNotification,
      | 'id'
      | 'type'
      | 'title'
      | 'message'
      | 'invoiceId'
      | 'proposalId'
      | 'amount'
      | 'dueDate'
      | 'readAt'
      | 'createdAt'
    >
  >;
};

type PortalProposalDetail = Pick<
  Proposal,
  | 'id'
  | 'title'
  | 'status'
  | 'blocks'
  | 'totalAmount'
  | 'validUntil'
  | 'signedAt'
  | 'signatureData'
  | 'signatureIp'
  | 'signatureMethod'
  | 'aadhaarEsignStatus'
  | 'aadhaarEsignReference'
  | 'aadhaarEsignRequestedAt'
  | 'aadhaarEsignCompletedAt'
  | 'approvalStatus'
  | 'aadhaarDocumentAttached'
  | 'approvedByClientId'
  | 'approvedAt'
  | 'auditTrail'
  | 'notes'
  | 'terms'
> & {
  aadhaarDocument: PortalAadhaarDocument | null;
};

type PortalAadhaarDocument = {
  id: string;
  documentType: 'aadhaar';
  fileName: string;
  fileMimeType: string;
  fileSize: number;
  uploadedAt: Date;
  status: ProposalApprovalDocumentStatus;
};

type AadhaarPreview = {
  buffer: Buffer;
  fileName: string;
  fileMimeType: string;
  fileSize: number;
};

type PortalSignatureBody = {
  signatureData?: string;
  signatureMethod?: string;
};

type PortalInvoiceDetail = Pick<
  Invoice,
  | 'id'
  | 'invoiceNumber'
  | 'status'
  | 'lineItems'
  | 'subtotal'
  | 'totalTax'
  | 'total'
  | 'dueDate'
  | 'notes'
  | 'terms'
>;

type PortalGstWorkspace = {
  company: {
    gstin: string | null;
    state: string | null;
    taxSystem: string | null;
  };
  client: {
    gstin: string | null;
    state: string | null;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    dueDate: Date;
    total: number;
    totalTax: number;
    lineItems: Invoice['lineItems'];
  }>;
};

@Injectable()
export class PortalService {
  private readonly otpExpiryMs =
    Number(process.env.PORTAL_OTP_TTL_SECONDS ?? 600) * 1000;
  private readonly rateLimitWindowMs = 10 * 60 * 1000;
  private readonly rateLimitMax = Number(
    process.env.PORTAL_OTP_RATE_LIMIT ?? 5,
  );
  private readonly requests = new Map<string, number[]>();
  private readonly resetExpiryMs =
    Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 60) * 60 * 1000;
  private readonly aadhaarUploadRoot = join(
    process.cwd(),
    'private',
    'proposal-approval-documents',
  );
  private readonly aadhaarMaxBytes = Number(
    process.env.AADHAAR_DOCUMENT_MAX_BYTES ?? 5 * 1024 * 1024,
  );
  private readonly aadhaarMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ]);

  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(ClientPortalOtp)
    private readonly otpsRepository: Repository<ClientPortalOtp>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    @InjectRepository(ProposalApprovalDocument)
    private readonly approvalDocumentsRepository: Repository<ProposalApprovalDocument>,
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepository: Repository<ActivityLog>,
    @InjectRepository(BusinessSettings)
    private readonly businessSettingsRepository: Repository<BusinessSettings>,
    @InjectRepository(ClientNotification)
    private readonly notificationsRepository: Repository<ClientNotification>,
    @InjectRepository(KhataEntry)
    private readonly khataRepository: Repository<KhataEntry>,
    private readonly jwtService: JwtService,
    private readonly portalMailService: PortalMailService,
    private readonly pdfService: PdfService,
  ) {}

  async sendOtp(body: { email?: string; companyId?: string }) {
    const email = this.normalizeEmail(body.email);
    const client = await this.findClientForPortal(email, body.companyId);
    const tenantId = client.tenantId;
    const company = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!company) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    this.assertRateLimit(`${tenantId}:${email}`);

    const otp = String(randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + this.otpExpiryMs);

    await this.otpsRepository.save(
      this.otpsRepository.create({
        tenantId,
        clientId: client.id,
        email,
        otpHash,
        expiresAt,
      }),
    );

    const expiresInMinutes = Math.max(1, Math.round(this.otpExpiryMs / 60000));
    const delivery = await this.portalMailService.sendOtp({
      email,
      otp,
      companyName: company.name,
      clientName: client.name,
      expiresInMinutes,
    });

    return {
      message: 'OTP sent successfully.',
      company: {
        id: company.id,
        name: company.name,
      },
      delivery,
    };
  }

  async verifyOtp(body: { email?: string; companyId?: string; otp?: string }) {
    const email = this.normalizeEmail(body.email);
    const client = await this.findClientForPortal(email, body.companyId);
    const tenantId = client.tenantId;
    const otp = body.otp?.trim();

    if (!otp) {
      throw new BadRequestException(
        'Invalid or expired OTP. Please try again.',
      );
    }

    const portalOtp = await this.otpsRepository.findOne({
      where: { tenantId, clientId: client.id, email, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!portalOtp || portalOtp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(
        'Invalid or expired OTP. Please try again.',
      );
    }

    const isOtpValid = await bcrypt.compare(otp, portalOtp.otpHash);

    if (!isOtpValid) {
      throw new UnauthorizedException(
        'Invalid or expired OTP. Please try again.',
      );
    }

    portalOtp.isUsed = true;
    await this.otpsRepository.save(portalOtp);

    const payload: PortalTokenPayload = {
      sub: client.id,
      clientId: client.id,
      email,
      tenantId,
      type: 'client_portal',
    };

    return {
      message: 'OTP verified successfully.',
      access_token: this.jwtService.sign(payload, { expiresIn: '12h' }),
      client: this.serializeClient(client),
      company: {
        id: tenantId,
      },
    };
  }

  async login(body: PortalLoginRequest) {
    const email = this.normalizeEmail(body.email);
    const password = body.password ?? '';
    const client = await this.findClientForPortalWithPassword(
      email,
      body.companyId,
    );

    if (!client.isPasswordCreated || !client.passwordHash) {
      return {
        requiresPasswordSetup: true,
        message: 'Password not created. Please create your password.',
        client: this.serializeClient(client),
        company: { id: client.tenantId },
      };
    }

    const isPasswordValid = await this.safeComparePassword(
      password,
      client.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid credentials or client not registered.',
      );
    }

    return this.signPortalClient(client, email, 'Login successful.');
  }

  async setPassword(body: PortalPasswordRequest) {
    const email = this.normalizeEmail(body.email);
    this.assertPasswordsMatch(
      body.newPassword ?? body.password,
      body.confirmPassword,
    );
    const newPassword = body.newPassword ?? body.password ?? '';
    this.assertStrongPassword(newPassword);
    const client = await this.findClientForPortalWithPassword(
      email,
      body.companyId,
    );

    if (client.isPasswordCreated || client.passwordHash) {
      throw new BadRequestException('Password has already been created.');
    }

    client.passwordHash = await bcrypt.hash(newPassword, 12);
    client.isPasswordCreated = true;
    client.passwordCreatedAt = new Date();
    client.resetPasswordTokenHash = null;
    client.resetPasswordExpiresAt = null;
    client.resetPasswordUsed = false;
    await this.clientsRepository.save(client);

    return this.signPortalClient(
      client,
      email,
      'Password created successfully.',
    );
  }

  async forgotPassword(body: { email?: string; companyId?: string }) {
    const email = this.normalizeEmail(body.email);
    const client = await this.findClientForPortalWithPassword(
      email,
      body.companyId,
    );
    const company = await this.tenantsRepository.findOne({
      where: { id: client.tenantId },
    });

    if (!company) {
      throw new UnauthorizedException(
        'Invalid credentials or client not registered.',
      );
    }

    const token = this.createResetToken();
    client.resetPasswordTokenHash = this.hashResetToken(token);
    client.resetPasswordExpiresAt = new Date(Date.now() + this.resetExpiryMs);
    client.resetPasswordUsed = false;
    await this.clientsRepository.save(client);

    const resetUrl = this.buildFrontendUrl(
      `/portal/reset-password?token=${encodeURIComponent(token)}&companyId=${encodeURIComponent(client.tenantId)}`,
    );
    const expiresInMinutes = Math.max(
      1,
      Math.round(this.resetExpiryMs / 60000),
    );
    const delivery = await this.portalMailService.sendPasswordResetLink({
      email,
      resetUrl,
      accountName: client.name,
      subject: `${company.name} client portal password reset`,
      expiresInMinutes,
      logoUrl: this.absoluteLogoUrl(company.logoUrl),
      logoAltText: company.logoAltText,
    });

    return { message: 'Password reset link sent successfully.', delivery };
  }

  async resetPassword(body: {
    token?: string;
    companyId?: string;
    newPassword?: string;
    confirmPassword?: string;
  }) {
    const tokenHash = this.hashResetToken(body.token);
    this.assertPasswordsMatch(body.newPassword, body.confirmPassword);
    this.assertStrongPassword(body.newPassword ?? '');

    const client = await this.clientsRepository
      .createQueryBuilder('client')
      .addSelect('client.passwordHash')
      .addSelect('client.resetPasswordTokenHash')
      .where('client.resetPasswordTokenHash = :tokenHash', { tokenHash })
      .andWhere('client.resetPasswordUsed = false')
      .getOne();

    if (
      !client ||
      (body.companyId && client.tenantId !== body.companyId.trim()) ||
      !client.resetPasswordExpiresAt ||
      client.resetPasswordExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    client.passwordHash = await bcrypt.hash(body.newPassword ?? '', 12);
    client.isPasswordCreated = true;
    client.passwordCreatedAt = client.passwordCreatedAt ?? new Date();
    client.resetPasswordUsed = true;
    client.resetPasswordTokenHash = null;
    client.resetPasswordExpiresAt = null;
    await this.clientsRepository.save(client);

    return { message: 'Password updated successfully. Please login again.' };
  }

  async changePassword(
    payload: PortalTokenPayload,
    body: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
  ) {
    this.assertPasswordsMatch(body.newPassword, body.confirmPassword);
    this.assertStrongPassword(body.newPassword ?? '');

    const client = await this.clientsRepository
      .createQueryBuilder('client')
      .addSelect('client.passwordHash')
      .where('client.id = :clientId', { clientId: payload.clientId })
      .andWhere('client.tenantId = :tenantId', { tenantId: payload.tenantId })
      .getOne();

    if (!client || !client.passwordHash) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    const isCurrentPasswordValid = await this.safeComparePassword(
      body.currentPassword ?? '',
      client.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    client.passwordHash = await bcrypt.hash(body.newPassword ?? '', 12);
    client.isPasswordCreated = true;
    client.passwordCreatedAt = client.passwordCreatedAt ?? new Date();
    await this.clientsRepository.save(client);

    return { message: 'Password updated successfully.' };
  }

  async me(payload: PortalTokenPayload): Promise<PortalSummary> {
    await this.ensureDueReminderNotifications(payload.tenantId, payload.clientId);

    const [client, company, proposals, invoices, notifications] =
      await Promise.all([
      this.clientsRepository.findOne({
        where: { id: payload.clientId, tenantId: payload.tenantId },
      }),
      this.tenantsRepository.findOne({ where: { id: payload.tenantId } }),
      this.proposalsRepository.find({
        where: { tenantId: payload.tenantId, clientId: payload.clientId },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.invoicesRepository.find({
        where: { tenantId: payload.tenantId, clientId: payload.clientId },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.notificationsRepository.find({
        where: { tenantId: payload.tenantId, clientId: payload.clientId },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      ]);

    if (!client || !company) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    return {
      client: this.serializeClient(client),
      company: {
        id: company.id,
        name: company.name,
        subdomain: company.subdomain,
        logoUrl: company.logoUrl,
        logoAltText: company.logoAltText,
      },
      documents: {
        proposals: proposals.map((proposal) => ({
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          totalAmount: proposal.totalAmount,
          createdAt: proposal.createdAt,
          approvalStatus: proposal.approvalStatus,
          aadhaarDocumentAttached: proposal.aadhaarDocumentAttached,
        })),
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          total: invoice.total,
          dueDate: invoice.dueDate,
        })),
      },
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        invoiceId: notification.invoiceId,
        proposalId: notification.proposalId,
        amount: notification.amount,
        dueDate: notification.dueDate,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      })),
    };
  }

  async markNotificationRead(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<{ read: true }> {
    await this.notificationsRepository.update(
      {
        id,
        tenantId: payload.tenantId,
        clientId: payload.clientId,
      },
      { readAt: new Date() },
    );

    return { read: true };
  }

  async getProposal(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<PortalProposalDetail> {
    return this.serializeProposalWithAadhaar(
      await this.findScopedProposal(id, payload),
    );
  }

  async getProposalPdf(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<Buffer> {
    const proposal = await this.findScopedProposal(id, payload);
    const { client, tenant, settings } = await this.getPdfParties(payload);

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

  async approveProposal(
    id: string,
    payload: PortalTokenPayload,
    body: PortalSignatureBody = {},
  ): Promise<PortalProposalDetail & { message: string }> {
    const proposal = await this.findScopedProposal(id, payload);
    const aadhaarDocument = await this.findActiveAadhaarDocument(proposal);

    if (!aadhaarDocument) {
      throw new BadRequestException(
        'Aadhaar document required before approval.',
      );
    }

    const signature = body.signatureData?.trim();
    const method = this.normalizeSignatureMethod(body.signatureMethod);
    const acceptedAt = new Date();

    if (signature) {
      proposal.signatureData = signature;
      proposal.signatureIp = 'client-portal';
      proposal.signedAt = proposal.signedAt ?? acceptedAt;
      proposal.signatureMethod = method;
    }

    proposal.status = ProposalStatus.APPROVED;
    proposal.approvalStatus = ProposalApprovalStatus.APPROVED;
    proposal.aadhaarDocumentAttached = true;
    proposal.approvedByClientId = payload.clientId;
    proposal.approvedAt = acceptedAt;
    proposal.auditTrail = this.appendAudit(proposal, {
      event: 'CLIENT_ACCEPTED',
      actor: payload.email,
      ip: 'client-portal',
      metadata: {
        clientId: payload.clientId,
        acceptedAt: acceptedAt.toISOString(),
        signatureCaptured: Boolean(signature),
        signatureMethod: signature ? method : proposal.signatureMethod,
      },
    });
    aadhaarDocument.status = ProposalApprovalDocumentStatus.APPROVED;

    const saved = await this.proposalsRepository.save(proposal);
    await this.approvalDocumentsRepository.save(aadhaarDocument);
    await this.logAudit(
      proposal,
      'PROPOSAL_APPROVED_WITH_AADHAAR_DOCUMENT',
      payload,
    );

    return {
      ...this.serializeProposal(saved),
      aadhaarDocument: this.serializeAadhaarDocument(aadhaarDocument),
      message:
        'Proposal approved successfully. Aadhaar document attached privately.',
    };
  }

  async uploadAadhaarDocument(
    id: string,
    payload: PortalTokenPayload,
    file: Express.Multer.File | undefined,
  ): Promise<{ message: string; aadhaarDocument: PortalAadhaarDocument }> {
    const proposal = await this.findScopedProposal(id, payload);

    if (proposal.approvalStatus === ProposalApprovalStatus.APPROVED) {
      throw new BadRequestException(
        'Approved proposal documents cannot be changed.',
      );
    }

    if (!file) {
      throw new BadRequestException('Aadhaar document is required.');
    }

    this.validateAadhaarDocument(file);
    await mkdir(this.aadhaarUploadRoot, { recursive: true });

    const activeDocument = await this.findActiveAadhaarDocument(proposal);
    if (activeDocument) {
      activeDocument.status = ProposalApprovalDocumentStatus.REMOVED;
      await this.approvalDocumentsRepository.save(activeDocument);
      await this.deletePrivateFile(activeDocument.privateFilePath);
    }

    const privateFilePath = join(
      this.aadhaarUploadRoot,
      `${proposal.tenantId}-${proposal.clientId}-${proposal.id}-${Date.now()}-${randomUUID()}${this.safeAadhaarExtension(file)}.enc`,
    );
    await writeFile(privateFilePath, this.encryptBuffer(file.buffer));

    const document = await this.approvalDocumentsRepository.save(
      this.approvalDocumentsRepository.create({
        companyId: proposal.tenantId,
        clientId: proposal.clientId,
        proposalId: proposal.id,
        documentType: 'aadhaar',
        fileName: this.safeFileName(file.originalname),
        fileMimeType: file.mimetype,
        fileSize: file.size,
        privateFilePath,
        uploadedBy: payload.clientId,
        uploadedAt: new Date(),
        status: ProposalApprovalDocumentStatus.UPLOADED,
        isVisibleToClient: true,
        isVisibleToCompany: false,
      }),
    );

    proposal.aadhaarDocumentAttached = true;
    proposal.approvalStatus =
      proposal.approvalStatus ?? ProposalApprovalStatus.PENDING;
    proposal.auditTrail = this.appendAudit(proposal, {
      event: 'AADHAAR_DOCUMENT_UPLOADED',
      actor: payload.email,
      ip: 'client-portal',
      metadata: {
        clientId: payload.clientId,
        documentId: document.id,
      },
    });
    await this.proposalsRepository.save(proposal);
    await this.logAudit(proposal, 'AADHAAR_DOCUMENT_UPLOADED', payload);

    return {
      message: 'Aadhaar document uploaded successfully.',
      aadhaarDocument: this.serializeAadhaarDocument(document)!,
    };
  }

  async previewAadhaarDocument(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<AadhaarPreview> {
    const proposal = await this.findScopedProposal(id, payload);
    const document = await this.findActiveAadhaarDocument(proposal);

    if (!document || !existsSync(document.privateFilePath)) {
      throw new BadRequestException('Aadhaar document is unavailable.');
    }

    return {
      buffer: this.decryptBuffer(await readFile(document.privateFilePath)),
      fileName: document.fileName,
      fileMimeType: document.fileMimeType,
      fileSize: document.fileSize,
    };
  }

  async removeAadhaarDocument(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<{ message: string; aadhaarDocument: null }> {
    const proposal = await this.findScopedProposal(id, payload);

    if (proposal.approvalStatus === ProposalApprovalStatus.APPROVED) {
      throw new BadRequestException(
        'Approved proposal documents cannot be changed.',
      );
    }

    const document = await this.findActiveAadhaarDocument(proposal);
    if (!document) {
      throw new BadRequestException('No Aadhaar document is uploaded.');
    }

    document.status = ProposalApprovalDocumentStatus.REMOVED;
    await this.approvalDocumentsRepository.save(document);
    await this.deletePrivateFile(document.privateFilePath);

    proposal.aadhaarDocumentAttached = false;
    proposal.auditTrail = this.appendAudit(proposal, {
      event: 'AADHAAR_DOCUMENT_REMOVED',
      actor: payload.email,
      ip: 'client-portal',
      metadata: {
        clientId: payload.clientId,
        documentId: document.id,
      },
    });
    await this.proposalsRepository.save(proposal);
    await this.logAudit(proposal, 'AADHAAR_DOCUMENT_REMOVED', payload);

    return {
      message: 'Aadhaar document removed.',
      aadhaarDocument: null,
    };
  }

  async requestProposalChanges(
    id: string,
    payload: PortalTokenPayload,
    message?: string,
  ): Promise<PortalProposalDetail & { message: string }> {
    const proposal = await this.findScopedProposal(id, payload);
    const requestMessage = message?.trim();

    proposal.status = ProposalStatus.CHANGES_REQUESTED;

    if (requestMessage) {
      const stamp = new Date().toISOString();
      const entry = `[${stamp}] Client requested changes: ${requestMessage}`;
      proposal.notes = proposal.notes ? `${proposal.notes}\n\n${entry}` : entry;
    }
    proposal.auditTrail = this.appendAudit(proposal, {
      event: 'CLIENT_REQUESTED_CHANGES',
      actor: payload.email,
      ip: 'client-portal',
      metadata: {
        clientId: payload.clientId,
        message: requestMessage ?? '',
      },
    });

    const saved = await this.proposalsRepository.save(proposal);

    return {
      ...this.serializeProposal(saved),
      message: 'Change request sent successfully.',
    };
  }

  async signProposal(
    id: string,
    payload: PortalTokenPayload,
    body: PortalSignatureBody = {},
  ): Promise<PortalProposalDetail & { message: string }> {
    const proposal = await this.findScopedProposal(id, payload);
    const signedAt = new Date();
    const method = this.normalizeSignatureMethod(body.signatureMethod);

    proposal.status = ProposalStatus.SIGNED;
    proposal.signedAt = signedAt;
    proposal.signatureData =
      body.signatureData?.trim() || proposal.signatureData;
    proposal.signatureIp = 'client-portal';
    proposal.signatureMethod = method;

    proposal.auditTrail = this.appendAudit(proposal, {
      event: 'CLIENT_SIGNED',
      actor: payload.email,
      ip: 'client-portal',
      metadata: {
        clientId: payload.clientId,
        method,
        signedAt: signedAt.toISOString(),
      },
    });

    const saved = await this.proposalsRepository.save(proposal);

    return {
      ...this.serializeProposal(saved),
      message: 'Proposal signed successfully.',
    };
  }

  async getInvoice(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<PortalInvoiceDetail> {
    const invoice = await this.invoicesRepository.findOne({
      where: {
        id,
        tenantId: payload.tenantId,
        clientId: payload.clientId,
      },
    });

    if (!invoice) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      lineItems: invoice.lineItems,
      subtotal: invoice.subtotal,
      totalTax: invoice.totalTax,
      total: invoice.total,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      terms: invoice.terms,
    };
  }

  async getInvoicePdf(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<Buffer> {
    const invoice = await this.findScopedInvoice(id, payload);
    const { client, tenant, settings } = await this.getPdfParties(payload);

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

  async getGstWorkspace(
    payload: PortalTokenPayload,
  ): Promise<PortalGstWorkspace> {
    const [client, settings, invoices] = await Promise.all([
      this.clientsRepository.findOne({
        where: { id: payload.clientId, tenantId: payload.tenantId },
      }),
      this.businessSettingsRepository.findOne({
        where: { tenantId: payload.tenantId },
      }),
      this.invoicesRepository.find({
        where: { tenantId: payload.tenantId, clientId: payload.clientId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    if (!client) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    return {
      company: {
        gstin: settings?.gstin ?? null,
        state: settings?.sellerState ?? null,
        taxSystem: settings?.taxSystem ?? null,
      },
      client: {
        gstin: client.gstin,
        state: client.state,
      },
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        dueDate: invoice.dueDate,
        total: invoice.total,
        totalTax: invoice.totalTax,
        lineItems: invoice.lineItems,
      })),
    };
  }

  async requestGstCorrection(
    id: string,
    payload: PortalTokenPayload,
    message?: string,
  ): Promise<{ message: string; invoiceId: string }> {
    const invoice = await this.findScopedInvoice(id, payload);
    const requestMessage = message?.trim();

    if (!requestMessage) {
      throw new BadRequestException('Correction message is required.');
    }

    const stamp = new Date().toISOString();
    const entry = `[${stamp}] Client GST correction request: ${requestMessage}`;
    invoice.notes = invoice.notes ? `${invoice.notes}\n\n${entry}` : entry;

    await this.invoicesRepository.save(invoice);

    return {
      message: 'GST correction request sent successfully.',
      invoiceId: invoice.id,
    };
  }

  private assertRateLimit(key: string): void {
    const now = Date.now();
    const recent = (this.requests.get(key) ?? []).filter(
      (timestamp) => now - timestamp < this.rateLimitWindowMs,
    );

    if (recent.length >= this.rateLimitMax) {
      throw new HttpException(
        'Please wait before requesting another OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.requests.set(key, recent);
  }

  private normalizeEmail(value?: string): string {
    const email = value?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Please enter your email.');
    }

    return email;
  }

  private serializeClient(client: Client) {
    return {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      isPasswordCreated: client.isPasswordCreated,
      passwordStatus: client.isPasswordCreated
        ? 'Password Created'
        : 'Password Not Created',
    };
  }

  private signPortalClient(client: Client, email: string, message: string) {
    const payload: PortalTokenPayload = {
      sub: client.id,
      clientId: client.id,
      email,
      tenantId: client.tenantId,
      type: 'client_portal',
    };

    return {
      message,
      access_token: this.jwtService.sign(payload, { expiresIn: '12h' }),
      client: this.serializeClient(client),
      company: {
        id: client.tenantId,
      },
    };
  }

  private async findScopedProposal(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<Proposal> {
    const proposal = await this.proposalsRepository.findOne({
      where: {
        id,
        tenantId: payload.tenantId,
        clientId: payload.clientId,
      },
    });

    if (!proposal) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    return proposal;
  }

  private async findScopedInvoice(
    id: string,
    payload: PortalTokenPayload,
  ): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: {
        id,
        tenantId: payload.tenantId,
        clientId: payload.clientId,
      },
    });

    if (!invoice) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    return invoice;
  }

  private async getPdfParties(payload: PortalTokenPayload): Promise<{
    client: Client | null;
    tenant: Tenant | null;
    settings: BusinessSettings | null;
  }> {
    const [client, tenant, settings] = await Promise.all([
      this.clientsRepository.findOne({
        where: { id: payload.clientId, tenantId: payload.tenantId },
      }),
      this.tenantsRepository.findOne({ where: { id: payload.tenantId } }),
      this.businessSettingsRepository.findOne({
        where: { tenantId: payload.tenantId },
      }),
    ]);

    return { client, tenant, settings };
  }

  private serializeProposal(proposal: Proposal): PortalProposalDetail {
    return {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      blocks: proposal.blocks,
      totalAmount: proposal.totalAmount,
      validUntil: proposal.validUntil,
      signedAt: proposal.signedAt,
      signatureData: proposal.signatureData,
      signatureIp: proposal.signatureIp,
      signatureMethod: proposal.signatureMethod,
      aadhaarEsignStatus: proposal.aadhaarEsignStatus,
      aadhaarEsignReference: proposal.aadhaarEsignReference,
      aadhaarEsignRequestedAt: proposal.aadhaarEsignRequestedAt,
      aadhaarEsignCompletedAt: proposal.aadhaarEsignCompletedAt,
      approvalStatus: proposal.approvalStatus,
      aadhaarDocumentAttached: proposal.aadhaarDocumentAttached,
      approvedByClientId: proposal.approvedByClientId,
      approvedAt: proposal.approvedAt,
      aadhaarDocument: null,
      auditTrail: proposal.auditTrail ?? [],
      notes: proposal.notes,
      terms: proposal.terms,
    };
  }

  private async serializeProposalWithAadhaar(
    proposal: Proposal,
  ): Promise<PortalProposalDetail> {
    return {
      ...this.serializeProposal(proposal),
      aadhaarDocument: this.serializeAadhaarDocument(
        await this.findActiveAadhaarDocument(proposal),
      ),
    };
  }

  private serializeAadhaarDocument(
    document: ProposalApprovalDocument | null,
  ): PortalAadhaarDocument | null {
    if (!document) return null;

    return {
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      fileMimeType: document.fileMimeType,
      fileSize: document.fileSize,
      uploadedAt: document.uploadedAt,
      status: document.status,
    };
  }

  private async findActiveAadhaarDocument(
    proposal: Proposal,
  ): Promise<ProposalApprovalDocument | null> {
    return this.approvalDocumentsRepository.findOne({
      where: {
        companyId: proposal.tenantId,
        clientId: proposal.clientId,
        proposalId: proposal.id,
        documentType: 'aadhaar',
        isVisibleToClient: true,
        status:
          proposal.approvalStatus === ProposalApprovalStatus.APPROVED
            ? ProposalApprovalDocumentStatus.APPROVED
            : ProposalApprovalDocumentStatus.UPLOADED,
      },
      order: { uploadedAt: 'DESC' },
    });
  }

  private validateAadhaarDocument(file: Express.Multer.File): void {
    if (!this.aadhaarMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Upload PDF, JPG, JPEG, or PNG.',
      );
    }

    if (file.size > this.aadhaarMaxBytes) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    const extension = extname(file.originalname).toLowerCase();
    const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException(
        'Invalid file type. Upload PDF, JPG, JPEG, or PNG.',
      );
    }
  }

  private safeAadhaarExtension(file: Express.Multer.File): string {
    if (file.mimetype === 'application/pdf') return '.pdf';
    if (file.mimetype === 'image/png') return '.png';
    return extname(file.originalname).toLowerCase() === '.jpeg'
      ? '.jpeg'
      : '.jpg';
  }

  private safeFileName(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 240) || 'document';
  }

  private encryptBuffer(buffer: Buffer): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
  }

  private decryptBuffer(buffer: Buffer): Buffer {
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  private encryptionKey(): Buffer {
    return createHash('sha256')
      .update(
        process.env.AADHAAR_DOCUMENT_ENCRYPTION_KEY ??
          process.env.JWT_SECRET ??
          'dev-insecure-secret',
      )
      .digest();
  }

  private async deletePrivateFile(privateFilePath: string): Promise<void> {
    const root = normalize(this.aadhaarUploadRoot);
    const target = normalize(privateFilePath);
    if (target.startsWith(root) && existsSync(target)) {
      await unlink(target).catch(() => undefined);
    }
  }

  private async logAudit(
    proposal: Proposal,
    action: string,
    payload: PortalTokenPayload,
  ): Promise<void> {
    await this.activityLogsRepository.save(
      this.activityLogsRepository.create({
        tenantId: proposal.tenantId,
        entityType: 'proposal',
        entityId: proposal.id,
        action,
        userId: payload.clientId,
        metadata: {
          companyId: proposal.tenantId,
          clientId: proposal.clientId,
          proposalId: proposal.id,
          performedBy: payload.email,
          performedRole: 'client',
          ipAddress: 'client-portal',
          userAgent: 'client-portal',
        },
      }),
    );
  }

  private normalizeSignatureMethod(method?: string): string {
    return method === 'DRAWN' ? 'DRAWN' : 'DRAWN';
  }

  private appendAudit(
    proposal: Proposal,
    entry: {
      event: string;
      actor: string;
      ip?: string | null;
      metadata?: Record<string, unknown>;
    },
  ) {
    return [
      ...(proposal.auditTrail ?? []),
      {
        id: randomUUID(),
        event: entry.event,
        actor: entry.actor,
        at: new Date().toISOString(),
        ip: entry.ip ?? null,
        metadata: entry.metadata ?? {},
      },
    ];
  }

  private async findClientForPortal(
    email: string,
    companyId?: string,
  ): Promise<Client> {
    const tenantId = companyId?.trim();

    if (tenantId) {
      const client = await this.clientsRepository.findOne({
        where: { tenantId, email },
      });

      if (!client) {
        throw new UnauthorizedException('Please enter valid credentials.');
      }

      return client;
    }

    const matches = await this.clientsRepository.find({
      where: { email },
      take: 2,
      order: { createdAt: 'DESC' },
    });

    if (matches.length !== 1) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    return matches[0];
  }

  private async findClientForPortalWithPassword(
    email: string,
    companyId?: string,
  ): Promise<Client> {
    const tenantId = companyId?.trim();
    let query = this.clientsRepository
      .createQueryBuilder('client')
      .addSelect('client.passwordHash')
      .addSelect('client.resetPasswordTokenHash')
      .where('client.email = :email', { email });

    if (tenantId) {
      query = query.andWhere('client.tenantId = :tenantId', { tenantId });
    }

    const matches = await query
      .orderBy('client.createdAt', 'DESC')
      .take(2)
      .getMany();

    if (matches.length > 1 && !tenantId) {
      throw new BadRequestException(
        'This email is linked to multiple companies. Please enter the Company ID.',
      );
    }

    if (matches.length !== 1) {
      throw new UnauthorizedException(
        'Invalid credentials or client not registered.',
      );
    }

    return matches[0];
  }

  private assertPasswordsMatch(
    password?: string,
    confirmPassword?: string,
  ): void {
    if (!password || !confirmPassword || password !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password must match.',
      );
    }
  }

  private async safeComparePassword(
    password: string,
    passwordHash?: string | null,
  ): Promise<boolean> {
    if (!password || !passwordHash) return false;

    try {
      return await bcrypt.compare(password, passwordHash);
    } catch {
      return false;
    }
  }

  private assertStrongPassword(password: string): void {
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      throw new BadRequestException(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
      );
    }
  }

  private createResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashResetToken(token?: string): string {
    if (!token?.trim()) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    return createHash('sha256').update(token.trim()).digest('hex');
  }

  private buildFrontendUrl(path: string): string {
    const base =
      process.env.FRONTEND_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000';
    return `${base.replace(/\/$/, '')}${path}`;
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

  private async ensureDueReminderNotifications(
    tenantId: string,
    clientId: string,
  ): Promise<void> {
    const now = new Date();
    const reminderUntil = new Date(now);
    reminderUntil.setDate(reminderUntil.getDate() + 3);

    const invoices = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.clientId = :clientId', { clientId })
      .andWhere('invoice.status != :paid', { paid: InvoiceStatus.PAID })
      .andWhere('invoice.dueDate <= :reminderUntil', { reminderUntil })
      .getMany();

    await Promise.all(
      invoices.map(async (invoice) => {
        const dueDate = new Date(invoice.dueDate);
        if (Number.isNaN(dueDate.getTime())) return;

        const dueDateLabel = dueDate.toISOString().slice(0, 10);
        const isOverdue = dueDate.getTime() < now.getTime();
        const notificationType = isOverdue
          ? ClientNotificationType.PAYMENT_OVERDUE
          : ClientNotificationType.PAYMENT_REMINDER;
        const existing = await this.notificationsRepository.findOne({
          where: {
            tenantId,
            clientId,
            invoiceId: invoice.id,
            type: notificationType,
          },
        });

        if (existing) return;

        await this.notificationsRepository.save(
          this.notificationsRepository.create({
            tenantId,
            clientId,
            type: notificationType,
            title: isOverdue
              ? `Payment overdue for ${invoice.invoiceNumber}`
              : `Payment reminder for ${invoice.invoiceNumber}`,
            message: isOverdue
              ? `Payment of ${Number(invoice.total).toFixed(2)} was due on ${dueDateLabel}.`
              : `Payment of ${Number(invoice.total).toFixed(2)} is due on ${dueDateLabel}.`,
            invoiceId: invoice.id,
            proposalId: null,
            amount: Number(invoice.total),
            dueDate,
            metadata: { source: 'portal_due_check' },
          }),
        );

        await this.khataRepository.save(
          this.khataRepository.create({
            tenantId,
            clientId,
            type: KhataEntryType.REMINDER_SENT,
            amount: Number(invoice.total),
            outstandingAmount: Number(invoice.total),
            dueDate,
            notes: `Automatic payment reminder for invoice ${invoice.invoiceNumber}.`,
            reminderSettings: {
              invoiceId: invoice.id,
              source: 'portal_due_check',
            },
          }),
        );
      }),
    );
  }
}
