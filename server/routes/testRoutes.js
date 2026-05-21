import { Router } from 'express';
import { getTestStatus } from '../controllers/testController.js';

const router = Router();

router.get('/', getTestStatus);

export default router;
