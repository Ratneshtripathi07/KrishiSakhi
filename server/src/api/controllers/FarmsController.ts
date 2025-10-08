// server/src/api/controllers/FarmsController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

function toNumber(d: any): number | null {
  if (d == null) return null;
  if (typeof d === 'number') return d;
  try { return parseFloat(String(d)); } catch { return null; }
}

function statusFromMetrics(m?: { water_requirement?: string | null; yield_forecast?: number | null; pest_risk?: string | null; }): string {
  const wr = (m?.water_requirement || '').toLowerCase();
  const yf = typeof m?.yield_forecast === 'number' ? m?.yield_forecast : undefined;
  const pr = (m?.pest_risk || '').toLowerCase();
  if (wr === 'high') return 'Needs Irrigation';
  if (typeof yf === 'number' && yf >= 65) return 'Good Growth';
  if (pr === 'high') return 'Pest Risk High';
  return 'Healthy';
}

// Upload storage (disk) under dist/uploads; served via /uploads static in app.ts
const uploadDir = path.resolve(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(uploadDir, { recursive: true }, (err) => cb(err as unknown as Error | null, uploadDir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  },
});
export const farmsPhotosUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).array('photos', 6);
export const farmReportUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single('report');

export class FarmsController {
  static async list(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid user id' });

      // Fetch farms with metrics and one active crop cycle
      const farms = await prisma.farm.findMany({
        where: { user_id: userId },
        include: {
          metrics: true,
          cropCycles: {
            where: { status: 'active' },
            orderBy: { id: 'desc' },
            take: 1,
          },
          tasks: {
            where: { status: 'pending' },
            select: { id: true },
          },
        },
        orderBy: { id: 'asc' },
      });

      // Aggregate summary
      const totalArea = farms.reduce((s, f) => s + (toNumber(f.area_acres) || 0), 0);
      const cropsSet = new Set<string>();
      farms.forEach((f) => {
        const c = f.cropCycles[0]?.crop_name;
        if (c) cropsSet.add(c);
      });
      const pendingTasks = farms.reduce((s, f) => s + (f.tasks?.length || 0), 0);

      const items = farms.map((f) => {
        const crop = f.cropCycles[0]?.crop_name || null;
        const status = statusFromMetrics(f.metrics || undefined);
        return {
          id: f.id,
          name: f.farm_name,
          area_acres: toNumber(f.area_acres),
          crop,
          status,
        };
      });

      return res.json({
        farms: items,
        summary: {
          totalAreaAcres: Number(totalArea.toFixed(2)),
          cropsCount: cropsSet.size,
          pendingTasks,
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load farms' });
    }
  }

  static async details(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid user id' });
      const farmId = parseInt(String(req.params.farmId), 10);
      if (Number.isNaN(farmId)) return res.status(400).json({ error: 'Invalid farm id' });

      const farm = await prisma.farm.findFirst({
        where: { id: farmId, user_id: userId },
        include: {
          metrics: true,
          cropCycles: {
            where: { status: 'active' },
            orderBy: { id: 'desc' },
            take: 1,
          },
          tasks: {
            orderBy: { created_at: 'desc' },
          },
        },
      });
      if (!farm) return res.status(404).json({ error: 'Farm not found' });

      const status = statusFromMetrics(farm.metrics || undefined);
      return res.json({
        farm: {
          id: farm.id,
          name: farm.farm_name,
          area_acres: toNumber(farm.area_acres),
          location: {
            lat: toNumber(farm.location_lat),
            lon: toNumber(farm.location_lon),
          },
          soil_type: farm.soil_type,
          irrigation_source: farm.irrigation_source,
          crop: farm.cropCycles[0]?.crop_name || null,
          status,
        },
        metrics: farm.metrics || null,
        tasks: farm.tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, due_date: t.due_date, created_at: t.created_at, completed_at: t.completed_at })),
      });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to load farm details' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      const body = req.body || {};

      // Quick add required fields
      const name = body.name as string | undefined;
      const area_acres = body.area_acres as number | string | undefined; // already converted to acres by client
      const area_unit = body.area_unit as string | undefined;
      const village = body.village as string | undefined;
      const district = body.district as string | undefined;
      const state = body.state as string | undefined;
      const location_lat = body.location_lat as number | string | undefined;
      const location_lon = body.location_lon as number | string | undefined;
      const soil_type = body.soil_type as string | undefined;
      const irrigation_source = body.irrigation_source as string | undefined; // canal | borewell | rainfed | pond | river
      const crop_name = body.crop_name as string | undefined;
      const variety = body.variety as string | undefined;
      const stage = body.stage as string | undefined;
      const sowing_date = body.sowing_date as string | undefined;
      const expected_harvest_date = body.expected_harvest_date as string | undefined;
      const seed_source = body.seed_source as string | undefined;

      if (!name) return res.status(400).json({ error: 'name is required' });
      if (!crop_name) return res.status(400).json({ error: 'crop_name is required' });
      if (!sowing_date) return res.status(400).json({ error: 'sowing_date is required' });
      if (location_lat == null || location_lon == null) return res.status(400).json({ error: 'location_lat and location_lon are required' });

      const farm = await prisma.farm.create({
        data: {
          user_id: userId,
          farm_name: String(name),
          area_acres: area_acres != null ? String(area_acres) : null,
          area_unit: area_unit || 'acres',
          village: village || null,
          district: district || null,
          state: state || null,
          location_lat: String(location_lat),
          location_lon: String(location_lon),
          soil_type: soil_type || null,
          irrigation_source: irrigation_source || null,
          // Optional additions
          soil_ph: body.soil_ph != null ? String(body.soil_ph) : null,
          organic_carbon: body.organic_carbon != null ? String(body.organic_carbon) : null,
          n_level: body.n_level != null ? String(body.n_level) : null,
          p_level: body.p_level != null ? String(body.p_level) : null,
          k_level: body.k_level != null ? String(body.k_level) : null,
          drainage_condition: body.drainage_condition || null,
          soil_test_report_url: body.soil_test_report_url || null,
          irrigation_system: body.irrigation_system || null,
          water_availability: body.water_availability || null,
          previous_crops: body.previous_crops || null,
          rotation_pattern: body.rotation_pattern || null,
          primary_goal: body.primary_goal || null,
          challenges: body.challenges || null,
          preferred_language: body.preferred_language || null,
          photos: body.photos || null,
          livestock: body.livestock || null,
          equipment: body.equipment || null,
        },
      });

      // Create initial crop cycle
      await prisma.cropCycle.create({
        data: {
          farm_id: farm.id,
          crop_name: crop_name,
          variety: variety || null,
          stage: stage || null,
          sowing_date: new Date(String(sowing_date)),
          expected_harvest_date: expected_harvest_date ? new Date(String(expected_harvest_date)) : null,
          seed_source: seed_source || null,
          status: 'active',
        },
      });

      return res.status(201).json({ id: farm.id });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to create farm' });
    }
  }

  static async updateTaskStatus(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      const farmId = parseInt(String(req.params.farmId), 10);
      const taskId = parseInt(String(req.params.taskId), 10);
      const { status } = req.body || {};
      if (!['pending', 'done'].includes(String(status))) return res.status(400).json({ error: 'Invalid status' });

      // Ensure task belongs to the user's farm
      const task = await prisma.task.findFirst({ where: { id: taskId, farm_id: farmId, farm: { user_id: userId } } });
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: String(status),
          completed_at: String(status) === 'done' ? new Date() : null,
        },
      });
      return res.json({ ok: true, task: updated });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to update task' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      const farmId = parseInt(String(req.params.id), 10);
      const body = req.body || {};

      // Ensure farm belongs to user
      const farm = await prisma.farm.findFirst({ where: { id: farmId, user_id: userId } });
      if (!farm) return res.status(404).json({ error: 'Farm not found' });

      const farmData: any = {};
      const setStr = (key: string) => { if (body[key] != null && body[key] !== '') farmData[key] = String(body[key]); };
      const setNumStr = (key: string) => { if (body[key] != null && body[key] !== '') farmData[key] = String(body[key]); };

      // Updatable Farm fields
      ['farm_name','area_unit','village','district','state','soil_type','drainage_condition','soil_test_report_url','irrigation_source','irrigation_system','water_availability','rotation_pattern','primary_goal','challenges','preferred_language'].forEach(setStr);
      ['area_acres','soil_ph','organic_carbon','n_level','p_level','k_level','location_lat','location_lon'].forEach(setNumStr);

      if (body.previous_crops) farmData.previous_crops = Array.isArray(body.previous_crops) ? body.previous_crops : String(body.previous_crops).split(',').map((s) => s.trim()).filter(Boolean);
      if (body.photos) farmData.photos = Array.isArray(body.photos) ? body.photos : String(body.photos).split('\n').map((s) => s.trim()).filter(Boolean);
      if (body.livestock) farmData.livestock = body.livestock;
      if (body.equipment) farmData.equipment = body.equipment;

      if (Object.keys(farmData).length) {
        await prisma.farm.update({ where: { id: farmId }, data: farmData });
      }

      // Update active crop cycle if crop fields provided
      const cycleKeys = ['crop_name','variety','stage','sowing_date','expected_harvest_date','seed_source'];
      const hasCycle = cycleKeys.some((k) => body[k] != null && body[k] !== '');
      if (hasCycle) {
        const cycle = await prisma.cropCycle.findFirst({ where: { farm_id: farmId, status: 'active' }, orderBy: { id: 'desc' } });
        if (cycle) {
          const cycleData: any = {};
          if (body.crop_name) cycleData.crop_name = String(body.crop_name);
          if (body.variety) cycleData.variety = String(body.variety);
          if (body.stage) cycleData.stage = String(body.stage);
          if (body.sowing_date) cycleData.sowing_date = new Date(String(body.sowing_date));
          if (body.expected_harvest_date) cycleData.expected_harvest_date = new Date(String(body.expected_harvest_date));
          if (body.seed_source) cycleData.seed_source = String(body.seed_source);
          await prisma.cropCycle.update({ where: { id: cycle.id }, data: cycleData });
        }
      }

      // Return fresh details
      const fresh = await prisma.farm.findFirst({
        where: { id: farmId, user_id: userId },
        include: {
          metrics: true,
          cropCycles: { where: { status: 'active' }, orderBy: { id: 'desc' }, take: 1 },
          tasks: { orderBy: { created_at: 'desc' } },
        },
      });
      return res.json({ ok: true, farm: fresh });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to update farm' });
    }
  }

  static async uploadPhotos(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      const farmId = parseInt(String(req.params.farmId), 10);
      const farm = await prisma.farm.findFirst({ where: { id: farmId, user_id: userId } });
      if (!farm) return res.status(404).json({ error: 'Farm not found' });

      const files = (req as unknown as { files?: Express.Multer.File[] }).files || [];
      const urls = (files as Express.Multer.File[]).map((f) => `/uploads/${path.basename(f.path)}`);
      const existing = Array.isArray(farm.photos) ? farm.photos : [];
      const next = [...existing, ...urls];
      await prisma.farm.update({ where: { id: farmId }, data: { photos: next } });
      return res.json({ ok: true, photos: next });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to upload photos' });
    }
  }

  static async uploadSoilReport(req: Request, res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user?.sub) return res.status(401).json({ error: 'Unauthorized' });
      const userId = parseInt(String(user.sub), 10);
      const farmId = parseInt(String(req.params.farmId), 10);
      const farm = await prisma.farm.findFirst({ where: { id: farmId, user_id: userId } });
      if (!farm) return res.status(404).json({ error: 'Farm not found' });

      const file = (req as unknown as { file?: Express.Multer.File }).file;
      if (!file) return res.status(400).json({ error: 'report is required' });
      const url = `/uploads/${path.basename(file.path)}`;
      await prisma.farm.update({ where: { id: farmId }, data: { soil_test_report_url: url } });
      return res.json({ ok: true, soil_test_report_url: url });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to upload report' });
    }
  }
}
