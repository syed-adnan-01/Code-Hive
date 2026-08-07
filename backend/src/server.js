import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    appName: 'CodeHive API',
    description: 'Collaborative Workspace Backend Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/auth/health',
      me: '/api/auth/me (Protected)',
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CodeHive Backend API listening on http://localhost:${PORT}`);
});
