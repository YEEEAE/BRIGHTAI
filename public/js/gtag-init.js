/**
 * gtag-init.js — Google Analytics (gtag.js) deferred loader + provider.
 *
 * Loaded with `defer` from BaseLayout.astro. Replaces a prior is:inline script
 * to remove the need for `unsafe-inline` in CSP script-src. The Google Tag ID
 * is read from the `data-gtag-id` attribute on this <script> tag (HTML
 * attributes are not governed by script-src CSP).
 *
 * Behavior contract (preserved from prior inline version):
 *   1. Initialize window.dataLayer + gtag() shim immediately.
 *   2. Fire `consent: default` (denied for all 4 Consent Mode v2 signals)
 *      BEFORE `js` + `config` so the dataLayer carries the default state
 *      when gtag.js boots. Required by Google Consent Mode v2.
 *   3. Fire the `js` + `config` events (config: anonymize_ip=true, send_page_view=false).
 *   4. Load gtag.js itself lazily via requestIdleCallback (fallback: setTimeout 1500ms)
 *      so the 182KB gtag.js payload never competes with the LCP element.
 *   5. Register as a provider with the unified analytics runtime
 *      (window.__BRIGHTAI_ANALYTICS__.registerProvider) so all events
 *      flow through the unified layer (CRO audit Prompt 5).
 *
 * No tracking happens before gtag.js loads — the initial config event primes
 * the dataLayer so subsequent gtag() calls don't get lost. Consent updates
 * (accept/decline) are pushed by analytics.js setConsent() via
 * gtag('consent', 'update', {...}).
 *
 * BAI-SEC-17 (Consent Mode v2): default is `denied` for all 4 signals
 * (ad_storage, analytics_storage, ad_user_data, ad_personalization). The
 * update from analytics.js setConsent() flips ad_storage + analytics_storage
 * to `granted` on accept and keeps ad_user_data + ad_personalization at
 * `denied` (we don't run Google Ads or personalized ads).
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
  // BAI-SEC-17 — Google Consent Mode v2 default. MUST run before `js` and
  // `config` so gtag.js boots with the default consent state in dataLayer.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true, send_page_view: false });

  // Register as a provider with the unified analytics runtime. Safe to call
  // before the runtime is installed — we use a "ready" check so the
  // registration is replayed when the runtime appears. The provider is
  // best-effort: if dataLayer doesn't exist (extremely early race), the
  // event is dropped.
  function registerGtagProvider() {
    var rt = window.__BRIGHTAI_ANALYTICS__;
    if (!rt) return false;
    rt.registerProvider({
      name: 'gtag',
      fn: function (event, payload) {
        if (typeof window.gtag === 'function') {
          window.gtag('event', event, payload);
        } else if (Array.isArray(window.dataLayer)) {
          window.dataLayer.push(Object.assign({ event: event }, payload));
        }
      },
    });
    return true;
  }
  if (!registerGtagProvider()) {
    // Runtime not installed yet — wait and retry.
    var attempts = 0;
    var iv = setInterval(function () {
      if (registerGtagProvider() || ++attempts > 50) clearInterval(iv);
    }, 20);
  }

  function loadGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGtag, { timeout: 4000 });
  } else {
    setTimeout(loadGtag, 1500);
  }
  /* eslint-enable */
})();
