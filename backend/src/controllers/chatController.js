// Chat Controller: Handles in-room messaging endpoints with role checking and limits
import { saveAndBroadcastMessage, getRoomChatHistory } from '../services/chatService.js';
import { resolveUserRole } from '../services/roomService.js';
import { ENV_FLAGS } from '../config/envConfig.js';

export const postChatMessage = async (req, res) => {
  try {
    if (!ENV_FLAGS.CHAT_ENABLED) {
      return res.status(403).json({
        success: false,
        error: 'Live chat is currently disabled by system configuration.',
      });
    }

    const roomId = req.params.id;
    const uid = req.user?.uid;
    const senderName = req.user?.name || req.user?.displayName || req.user?.email?.split('@')[0] || 'CodeHive Peer';

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid user authentication required.',
      });
    }

    // Verify room access
    const userRole = await resolveUserRole(roomId, uid);
    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: `Room "${roomId}" not found or access denied.`,
      });
    }

    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message payload must include a "text" string property.',
      });
    }

    const senderPhotoURL = req.user?.photoURL || req.user?.picture || null;

    const message = await saveAndBroadcastMessage({
      roomId,
      senderUid: uid,
      senderName,
      senderPhotoURL,
      text,
    });

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    console.error('Post Chat Message Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process chat message.',
      details: error.message,
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    if (!ENV_FLAGS.CHAT_ENABLED) {
      return res.status(403).json({
        success: false,
        error: 'Live chat is currently disabled by system configuration.',
      });
    }

    const roomId = req.params.id;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid user authentication required.',
      });
    }

    const userRole = await resolveUserRole(roomId, uid);
    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: `Room "${roomId}" not found or access denied.`,
      });
    }

    const limit = parseInt(req.query.limit, 10) || 50;
    const messages = await getRoomChatHistory(roomId, limit);

    return res.status(200).json({
      success: true,
      roomId,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history.',
      details: error.message,
    });
  }
};
