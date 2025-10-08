// server/src/api/routes/market.ts
import { Router } from 'express';
import { MarketController } from '../controllers/MarketController';

const router = Router();

router.get('/crops', MarketController.crops);
router.get('/trends', MarketController.trends);

export { router as marketRouter };