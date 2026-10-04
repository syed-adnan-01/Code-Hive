import { admin, isFirebaseAdminInitialized } from '../config/firebaseAdmin.js';
import { isUserDisabled } from '../services/adminService.js';

export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access. No Bearer token provided.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!isFirebaseAdminInitialized) {
    // Demo Mode token fallback: supports distinct demo users (e.g. demo-alice-token, demo-admin-token)
    const tokenClean = idToken.trim();
    let uid = 'demo-user-uid';
    let name = 'Demo Hive Developer';
    let email = 'demo.developer@codehive.dev';
    let isAdmin = false;

    if (tokenClean.startsWith('demo-')) {
      const match = tokenClean.match(/^demo-([a-zA-Z0-9_-]+?)(?:-token)?$/);
      if (match && match[1] && match[1] !== 'bearer' && match[1] !== 'user') {
        const username = match[1];
        uid = `demo-${username}-uid`;
        name = username.charAt(0).toUpperCase() + username.slice(1);
        email = `${username}@codehive.dev`;
        if (username.toLowerCase().includes('admin')) {
          isAdmin = true;
        }
      }
    }

    req.user = {
      uid,
      email,
      name,
      displayName: name,
      isDemoUser: true,
      admin: isAdmin,
    };

    // Check if demo user has been disabled by admin
    if (await isUserDisabled(uid)) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled. Access revoked by administrator.',
      });
    }

    return next();
  }

  try {
    // Revocation check enabled (true) per IDE Extension Plan Section 2 & 4
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    req.user = decodedToken;

    // Check if account has been disabled
    if (await isUserDisabled(decodedToken.uid)) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled. Access revoked by administrator.',
      });
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token.',
      details: error.message,
    });
  }
};

// Middleware enforcing Admin privileges (IDE Extension Plan Section 4)
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.admin) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Administrator privileges required.',
    });
  }
  next();
};
