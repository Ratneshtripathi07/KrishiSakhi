// server/src/api/routes/admin.ts
import { Router } from 'express';
import { AdminAuthController } from '../controllers/AdminAuthController';

const router = Router();

router.post('/login', AdminAuthController.login);

export { router as adminRouter };