// WebRTC Audio & Video Call Service for Collaborative Rooms (IDE Extension Plan Section 7)
// Manages mesh topology (max 4 participants), STUN/TURN ICE configs, and secure signalling relay
import crypto from 'crypto';
import { ENV_FLAGS, CALL_LIMITS, DEFAULT_ICE_SERVERS } from '../config/envConfig.js';
import { getHocuspocusInstance } from './collabService.js';

// In-memory active calls: roomId -> Map<uid, participant>
const activeRoomCalls = new Map();

// In-memory signal queues: `${roomId}:${targetUid}` -> Array<signal>
const signalQueues = new Map();

// Helper to get or create room call map
const getRoomCallMap = (roomId) => {
  if (!activeRoomCalls.has(roomId)) {
    activeRoomCalls.set(roomId, new Map());
  }
  return activeRoomCalls.get(roomId);
};

// Helper to broadcast call state via Hocuspocus Yjs doc meta
const broadcastCallMeta = async (roomId, participants) => {
  try {
    const hp = getHocuspocusInstance();
    if (hp) {
      const directConn = await hp.openDirectConnection(roomId);
      const meta = directConn.document.getMap('meta');
      meta.set('activeCallParticipants', participants);
      meta.set('lastCallUpdateTimestamp', Date.now());
    }
  } catch (err) {
    // Non-fatal if direct connection cannot be opened in unit test environment
  }
};

// 1. Get ICE servers configuration
export const getIceServersConfig = () => {
  const servers = [...DEFAULT_ICE_SERVERS];

  // Optional custom TURN server configuration from environment
  if (process.env.TURN_SERVER_URL) {
    servers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME || 'codehive_user',
      credential: process.env.TURN_CREDENTIAL || 'codehive_secret',
    });
  }

  return servers;
};

// 2. Join active room call (Enforces max 4 participants per Section 7)
export const joinCall = async ({ roomId, user, audio = true, video = false }) => {
  if (!ENV_FLAGS.CALLS_ENABLED) {
    const err = new Error('Audio and video calls are currently disabled by system administrator.');
    err.statusCode = 503;
    throw err;
  }

  if (!roomId) {
    const err = new Error('Room ID is required to join a call.');
    err.statusCode = 400;
    throw err;
  }

  const roomCall = getRoomCallMap(roomId);

  // Clean up stale participants (no heartbeat in > 90 seconds)
  const now = Date.now();
  for (const [uid, participant] of roomCall.entries()) {
    if (now - participant.lastHeartbeat > 90000) {
      roomCall.delete(uid);
    }
  }

  // Enforce 4 participants limit (WebRTC mesh topology restriction)
  if (roomCall.size >= CALL_LIMITS.MAX_PARTICIPANTS_PER_CALL && !roomCall.has(user.uid)) {
    const err = new Error(`Call is full. WebRTC mesh supports a maximum of ${CALL_LIMITS.MAX_PARTICIPANTS_PER_CALL} participants per room.`);
    err.statusCode = 400;
    throw err;
  }

  const participant = {
    uid: user.uid,
    name: user.name || user.displayName || 'Collaborator Bee',
    role: user.role || 'editor',
    audio: Boolean(audio),
    video: Boolean(video),
    joinedAt: roomCall.get(user.uid)?.joinedAt || now,
    lastHeartbeat: now,
  };

  roomCall.set(user.uid, participant);

  const participantsList = Array.from(roomCall.values());
  await broadcastCallMeta(roomId, participantsList);

  return {
    success: true,
    participant,
    participants: participantsList,
    iceServers: getIceServersConfig(),
  };
};

// 3. Leave active room call
export const leaveCall = async ({ roomId, uid }) => {
  const roomCall = getRoomCallMap(roomId);
  const existed = roomCall.delete(uid);

  // Clear queued signals for this user
  signalQueues.delete(`${roomId}:${uid}`);

  if (roomCall.size === 0) {
    activeRoomCalls.delete(roomId);
  }

  const remainingParticipants = roomCall.size > 0 ? Array.from(roomCall.values()) : [];
  await broadcastCallMeta(roomId, remainingParticipants);

  return {
    success: true,
    exited: Boolean(existed),
    remainingCount: remainingParticipants.length,
  };
};

// 4. Update audio / video media state (mute, camera toggle)
export const updateMediaState = async ({ roomId, uid, audio, video }) => {
  const roomCall = getRoomCallMap(roomId);
  const participant = roomCall.get(uid);

  if (!participant) {
    const err = new Error('User is not an active participant in this room call.');
    err.statusCode = 404;
    throw err;
  }

  if (typeof audio === 'boolean') participant.audio = audio;
  if (typeof video === 'boolean') participant.video = video;
  participant.lastHeartbeat = Date.now();

  const participantsList = Array.from(roomCall.values());
  await broadcastCallMeta(roomId, participantsList);

  return {
    success: true,
    participant,
  };
};

// 5. Get current active call participants in a room
export const getCallParticipants = (roomId) => {
  const roomCall = getRoomCallMap(roomId);
  const now = Date.now();

  // Filter out any stale heartbeats
  for (const [uid, participant] of roomCall.entries()) {
    if (now - participant.lastHeartbeat > 90000) {
      roomCall.delete(uid);
    }
  }

  return {
    success: true,
    roomId,
    activeCount: roomCall.size,
    maxParticipants: CALL_LIMITS.MAX_PARTICIPANTS_PER_CALL,
    participants: Array.from(roomCall.values()),
  };
};

// 6. Relay WebRTC Signal (SDP offer, SDP answer, ICE candidate)
// Security: Server strictly verifies and stamps senderUid/senderName
export const relaySignal = async ({ roomId, senderUid, senderName, targetUid, type, payload }) => {
  if (!roomId || !targetUid || !type || !payload) {
    const err = new Error('Missing required signalling fields: roomId, targetUid, type, and payload.');
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ['offer', 'answer', 'candidate', 'call-ended', 'ping'];
  if (!validTypes.includes(type)) {
    const err = new Error(`Invalid signal type "${type}". Must be one of: ${validTypes.join(', ')}.`);
    err.statusCode = 400;
    throw err;
  }

  if (senderUid === targetUid) {
    const err = new Error('Cannot send WebRTC signal to oneself.');
    err.statusCode = 400;
    throw err;
  }

  const signalKey = `${roomId}:${targetUid}`;
  if (!signalQueues.has(signalKey)) {
    signalQueues.set(signalKey, []);
  }

  const queue = signalQueues.get(signalKey);
  const now = Date.now();

  // Remove expired signals older than SIGNAL_TTL_MS
  while (queue.length > 0 && now - queue[0].timestamp > CALL_LIMITS.SIGNAL_TTL_MS) {
    queue.shift();
  }

  if (queue.length >= CALL_LIMITS.MAX_SIGNAL_QUEUE_SIZE) {
    queue.shift(); // Evict oldest if queue full
  }

  const signalId = `sig_${now}_${crypto.randomBytes(4).toString('hex')}`;
  const signalData = {
    id: signalId,
    roomId,
    senderUid, // Server-stamped UID to prevent spoofing
    senderName: senderName || 'Collaborator Bee',
    targetUid,
    type,
    payload,
    timestamp: now,
  };

  queue.push(signalData);

  // Broadcast signal alert via Yjs meta for instant reactive delivery
  try {
    const hp = getHocuspocusInstance();
    if (hp) {
      const directConn = await hp.openDirectConnection(roomId);
      const meta = directConn.document.getMap('meta');
      meta.set('lastCallSignal', {
        id: signalId,
        to: targetUid,
        from: senderUid,
        type,
        timestamp: now,
      });
    }
  } catch (err) {
    // Non-fatal if collab server is not available
  }

  return {
    success: true,
    signalId,
    targetUid,
    type,
  };
};

// 7. Consume (fetch and drain) queued signals for a participant
export const consumeSignals = ({ roomId, uid }) => {
  const signalKey = `${roomId}:${uid}`;
  const queue = signalQueues.get(signalKey) || [];

  const now = Date.now();
  // Filter out any stale signals
  const validSignals = queue.filter((sig) => now - sig.timestamp <= CALL_LIMITS.SIGNAL_TTL_MS);

  // Drain the queue once read
  signalQueues.delete(signalKey);

  // Update participant's heartbeat
  const roomCall = activeRoomCalls.get(roomId);
  if (roomCall && roomCall.has(uid)) {
    roomCall.get(uid).lastHeartbeat = now;
  }

  return {
    success: true,
    signals: validSignals,
  };
};
