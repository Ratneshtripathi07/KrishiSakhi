// server/src/api/controllers/AdminAnalyticsController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export class AdminAnalyticsController {
  static async weeklyIssues(_req: Request, res: Response) {
    // For hackathon: return a simple aggregation of Activities by activity_type in the last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await prisma.activity.groupBy({
      by: ['activity_type'],
      _count: { _all: true },
      where: { date: { gte: since } },
    });
    return res.json({ since: since.toISOString(), issues: rows.map(r => ({ type: r.activity_type, count: (r as any)._count._all })) });
  }

  static async stats(_req: Request, res: Response) {
    const userCount = await prisma.user.count();
    const farmCount = await prisma.farm.count();
    const cycleCount = await prisma.cropCycle.count();
    return res.json({ users: userCount, farms: farmCount, cycles: cycleCount });
  }
}
