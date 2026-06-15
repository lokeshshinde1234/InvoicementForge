import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

type TwilioSmsSettings = {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  fromNumber?: string;
  messagingServiceSid?: string;
};

export type SmsDelivery = {
  delivered: boolean;
  mode: 'twilio' | 'log';
};

@Injectable()
export class PortalSmsService {
  private readonly logger = new Logger(PortalSmsService.name);

  async sendOtp({
    phone,
    otp,
    companyName,
    expiresInMinutes,
  }: {
    phone?: string | null;
    otp: string;
    companyName: string;
    expiresInMinutes: number;
  }): Promise<SmsDelivery> {
    return this.sendSms({
      phone,
      body: `${companyName} client portal OTP: ${otp}. It expires in ${expiresInMinutes} minutes.`,
      logFallbackMessage: `${companyName} client portal OTP for ${phone ?? 'missing phone'}: ${otp}`,
    });
  }

  async sendPasswordResetLink({
    phone,
    resetUrl,
    accountName,
    expiresInMinutes,
  }: {
    phone?: string | null;
    resetUrl: string;
    accountName: string;
    expiresInMinutes: number;
  }): Promise<SmsDelivery> {
    return this.sendSms({
      phone,
      body: `${accountName} password reset link: ${resetUrl} This link expires in ${expiresInMinutes} minutes.`,
      logFallbackMessage: `${accountName} password reset link for ${phone ?? 'missing phone'}: ${resetUrl}`,
    });
  }

  private async sendSms({
    phone,
    body,
    logFallbackMessage,
  }: {
    phone?: string | null;
    body: string;
    logFallbackMessage: string;
  }): Promise<SmsDelivery> {
    const settings = this.readTwilioSettings();
    const to = this.normalizePhone(phone);

    if (!settings || !to) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn(
          !to
            ? 'Twilio SMS skipped because recipient phone is missing or invalid.'
            : 'Twilio SMS skipped because provider is not fully configured.',
        );
      } else {
        this.logger.warn(`SMS provider is not configured. ${logFallbackMessage}`);
      }

      return { delivered: false, mode: 'log' };
    }

    const form = new URLSearchParams({
      To: to,
      Body: body,
    });

    if (settings.messagingServiceSid) {
      form.set('MessagingServiceSid', settings.messagingServiceSid);
    } else if (settings.fromNumber) {
      form.set('From', settings.fromNumber);
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${settings.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${settings.apiKeySid}:${settings.apiKeySecret}`,
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form,
        },
      );
      const responseBody = (await response.json().catch(() => null)) as
        | { sid?: string; message?: string; code?: number }
        | null;

      if (!response.ok) {
        throw new Error(
          responseBody?.message ??
            `Twilio HTTP ${response.status}${responseBody?.code ? ` (${responseBody.code})` : ''}`,
        );
      }

      this.logger.log(
        `Twilio SMS accepted for ${to} (${responseBody?.sid ?? 'no-message-sid'}).`,
      );
      return { delivered: true, mode: 'twilio' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Twilio SMS error';
      this.logger.error(`Twilio SMS delivery failed for ${to}: ${message}`);
      throw new ServiceUnavailableException(
        'SMS could not be delivered right now. Please verify Twilio credentials and sender settings.',
      );
    }
  }

  private readTwilioSettings(): TwilioSmsSettings | null {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const apiKeySid = (
      process.env.TWILIO_API_KEY_SID ?? process.env.TWILIO_API_KEY
    )?.trim();
    const apiKeySecret = (
      process.env.TWILIO_API_KEY_SECRET ?? process.env.TWILIO_API_SECRET
    )?.trim();
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
    const messagingServiceSid =
      process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

    if (
      !accountSid ||
      !apiKeySid ||
      !apiKeySecret ||
      (!fromNumber && !messagingServiceSid)
    ) {
      return null;
    }

    return {
      accountSid,
      apiKeySid,
      apiKeySecret,
      fromNumber,
      messagingServiceSid,
    };
  }

  private normalizePhone(phone?: string | null): string | null {
    const trimmed = phone?.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('+')) return trimmed.replace(/[^\d+]/g, '');

    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return null;

    const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE ?? '+91';
    return `${defaultCountryCode}${digits}`.replace(/[^\d+]/g, '');
  }
}
