// server/src/api/controllers/SchemesController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Simple disk storage for scheme images
const uploadDir = path.resolve(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(uploadDir, { recursive: true }, (err) => cb(err as any, uploadDir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  },
});
export const schemeImageUpload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } }).single('image');

export class SchemesController {
  static async listPublic(req: Request, res: Response) {
    try {
      const { state, city, constituency } = req.query as { state?: string; city?: string; constituency?: string };
      const where: any = { active: true };
      const and: any[] = [];
      if (state) and.push({ OR: [ { target_state: null }, { target_state: String(state) } ] });
      if (city) and.push({ OR: [ { target_city: null }, { target_city: String(city) } ] });
      if (constituency) and.push({ OR: [ { target_constituency: null }, { target_constituency: String(constituency) } ] });
      if (and.length > 0) where.AND = and;
      const schemes = await prisma.scheme.findMany({ where, orderBy: { created_at: 'desc' } });
      return res.json({ schemes });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load schemes' });
    }
  }
}

export class AdminSchemesController {
  static async create(req: Request, res: Response) {
    try {
      const { title, description, eligibility, link, start_date, end_date, active, target_state, target_city, target_constituency } = req.body || {};
      if (!title) return res.status(400).json({ error: 'title is required' });
      const file = (req as any).file as Express.Multer.File | undefined;
      const image_url = file ? `/uploads/${path.basename(file.path)}` : undefined;
      const created = await prisma.scheme.create({
        data: {
          title: String(title),
          description: description || null,
          eligibility: eligibility || null,
          link: link || null,
          image_url: image_url || null,
          target_state: target_state || null,
          target_city: target_city || null,
          target_constituency: target_constituency || null,
          start_date: start_date ? new Date(String(start_date)) : null,
          end_date: end_date ? new Date(String(end_date)) : null,
          active: active == null ? true : Boolean(active),
        }
      });
      return res.status(201).json({ scheme: created });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to create scheme' });
    }
  }

  static async list(_req: Request, res: Response) {
    try {
      const schemes = await prisma.scheme.findMany({ orderBy: { created_at: 'desc' } });
      return res.json({ schemes });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load schemes' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      await prisma.scheme.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to delete scheme' });
    }
  }
}
