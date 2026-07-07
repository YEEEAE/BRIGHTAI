/**
 * sw-register.js — Service Worker registration (REPORTS-20 deferred).
 *
 * Loaded with `defer` from BaseLayout.astro to replace the inline is:inline script
 * previously embedded in the head. Defers SW registration until after window load
 * + 100ms so it never competes with the LCP element.
 *
 * Behavior contract (preserved from prior inline version):
 *   - Skip silently if `serviceWorker` is not in navigator
 *   - Wait for window 'load'
 *   - Wait an extra 100ms via setTimeout
 *   - Register /sw.js (the existing Service Worker file)
 */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function () {
    setTimeout(function () {
      navigator.serviceWorker.register('/sw.js');
    }, 100);
  });
})();