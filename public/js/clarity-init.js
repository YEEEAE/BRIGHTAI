/**
 * clarity-init.js — Microsoft Clarity loader.
 *
 * Loaded with `defer` from BaseLayout.astro to replace the inline is:inline
 * Clarity script that previously lived in <head>. The Clarity ID is injected
 * at build time from SITE.clarityId via window.__BRIGHTAI_CLARITY_ID__.
 *
 * Behavior contract (preserved from prior inline version):
 *   - Skip silently if no Clarity ID is configured (placeholder or empty).
 *   - Inject the Clarity bootstrap function in the standard c/l/a/r/i/t/y order.
 *   - Load https://www.clarity.ms/tag/<id> asynchronously and insert before
 *     the first existing script tag (matches Clarity's standard snippet).
 *
 * The script body is the exact Clarity-published loader — no functional change.
 */
(function () {
  'use strict';
  var id = window.__BRIGHTAI_CLARITY_ID__;
  if (!id) return; // no Clarity ID configured — skip silently
  /* eslint-disable */
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r);
    t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', id);
  /* eslint-enable */
})();