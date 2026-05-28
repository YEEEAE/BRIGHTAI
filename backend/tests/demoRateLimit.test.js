import { describe, expect, it, beforeEach } from 'vitest';
import rateLimitModule from '../middleware/demoRateLimiter.js';

const { createDemoRateLimiter, resetDemoRateLimiter } = rateLimitModule;

function invoke(limiter, req) {
  let value;
  const headers = {};
  const res = {
    setHeader(name, headerValue) {
      headers[name] = headerValue;
    }
  };
  limiter(req, res, nextValue => { value = nextValue; });
  return { value, headers };
}

beforeEach(() => resetDemoRateLimiter());

describe('demo rate limiter', () => {
  it('returns RATE_LIMITED after the configured limit', () => {
    const limiter = createDemoRateLimiter({ limit: 2, windowMs: 60000 });
    const req = {
      body: { demoType: 'ai-agent' },
      headers: {},
      socket: { remoteAddress: '127.0.0.55' }
    };

    expect(invoke(limiter, req).value).toBeUndefined();
    expect(invoke(limiter, req).value).toBeUndefined();
    const blocked = invoke(limiter, req);
    expect(blocked.value.code).toBe('RATE_LIMITED');
    expect(blocked.value.statusCode).toBe(429);
    expect(blocked.headers['Retry-After']).toBe('60');
    expect(blocked.headers['X-RateLimit-Remaining']).toBe('0');
  });

  it('limits bursts to five requests in five seconds by default', () => {
    const limiter = createDemoRateLimiter({ ipLimit: 30, demoLimit: 30 });
    const req = {
      body: { demoType: 'ai-agent' },
      headers: {},
      socket: { remoteAddress: '127.0.0.56' }
    };

    for (let index = 0; index < 5; index += 1) {
      expect(invoke(limiter, req).value).toBeUndefined();
    }
    const blocked = invoke(limiter, req);
    expect(blocked.value.code).toBe('RATE_LIMITED');
    expect(blocked.headers['Retry-After']).toBe('5');
  });
});
