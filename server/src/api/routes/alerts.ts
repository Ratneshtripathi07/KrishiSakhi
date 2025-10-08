// server/src/api/routes/alerts.ts
import { Router } from 'express';
import { AlertsController } from '../controllers/AlertsController';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.get('/me', requireAuth, AlertsController.me);

export { router as alertsRouter };