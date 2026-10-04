// Admin Controller handling language management, user control, stats, and audit logs
import { getAllLanguages, setLanguageEnabled } from '../services/languageService.js';
import {
  listUsers,
  setUserDisabledStatus,
  setAdminClaim,
  getAdminStats,
  getAdminLogs,
} from '../services/adminService.js';

// 1. Languages Management
export const getAdminLanguages = async (req, res) => {
  try {
    const languages = getAllLanguages();
    return res.status(200).json({
      success: true,
      languages,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateLanguageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "enabled" field. Must be a boolean (true or false).',
      });
    }

    const updatedLang = await setLanguageEnabled(id, enabled, req.user?.uid || 'admin');
    return res.status(200).json({
      success: true,
      language: updatedLang,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// 2. User Management
export const getAdminUsers = async (req, res) => {
  try {
    const { search, limit } = req.query;
    const users = await listUsers({
      search: search ? String(search) : '',
      limit: limit ? Number(limit) : 50,
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const disableUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await setUserDisabledStatus(uid, true, req.user?.uid || 'admin');
    return res.status(200).json({
      success: true,
      message: `User ${uid} has been disabled and session tokens revoked.`,
      user: result,
      result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

export const enableUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await setUserDisabledStatus(uid, false, req.user?.uid || 'admin');
    return res.status(200).json({
      success: true,
      message: `User ${uid} has been re-enabled.`,
      user: result,
      result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

export const updateUserAdminRole = async (req, res) => {
  try {
    const { uid } = req.params;
    const { admin: isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "admin" field. Must be a boolean.',
      });
    }

    const result = await setAdminClaim(uid, isAdmin, req.user?.uid || 'admin');
    return res.status(200).json({
      success: true,
      message: `Admin role for user ${uid} set to ${isAdmin}.`,
      result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// 3. System Statistics
export const getStats = async (req, res) => {
  try {
    const stats = await getAdminStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 4. Audit Logs
export const getLogs = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await getAdminLogs(limit);
    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
