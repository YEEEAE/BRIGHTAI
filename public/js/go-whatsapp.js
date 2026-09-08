/**
 * go-whatsapp.js — WHATSAPP-HUB (2026-09-08)
 *
 * Redirect logic for /go/whatsapp/. Extracted to an external file to keep
 * strict-CSP (no 'unsafe-inline' on script-src).
 *
 * Forwards the visitor to wa.me/966538229013, preserving an optional
 * ?text= prefilled message (capped at 500 chars to avoid abuse).
 * Uses location.replace so the hub URL doesn't linger in history.
 * The visible fallback anchor in the HTML covers no-JS (meta refresh was
 * removed — flagged by Semrush as meta-refresh errors, 2026-09-08).
 */
(function () {
  var NUMBER_URL = 'https://wa.me/966538229013';
  var params = new URLSearchParams(window.location.search);
  var text = params.get('text');
  var target = NUMBER_URL;
  if (text) {
    text = text.slice(0, 500);
    target = NUMBER_URL + '?text=' + encodeURIComponent(text);
  }
  var fallback = document.querySelector('[data-whatsapp-fallback]');
  if (fallback) {
    fallback.setAttribute('href', target);
    fallback.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = target;
    });
  }
  window.location.replace(target);
})();
