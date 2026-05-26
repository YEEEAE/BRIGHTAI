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
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        ...(config.isProduction ? { upgradeInsecureRequests: [] } : {})
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' }
  });
}

module.exports = { createCorsMiddleware, createHelmetMiddleware };
