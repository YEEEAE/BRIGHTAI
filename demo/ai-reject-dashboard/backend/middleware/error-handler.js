const { logger } = require('../utils/logger');

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  logger.error('request_error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Internal server error' : err.message
  });
}

module.exports = { notFound, errorHandler };
