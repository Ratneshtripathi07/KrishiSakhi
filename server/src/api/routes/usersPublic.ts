// server/src/api/routes/usersPublic.ts
import { Router } from 'express';
import { UserPublicController } from '../controllers/UserPublicController';

const router = Router();

router.post('/', UserPublicController.submit);

export { router as usersPublicRouter };