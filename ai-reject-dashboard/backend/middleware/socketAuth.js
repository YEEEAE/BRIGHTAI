/**
 * socketAuth.js — Socket.io JWT Authentication Middleware
 * AR: مصادقة اتصالات Socket.io عبر JWT وتوزيع الغرف حسب الأدوار.
 * EN: Authenticate Socket.io connections via JWT and assign rooms by role.
 */
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const config = require('../config/env');
const { logger } = require('../utils/logger');

const ACCESS_COOKIE = 'access_token';

/**
 * AR: يستخرج التوكن من الكوكيز أو الـ handshake auth.
 * EN: Extracts JWT from cookies or handshake auth header.
 */
function extractToken(socket) {
  // 1. Try cookies from handshake headers
  const rawCookies = socket.handshake.headers.cookie;
  if (rawCookies) {
    const parsed = cookie.parse(rawCookies);
    if (parsed[ACCESS_COOKIE]) return parsed[ACCESS_COOKIE];
  }

  // 2. Try auth object from client handshake
  if (socket.handshake.auth && socket.handshake.auth.token) {
    return socket.handshake.auth.token;
  }

  // 3. Try query parameter (least secure, fallback only)
  if (socket.handshake.query && socket.handshake.query.token) {
    return socket.handshake.query.token;
  }

  return null;
}

/**
 * AR: الغرف المتاحة حسب الأدوار.
 * EN: Available rooms by role.
 */
const ROLE_ROOMS = {
  admin: ['admin', 'finance', 'quality', 'production', 'executive'],
  executive: ['executive', 'finance'],
  finance: ['finance'],
  quality: ['quality'],
  production: ['production'],
  viewer: []
};

/**
 * AR: Middleware لمصادقة Socket.io.
 * EN: Socket.io authentication middleware.
 */
function socketAuthMiddleware(socket, next) {
  // AR: إذا لم يكن المصادقة مفعلة، نمرر بدون تحقق مع دور افتراضي admin.
  // EN: If no auth is configured, pass through with default admin role.
  if (!config.dashboardToken && !config.dashboardPasswordHash) {
    socket.user = { sub: 'anonymous', role: 'admin' };
    return next();
  }

  const token = extractToken(socket);
  if (!token) {
    logger.warn('socket_auth_failed', { reason: 'no_token', socketId: socket.id });
    return next(new Error('Authentication required'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { issuer: 'ai-reject-dashboard' });
    socket.user = { sub: payload.sub, role: payload.role || 'viewer' };
    return next();
  } catch (err) {
    logger.warn('socket_auth_failed', { reason: 'invalid_token', socketId: socket.id, error: err.message });
    return next(new Error('Invalid or expired token'));
  }
}

/**
 * AR: ينضم السوكت للغرف المناسبة حسب دوره بعد المصادقة.
 * EN: Join role-based rooms after successful authentication.
 */
function joinRoleRooms(socket) {
  const role = (socket.user && socket.user.role) || 'viewer';
  const rooms = ROLE_ROOMS[role] || [];

  // AR: كل مستخدم ينضم لغرفته الشخصية أيضاً.
  // EN: Every user also joins their personal room.
  socket.join(`user:${socket.user.sub}`);

  rooms.forEach((room) => {
    socket.join(`role:${room}`);
  });

  // AR: غرفة عامة للجميع.
  // EN: Broadcast room for all authenticated users.
  socket.join('broadcast');

  logger.info('socket_rooms_joined', {
    socketId: socket.id,
    userId: socket.user.sub,
    role,
    rooms: ['broadcast', `user:${socket.user.sub}`, ...rooms.map((r) => `role:${r}`)]
  });
}

module.exports = { socketAuthMiddleware, joinRoleRooms, ROLE_ROOMS };
