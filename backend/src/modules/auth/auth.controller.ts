import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { signToken } from './jwt';
import * as authService from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as { email?: unknown; password?: unknown; name?: unknown };
  const { user } = await authService.register(body.email, body.password, body.name);
  const accessToken = signToken({ sub: user.id, email: user.email });
  res.status(201).json({
    ok: true,
    user,
    accessToken,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as { email?: unknown; password?: unknown };
  const { user } = await authService.login(body.email, body.password);
  const accessToken = signToken({ sub: user.id, email: user.email });
  res.status(200).json({
    ok: true,
    user,
    accessToken,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  // `requireAuth` гарантирует `req.user`
  const userId = req.user!.userId;
  const { user } = await authService.getMe(userId);
  res.status(200).json({ ok: true, user });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(204).send();
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const body = req.body as { currentPassword?: unknown; newPassword?: unknown };
  await authService.changePassword(userId, body.currentPassword, body.newPassword);
  res.status(200).json({ ok: true });
}
