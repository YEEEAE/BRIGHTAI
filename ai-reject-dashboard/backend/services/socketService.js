const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { logger } = require('../utils/logger');

// Presence tracking store (in-memory)
const activeUsers = new Map(); // socketId -> { userId, role, page, docNo, lastSeen }

let ioInstance = null;

function initSocketService(io) {
  ioInstance = io;

  // Authentication Middleware for Socket.io Handshake
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let token = null;

      // Extract access_token cookie
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, c) => {
          const parts = c.trim().split('=');
          acc[parts[0]] = parts[1];
          return acc;
        }, {});
        token = cookies['access_token'];
      }

      // Bypass if auth is not configured in .env
      if (!config.dashboardToken && !config.dashboardPasswordHash) {
        socket.user = { id: 'anonymous-operator', role: 'qc' };
        return next();
      }

      if (!token) {
        // Allow handshake query token as backup
        token = socket.handshake.auth?.token || socket.handshake.query?.token;
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret, { issuer: 'ai-reject-dashboard' });
      socket.user = {
        id: decoded.sub || 'dashboard-admin',
        role: decoded.role || 'admin'
      };
      
      return next();
    } catch (err) {
      logger.warn('socket_auth_failed', { message: err.message });
      return next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info('socket_connected', { socketId: socket.id, userId: user.id, role: user.role });

    // 1. Join room based on user role for segmented broadcasts
    const roleRoom = `room:${user.role.toLowerCase()}`;
    socket.join(roleRoom);

    // 2. Setup presence registry
    activeUsers.set(socket.id, {
      socketId: socket.id,
      userId: user.id,
      role: user.role,
      page: 'index.html',
      docNo: null,
      lastSeen: new Date().toISOString()
    });

    // Broadcast updated presence list
    broadcastPresence();

    // 3. Heartbeat listener
    socket.on('heartbeat', () => {
      const u = activeUsers.get(socket.id);
      if (u) {
        u.lastSeen = new Date().toISOString();
        activeUsers.set(socket.id, u);
      }
    });

    // 4. Presence Update: Page viewing changes
    socket.on('presence:viewing', (data) => {
      const u = activeUsers.get(socket.id);
      if (u) {
        u.page = data.page || 'index.html';
        u.docNo = data.docNo || null;
        u.lastSeen = new Date().toISOString();
        activeUsers.set(socket.id, u);
        broadcastPresence();
      }
    });

    // 5. Manual disconnection
    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      broadcastPresence();
      logger.info('socket_disconnected', { socketId: socket.id, userId: user.id });
    });
  });
}

function broadcastPresence() {
  if (!ioInstance) return;
  const list = Array.from(activeUsers.values());
  ioInstance.emit('presence:updated', {
    count: list.length,
    users: list
  });
}

// Global broadcast helpers
function emitGlobal(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
    return true;
  }
  return false;
}

function emitToRole(role, event, data) {
  if (ioInstance) {
    const roleRoom = `room:${role.toLowerCase()}`;
    ioInstance.to(roleRoom).emit(event, data);
    return true;
  }
  return false;
}

module.exports = {
  initSocketService,
  emitGlobal,
  emitToRole,
  activeUsers
};
