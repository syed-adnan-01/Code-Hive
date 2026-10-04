// CodeHive WebRTC Audio & Video Client Service
// Interacts with backend RTC endpoints for STUN/TURN configs and mesh signalling
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const getHeaders = (idToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  return headers;
};

// 1. Fetch ICE STUN/TURN servers
export const fetchIceServersAPI = async (idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/rtc/ice`, {
    method: 'GET',
    headers: getHeaders(idToken),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch ICE configuration.');
  }

  return data.iceServers || [];
};

// 2. Join room call
export const joinCallAPI = async ({ roomId, audio = true, video = false, idToken }) => {
  const res = await fetch(`${BACKEND_URL}/api/rtc/rooms/${roomId}/join`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({ audio, video }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to join call.');
  }

  return data;
};

// 3. Leave room call
export const leaveCallAPI = async ({ roomId, idToken }) => {
  const res = await fetch(`${BACKEND_URL}/api/rtc/rooms/${roomId}/leave`, {
    method: 'POST',
    headers: getHeaders(idToken),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to leave call.');
  }

  return data;
};

// 4. Fetch active call status
export const getCallStatusAPI = async (roomId, idToken) => {
  const res = await fetch(`${BACKEND_URL}/api/rtc/rooms/${roomId}/call`, {
    method: 'GET',
    headers: getHeaders(idToken),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to retrieve call status.');
  }

  return data;
};

// 5. Update media state (mic mute / camera toggle)
export const updateMediaStateAPI = async ({ roomId, audio, video, idToken }) => {
  const res = await fetch(`${BACKEND_URL}/api/rtc/rooms/${roomId}/media`, {
    method: 'PATCH',
    headers: getHeaders(idToken),
    body: JSON.stringify({ audio, video }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update media state.');
  }

  return data;
};

// 6. Send WebRTC signal (offer, answer, candidate)
export const sendSignalAPI = async ({ roomId, targetUid, type, payload, idToken }) => {
  const res = await fetch(`${BACKEND_URL}/api/rtc/rooms/${roomId}/signal`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({ targetUid, type, payload }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to relay WebRTC signal.');
  }

  return data;
};

// 7. Retrieve and drain queued signals
export const fetchSignalsAPI = async ({ roomId, idToken }) => {
  const res = await fetch(`${BACKEND_URL}/api/rtc/rooms/${roomId}/signals`, {
    method: 'GET',
    headers: getHeaders(idToken),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch queued signals.');
  }

  return data.signals || [];
};
