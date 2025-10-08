// server/src/api/routes/farms.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { FarmsController, farmsPhotosUpload, farmReportUpload } from '../controllers/FarmsController';

const router = Router();

router.get('/', requireAuth, FarmsController.list);
router.get('/:farmId', requireAuth, FarmsController.details);
router.post('/', requireAuth, FarmsController.create);
router.patch('/:id', requireAuth, FarmsController.update);
router.patch('/:farmId/tasks/:taskId', requireAuth, FarmsController.updateTaskStatus);

// Uploads
router.post('/:farmId/photos', requireAuth, farmsPhotosUpload, FarmsController.uploadPhotos);
router.post('/:farmId/soil-report', requireAuth, farmReportUpload, FarmsController.uploadSoilReport);

export { router as farmsRouter };
