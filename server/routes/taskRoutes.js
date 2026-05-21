import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getUserTasks,
  updateTask
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.route('/').get(getUserTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);

export default router;
