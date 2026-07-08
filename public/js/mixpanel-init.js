/**
 * mixpanel-init.js — Mixpanel product analytics loader.
 *
 * Loaded with `defer` from MarketingScripts.astro. CSP-safe: token read from
 * the `data-token` attribute on this <script> tag. Skips silently when no
 * token is configured. Tracks a page_view on SPA view transitions.
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
          };
        }
        s();
      };
    }
  })(window, document);

  window.mixpanel.init(token, { autotrack: true, track_pageview: true });

  document.addEventListener('astro:after-swap', function () {
    if (window.mixpanel) {
      window.mixpanel.track('page_view', {
        page_path: window.location.pathname,
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  });
})();
