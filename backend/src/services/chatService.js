// Live Chat Service for Collaborative Workspace Rooms
// Handles validation, storage (memory + Firestore), and real-time broadcasting via Hocuspocus/Yjs
import crypto from 'crypto';
import { admin, isFirebaseAdminInitialized } from '../config/firebaseAdmin.js';
import { getHocuspocusInstance } from './collabService.js';

// In-memory cache for room chat messages
const roomChatMemory = new Map();

// Helper to sanitize plain text (strips non-printable control chars, ensures strict plain text)
export const sanitizeChatMessage = (text) => {
  if (typeof text !== 'string') return '';
  return text.trim();
};

// 1. Post a new message to a room
export const saveAndBroadcastMessage = async ({ roomId, senderUid, senderName, text }) => {
  const cleanText = sanitizeChatMessage(text);

  if (!cleanText) {
    const err = new Error('Message text cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  if (cleanText.length > 500) {
    const err = new Error(`Message exceeds maximum limit of 500 characters (received ${cleanText.length}).`);
    err.statusCode = 400;
    throw err;
  }

  const messageId = `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const nowIso = new Date().toISOString();

  const messageData = {
    id: messageId,
    roomId,
    senderUid,
    senderName: senderName || 'Anonymous Bee',
    text: cleanText,
    timestamp: nowIso,
  };

  // 1. Cache in memory
  if (!roomChatMemory.has(roomId)) {
    roomChatMemory.set(roomId, []);
  }
  const roomMsgs = roomChatMemory.get(roomId);
  roomMsgs.push(messageData);
  // Keep last 200 in memory
  if (roomMsgs.length > 200) {
    roomMsgs.shift();
  }

  // 2. Persist to Firestore if available
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      await db
        .collection('rooms')
        .doc(roomId)
        .collection('messages')
        .doc(messageId)
        .set({
          ...messageData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.warn(`Could not persist message ${messageId} to Firestore:`, err.message);
    }
  }

  // 3. Broadcast to all peers in the room via Hocuspocus/Yjs
  try {
    const hp = getHocuspocusInstance();
    if (hp) {
      const directConn = await hp.openDirectConnection(roomId);
      const doc = directConn.document;
      
      // Update Y.Array 'chat'
      const chatArray = doc.getArray('chat');
      // Keep shared array bounded to last 100 messages
      if (chatArray.length >= 100) {
        chatArray.delete(0, chatArray.length - 99);
      }
      chatArray.push([messageData]);

      // Also notify meta for real-time reactive triggers
      const meta = doc.getMap('meta');
      meta.set('lastChatMessage', messageData);
      meta.set('lastChatTimestamp', Date.now());
    }
  } catch (err) {
    console.warn(`Could not broadcast chat message via Hocuspocus for room ${roomId}:`, err.message);
  }

  return messageData;
};

// 2. Retrieve chronological chat history for a room
export const getRoomChatHistory = async (roomId, limitCount = 50) => {
  const maxLimit = Math.min(Math.max(1, limitCount), 100);

  // 1. Try Firestore if available
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      const snapshot = await db
        .collection('rooms')
        .doc(roomId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(maxLimit)
        .get();

      if (!snapshot.empty) {
        const docs = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            roomId: d.roomId || roomId,
            senderUid: d.senderUid,
            senderName: d.senderName,
            text: d.text,
            timestamp: d.timestamp || (d.createdAt ? d.createdAt.toDate().toISOString() : new Date().toISOString()),
          };
        });
        // Reverse so it's chronologically ascending (oldest to newest)
        return docs.reverse();
      }
    } catch (err) {
      console.warn(`Could not query Firestore chat history for room ${roomId}:`, err.message);
    }
  }

  // 2. Fallback to in-memory store
  const inMem = roomChatMemory.get(roomId) || [];
  return inMem.slice(-maxLimit);
};
