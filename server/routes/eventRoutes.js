import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  getUserEvents,
  updateEvent
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.route('/').get(getUserEvents).post(createEvent);
router.route('/:id').put(updateEvent).delete(deleteEvent);

export default router;
