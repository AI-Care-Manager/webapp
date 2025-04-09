import express from 'express';
import cors from 'cors';
import reportRoutes from './routes/reportRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/reports', reportRoutes);

export default app; 