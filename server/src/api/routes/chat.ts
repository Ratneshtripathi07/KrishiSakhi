// server/src/api/routes/chat.ts
import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';

const router = Router();

router.post('/query', ChatController.query);

export { router as chatRouter };