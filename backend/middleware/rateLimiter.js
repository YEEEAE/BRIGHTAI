/**
 * Rate Limiter Middleware
 * Implements IP-based rate limiting for AI endpoints with support for memory and Redis storage
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

const { config } = require('../config/index');

// Arabic error messages
const RATE_LIMIT_ERROR_AR = 'عذراً، لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.';

/**
 * RateLimiter class with support for memory and Redis storage
 */
class RateLimiter {
  /**
   * Create a new RateLimiter instance
   * @param {Object} options - Configuration options
   * @param {string} options.storage - Storage type: 'memory' or 'redis'
   * @param {number} options.requestsPerMinute - Maximum requests per minute
   * @param {number} options.windowMs - Time window in milliseconds
   * @param {Object} options.redisClient - Redis client instance (required if storage is 'redis')
   */
  constructor(options = {}) {
    this.storage = options.storage || process.env.RATE_LIMIT_STORAGE || 'memory';
    this.requestsPerMinute = options.requestsPerMinute || config.rateLimit.requestsPerMinute;
    this.windowMs = options.windowMs || config.rateLimit.windowMs;
    
    if (this.storage === 'memory') {
      // Map to store request timestamps: identifier -> [timestamp1, timestamp2, ...]
      this.requests = new Map();
    } else if (this.storage === 'redis') {
      // Redis client for persistent storage
      this.redisClient = options.redisClient;
      if (!this.redisClient) {
        console.warn('[RateLimiter] Redis storage requested but no client provided, falling back to memory');
        this.storage = 'memory';
        this.requests = new Map();
      }
    }
    
    // Start cleanup interval for memory storage
    if (this.storage === 'memory') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000); // Run cleanup every minute
    }
  }
  
  /**
   * Check if a request should be allowed
   * @param {string} identifier - Unique identifier (e.g., IP address)
   * @returns {Promise<Object>} - Result object with allowed, remaining, and resetAt properties
   */
  async checkLimit(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (this.storage === 'memory') {
      // Get or create request log
      let requestLog = this.requests.get(identifier) || [];
      
      // Remove old requests outside the time window
      requestLog = requestLog.filter(timestamp => timestamp > windowStart);
      
      // Check if limit is exceeded
      if (requestLog.length >= this.requestsPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: requestLog[0] + this.windowMs
        };
      }
      
      // Add new request timestamp
      requestLog.push(now);
      this.requests.set(identifier, requestLog);
      
      return {
        allowed: true,
        remaining: this.requestsPerMinute - requestLog.length,
        resetAt: now + this.windowMs
      };
    } else if (this.storage === 'redis') {
      // Redis implementation for persistent storage
      try {
        const key = `ratelimit:${identifier}`;
        
        // Get current request count
        const requests = await this.redisClient.zRangeByScore(key, windowStart, '+inf');
        
        // Check if limit is exceeded
        if (requests.length >= this.requestsPerMinute) {
          const oldestRequest = await this.redisClient.zRange(key, 0, 0, { REV: false });
          const resetAt = oldestRequest.length > 0 ? parseInt(oldestRequest[0]) + this.windowMs : now + this.windowMs;
          
          return {
            allowed: false,
            remaining: 0,
            resetAt
          };
        }
        
        // Add new request with current timestamp as both score and value
        await this.redisClient.zAdd(key, { score: now, value: now.toString() });
        
        // Set expiry on the key to auto-cleanup
        await this.redisClient.expire(key, Math.ceil(this.windowMs / 1000));
        
        // Remove old entries
        await this.redisClient.zRemRangeByScore(key, '-inf', windowStart);
        
        return {
          allowed: true,
          remaining: this.requestsPerMinute - requests.length - 1,
          resetAt: now + this.windowMs
        };
      } catch (error) {
        console.error('[RateLimiter] Redis error:', error.message);
        // Fallback to allowing the request on Redis errors
        return {
          allowed: true,
          remaining: this.requestsPerMinute,
          resetAt: now + this.windowMs
        };
      }
    }
    
    // Default fallback
    return {
      allowed: true,
      remaining: this.requestsPerMinute,
      resetAt: now + this.windowMs
    };
  }
  
  /**
   * Clean up old entries from memory storage
   * This method removes expired request logs to prevent memory leaks
   */
  cleanup() {
    if (this.storage !== 'memory') {
      return;
    }
    
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requestLog] of this.requests.entries()) {
      // Filter out old requests
      const filtered = requestLog.filter(timestamp => timestamp > windowStart);
      
      if (filtered.length === 0) {
        // Remove identifier if no requests in current window
        this.requests.delete(identifier);
      } else {
        // Update with filtered list
        this.requests.set(identifier, filtered);
      }
    }
  }
  
  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.storage === 'memory' && this.requests) {
      this.requests.clear();
    }
  }
}

// Create default rate limiter instance
const defaultRateLimiter = new RateLimiter();

/**
 * Rate limiter middleware
 * @param {Request} req - HTTP request
 * @param {Response} res - HTTP response
 * @param {Function} next - Next middleware
 */
async function rateLimiterMiddleware(req, res, next) {
  // Get client IP (handle proxies and different request formats)
  const headers = req.headers || {};
  const forwardedFor = headers['x-forwarded-for'];
  
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             req.ip || 
             'unknown';
  
  try {
    // Check rate limit
    const result = await defaultRateLimiter.checkLimit(ip);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', defaultRateLimiter.requestsPerMinute);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: RATE_LIMIT_ERROR_AR,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      });
    }
    
    next();
  } catch (error) {
    console.error('[RateLimiter] Middleware error:', error);
    // On error, allow the request to proceed
    next();
  }
}

module.exports = {
  RateLimiter,
  rateLimiterMiddleware,
  defaultRateLimiter,
  RATE_LIMIT_ERROR_AR
};
