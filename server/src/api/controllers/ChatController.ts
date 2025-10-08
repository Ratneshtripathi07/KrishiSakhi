// server/src/api/controllers/ChatController.ts
import { Request, Response } from 'express';
import { ChatService } from '../../services/ChatService';

const service = new ChatService();

export class ChatController {
  static async query(req: Request, res: Response) {
    try {
      const { text, crop, lat, lon, context } = req.body || {};
      if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
      const data = await service.ask({ text, crop, lat, lon, context });
      return res.json(data);
    } catch (e: any) {
      const status = e?.status || 500;
      return res.status(status).json({ error: e?.message || 'Chat query failed' });
    }
  }
}