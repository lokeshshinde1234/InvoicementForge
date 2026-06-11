import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { createTransport } from 'nodemailer';
import { join, normalize } from 'path';

@Injectable()
export class PortalMailService {
  private readonly logger = new Logger(PortalMailService.name);

  async sendOtp({
    email,
    otp,
    companyName,
    clientName,
    expiresInMinutes,
  }: {
    email: string;
    otp: string;
    companyName: string;
    clientName: string;
    expiresInMinutes: number;
  }): Promise<{ delivered: boolean; mode: 'smtp' | 'log' }> {
    const safeCompanyName = this.escapeHtml(companyName);
    const safeClientName = this.escapeHtml(clientName);
    const from = process.env.SMTP_FROM ?? process.env.MAIL_FROM;
    const host = process.env.SMTP_HOST ?? process.env.MAIL_HOST;
    const port = Number(process.env.SMTP_PORT ?? process.env.MAIL_PORT ?? 587);
    const user = process.env.SMTP_USER ?? process.env.MAIL_USER;
    const pass = process.env.SMTP_PASS ?? process.env.MAIL_PASS;

    if (!host || !from) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          'SMTP is not configured. Client portal OTP email cannot be delivered.',
        );
      }

      this.logger.warn(
        `SMTP is not configured. ${companyName} client portal OTP for ${email}: ${otp}`,
      );
      return { delivered: false, mode: 'log' };
    }

    const transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: `${companyName} client portal OTP`,
      text: [
        `Hi ${clientName},`,
        '',
        `Your ${companyName} client portal OTP is ${otp}.`,
        `It expires in ${expiresInMinutes} minutes.`,
        '',
        'If you did not request it, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <p>Hi ${safeClientName},</p>
          <p>Your <strong>${safeCompanyName}</strong> client portal OTP is:</p>
          <p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p>
          <p>This code expires in ${expiresInMinutes} minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
    });

    return { delivered: true, mode: 'smtp' };
  }

  async sendPasswordResetLink({
    email,
    resetUrl,
    accountName,
    subject,
    expiresInMinutes,
    logoUrl,
    logoAltText,
  }: {
    email: string;
    resetUrl: string;
    accountName: string;
    subject: string;
    expiresInMinutes: number;
    logoUrl?: string | null;
    logoAltText?: string | null;
  }): Promise<{ delivered: boolean; mode: 'smtp' | 'log' }> {
    const safeAccountName = this.escapeHtml(accountName);
    const safeResetUrl = this.escapeHtml(resetUrl);
    const logo = this.resolveEmailLogo(logoUrl);
    const safeLogoUrl = logo.src ? this.escapeHtml(logo.src) : '';
    const safeLogoAltText = this.escapeHtml(
      logoAltText || `${accountName} logo`,
    );
    const safeHeading = this.escapeHtml(subject);
    const from = process.env.SMTP_FROM ?? process.env.MAIL_FROM;
    const host = process.env.SMTP_HOST ?? process.env.MAIL_HOST;
    const port = Number(process.env.SMTP_PORT ?? process.env.MAIL_PORT ?? 587);
    const user = process.env.SMTP_USER ?? process.env.MAIL_USER;
    const pass = process.env.SMTP_PASS ?? process.env.MAIL_PASS;

    if (!host || !from) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          'SMTP is not configured. Password reset email cannot be delivered.',
        );
      }

      this.logger.warn(
        `SMTP is not configured. ${accountName} password reset link for ${email}: ${resetUrl}`,
      );
      return { delivered: false, mode: 'log' };
    }

    const transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from,
      to: email,
      subject,
      attachments: logo.attachment ? [logo.attachment] : undefined,
      text: [
        `Hi ${accountName},`,
        '',
        `Use this secure link to reset your password: ${resetUrl}`,
        `This link expires in ${expiresInMinutes} minutes and can be used only once.`,
        '',
        'If you did not request it, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid #e2e8f0">
            ${
              safeLogoUrl
                ? `<img src="${safeLogoUrl}" alt="${safeLogoAltText}" style="width:56px;height:56px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;padding:4px;background:#fff" />`
                : ''
            }
            <div>
              <p style="margin:0;color:#0f766e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Password reset</p>
              <h1 style="margin:4px 0 0;font-size:20px;line-height:1.25;color:#0f172a">${safeHeading}</h1>
            </div>
          </div>
          <p>Hi ${safeAccountName},</p>
          <p>Use the secure link below to reset your password.</p>
          <p><a href="${safeResetUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">Reset password</a></p>
          <p>This link expires in ${expiresInMinutes} minutes and can be used only once.</p>
          <p>If the button does not work, paste this URL into your browser:<br>${safeResetUrl}</p>
        </div>
      `,
    });

    return { delivered: true, mode: 'smtp' };
  }

  async sendInvoiceNotification({
    email,
    clientName,
    companyName,
    invoiceNumber,
    total,
    currency,
    dueDate,
    portalUrl,
  }: {
    email: string;
    clientName: string;
    companyName: string;
    invoiceNumber: string;
    total: number | string;
    currency: string;
    dueDate: string | Date;
    portalUrl: string;
  }): Promise<{ delivered: boolean; mode: 'smtp' | 'log' }> {
    const safeClientName = this.escapeHtml(clientName);
    const safeCompanyName = this.escapeHtml(companyName);
    const safeInvoiceNumber = this.escapeHtml(invoiceNumber);
    const safePortalUrl = this.escapeHtml(portalUrl);
    const formattedDueDate = this.formatDate(dueDate);
    const amount = Number(total);
    const formattedTotal = Number.isFinite(amount)
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        }).format(amount)
      : `${currency} ${String(total)}`;
    const from = process.env.SMTP_FROM ?? process.env.MAIL_FROM;
    const host = process.env.SMTP_HOST ?? process.env.MAIL_HOST;
    const port = Number(process.env.SMTP_PORT ?? process.env.MAIL_PORT ?? 587);
    const user = process.env.SMTP_USER ?? process.env.MAIL_USER;
    const pass = process.env.SMTP_PASS ?? process.env.MAIL_PASS;

    if (!host || !from) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          'SMTP is not configured. Invoice email cannot be delivered.',
        );
      }

      this.logger.warn(
        `SMTP is not configured. ${companyName} invoice ${invoiceNumber} for ${email}: ${portalUrl}`,
      );
      return { delivered: false, mode: 'log' };
    }

    const transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: `${companyName} invoice ${invoiceNumber}`,
      text: [
        `Hi ${clientName},`,
        '',
        `${companyName} has sent invoice ${invoiceNumber} for ${formattedTotal}.`,
        `Payment due date: ${formattedDueDate}.`,
        `Log in to your client portal to view, download, or pay it: ${portalUrl}`,
        '',
        'If you have questions, please contact the company directly.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <p>Hi ${safeClientName},</p>
          <p><strong>${safeCompanyName}</strong> has sent invoice <strong>${safeInvoiceNumber}</strong> for <strong>${this.escapeHtml(formattedTotal)}</strong>.</p>
          <p><strong>Payment due date:</strong> ${this.escapeHtml(formattedDueDate)}</p>
          <p><a href="${safePortalUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">Open client portal</a></p>
          <p>If the button does not work, paste this URL into your browser:<br>${safePortalUrl}</p>
        </div>
      `,
    });

    return { delivered: true, mode: 'smtp' };
  }

  private formatDate(value: string | Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private resolveEmailLogo(logoUrl?: string | null): {
    src: string | null;
    attachment?: {
      filename: string;
      path: string;
      cid: string;
    };
  } {
    if (!logoUrl) {
      return { src: null };
    }

    const uploadPath = this.extractUploadPath(logoUrl);

    if (uploadPath) {
      const absolutePath = normalize(join(process.cwd(), uploadPath));
      const uploadsRoot = normalize(join(process.cwd(), 'uploads'));

      if (absolutePath.startsWith(uploadsRoot) && existsSync(absolutePath)) {
        const cid = `company-logo-${Date.now()}@invoiceforge`;
        return {
          src: `cid:${cid}`,
          attachment: {
            filename: absolutePath.split(/[\\/]/).at(-1) ?? 'company-logo',
            path: absolutePath,
            cid,
          },
        };
      }
    }

    return { src: logoUrl };
  }

  private extractUploadPath(logoUrl: string): string | null {
    if (logoUrl.startsWith('/uploads/')) {
      return logoUrl.slice(1);
    }

    try {
      const parsed = new URL(logoUrl);
      return parsed.pathname.startsWith('/uploads/')
        ? parsed.pathname.slice(1)
        : null;
    } catch {
      return null;
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
