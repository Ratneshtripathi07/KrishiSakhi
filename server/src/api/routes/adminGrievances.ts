// server/src/api/routes/adminGrievances.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AdminGrievancesController } from '../controllers/GrievancesController';

const router = Router();

router.get('/', requireAuth, requireAdmin, AdminGrievancesController.list);
router.patch('/:id', requireAuth, requireAdmin, AdminGrievancesController.updateStatus);

export { router as adminGrievancesRouter };