// server/src/api/controllers/AdminAuthController.ts
import { Request, Response } from 'express';
import { adminLoginSchema } from '../validators/adminValidators';
import { AdminAuthService } from '../../services/AdminAuthService';

const service = new AdminAuthService();

export class AdminAuthController {
  static async login(req: Request, res: Response) {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }
    const { email, password, otp } = parsed.data;

    try {
      if (otp) {
        const { token, admin } = await service.loginWithOtp(email, otp);
        return res.status(200).json({ token, admin });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      const { token, admin } = await service.loginWithPassword(email, password);
      return res.status(200).json({ token, admin });
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Login failed' });
    }
  }
}
