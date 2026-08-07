import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  sendPasswordReset,
  signOutUser,
  subscribeToAuthState,
} from '../firebase/authService';
import { isLiveFirebaseConfigured } from '../firebase/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [forceDemoMode, setForceDemoMode] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const enableDemoMode = () => {
    setForceDemoMode(true);
    setError('');
  };

  const signUp = async (email, password, displayName) => {
    setError('');
    if (forceDemoMode) {
      const demoUser = {
        uid: 'demo-' + Date.now(),
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isDemo: true,
      };
      setCurrentUser(demoUser);
      return demoUser;
    }
    try {
      const user = await signUpWithEmail(email, password, displayName);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(formatAuthError(err.code || err.message));
      throw err;
    }
  };

  const signIn = async (email, password) => {
    setError('');
    if (forceDemoMode) {
      const demoUser = {
        uid: 'demo-user-' + Date.now(),
        email,
        displayName: email.split('@')[0] || 'Hive Developer',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isDemo: true,
      };
      setCurrentUser(demoUser);
      return demoUser;
    }
    try {
      const user = await signInWithEmail(email, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(formatAuthError(err.code || err.message));
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError('');
    if (forceDemoMode) {
      const demoUser = {
        uid: 'demo-google-' + Date.now(),
        email: 'alex.dev@google.demo',
        displayName: 'Alex Morgan (Google)',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        isDemo: true,
      };
      setCurrentUser(demoUser);
      return demoUser;
    }
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(formatAuthError(err.code || err.message));
      throw err;
    }
  };

  const resetPassword = async (email) => {
    setError('');
    try {
      return await sendPasswordReset(email);
    } catch (err) {
      setError(formatAuthError(err.code || err.message));
      throw err;
    }
  };

  const logout = async () => {
    setError('');
    try {
      await signOutUser();
      setCurrentUser(null);
    } catch (err) {
      setError(formatAuthError(err.code || err.message));
    }
  };

  const clearError = () => setError('');

  const formatAuthError = (code) => {
    if (!code) return 'An error occurred during authentication.';
    if (code.includes('auth/api-key-not-valid') || code.includes('api-key-not-valid')) {
      return 'Firebase API key is invalid or restricted. Please check VITE_FIREBASE_API_KEY in frontend/.env, or click "Switch to Demo Mode" below to test.';
    }
    if (code.includes('auth/invalid-email')) return 'Invalid email address format.';
    if (code.includes('auth/user-not-found') || code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return 'Invalid email or password credentials.';
    }
    if (code.includes('auth/email-already-in-use')) return 'This email address is already registered.';
    if (code.includes('auth/weak-password')) return 'Password should be at least 6 characters long.';
    if (code.includes('auth/popup-closed-by-user')) return 'Google Sign-In popup was closed before completion.';
    return code;
  };

  const value = {
    currentUser,
    loading,
    error,
    isDemoMode: forceDemoMode || !isLiveFirebaseConfigured,
    enableDemoMode,
    signUp,
    signIn,
    loginWithGoogle,
    resetPassword,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
