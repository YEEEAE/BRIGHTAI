/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Sliding-window rate limiter for the firewall API.
 *
 * Default policy: 60 requests per 60 seconds per (org, actor).
 * The window is sliding: each request "consumes" 1 token at the
 * current time, and tokens expire after `windowSec` seconds.
 *
 * Storage:
 *   - If REDIS_URL is set, uses an atomic Lua script for accuracy
 *     under concurrent access.
 *   - Otherwise falls back to an in-memory Map (per-process; not
 *     shared across replicas). The fallback is fail-open with a
 *     warning header so a single deploy can boot without Redis.
 *
 * Concurrency:
 *   The Lua script runs in a single atomic step on the Redis
 *   server, so two requests racing on the same key cannot both
 *   see "1 remaining" and both succeed.
 */

import Redis from 'ioredis';

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_SEC = 60;

let redis: Redis | null = null;
let redisInitTried = false;

function getRedis(): Redis | null {
  if (redisInitTried) return redis;
  redisInitTried = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    redis.on('error', () => {
      // Swallow connection errors; we treat Redis as best-effort.
    });
    // Don't await — we want this to be lazy.
    redis.connect().catch(() => {
      redis = null;
    });
    return redis;
  } catch {
    redis = null;
    return null;
  }
}

const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

-- Drop expired entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)

local count = redis.call('ZCARD', key)
if count >= limit then
  return { 0, count, limit }
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs + 1000)
return { 1, count + 1, limit }
`;

export interface ConsumeResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
  /** True when Redis is down and the in-memory fallback is in use. */
  degraded: boolean;
}

/**
 * In-memory fallback. Per-process, not shared.
 */
const memoryBuckets = new Map<string, { ts: number; count: number; windowStart: number }>();

function memoryConsume(
  key: string,
  limit: number,
  windowSec: number,
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const bucket = memoryBuckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    memoryBuckets.set(key, { ts: now, count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((bucket.windowStart + windowMs - now) / 1000),
    );
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  bucket.count++;
  bucket.ts = now;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

export async function consume(opts: {
  key: string;
  limit?: number;
  windowSec?: number;
}): Promise<ConsumeResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowSec = opts.windowSec ?? DEFAULT_WINDOW_SEC;
  const windowMs = windowSec * 1000;
  const r = getRedis();

  if (!r || r.status !== 'ready') {
    const mem = memoryConsume(opts.key, limit, windowSec);
    return { ...mem, limit, degraded: true };
  }

  try {
    const now = Date.now();
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
    const result = (await r.eval(
      SLIDING_WINDOW_LUA,
      1,
      `firewall:rl:${opts.key}`,
      String(now),
      String(windowMs),
      String(limit),
      member,
    )) as [number, number, number];
    const [allowed, count] = result;
    return {
      allowed: allowed === 1,
      remaining: Math.max(0, limit - count),
      limit,
      retryAfterSec: allowed === 1 ? 0 : windowSec,
      degraded: false,
    };
  } catch {
    // Redis failed mid-request. Fall back to memory to keep serving.
    const mem = memoryConsume(opts.key, limit, windowSec);
    return { ...mem, limit, degraded: true };
  }
}

/**
 * Returns the current Redis connection status for the health endpoint.
 * Called from GET /api/firewall/health to surface whether the rate limiter
 * is using the shared Redis bucket or the per-process in-memory fallback.
 */
export function getRateLimitRedisStatus(): {
  backend: 'redis' | 'memory';
  degraded: boolean;
} {
  const r = getRedis();
  const ready = r !== null && r.status === 'ready';
  return {
    backend: ready ? 'redis' : 'memory',
    degraded: !ready,
  };
}
