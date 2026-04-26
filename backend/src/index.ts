import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/client';
import { logger } from './shared/logger';

async function main(): Promise<void> {
  await prisma.$connect();
  logger.info('Prisma connected');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info('Server listening', { url: `http://localhost:${env.PORT}` });
    logger.info('Health check', { url: `http://localhost:${env.PORT}/api/v1/ping` });
  });

  const shutdown = async (signal: string) => {
    logger.info('Shutdown signal received', { signal });
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});
