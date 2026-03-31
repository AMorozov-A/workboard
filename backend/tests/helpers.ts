import bcrypt from 'bcryptjs';
import supertest from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';
import { signToken } from '../src/modules/auth/jwt';
import type { PublicUser } from '../src/modules/auth/user.types';

export { prisma };

export function getTestApp(): supertest.SuperTest<supertest.Test> {
  return supertest(createApp());
}

const BCRYPT_ROUNDS = 10;

export async function createTestUser(data?: {
  email?: string;
  password?: string;
  name?: string | null;
}): Promise<{ user: PublicUser; accessToken: string }> {
  const email = data?.email ?? `test-${Date.now()}@example.com`;
  const password = data?.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const row = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: data?.name ?? 'Test User',
    },
  });
  const user: PublicUser = {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  const accessToken = signToken({ sub: row.id, email: row.email });
  return { user, accessToken };
}
