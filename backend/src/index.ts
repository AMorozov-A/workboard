import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './db/client';

async function main(): Promise<void> {
  await prisma.$connect();
  console.log('[db] Prisma connected');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT}`);
    console.log(`[server] Health: GET http://localhost:${env.PORT}/api/v1/ping`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[db] Prisma disconnected');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] Fatal error', err);
  process.exit(1);
});
