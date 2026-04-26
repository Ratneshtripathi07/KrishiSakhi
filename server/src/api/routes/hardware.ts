import { Router } from 'express';
import { HardwareController } from '../controllers/HardwareController';

const router = Router();

// Endpoint for ESP32 to push data (can be authenticated via API key or similar in a real scenario, but for now we'll accept simple GET)
router.get('/update-data', HardwareController.updateData);
// Endpoint for frontend to fetch the data
router.get('/data/:farmId', HardwareController.getData);

export { router as hardwareRouter };
