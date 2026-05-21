import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/me').get(protect, getCurrentUser).put(protect, updateCurrentUser);

export default router;
