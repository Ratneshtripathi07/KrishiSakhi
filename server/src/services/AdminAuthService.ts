// server/src/services/AdminAuthService.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { signToken } from '../config/jwt';

import { env } from '../config/environment';

function emailDomainAllowed(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  const allowed = env.ADMIN_ALLOWED_DOMAINS.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(domain);
}

export class AdminAuthService {
  async loginWithPassword(email: string, password: string) {
    if (!emailDomainAllowed(email)) {
      throw Object.assign(new Error('Email domain not allowed'), { status: 403 });
    }
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const token = signToken({ sub: String(admin.id), role: 'admin' });
    return { token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } };
  }

  async loginWithOtp(email: string, otp: string) {
    // Only for hackathon demo admin
    if (!env.ADMIN_DEMO_EMAIL) {
      throw Object.assign(new Error('OTP login not enabled'), { status: 400 });
    }
    if (email.toLowerCase() !== env.ADMIN_DEMO_EMAIL.toLowerCase()) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    if (otp !== env.ADMIN_DEMO_OTP) {
      throw Object.assign(new Error('Invalid OTP'), { status: 401 });
    }
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const token = signToken({ sub: String(admin.id), role: 'admin' });
    return { token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } };
  }
}
