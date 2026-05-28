const cors = require('cors');
const helmet = require('helmet');
const config = require('./env');

function createCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      // AR: السماح لطلبات نفس الأصل وأدوات السيرفر، ورفض أي Origin غير مصرح.
      // EN: Allow same-origin/server requests and reject unknown browser origins.
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
}

function createHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', "'unsafe-eval'"],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc: ["'self'", 'fonts.gstatic.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: config.isProduction ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' }
  });
}

module.exports = { createCorsMiddleware, createHelmetMiddleware };
