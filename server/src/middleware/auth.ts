// server/src/middleware/auth.ts
// JWT authentication middleware to protect API routes.

import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../config/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyToken(token);
    // Attach to request for downstream handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}
