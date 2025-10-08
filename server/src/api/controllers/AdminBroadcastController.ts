// server/src/api/controllers/AdminBroadcastController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const broadcastSchema = z.object({
  // Optional location filters
  state: z.string().optional(),
  city: z.string().optional(),
  constituency: z.string().optional(),
  // Optional i18n key and required message
  title_key: z.string().optional(),
  message: z.string().min(5),
});

export class AdminBroadcastController {
  static async broadcast(req: Request, res: Response) {
    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const { message, title_key, state, city, constituency } = parsed.data;

    // Build user filter based on provided location fields
    const where: any = {};
    if (state) where.state = state;
    if (city) where.city = city;
    if (constituency) where.constituency = constituency;

    const users = await prisma.user.findMany({ select: { id: true }, where });
    if (users.length === 0) {
      return res.json({ delivered: 0 });
    }

    const alerts = await prisma.$transaction(
      users.map((u) =>
        prisma.alert.create({
          data: {
            user_id: u.id,
            alert_type: 'broadcast',
            content_key: title_key || 'ADMIN_BROADCAST',
            content_text: message,
          },
        }),
      ),
    );

    return res.json({ delivered: alerts.length });
  }
}
