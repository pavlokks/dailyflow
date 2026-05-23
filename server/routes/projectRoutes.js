import { Router } from 'express';
import {
  createProject,
  getUserProjects,
  updateProject
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.route('/').get(getUserProjects).post(createProject);
router.route('/:id').put(updateProject);

export default router;
