import express from 'express';
import { handleCreateRoom, handleGetRoom, handleGetRoomTicket } from '../controllers/roomController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { roomLimiter, ticketLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Create collaboration room with token check and rate limit
router.post('/', verifyFirebaseToken, roomLimiter, handleCreateRoom);

// Get room details
router.get('/:id', verifyFirebaseToken, handleGetRoom);

// Generate 60-second single-use room ticket with token check and rate limit
router.post('/:id/ticket', verifyFirebaseToken, ticketLimiter, handleGetRoomTicket);

export default router;

