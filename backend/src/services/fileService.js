// File Management Service
// Enforces rules and constraints per IDE Extension Plan Section 3:
// - Max 20 files per room
// - Max 100 KB per file
// - Max 400 KB total workspace code size
// - File naming rules: alphanumeric, dot, dash, underscore (max 64 chars, no slashes or '..')

import { FILE_LIMITS } from '../config/envConfig.js';

export const validateFileName = (name, existingFileNames = []) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'File name cannot be empty.' };
  }

  const trimmed = name.trim();

  if (trimmed.length > FILE_LIMITS.MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: `File name exceeds maximum length of ${FILE_LIMITS.MAX_FILENAME_LENGTH} characters.`,
    };
  }

  // Letters, digits, dot, dash, underscore only
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'File name may only contain letters, numbers, dots, dashes, and underscores.',
    };
  }

  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    return {
      valid: false,
      error: 'File name contains invalid directory traversal characters.',
    };
  }

  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return {
      valid: false,
      error: 'File name cannot begin or end with a dot.',
    };
  }

  // Check uniqueness (case-insensitive for safety)
  const isDuplicate = existingFileNames.some(
    (existing) => existing.toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return {
      valid: false,
      error: `A file named "${trimmed}" already exists in this workspace.`,
    };
  }

  return { valid: true, name: trimmed };
};

export const validateRoomFileLimits = (filesMap, newFileBytes = 0) => {
  let fileList = [];
  if (filesMap) {
    if (typeof filesMap.values === 'function') {
      fileList = Array.from(filesMap.values());
    } else if (typeof filesMap === 'object') {
      fileList = Object.values(filesMap);
    }
  }

  const currentCount = fileList.length;

  if (currentCount >= FILE_LIMITS.MAX_FILES_PER_ROOM) {
    return {
      valid: false,
      error: `Cannot add file: Room has reached the maximum limit of ${FILE_LIMITS.MAX_FILES_PER_ROOM} files.`,
    };
  }

  if (newFileBytes > FILE_LIMITS.MAX_FILE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of ${FILE_LIMITS.MAX_FILE_BYTES / 1024} KB.`,
    };
  }

  // Calculate current total workspace size
  let currentTotalBytes = 0;
  for (const fileEntry of fileList) {
    if (!fileEntry) continue;
    let text = '';
    if (typeof fileEntry.get === 'function') {
      const textVal = fileEntry.get('text');
      text = textVal ? textVal.toString() : '';
    } else if (fileEntry.text) {
      text = typeof fileEntry.text.toString === 'function' ? fileEntry.text.toString() : String(fileEntry.text);
    }
    if (text) {
      const byteLen = Buffer.byteLength(text, 'utf8');
      if (byteLen > FILE_LIMITS.MAX_FILE_BYTES) {
        return {
          valid: false,
          error: `File exceeds maximum allowed size of ${FILE_LIMITS.MAX_FILE_BYTES / 1024} KB.`,
        };
      }
      currentTotalBytes += byteLen;
    }
  }

  if (currentTotalBytes + newFileBytes > FILE_LIMITS.MAX_TOTAL_WORKSPACE_BYTES) {
    return {
      valid: false,
      error: `Total workspace code exceeds the ${FILE_LIMITS.MAX_TOTAL_WORKSPACE_BYTES / 1024} KB limit.`,
    };
  }

  return { valid: true };
};
