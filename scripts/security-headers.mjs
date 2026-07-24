/**
 * scripts/security-headers.mjs — BAI-IDX-02 (2026-07-25)
 *
 * SINGLE SOURCE OF TRUTH for the BrightAI security header posture across
 * every layer the production response actually traverses:
 *
 *   1. SSR responses (Node adapter — /api/*, future SSR pages):
 *      Applied as HTTP response headers by src/middleware.ts.
 *
 *   2. Prerendered static pages (190 HTML files in dist/client/):
 *      Applied as <meta http-equiv="..."> in every HTML file by the
 *      injectSecurityMeta() Astro integration in astro.config.mjs.
 *      The HTTP layer (Cloudflare) is the authoritative layer for
 *      HSTS on static — see docs/cloudflare-deployment-headers.md.
 *
 *   3. Post-deploy verification:
 *      scripts/verify-live-security-headers.mjs uses EXPECTED_HEADERS
 *      and ALLOWED_META_TAGS to assert the live response shape.
 *
 * WHY ONE FILE (not three):
 *   - Earlier, the posture lived in three places (render.yaml,
 *     public/_headers, and the existing scripts/headers-config.mjs
 *     parsers). The render.yaml `headers:` block does NOT apply to
 *     Render Web Services (Node) — it only applies to Render Static
 *     Sites. public/_headers is a Netlify / Cloudflare Pages
 *     convention not consumed by Render or our Cloudflare front.
 *     Both were documentation-only, not enforcement. This file
 *     replaces them as the actual contract that the live response
 *     must satisfy. The parser file (headers-config.mjs) now
 *     recognises this single source of truth and is kept for
 *     legacy-config drift detection.
 *
 * IMPORTANT — DO NOT 'CORRECT' SAUDI DIALECT IN CSP COMMENTS:
 *   This file is a build/runtime contract. Comments in English.
 *   User-facing copy stays in src/data/site.ts (Saudi dialect).
 *
 * HEADER VALUES — LOCKED 2026-07-25:
 *   HSTS:           2 years + includeSubDomains + preload
 *   X-Frame-Options: SAMEORIGIN
 *   X-Content-Type: nosniff
 *   Referrer-Policy: strict-origin-when-cross-origin
 *   Permissions-Policy: camera=(), microphone=(), geolocation=()
 *   CSP:            default-src 'self'; object-src 'none';
 *                   frame-ancestors 'self'; form-action 'self';
 *                   upgrade-insecure-requests; report-uri /api/csp-report;
 *                   'unsafe-inline' on script-src (kernel pages use
 *                   <script is:inline define:vars> for data injection),
 *                   style-src-elem (Astro ClientRouter emits inline
 *                   view-transition styles), and style-src-attr
 *                   (65+ components use inline style="..." attrs).
 *                   'unsafe-inline' was REMOVED from style-src fallback
 *                   in BAI-PERF-01 (2026-07-25) — BaseLayout.astro no
 *                   longer has a <style is:inline> block; critical CSS
 *                   is now imported as a real /_astro/critical.*.css
 *                   stylesheet. See DEC-CSP-2026-07-15-001 for the
 *                   broader strict-CSP migration plan.
 *
 * CHANGE PROTOCOL:
 *   Any change to POSTURE must:
 *     1. Update the constants below.
 *     2. Update docs/cloudflare-deployment-headers.md if the change
 *        affects what Cloudflare must do at the edge.
 *     3. Re-run `npm run verify:live:headers` against a deployed
 *        preview before merging.
 *     4. Add a DEC to .agents/brain.md (Change Ledger).
 */

// ─── Canonical posture constants ──────────────────────────────────────────

/**
 * HTTP response headers applied by src/middleware.ts to every SSR
 * response. The same values are also expected on the Cloudflare edge
 * for static pages — see docs/cloudflare-deployment-headers.md.
 *
 * HSTS is intentionally first because the first response a browser
 * sees is the one that determines preload-list membership.
 */
export const RESPONSE_SECURITY_HEADERS = Object.freeze({
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Robots-Tag":
    "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://js.hs-scripts.com https://bat.bing.com https://cdn.mxpnl.com https://api.mixpanel.com https://*.mixpanel.com; script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://js.hs-scripts.com https://bat.bing.com https://cdn.mxpnl.com https://api.mixpanel.com https://*.mixpanel.com; script-src-attr 'none'; style-src 'self' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-attr 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://www.google.com https://stats.g.doubleclick.net https://www.clarity.ms https://*.clarity.ms https://js.hs-scripts.com https://bat.bing.com https://cdn.mxpnl.com https://api.mixpanel.com https://*.mixpanel.com; frame-src 'self' https://www.google.com; worker-src 'self' blob:; manifest-src 'self'; media-src 'self' data: blob: https:; upgrade-insecure-requests; report-uri /api/csp-report",
});

/**
 * <meta http-equiv="..."> tags injected by the injectSecurityMeta()
 * Astro integration into every prerendered HTML file in dist/client/.
 *
 * Why meta for static, headers for SSR:
 *   - Render Web Services do NOT apply the `headers:` block in
 *     render.yaml to runtime responses. The prerendered HTML files
 *     in dist/client/ are served by the Node adapter with no header
 *     injection (Cloudflare also does not inject by default).
 *   - Meta http-equiv is the only mechanism that works at the HTML
 *     payload level. Browsers honour it for CSP, X-Content-Type-Options
 *     (Chromium), X-Frame-Options (legacy), and Referrer-Policy.
 *   - HSTS does NOT work in meta — it must come from the HTTP layer
 *     (Cloudflare edge). See docs/cloudflare-deployment-headers.md
 *     for the Cloudflare Transform Rule setup.
 */
export const STATIC_SECURITY_META = Object.freeze([
  {
    httpEquiv: "Content-Security-Policy",
    content: RESPONSE_SECURITY_HEADERS["Content-Security-Policy"],
  },
  {
    httpEquiv: "X-Content-Type-Options",
    content: "nosniff",
  },
  {
    httpEquiv: "X-Frame-Options",
    content: "SAMEORIGIN",
  },
  {
    httpEquiv: "Referrer-Policy",
    content: "strict-origin-when-cross-origin",
  },
]);

// ─── Per-route expectations for the post-deploy verifier ──────────────────

/**
 * Routes the post-deploy check must cover. Each entry pairs a
 * representative URL with the category of headers it should carry.
 *
 * Categories:
 *   - "static-meta":    prerendered HTML page — must contain the meta
 *                       http-equiv tags AND the HTTP layer (Cloudflare)
 *                       should add HSTS + the rest of RESPONSE_SECURITY_HEADERS
 *                       via Transform Rule.
 *   - "ssr-headers":    SSR route (/api/*) — must carry the full
 *                       RESPONSE_SECURITY_HEADERS set as HTTP headers.
 *   - "redirect":       redirect route — final hop must satisfy the
 *                       target's expectation. The verifier follows the
 *                       redirect chain.
 *
 * 20 routes total (the ticket acceptance criterion).
 */
export const SAMPLE_ROUTES = Object.freeze([
  // ── AR static pages (10) ───────────────────────────────────────────────
  { url: "/", kind: "static-meta", label: "Homepage (AR)" },
  { url: "/about/", kind: "static-meta", label: "About" },
  { url: "/contact/", kind: "static-meta", label: "Contact" },
  { url: "/services/", kind: "static-meta", label: "Services" },
  { url: "/pricing/", kind: "static-meta", label: "Pricing" },
  { url: "/demo/", kind: "static-meta", label: "Demo" },
  { url: "/trust/", kind: "static-meta", label: "Trust" },
  { url: "/blog/", kind: "static-meta", label: "Blog index" },
  {
    url: "/blog/sdaia-generative-ai-guidelines-practical-compliance/",
    kind: "static-meta",
    label: "Blog post (SDAIA)",
  },
  {
    url: "/docs/nca-ecc-ai-controls/",
    kind: "static-meta",
    label: "Docs page (NCA ECC)",
  },
  // ── Solutions + Kernel (3) ─────────────────────────────────────────────
  {
    url: "/solutions/",
    kind: "static-meta",
    label: "Solutions index",
  },
  {
    url: "/solutions/ai-governance-platform/",
    kind: "static-meta",
    label: "Solution detail",
  },
  {
    url: "/solutions/government-ai-governance/riyadh/",
    kind: "static-meta",
    label: "Solution + city (Riyadh)",
  },
  // ── Kernel (2) ─────────────────────────────────────────────────────────
  { url: "/kernel/", kind: "static-meta", label: "Kernel index" },
  { url: "/kernel/chat/", kind: "static-meta", label: "Kernel chat" },
  // ── Legal AR + EN (3) ──────────────────────────────────────────────────
  {
    url: "/privacy-policy/",
    kind: "static-meta",
    label: "Privacy policy (AR)",
  },
  { url: "/en/", kind: "static-meta", label: "Homepage (EN)" },
  {
    url: "/en/privacy-policy/",
    kind: "static-meta",
    label: "Privacy policy (EN)",
  },
  // ── SSR endpoints (2) ──────────────────────────────────────────────────
  { url: "/api/csp-report/", kind: "ssr-headers", label: "CSP report (SSR)" },
  { url: "/api/health/", kind: "ssr-headers", label: "Health (SSR)" },
]);

// ─── Helpers used by the verifier ─────────────────────────────────────────

/**
 * Returns true if the route is a prerendered static page (carries
 * meta http-equiv tags) vs an SSR endpoint (carries HTTP response
 * headers directly).
 */
export function isStaticMetaRoute(urlPath) {
  return !urlPath.startsWith("/api/");
}

/**
 * Returns the list of expected HTTP response header names for a route
 * kind. The verifier checks that EVERY name in this list is present
 * in the response headers (with a permissive equality check for CSP
 * because some headers may be normalised by Cloudflare).
 */
export function expectedHttpHeaderNames(kind) {
  // Both static and SSR routes must carry the same HTTP-layer
  // posture, with HSTS being the most important. The static pages
  // rely on Cloudflare to inject it (see docs/cloudflare-deployment-headers.md).
  return Object.keys(RESPONSE_SECURITY_HEADERS);
}

/**
 * Returns the meta http-equiv tags that must be present in the
 * HTML payload of a prerendered static page.
 */
export function expectedMetaTags() {
  return STATIC_SECURITY_META;
}

/**
 * Normalises a header name for case-insensitive comparison. HTTP
 * header names are case-insensitive; some intermediaries normalise
 * the case (e.g. 'Content-Security-Policy' may arrive as
 * 'content-security-policy'). The verifier uses this when matching.
 */
export function normaliseHeaderName(name) {
  return String(name).toLowerCase();
}
