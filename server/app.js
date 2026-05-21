import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import healthRoutes from './routes/healthRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'DailyFlow API is running' });
});

export default app;
