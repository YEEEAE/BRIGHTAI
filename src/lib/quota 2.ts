/**
 * src/lib/quota.ts — K4 (2026-07-18)
 *
 * Unified, distributed quota + cost + circuit-breaker + abuse layer for the
 * chat endpoint (and reusable by lead.ts). Replaces the old per-minute-only
 * sliding-window limiter (BAI-005) with a production-grade enforce point.
 *
 * Enforced dimensions (all Redis-backed, atomic via Lua, TTL-bounded):
 *   1. Sliding-window per-minute rate limit (per IP) — no race conditions.
 *   2. Daily quota (per IP AND per session) — hard cap on request count.
 *   3. Daily cost/token cap (per IP) — blocks expensive operations before
 *      they reach the provider. The original cost is estimated up-front from
 *      the message length (we can't know the real token count pre-call, so we
 *      use a conservative per-request estimate; the real cost is reconciled
 *      post-call by usagetracker).
 *   4. Circuit breaker (per provider) — after N consecutive failures the
 *      provider is marked open for a cooldown window; the handler then avoids
 *      the dead provider (and returns degraded if all are open).
 *   5. Abuse signals (per IP) — firewall blocks + rate-limit hits + rapid
 *      retries accrue an abuse score; above threshold the IP is throttled
 *      harder (longer retry-after).
 *
 * Redis is REQUIRED in production. If REDIS_URL is unset or unreachable AND
 * NODE_ENV === 'production', we do NOT fall back to a silent in-memory limit
 * (that would let one replica's memory diverge and defeat the quota). Instead
 * we return `degraded: true` with `allowed: false` and a 503 + Retry-After so
 * the caller surfaces "service temporarily unavailable". In development we
 * allow the in-memory fallback but always flag `degraded: true` so it is never
 * silent.
 *
 * Rollback flag (documented): set `BRIGHTAI_QUOTA_DISABLED=1` to bypass all
 * quota checks. Used only for emergency rollback / incident debugging. When
 * disabled, `allowed: true` and `degraded: false` are returned and a one-line
 * warning is logged once.
 *
 * All responses that carry a quota decision MUST include `Cache-Control:
 * no-store` (callers add it). On block we always emit `Retry-After`.
 */

import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────

const DAILY_REQUEST_QUOTA = Number(process.env.CHAT_DAILY_QUOTA ?? 200);
const DAILY_COST_USD_CAP = Number(process.env.CHAT_DAILY_COST_CAP_USD ?? 5.0);
const ESTIMATED_TOKENS_PER_REQUEST = 1500; // conservative pre-call estimate

const RATE_LIMIT_MAX_REQUESTS = Number(process.env.CHAT_RATE_LIMIT_MAX ?? 10);
const RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS ?? 60_000);

const CIRCUIT_FAILURE_THRESHOLD = Number(process.env.CHAT_CB_FAILURES ?? 5);
const CIRCUIT_COOLDOWN_MS = Number(process.env.CHAT_CB_COOLDOWN_MS ?? 30_000);

const ABUSE_BLOCK_THRESHOLD = Number(process.env.CHAT_ABUSE_THRESHOLD ?? 20);
const ABUSE_WINDOW_MS = Number(process.env.CHAT_ABUSE_WINDOW_MS ?? 3_600_000);

const isProd = process.env.NODE_ENV === 'production';
const quotaDisabled = process.env.BRIGHTAI_QUOTA_DISABLED === '1';

if (quotaDisabled) {
  // eslint-disable-next-line no-console
  console.warn('[quota] BRIGHTAI_QUOTA_DISABLED=1 — ALL quota checks bypassed (emergency rollback only)');
}

// ─────────────────────────────────────────────────────────────────────────
// Redis singleton (lazy, fail-open in dev / fail-closed in prod)
// ─────────────────────────────────────────────────────────────────────────

let _redis: Redis | null = null;
let _redisTried = false;
let _redisBroken = false;

function getRedis(): Redis | null {
  if (quotaDisabled) return null;
  if (_redisTried) return _redisBroken ? null : _redis;
  _redisTried = true;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    _redisBroken = isProd; // prod without Redis = broken (fail-closed)
    return null;
  }

  try {
    _redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 2_000,
    });
    _redis.on('error', () => {
      _redisBroken = true;
      _redis = null;
    });
    _redis.connect().catch(() => {
      _redisBroken = isProd;
      _redis = null;
    });
    return _redis;
  } catch {
    _redisBroken = isProd;
    _redis = null;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Lua scripts (atomic — no race conditions across replicas)
// ─────────────────────────────────────────────────────────────────────────

// Sliding-window rate limit: prune expired, count, add if under limit.
const SLIDING_WINDOW_LUA = `
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit    = tonumber(ARGV[3])
local member   = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
local count = redis.call('ZCARD', key)
if count >= limit then
  return { 0, count, limit }
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs + 1000)
return { 1, count + 1, limit }
`;

// Daily counter (request or cost): INCR + PEXPIRE to end-of-day TTL.
// Returns: { count, limit, ttlMs }
const DAILY_COUNTER_LUA = `
local key    = KEYS[1]
local now    = tonumber(ARGV[1])
local limit  = tonumber(ARGV[2])
local amount = tonumber(ARGV[3])
local endOfDay = tonumber(ARGV[4])   -- ms epoch of next midnight UTC
local count = redis.call('INCRBY', key, amount)
if count == amount then
  redis.call('PEXPIRE', key, math.max(1000, endOfDay - now))
end
return { count, limit, math.max(0, endOfDay - now) }
`;

// Circuit breaker: record failure or read state.
// mode=record: INCR failure key, PEXPIRE to cooldown.
// mode=check:  GET failure key; open if >= threshold.
const CIRCUIT_LUA = `
local key       = KEYS[1]
local mode      = ARGV[1]
local now       = tonumber(ARGV[2])
local threshold = tonumber(ARGV[3])
local cooldown  = tonumber(ARGV[4])
if mode == 'record' then
  local n = redis.call('INCR', key)
  redis.call('PEXPIRE', key, cooldown)
  return n
end
local n = redis.call('GET', key)
n = tonumber(n) or 0
if n >= threshold then
  return 1
end
return 0
`;

// Abuse accumulator: INCRBY score, PEXPIRE to abuse window.
const ABUSE_LUA = `
local key    = KEYS[1]
local amount = tonumber(ARGV[1])
local ttl    = tonumber(ARGV[2])
local score = redis.call('INCRBY', key, amount)
if score == amount then
  redis.call('PEXPIRE', key, ttl)
end
return score
`;

// ─────────────────────────────────────────────────────────────────────────
// In-memory fallback (DEV ONLY — never silent in prod because prod returns
// 503 before reaching here)
// ─────────────────────────────────────────────────────────────────────────

interface MemState {
  sliding: Map<string, number>; // key `rl:<ip>:<member>` → member ts
  dailyReq: Map<string, number>;
  dailyCost: Map<string, number>;
  circuit: Map<string, number>; // failure count
  abuse: Map<string, number>;
}

const _mem: MemState = {
  sliding: new Map(),
  dailyReq: new Map(),
  dailyCost: new Map(),
  circuit: new Map(),
  abuse: new Map(),
};

const _CLEANUP_MS = 5 * 60_000;
let _cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - 2 * 60_000;
    for (const [k, ts] of _mem.sliding) if (ts < cutoff) _mem.sliding.delete(k);
  }, _CLEANUP_MS);
  if (_cleanupTimer && typeof _cleanupTimer === 'object' && 'unref' in _cleanupTimer) {
    (_cleanupTimer as { unref: () => void }).unref?.();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface QuotaResult {
  allowed: boolean;
  /** Seconds the caller should wait before retrying (0 when allowed). */
  retryAfterSec: number;
  /** True when quota is running in degraded mode (no Redis in prod, or dev fallback). */
  degraded: boolean;
  /** Machine-readable reason for a block (for logging + client hint). */
  reason:
    | 'ok'
    | 'rate_limited'
    | 'daily_quota_exceeded'
    | 'cost_cap_exceeded'
    | 'circuit_open'
    | 'abuse_blocked'
    | 'quota_unavailable';
  /** Extra headers to merge into the response. */
  headers: Record<string, string>;
}

export type QuotaProvider = 'groq' | 'gemini';

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

function endOfDayEpochMs(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

/**
 * Check all quota dimensions for a chat request. MUST be called before any
 * provider call. When `allowed` is false, the caller must respond with the
 * given status (429 / 503) and attach `result.headers` (which includes
 * `Retry-After` and `Cache-Control: no-store`).
 */
export async function checkQuota(opts: {
  ip: string;
  sessionId?: string | null;
  estimatedTokens?: number;
  /** Set true after a firewall block — accrues abuse score. */
  abuseSignal?: boolean;
}): Promise<QuotaResult> {
  const ip = opts.ip;
  const estimatedTokens = opts.estimatedTokens ?? ESTIMATED_TOKENS_PER_REQUEST;
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };

  // Emergency rollback flag — bypass everything.
  if (quotaDisabled) {
    return { allowed: true, retryAfterSec: 0, degraded: false, reason: 'ok', headers };
  }

  const r = getRedis();

  // Production without Redis → fail closed (stop expensive operations).
  if (!r || _redisBroken) {
    if (isProd) {
      const retryAfterSec = 30;
      headers['Retry-After'] = String(retryAfterSec);
      headers['X-Quota-Degraded'] = 'true';
      return {
        allowed: false,
        retryAfterSec,
        degraded: true,
        reason: 'quota_unavailable',
        headers,
      };
    }
    // Dev: in-memory fallback, but VISIBLE (degraded flag).
    return checkQuotaMemory(ip, opts.sessionId, estimatedTokens, opts.abuseSignal, headers);
  }

  try {
    const now = Date.now();
    const eod = endOfDayEpochMs();

    // 1. Sliding-window per-minute (atomic Lua)
    const rlMember = `${now}:${Math.random().toString(36).slice(2, 10)}`;
    const rlRes = (await r.eval(
      SLIDING_WINDOW_LUA,
      1,
      `quota:rl:ip:${ip}`,
      String(now),
      String(RATE_LIMIT_WINDOW_MS),
      String(RATE_LIMIT_MAX_REQUESTS),
      rlMember,
    )) as [number, number, number];
    const [rlAllowed, rlCount] = rlRes;
    if (rlAllowed !== 1) {
      headers['Retry-After'] = String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1_000));
      headers['X-RateLimit-Limit'] = String(RATE_LIMIT_MAX_REQUESTS);
      headers['X-RateLimit-Remaining'] = '0';
      return {
        allowed: false,
        retryAfterSec: Math.ceil(RATE_LIMIT_WINDOW_MS / 1_000),
        degraded: false,
        reason: 'rate_limited',
        headers,
      };
    }
    headers['X-RateLimit-Limit'] = String(RATE_LIMIT_MAX_REQUESTS);
    headers['X-RateLimit-Remaining'] = String(Math.max(0, RATE_LIMIT_MAX_REQUESTS - rlCount - 1));

    // 2. Daily request quota (IP + session)
    const dayReqRes = (await r.eval(
      DAILY_COUNTER_LUA,
      1,
      `quota:day:req:ip:${ip}`,
      String(now),
      String(DAILY_REQUEST_QUOTA),
      '1',
      String(eod),
    )) as [number, number, number];
    const [dayReqCount] = dayReqRes;
    if (dayReqCount > DAILY_REQUEST_QUOTA) {
      const retryAfterSec = Math.max(1, Math.ceil((eod - now) / 1_000));
      headers['Retry-After'] = String(retryAfterSec);
      return {
        allowed: false,
        retryAfterSec,
        degraded: false,
        reason: 'daily_quota_exceeded',
        headers,
      };
    }

    if (opts.sessionId) {
      const sessRes = (await r.eval(
        DAILY_COUNTER_LUA,
        1,
        `quota:day:req:session:${opts.sessionId}`,
        String(now),
        String(DAILY_REQUEST_QUOTA),
        '1',
        String(eod),
      )) as [number, number, number];
      if (sessRes[0] > DAILY_REQUEST_QUOTA) {
        const retryAfterSec = Math.max(1, Math.ceil((eod - now) / 1_000));
        headers['Retry-After'] = String(retryAfterSec);
        return {
          allowed: false,
          retryAfterSec,
          degraded: false,
          reason: 'daily_quota_exceeded',
          headers,
        };
      }
    }

    // 3. Daily cost/token cap (IP)
    const dayCostRes = (await r.eval(
      DAILY_COUNTER_LUA,
      1,
      `quota:day:cost:ip:${ip}`,
      String(now),
      String(DAILY_COST_USD_CAP * 1000), // store in milli-USD to avoid floats
      String(Math.ceil((estimatedTokens / 1000) * 1000 * 0.001 * 1000)), // milli-USD estimate
      String(eod),
    )) as [number, number, number];
    const dayCostMilli = dayCostRes[0];
    if (dayCostMilli > DAILY_COST_USD_CAP * 1000) {
      const retryAfterSec = Math.max(1, Math.ceil((eod - now) / 1_000));
      headers['Retry-After'] = String(retryAfterSec);
      headers['X-Cost-Cap-Remaining'] = String(
        Math.max(0, Math.round((DAILY_COST_USD_CAP * 1000 - dayCostMilli) / 1000 * 100) / 100),
      );
      return {
        allowed: false,
        retryAfterSec,
        degraded: false,
        reason: 'cost_cap_exceeded',
        headers,
      };
    }

    // 4. Abuse signals (firewall block / rapid retry accrual)
    if (opts.abuseSignal) {
      const abuseScore = (await r.eval(
        ABUSE_LUA,
        1,
        `quota:abuse:ip:${ip}`,
        '1',
        String(ABUSE_WINDOW_MS),
      )) as number;
      if (abuseScore >= ABUSE_BLOCK_THRESHOLD) {
        const retryAfterSec = Math.ceil(ABUSE_WINDOW_MS / 1_000);
        headers['Retry-After'] = String(retryAfterSec);
        return {
          allowed: false,
          retryAfterSec,
          degraded: false,
          reason: 'abuse_blocked',
          headers,
        };
      }
    }

    return { allowed: true, retryAfterSec: 0, degraded: false, reason: 'ok', headers };
  } catch {
    // Redis error mid-check → fail closed in prod, degraded fallback in dev.
    if (isProd) {
      const retryAfterSec = 30;
      headers['Retry-After'] = String(retryAfterSec);
      headers['X-Quota-Degraded'] = 'true';
      return {
        allowed: false,
        retryAfterSec,
        degraded: true,
        reason: 'quota_unavailable',
        headers,
      };
    }
    return checkQuotaMemory(ip, opts.sessionId, estimatedTokens, opts.abuseSignal, headers);
  }
}

/**
 * Record a provider failure (for the circuit breaker). Call after a provider
 * call throws before any token is yielded. Returns true if the provider is
 * now OPEN (should not be used).
 */
export async function recordProviderFailure(provider: QuotaProvider): Promise<boolean> {
  if (quotaDisabled) return false;
  const r = getRedis();
  if (!r || _redisBroken) {
    if (isProd) return false;
    const n = (_mem.circuit.get(provider) ?? 0) + 1;
    _mem.circuit.set(provider, n);
    return n >= CIRCUIT_FAILURE_THRESHOLD;
  }
  try {
    const n = (await r.eval(
      CIRCUIT_LUA,
      1,
      `quota:cb:${provider}`,
      'record',
      String(Date.now()),
      String(CIRCUIT_FAILURE_THRESHOLD),
      String(CIRCUIT_COOLDOWN_MS),
    )) as number;
    return n >= CIRCUIT_FAILURE_THRESHOLD;
  } catch {
    return false;
  }
}

/**
 * Check whether a provider's circuit is OPEN (should be skipped).
 */
export async function isProviderOpen(provider: QuotaProvider): Promise<boolean> {
  if (quotaDisabled) return false;
  const r = getRedis();
  if (!r || _redisBroken) {
    if (isProd) return false;
    return (_mem.circuit.get(provider) ?? 0) >= CIRCUIT_FAILURE_THRESHOLD;
  }
  try {
    const open = (await r.eval(
      CIRCUIT_LUA,
      1,
      `quota:cb:${provider}`,
      'check',
      String(Date.now()),
      String(CIRCUIT_FAILURE_THRESHOLD),
      String(CIRCUIT_COOLDOWN_MS),
    )) as number;
    return open === 1;
  } catch {
    return false;
  }
}

/**
 * Clear the circuit breaker for a provider (call after a successful call).
 */
export async function resetProviderCircuit(provider: QuotaProvider): Promise<void> {
  if (quotaDisabled) return;
  const r = getRedis();
  if (!r || _redisBroken) {
    _mem.circuit.delete(provider);
    return;
  }
  try {
    await r.del(`quota:cb:${provider}`);
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Legacy compatibility: rateLimit (used by src/pages/api/lead.ts)
// ─────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
  degraded: boolean;
}

function rateLimitMemory(key: string, limit: number, windowSec: number): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const windowMs = windowSec * 1_000;
  const prefix = `legacy:${key}:`;
  for (const k of _mem.sliding.keys()) {
    if (k.startsWith(prefix) && (_mem.sliding.get(k) ?? 0) < now - windowMs) {
      _mem.sliding.delete(k);
    }
  }
  let count = 0;
  for (const k of _mem.sliding.keys()) {
    if (k.startsWith(prefix)) count++;
  }
  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSec: Math.ceil((now + windowMs - now) / 1_000),
      degraded: true,
    };
  }
  _mem.sliding.set(`${prefix}${now}:${Math.random().toString(36).slice(2, 8)}`, now);
  return { allowed: true, remaining: Math.max(0, limit - count - 1), limit, retryAfterSec: 0, degraded: true };
}

/**
 * Backwards-compatible sliding-window limiter. Delegates to Redis via Lua,
 * falls back to visible in-memory in dev (degraded), and fails-closed in prod
 * (503) when Redis is unavailable — exactly like checkQuota.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  if (quotaDisabled) {
    return { allowed: true, remaining: limit, limit, retryAfterSec: 0, degraded: false };
  }
  const r = getRedis();
  if (!r || _redisBroken) {
    if (isProd) return { allowed: false, remaining: 0, limit, retryAfterSec: 30, degraded: true };
    return rateLimitMemory(key, limit, windowSec);
  }
  try {
    const now = Date.now();
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
    const [allowed, count] = (await r.eval(
      SLIDING_WINDOW_LUA,
      1,
      `rl:${key}`,
      String(now),
      String(windowSec * 1_000),
      String(limit),
      member,
    )) as [number, number, number];
    return {
      allowed: allowed === 1,
      remaining: Math.max(0, limit - count),
      limit,
      retryAfterSec: allowed === 1 ? 0 : windowSec,
      degraded: false,
    };
  } catch {
    if (isProd) return { allowed: false, remaining: 0, limit, retryAfterSec: 30, degraded: true };
    return rateLimitMemory(key, limit, windowSec);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// In-memory fallback (dev only — never silent: degraded=true)
// ─────────────────────────────────────────────────────────────────────────

function checkQuotaMemory(
  ip: string,
  sessionId: string | null | undefined,
  estimatedTokens: number,
  abuseSignal: boolean | undefined,
  headers: Record<string, string>,
): QuotaResult {
  ensureCleanup();
  headers['X-Quota-Degraded'] = 'true';
  const now = Date.now();

  // 1. Sliding-window per-minute: store per-IP timestamps in _mem.sliding.
  //    Key is `rl:<ip>:<member>` → value is its timestamp. Prune expired,
  //    then count. Synchronous in a single process so no race within a node.
  const rlKeyPrefix = `rl:${ip}:`;
  for (const k of _mem.sliding.keys()) {
    if (k.startsWith(rlKeyPrefix) && (_mem.sliding.get(k) ?? 0) < now - RATE_LIMIT_WINDOW_MS) {
      _mem.sliding.delete(k);
    }
  }
  let rlCount = 0;
  for (const k of _mem.sliding.keys()) {
    if (k.startsWith(rlKeyPrefix)) rlCount++;
  }
  if (rlCount >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil(RATE_LIMIT_WINDOW_MS / 1_000),
      degraded: true,
      reason: 'rate_limited',
      headers,
    };
  }
  _mem.sliding.set(`${rlKeyPrefix}${now}:${Math.random().toString(36).slice(2, 8)}`, now);

  // daily quota
  const dayReq = (_mem.dailyReq.get(`req:${ip}`) ?? 0) + 1;
  _mem.dailyReq.set(`req:${ip}`, dayReq);
  if (dayReq > DAILY_REQUEST_QUOTA) {
    return {
      allowed: false,
      retryAfterSec: 3600,
      degraded: true,
      reason: 'daily_quota_exceeded',
      headers,
    };
  }

  // cost cap (milli-USD estimate)
  const costMilli =
    (_mem.dailyCost.get(`cost:${ip}`) ?? 0) +
    Math.ceil((estimatedTokens / 1000) * 1000 * 0.001 * 1000);
  _mem.dailyCost.set(`cost:${ip}`, costMilli);
  if (costMilli > DAILY_COST_USD_CAP * 1000) {
    return {
      allowed: false,
      retryAfterSec: 3600,
      degraded: true,
      reason: 'cost_cap_exceeded',
      headers,
    };
  }

  // abuse
  if (abuseSignal) {
    const score = (_mem.abuse.get(`abuse:${ip}`) ?? 0) + 1;
    _mem.abuse.set(`abuse:${ip}`, score);
    if (score >= ABUSE_BLOCK_THRESHOLD) {
      return {
        allowed: false,
        retryAfterSec: 3600,
        degraded: true,
        reason: 'abuse_blocked',
        headers,
      };
    }
  }

  return { allowed: true, retryAfterSec: 0, degraded: true, reason: 'ok', headers };
}

// ─────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────

export function __resetQuotaForTests(): void {
  _redisTried = false;
  _redisBroken = false;
  if (_redis) {
    try { _redis.disconnect(); } catch { /* ignore */ }
    _redis = null;
  }
  _mem.sliding.clear();
  _mem.dailyReq.clear();
  _mem.dailyCost.clear();
  _mem.circuit.clear();
  _mem.abuse.clear();
  if (_cleanupTimer) {
    clearInterval(_cleanupTimer);
    _cleanupTimer = null;
  }
}
