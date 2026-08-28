// Shared, server-side security gates for API routes. Middleware is a useful
// outer wall, but endpoints call these helpers themselves so an adapter or
// future routing change cannot accidentally expose an API handler.

import type { APIContext } from 'astro';
import { getCurrentUser } from './session';
import type { User } from './types';
import type { SafeErrorCode } from './observability';

/** Multipart overhead is allowed around the existing 10 MB file limit. */
export const MAX_REQUEST_BODY_BYTES = 12 * 1024 * 1024;
const MAX_MUTATIONS_PER_MINUTE = 120;
const mutationBuckets = new Map<string, { startedAt: number; count: number }>();

export function apiJsonError(error: string, status: number, code: SafeErrorCode = status === 403 ? 'FORBIDDEN' : status === 401 ? 'AUTH' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : status >= 500 ? 'DB' : 'VALIDATION'): Response {
  return new Response(JSON.stringify({ ok: false, error, code }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// AI features call an external provider and are the most expensive, abusive
// endpoint — they get their own per-user budget (independent of the generic
// IP+pathname mutation limiter below) so a heavy AI user cannot exhaust the
// shared bucket, and a leaked session cannot drive unbounded provider spend.
const MAX_AI_CALLS_PER_MINUTE = 15;
const aiBuckets = new Map<number, { startedAt: number; count: number }>();

// All limiter state is in-memory because QC runs as a single writable
// instance (enforced by the deployment contract). Buckets live for one rate
// window, so they are pruned to keep the maps bounded for the process
// lifetime: opportunistically at most once per window, or immediately if a
// map grows past the safety threshold (e.g. a spoofed-IP flood).
const RATE_WINDOW_MS = 60_000;
const PRUNE_MIN_INTERVAL_MS = 60_000;
const BUCKET_MAP_PRUNE_THRESHOLD = 4096;
let lastPruneAt = 0;

/**
 * Delete every expired bucket from the in-memory limiter maps and return how
 * many entries were removed per limiter. Exported for deterministic tests —
 * `now` is injectable so the test never sleeps.
 */
export function pruneRateLimitBuckets(now: number = Date.now()): { mutations: number; ai: number } {
  let mutations = 0;
  for (const [key, bucket] of mutationBuckets) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) {
      mutationBuckets.delete(key);
      mutations += 1;
    }
  }
  let ai = 0;
  for (const [key, bucket] of aiBuckets) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) {
      aiBuckets.delete(key);
      ai += 1;
    }
  }
  return { mutations, ai };
}

function maybePrune(now: number): void {
  const due = now - lastPruneAt >= PRUNE_MIN_INTERVAL_MS;
  const oversized =
    mutationBuckets.size > BUCKET_MAP_PRUNE_THRESHOLD || aiBuckets.size > BUCKET_MAP_PRUNE_THRESHOLD;
  if (!due && !oversized) return;
  lastPruneAt = now;
  pruneRateLimitBuckets(now);
}

export function requireAiRateLimit(userId: number): Response | null {
  const now = Date.now();
  maybePrune(now);
  const bucket = aiBuckets.get(userId);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    aiBuckets.set(userId, { startedAt: now, count: 1 });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > MAX_AI_CALLS_PER_MINUTE) {
    return apiJsonError('AI rate limit exceeded. Try again later.', 429);
  }
  return null;
}

/** Resolve the authoritative user from the persisted server session. */
export function requireApiUser(context: APIContext): User | Response {
  const user = getCurrentUser(context);
  return user ?? apiJsonError('Not authenticated.', 401);
}

/**
 * CSRF gate for unsafe API methods. Two independent layers:
 *
 * 1. Fetch Metadata (defense-in-depth): browsers attach `Sec-Fetch-Site` to
 *    every request and cross-site JavaScript/forms cannot forge it. A
 *    `cross-site` value is rejected outright; `same-origin` is accepted
 *    immediately. Any other value (`same-site`, `none`, unknown) or an absent
 *    header (older browsers, non-browser clients) falls back to layer 2.
 * 2. Origin check: the request `Origin` header must exactly match the site
 *    origin, so a forged cross-origin submission is refused even when Fetch
 *    Metadata is unavailable.
 *
 * Accepts any object carrying `request` and `url` so both full APIContext
 * dispatchers and minimal page-form contexts can share one implementation.
 */
export function requireCsrf(context: { request: Request; url: URL }): Response | null {
  return requireCsrfForRequest(context.request, context.url.origin);
}

/** Request-level variant for dispatchers without an Astro URL object. */
export function requireCsrfForRequest(request: Request, siteOrigin: string): Response | null {
  const secFetchSite = (request.headers.get('sec-fetch-site') ?? '').trim().toLowerCase();
  if (secFetchSite === 'same-origin') return null;
  if (secFetchSite === 'cross-site') return apiJsonError('Cross-site request rejected.', 403);
  const origin = request.headers.get('origin');
  if (origin === siteOrigin) return null;
  return apiJsonError('Invalid request origin.', 403);
}

/** Reject malformed/oversized mutation requests before Astro parses FormData. */
export function requireRequestSecurity(context: APIContext): Response | null {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.request.method)) return null;

  const contentLength = context.request.headers.get('content-length');
  if (contentLength) {
    const length = Number(contentLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > MAX_REQUEST_BODY_BYTES) {
      return apiJsonError('Request body is too large.', 413);
    }
  }

  const contentType = (context.request.headers.get('content-type') ?? '').toLowerCase();
  const hasBody =
    (contentLength != null && Number(contentLength) > 0) ||
    context.request.headers.has('transfer-encoding');
  // A POST with no body (for example, reopen/mark-read actions) has no media
  // type by design. Any non-empty body must still declare one of the allowed
  // types before a handler attempts to parse it.
  if (!contentType && !hasBody) {
    return applyMutationRateLimit(context);
  }
  const allowed =
    contentType.startsWith('application/x-www-form-urlencoded') ||
    contentType.startsWith('multipart/form-data') ||
    contentType.startsWith('application/json');
  if (!allowed) return apiJsonError('Unsupported request Content-Type.', 415);

  return applyMutationRateLimit(context);
}

function applyMutationRateLimit(context: APIContext): Response | null {
  // Login has a stricter account/IP limiter in auth.ts. This protects every
  // other mutation from a cheap request flood without trusting client headers.
  const ip = context.clientAddress;
  if (!ip) return null;
  const now = Date.now();
  maybePrune(now);
  const key = `${ip}:${context.url.pathname}`;
  const bucket = mutationBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    mutationBuckets.set(key, { startedAt: now, count: 1 });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > MAX_MUTATIONS_PER_MINUTE) {
    return apiJsonError('Too many requests. Try again later.', 429);
  }
  return null;
}

export function isResponse(value: User | Response): value is Response {
  return value instanceof Response;
}
