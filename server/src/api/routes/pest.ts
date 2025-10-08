// server/src/api/routes/pest.ts
import { Router } from 'express';
import { PestController, pestUploadMiddleware } from '../controllers/PestController';

const router = Router();

router.post('/pest', pestUploadMiddleware, PestController.analyze);

export { router as pestRouter };