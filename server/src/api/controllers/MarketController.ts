// server/src/api/controllers/MarketController.ts
import { Request, Response } from 'express';
import { MarketService } from '../../services/MarketService';

const service = new MarketService();

export class MarketController {
  static async crops(_req: Request, res: Response) {
    return res.json({ crops: service.listCrops() });
  }
  static async trends(req: Request, res: Response) {
    try {
      const { crop, state, city } = req.query as Record<string, string | undefined>;
      const data = service.getTrends({ crop, state, city });
      return res.json(data);
    } catch (e: any) {
      const status = e?.status || 500;
      return res.status(status).json({ error: e?.message || 'Failed to load market trends' });
    }
  }
}