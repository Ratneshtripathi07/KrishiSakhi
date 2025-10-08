// server/src/api/routes/advisory.ts
import { Router } from 'express';
import { AdvisoryController } from '../controllers/AdvisoryController';

const router = Router();

router.get('/', AdvisoryController.get);

export { router as advisoryRouter };