import express from 'express';
import { handleCreateRoom, handleGetRoom, handleGetRoomTicket } from '../controllers/roomController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create collaboration room
router.post('/', verifyFirebaseToken, handleCreateRoom);

// Get room details
router.get('/:id', verifyFirebaseToken, handleGetRoom);

// Generate 60-second single-use room ticket for Hocuspocus WebSocket connection
router.post('/:id/ticket', verifyFirebaseToken, handleGetRoomTicket);

export default router;
