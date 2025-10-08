// server/src/api/routes/adminAnalytics.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AdminAnalyticsController } from '../controllers/AdminAnalyticsController';

const router = Router();

router.get('/weekly-issues', requireAuth, requireAdmin, AdminAnalyticsController.weeklyIssues);
router.get('/stats', requireAuth, requireAdmin, AdminAnalyticsController.stats);

export { router as adminAnalyticsRouter };