// server/src/api/controllers/AdvisoryController.ts
import { Request, Response } from 'express';
import { AdvisoryEngine } from '../../services/AdvisoryEngine';

const engine = new AdvisoryEngine();

export class AdvisoryController {
  static async get(req: Request, res: Response) {
    try {
      const { lat, lon, state, city, crop } = req.query as Record<string, string | undefined>;
      const latNum = lat !== undefined ? Number(lat) : undefined;
      const lonNum = lon !== undefined ? Number(lon) : undefined;
      const data = await engine.getAdvisories({ lat: latNum, lon: lonNum, state, city, crop });
      return res.json(data);
    } catch (e: any) {
      const status = e?.status || 500;
      return res.status(status).json({ error: e?.message || 'Advisory computation failed' });
    }
  }
}