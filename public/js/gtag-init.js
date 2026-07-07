/**
 * gtag-init.js — Google Analytics (gtag.js) deferred loader.
 *
 * Loaded with `defer` from BaseLayout.astro to replace the inline is:inline
 * script that previously lived in <head>. The Google Tag ID is injected at
 * build time from SITE.googleTagId (see BaseLayout.astro).
 *
 * Behavior contract (preserved from prior inline version):
 *   1. Initialize window.dataLayer + gtag() shim immediately.
 *   2. Fire the `js` + `config` events (config: anonymize_ip=true, send_page_view=false).
 *   3. Load gtag.js itself lazily via requestIdleCallback (fallback: setTimeout 1500ms)
 *      so the 182KB gtag.js payload never competes with the LCP element.
 *   4. After gtag.js loads, fire page_view once with current URL/title/path.
 *
 * No tracking happens before gtag.js loads — the initial config event primes
 * the dataLayer so subsequent gtag() calls don't get lost.
 */
(function () {
  'use strict';
  /* eslint-disable */
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', window.__BRIGHTAI_GTAG_ID__ || '', {
    anonymize_ip: true,
    send_page_view: false
  });
  function loadGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + (window.__BRIGHTAI_GTAG_ID__ || '');
    s.onload = function () {
      gtag('event', 'page_view', {
        page_path: window.location.pathname,
        page_title: document.title,
        page_location: window.location.href
      });
    };
    document.head.appendChild(s);
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGtag, { timeout: 4000 });
  } else {
    setTimeout(loadGtag, 1500);
  }
  /* eslint-enable */
})();