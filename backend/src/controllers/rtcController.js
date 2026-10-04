// WebRTC Controller for Audio & Video Mesh Collaboration
import {
  getIceServersConfig,
  joinCall,
  leaveCall,
  updateMediaState,
  getCallParticipants,
  relaySignal,
  consumeSignals,
} from '../services/rtcService.js';

// 1. Get ICE STUN/TURN server configuration (GET /api/rtc/ice)
export const handleGetIceConfig = async (req, res) => {
  try {
    const iceServers = getIceServersConfig();
    return res.status(200).json({
      success: true,
      iceServers,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve ICE server configuration.',
      details: err.message,
    });
  }
};

// 2. Join a room call (POST /api/rtc/rooms/:id/join)
export const handleJoinCall = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { audio, video } = req.body || {};

    const result = await joinCall({
      roomId,
      user: req.user,
      audio,
      video,
    });

    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }
};

// 3. Leave a room call (POST /api/rtc/rooms/:id/leave)
export const handleLeaveCall = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const result = await leaveCall({
      roomId,
      uid: req.user.uid,
    });

    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }
};

// 4. Get active call status & participants (GET /api/rtc/rooms/:id/call)
export const handleGetCallStatus = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const result = getCallParticipants(roomId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch call status.',
      details: err.message,
    });
  }
};

// 5. Update media state (PATCH /api/rtc/rooms/:id/media)
export const handleUpdateMediaState = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { audio, video } = req.body || {};

    const result = await updateMediaState({
      roomId,
      uid: req.user.uid,
      audio,
      video,
    });

    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }
};

// 6. Relay WebRTC Signal (POST /api/rtc/rooms/:id/signal)
export const handleSendSignal = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { targetUid, type, payload } = req.body || {};

    const result = await relaySignal({
      roomId,
      senderUid: req.user.uid,
      senderName: req.user.name || req.user.displayName,
      targetUid,
      type,
      payload,
    });

    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }
};

// 7. Get and drain queued signals (GET /api/rtc/rooms/:id/signals)
export const handleGetSignals = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const result = consumeSignals({
      roomId,
      uid: req.user.uid,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve queued signals.',
      details: err.message,
    });
  }
};
