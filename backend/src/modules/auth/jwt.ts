import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export interface TokenPayload {
  sub: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN };
  return jwt.sign(
    { sub: payload.sub, email: payload.email },
    env.JWT_SECRET,
    options,
  );
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }

  const payload = decoded as jwt.JwtPayload & Record<string, unknown>;
  const userId = payload.sub;
  const email = payload.email;

  if (typeof userId !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }

  return { sub: userId, email };
}
