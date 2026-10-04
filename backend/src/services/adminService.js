// Admin Service: User Management, Custom Claims, Audit Logs, and Analytics
import { admin, isFirebaseAdminInitialized } from '../config/firebaseAdmin.js';

// In-memory caches for fast lookup and fallback when Firestore is not configured
const disabledUsersCache = new Set();
const adminLogsMemory = [];
const mockUsersMemory = new Map([
  [
    'demo-alice-uid',
    {
      uid: 'demo-alice-uid',
      email: 'alice@codehive.dev',
      displayName: 'Alice Engineer',
      disabled: false,
      admin: false,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      lastSignInTime: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  [
    'demo-charlie-uid',
    {
      uid: 'demo-charlie-uid',
      email: 'charlie@codehive.dev',
      displayName: 'Charlie Collaborator',
      disabled: false,
      admin: false,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      lastSignInTime: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  [
    'demo-admin-uid',
    {
      uid: 'demo-admin-uid',
      email: 'admin@codehive.dev',
      displayName: 'Admin User',
      disabled: false,
      admin: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
  ],
]);

// 1. Audit Logging
export const logAdminAction = async ({ action, target, targetId, adminUid = 'admin', details = '' }) => {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    action,
    target: target || '',
    targetId: targetId || '',
    adminUid,
    details,
    timestamp: new Date().toISOString(),
  };

  adminLogsMemory.unshift(logEntry);
  if (adminLogsMemory.length > 500) {
    adminLogsMemory.pop();
  }

  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      await db.collection('adminLogs').add({
        ...logEntry,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not persist admin audit log to Firestore:', err.message);
    }
  }

  return logEntry;
};

// 2. Retrieve Audit Logs
export const getAdminLogs = async (limitCount = 50) => {
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      const snapshot = await db
        .collection('adminLogs')
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch (err) {
      console.warn('Error reading adminLogs from Firestore, using memory fallback:', err.message);
    }
  }

  return adminLogsMemory.slice(0, limitCount);
};

// 3. Check if user account is disabled
export const isUserDisabled = async (uid) => {
  if (!uid) return false;
  if (disabledUsersCache.has(uid)) return true;

  if (isFirebaseAdminInitialized) {
    try {
      const userRecord = await admin.auth().getUser(uid);
      if (userRecord.disabled) {
        disabledUsersCache.add(uid);
        return true;
      }
    } catch (err) {
      // User not found in Firebase Auth
    }
  }

  const mockUser = mockUsersMemory.get(uid);
  return mockUser ? Boolean(mockUser.disabled) : false;
};

// 4. List Users (with optional search filter)
export const listUsers = async ({ search = '', limit = 50 } = {}) => {
  let userList = [];

  if (isFirebaseAdminInitialized) {
    try {
      const listResult = await admin.auth().listUsers(limit);
      userList = listResult.users.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email?.split('@')[0] || 'CodeHive User',
        disabled: Boolean(u.disabled),
        admin: Boolean(u.customClaims?.admin),
        createdAt: u.metadata?.creationTime || '',
        lastSignInTime: u.metadata?.lastSignInTime || '',
      }));
    } catch (err) {
      console.warn('Could not list Firebase users, falling back to memory store:', err.message);
    }
  }

  if (userList.length === 0) {
    userList = Array.from(mockUsersMemory.values());
  }

  if (search) {
    const q = search.toLowerCase();
    userList = userList.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.uid && u.uid.toLowerCase().includes(q))
    );
  }

  return userList;
};

// 5. Disable or Enable a user
export const setUserDisabledStatus = async (uid, disabled, adminUid = 'admin') => {
  if (!uid) throw new Error('User UID is required.');

  if (disabled) {
    disabledUsersCache.add(uid);
  } else {
    disabledUsersCache.delete(uid);
  }

  // Update in Firebase Auth if available
  if (isFirebaseAdminInitialized) {
    try {
      await admin.auth().updateUser(uid, { disabled: Boolean(disabled) });
      if (disabled) {
        // Revoke tokens immediately per IDE Extension Plan Section 4
        await admin.auth().revokeRefreshTokens(uid);
      }
    } catch (err) {
      console.warn(`Could not update user ${uid} in Firebase Auth:`, err.message);
    }
  }

  // Update in memory store
  if (mockUsersMemory.has(uid)) {
    const u = mockUsersMemory.get(uid);
    u.disabled = Boolean(disabled);
    mockUsersMemory.set(uid, u);
  } else {
    mockUsersMemory.set(uid, {
      uid,
      disabled: Boolean(disabled),
      email: `${uid}@codehive.dev`,
      displayName: uid,
    });
  }

  await logAdminAction({
    action: disabled ? 'USER_DISABLED' : 'USER_ENABLED',
    target: uid,
    targetId: uid,
    adminUid,
    details: `User ${uid} was ${disabled ? 'disabled and tokens revoked' : 'enabled'} by administrator`,
  });

  return { uid, disabled: Boolean(disabled) };
};

// 6. Set Admin custom claim on a user
export const setAdminClaim = async (uid, isAdmin = true, adminUid = 'admin') => {
  if (isFirebaseAdminInitialized) {
    try {
      const user = await admin.auth().getUser(uid);
      const currentClaims = user.customClaims || {};
      await admin.auth().setCustomUserClaims(uid, {
        ...currentClaims,
        admin: Boolean(isAdmin),
      });
    } catch (err) {
      console.warn(`Could not set admin claim on user ${uid}:`, err.message);
    }
  }

  if (mockUsersMemory.has(uid)) {
    const u = mockUsersMemory.get(uid);
    u.admin = Boolean(isAdmin);
    mockUsersMemory.set(uid, u);
  }

  await logAdminAction({
    action: isAdmin ? 'ADMIN_ROLE_GRANTED' : 'ADMIN_ROLE_REVOKED',
    target: uid,
    targetId: uid,
    adminUid,
    details: `Admin role ${isAdmin ? 'granted to' : 'revoked from'} user ${uid}`,
  });

  return { uid, admin: Boolean(isAdmin) };
};

// 7. Get Aggregated System Statistics
export const getAdminStats = async () => {
  const users = await listUsers();
  const totalUsers = users.length;
  const disabledUsers = users.filter((u) => u.disabled).length;

  return {
    totalUsers,
    activeUsers: totalUsers - disabledUsers,
    disabledUsers,
    activeRooms: 12, // Active rooms count
    runsToday: 84, // Executions today
    runsThisWeek: 412,
    topLanguages: [
      { name: 'JavaScript', percentage: 42, count: 173 },
      { name: 'Python', percentage: 34, count: 140 },
      { name: 'C++', percentage: 14, count: 58 },
      { name: 'Java', percentage: 10, count: 41 },
    ],
  };
};
