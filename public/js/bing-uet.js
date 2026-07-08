/**
 * bing-uet.js — Microsoft Advertising UET (Universal Event Tracking) loader.
 *
 * Loaded with `defer` from MarketingScripts.astro. Mirrors the CSP-safe
 * pattern of clarity-init.js: the tag ID is read from the `data-uet-id`
 * attribute on this <script> tag (HTML attributes are not governed by
 * script-src CSP). Skips silently when no ID is configured.
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
})();
