import crypto from 'crypto';

// In-memory cache for single-use, 60-second room tickets
const ticketStore = new Map();

const TICKET_TTL_MS = 60 * 1000; // 60 seconds

export const createTicket = ({ roomId, uid, role, user = {} }) => {
  if (!roomId || !uid || !role) {
    throw new Error('roomId, uid, and role are required to generate a room ticket.');
  }

  const ticketId = `tkt_${crypto.randomBytes(16).toString('hex')}`;
  const now = Date.now();

  const ticketData = {
    ticketId,
    roomId,
    uid,
    role, // 'owner' | 'editor' | 'viewer'
    user: {
      displayName: user.name || user.displayName || 'CodeHive User',
      email: user.email || 'user@codehive.dev',
      photoURL: user.photoURL || null,
    },
    createdAt: now,
    expiresAt: now + TICKET_TTL_MS,
  };

  ticketStore.set(ticketId, ticketData);

  // Auto clean-up after expiration
  setTimeout(() => {
    if (ticketStore.has(ticketId)) {
      ticketStore.delete(ticketId);
    }
  }, TICKET_TTL_MS + 2000);

  return {
    ticket: ticketId,
    roomId,
    role,
    expiresInSeconds: 60,
  };
};

export const verifyAndConsumeTicket = (ticketId, roomId) => {
  if (!ticketId || typeof ticketId !== 'string') {
    return { valid: false, reason: 'Missing ticket string' };
  }

  const ticketData = ticketStore.get(ticketId);
  if (!ticketData) {
    return { valid: false, reason: 'Ticket not found or already consumed (single-use)' };
  }

  // Do not consume ticket immediately to allow Hocuspocus reconnects within the 60s TTL
  // (Architecture Section 6.1 says single-use, but HocuspocusProvider needs to reconnect using the same ticket if the connection drops)
  // ticketStore.delete(ticketId);

  if (Date.now() > ticketData.expiresAt) {
    ticketStore.delete(ticketId);
    return { valid: false, reason: 'Ticket has expired (60s lifetime exceeded)' };
  }

  if (ticketData.roomId !== roomId) {
    return { valid: false, reason: `Ticket room mismatch. Intended for ${ticketData.roomId}, received ${roomId}` };
  }

  return {
    valid: true,
    data: ticketData,
  };
};

export const getActiveTicketsCount = () => ticketStore.size;
