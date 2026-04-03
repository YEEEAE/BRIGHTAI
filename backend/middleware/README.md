# Rate Limiting Middleware

## Overview

The rate limiting middleware implements IP-based request throttling for the BrightAI AI Gateway. It protects the server from abuse by limiting the number of requests each IP address can make within a time window.
It supports both `memory` and `redis` storage modes.

## Configuration

Rate limiting is configured in `backend/config/index.js`:

```javascript
rateLimit: {
  requestsPerMinute: 30,  // Maximum requests per IP per minute
  windowMs: 60000,        // Time window in milliseconds (1 minute)
  storage: 'memory'       // 'memory' or 'redis'
}
```

You can override the default limit using environment variables:

```bash
RATE_LIMIT_REQUESTS_PER_MINUTE=30
RATE_LIMIT_STORAGE=memory
```

## Features

### 1. IP-Based Tracking
- Tracks requests per IP address
- Handles proxy headers (`x-forwarded-for`)
- Falls back to connection IP if headers not present

### 2. Sliding Window
- Uses a 60-second sliding window
- Automatically resets after window expires
- Cleans up old entries every minute in memory mode

### 3. Rate Limit Headers
All responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Reset timestamp (milliseconds)

### 4. Arabic Error Messages
When rate limit is exceeded, returns:
```json
{
  "error": "عذراً، لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 42
}
```

## Usage

The middleware is automatically applied to all AI endpoints in `backend/server.js`:

```javascript
const { rateLimiterMiddleware } = require('./middleware/rateLimiter');

// Applied before routing
await rateLimiterMiddleware(req, res, next);
```

## API Reference

### `rateLimiterMiddleware(req, res, next)`
Main middleware function that checks and enforces rate limits.

**Parameters:**
- `req` - Request object
- `res` - Response object
- `next` - Next middleware function

**Returns:**
- Calls `next()` if under limit
- Sends 429 response if limit exceeded

### `RateLimiter`
Rate limiter class with pluggable storage backend.

**Parameters:**
- `storage` (`memory` or `redis`)
- `requestsPerMinute` (number)
- `windowMs` (number)
- `redisClient` (object, required for redis mode)

### `defaultRateLimiter`
Default initialized rate limiter used by middleware.

## Operational Notes

1. `x-forwarded-for` is trusted by design. In production, ensure proxy headers are set by trusted infrastructure only.
2. Memory mode is per-process. For distributed deployments, use redis mode with a shared Redis instance.
3. On Redis errors, middleware fails open (allows requests) to keep service available.
