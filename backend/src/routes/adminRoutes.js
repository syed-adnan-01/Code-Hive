// Admin Routes protected by verifyFirebaseToken & requireAdmin
import { Router } from 'express';
import { verifyFirebaseToken, requireAdmin } from '../middleware/authMiddleware.js';
import {
  getAdminLanguages,
  updateLanguageStatus,
  getAdminUsers,
  disableUser,
  enableUser,
  updateUserAdminRole,
  getStats,
  getLogs,
} from '../controllers/adminController.js';

const router = Router();

// Apply auth & admin guard to all /api/admin/* endpoints
router.use(verifyFirebaseToken, requireAdmin);

// Languages Control
router.get('/languages', getAdminLanguages);
router.patch('/languages/:id', updateLanguageStatus);

// User Control
router.get('/users', getAdminUsers);
router.post('/users/:uid/disable', disableUser);
router.post('/users/:uid/enable', enableUser);
router.post('/users/:uid/admin', updateUserAdminRole);

// System Statistics & Audit Logs
router.get('/stats', getStats);
router.get('/logs', getLogs);

export default router;
