import express from 'express';
import { runCode, getLanguages } from '../controllers/runController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { runLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public: Get supported languages & templates
router.get('/languages', getLanguages);

// Protected: Execute code via Judge0 with token check & rate limit
router.post('/', verifyFirebaseToken, runLimiter, runCode);

export default router;
