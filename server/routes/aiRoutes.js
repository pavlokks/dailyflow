import { Router } from 'express';
import { generateTasks } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/generate-tasks', generateTasks);

export default router;
