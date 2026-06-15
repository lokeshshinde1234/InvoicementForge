import { Controller, Get } from '@nestjs/common';
import { getDefaultResultOrder } from 'dns';
import { createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'invoiceforge-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/email')
  emailHealth(): {
    status: 'ready' | 'missing';
    provider: 'resend' | 'sendgrid' | 'smtp' | 'none';
    fromConfigured: boolean;
    hostConfigured: boolean;
    urlConfigured: boolean;
    resendConfigured: boolean;
    sendGridConfigured: boolean;
    smtpPort: number | null;
    smtpSecure: boolean | null;
    required: string[];
  } {
    const fromConfigured = Boolean(
      process.env.SMTP_FROM ||
        process.env.MAIL_FROM ||
        process.env.EMAIL_FROM ||
        process.env.MAIL_FROM_ADDRESS ||
        process.env.SENDER_EMAIL ||
        process.env.RESEND_FROM ||
        process.env.SENDGRID_FROM,
    );
    const hostConfigured = Boolean(
      process.env.SMTP_HOST ||
        process.env.MAIL_HOST ||
        process.env.EMAIL_HOST ||
        process.env.EMAIL_SERVER_HOST,
    );
    const urlConfigured = Boolean(
      process.env.SMTP_URL ||
        process.env.MAIL_URL ||
        process.env.EMAIL_SERVER ||
        process.env.EMAIL_SERVER_URL,
    );
    const resendConfigured = Boolean(process.env.RESEND_API_KEY);
    const sendGridConfigured = Boolean(
      process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY,
    );
    const smtpPortValue =
      process.env.SMTP_PORT ??
      process.env.MAIL_PORT ??
      process.env.EMAIL_PORT ??
      process.env.EMAIL_SERVER_PORT;
    const smtpPort = smtpPortValue ? Number(smtpPortValue) : null;
    const smtpSecureValue = process.env.SMTP_SECURE ?? process.env.MAIL_SECURE;
    const smtpSecure =
      smtpSecureValue === undefined
        ? smtpPort === 465
        : ['1', 'true', 'yes', 'on'].includes(
            smtpSecureValue.trim().toLowerCase(),
          );
    const provider =
      resendConfigured && fromConfigured
        ? 'resend'
        : sendGridConfigured && fromConfigured
          ? 'sendgrid'
          : fromConfigured && (hostConfigured || urlConfigured)
            ? 'smtp'
            : 'none';

    return {
      status: provider === 'none' ? 'missing' : 'ready',
      provider,
      fromConfigured,
      hostConfigured,
      urlConfigured,
      resendConfigured,
      sendGridConfigured,
      smtpPort: Number.isFinite(smtpPort) ? smtpPort : null,
      smtpSecure,
      required:
        provider === 'none'
          ? [
              'RESEND_API_KEY + RESEND_FROM',
              'or SENDGRID_API_KEY + SENDGRID_FROM',
              'or SMTP_HOST/SMTP_URL + SMTP_FROM',
            ]
          : [],
    };
  }

  @Get('health/email/verify')
  async emailVerify(): Promise<{
    status: 'ready' | 'error' | 'missing';
    provider: 'smtp' | 'none';
    dnsResultOrder: string;
    smtpHostConfigured: boolean;
    smtpPort: number | null;
    smtpSecure: boolean;
    smtpUserConfigured: boolean;
    smtpFromConfigured: boolean;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const smtp = this.readSmtpHealthSettings();

    if (!smtp.host || !smtp.from) {
      return {
        status: 'missing',
        provider: 'none',
        dnsResultOrder: getDefaultResultOrder(),
        smtpHostConfigured: Boolean(smtp.host),
        smtpPort: smtp.port,
        smtpSecure: smtp.secure,
        smtpUserConfigured: Boolean(smtp.user),
        smtpFromConfigured: Boolean(smtp.from),
      };
    }

    const transporter = createTransport({
      host: smtp.host,
      port: smtp.port ?? 587,
      secure: smtp.secure,
      auth: smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS ?? 10000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? 10000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? 20000),
    } satisfies SMTPTransport.Options);

    try {
      await transporter.verify();

      return {
        status: 'ready',
        provider: 'smtp',
        dnsResultOrder: getDefaultResultOrder(),
        smtpHostConfigured: true,
        smtpPort: smtp.port,
        smtpSecure: smtp.secure,
        smtpUserConfigured: Boolean(smtp.user),
        smtpFromConfigured: true,
      };
    } catch (error) {
      return {
        status: 'error',
        provider: 'smtp',
        dnsResultOrder: getDefaultResultOrder(),
        smtpHostConfigured: true,
        smtpPort: smtp.port,
        smtpSecure: smtp.secure,
        smtpUserConfigured: Boolean(smtp.user),
        smtpFromConfigured: true,
        errorCode: this.readErrorCode(error),
        errorMessage: this.readSafeErrorMessage(error),
      };
    } finally {
      transporter.close();
    }
  }

  @Get('health/sms')
  smsHealth(): {
    status: 'ready' | 'missing';
    provider: 'twilio' | 'none';
    accountSidConfigured: boolean;
    apiKeySidConfigured: boolean;
    apiKeySecretConfigured: boolean;
    senderConfigured: boolean;
    ownerResetRecipientConfigured: boolean;
    required: string[];
  } {
    const accountSidConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID);
    const apiKeySidConfigured = Boolean(
      process.env.TWILIO_API_KEY_SID || process.env.TWILIO_API_KEY,
    );
    const apiKeySecretConfigured = Boolean(
      process.env.TWILIO_API_KEY_SECRET || process.env.TWILIO_API_SECRET,
    );
    const senderConfigured = Boolean(
      process.env.TWILIO_FROM_NUMBER ||
        process.env.TWILIO_MESSAGING_SERVICE_SID,
    );
    const ownerResetRecipientConfigured = Boolean(
      process.env.TWILIO_OWNER_PASSWORD_RESET_TO ||
        process.env.TWILIO_PASSWORD_RESET_TO,
    );
    const ready =
      accountSidConfigured &&
      apiKeySidConfigured &&
      apiKeySecretConfigured &&
      senderConfigured;

    return {
      status: ready ? 'ready' : 'missing',
      provider: ready ? 'twilio' : 'none',
      accountSidConfigured,
      apiKeySidConfigured,
      apiKeySecretConfigured,
      senderConfigured,
      ownerResetRecipientConfigured,
      required: ready
        ? []
        : [
            'TWILIO_ACCOUNT_SID',
            'TWILIO_API_KEY_SID',
            'TWILIO_API_KEY_SECRET',
            'TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID',
          ],
    };
  }

  private readSmtpHealthSettings(): {
    host?: string;
    port: number | null;
    secure: boolean;
    user?: string;
    pass?: string;
    from?: string;
  } {
    const port = Number(
      process.env.SMTP_PORT ??
        process.env.MAIL_PORT ??
        process.env.EMAIL_PORT ??
        process.env.EMAIL_SERVER_PORT ??
        587,
    );
    const secureValue = process.env.SMTP_SECURE ?? process.env.MAIL_SECURE;

    return {
      host:
        process.env.SMTP_HOST ??
        process.env.MAIL_HOST ??
        process.env.EMAIL_HOST ??
        process.env.EMAIL_SERVER_HOST,
      port: Number.isFinite(port) ? port : null,
      secure:
        secureValue === undefined
          ? port === 465
          : ['1', 'true', 'yes', 'on'].includes(
              secureValue.trim().toLowerCase(),
            ),
      user:
        process.env.SMTP_USER ??
        process.env.MAIL_USER ??
        process.env.EMAIL_USER ??
        process.env.EMAIL_SERVER_USER,
      pass:
        process.env.SMTP_PASS ??
        process.env.MAIL_PASS ??
        process.env.EMAIL_PASS ??
        process.env.SMTP_PASSWORD ??
        process.env.MAIL_PASSWORD ??
        process.env.EMAIL_SERVER_PASSWORD,
      from:
        process.env.SMTP_FROM ??
        process.env.MAIL_FROM ??
        process.env.EMAIL_FROM ??
        process.env.MAIL_FROM_ADDRESS ??
        process.env.SENDER_EMAIL,
    };
  }

  private readErrorCode(error: unknown): string {
    return typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : 'SMTP_ERROR';
  }

  private readSafeErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error';

    return message.replace(
      /(AUTH PLAIN\s+)[A-Za-z0-9+/=]+/gi,
      '$1[redacted]',
    );
  }
}
