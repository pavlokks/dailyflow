import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import testRoutes from './routes/testRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/test', testRoutes);
app.use('/api/weather', weatherRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'DailyFlow API is running' });
});

export default app;
