const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { Server } = require('socket.io');
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

app.use('/api', notFound);
app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info('socket_connected', { socketId: socket.id });
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
