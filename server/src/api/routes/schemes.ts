// server/src/api/routes/schemes.ts
import { Router } from 'express';
import { SchemesController } from '../controllers/SchemesController';

const router = Router();

router.get('/', SchemesController.listPublic);

export { router as schemesRouter };