import type { RequestHandler } from 'express';
import { verifyToken } from './jwt';

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, message: 'Требуется авторизация' });
    return;
  }
  const raw = header.slice('Bearer '.length).trim();
  if (!raw) {
    res.status(401).json({ ok: false, message: 'Требуется авторизация' });
    return;
  }
  try {
    const payload = verifyToken(raw);
    req.user = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ ok: false, message: 'Недействительный или просроченный токен' });
  }
};
