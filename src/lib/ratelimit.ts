/**
 * src/lib/ratelimit.ts — BAI-005 (2026-07-15)
 *
 * Shared sliding-window rate limiter for Astro SSR endpoints.
 *
 * Used by:
 *   - src/pages/api/ai/chat.ts  (10 req/min/IP)
 *   - src/pages/api/lead.ts     (5 req/min/IP)
 *
 * Storage:
 *   - If REDIS_URL is set, uses an atomic Lua sorted-set script.
 *     All instances on Render share the same Redis DB → unified quota
 *     across replicas. (BAI-005 acceptance criteria)
 *   - Otherwise falls back to an in-memory Map. The fallback is
 *     per-process (not shared), but it keeps the endpoint alive when
 *     Redis is unavailable. Callers receive `degraded: true` so they
 *     can add `X-RateLimit-Degraded: true` to the response and surface
 *     an alert.
 *
 * Algorithm: sliding-window (not fixed-window).
 *   Each call inserts a timestamped member into a Redis sorted set
 *   keyed by `rl:<key>`. Entries older than windowMs are pruned before
 *   counting. An atomic Lua script ensures two concurrent requests on
 *   the same key cannot both see "1 remaining" and both succeed.
 *
 * The Lua script is identical to the one in:
 *   apps/dashboard/lib/firewall/ratelimit/redis-bucket.ts
 * so both the firewall and the public-facing API share the same
 * battle-tested logic.
 */

import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────────────
// Redis singleton (lazy, fail-open)
// ─────────────────────────────────────────────────────────────────────────

let _redis: Redis | null = null;
let _redisTried = false;

function getRedis(): Redis | null {
  if (_redisTried) return _redis;
  _redisTried = true;

  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  try {
    _redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 2_000,
    });

    _redis.on('error', () => {
      // Swallow connection errors — we treat Redis as best-effort.
      // The in-memory fallback takes over transparently.
    });

    // Non-blocking connect: if it fails we fall back to memory.
    _redis.connect().catch(() => {
      _redis = null;
    });

    return _redis;
  } catch {
    _redis = null;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Lua sliding-window script (atomic, no race conditions)
// Identical to apps/dashboard/lib/firewall/ratelimit/redis-bucket.ts
// ─────────────────────────────────────────────────────────────────────────

const SLIDING_WINDOW_LUA = `
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit    = tonumber(ARGV[3])
local member   = ARGV[4]

-- Drop expired entries (before the start of the current window)
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)

local count = redis.call('ZCARD', key)
if count >= limit then
  return { 0, count, limit }
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs + 1000)
return { 1, count + 1, limit }
`;

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether this request is allowed to proceed. */
  allowed: boolean;
  /** Tokens left in the current window (0 when blocked). */
  remaining: number;
  /** Configured limit (e.g. 10 for chat). */
  limit: number;
  /** How many seconds the caller should wait before retrying. */
  retryAfterSec: number;
  /** True when Redis is down and the in-memory fallback is in use. */
  degraded: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// In-memory fallback (fixed-window, per-process)
// ─────────────────────────────────────────────────────────────────────────

interface MemBucket {
  count: number;
  windowStart: number;
}

const _mem = new Map<string, MemBucket>();

/** Periodic cleanup to prevent unbounded Map growth. */
const _CLEANUP_MS = 5 * 60_000;
let _cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(() => {
    // We don't know the window per key here, so we use 2 min as a
    // conservative upper bound — any bucket not seen for 2 min is dead.
    const cutoff = Date.now() - 2 * 60_000;
    for (const [k, b] of _mem) {
      if (b.windowStart < cutoff) _mem.delete(k);
    }
  }, _CLEANUP_MS);
  // Don't keep the process alive solely for cleanup.
  if (_cleanupTimer && typeof _cleanupTimer === 'object' && 'unref' in _cleanupTimer) {
    (_cleanupTimer as { unref: () => void }).unref?.();
  }
}

function memConsume(
  key: string,
  limit: number,
  windowSec: number,
): Pick<RateLimitResult, 'allowed' | 'remaining' | 'retryAfterSec'> {
  ensureCleanup();
  const now = Date.now();
  const windowMs = windowSec * 1_000;
  const bucket = _mem.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    _mem.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((bucket.windowStart + windowMs - now) / 1_000),
    );
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Consume one token from the rate-limit bucket for `key`.
 *
 * @param key       Bucket identifier (e.g. `chat:${ip}`, `lead:${ip}`).
 * @param limit     Max requests per window (e.g. 10).
 * @param windowSec Window duration in seconds (e.g. 60).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const r = getRedis();

  // ── Redis path ──────────────────────────────────────────────────
  if (r && r.status === 'ready') {
    try {
      const now = Date.now();
      const windowMs = windowSec * 1_000;
      const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;

      const result = (await r.eval(
        SLIDING_WINDOW_LUA,
        1,
        `rl:${key}`,            // KEYS[1]
        String(now),             // ARGV[1]
        String(windowMs),        // ARGV[2]
        String(limit),           // ARGV[3]
        member,                  // ARGV[4] (unique member for sorted set)
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
      // Redis failed mid-request → fall through to memory.
    }
  }

  // ── In-memory fallback ──────────────────────────────────────────
  const mem = memConsume(key, limit, windowSec);
  return { ...mem, limit, degraded: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Test helpers (not exported in prod bundles, tree-shaken by the bundler)
// ─────────────────────────────────────────────────────────────────────────

/** Reset the singleton for unit tests. */
export function __resetRateLimitForTests(): void {
  _redisTried = false;
  if (_redis) {
    try { _redis.disconnect(); } catch { /* ignore */ }
    _redis = null;
  }
  _mem.clear();
  if (_cleanupTimer) {
    clearInterval(_cleanupTimer);
    _cleanupTimer = null;
  }
}
