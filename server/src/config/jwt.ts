// server/src/config/jwt.ts
// JWT signing and verification helpers with sensible defaults.

import jwt from 'jsonwebtoken';
import { env } from './environment';

export type JwtPayload = {
  sub: string; // principal id
  phone?: string; // for farmer users
  role?: 'admin' | 'user'; // principal role
  demo?: boolean;
};

export function signToken(payload: JwtPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  // Cast options to satisfy jsonwebtoken type overloads
  const opts = { expiresIn } as jwt.SignOptions;
  return jwt.sign(payload as object, env.JWT_SECRET as jwt.Secret, opts);
}

export function verifyToken<T = JwtPayload>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}
