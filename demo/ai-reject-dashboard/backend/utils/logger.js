const path = require('path');
const winston = require('winston');
const config = require('../config/env');

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: path.join(config.projectRoot, 'logs', 'app.log') }),
    new winston.transports.File({ filename: path.join(config.projectRoot, 'logs', 'error.log'), level: 'error' })
  ]
});

function audit(action, req, details) {
  // AR: سجل تدقيق مختصر بدون حفظ أسرار أو كلمات مرور.
  // EN: Compact audit event without storing secrets or passwords.
  logger.info('audit', {
    action,
    ip: req.ip,
    userId: req.user ? req.user.sub : null,
    details: details || null
  });
}

module.exports = { logger, audit };
