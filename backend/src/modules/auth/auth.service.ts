import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import type { PublicUser } from './user.types';
import { ensureDemoWorkspace } from './demoSeed';
import { DEMO_CREDENTIALS } from './demoCredentials';

const BCRYPT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertEmail(email: unknown): string {
  if (typeof email !== 'string' || !EMAIL_RE.test(normalizeEmail(email))) {
    throw new HttpError(400, 'Please provide a valid email');
  }
  return normalizeEmail(email);
}

function assertPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  return password;
}

function assertLoginPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'Please provide a password');
  }
  return password;
}

function parseName(name: unknown): string | undefined {
  if (name === undefined || name === null) {
    return undefined;
  }
  if (typeof name !== 'string') {
    throw new HttpError(400, 'Field "name" must be a string');
  }
  const t = name.trim();
  return t.length === 0 ? undefined : t;
}

function toPublicUser(row: {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function register(
  email: unknown,
  password: unknown,
  name?: unknown,
): Promise<{ user: PublicUser }> {
  const normalizedEmail = assertEmail(email);
  const plainPassword = assertPassword(password);
  const displayName = parseName(name);

  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  try {
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: displayName ?? null,
      },
    });
    return { user: toPublicUser(created) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new HttpError(409, 'Email is already registered');
    }
    throw e;
  }
}

export async function login(email: unknown, password: unknown): Promise<{ user: PublicUser }> {
  const normalizedEmail = assertEmail(email);
  const plainPassword = assertLoginPassword(password);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const match = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!match) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return { user: toPublicUser(user) };
}

export async function getMe(userId: string): Promise<{ user: PublicUser }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return { user: toPublicUser(user) };
}

export async function changePassword(
  userId: string,
  currentPassword: unknown,
  newPassword: unknown,
): Promise<void> {
  const current = assertLoginPassword(currentPassword);
  const nextPlain = assertPassword(newPassword);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const match = await bcrypt.compare(current, user.passwordHash);
  if (!match) {
    throw new HttpError(401, 'Invalid current password');
  }

  const passwordHash = await bcrypt.hash(nextPlain, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function ensureDemoUser(): Promise<{ email: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_CREDENTIALS.email },
    select: { id: true },
  });

  const userId = existing?.id
    ? existing.id
    : (
        await prisma.user.create({
          data: {
            email: DEMO_CREDENTIALS.email,
            passwordHash: await bcrypt.hash(DEMO_CREDENTIALS.password, BCRYPT_ROUNDS),
            name: DEMO_CREDENTIALS.name,
          },
          select: { id: true },
        })
      ).id;

  await ensureDemoWorkspace(prisma, userId);

  return { email: DEMO_CREDENTIALS.email };
}
