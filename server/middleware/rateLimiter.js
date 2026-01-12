/**
 * Rate Limiter Middleware
 * Implements IP-based rate limiting for AI endpoints
 * Requirements: 23.5
 */

const { config } = require('../config/index');

// Store request counts per IP
const requestCounts = new Map();

// Arabic error messages
const RATE_LIMIT_ERROR_AR = 'عذراً، لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.';

/**
 * Clean up old entries from the rate limit store
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.windowStart > config.rateLimit.windowMs) {
      requestCounts.delete(ip);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupOldEntries, 60 * 1000);

/**
 * Check if an IP has exceeded the rate limit
 * @param {string} ip - Client IP address
 * @returns {boolean} - True if limit exceeded
 */
function checkLimit(ip) {
  const now = Date.now();
  const data = requestCounts.get(ip);
  
  if (!data) {
    return false;
  }
  
  // Reset if window has passed
  if (now - data.windowStart > config.rateLimit.windowMs) {
    return false;
  }
  
  return data.count >= config.rateLimit.requestsPerMinute;
}

/**
 * Record a request from an IP
 * @param {string} ip - Client IP address
 */
function recordRequest(ip) {
  const now = Date.now();
  const data = requestCounts.get(ip);
  
  if (!data || now - data.windowStart > config.rateLimit.windowMs) {
    // Start new window
    requestCounts.set(ip, {
      count: 1,
      windowStart: now
    });
  } else {
    // Increment count in current window
    data.count++;
  }
}

/**
 * Get remaining requests for an IP
 * @param {string} ip - Client IP address
 * @returns {number} - Remaining requests in current window
 */
function getRemainingRequests(ip) {
  const now = Date.now();
  const data = requestCounts.get(ip);
  
  if (!data || now - data.windowStart > config.rateLimit.windowMs) {
    return config.rateLimit.requestsPerMinute;
  }
  
  return Math.max(0, config.rateLimit.requestsPerMinute - data.count);
}

/**
 * Rate limiter middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
function rateLimiterMiddleware(req, res, next) {
  // Get client IP (handle proxies and different request formats)
  const headers = req.headers || {};
  const forwardedFor = headers['x-forwarded-for'];
  
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             req.ip || 
             'unknown';
  
  if (checkLimit(ip)) {
    return res.status(429).json({
      error: RATE_LIMIT_ERROR_AR,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
  
  recordRequest(ip);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', config.rateLimit.requestsPerMinute);
  res.setHeader('X-RateLimit-Remaining', getRemainingRequests(ip));
  
  next();
}

module.exports = {
  rateLimiterMiddleware,
  checkLimit,
  recordRequest,
  getRemainingRequests,
  RATE_LIMIT_ERROR_AR
};
