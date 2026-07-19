/**
 * src/middleware.ts — Astro SSR middleware.
 *
 * P0-3 (2026-07-19): request ID propagation + Sentry init.
 * Runs before every SSR route (/api/ai/chat, /api/lead, /api/health, etc.).
 */

import { defineMiddleware } from 'astro:middleware';
import { randomUUID } from 'node:crypto';

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Sentry init (idempotent, no-op if DSN unset).
  const { initSentry } = await import('./lib/observability/sentry');
  initSentry();

  // 2. Request ID — trust upstream if set (e.g. Cloudflare), else generate.
  const incoming = context.request.headers.get('x-request-id');
  const requestId = incoming ?? randomUUID();
  context.locals.requestId = requestId;

  // 3. Forward to next handler.
  const response = await next();
  // 4. Echo the request ID back so clients can correlate.
  response.headers.set('x-request-id', requestId);
  return response;
});
