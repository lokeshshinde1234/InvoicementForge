import { Controller, Get } from '@nestjs/common';
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
}
