import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import type { PublicUser } from './user.types';

const BCRYPT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertEmail(email: unknown): string {
  if (typeof email !== 'string' || !EMAIL_RE.test(normalizeEmail(email))) {
    throw new HttpError(400, 'Укажите корректный email');
  }
  return normalizeEmail(email);
}

function assertPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(400, `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов`);
  }
  return password;
}

function assertLoginPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'Укажите пароль');
  }
  return password;
}

function parseName(name: unknown): string | undefined {
  if (name === undefined || name === null) {
    return undefined;
  }
  if (typeof name !== 'string') {
    throw new HttpError(400, 'Поле name должно быть строкой');
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
      throw new HttpError(409, 'Этот email уже зарегистрирован');
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
    throw new HttpError(401, 'Неверный email или пароль');
  }

  const match = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!match) {
    throw new HttpError(401, 'Неверный email или пароль');
  }

  return { user: toPublicUser(user) };
}

export async function getMe(userId: string): Promise<{ user: PublicUser }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new HttpError(404, 'Пользователь не найден');
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
    throw new HttpError(404, 'Пользователь не найден');
  }

  const match = await bcrypt.compare(current, user.passwordHash);
  if (!match) {
    throw new HttpError(401, 'Неверный текущий пароль');
  }

  const passwordHash = await bcrypt.hash(nextPlain, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
