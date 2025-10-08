// server/src/api/controllers/AuthController.ts
// Request handlers for authentication endpoints.

import { Request, Response } from 'express';
import { requestOtpSchema, loginSchema, signupSchema, passwordLoginSchema } from '../../api/validators/authValidators';
import { AuthService } from '../../services/AuthService';

const authService = new AuthService();

export class AuthController {
  static async signup(req: Request, res: Response) {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { name, phoneNumber, password, email } = parsed.data;
    try {
      const { token, user } = await authService.signup(name, phoneNumber, password, email);
      return res.status(201).json({ token, user: { id: user.id, phone_number: user.phone_number, name: user.name, email: user.email, language_preference: user.language_preference } });
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Signup failed' });
    }
  }

  static async requestOtp(req: Request, res: Response) {
    const parsed = requestOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { phoneNumber } = parsed.data;

    await authService.requestOtp(phoneNumber);
    return res.status(200).json({ success: true, message: 'OTP sent if the number is valid' });
  }

  static async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { phoneNumber, otp } = parsed.data;

    try {
      const { token, user } = await authService.login(phoneNumber, otp);
      return res.status(200).json({ token, user: { id: user.id, phone_number: user.phone_number, name: user.name, language_preference: user.language_preference } });
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Login failed' });
    }
  }

  static async loginWithPassword(req: Request, res: Response) {
    const parsed = passwordLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { phoneNumber, email, password } = parsed.data;
    try {
      const { token, user } = await authService.loginWithPassword({ phoneNumber, email, password });
      return res.status(200).json({ token, user: { id: user.id, phone_number: user.phone_number, name: user.name, email: user.email, language_preference: user.language_preference } });
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Login failed' });
    }
  }
}
