import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureDemoWorkspace } from '../src/modules/auth/demoSeed';
import { DEMO_CREDENTIALS } from '../src/modules/auth/demoCredentials';

const prisma = new PrismaClient();

async function main() {
  const existingDemo = await prisma.user.findUnique({
    where: { email: DEMO_CREDENTIALS.email },
    select: { id: true },
  });

  const userId = existingDemo?.id
    ? existingDemo.id
    : (
        await prisma.user.create({
          data: {
            email: DEMO_CREDENTIALS.email,
            passwordHash: await bcrypt.hash(DEMO_CREDENTIALS.password, 10),
            name: DEMO_CREDENTIALS.name,
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
