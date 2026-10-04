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
    // Demo Mode token fallback: supports distinct demo users (e.g. demo-alice-token, demo-charlie-token)
    const tokenClean = idToken.trim();
    let uid = 'demo-user-uid';
    let name = 'Demo Hive Developer';
    let email = 'demo.developer@codehive.dev';

    if (tokenClean.startsWith('demo-')) {
      const match = tokenClean.match(/^demo-([a-zA-Z0-9_-]+?)(?:-token)?$/);
      if (match && match[1] && match[1] !== 'bearer' && match[1] !== 'user') {
        const username = match[1];
        uid = `demo-${username}-uid`;
        name = username.charAt(0).toUpperCase() + username.slice(1);
        email = `${username}@codehive.dev`;
      }
    }

    req.user = {
      uid,
      email,
      name,
      displayName: name,
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
