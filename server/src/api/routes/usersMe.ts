// server/src/api/routes/usersMe.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { UsersMeController } from '../controllers/UsersMeController';

const router = Router();

router.get('/me', requireAuth, UsersMeController.me);

export { router as usersMeRouter };