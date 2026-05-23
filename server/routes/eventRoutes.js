import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  emptyEventTrash,
  getUserEvents,
  permanentlyDeleteEvent,
  restoreEvent,
  updateEvent
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.route('/').get(getUserEvents).post(createEvent);
router.delete('/trash', emptyEventTrash);
router.put('/:id/restore', restoreEvent);
router.delete('/:id/permanent', permanentlyDeleteEvent);
router.route('/:id').put(updateEvent).delete(deleteEvent);

export default router;
