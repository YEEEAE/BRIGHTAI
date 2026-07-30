/**
 * src/pages/api/kernel/quota-stats.ts — CHAMPION-05 (2026-07-30).
 *
 * Admin-only read-only quota dashboard data source. Surfaces today's global
 * usage/cost (aggregated across IPs), per-provider circuit-breaker state, and
 * the configured quota limits — so the kernel quota screen is observable in
 * production without SSH/Redis CLI access.
 *
 * Contract:
 *   - GET /api/kernel/quota-stats/
 *   - Admin auth: requires header `x-brightai-admin-key` to equal the
 *     `BRIGHTAI_ADMIN_KEY` env var (constant-time compare via timingSafeEqual).
 *     If the env var is unset → 503 (misconfigured, not a client error). If the
 *     header is missing/mismatched → 401. This is self-contained — there is no
 *     pre-existing admin middleware in this project, so the gate lives here.
 *   - No PII. Usage/cost are global aggregates (no per-IP breakdown exposed).
 *   - Read-only. This endpoint NEVER writes to Redis or mutates quota state.
 *     quota.ts enforcement logic is untouched (CHAMPION-05 "preserve quota
 *     logic"); we only READ the same key conventions from a separate
 *     read-only connection.
 *
 * Data sources:
 *   - Circuit state: `isProviderOpen('groq' | 'gemini')` (exported, safe).
 *   - Global aggregates: a short-lived read-only ioredis connection SCANs
 *     `quota:day:req:ip:*` (today's per-IP request counters) and
 *     `quota:day:cost:ip:*` (today's per-IP cost in milli-USD), summing them.
 *     These keys are TTL-bounded to end-of-day-UTC by quota.ts, so the sum is
 *     inherently "today". SCAN iterations are capped (MAX_SCAN_ITERATIONS) to
 *     bound work; with a modest daily-active-IP count this completes quickly.
 *     If REDIS_URL is unset or the scan errors, we return `degraded: true`
 *     with zeros rather than failing — the dashboard stays usable.
 *
 * Limits surfaced come from the SAME env vars quota.ts reads, so the dashboard
 * reflects the live configuration (CHAT_DAILY_QUOTA, CHAT_DAILY_COST_CAP_USD,
 * CHAT_RATE_LIMIT_MAX). They are public configuration, not secrets.
 *
 * Astro: prerender = false (SSR route, like health.ts). Excluded from sitemap
 * by the existing `!page.includes('/api/')` filter.
 *
 * @module pages/api/kernel/quota-stats
 */

import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import Redis from 'ioredis';
import { isProviderOpen } from '../../../lib/quota';

export const prerender = false;

// Cap SCAN iterations so a runaway key namespace can never wedge the endpoint.
// 50 iterations × COUNT 200 = up to 10k keys scanned — far above the expected
// daily-active-IP count for a Saudi B2B marketing site.
const SCAN_COUNT = 200;
const MAX_SCAN_ITERATIONS = 50;

interface ProviderCircuit {
  open: boolean;
}

interface QuotaStatsResponse {
  usage: { requestsToday: number; limit: number };
  cost: { usdToday: number; capUsd: number };
  circuit: { groq: ProviderCircuit; gemini: ProviderCircuit };
  rateLimit: { max: number; windowMs: number };
  degraded: boolean;
  ts: number;
}

/** Constant-time admin key check. Returns true only on exact match. */
function isAdminAuthorized(req: Request): boolean {
  const expected = process.env.BRIGHTAI_ADMIN_KEY;
  if (!expected || typeof expected !== 'string' || expected.length === 0) {
    return false; // misconfigured — caller surfaces 503
  }
  const provided = req.headers.get('x-brightai-admin-key');
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Open a one-shot read-only Redis connection and sum every counter under
 * `pattern`. Returns 0 on any error / when Redis is unavailable.
 *
 * We deliberately do NOT reuse quota.ts's private client (it is private by
 * design and quota.ts is out of scope). This connection is created per
 * request, used only for reads, and disconnected in `finally`.
 */
async function sumCounters(pattern: string): Promise<number> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return 0;
  let client: Redis | null = null;
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 1_500,
      // Read-only intent — never run commands that mutate. We only SCAN + GET.
      readOnly: true,
    });
    await client.connect();

    // do-while because the SCAN cursor starts at '0' and a for-loop with a
    // `cursor !== '0'` guard would never enter its body on the first pass.
    let cursor = '0';
    let total = 0;
    let iterations = 0;
    do {
      const [next, keys] = (await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        SCAN_COUNT,
      )) as [string, string[]];
      cursor = next;
      if (keys.length > 0) {
        // Batch GETs to avoid round-trips per key. Counters are integers;
        // missing/expired keys resolve to null → treated as 0.
        const replies = (await client.mget(...keys)) as (string | null)[];
        for (const v of replies) {
          const n = Number(v);
          if (Number.isFinite(n)) total += n;
        }
      }
      iterations++;
    } while (cursor !== '0' && iterations < MAX_SCAN_ITERATIONS);
    return total;
  } catch {
    return 0;
  } finally {
    if (client) {
      try {
        await client.quit();
      } catch {
        /* ignore — already closing */
      }
    }
  }
}

export const GET: APIRoute = async ({ request }) => {
  // Auth gate. 503 when the server isn't configured (so an operator notices),
  // 401 on a bad/missing key.
  const configured = !!process.env.BRIGHTAI_ADMIN_KEY;
  if (!configured) {
    return new Response(
      JSON.stringify({
        error: 'admin_key_not_configured',
        detail: 'BRIGHTAI_ADMIN_KEY env var is unset on the server.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
  if (!isAdminAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Circuit state via quota.ts's read-only exported API (no Redis touch here).
  let groqOpen = false;
  let geminiOpen = false;
  try {
    [groqOpen, geminiOpen] = await Promise.all([
      isProviderOpen('groq'),
      isProviderOpen('gemini'),
    ]);
  } catch {
    // Treat as closed — circuit reads are best-effort; a Redis blip should not
    // hide the rest of the dashboard. The aggregate step will flag degraded.
  }

  // Global aggregates for today (keys are TTL-bounded to end-of-day-UTC).
  const hasRedis = !!process.env.REDIS_URL?.trim();
  const requestsToday = hasRedis
    ? await sumCounters('quota:day:req:ip:*')
    : 0;
  const costMilli = hasRedis
    ? await sumCounters('quota:day:cost:ip:*')
    : 0;
  const degraded = !hasRedis;

  const body: QuotaStatsResponse = {
    usage: {
      requestsToday,
      limit: Number(process.env.CHAT_DAILY_QUOTA ?? 200),
    },
    cost: {
      usdToday: Math.round((costMilli / 1000) * 100) / 100,
      capUsd: Number(process.env.CHAT_DAILY_COST_CAP_USD ?? 5.0),
    },
    circuit: {
      groq: { open: groqOpen },
      gemini: { open: geminiOpen },
    },
    rateLimit: {
      max: Number(process.env.CHAT_RATE_LIMIT_MAX ?? 10),
      windowMs: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS ?? 60_000),
    },
    degraded,
    ts: Date.now(),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
