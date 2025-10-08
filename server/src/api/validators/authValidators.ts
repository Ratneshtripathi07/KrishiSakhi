// server/src/api/validators/authValidators.ts
// Zod schemas for validating auth-related requests.

import { z } from 'zod';

export const requestOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'Enter a valid phone number with country code'),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'Enter a valid phone number with country code'),
  otp: z.string().min(4).max(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Password-based login: either phoneNumber or email must be provided, along with password
export const passwordLoginSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'Enter a valid phone number with country code')
    .optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
}).refine((data) => !!data.phoneNumber || !!data.email, {
  message: 'Provide either phoneNumber or email',
  path: ['phoneNumber'],
});

export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

// Signup: name, phoneNumber, password, optional email
export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  phoneNumber: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'Enter a valid phone number with country code'),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

export type SignupInput = z.infer<typeof signupSchema>;
