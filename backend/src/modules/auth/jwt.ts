import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export interface TokenPayload {
  /** subject — id пользователя */
  sub: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(
    { sub: payload.sub, email: payload.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as SignOptions,
  );
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & {
    email?: string;
  };
  const userId = decoded.sub;
  const email = decoded.email;
  if (typeof userId !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: userId, email };
}
