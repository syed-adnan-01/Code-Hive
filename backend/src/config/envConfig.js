// Environment & Feature Flags Configuration
// Allows toggling features for demonstrations or maintenance (IDE Extension Plan Section 2)

export const ENV_FLAGS = {
  FILE_MANAGEMENT_ENABLED: process.env.FILE_MANAGEMENT_ENABLED !== 'false',
  AI_ENABLED: process.env.AI_ENABLED === 'true',
  CALLS_ENABLED: process.env.CALLS_ENABLED === 'true',
  CHAT_ENABLED: process.env.CHAT_ENABLED !== 'false',
  ADMIN_ENABLED: process.env.ADMIN_ENABLED !== 'false',
};

export const FILE_LIMITS = {
  MAX_FILES_PER_ROOM: 20,
  MAX_FILE_BYTES: 100 * 1024, // 100 KB per file
  MAX_TOTAL_WORKSPACE_BYTES: 400 * 1024, // 400 KB total code cap
  MAX_FILENAME_LENGTH: 64,
  SNAPSHOT_WARNING_BYTES: 700 * 1024, // 700 KB warning threshold
  SNAPSHOT_MAX_BYTES: 1020 * 1024, // 1 MiB hard cap (Firestore limit)
};
