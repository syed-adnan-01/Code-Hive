import express from 'express';
import { getUserProfile, getHealthCheck } from '../controllers/authController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/health', getHealthCheck);
router.get('/me', verifyFirebaseToken, getUserProfile);

export default router;
