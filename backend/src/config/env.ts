import path from 'node:path';

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const defaultPort = 3001;

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error('PORT must be a valid number');
  }
  return parsed;
}

export const env = {
  NODE_ENV: nodeEnv,
  PORT: parsePort(process.env.PORT, defaultPort),
  BACKEND_ROOT: path.resolve(__dirname, '../..'),
  DATABASE_URL: requireEnv('DATABASE_URL', 'file:./dev.db'),
  JWT_SECRET: requireEnv(
    'JWT_SECRET',
    isProduction ? undefined : 'dev-only-secret-change-in-production-min-32-chars',
  ),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
};
