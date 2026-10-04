import crypto from 'crypto';
import { admin, isFirebaseAdminInitialized } from '../config/firebaseAdmin.js';

// In-memory cache for submissions
const submissionStore = new Map();

export const saveSubmission = async ({
  uid,
  language,
  language_id,
  code,
  stdin = '',
  stdout = null,
  stderr = null,
  compile_output = null,
  status = {},
  time = '0.000',
  roomId = null,
}) => {
  const submissionId = `sub_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();

  const submissionData = {
    id: submissionId,
    uid: uid || 'anonymous',
    language: language || 'Unknown',
    language_id: Number(language_id) || 63,
    code: code ? code.slice(0, 50000) : '',
    stdin: stdin ? stdin.slice(0, 10000) : '',
    stdout: stdout || null,
    stderr: stderr || null,
    compile_output: compile_output || null,
    status: status || { id: 3, description: 'Accepted' },
    time: String(time || '0.000'),
    roomId: roomId || null,
    createdAt: now,
  };

  submissionStore.set(submissionId, submissionData);

  // Persist to Cloud Firestore if initialized
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      await db.collection('submissions').doc(submissionId).set({
        ...submissionData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Submission ${submissionId} recorded in Cloud Firestore.`);
    } catch (err) {
      console.warn(`⚠️ Error saving submission ${submissionId} to Firestore:`, err.message);
    }
  }

  return submissionData;
};

export const getUserSubmissions = async (uid, limit = 20) => {
  if (!uid) return [];

  // 1. Try Firestore if available
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      const snapshot = await db
        .collection('submissions')
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
        }));
      }
    } catch (err) {
      console.warn(`Querying Firestore submissions for ${uid} failed:`, err.message);
    }
  }

  // 2. Fallback to in-memory store
  const userSubs = [];
  for (const sub of submissionStore.values()) {
    if (sub.uid === uid) {
      userSubs.push(sub);
    }
  }

  return userSubs
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};
