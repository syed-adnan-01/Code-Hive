import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isLiveFirebaseConfigured } from './config';

// Mock storage key for demo mode persistence in local storage
const DEMO_USER_KEY = 'codehive_demo_user';

// Save or sync user document record in Cloud Firestore
export const saveUserToFirestore = async (user, additionalData = {}) => {
  if (!isLiveFirebaseConfigured || !db || !user?.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.displayName || (user.email ? user.email.split('@')[0] : 'Hive Developer'),
        photoURL: user.photoURL || null,
        role: 'Developer',
        workspaceRooms: ['hive-alpha'],
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        ...additionalData,
      });
      console.log('✅ User record saved to Firestore:', user.uid);
    } else {
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
      console.log('✅ User lastLoginAt updated in Firestore:', user.uid);
    }
  } catch (err) {
    console.warn('⚠️ Could not save user record to Firestore:', err.message);
  }
};

// Fetch user profile from Firestore
export const getUserFirestoreProfile = async (uid) => {
  if (!isLiveFirebaseConfigured || !db || !uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
  } catch (err) {
    console.warn('⚠️ Error fetching user profile from Firestore:', err.message);
  }
  return null;
};

export const signUpWithEmail = async (email, password, displayName) => {
  if (!isLiveFirebaseConfigured) {
    // Demo Mode implementation
    const demoUser = {
      uid: 'demo-' + Date.now(),
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      emailVerified: true,
      isDemo: true,
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    return demoUser;
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Store user record in Firestore database
  await saveUserToFirestore(userCredential.user, { displayName });

  return userCredential.user;
};

export const signInWithEmail = async (email, password) => {
  if (!isLiveFirebaseConfigured) {
    const stored = localStorage.getItem(DEMO_USER_KEY);
    const existing = stored ? JSON.parse(stored) : null;

    const demoUser = existing || {
      uid: 'demo-hive-developer',
      email,
      displayName: email.split('@')[0] || 'Hive Engineer',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      emailVerified: true,
      isDemo: true,
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    return demoUser;
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // Sync user record in Firestore database
  await saveUserToFirestore(userCredential.user);

  return userCredential.user;
};

export const signInWithGoogle = async () => {
  if (!isLiveFirebaseConfigured) {
    const demoUser = {
      uid: 'demo-google-' + Date.now(),
      email: 'alex.dev@google.demo',
      displayName: 'Alex Morgan (Google)',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      emailVerified: true,
      isDemo: true,
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    return demoUser;
  }

  const userCredential = await signInWithPopup(auth, googleProvider);

  // Sync user record in Firestore database
  await saveUserToFirestore(userCredential.user);

  return userCredential.user;
};

export const sendPasswordReset = async (email) => {
  if (!isLiveFirebaseConfigured) {
    return { success: true, message: `Demo reset link sent to ${email}` };
  }

  await sendPasswordResetEmail(auth, email);
  return { success: true };
};

export const signOutUser = async () => {
  if (!isLiveFirebaseConfigured) {
    localStorage.removeItem(DEMO_USER_KEY);
    return true;
  }

  await signOut(auth);
  return true;
};

export const subscribeToAuthState = (callback) => {
  if (!isLiveFirebaseConfigured) {
    const stored = localStorage.getItem(DEMO_USER_KEY);
    const user = stored ? JSON.parse(stored) : null;
    callback(user);

    // Listen to custom demo storage events
    const handleStorage = () => {
      const updated = localStorage.getItem(DEMO_USER_KEY);
      callback(updated ? JSON.parse(updated) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Sync login timestamp to Firestore
      await saveUserToFirestore(user);
    }
    callback(user);
  });
};
