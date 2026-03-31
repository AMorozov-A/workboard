import path from 'node:path';

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const defaultPort = 3001;

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? defaultPort),
  /** Путь к корню backend/ (для логов и т.п.) */
  BACKEND_ROOT: path.resolve(__dirname, '../..'),
  DATABASE_URL: requireEnv('DATABASE_URL', 'file:./dev.db'),
  JWT_SECRET: requireEnv('JWT_SECRET', 'dev-only-secret-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
};
