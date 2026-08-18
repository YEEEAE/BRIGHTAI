// Shared, server-side security gates for API routes. Middleware is a useful
// outer wall, but endpoints call these helpers themselves so an adapter or
// future routing change cannot accidentally expose an API handler.

import type { APIContext } from 'astro';
import { getCurrentUser } from './session';
import type { User } from './types';

/** Multipart overhead is allowed around the existing 10 MB file limit. */
export const MAX_REQUEST_BODY_BYTES = 12 * 1024 * 1024;
const MAX_MUTATIONS_PER_MINUTE = 120;
const mutationBuckets = new Map<string, { startedAt: number; count: number }>();

export function apiJsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
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

export function requireAiRateLimit(userId: number): Response | null {
  const now = Date.now();
  const bucket = aiBuckets.get(userId);
  if (!bucket || now - bucket.startedAt >= 60_000) {
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
 * CSRF gate for unsafe API methods. Astro also performs its own protection for
 * form requests; this explicit check protects handlers if that configuration
 * changes and makes the API contract independently auditable.
 */
export function requireCsrf(context: APIContext): Response | null {
  const origin = context.request.headers.get('origin');
  if (origin === context.url.origin) return null;
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
  const key = `${ip}:${context.url.pathname}`;
  const bucket = mutationBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= 60_000) {
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
