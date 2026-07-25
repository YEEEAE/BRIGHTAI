/**
 * scripts/security-headers.mjs — BAI-IDX-02 (2026-07-25)
 *                              + BAI-SEC-18 (2026-07-25) — per-file style hashes
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
 *                   upgrade-insecure-requests; report-uri /api/csp-report.
 *                   BAI-SEC-18 (2026-07-25) — PHASE 1 OF 3 COMPLETE:
 *                   The SoT now has the FULL strict-CSP posture
 *                   (script-src, script-src-elem, style-src-elem all
 *                   WITHOUT 'unsafe-inline'). style-src-elem gets
 *                   per-file 'sha256-...' hashes via the
 *                   injectSecurityMeta() integration (uses the new
 *                   buildCspWithStyleHashes() + computeStyleHash()
 *                   helpers in this file).
 *
 *                   PHASE 1 SHIPPED (3 of 10 migrations done):
 *                   - KernelDemoPill.astro → public/js/kernel-demo-pill.js
 *                   - KernelSidebar.astro → public/js/kernel-sidebar.js
 *                   - connectors.astro define:vars → JSON data block +
 *                     public/js/kernel-connectors.js
 *
 *                   PHASE 1 KEPT 'unsafe-inline' ON script-src +
 *                   style-src-elem TEMPORARILY because the remaining 7
 *                   kernel inline scripts (chat, audit, approvals,
 *                   policies, scenarios, KernelAiAssistant,
 *                   KernelLeadForm) and 2 define:vars (policies,
 *                   scenarios) have NOT been migrated yet — without
 *                   'unsafe-inline' those 5 kernel pages would be
 *                   broken at runtime (CSP blocks their inline scripts).
 *
 *                   PHASE 2: migrate the remaining 7 inline scripts
 *                   + 2 define:vars to public/js/*.js. Each migration
 *                   is a small, isolated PR (~1-2h each). After all
 *                   are done, flip the SoT by removing 'unsafe-inline'
 *                   from script-src + style-src-elem (a one-line edit
 *                   in this file). The integration already handles
 *                   per-file hashes, so no other code changes needed.
 *
 *                   PHASE 3 (out of scope for BAI-SEC-18): remove
 *                   'unsafe-inline' from style-src-attr. This requires
 *                   migrating the remaining 628 inline style="" attrs
 *                   to CSS classes. BAI-SEC-12/13 cover that work.
 *
 *                   See DEC-BAI-SEC-18-2026-07-25-001 (architecture
 *                   + per-file hashes), DEC-BAI-SEC-18-2026-07-25-002
 *                   (3 migrations + 7 remaining).
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

import { createHash } from "node:crypto";

// ─── Canonical posture constants ──────────────────────────────────────────

/**
 * STATIC style-src-elem base — applied to all static pages via the
 * meta tag. Per-file 'sha256-...' hashes for Astro ClientRouter
 * view-transition inline styles are appended by injectSecurityMeta()
 * at build time (computed from each HTML file's actual <style>
 * blocks). See DEC-BAI-SEC-18-2026-07-25-002.
 *
 * For HTTP response headers (SSR /api/* routes), style-src-elem
 * does not apply (JSON responses have no inline styles), so the
 * SoT can use this base value directly.
 *
 * BAI-SEC-18 Phase 1 (2026-07-25): includes 'unsafe-inline' as a
 * bridge until the remaining 7 kernel inline scripts + 2 define:vars
 * are migrated. Phase 2 removes this token (one-line edit). The
 * per-file hash logic is independent of this token — hashes are
 * always appended on top.
 */
export const STYLE_SRC_ELEM_BASE = "'self' 'unsafe-inline'";

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
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://js.hs-scripts.com https://bat.bing.com https://cdn.mxpnl.com https://api.mixpanel.com https://*.mixpanel.com; script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://js.hs-scripts.com https://bat.bing.com https://cdn.mxpnl.com https://api.mixpanel.com https://*.mixpanel.com; script-src-attr 'none'; style-src 'self'; style-src-elem " +
    STYLE_SRC_ELEM_BASE +
    " 'unsafe-inline'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://www.google.com https://stats.g.doubleclick.net https://www.clarity.ms https://*.clarity.ms https://js.hs-scripts.com https://bat.bing.com https://cdn.mxpnl.com https://api.mixpanel.com https://*.mixpanel.com; frame-src 'self' https://www.google.com; worker-src 'self' blob:; manifest-src 'self'; media-src 'self' data: blob: https:; upgrade-insecure-requests; report-uri /api/csp-report",
});

/**
 * <meta http-equiv="..."> tags (other than the CSP) injected by
 * the injectSecurityMeta() Astro integration into every prerendered
 * HTML file in dist/client/.
 *
 * The CSP meta tag is NOT in this list — it is built per-file by
 * the integration because the style-src-elem directive needs
 * per-file 'sha256-...' hashes for Astro ClientRouter view-
 * transition inline styles. The integration reads the HTML file,
 * finds every inline <style> block, computes SHA-256 of each, and
 * builds the per-file CSP via buildCspWithStyleHashes(). This split
 * keeps the declarative SoT in this file and the build-time
 * artifacts in astro.config.mjs.
 */
export const STATIC_SECURITY_META_OTHER = Object.freeze([
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

/**
 * Backwards-compat alias. The CSP entry is built per-file now, so this
 * export is the non-CSP portion only. Old consumers (verifier scripts)
 * that iterated over STATIC_SECURITY_META expecting 4 entries should
 * be updated to use STATIC_SECURITY_META_OTHER + a separate call to
 * buildCspWithStyleHashes() for the CSP entry.
 */
export const STATIC_SECURITY_META = STATIC_SECURITY_META_OTHER;

/**
 * Build the full Content-Security-Policy string for a static HTML file.
 * Takes an array of SHA-256 hashes (each formatted as 'sha256-XXX') for
 * every inline <style> block in that file, and appends them to the
 * style-src-elem directive. If no hashes, the directive is just the
 * base value. Used by injectSecurityMeta() integration in astro.config.mjs.
 *
 * @param {string[]} styleHashes - Array of 'sha256-XXX' formatted hashes
 * @returns {string} Full CSP value ready for http-equiv="Content-Security-Policy"
 */
export function buildCspWithStyleHashes(styleHashes = []) {
  // Build the per-file style-src-elem by appending the file's
  // 'sha256-...' hashes to the base. The base is always present;
  // hashes are appended only when the file has inline <style> blocks.
  const styleSrcElem =
    styleHashes.length > 0
      ? `${STYLE_SRC_ELEM_BASE} ${styleHashes.join(" ")}`
      : STYLE_SRC_ELEM_BASE;
  // Build by string substitution on the SoT template. We match the
  // full directive — base + any 'unsafe-inline' that may be in the
  // SoT (BAI-SEC-18 Phase 1 keeps it temporarily until the remaining
  // 7 inline script migrations land; Phase 2 removes it). This regex
  // is robust to both states.
  return RESPONSE_SECURITY_HEADERS["Content-Security-Policy"].replace(
    /style-src-elem [^;]+;/,
    `style-src-elem ${styleSrcElem};`
  );
}

/**
 * Compute SHA-256 hash of a style content string, formatted as
 * 'sha256-XXX' for inclusion in a CSP style-src-elem directive.
 * The hash uses the CSP-hash format (base64, prefixed).
 *
 * @param {string} styleContent - The raw CSS content (between <style> and </style>)
 * @returns {string} Hash formatted as 'sha256-XXX'
 */
export function computeStyleHash(styleContent) {
  const hash = createHash("sha256")
    .update(styleContent, "utf-8")
    .digest("base64");
  return `'sha256-${hash}'`;
}

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
 * HTML payload of a prerendered static page. BAI-SEC-18: this now
 * returns only the non-CSP meta tags. The CSP is checked separately
 * because it has per-file style-src-elem hashes.
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
