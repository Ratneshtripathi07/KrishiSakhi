// server/src/api/controllers/WeatherController.ts
import { Request, Response } from 'express';
import { WeatherService } from '../../services/WeatherService';

const service = new WeatherService();

export class WeatherController {
  static async get(req: Request, res: Response) {
    try {
      const { lat, lon, state, city } = req.query as Record<string, string | undefined>;
      const latNum = lat !== undefined ? Number(lat) : undefined;
      const lonNum = lon !== undefined ? Number(lon) : undefined;
      const data = await service.getWeather({ lat: latNum, lon: lonNum, state, city });
      return res.json(data);
    } catch (e: any) {
      const status = e?.status || 500;
      return res.status(status).json({ error: e?.message || 'Weather fetch failed' });
    }
  }
}