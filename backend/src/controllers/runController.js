import { executeJudge0Code } from '../services/judge0Service.js';
import { SUPPORTED_LANGUAGES, getLanguageById } from '../config/languages.js';

const MAX_CODE_BYTES = 100 * 1024; // 100 KB code size cap per Architecture Section 5 & 8
const MAX_STDIN_BYTES = 10 * 1024; // 10 KB stdin cap

export const runCode = async (req, res) => {
  try {
    const { source_code, language_id, stdin } = req.body;

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

    return res.status(200).json({
      success: true,
      submission: {
        language: languageConfig.name,
        language_id: languageConfig.id,
        ...submissionResult,
      },
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
