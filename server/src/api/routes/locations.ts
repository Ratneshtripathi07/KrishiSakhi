// server/src/api/routes/locations.ts
import { Router } from 'express';
import { LocationsController } from '../controllers/LocationsController';

const router = Router();

router.get('/states', LocationsController.states);
router.get('/cities', LocationsController.cities);
router.get('/constituencies', LocationsController.constituencies);

export { router as locationsRouter };
