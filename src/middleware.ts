/**
 * middleware.ts — Astro middleware for per-request CSP nonce generation.
 *
 * REPORTS-CSP-01 (2026-07-15, HIGH-07 / IP-08): Phase 2 of the CSP hardening
 * roadmap. Generates a fresh base64 nonce for every request and exposes it
 * via Astro.locals.cspNonce so layouts/pages can stamp it onto <script>
 * tags and CSP headers.
 *
 * Usage from a .astro file:
 *   ---
 *   const nonce = Astro.locals.cspNonce;
 *   ---
 *   <script nonce={nonce}>window.__NONCE__ = '{nonce}';</script>
 *
 * CSP header shape (set by Render.yaml / _headers / Node adapter):
 *   script-src 'self' 'nonce-{RANDOM}' https://www.googletagmanager.com ...
 *
 * Why this is safe:
 *   - Nonce is cryptographically random (16 bytes via crypto.getRandomValues).
 *   - Each request gets a fresh nonce — an attacker can't pre-compute it.
 *   - Server-side scripts can't read it (no inline JS can run without the
 *     nonce, which only the server-rendered HTML contains).
 *
 * Scope (this middleware):
 *   - Runs only for SSR pages (output: 'static' + adapter=node). The 190
 *     prerendered pages served from dist/client/ don't get a per-request
 *     nonce (they'd need a build-time deterministic nonce, which is less
 *     secure because it's constant across requests).
 *
 *   - Until all 190 prerendered pages are migrated to SSR (out of scope for
 *     this task), the middleware stamps the nonce onto the SSR pages only.
 *     The static pages keep 'unsafe-inline' as a fallback until the migration
 *     is complete (documented in report/2026-07-15-csp-hardening.md).
 *
 * Phase 3 (post-REPORTS-CSP-01):
 *   - Migrate all pages to SSR OR add a build-time nonce to every prerendered
 *     HTML file via a post-build hook (similar to perf-css-defer).
 *   - Replace 'unsafe-inline' with 'nonce-{STATIC_NONCE}' in render.yaml /
 *     public/_headers.
 *
 * NOT YET ACTIVE — middleware file created and wired but the render.yaml
 * CSP still contains 'unsafe-inline' until the user approves the Phase 2
 * deployment (see report).
 */

import type { MiddlewareHandler } from 'astro';

/**
 * Generates a 128-bit cryptographically random nonce encoded as base64.
 * Uses Web Crypto API (available in Node 19+ and all modern browsers).
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Convert to base64 without padding for compactness.
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary).replace(/=+$/, '');
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Skip nonce generation for prerendered/static asset requests to save CPU.
  // Static files don't include nonce-aware scripts (they're plain <script src>).
  const url = new URL(context.request.url);
  const isStaticAsset = /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|avif|svg|ico|xml|txt|json|webmanifest)$/i.test(
    url.pathname
  );

  if (!isStaticAsset) {
    const nonce = generateNonce();
    context.locals.cspNonce = nonce;

    // Stamp CSP nonce onto the response headers as well so SSR responses
    // include the same nonce the client sees in <script nonce="...">.
    // NOTE: For Render deployments, the CSP header is currently set by
    // render.yaml (covers static assets). For SSR pages, this middleware
    // adds a per-response CSP that includes the nonce.
    const response = await next();
    if (response instanceof Response) {
      // Build CSP header value with the nonce. Allow external origins that
      // match the current render.yaml CSP (analytics, fonts, etc.).
      const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'self'",
        `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com https://www.clarity.ms https://*.clarity.ms`,
        `script-src-elem 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com https://www.clarity.ms https://*.clarity.ms`,
        "style-src 'self' https://fonts.googleapis.com",
        "style-src-elem 'self' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://stats.g.doubleclick.net https://o4510966719840256.ingest.us.sentry.io https://*.sentry.io https://www.clarity.ms https://*.clarity.ms",
        "frame-src 'self' https://www.googletagmanager.com https://www.google.com",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "media-src 'self' data: blob: https:",
        "upgrade-insecure-requests",
      ].join('; ');

      const newHeaders = new Headers(response.headers);
      // Replace any existing CSP (don't double up).
      newHeaders.set('Content-Security-Policy', csp);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
    return response;
  }

  return next();
};