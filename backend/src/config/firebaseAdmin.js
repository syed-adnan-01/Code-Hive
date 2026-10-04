import dotenv from 'dotenv';
dotenv.config();
import admin from 'firebase-admin';

let firebaseAdminApp = null;
let isFirebaseAdminInitialized = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (projectId && clientEmail && privateKey) {
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    isFirebaseAdminInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.log('ℹ️ Firebase Admin SDK credentials not fully set in .env. Running backend in Demo/Mock Auth verification mode.');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK initialization warning:', error.message);
}

export { admin, firebaseAdminApp, isFirebaseAdminInitialized };
