/**
 * Starts global enhancement modules only after the first document load.
 * These modules add analytics, form interception, scroll effects, and modal
 * focus trapping; none is needed to render the above-the-fold server HTML.
 */
(function () {
  'use strict';

  const modules = [
    '/js/analytics.js',
    '/js/prevent-default-forms.js',
    '/js/scroll-reveal.js',
    '/js/focus-trap.js',
  ];

  function start() {
    for (const moduleUrl of modules) {
      import(moduleUrl).catch(() => {
        // Enhancements must never affect the document's primary content.
      });
    }
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 2500 });
      return;
    }
    window.setTimeout(start, 250);
  }

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();
