// server/src/api/routes/adminBroadcast.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AdminBroadcastController } from '../controllers/AdminBroadcastController';

const router = Router();

router.post('/broadcast', requireAuth, requireAdmin, AdminBroadcastController.broadcast);

export { router as adminBroadcastRouter };