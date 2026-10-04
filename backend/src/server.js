import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import runRoutes from './routes/runRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { initCollabServer } from './services/collabService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// JSON error handler (Architecture Section 8)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload.',
    });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload exceeds the maximum allowable server limit (1 MB).',
    });
  }
  next(err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/run', runRoutes);
app.use('/api/rooms', roomRoutes);

// Initialize Hocuspocus Collab Server for WebSocket real-time sync
initCollabServer(httpServer);

app.get('/', (req, res) => {
  res.json({
    appName: 'CodeHive API',
    description: 'Collaborative Workspace Backend Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/auth/health',
      me: '/api/auth/me (Protected)',
      run: '/api/run (Protected POST)',
      languages: '/api/run/languages (GET)',
      rooms: '/api/rooms (Protected POST/GET)',
      roomTicket: '/api/rooms/:id/ticket (Protected POST)',
    },
    websocket: `ws://localhost:${PORT}`,
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 CodeHive Backend API & Hocuspocus WebSocket listening on http://localhost:${PORT}`);
});
