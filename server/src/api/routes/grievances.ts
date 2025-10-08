// server/src/api/routes/grievances.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { GrievancesController } from '../controllers/GrievancesController';

const router = Router();

router.post('/', requireAuth, GrievancesController.create);
router.get('/me', requireAuth, GrievancesController.myList);

export { router as grievancesRouter };