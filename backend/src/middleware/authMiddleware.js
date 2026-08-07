import { admin, isFirebaseAdminInitialized } from '../config/firebaseAdmin.js';

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
    // Demo Mode token fallback
    req.user = {
      uid: 'demo-user-uid',
      email: 'demo.developer@codehive.dev',
      name: 'Demo Hive Developer',
      isDemoUser: true,
    };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
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
