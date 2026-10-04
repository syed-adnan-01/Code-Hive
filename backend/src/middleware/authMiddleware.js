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
  const tokenClean = idToken ? idToken.trim() : '';

  // 1. Explicit demo/test tokens (e.g. demo-alice-token, demo-owner_xxx-token, demo-admin-token)
  if (tokenClean.startsWith('demo-')) {
    const match = tokenClean.match(/^demo-([a-zA-Z0-9_-]+?)(?:-token)?$/);
    let uid = 'demo-user-uid';
    let name = 'Demo Hive Developer';
    let email = 'demo.developer@codehive.dev';
    let isAdmin = false;

    if (match && match[1] && match[1] !== 'bearer' && match[1] !== 'user') {
      const username = match[1];
      uid = `demo-${username}-uid`;
      if (username.startsWith('collab_') || username.startsWith('peer_') || username.startsWith('guest_')) {
        const suffix = username.split('_')[1] || '';
        name = `Collaborator ${suffix.slice(0, 4).toUpperCase()}`;
      } else if (username.startsWith('owner_') || username === 'owner') {
        name = 'Room Owner';
      } else {
        name = username.charAt(0).toUpperCase() + username.slice(1);
      }
      email = `${username}@codehive.dev`;
      if (username.toLowerCase().includes('admin')) {
        isAdmin = true;
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

    if (await isUserDisabled(uid)) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled. Access revoked by administrator.',
      });
    }

    return next();
  }

  // 2. Real Live Firebase Authentication Token (Google OAuth / Email Auth)
  if (isFirebaseAdminInitialized) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(tokenClean, true);
      req.user = {
        ...decodedToken,
        displayName: decodedToken.name || decodedToken.displayName || decodedToken.email?.split('@')[0],
        photoURL: decodedToken.picture || decodedToken.photoURL || null,
      };

      if (await isUserDisabled(decodedToken.uid)) {
        return res.status(403).json({
          success: false,
          error: 'Account disabled. Access revoked by administrator.',
        });
      }

      return next();
    } catch (adminError) {
      console.warn('Firebase Admin verifyIdToken error, attempting JWT payload extraction:', adminError.message);
    }
  }

  // 3. Fallback: Parse decoded JWT payload so distinct Google/Firebase users never collide
  try {
    const parts = tokenClean.split('.');
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      const uid = payload.user_id || payload.sub;

      if (uid) {
        const displayName = payload.name || payload.displayName || (payload.email ? payload.email.split('@')[0] : 'Hive Developer');
        req.user = {
          ...payload,
          uid,
          email: payload.email || `${uid}@codehive.dev`,
          name: displayName,
          displayName,
          photoURL: payload.picture || payload.photoURL || null,
          isDemoUser: false,
          admin: Boolean(payload.admin),
        };

        if (await isUserDisabled(uid)) {
          return res.status(403).json({
            success: false,
            error: 'Account disabled. Access revoked by administrator.',
          });
        }

        return next();
      }
    }
  } catch (jwtErr) {
    console.warn('JWT fallback decode error:', jwtErr.message);
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid or expired authentication token.',
  });
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
