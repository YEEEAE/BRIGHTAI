(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  function isClarityReady() {
    return typeof window.clarity === 'function';
  }

  function safeSet(key, value) {
    if (!isClarityReady()) return;
    window.clarity('set', key, value);
  }

  function trackConversion(name) {
    safeSet('conversion', name);
  }

  function markPageAndDevice() {
    safeSet('page', document.title || 'untitled');
    if (/Mobi/i.test(navigator.userAgent || '')) {
      safeSet('device', 'mobile');
    }
  }

  function findAnchor(startNode) {
    if (!startNode || typeof startNode.closest !== 'function') return null;
    return startNode.closest('a[href]');
  }

  function wireClickTracking() {
    document.addEventListener('click', function (event) {
      var anchor = findAnchor(event.target);
      if (!anchor) return;

      var href = (anchor.getAttribute('href') || '').trim();
      if (!href) return;

      if (/^https?:\/\/(www\.)?wa\.me\//i.test(href) || /^wa\.me\//i.test(href)) {
        trackConversion('whatsapp_click');
      }

      if (/calendly\.com/i.test(href)) {
        trackConversion('calendly_booking');
      }
    });
  }

  onReady(function () {
    markPageAndDevice();
    wireClickTracking();
  });
})();
