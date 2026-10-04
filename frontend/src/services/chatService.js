// Frontend Service for Room Live Chat (IDE Extension Plan Section 5)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const getHeaders = (idToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  } else {
    headers['Authorization'] = 'Bearer demo-user-token';
  }
  return headers;
};

// 1. Fetch room chat history (last 50 messages)
export const fetchRoomMessages = async (roomId, idToken) => {
  if (!roomId) return [];
  const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/messages`, {
    headers: getHeaders(idToken),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch messages');
  }
  return data.messages || [];
};

// 2. Post a chat message
export const postRoomMessage = async (roomId, text, idToken) => {
  if (!roomId) throw new Error('Room ID is required.');
  if (!text || !text.trim()) throw new Error('Message cannot be empty.');

  const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: getHeaders(idToken),
    body: JSON.stringify({ text: text.trim() }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send message');
  }
  return data.message;
};
