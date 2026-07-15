/**
 * src/lib/redis.ts — CHAT-SESSION-2026-07-15
 *
 * Redis client + chat session store for /api/ai/chat/.
 *
 * Purpose:
 *   Persist the last N messages of a multi-turn conversation in Redis so
 *   the next request can inject them as context. Uses a single Redis LIST
 *   per session, kept short by LTRIM and short-lived by EXPIRE.
 *
 * Fallback contract (CHAT-SESSION-2026-07-15 / DEC-CHAT-SESSION-001):
 *   - If REDIS_URL is set and the connection succeeds, use Redis (atomic
 *     LPUSH + LTRIM + EXPIRE in a pipeline).
 *   - Otherwise (env unset, connection refused, or runtime error), fall
 *     back to an in-memory Map keyed by sessionId. The fallback is
 *     best-effort and per-process; it survives only until the Node
 *     service restarts. This is fine for local dev (no Redis) and for
 *     degraded prod (the chat keeps working, just without shared state
 *     across requests on different replicas or after a restart).
 *   - Every store call returns `{ messages, degraded }` so the caller
 *     can surface a `X-Chat-Session: degraded` header when the fallback
 *     is in use. The chat endpoint stays available in both modes; the
 *     user just doesn't get multi-turn context in degraded mode.
 *
 * Why a single pipeline for push:
 *   LPUSH + LTRIM + EXPIRE in a pipeline means one round-trip and one
 *   atomicity window. Even if the EXPIRE were a separate call, Redis
 *   would still apply the LTRIM+LPUSH atomically; bundling EXPIRE
 *   avoids a race where a push extends the list but the EXPIRE call
 *   gets lost (e.g. timeout, then a later push arrives after the TTL
 *   has elapsed for a list that briefly existed).
 *
 * Security:
 *   - sessionId is treated as untrusted user input. We namespace all
 *     keys with `chat:sess:` to keep them isolated from the rest of
 *     the Redis keyspace.
 *   - We do not log message content (PII risk). Only the sessionId
 *     and operation type are logged on errors.
 *   - The fallback Map is bounded by `MAX_FALLBACK_SESSIONS` to prevent
 *     unbounded memory growth if a client invents a million sessionIds.
 */

import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────────────
// Public configuration (mirrors the dashboard firewall rate-limit pattern
// in apps/dashboard/lib/firewall/ratelimit/redis-bucket.ts)
// ─────────────────────────────────────────────────────────────────────────

/** Fallback cap. 10k sessions × 8 messages × ~500 chars ≈ 40MB worst case. */
const MAX_FALLBACK_SESSIONS = 10_000;

/** Per-call pipeline timeout. Keep low to avoid blocking request handlers. */
const REDIS_PIPELINE_TIMEOUT_MS = 1_500;

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Unix ms. Set by the caller. */
  ts: number;
}

export interface StoreResult<T> {
  ok: T;
  /** True when the in-memory fallback was used. The caller should set
   *  `X-Chat-Session: degraded` to surface this to the client. */
  degraded: boolean;
}

export interface ChatSessionStore {
  /** Push one or more messages to the tail of the session. Keeps only
   *  the most recent `maxMessages` entries and refreshes the TTL. */
  push(
    sessionId: string,
    messages: ChatMessage[],
    opts: { maxMessages: number; ttlSeconds: number },
  ): Promise<StoreResult<true>>;

  /** Return the most recent N messages for the session, in chronological
   *  order (oldest first). Empty array if the session has no history or
   *  the TTL has elapsed. */
  recent(
    sessionId: string,
    max: number,
  ): Promise<StoreResult<ChatMessage[]>>;

  /** Close any underlying connections. Used in tests. */
  close(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────
// Redis-backed implementation
// ─────────────────────────────────────────────────────────────────────────

let redisClient: Redis | null = null;
let redisInitTried = false;

function getRedisClient(): Redis | null {
  if (redisInitTried) return redisClient;
  redisInitTried = true;
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      // Don't let a slow Redis stall the request handler.
      connectTimeout: 2_000,
    });
    redisClient.on('error', () => {
      // Swallow per-message errors. The push/recent methods check
      // status before calling, and the per-call try/catch below
      // handles everything else. We do NOT log here because it
      // would fire on every reconnect attempt.
    });
    // Non-blocking connect. If it fails, redisClient stays null and
    // the fallback Map takes over for the rest of the process lifetime.
    redisClient.connect().catch(() => {
      redisClient = null;
    });
    return redisClient;
  } catch {
    redisClient = null;
    return null;
  }
}

function makeKey(sessionId: string): string {
  // sessionId is validated upstream (UUID v4/v7). We add the namespace
  // prefix to keep chat keys isolated from the rest of the Redis db.
  return `chat:sess:${sessionId}`;
}

class RedisStore implements ChatSessionStore {
  private get client(): Redis | null {
    return getRedisClient();
  }

  async push(
    sessionId: string,
    messages: ChatMessage[],
    opts: { maxMessages: number; ttlSeconds: number },
  ): Promise<StoreResult<true>> {
    const r = this.client;
    if (!r || r.status !== 'ready') {
      return fallback.push(sessionId, messages, opts).then((res) => ({
        ...res,
        ok: true as const,
      }));
    }
    const key = makeKey(sessionId);
    const serialized = messages.map((m) => JSON.stringify(m));
    // Pipeline: LPUSH one or more (LPUSH with multiple values inserts in
    // reverse order; the LAST arg ends up at the head. We want chronological
    // newest-at-head, so reverse first.). Then LTRIM 0 (maxMessages-1).
    // Then EXPIRE. Single round-trip.
    const reversed = serialized.reverse(); // LPUSH inserts from the right
    try {
      const pipe = r.pipeline();
      pipe.lpush(key, ...reversed);
      pipe.ltrim(key, 0, opts.maxMessages - 1);
      pipe.expire(key, opts.ttlSeconds);
      await pipe.exec();
      return { ok: true, degraded: false };
    } catch {
      return fallback.push(sessionId, messages, opts).then((res) => ({
        ...res,
        ok: true as const,
      }));
    }
  }

  async recent(
    sessionId: string,
    max: number,
  ): Promise<StoreResult<ChatMessage[]>> {
    const r = this.client;
    if (!r || r.status !== 'ready') {
      return fallback.recent(sessionId, max);
    }
    const key = makeKey(sessionId);
    try {
      const raw = (await Promise.race([
        r.lrange(key, 0, max - 1),
        new Promise<string[]>((_, reject) =>
          setTimeout(
            () => reject(new Error('redis_timeout')),
            REDIS_PIPELINE_TIMEOUT_MS,
          ),
        ),
      ])) as string[] | null;
      if (!raw || raw.length === 0) {
        return { ok: [], degraded: false };
      }
      // raw[0] is the newest (LPUSH head). Reverse to chronological.
      const messages: ChatMessage[] = [];
      for (let i = raw.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(raw[i]) as ChatMessage;
          if (
            parsed &&
            typeof parsed === 'object' &&
            (parsed.role === 'user' || parsed.role === 'assistant') &&
            typeof parsed.content === 'string'
          ) {
            messages.push({
              role: parsed.role,
              content: parsed.content.slice(0, 4000), // defensive cap
              ts: typeof parsed.ts === 'number' ? parsed.ts : 0,
            });
          }
        } catch {
          // Skip malformed entries silently.
        }
      }
      return { ok: messages, degraded: false };
    } catch {
      return fallback.recent(sessionId, max);
    }
  }

  async close(): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch {
        // ignore
      }
      redisClient = null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// In-memory fallback (per-process, no Redis)
// ─────────────────────────────────────────────────────────────────────────

interface FallbackEntry {
  messages: ChatMessage[];
  resetAt: number;
}

const fallbackBuckets = new Map<string, FallbackEntry>();

function fallbackEvictIfExpired(sessionId: string, ttlSeconds: number): void {
  const entry = fallbackBuckets.get(sessionId);
  if (!entry) return;
  if (Date.now() > entry.resetAt) {
    fallbackBuckets.delete(sessionId);
  }
}

function fallbackBounded(): void {
  if (fallbackBuckets.size <= MAX_FALLBACK_SESSIONS) return;
  // Evict oldest resetAt. The Map preserves insertion order, but we
  // need to find the smallest resetAt. Linear scan is fine for 10k entries.
  let oldestKey: string | null = null;
  let oldestReset = Infinity;
  for (const [k, v] of fallbackBuckets) {
    if (v.resetAt < oldestReset) {
      oldestReset = v.resetAt;
      oldestKey = k;
    }
  }
  if (oldestKey !== null) fallbackBuckets.delete(oldestKey);
}

class InMemoryStore implements ChatSessionStore {
  async push(
    sessionId: string,
    messages: ChatMessage[],
    opts: { maxMessages: number; ttlSeconds: number },
  ): Promise<StoreResult<true>> {
    fallbackEvictIfExpired(sessionId, opts.ttlSeconds);
    const existing = fallbackBuckets.get(sessionId);
    // The store keeps entries in NEWEST-FIRST order (mirroring the
    // Redis LPUSH convention: index 0 = newest). The caller passes
    // `messages` in chronological order [u, a], so we reverse before
    // prepending to the (already newest-first) base.
    const reversedNew = [...messages].reverse();
    const base = existing ? existing.messages.slice() : [];
    const merged = [...reversedNew, ...base].slice(0, opts.maxMessages);
    fallbackBuckets.set(sessionId, {
      messages: merged,
      resetAt: Date.now() + opts.ttlSeconds * 1000,
    });
    fallbackBounded();
    return { ok: true, degraded: true };
  }

  async recent(
    sessionId: string,
    max: number,
  ): Promise<StoreResult<ChatMessage[]>> {
    const entry = fallbackBuckets.get(sessionId);
    if (!entry) return { ok: [], degraded: true };
    if (Date.now() > entry.resetAt) {
      fallbackBuckets.delete(sessionId);
      return { ok: [], degraded: true };
    }
    // entry.messages is stored newest-first (push prepends). The
    // public contract is chronological (oldest first), so reverse
    // the slice before returning. The Redis implementation does the
    // same — both backends share the same ordering invariant.
    const chronological = entry.messages.slice(0, max).slice().reverse();
    return {
      ok: chronological.map((m) => ({
        role: m.role,
        content: m.content,
        ts: m.ts,
      })),
      degraded: true,
    };
  }

  async close(): Promise<void> {
    fallbackBuckets.clear();
  }
}

const fallback = new InMemoryStore();

// ─────────────────────────────────────────────────────────────────────────
// Public factory
// ─────────────────────────────────────────────────────────────────────────

let _instance: ChatSessionStore | null = null;

/**
 * Get the chat session store for the current process. The instance is
 * memoized; calling this from multiple endpoints returns the same store
 * (which means the same Redis client and the same fallback Map).
 */
export function getChatSessionStore(): ChatSessionStore {
  if (_instance) return _instance;
  _instance = new RedisStore();
  return _instance;
}

/** Test-only: reset the singleton so a new test can re-init. */
export function __resetChatSessionStoreForTests(): void {
  _instance = null;
  redisInitTried = false;
  if (redisClient) {
    try {
      redisClient.disconnect();
    } catch {
      // ignore
    }
    redisClient = null;
  }
  fallbackBuckets.clear();
}
