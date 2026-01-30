/**
 * Rate Limiter Middleware
 * Implements IP-based rate limiting for AI endpoints
 * Requirements: 23.5, REQ-8.1
 */

const { config } = require('../config/index');

// Store request counts per IP
const requestCounts = new Map();

// Endpoint-specific rate limits (REQ-8.1)
const ENDPOINT_LIMITS = {
  '/api/ai/chat': {
    requestsPerMinute: 10,  // Stricter limit for chat endpoint
    windowMs: 60 * 1000
  },
  'default': {
    requestsPerMinute: config.rateLimit.requestsPerMinute,
    windowMs: config.rateLimit.windowMs
  }
};

// Arabic error messages
const RATE_LIMIT_ERROR_AR = 'عذراً، لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.';

/**
 * Get rate limit config for an endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {Object} - Rate limit configuration
 */
function getRateLimitConfig(endpoint) {
  return ENDPOINT_LIMITS[endpoint] || ENDPOINT_LIMITS['default'];
}

/**
 * Clean up old entries from the rate limit store
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    const [, endpoint] = key.split('::');
    const limitConfig = getRateLimitConfig(endpoint);
    if (now - data.windowStart > limitConfig.windowMs) {
      requestCounts.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupOldEntries, 60 * 1000);

/**
 * Check if an IP has exceeded the rate limit for an endpoint
 * @param {string} ip - Client IP address
 * @param {string} endpoint - The endpoint being accessed
 * @returns {boolean} - True if limit exceeded
 */
function checkLimit(ip, endpoint = 'default') {
  const now = Date.now();
  const key = `${ip}::${endpoint}`;
  const data = requestCounts.get(key);
  const limitConfig = getRateLimitConfig(endpoint);
  
  if (!data) {
    return false;
  }
  
  // Reset if window has passed
  if (now - data.windowStart > limitConfig.windowMs) {
    return false;
  }
  
  return data.count >= limitConfig.requestsPerMinute;
}

/**
 * Record a request from an IP for an endpoint
 * @param {string} ip - Client IP address
 * @param {string} endpoint - The endpoint being accessed
 */
function recordRequest(ip, endpoint = 'default') {
  const now = Date.now();
  const key = `${ip}::${endpoint}`;
  const data = requestCounts.get(key);
  const limitConfig = getRateLimitConfig(endpoint);
  
  if (!data || now - data.windowStart > limitConfig.windowMs) {
    // Start new window
    requestCounts.set(key, {
      count: 1,
      windowStart: now
    });
  } else {
    // Increment count in current window
    data.count++;
  }
}

/**
 * Get remaining requests for an IP on an endpoint
 * @param {string} ip - Client IP address
 * @param {string} endpoint - The endpoint being accessed
 * @returns {number} - Remaining requests in current window
 */
function getRemainingRequests(ip, endpoint = 'default') {
  const now = Date.now();
  const key = `${ip}::${endpoint}`;
  const data = requestCounts.get(key);
  const limitConfig = getRateLimitConfig(endpoint);
  
  if (!data || now - data.windowStart > limitConfig.windowMs) {
    return limitConfig.requestsPerMinute;
  }
  
  return Math.max(0, limitConfig.requestsPerMinute - data.count);
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
  
  // Get the endpoint path
  const endpoint = req.url || 'default';
  const limitConfig = getRateLimitConfig(endpoint);
  
  if (checkLimit(ip, endpoint)) {
    return res.status(429).json({
      error: RATE_LIMIT_ERROR_AR,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
  
  recordRequest(ip, endpoint);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', limitConfig.requestsPerMinute);
  res.setHeader('X-RateLimit-Remaining', getRemainingRequests(ip, endpoint));
  
  next();
}

module.exports = {
  rateLimiterMiddleware,
  checkLimit,
  recordRequest,
  getRemainingRequests,
  getRateLimitConfig,
  RATE_LIMIT_ERROR_AR,
  ENDPOINT_LIMITS
};
