/**
 * page-view.js — Astro view-transition page_view tracker.
 *
 * REPORTS-CSP-01 (2026-07-15): Extracted from BaseLayout.astro to remove
 * the inline <script> block. The script fires `gtag('event', 'page_view', ...)`
 * after every view-transition navigation so SPA-style navigations are tracked
 * the same as full-page loads.
 *
 * Why external (not inline):
 *   - Inline scripts require 'unsafe-inline' on script-src in CSP.
 *   - External script tags are allowed by 'self' alone.
 *   - Imported from BaseLayout via <script>import '../scripts/page-view.js';</script>
 *     (Astro bundles this as an external ES module).
 *
 * Why this file is NOT bundled by Astro's build:
 *   - Astro's <script>import</script> pattern compiles this into a hashed
 *     ES module under /_astro/*.js with the usual rel=modulepreload + defer
 *     semantics. No CSP work needed — script-src 'self' covers it.
 *
 * Idempotency: listens for astro:after-swap and waits for window.gtag to exist
 * before calling. If gtag hasn't loaded yet (deferred via requestIdleCallback),
 * the listener waits up to ~5s before giving up silently.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  document.addEventListener('astro:after-swap', function () {
    var attempts = 0;
    var maxAttempts = 100; // 100 × 50ms = 5s
    function tryFire() {
      var w = /** @type {any} */ (window);
      if (w.gtag) {
        w.gtag('event', 'page_view', {
          page_path: window.location.pathname,
          page_title: document.title,
          page_location: window.location.href,
        });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tryFire, 50);
      }
    }
    tryFire();
  });
})();