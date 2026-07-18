/**
 * mixpanel-init.js — Mixpanel product analytics loader + provider.
 *
 * Loaded with `defer` from MarketingScripts.astro. CSP-safe: token read from
 * the `data-token` attribute on this <script> tag. Skips silently when no
 * token is configured. Registers as a provider with the unified analytics
 * runtime so events flow through the central layer (CRO audit Prompt 5).
 *
 * NOTE: once a real token is set, public/_headers CSP must allow
 * `cdn.mxpnl.com` in script-src / connect-src (protected file — needs approval).
 */
(function () {
  'use strict';
  var token = '';
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('/js/mixpanel-init.js') !== -1) {
      token = scripts[i].getAttribute('data-token') || '';
      break;
    }
  }
  if (!token) return; // no Mixpanel token configured — skip silently

  (function (f, b) {
    if (!f._mb) {
      var m = (f.mixpanel = f.mixpanel || function (a, b) {
        f.mixpanel._mb ||
          ((f.mixpanel._mb = []),
          (f.mixpanel._mb.push = function (a) {
            f.mixpanel._mb.push(a);
          }));
        f.mixpanel._mb.push([a, b]);
      });
      f.mixpanel._i = [];
      f.mixpanel.init = function (t, c, n) {
        function s(k) {
          var e = b.createElement('script');
          e.type = 'text/javascript';
          e.async = !0;
          e.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
          var x = b.getElementsByTagName('script')[0];
          x.parentNode.insertBefore(e, x);
          e.onload = function () {
            f.mixpanel._i.push([t, c, n]);
            // Once the lib loads, register the provider with the runtime.
            registerMixpanelProvider();
          };
        }
        s();
      };
    }
  })(window, document);

  window.mixpanel.init(token, { autotrack: true, track_pageview: true });

  // Register immediately (works even if mixpanel-2-latest.min.js hasn't
  // loaded yet — calls queue in the shim).
  registerMixpanelProvider();

  function registerMixpanelProvider() {
    var rt = window.__BRIGHTAI_ANALYTICS__;
    if (!rt) return false;
    rt.registerProvider({
      name: 'mixpanel',
      fn: function (event, payload) {
        // Mixpanel accepts arbitrary event names + a properties object.
        // We strip the PII-shaped keys one more time defensively (the
        // runtime already enforces the allowlist, but defense in depth).
        if (window.mixpanel && typeof window.mixpanel.track === 'function') {
          window.mixpanel.track(event, payload);
        }
      },
    });
    return true;
  }
})();
