/**
 * Пользователь в БД (Prisma User). passwordHash не отдаём клиенту.
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Ответ API без секретных полей. */
export type PublicUser = Omit<User, 'passwordHash'>;
