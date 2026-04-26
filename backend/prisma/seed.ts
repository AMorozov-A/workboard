import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureDemoWorkspace } from '../src/modules/auth/demoSeed';

const prisma = new PrismaClient();

async function main() {
  const existingDemo = await prisma.user.findUnique({
    where: { email: 'demo@workboard.app' },
    select: { id: true },
  });

  const userId = existingDemo?.id
    ? existingDemo.id
    : (
        await prisma.user.create({
          data: {
            email: 'demo@workboard.app',
            passwordHash: await bcrypt.hash('demo123', 10),
            name: 'Demo User',
          },
          select: { id: true },
        })
      ).id;

  await ensureDemoWorkspace(prisma, userId);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
