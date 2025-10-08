// server/src/api/routes/weather.ts
import { Router } from 'express';
import { WeatherController } from '../controllers/WeatherController';

const router = Router();

router.get('/', WeatherController.get);

export { router as weatherRouter };