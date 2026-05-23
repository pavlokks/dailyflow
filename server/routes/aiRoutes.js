import { Router } from 'express';
import {
  generateDailySummary,
  generateNextAction,
  generateTasks
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/generate-tasks', generateTasks);
router.post('/daily-summary', generateDailySummary);
router.post('/next-action', generateNextAction);

export default router;
