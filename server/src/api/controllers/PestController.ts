// server/src/api/controllers/PestController.ts
import { Request, Response } from 'express';
import multer from 'multer';
import { PestService } from '../../services/PestService';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const service = new PestService();

export const pestUploadMiddleware = upload.single('image');

export class PestController {
  static async analyze(req: Request, res: Response) {
    try {
      const file = (req as unknown as { file?: Express.Multer.File }).file;
      const { crop, notes, lat, lon } = req.body || {};
      if (!file) return res.status(400).json({ error: 'image is required' });
      const data = await service.analyze({ file, crop, notes, lat: lat ? Number(lat) : undefined, lon: lon ? Number(lon) : undefined });
      return res.json(data);
    } catch (e: any) {
      const status = e?.status || 500;
      return res.status(status).json({ error: e?.message || 'Analysis failed' });
    }
  }
}