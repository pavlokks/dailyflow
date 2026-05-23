import { Router } from 'express';
import {
  createTask,
  deleteTask,
  emptyTaskTrash,
  getUserTasks,
  permanentlyDeleteTask,
  restoreTask,
  updateTask
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.route('/').get(getUserTasks).post(createTask);
router.delete('/trash', emptyTaskTrash);
router.put('/:id/restore', restoreTask);
router.delete('/:id/permanent', permanentlyDeleteTask);
router.route('/:id').put(updateTask).delete(deleteTask);

export default router;
