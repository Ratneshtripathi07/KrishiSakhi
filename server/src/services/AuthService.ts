// server/src/services/AuthService.ts
// Handles OTP generation/verification and JWT issuance.

import dayjs from 'dayjs';
import { prisma } from '../config/database';
import { env } from '../config/environment';
import { signToken } from '../config/jwt';
import { SMSService } from './SMSService';
import bcrypt from 'bcryptjs';

function generateOtp(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class AuthService {
  private sms: SMSService;

  constructor() {
    this.sms = new SMSService();
  }

  async signup(name: string, phoneNumber: string, password: string, email?: string): Promise<{ token: string; user: any }>{
    // Ensure phone/email uniqueness
    const exists = await prisma.user.findFirst({ where: { OR: [ { phone_number: phoneNumber }, email ? { email } : undefined ].filter(Boolean) as any } });
    if (exists) {
      throw Object.assign(new Error('User already exists'), { status: 409 });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, phone_number: phoneNumber, email, password_hash } });
    const token = signToken({ sub: String(user.id), phone: user.phone_number });
    return { token, user };
  }

  async loginWithPassword({ phoneNumber, email, password }: { phoneNumber?: string; email?: string; password: string }): Promise<{ token: string; user: any }>{
    const user = await prisma.user.findFirst({ where: { OR: [ phoneNumber ? { phone_number: phoneNumber } : undefined, email ? { email } : undefined ].filter(Boolean) as any } });
    if (!user || !user.password_hash) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const token = signToken({ sub: String(user.id), phone: user.phone_number });
    return { token, user };
  }

  async requestOtp(phoneNumber: string): Promise<{ success: boolean }>{
    const otp = generateOtp();
    const expiresAt = dayjs().add(5, 'minute').toDate();

    // Upsert user and store OTP
    await prisma.user.upsert({
      where: { phone_number: phoneNumber },
      update: {
        otp_code: otp,
        otp_expires_at: expiresAt,
      },
      create: {
        phone_number: phoneNumber,
        otp_code: otp,
        otp_expires_at: expiresAt,
      },
    });

    await this.sms.sendOTP(phoneNumber, otp);

    return { success: true };
  }

  async login(phoneNumber: string, otp: string): Promise<{ token: string; user: any }>{
    if (env.DEMO_MODE && otp === '000000') {
      // Demo login flow, create/find user without verifying stored OTP
      const user = await prisma.user.upsert({
        where: { phone_number: phoneNumber },
        update: {},
        create: { phone_number: phoneNumber, name: 'Demo User', language_preference: 'ml' },
      });
      const token = signToken({ sub: String(user.id), phone: user.phone_number, demo: true });
      return { token, user };
    }

    const user = await prisma.user.findUnique({ where: { phone_number: phoneNumber } });
    if (!user || !user.otp_code || !user.otp_expires_at) {
      throw Object.assign(new Error('OTP not requested'), { status: 400 });
    }

    const now = new Date();
    if (user.otp_code !== otp || user.otp_expires_at < now) {
      throw Object.assign(new Error('Invalid or expired OTP'), { status: 401 });
    }

    // Clear OTP and issue JWT
    const updated = await prisma.user.update({
      where: { phone_number: phoneNumber },
      data: { otp_code: null, otp_expires_at: null },
    });

    const token = signToken({ sub: String(updated.id), phone: updated.phone_number });
    return { token, user: updated };
  }
}
