# Rate Limiting Middleware

## Overview

The rate limiting middleware implements IP-based request throttling for the BrightAI AI Gateway. It protects the server from abuse by limiting the number of requests each IP address can make within a time window.

## Configuration

Rate limiting is configured in `server/config/index.js`:

```javascript
rateLimit: {
  requestsPerMinute: 30,  // Maximum requests per IP per minute
  windowMs: 60000         // Time window in milliseconds (1 minute)
}
```

You can override the default limit using environment variables:

```bash
RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

## Features

### 1. IP-Based Tracking
- Tracks requests per IP address
- Handles proxy headers (`x-forwarded-for`)
- Falls back to connection IP if headers not present

### 2. Sliding Window
- Uses a 60-second sliding window
- Automatically resets after window expires
- Cleans up old entries every minute

### 3. Rate Limit Headers
All responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window

### 4. Arabic Error Messages
When rate limit is exceeded, returns:
```json
{
  "error": "عذراً، لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## Usage

The middleware is automatically applied to all AI endpoints in `server/index.js`:

```javascript
const { rateLimiterMiddleware } = require('./middleware/rateLimiter');

// Applied before routing
rateLimiterMiddleware(req, res, next);
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

### `checkLimit(ip)`
Check if an IP has exceeded the rate limit.

**Parameters:**
- `ip` (string) - IP address to check

**Returns:**
- `boolean` - True if limit exceeded

### `recordRequest(ip)`
Record a request from an IP address.

**Parameters:**
- `ip` (string) - IP address to record

### `getRemainingRequests(ip)`
Get remaining requests for an IP in current window.

**Parameters:**
- `ip` (string) - IP address to check

**Returns:**
- `number` - Remaining requests (0 or positive)

## Testing

### Unit Tests
Run unit tests with:
```bash
npm test -- tests/unit/rateLimiter.test.js
```

### Integration Tests
Run integration tests with:
```bash
npm test -- tests/integration/rateLimiter.integration.test.js
```

### Manual Testing
1. Start the server: `npm run server`
2. Run manual test: `node tests/manual/test-rate-limit.js`

## Requirements

Implements requirement **23.5**:
- 30 requests/minute/IP limit
- Returns 429 with Arabic message when exceeded

## Security Considerations

1. **IP Spoofing**: The middleware trusts `x-forwarded-for` headers. In production, ensure your reverse proxy (nginx, CloudFlare) is properly configured to set these headers.

2. **Memory Usage**: The in-memory store grows with unique IPs. The cleanup function runs every minute to remove expired entries.

3. **Distributed Systems**: This implementation uses in-memory storage. For multi-server deployments, consider using Redis or another shared store.

## Future Enhancements

- [ ] Redis-based storage for distributed systems
- [ ] Per-endpoint rate limits
- [ ] User-based rate limiting (in addition to IP)
- [ ] Configurable time windows
- [ ] Rate limit bypass for authenticated users
