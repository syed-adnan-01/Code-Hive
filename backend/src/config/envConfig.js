// Environment & Feature Flags Configuration
// Allows toggling features for demonstrations or maintenance (IDE Extension Plan Section 2)

export const ENV_FLAGS = {
  FILE_MANAGEMENT_ENABLED: process.env.FILE_MANAGEMENT_ENABLED !== 'false',
  AI_ENABLED: process.env.AI_ENABLED !== 'false',
  CALLS_ENABLED: process.env.CALLS_ENABLED !== 'false',
  CHAT_ENABLED: process.env.CHAT_ENABLED !== 'false',
  ADMIN_ENABLED: process.env.ADMIN_ENABLED !== 'false',
};

export const CALL_LIMITS = {
  MAX_PARTICIPANTS_PER_CALL: 4, // Mesh topology limit (IDE Extension Plan Section 7)
  MAX_SIGNAL_QUEUE_SIZE: 100, // Max pending signals per peer
  SIGNAL_TTL_MS: 45000, // 45 second signal lifetime
};

export const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const AI_LIMITS = {
  MAX_DEBUG_CODE_BYTES: 50 * 1024, // 50 KB trimmed file cap for AI debugging
  MAX_STDERR_BYTES: 10 * 1024, // 10 KB stderr cap
  MAX_SUGGEST_PREFIX_LINES: 60,
  MAX_SUGGEST_SUFFIX_LINES: 20,
  AI_TIMEOUT_MS: 15000, // 15 second request timeout
  DAILY_USER_AI_LIMIT: 100, // Max AI invocations per user per day
};

export const FILE_LIMITS = {
  MAX_FILES_PER_ROOM: 20,
  MAX_FILE_BYTES: 100 * 1024, // 100 KB per file
  MAX_TOTAL_WORKSPACE_BYTES: 400 * 1024, // 400 KB total code cap
  MAX_FILENAME_LENGTH: 64,
  SNAPSHOT_WARNING_BYTES: 700 * 1024, // 700 KB warning threshold
  SNAPSHOT_MAX_BYTES: 1020 * 1024, // 1 MiB hard cap (Firestore limit)
};
