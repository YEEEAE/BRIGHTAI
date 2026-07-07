/**
 * gtag-init.js — Google Analytics (gtag.js) deferred loader.
 *
 * Loaded with `defer` from BaseLayout.astro. Replaces a prior is:inline script
 * to remove the need for `unsafe-inline` in CSP script-src. The Google Tag ID
 * is read from the `data-gtag-id` attribute on this <script> tag (HTML
 * attributes are not governed by script-src CSP).
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
  var id = '';
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('/js/gtag-init.js') !== -1) {
      id = scripts[i].getAttribute('data-gtag-id') || '';
      break;
    }
  }
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true, send_page_view: false });
  function loadGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
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