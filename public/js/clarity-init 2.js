/**
 * clarity-init.js — Microsoft Clarity loader.
 *
 * Loaded with `defer` from BaseLayout.astro. Replaces a prior is:inline Clarity
 * script to remove the need for `unsafe-inline` in CSP script-src. The Clarity
 * ID is read from the `data-clarity-id` attribute on this <script> tag (HTML
 * attributes are not governed by script-src CSP).
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
  /* eslint-disable */
  var id = '';
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('/js/clarity-init.js') !== -1) {
      id = scripts[i].getAttribute('data-clarity-id') || '';
      break;
    }
  }
  if (!id) return; // no Clarity ID configured — skip silently
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