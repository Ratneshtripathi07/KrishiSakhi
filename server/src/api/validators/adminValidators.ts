// server/src/api/validators/adminValidators.ts
import { z } from 'zod';

export const adminLoginSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    otp: z.string().min(4).max(8).optional(),
  })
  .refine((data) => !!data.password || !!data.otp, {
    message: 'Provide either password or OTP',
    path: ['password'],
  });

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
