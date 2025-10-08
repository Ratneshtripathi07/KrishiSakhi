// server/src/api/controllers/UsersMeController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export class UsersMeController {
  static async me(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid user id' });

      const profile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone_number: true,
          name: true,
          language_preference: true,
          state: true,
          city: true,
          constituency: true,
          pin_code: true,
          created_at: true,
        },
      });
      if (!profile) return res.status(404).json({ error: 'User not found' });
      return res.json({ user: profile });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load profile' });
    }
  }
}