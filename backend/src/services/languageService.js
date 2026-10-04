// Language Management Service for Admin Control & Runtime Validation
// Supports enabling/disabling languages with persistence and audit logging

import { SUPPORTED_LANGUAGES } from '../config/languages.js';
import { admin, isFirebaseAdminInitialized } from '../config/firebaseAdmin.js';
import { logAdminAction } from './adminService.js';

// In-memory store for fast lookups
const languageStatusMap = new Map();

// Initialize all default languages as enabled
SUPPORTED_LANGUAGES.forEach((lang) => {
  languageStatusMap.set(lang.id, {
    ...lang,
    enabled: true,
  });
});

// Load language status overrides from Cloud Firestore if available
export const initLanguagesFromFirestore = async () => {
  if (!isFirebaseAdminInitialized) return;
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('languages').get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = Number(doc.id);
      if (languageStatusMap.has(id)) {
        languageStatusMap.set(id, {
          ...languageStatusMap.get(id),
          enabled: data.enabled !== false,
        });
      }
    });
    console.log('✅ Loaded language configurations from Firestore.');
  } catch (err) {
    console.warn('⚠️ Could not load language configurations from Firestore:', err.message);
  }
};

// Get all languages with their enabled status (for Admin panel)
export const getAllLanguages = () => {
  return Array.from(languageStatusMap.values());
};

// Get only enabled languages (for normal users and IDE dropdown)
export const getEnabledLanguages = () => {
  return Array.from(languageStatusMap.values()).filter((l) => l.enabled !== false);
};

// Check if a specific language ID is enabled
export const isLanguageEnabled = (languageId) => {
  const lang = languageStatusMap.get(Number(languageId));
  return lang ? lang.enabled !== false : false;
};

// Toggle or set language status
export const setLanguageEnabled = async (languageId, enabled, adminUid = 'admin') => {
  const id = Number(languageId);
  if (!languageStatusMap.has(id)) {
    throw new Error(`Language with ID ${id} not found.`);
  }

  const lang = languageStatusMap.get(id);
  lang.enabled = Boolean(enabled);
  languageStatusMap.set(id, lang);

  // Persist to Cloud Firestore if initialized
  if (isFirebaseAdminInitialized) {
    try {
      const db = admin.firestore();
      await db.collection('languages').doc(String(id)).set({
        id,
        name: lang.name,
        key: lang.key,
        enabled: lang.enabled,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: adminUid,
      }, { merge: true });
    } catch (err) {
      console.warn(`Could not persist language ${id} to Firestore:`, err.message);
    }
  }

  // Log action to Admin Audit Log
  await logAdminAction({
    action: enabled ? 'LANGUAGE_ENABLED' : 'LANGUAGE_DISABLED',
    target: lang.name,
    targetId: String(id),
    adminUid,
    details: `Administrator ${enabled ? 'enabled' : 'disabled'} ${lang.name} (ID: ${id})`,
  });

  return lang;
};
