// AI Controller: Handles AI debugging and AI code suggestion endpoints
import { debugCode, suggestCode } from '../services/aiService.js';
import { ENV_FLAGS } from '../config/envConfig.js';

export const handleDebug = async (req, res) => {
  try {
    if (!ENV_FLAGS.AI_ENABLED) {
      return res.status(503).json({
        success: false,
        error: 'AI assistance is currently disabled by system configuration.',
      });
    }

    const { code, language, stderr, stdin } = req.body;
    const uid = req.user?.uid || 'user';

    if (typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "code" field in request body.',
      });
    }

    if (typeof stderr !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "stderr" field in request body.',
      });
    }

    const debugResult = await debugCode({
      code,
      language: language || 'text',
      stderr,
      stdin: stdin || '',
      uid,
    });

    return res.status(200).json({
      success: true,
      debug: debugResult,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    console.error('AI Debug Controller Error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI debugging service encountered an error.',
      details: error.message,
    });
  }
};

export const handleSuggest = async (req, res) => {
  try {
    if (!ENV_FLAGS.AI_ENABLED) {
      return res.status(503).json({
        success: false,
        error: 'AI assistance is currently disabled by system configuration.',
      });
    }

    const { prefix, suffix, language } = req.body;
    const uid = req.user?.uid || 'user';

    if (typeof prefix !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "prefix" field in request body.',
      });
    }

    const suggestResult = await suggestCode({
      prefix,
      suffix: typeof suffix === 'string' ? suffix : '',
      language: language || 'text',
      uid,
    });

    return res.status(200).json({
      success: true,
      suggestion: suggestResult.suggestion,
      cached: Boolean(suggestResult.cached),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    console.error('AI Suggest Controller Error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI code suggestion service encountered an error.',
      details: error.message,
    });
  }
};
