import { createRoom, getRoom, resolveUserRole } from '../services/roomService.js';
import { createTicket } from '../services/ticketService.js';

export const handleCreateRoom = async (req, res) => {
  try {
    const { name, language_id, linkAccess } = req.body;
    const ownerUid = req.user?.uid || 'demo-user';

    const room = await createRoom({
      name,
      language_id: language_id ? Number(language_id) : 63,
      linkAccess: linkAccess || 'editor',
      ownerUid,
      user: req.user,
    });

    return res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Create Room Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create collaboration room.',
      details: error.message,
    });
  }
};

export const handleGetRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await getRoom(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or access denied.',
      });
    }

    const userRole = await resolveUserRole(id, req.user?.uid);

    return res.status(200).json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        language: room.language,
        language_id: room.language_id,
        linkAccess: room.linkAccess,
        ownerUid: room.ownerUid,
        userRole: userRole || room.linkAccess || 'editor',
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error('Get Room Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve room details.',
    });
  }
};

export const handleGetRoomTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await getRoom(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found or access denied.',
      });
    }

    const role = await resolveUserRole(id, req.user?.uid);
    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this room.',
      });
    }

    // Generate single-use, 60s room-scoped ticket
    const ticketResult = createTicket({
      roomId: id,
      uid: req.user?.uid || 'demo-uid',
      role,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      ...ticketResult,
    });
  } catch (error) {
    console.error('Room Ticket Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate room ticket.',
      details: error.message,
    });
  }
};
