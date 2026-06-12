import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync } from 'fs';
import {
  createTransport,
  type SentMessageInfo,
  type SendMailOptions,
} from 'nodemailer';
import { join, normalize } from 'path';

type SmtpSettings = {
  from: string;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  url?: string;
};

type EmailSettings =
  | ({ provider: 'smtp' } & SmtpSettings)
  | {
      provider: 'resend';
      apiKey: string;
      from: string;
    };

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
    const settings = this.readEmailSettings(
      'Client portal OTP email cannot be delivered.',
      `${companyName} client portal OTP for ${email}: ${otp}`,
    );

    if (!settings) return { delivered: false, mode: 'log' };

    await this.sendSmtpMail(settings, {
      from: settings.from,
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
    const settings = this.readEmailSettings(
      'Password reset email cannot be delivered.',
      `${accountName} password reset link for ${email}: ${resetUrl}`,
    );

    if (!settings) return { delivered: false, mode: 'log' };

    await this.sendSmtpMail(settings, {
      from: settings.from,
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
    const settings = this.readEmailSettings(
      'Invoice email cannot be delivered.',
      `${companyName} invoice ${invoiceNumber} for ${email}: ${portalUrl}`,
    );

    if (!settings) return { delivered: false, mode: 'log' };

    await this.sendSmtpMail(settings, {
      from: settings.from,
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

  private createSmtpTransport(settings: SmtpSettings) {
    if (settings.url) {
      return createTransport(settings.url);
    }

    const { host, port, user, pass } = settings;
    const service = process.env.SMTP_SERVICE ?? process.env.MAIL_SERVICE;
    const secure = this.readBoolean(
      process.env.SMTP_SECURE ?? process.env.MAIL_SECURE,
    );
    const ignoreTLS = this.readBoolean(
      process.env.SMTP_IGNORE_TLS ?? process.env.MAIL_IGNORE_TLS,
    );
    const requireTLS = this.readBoolean(
      process.env.SMTP_REQUIRE_TLS ?? process.env.MAIL_REQUIRE_TLS,
    );
    const rejectUnauthorized = this.readBoolean(
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED ??
        process.env.MAIL_TLS_REJECT_UNAUTHORIZED,
    );

    return createTransport({
      service,
      host,
      port: port ?? 587,
      secure: secure ?? port === 465,
      ignoreTLS,
      requireTLS,
      auth: user && pass ? { user, pass } : undefined,
      name: process.env.SMTP_NAME ?? process.env.MAIL_NAME,
      connectionTimeout: Number(
        process.env.SMTP_CONNECTION_TIMEOUT_MS ?? 10000,
      ),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? 10000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? 20000),
      tls:
        rejectUnauthorized === undefined
          ? undefined
          : { rejectUnauthorized },
    });
  }

  private readEmailSettings(
    productionError: string,
    logFallbackMessage: string,
  ): EmailSettings | null {
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const url =
      process.env.SMTP_URL ??
      process.env.MAIL_URL ??
      process.env.EMAIL_SERVER ??
      process.env.EMAIL_SERVER_URL;
    const from =
      process.env.SMTP_FROM ??
      process.env.MAIL_FROM ??
      process.env.EMAIL_FROM ??
      process.env.MAIL_FROM_ADDRESS ??
      process.env.SENDER_EMAIL ??
      process.env.RESEND_FROM ??
      process.env.SMTP_USER ??
      process.env.MAIL_USER ??
      process.env.EMAIL_SERVER_USER;
    const host =
      process.env.SMTP_HOST ??
      process.env.MAIL_HOST ??
      process.env.EMAIL_HOST ??
      process.env.EMAIL_SERVER_HOST;
    const port = Number(
      process.env.SMTP_PORT ??
        process.env.MAIL_PORT ??
        process.env.EMAIL_PORT ??
        process.env.EMAIL_SERVER_PORT ??
        587,
    );
    const user =
      process.env.SMTP_USER ??
      process.env.MAIL_USER ??
      process.env.EMAIL_USER ??
      process.env.EMAIL_SERVER_USER;
    const pass =
      process.env.SMTP_PASS ??
      process.env.MAIL_PASS ??
      process.env.EMAIL_PASS ??
      process.env.SMTP_PASSWORD ??
      process.env.MAIL_PASSWORD ??
      process.env.EMAIL_SERVER_PASSWORD;

    if (resendApiKey && from) {
      return { provider: 'resend', apiKey: resendApiKey, from };
    }

    if (!from || (!url && (!host || !Number.isFinite(port)))) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          `Email provider is not configured. ${productionError}`,
        );
      }

      this.logger.warn(
        `Email provider is not configured. ${logFallbackMessage}`,
      );
      return null;
    }

    return { provider: 'smtp', from, host, port, user, pass, url };
  }

  private async sendSmtpMail(
    settings: EmailSettings,
    mail: SendMailOptions,
  ): Promise<void> {
    if (settings.provider === 'resend') {
      await this.sendResendMail(settings, mail);
      return;
    }

    const transporter = this.createSmtpTransport(settings);

    try {
      await transporter.verify();
      const info = (await transporter.sendMail({
        ...mail,
        envelope: this.createEnvelope(settings, mail),
      })) as SentMessageInfo;
      this.logger.log(
        `SMTP email accepted for ${String(mail.to)} (${info.messageId ?? 'no-message-id'}).`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: unknown }).code)
          : 'SMTP_ERROR';

      this.logger.error(
        `SMTP delivery failed for ${String(mail.to)} [${code}]: ${message}`,
      );
      throw new ServiceUnavailableException(
        'Email could not be delivered right now. Please verify SMTP settings and try again.',
      );
    } finally {
      transporter.close();
    }
  }

  private async sendResendMail(
    settings: Extract<EmailSettings, { provider: 'resend' }>,
    mail: SendMailOptions,
  ): Promise<void> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: settings.from,
          to: this.normalizeEnvelopeRecipients(mail.to),
          subject: mail.subject,
          html: typeof mail.html === 'string' ? mail.html : undefined,
          text: typeof mail.text === 'string' ? mail.text : undefined,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { id?: string; message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          body?.message ?? body?.error ?? `Resend HTTP ${response.status}`,
        );
      }

      this.logger.log(
        `Resend email accepted for ${String(mail.to)} (${body?.id ?? 'no-message-id'}).`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Resend error';
      this.logger.error(
        `Resend delivery failed for ${String(mail.to)}: ${message}`,
      );
      throw new ServiceUnavailableException(
        'Email could not be delivered right now. Please verify email provider settings and try again.',
      );
    }
  }

  private createEnvelope(settings: SmtpSettings, mail: SendMailOptions) {
    const from = this.extractEmailAddress(settings.from) ?? settings.user;
    const to = this.normalizeEnvelopeRecipients(mail.to);

    if (!from || to.length === 0) return undefined;

    return {
      from,
      to,
    };
  }

  private normalizeEnvelopeRecipients(value: SendMailOptions['to']): string[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];

    return values
      .map((item) =>
        typeof item === 'string'
          ? this.extractEmailAddress(item)
          : this.extractEmailAddress(item.address),
      )
      .filter((item): item is string => Boolean(item));
  }

  private extractEmailAddress(value?: string): string | undefined {
    const match = value?.match(/<([^>]+)>/);
    return (match?.[1] ?? value)?.trim() || undefined;
  }

  private readBoolean(value?: string): boolean | undefined {
    if (!value) return undefined;

    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

    return undefined;
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
