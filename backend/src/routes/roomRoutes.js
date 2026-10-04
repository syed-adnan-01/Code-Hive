import express from 'express';
import { handleCreateRoom, handleGetRoom, handleGetRoomTicket } from '../controllers/roomController.js';
import { postChatMessage, getChatHistory } from '../controllers/chatController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { roomLimiter, ticketLimiter, chatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Create collaboration room with token check and rate limit
router.post('/', verifyFirebaseToken, roomLimiter, handleCreateRoom);

// Get room details
router.get('/:id', verifyFirebaseToken, handleGetRoom);

// Generate 60-second single-use room ticket with token check and rate limit
router.post('/:id/ticket', verifyFirebaseToken, ticketLimiter, handleGetRoomTicket);

// Room Chat: post message with chatLimiter (30/min per user) and get history
router.post('/:id/messages', verifyFirebaseToken, chatLimiter, postChatMessage);
router.get('/:id/messages', verifyFirebaseToken, getChatHistory);

export default router;


