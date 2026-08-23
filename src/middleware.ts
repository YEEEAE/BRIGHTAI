/**
 * src/middleware.ts — Astro SSR middleware.
 *
 * P0-3 (2026-07-19): request ID propagation + Sentry init.
 * BAI-IDX-02 (2026-07-25): security header enforcement on SSR responses.
 * BAI-IDX-22 (2026-07-25): legacy 301 redirects via `astro.config.mjs
 *   redirects:` (NOT via this middleware — see DEC-BAI-IDX-22-001).
 *   The middleware approach was tried first but Astro's `renderError`
 *   for 404s uses `prerenderedErrorPageFetch` to read the prerendered
 *   404.html from disk and return it directly — the middleware never
 *   runs for 404 paths. Astro's `redirects:` config IS processed for
 *   paths without a static file, so that's the correct layer.
 *
 * Runs before every SSR route (/api/ai/chat, /api/lead, /api/health,
 * /api/csp-report, /api/csrf-token). Prerendered static pages with a
 * matching file in dist/client/ are served directly without invoking
 * this middleware, so they are protected at a different layer (meta
 * http-equiv via the injectSecurityMeta() integration, plus Cloudflare
 * edge Transform Rules for HSTS — see docs/cloudflare-deployment-headers.md).
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

// BAI-IDX-22: legacy URL redirects are handled at build time via
// `astro.config.mjs redirects:` (auto-injected by
// scripts/generate-all-redirects.mjs from redirects.json). The
// middleware is NOT used for legacy redirects because Astro's
// `renderError` for 404 paths reads the prerendered 404.html from
// disk via `prerenderedErrorPageFetch` and returns it directly,
// bypassing the middleware. See DEC-BAI-IDX-22-001.
//
// BAI-IDX-REDIR-001 (2026-08-24): the config-only layer is NOT
// sufficient. Live verification showed (a) Astro's static build drops
// `.html`-suffixed redirect keys from the server manifest, so legacy
// .html URLs 404 even locally, and (b) the deployed Render server 404'd
// trailing-slash legacy keys that work against the identical local dist.
// src/lib/legacy-redirects.mjs (written for BAI-IDX-22 but never wired
// in) is now the runtime fallback HERE: for any GET/HEAD request whose
// pathname misses in the runtime map, we 301 before Astro renders the
// 404 page. Config redirects remain layer 1; this is layer 2 defense —
// identical sources (redirects.json), so no conflicting targets.

import { loadLegacyRedirects, findLegacyRedirect } from './lib/legacy-redirects.mjs';

let redirectMapPromise: Promise<Map<string, { to: string; status: number }>> | null = null;
function getRedirectMap() {
  if (!redirectMapPromise) {
    redirectMapPromise = loadLegacyRedirects();
    // A failed load must not poison the cache — retry on next request.
    redirectMapPromise.catch(() => {
      redirectMapPromise = null;
    });
  }
  return redirectMapPromise;
}

function legacyRedirectResponse(to: string, status: number, requestId: string) {
  const headers = new Headers({ Location: to, 'x-request-id': requestId });
  for (const [name, value] of Object.entries(RESPONSE_SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(null, { status, headers });
}

export const onRequest = defineMiddleware(async (context, next) => {
  // 0. BAI-IDX-REDIR-001: legacy URL fallback redirect. Runs before
  //    everything else; the static handler has already failed to match
  //    a file by the time the middleware is invoked, so any map hit is
  //    a legacy URL that must not 404. Fail-open on any error.
  let requestIdEarly = '';
  try {
    const method = context.request.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD') {
      const url = new URL(context.request.url);
      const map = await getRedirectMap();
      const hit = findLegacyRedirect(url.pathname, map);
      // Self-redirect guard: never 301 a path to itself (loop).
      if (hit && hit.to !== url.pathname) {
        requestIdEarly =
          context.request.headers.get('x-request-id') ?? randomUUID();
        return legacyRedirectResponse(hit.to, hit.status, requestIdEarly);
      }
    }
  } catch {
    // Fail-open: a broken redirects source must never break routing.
  }

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
