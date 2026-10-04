import { Hocuspocus } from '@hocuspocus/server';
import crossws from 'crossws/adapters/node';
import * as Y from 'yjs';
import { verifyAndConsumeTicket } from './ticketService.js';
import { getRoom, updateRoomSnapshot } from './roomService.js';
import { getLanguageById } from '../config/languages.js';

let hocuspocusInstance = null;
let crosswsAdapter = null;

export const initCollabServer = (httpServer) => {
  hocuspocusInstance = new Hocuspocus({
    quiet: true,
    debounce: 2000,
    maxDebounce: 10000,

    async onAuthenticate(data) {
      const { token, documentName, connectionConfig } = data;

      // 1. Verify single-use room ticket
      const check = verifyAndConsumeTicket(token, documentName);
      if (!check.valid) {
        console.warn(`[Collab Auth Failed] Room ${documentName}:`, check.reason);
        throw new Error(`Authentication failed: ${check.reason}`);
      }

      const { role, user, uid } = check.data;

      // 2. Enforce viewer read-only status on the server
      if (role === 'viewer') {
        connectionConfig.readOnly = true;
      }

      console.log(`[Collab] User ${user.displayName} (${role}) authenticated for room: ${documentName}`);

      return {
        user,
        role,
        uid,
      };
    },

    async onLoadDocument(data) {
      const { document, documentName } = data;
      const room = await getRoom(documentName);

      // Check if room has saved state
      if (room?.state) {
        try {
          const binaryUpdate = Buffer.from(room.state, 'base64');
          Y.applyUpdate(document, binaryUpdate);
          return;
        } catch (e) {
          console.warn(`Error applying snapshot for room ${documentName}:`, e.message);
        }
      }

      // If document is empty, initialize default code template
      const ytext = document.getText('code');
      if (ytext.length === 0) {
        const langConfig = getLanguageById(room?.language_id || 63);
        ytext.insert(0, langConfig.defaultCode);

        const ymeta = document.getMap('meta');
        ymeta.set('language_id', langConfig.id);
        ymeta.set('language', langConfig.key);
        ymeta.set('stdin', '');
      }
    },

    async onStoreDocument(data) {
      const { document, documentName } = data;
      try {
        const update = Y.encodeStateAsUpdate(document);
        const base64 = Buffer.from(update).toString('base64');
        await updateRoomSnapshot(documentName, base64);
      } catch (err) {
        console.warn(`Error saving snapshot for room ${documentName}:`, err.message);
      }
    },
  });

  // WebSocket adapter powered by crossws
  crosswsAdapter = crossws({
    serverOptions: { maxPayload: 1024 * 1024 },
    hooks: {
      open: (peer) => {
        const clientConnection = hocuspocusInstance.handleConnection(
          peer.websocket,
          peer.request
        );
        peer._hocuspocus = clientConnection;
      },
      message: (peer, message) => {
        peer._hocuspocus?.handleMessage(message.uint8Array());
      },
      close: (peer, event) => {
        peer._hocuspocus?.handleClose({
          code: event.code,
          reason: event.reason,
        });
      },
      error: (peer, error) => {
        console.error('WebSocket error for peer:', peer.id, error);
      },
    },
  });

  // Attach upgrade listener to the same HTTP server
  httpServer.on('upgrade', (request, socket, head) => {
    try {
      crosswsAdapter.handleUpgrade(request, socket, head);
    } catch (err) {
      console.error('WebSocket upgrade error:', err);
      socket.destroy();
    }
  });

  console.log('✅ Hocuspocus Collab Server attached to HTTP server for WebSockets.');
  return hocuspocusInstance;
};

// Read code directly from server's in-memory room document per Architecture Section 6.2
export const getLiveRoomCode = async (roomId) => {
  if (!hocuspocusInstance) return null;
  try {
    const directConn = await hocuspocusInstance.openDirectConnection(roomId);
    const code = directConn.document.getText('code').toString();
    const meta = directConn.document.getMap('meta');
    const language_id = meta.get('language_id');
    const stdin = meta.get('stdin');

    return {
      code,
      language_id,
      stdin,
    };
  } catch (err) {
    console.warn(`Could not open direct connection to room ${roomId}:`, err.message);
    return null;
  }
};

export const getHocuspocusInstance = () => hocuspocusInstance;
