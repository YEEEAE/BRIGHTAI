const { createHttpError } = require('../utils/httpErrors');

const buckets = new Map();
const WINDOW_MS = Number(process.env.DEMO_RATE_LIMIT_WINDOW_MS) || 60000;
const DEFAULT_IP_LIMIT = Number(process.env.DEMO_RATE_LIMIT_IP_MAX) || 30;
const DEFAULT_DEMO_LIMIT = Number(process.env.DEMO_RATE_LIMIT_DEMO_MAX) || 10;
const BURST_WINDOW_MS = Number(process.env.DEMO_RATE_LIMIT_BURST_WINDOW_MS) || 5000;
const DEFAULT_BURST_LIMIT = Number(process.env.DEMO_RATE_LIMIT_BURST_MAX) || 5;

function getClientKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';
}

function consumeBucket(key, limit, windowMs, now) {
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
}

function createDemoRateLimiter(options = {}) {
  const ipLimit = Number(options.ipLimit || options.limit) || DEFAULT_IP_LIMIT;
  const demoLimit = Number(options.demoLimit) || DEFAULT_DEMO_LIMIT;
  const burstLimit = Number(options.burstLimit) || DEFAULT_BURST_LIMIT;
  const windowMs = Number(options.windowMs) || WINDOW_MS;
  const burstWindowMs = Number(options.burstWindowMs) || BURST_WINDOW_MS;
  return function demoRateLimiter(req, res, next) {
    const now = Date.now();
    const clientKey = getClientKey(req);
    const demoType = req.demoRequest?.demoType || req.body?.demoType || 'unknown';
    const checks = [
      consumeBucket(`ip:${clientKey}`, ipLimit, windowMs, now),
      consumeBucket(`demo:${clientKey}:${demoType}`, demoLimit, windowMs, now),
      consumeBucket(`burst:${clientKey}`, burstLimit, burstWindowMs, now)
    ];
    const remaining = Math.min(...checks.map(check => check.remaining));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    const blocked = checks.find(check => !check.allowed);
    if (blocked) {
      res.setHeader('Retry-After', String(blocked.retryAfter));
      return next(createHttpError('RATE_LIMITED'));
    }
    return next();
  };
}

function resetDemoRateLimiter() {
  buckets.clear();
}

module.exports = {
  createDemoRateLimiter,
  DEFAULT_BURST_LIMIT,
  DEFAULT_DEMO_LIMIT,
  DEFAULT_IP_LIMIT,
  resetDemoRateLimiter
};
