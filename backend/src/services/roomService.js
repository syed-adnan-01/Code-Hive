import crypto from 'crypto';
import { admin, isFirebaseAdminInitialized } from '../config/firebaseAdmin.js';
import { getLanguageById } from '../config/languages.js';

// In-memory cache for fast room lookup and fallback when Firestore is not configured
const roomMemoryStore = new Map();

// Helper to generate clean, readable room ID
export const generateRoomId = () => {
  const bytes = crypto.randomBytes(4).toString('hex');
  return `hive-${bytes}`;
};

export const createRoom = async ({ name, language_id = 63, linkAccess = 'editor', ownerUid, user = {} }) => {
  const roomId = generateRoomId();
  const langConfig = getLanguageById(language_id);
  const now = new Date().toISOString();

  const roomData = {
    id: roomId,
    name: name || 'Collaborative Workspace Room',
    ownerUid: ownerUid || 'demo-owner',
    language: langConfig.key,
    language_id: langConfig.id,
    linkAccess: linkAccess === 'viewer' ? 'viewer' : 'editor',
    members: {
      [ownerUid]: 'owner',
    },
    createdAt: now,
    lastActiveAt: now,
  };

  roomMemoryStore.set(roomId, roomData);

  // Persist to Cloud Firestore if configured
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      await db.collection('rooms').doc(roomId).set({
        ...roomData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Room ${roomId} persisted to Cloud Firestore.`);
    } catch (err) {
      console.warn(`⚠️ Could not save room ${roomId} to Firestore:`, err.message);
    }
  }

  return roomData;
};

export const getRoom = async (roomId) => {
  if (!roomId) return null;

  // 1. Check in-memory store
  if (roomMemoryStore.has(roomId)) {
    return roomMemoryStore.get(roomId);
  }

  // 2. Check Firestore
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      const doc = await db.collection('rooms').doc(roomId).get();
      if (doc.exists) {
        const data = doc.data();
        roomMemoryStore.set(roomId, data);
        return data;
      }
    } catch (err) {
      console.warn(`Error querying Firestore for room ${roomId}:`, err.message);
    }
  }

  return null;
};

export const resolveUserRole = async (roomId, uid) => {
  const room = await getRoom(roomId);
  if (!room) return null;

  if (room.ownerUid === uid) {
    return 'owner';
  }

  if (room.members && room.members[uid]) {
    return room.members[uid];
  }

  // Fallback to linkAccess policy ('editor' or 'viewer')
  return room.linkAccess || 'editor';
};

export const updateRoomSnapshot = async (roomId, snapshotBase64) => {
  const room = await getRoom(roomId);
  if (!room) return;

  const byteLength = Buffer.byteLength(snapshotBase64, 'base64');
  const sizeKb = (byteLength / 1024).toFixed(1);

  // IDE Extension Plan Section 3 limit warning (700 KB threshold)
  if (byteLength > 700 * 1024) {
    console.warn(`⚠️ [SNAPSHOT LIMIT WARNING] Room ${roomId} snapshot is ${sizeKb} KB (approaching 700 KB threshold, 1 MiB max).`);
  }

  // If exceeds 1020 KB, stop updating Firestore to avoid document write failure
  if (byteLength > 1020 * 1024) {
    console.warn(`🚨 [SNAPSHOT LIMIT EXCEEDED] Room ${roomId} snapshot is ${sizeKb} KB (>1 MiB). Suppressing Firestore write to preserve live session.`);
    return;
  }

  const now = new Date().toISOString();
  room.state = snapshotBase64;
  room.lastActiveAt = now;
  roomMemoryStore.set(roomId, room);

  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      await db.collection('rooms').doc(roomId).update({
        state: snapshotBase64,
        lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn(`Error updating Firestore snapshot for room ${roomId}:`, err.message);
    }
  }
};
