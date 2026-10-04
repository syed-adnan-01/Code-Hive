import { executeJudge0Code } from '../services/judge0Service.js';
import { SUPPORTED_LANGUAGES, getLanguageById } from '../config/languages.js';
import { getLiveRoomCode, broadcastRoomRunResult } from '../services/collabService.js';
import { resolveUserRole } from '../services/roomService.js';
import { saveSubmission, getUserSubmissions } from '../services/submissionService.js';

const MAX_CODE_BYTES = 100 * 1024; // 100 KB code size cap per Architecture Section 5 & 8
const MAX_STDIN_BYTES = 10 * 1024; // 10 KB stdin cap

export const runCode = async (req, res) => {
  try {
    let { source_code, language_id, stdin, roomId, fileId } = req.body;
    const uid = req.user?.uid || 'demo-user';

    // If roomId is provided, check role and read live code (Architecture Section 6.2 & Extension Plan Section 3)
    let executionFilename = null;
    if (roomId) {
      const userRole = await resolveUserRole(roomId, uid);
      if (userRole === 'viewer') {
        return res.status(403).json({
          success: false,
          error: 'Viewers have read-only access and cannot execute code in this room.',
        });
      }

      const roomLive = await getLiveRoomCode(roomId, fileId);
      if (roomLive && roomLive.code) {
        source_code = roomLive.code;
        executionFilename = roomLive.filename;
        if (!language_id && roomLive.language_id) {
          language_id = roomLive.language_id;
        }
        if (!stdin && roomLive.stdin) {
          stdin = roomLive.stdin;
        }
      }
    }

    // 1. Validate source code
    if (!source_code || typeof source_code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "source_code". Source code must be a non-empty string.',
      });
    }

    if (Buffer.byteLength(source_code, 'utf8') > MAX_CODE_BYTES) {
      return res.status(400).json({
        success: false,
        error: `Source code exceeds the maximum allowable size of ${MAX_CODE_BYTES / 1024} KB.`,
      });
    }

    // 2. Validate language ID
    if (!language_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing "language_id". Please select a supported programming language.',
      });
    }

    const languageConfig = getLanguageById(language_id);
    if (!languageConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language_id: ${language_id}. Supported languages: ${SUPPORTED_LANGUAGES.map((l) => `${l.name} (${l.id})`).join(', ')}`,
      });
    }

    // 3. Validate stdin (optional)
    if (stdin && typeof stdin === 'string' && Buffer.byteLength(stdin, 'utf8') > MAX_STDIN_BYTES) {
      return res.status(400).json({
        success: false,
        error: `Standard input (stdin) exceeds the maximum allowable size of ${MAX_STDIN_BYTES / 1024} KB.`,
      });
    }

    // 4. Execute via Judge0
    const submissionResult = await executeJudge0Code({
      source_code,
      language_id: Number(language_id),
      stdin: typeof stdin === 'string' ? stdin : '',
    });

    const fullSubmission = {
      language: languageConfig.name,
      language_id: languageConfig.id,
      filename: executionFilename,
      fileId: fileId || null,
      ...submissionResult,
    };

    // 5. Save submission to history (Architecture Section 5: submissions collection)
    await saveSubmission({
      uid,
      language: languageConfig.name,
      language_id: languageConfig.id,
      code: source_code,
      stdin: stdin || '',
      stdout: submissionResult.stdout,
      stderr: submissionResult.stderr,
      compile_output: submissionResult.compile_output,
      status: submissionResult.status,
      time: submissionResult.time,
      roomId: roomId || null,
    });

    // 6. If inside a room, broadcast result to all collaborators (Architecture Section 6.2 & 7)
    if (roomId) {
      await broadcastRoomRunResult(roomId, fullSubmission);
    }

    return res.status(200).json({
      success: true,
      submission: fullSubmission,
      file: executionFilename ? {
        name: executionFilename,
        fileId: fileId || null,
        language: languageConfig.name,
        language_id: languageConfig.id,
      } : null,
    });
  } catch (error) {
    console.error('Run Controller Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Execution service error.',
      details: error.message,
    });
  }
};

export const getLanguages = (req, res) => {
  res.status(200).json({
    success: true,
    languages: SUPPORTED_LANGUAGES,
  });
};

export const getHistory = async (req, res) => {
  try {
    const uid = req.user?.uid;
    const history = await getUserSubmissions(uid, 25);
    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Get History Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch execution history.',
    });
  }
};
