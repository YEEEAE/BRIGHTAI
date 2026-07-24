/**
 * src/middleware.ts — Astro SSR middleware.
 *
 * P0-3 (2026-07-19): request ID propagation + Sentry init.
 * BAI-IDX-02 (2026-07-25): security header enforcement on SSR responses.
 *
 * Runs before every SSR route (/api/ai/chat, /api/lead, /api/health,
 * /api/csp-report, /api/csrf-token). The Node adapter serves prerendered
 * static pages directly from dist/client/ without invoking this
 * middleware, so static pages are protected at a different layer
 * (meta http-equiv via the injectSecurityMeta() integration, plus
 * Cloudflare edge Transform Rules for HSTS — see
 * docs/cloudflare-deployment-headers.md).
 */

import { defineMiddleware } from 'astro:middleware';
import { randomUUID } from 'node:crypto';

import {
  RESPONSE_SECURITY_HEADERS,
} from '../scripts/security-headers.mjs';

/**
 * Apply the canonical BrightAI security posture to an outgoing
 * response. Idempotent — safe to call on the same response object
 * multiple times. Reads RESPONSE_SECURITY_HEADERS from
 * scripts/security-headers.mjs (single source of truth shared with
 * the static-page meta injection and the post-deploy verifier).
 *
 * Notes:
 *   - Skips headers whose value is already set on the response (e.g.
 *     a downstream route set a more specific value). The SSR routes
 *     do not currently do this, but the contract is preserved.
 *   - Cloudflare's edge may add HSTS via a Transform Rule on top of
 *     these (see docs/cloudflare-deployment-headers.md). Duplicates
 *     collapse to the first value per HTTP semantics.
 */
function applySecurityHeaders(response) {
  if (!response?.headers) return;
  for (const [name, value] of Object.entries(RESPONSE_SECURITY_HEADERS)) {
    // Case-insensitive existence check. set() is a no-op if the header
    // already exists with the same value, but to keep the contract
    // explicit we only set when absent.
    if (!response.headers.has(name)) {
      response.headers.set(name, value);
    }
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Sentry init (idempotent, no-op if DSN unset).
  const { initSentry } = await import('./lib/observability/sentry');
  initSentry();

  // 2. Request ID — trust upstream if set (e.g. Cloudflare), else generate.
  // Guard header access on prerendered static pages to eliminate build warnings.
  let incoming: string | null = null;
  const descriptor =
    Object.getOwnPropertyDescriptor(context.request, 'headers') ||
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(context.request), 'headers');
  const isAstroPrerenderProxy = Boolean(descriptor?.get?.toString().includes('Astro.request.headers'));

  if (!isAstroPrerenderProxy) {
    try {
      incoming = context.request.headers.get('x-request-id');
    } catch {
      // Safe fallback
    }
  }

  const requestId = incoming ?? randomUUID();
  context.locals.requestId = requestId;

  // 3. Forward to next handler.
  const response = await next();

  // 4. Echo the request ID back so clients can correlate.
  if (response?.headers) {
    response.headers.set('x-request-id', requestId);
  }

  // 5. BAI-IDX-02: apply the canonical security header posture to
  //    every SSR response. This is the authoritative layer for
  //    HSTS on the /api/* routes — prerendered static pages are
  //    covered by meta http-equiv + Cloudflare (see
  //    docs/cloudflare-deployment-headers.md).
  applySecurityHeaders(response);

  return response;
});
