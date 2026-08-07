export const getUserProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Authenticated user profile retrieved successfully',
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name || req.user.displayName || 'CodeHive User',
        picture: req.user.picture || req.user.photoURL || null,
        isDemoUser: req.user.isDemoUser || false,
      },
      workspaceInfo: {
        activeRooms: 4,
        role: 'Collaborator',
        systemStatus: 'Operational',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
};

export const getHealthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'CodeHive Backend API',
    timestamp: new Date().toISOString(),
  });
};
