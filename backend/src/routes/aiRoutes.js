// AI Routes protected by verifyFirebaseToken & aiLimiter (IDE Extension Plan Section 6)
import { Router } from 'express';
import { handleDebug, handleSuggest } from '../controllers/aiController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply auth to all AI routes
router.use(verifyFirebaseToken);

// AI Debugging: analyze failed run, explain error & generate Monaco diff fix
router.post('/debug', aiLimiter, handleDebug);

// AI Code Suggestion: inline autocompletion
router.post('/suggest', aiLimiter, handleSuggest);

export default router;
