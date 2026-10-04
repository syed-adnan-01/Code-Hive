import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const WS_URL = import.meta.env.VITE_WS_URL || BACKEND_URL.replace(/^http/, 'ws');

// Session & Role resolution helpers for multi-tab collaboration
export const getTabSessionId = () => {
  let tabId = sessionStorage.getItem('codehive_tab_session_id');
  if (!tabId) {
    tabId = Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem('codehive_tab_session_id', tabId);
  }
  return tabId;
};

export const isTabRoomCreator = (roomId) => {
  if (!roomId) return false;
  return sessionStorage.getItem(`codehive_created_${roomId}`) === 'true';
};

export const markTabRoomAsCreated = (roomId) => {
  if (!roomId) return;
  sessionStorage.setItem(`codehive_created_${roomId}`, 'true');
};

export const getAuthTokenForRoom = async (roomId, currentUser) => {
  // If real live Firebase user with getIdToken
  if (currentUser && !currentUser.isDemo && typeof currentUser.getIdToken === 'function') {
    return await currentUser.getIdToken();
  }

  // Demo mode session resolution:
  const tabId = getTabSessionId();
  if (!roomId) {
    // When creating a new room
    return `demo-owner_${tabId}-token`;
  }

  if (isTabRoomCreator(roomId)) {
    // This tab created the room: send owner token
    return `demo-owner_${tabId}-token`;
  }

  // This tab joined a shared room: send unique collaborator token
  return `demo-collab_${tabId}-token`;
};

export const getUidForRoom = (roomId, currentUser) => {
  if (currentUser && !currentUser.isDemo && currentUser.uid) {
    return currentUser.uid;
  }
  const tabId = getTabSessionId();
  if (!roomId || isTabRoomCreator(roomId)) {
    return `demo-owner_${tabId}-uid`;
  }
  return `demo-collab_${tabId}-uid`;
};

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
  const tabId = getTabSessionId();
  const isOwner = role === 'owner';
  const roleLabel = isOwner ? 'Owner' : (role === 'viewer' ? 'Viewer' : 'Collaborator');
  const baseName = user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : null);
  const defaultDisplayName = baseName
    ? `${baseName} (${roleLabel})`
    : (isOwner ? 'Room Owner' : `Collaborator ${tabId.slice(0, 4).toUpperCase()}`);

  provider.setAwarenessField('user', {
    name: defaultDisplayName,
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
