// server/src/api/routes/adminSchemes.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { AdminSchemesController, schemeImageUpload } from '../controllers/SchemesController';

const router = Router();

router.get('/', requireAuth, requireAdmin, AdminSchemesController.list);
router.post('/', requireAuth, requireAdmin, schemeImageUpload, AdminSchemesController.create);
router.delete('/:id', requireAuth, requireAdmin, AdminSchemesController.remove);

export { router as adminSchemesRouter };
