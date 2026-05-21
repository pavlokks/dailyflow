import { Router } from 'express';
import { getLatestNews } from '../controllers/newsController.js';

const router = Router();

router.get('/', getLatestNews);

export default router;
