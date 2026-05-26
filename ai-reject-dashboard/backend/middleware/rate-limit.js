const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const apiRateLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

module.exports = apiRateLimit;
