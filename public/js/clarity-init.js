/**
 * clarity-init.js — Microsoft Clarity deferred loader + provider.
 *
 * Loaded with `defer` from BaseLayout.astro. Replaces a prior is:inline Clarity
 * script to remove the need for `unsafe-inline` in CSP script-src. The Clarity
 * ID is read from the `data-clarity-id` attribute on this <script> tag (HTML
 * attributes are not governed by script-src CSP).
 *
 * BAI-PERF-04 (2026-07-25): lazy-load Clarity via requestIdleCallback
 * (fallback: setTimeout 3000ms) so the ~20KB clarity.ms payload never
 * competes with the LCP element or blocks the main thread at load time.
 *
 * Behavior contract (preserved from prior version):
 *   1. Skip silently if no Clarity ID is configured (placeholder or empty).
 *   2. Set up window.clarity queue function immediately so calls before the
 *      tag loads are queued (matches Clarity's published install pattern).
 *   3. Load https://www.clarity.ms/tag/<id> lazily via requestIdleCallback
 *      (fallback: setTimeout 3000ms).
 *   4. Register as a provider with the unified analytics runtime
 *      (window.__BRIGHTAI_ANALYTICS__.registerProvider) so all events
 *      flow through the unified layer.
 *
 * No tracking data is lost — the initial window.clarity() queue captures
 * everything before the tag loads and replays it once the script arrives.
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

  // 1. Set up the Clarity queue function immediately (matches the standard
  //    c/l/a/r/i/t/y pattern — window.clarity captures calls before the tag
  //    loads and replays them once the script arrives).
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  // 2. Register as a provider with the unified analytics runtime. Safe to
  //    call before the runtime is installed — we poll every 20ms up to 1s.
  function registerClarityProvider() {
    var rt = window.__BRIGHTAI_ANALYTICS__;
    if (!rt) return false;
    rt.registerProvider({
      name: 'clarity',
      fn: function (event, payload) {
        if (typeof window.clarity === 'function') {
          window.clarity('event', event, { page_path: payload.page_path || window.location.pathname });
        }
      },
    });
    return true;
  }
  if (!registerClarityProvider()) {
    var attempts = 0;
    var iv = setInterval(function () {
      if (registerClarityProvider() || ++attempts > 50) clearInterval(iv);
    }, 20);
  }

  // 3. Load the Clarity tag lazily — never competes with the LCP element.
  function loadClarity() {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', id);
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadClarity, { timeout: 4000 });
  } else {
    setTimeout(loadClarity, 3000);
  }
  /* eslint-enable */
})();
