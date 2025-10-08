// server/src/api/routes/adminGeoAnalytics.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AdminGeoAnalyticsController } from '../controllers/AdminGeoAnalyticsController';

const router = Router();

router.get('/', requireAuth, requireAdmin, AdminGeoAnalyticsController.analytics);

export { router as adminGeoAnalyticsRouter };