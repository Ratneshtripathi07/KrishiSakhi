// server/src/api/controllers/UserPublicController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const userPublicSchema = z.object({
  name: z.string().min(1),
  phone_number: z.string().regex(/^\+?\d{10,15}$/),
  pin_code: z.string().length(6).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  constituency: z.string().optional(),
  gram_panchayat: z.string().optional(),
});

export class UserPublicController {
  static async submit(req: Request, res: Response) {
    const parsed = userPublicSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const data = parsed.data;

    // Upsert user by phone_number and update location fields
    const user = await prisma.user.upsert({
      where: { phone_number: data.phone_number },
      update: {
        name: data.name,
        pin_code: data.pin_code,
        city: data.city,
        state: data.state,
        constituency: data.constituency,
        gram_panchayat: data.gram_panchayat,
      },
      create: {
        phone_number: data.phone_number,
        name: data.name,
        pin_code: data.pin_code,
        city: data.city,
        state: data.state,
        constituency: data.constituency,
        gram_panchayat: data.gram_panchayat,
      },
      select: { id: true, phone_number: true },
    });

    return res.status(201).json({ success: true, user });
  }
}
