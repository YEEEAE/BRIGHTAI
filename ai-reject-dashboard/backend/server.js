const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { Server } = require('socket.io');
const { socketAuthMiddleware, joinRoleRooms } = require('./middleware/socketAuth');
const notificationService = require('./services/notificationService');
const config = require('./config/env');
const { createCorsMiddleware, createHelmetMiddleware } = require('./config/security');
const apiRateLimit = require('./middleware/rate-limit');
const { sanitizeRequest } = require('./utils/sanitize');
const { logger } = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/error-handler');
const apiRoutes = require('./routes');
const { startExcelWatcher } = require('./watchers/excelWatcher');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.allowedOrigins,
    credentials: true
  }
});

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(createHelmetMiddleware());
app.use(createCorsMiddleware());
app.use(compression());
app.use(cookieParser(config.sessionSecret));
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(sanitizeRequest);
app.use(session({
  name: 'ai_reject_sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000
  }
}));

app.use('/api', apiRateLimit, apiRoutes);

const frontendRoot = path.join(config.projectRoot, 'frontend');
app.use('/assets', express.static(path.join(frontendRoot, 'assets'), { index: false, maxAge: '1h' }));
app.use('/components', express.static(path.join(frontendRoot, 'components'), { index: false, maxAge: '1h' }));
app.use('/pages', express.static(path.join(frontendRoot, 'pages'), { index: false, maxAge: '10m' }));
app.get('/', (req, res) => res.redirect('/pages/index.html'));

// AR: تمرير مرجع io للمسارات التي تحتاجه.
// EN: Make io accessible from routes via app.get('io').
app.set('io', io);

app.use('/api', notFound);
app.use(errorHandler);

// AR: تهيئة محرك الإشعارات مع مرجع Socket.io.
// EN: Initialize notification service with Socket.io reference.
notificationService.init(io);

// AR: مصادقة Socket.io عبر JWT وتوزيع الغرف.
// EN: Socket.io JWT authentication and room assignment.
io.use(socketAuthMiddleware);

// AR: تتبع المستخدمين المتصلين.
// EN: Track connected users for presence.
const connectedUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.user ? socket.user.sub : 'anonymous';
  const role = socket.user ? socket.user.role : 'viewer';

  // AR: الانضمام للغرف حسب الدور.
  joinRoleRooms(socket);

  // AR: تسجيل التواجد.
  if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
  connectedUsers.get(userId).add(socket.id);

  // AR: بث قائمة المستخدمين النشطين.
  io.to('broadcast').emit('presence:update', {
    active_users: connectedUsers.size,
    users: Array.from(connectedUsers.keys())
  });

  logger.info('socket_connected', { socketId: socket.id, userId, role });

  // AR: إرسال عدد الإشعارات غير المقروءة فور الاتصال.
  const unreadCount = notificationService.getUnreadCount(userId);
  socket.emit('notification:count', { count: unreadCount });

  // AR: إرسال الأنشطة الأخيرة.
  const recentActivity = notificationService.getActivityFeed(10);
  socket.emit('activity:init', { activities: recentActivity });

  // AR: الاستماع لتأكيد التنبيهات الحرجة.
  socket.on('notification:acknowledge', (data) => {
    if (data && data.id) {
      notificationService.acknowledge(userId, data.id);
      logger.info('notification_acknowledged', { userId, notificationId: data.id });
    }
  });

  // AR: الاستماع لتعليم القراءة.
  socket.on('notification:mark-read', (data) => {
    if (data && data.id) {
      notificationService.markRead(userId, data.id);
    }
  });

  // AR: عند قطع الاتصال.
  socket.on('disconnect', (reason) => {
    const userSockets = connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) connectedUsers.delete(userId);
    }

    io.to('broadcast').emit('presence:update', {
      active_users: connectedUsers.size,
      users: Array.from(connectedUsers.keys())
    });

    logger.info('socket_disconnected', { socketId: socket.id, userId, reason });
  });
});

startExcelWatcher(io);

server.listen(config.port, () => {
  logger.info('server_started', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    excelFilePath: config.excelFilePath,
    authRequired: Boolean(config.dashboardToken || config.dashboardPasswordHash)
  });
  logger.info(`Open http://localhost:${config.port}/pages/index.html`);
});
