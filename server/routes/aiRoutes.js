import { Router } from 'express';
import {
  generateDailySummary,
  generateTasks
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/generate-tasks', generateTasks);
router.post('/daily-summary', generateDailySummary);

export default router;
