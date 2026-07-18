/**
 * bing-uet.js — Microsoft Advertising UET (Universal Event Tracking) loader + provider.
 *
 * Loaded with `defer` from MarketingScripts.astro. Mirrors the CSP-safe
 * pattern of clarity-init.js: the tag ID is read from the `data-uet-id`
 * attribute on this <script> tag (HTML attributes are not governed by
 * script-src CSP). Skips silently when no ID is configured.
 *
 * Registers as a provider with the unified analytics runtime (CRO audit
 * Prompt 5). Bing UET uses a `uetq` array — events are pushed as
 * `uetq.push('event', 'custom', { event_name, ...payload })`.
 *
 * NOTE: once a real UET ID is set, public/_headers CSP must allow
 * `bat.bing.com` in script-src / connect-src (protected file — needs approval).
 */
(function () {
  'use strict';
  var id = '';
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('/js/bing-uet.js') !== -1) {
      id = scripts[i].getAttribute('data-uet-id') || '';
      break;
    }
  }
  if (!id) return; // no UET ID configured — skip silently

  var w = window;
  var u = 'uetq';
  (w[u] = w[u] || []).push('pageLoad');

  (function () {
    var o = { ti: id, enableAutoSpaTracking: true };
    o.q = w[u];
    w[u] = new w.UET(o);
    w[u].push('pageLoad');
  })();

  var s = document.createElement('script');
  s.async = 1;
  s.src = 'https://bat.bing.com/bat.js';
  var f = document.getElementsByTagName('script')[0];
  f.parentNode.insertBefore(s, f);

  // Register as a provider with the unified analytics runtime. The UET
  // event payload is flat (no nested objects), so we map our common
  // properties to UET's expected shape and let event_name carry the
  // canonical name for downstream Bing reports.
  function registerBingProvider() {
    var rt = window.__BRIGHTAI_ANALYTICS__;
    if (!rt) return false;
    rt.registerProvider({
      name: 'bing',
      fn: function (event, payload) {
        var q = w[u];
        if (!q || !Array.isArray(q)) return;
        // Bing UET accepts: 'pageLoad', 'event', 'custom', 'setAutoSpaTracking'.
        // We use 'custom' with a flattened event_name so analytics reports
        // can group by canonical name. Reserved payload keys get stripped.
        var flat = Object.assign({ event_name: event }, payload);
        q.push('event', 'custom', flat);
      },
    });
    return true;
  }
  if (!registerBingProvider()) {
    var attempts = 0;
    var iv = setInterval(function () {
      if (registerBingProvider() || ++attempts > 50) clearInterval(iv);
    }, 20);
  }
})();
