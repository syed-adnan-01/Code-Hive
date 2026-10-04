// WebRTC Audio & Video Routing
import express from 'express';
import {
  handleGetIceConfig,
  handleJoinCall,
  handleLeaveCall,
  handleGetCallStatus,
  handleUpdateMediaState,
  handleSendSignal,
  handleGetSignals,
} from '../controllers/rtcController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Get ICE STUN/TURN server configuration (GET /api/rtc/ice)
router.get('/ice', verifyFirebaseToken, handleGetIceConfig);

// 2. Call participation endpoints
router.post('/rooms/:id/join', verifyFirebaseToken, handleJoinCall);
router.post('/rooms/:id/leave', verifyFirebaseToken, handleLeaveCall);
router.get('/rooms/:id/call', verifyFirebaseToken, handleGetCallStatus);
router.patch('/rooms/:id/media', verifyFirebaseToken, handleUpdateMediaState);

// 3. WebRTC Signalling endpoints (SDP offer/answer and ICE candidate exchange)
router.post('/rooms/:id/signal', verifyFirebaseToken, handleSendSignal);
router.get('/rooms/:id/signals', verifyFirebaseToken, handleGetSignals);

export default router;
