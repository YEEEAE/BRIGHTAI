/**
 * gtag-init.js — Google Analytics (gtag.js) loader + provider.
 *
 * Loaded with `defer` from BaseLayout.astro. Replaces a prior is:inline script
 * to remove the need for `unsafe-inline` in CSP script-src. The Google Tag ID
 * is read from the `data-gtag-id` attribute on this <script> tag (HTML
 * attributes are not governed by script-src CSP).
 *
 * Behavior contract:
 *   1. Initialize window.dataLayer + gtag() shim immediately.
 *   2. Fire `consent: default` BEFORE `js` + `config` so the dataLayer
 *      carries the default state when gtag.js boots. Required by Google
 *      Consent Mode v2. BAI-ANALYTICS-2026-08-03: analytics_storage is
 *      `granted` by default (visitor analytics restored); ad_storage stays
 *      `denied` for PDPL (no personalized ads).
 *   3. Fire the `js` + `config` events (config: anonymize_ip=true, default
 *      send_page_view=true so gtag.js auto-fires the initial page_view).
 *   4. Load gtag.js itself via an `async` <script> appended to <head>. The
 *      `async` attribute means the browser fetches it in parallel with the
 *      LCP resource and executes it when ready, without blocking paint.
 *   5. Register as a provider with the unified analytics runtime
 *      (window.__BRIGHTAI_ANALYTICS__.registerProvider) so all events
 *      flow through the unified layer (CRO audit Prompt 5).
 *
 * No tracking happens before gtag.js loads — the initial config event primes
 * the dataLayer so subsequent gtag() calls don't get lost. Consent updates
 * (accept/decline) are pushed by analytics.js setConsent() via
 * gtag('consent', 'update', {...}).
 *
 * BAI-SEC-17 (Consent Mode v2) + BAI-ANALYTICS-2026-08-03:
 * Default is `analytics_storage: granted` so GA4 receives hits from all
 * visitors on first load (restores previously-missing visit data).
 * `ad_storage`, `ad_user_data`, `ad_personalization` stay `denied` (we don't
 * run Google Ads or personalized ads → PDPL-friendly). The update from
 * analytics.js setConsent() flips analytics_storage to `denied` when the
 * visitor explicitly declines via the banner.
 *
 * BAI-SEO-2026-07-30: removed `requestIdleCallback` (4s) / `setTimeout`
 * (1.5s) delay before loading gtag.js. The delay made Google Tag Assistant
 * (and GA4 Realtime during testing) report "Tag Not Detected" because the
 * config call landed outside the ~2s detection window. async loading
 * preserves LCP because the LCP element (h1 in SplitHero) renders from
 * inlined HTML+CSS, independent of gtag.js.
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
  // BAI-SEC-17 + BAI-ANALYTICS-2026-08-03 — Consent Mode v2 default. MUST run
  // before `js` and `config` so gtag.js boots with the default consent state.
  // analytics_storage is granted by default so GA4 captures all visitors;
  // ad_storage stays denied (no personalized ads, PDPL-friendly). The banner
  // (analytics.js setConsent) can flip analytics_storage to denied on decline.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'granted',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  gtag('js', new Date());
  // send_page_view omitted intentionally: gtag.js defaults to firing the
  // initial page_view on config. Keeping it false meant we relied on
  // analytics.js to dispatch page_view later, which (a) Tag Assistant does
  // not see within its detection window and (b) gets dropped under Consent
  // Mode v2 default denied until the user clicks Accept. Letting gtag.js
  // send it directly is faster, visible to Tag Assistant, and works with
  // consent modeling — Google receives the hit with the current consent
  // state, so ad_storage=denied users are modeled instead of missing.
  gtag('config', id, { anonymize_ip: true });

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
    // Runtime not installed yet — wait and retry. The unified runtime
    // (analytics.js) is loaded by noncritical-init.js after window load +
    // requestIdleCallback(timeout 2500ms), so on a normal visit it appears
    // several seconds AFTER this defer script runs. The previous 50x20ms
    // (~1s) window expired before the runtime existed, so the gtag provider
    // was never registered and every track() event (custom events + soft
    // navigation page_views) silently never reached GA4. Retry for up to
    // 60s at a low frequency to also cover slow mobile loads.
    var attempts = 0;
    var iv = setInterval(function () {
      if (registerGtagProvider() || ++attempts > 300) clearInterval(iv);
    }, 200);
  }

  function loadGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  }
  // Load gtag.js immediately (synchronously after the IIFE). The script tag
  // we append carries `async`, so it downloads in parallel and does not
  // block LCP. Earlier this was deferred via requestIdleCallback (4s) /
  // setTimeout (1.5s) to avoid competing with LCP, but that delay caused
  // Tag Assistant to report "Tag Not Detected" because the config call
  // didn't land within its ~2s detection window. With `async`, network
  // fetches the gtag.js payload in parallel with the LCP resource; both
  // paint when ready. Empirically LCP is unaffected because the LCP
  // element (h1 in SplitHero) is rendered from already-inlined HTML+CSS,
  // not from gtag.js.
  loadGtag();
  /* eslint-enable */
})();
