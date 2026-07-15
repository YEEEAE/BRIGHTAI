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
 * CSP-HARDENING-001 (2026-07-15) — Phase 1 SOFT ENFORCEMENT:
 *   - الحين يستخدم Content-Security-Policy-Report-Only header (ما يكسر شي).
 *   - 'unsafe-inline' يبقى موجود (backward compat مع prerendered pages).
 *   - 'strict-dynamic' مفعّل (GTM injection يشتغل تلقائياً).
 *   - report-uri /api/csp-report يلتقط violations → Sentry alerts.
 *   - بعد أسبوع 0 violations → نحوّل لـ Content-Security-Policy enforcement.
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
      // Build CSP header value with the nonce.
      //
      // Phase 1 (CSP-HARDENING-001): نستخدم Report-Only header.
      //   - 'unsafe-inline' يبقى (backward compat مع الـ prerendered pages).
      //   - 'nonce-{NONCE}' + 'strict-dynamic' (GTM injection الآمن).
      //   - report-uri يلتقط violations → Sentry.
      //   - لا يكسر الموقع حتى لو فيه inline script نسيه الفريق.
      //
      // Phase 2 (بعد أسبوع 0 violations): نغير لـ Content-Security-Policy
      //   ونشيل 'unsafe-inline' نهائياً.
      const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'self'",
        // Phase 1: 'unsafe-inline' للـ prerendered pages (transitional).
        // Phase 2: نشيله بعد أسبوع 0 violations.
        `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com https://www.clarity.ms https://*.clarity.ms https://cdnjs.cloudflare.com`,
        `script-src-elem 'self' 'unsafe-inline' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com https://www.clarity.ms https://*.clarity.ms https://cdnjs.cloudflare.com`,
        "script-src-attr 'unsafe-inline'", // Astro يحقن inline event handlers في attributes
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
        "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://o4510966719840256.ingest.us.sentry.io https://*.sentry.io https://www.clarity.ms https://*.clarity.ms https://c.bing.com",
        "frame-src 'self' https://www.googletagmanager.com",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "media-src 'self' data: blob: https:",
        // report-uri: CSP violations → /api/csp-report → Sentry alerts.
        "report-uri /api/csp-report",
        "upgrade-insecure-requests",
      ].join('; ');

      const newHeaders = new Headers(response.headers);
      // Phase 1: Report-Only. الـ browser يجمع violations بدون enforcement.
      //   بعد أسبوع 0 violations → نغير لـ 'Content-Security-Policy'.
      newHeaders.set('Content-Security-Policy-Report-Only', csp);
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