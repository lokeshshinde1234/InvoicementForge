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
    'SMTP_HOST',
    'SMTP_FROM',
    'SUPERADMIN_EMAIL',
    'SUPERADMIN_PASSWORD',
  );
}

const missing = required.filter((k) => !process.env[k]);
if (missing.length === 0) {
  console.log('All required env vars present.');
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    console.warn(
      'Warning: SMTP_HOST and SMTP_FROM are not configured. OTP emails will only be logged outside production.',
    );
  }
  process.exit(0);
}

console.error('Missing required environment variables:');
missing.forEach((k) => console.error('  -', k));
console.error('\nPlease create a .env file or set these vars in your environment before starting the server.');
process.exit(1);
