import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const WS_URL = import.meta.env.VITE_WS_URL || BACKEND_URL.replace(/^http/, 'ws');

// 1. Create a new collaboration room
export const createRoomAPI = async ({ name, language_id, linkAccess, idToken }) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`${BACKEND_URL}/api/rooms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: name || 'CodeHive Collaboration Room',
      language_id: Number(language_id) || 63,
      linkAccess: linkAccess || 'editor',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create room.');
  }
  return data.room;
};

// 2. Fetch room details
export const getRoomAPI = async (roomId, idToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`, {
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Room not found.');
  }
  return data.room;
};

// 3. Request 60-second single-use ticket for WebSocket authentication
export const getRoomTicketAPI = async (roomId, idToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/ticket`, {
    method: 'POST',
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to obtain room ticket.');
  }
  return data;
};

// Curated peer colors for collaborator cursors and badges
const PEER_COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export const getRandomColor = () => {
  return PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];
};

// 4. Initialize Hocuspocus Real-time Collaboration Provider
export const setupHocuspocusCollab = ({
  roomId,
  ticket,
  user,
  role,
  onStatusChange,
  onSynced,
  onPeersChange,
}) => {
  const ydoc = new Y.Doc();

  const provider = new HocuspocusProvider({
    url: WS_URL,
    name: roomId,
    token: ticket,
    document: ydoc,

    onStatus: ({ status }) => {
      // status: 'connecting' | 'connected' | 'disconnected'
      if (onStatusChange) {
        onStatusChange(status);
      }
    },

    onSynced: ({ state }) => {
      if (onSynced) {
        onSynced(state);
      }
    },

    onAwarenessUpdate: ({ states }) => {
      if (onPeersChange) {
        const peers = states
          .map((s) => {
            if (!s.user) return null;
            return {
              ...s.user,
              activeFile: s.activeFile || s.user.activeFile || 'main',
            };
          })
          .filter(Boolean);
        onPeersChange(peers);
      }
    },
  });

  // Set user awareness presence (name, color, role)
  const peerColor = getRandomColor();
  provider.setAwarenessField('user', {
    name: user?.displayName || user?.name || 'Hive Collaborator',
    email: user?.email || '',
    color: peerColor,
    role: role || 'editor',
  });

  const ytext = ydoc.getText('code');
  const ymeta = ydoc.getMap('meta');
  const filesMap = ydoc.getMap('files');

  return {
    ydoc,
    provider,
    ytext,
    ymeta,
    filesMap,
    destroy: () => {
      provider.destroy();
      ydoc.destroy();
    },
  };
};
