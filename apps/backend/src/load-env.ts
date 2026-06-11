import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/backend/.env'),
];

const envPath = candidates.find((candidate) => existsSync(candidate));

config(envPath ? { path: envPath } : undefined);
