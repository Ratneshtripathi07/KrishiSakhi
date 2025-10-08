// server/src/api/controllers/LocationsController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { fallbackStates, fallbackCities, fallbackConstituencies } from '../../services/LocationFallback';

export class LocationsController {
  static async states(_req: Request, res: Response) {
    // Prefer fallback offline states; if empty, fallback to DB
    const f = fallbackStates();
    if (f.length > 0) return res.json({ states: f });
    const rows = await prisma.user.findMany({ distinct: ['state'], select: { state: true }, where: { state: { not: null } } });
    const states = rows.map((r) => r.state).filter(Boolean) as string[];
    return res.json({ states });
  }

  static async cities(req: Request, res: Response) {
    const { state } = req.query as Record<string, string | undefined>;
    const f = fallbackCities(state);
    if (f.length > 0) return res.json({ cities: f });
    const rows = await prisma.user.findMany({ distinct: ['city'], select: { city: true }, where: { city: { not: null }, ...(state ? { state } : {}) } });
    const cities = rows.map((r) => r.city).filter(Boolean) as string[];
    return res.json({ cities });
  }

  static async constituencies(req: Request, res: Response) {
    const { state, city } = req.query as Record<string, string | undefined>;
    const f = fallbackConstituencies(state, city);
    if (f.length > 0) return res.json({ constituencies: f });
    // DB fallback if we have any saved users with that field populated
    const rows = await prisma.user.findMany({
      distinct: ['constituency'],
      select: { constituency: true },
      where: {
        constituency: { not: null },
        ...(state ? { state } : {}),
        ...(city ? { city } : {}),
      },
    });
    const constituencies = rows.map((r) => r.constituency).filter(Boolean) as string[];
    return res.json({ constituencies });
  }
}
