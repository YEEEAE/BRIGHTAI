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
 * Behavior contract:
 *   1. Skip silently if no Clarity ID is configured (placeholder or empty).
 *   2. Register with the unified analytics runtime and wait for explicit
 *      consent before creating the queue or loading Clarity.
 *   3. Load https://www.clarity.ms/tag/<id> lazily after consent.
 *
 * The event queue contains only events generated after consent; it replays
 * those events once the tag arrives.
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

  var clarityScheduled = false;

  // Register with the unified analytics runtime. It may load after this
  // deferred bootstrap, so retry briefly while noncritical modules start.
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
    if (typeof rt.onConsentChange === 'function') {
      rt.onConsentChange(function (state) {
        if (state === 'granted') scheduleClarity();
      });
    }
    if (typeof rt.getConsent === 'function' && rt.getConsent() === 'granted') scheduleClarity();
    return true;
  }
  if (!registerClarityProvider()) {
    var attempts = 0;
    var iv = setInterval(function () {
      if (registerClarityProvider() || ++attempts > 300) clearInterval(iv);
    }, 200);
  }

  // Load Clarity only after consent; retain the existing idle-load behavior.
  function scheduleClarity() {
    if (clarityScheduled) return;
    clarityScheduled = true;
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadClarity, { timeout: 4000 });
    } else {
      setTimeout(loadClarity, 3000);
    }
  }

  function loadClarity() {
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', id);
  }
  /* eslint-enable */
})();
