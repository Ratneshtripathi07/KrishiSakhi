// server/src/api/controllers/GrievancesController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export class GrievancesController {
  static async create(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      const { title, description, category } = req.body || {};
      if (!title || !description) return res.status(400).json({ error: 'title and description are required' });
      const g = await prisma.grievance.create({ data: { user_id: userId, title: String(title), description: String(description), category: category || null } });
      return res.status(201).json({ grievance: g });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to create grievance' });
    }
  }

  static async myList(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      const list = await prisma.grievance.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
      return res.json({ grievances: list });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load grievances' });
    }
  }
}

export class AdminGrievancesController {
  static async list(_req: Request, res: Response) {
    try {
      const list = await prisma.grievance.findMany({ orderBy: { created_at: 'desc' }, include: { user: { select: { id: true, name: true, phone_number: true } } } });
      return res.json({ grievances: list });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load grievances' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { status } = req.body || {};
      if (!['open','in_progress','resolved'].includes(String(status))) return res.status(400).json({ error: 'Invalid status' });
      const g = await prisma.grievance.update({ where: { id }, data: { status: String(status) } });
      return res.json({ grievance: g });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to update grievance' });
    }
  }
}
