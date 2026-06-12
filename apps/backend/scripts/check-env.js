#!/usr/bin/env node
/* eslint-disable no-console */
const { existsSync } = require('fs');
const { resolve } = require('path');
// load env similar to load-env
const dotenv = require('dotenv');

const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/backend/.env'),
];
const envPath = candidates.find((p) => existsSync(p));
dotenv.config(envPath ? { path: envPath } : undefined);

const required = [
  'JWT_SECRET',
  'DATABASE_URL',
  'FRONTEND_URL',
];

if (process.env.NODE_ENV === 'production') {
  required.push(
    'SUPERADMIN_EMAIL',
    'SUPERADMIN_PASSWORD',
  );
}

const missing = required.filter((k) => !process.env[k]);
const hasSmtpHost = Boolean(
  process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    process.env.EMAIL_HOST ||
    process.env.EMAIL_SERVER_HOST,
);
const hasSmtpUrl = Boolean(
  process.env.SMTP_URL ||
    process.env.MAIL_URL ||
    process.env.EMAIL_SERVER ||
    process.env.EMAIL_SERVER_URL,
);
const hasMailFrom = Boolean(
  process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SENDER_EMAIL ||
    process.env.RESEND_FROM,
);
const hasResend = Boolean(process.env.RESEND_API_KEY && hasMailFrom);
if (process.env.NODE_ENV === 'production') {
  if (!hasMailFrom) missing.push('SMTP_FROM, EMAIL_FROM, or RESEND_FROM');
  if (!hasResend && !hasSmtpHost && !hasSmtpUrl) {
    missing.push('SMTP_HOST, SMTP_URL, or RESEND_API_KEY');
  }
}
if (missing.length === 0) {
  console.log('All required env vars present.');
  if (!hasMailFrom || (!hasResend && !hasSmtpHost && !hasSmtpUrl)) {
    console.warn(
      'Warning: Email is not fully configured. Set RESEND_API_KEY plus RESEND_FROM, or set SMTP_FROM plus SMTP_HOST/SMTP_URL.',
    );
  }
  const smtpPort =
    process.env.SMTP_PORT ??
    process.env.MAIL_PORT ??
    process.env.EMAIL_PORT ??
    process.env.EMAIL_SERVER_PORT;
  if (smtpPort && !Number.isFinite(Number(smtpPort))) {
    console.error('SMTP port must be a number.');
    process.exit(1);
  }
  process.exit(0);
}

console.error('Missing required environment variables:');
missing.forEach((k) => console.error('  -', k));
console.error('\nPlease create a .env file or set these vars in your environment before starting the server.');
process.exit(1);
