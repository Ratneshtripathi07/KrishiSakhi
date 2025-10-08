// server/src/api/controllers/AlertsController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export class AlertsController {
  static async me(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid user id' });

      const alerts = await prisma.alert.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 100,
      });
      return res.json({ alerts });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load alerts' });
    }
  }
}