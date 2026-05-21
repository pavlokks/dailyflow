import { Router } from 'express';
import { getUserWeather } from '../controllers/weatherController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getUserWeather);

export default router;
