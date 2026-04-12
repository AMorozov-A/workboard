import { describe, expect, it, vi } from 'vitest';
import { prisma } from '../../db/client';
import { HttpError } from '../../shared/http-error';
import * as authService from './auth.service';

describe('auth.service.register', () => {
  const uniqueEmail = (label: string) =>
    `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  it('нормализует email: trim и lower case', async () => {
    const { user } = await authService.register('  User@EXAMPLE.com ', 'password12');
    expect(user.email).toBe('user@example.com');
  });

  it('пустое имя после trim даёт name null', async () => {
    const { user } = await authService.register(uniqueEmail('emptyname'), 'password12', '   ');
    expect(user.name).toBeNull();
  });

  it('без name в аргументах — name null', async () => {
    const { user } = await authService.register(uniqueEmail('noname'), 'password12');
    expect(user.name).toBeNull();
  });

  it('throws HttpError 409 when email is already registered', async () => {
    const email = uniqueEmail('dup');
    await authService.register(email, 'password12');
    await expect(authService.register(email, 'password12')).rejects.toSatisfy((err: unknown) => {
      return err instanceof HttpError && err.statusCode === 409;
    });
  });

  it('rethrows unexpected errors from prisma.user.create (non-P2002)', async () => {
    const spy = vi.spyOn(prisma.user, 'create').mockRejectedValueOnce(new Error('database unavailable'));
    const email = uniqueEmail('dbfail');
    await expect(authService.register(email, 'password12')).rejects.toThrow(/database unavailable/i);
    spy.mockRestore();
  });
});
