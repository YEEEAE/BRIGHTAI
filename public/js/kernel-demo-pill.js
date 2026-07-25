/**
 * kernel-demo-pill.js — BAI-SEC-18 (2026-07-25)
 *
 * Extracted from src/components/kernel/KernelDemoPill.astro inline
 * <script is:inline> block to enable strict-CSP (script-src without
 * 'unsafe-inline'). The script is loaded as a static ES module via
 * <script type="module" src="/js/kernel-demo-pill.js">.
 *
 * Behavior preserved verbatim:
 *   - Click handler toggles aria-pressed + class
 *   - Dispatches 'kernel:demo-toggle' custom event for any page to
 *     listen (the page-level chat/scenario/audit scripts listen for it)
 *   - Idempotent across Astro view transitions (data-bound flag)
 *   - Initialises on astro:page-load + on first DOMContentLoaded /
 *     immediate if document already ready
 */
(function () {
  'use strict';
  function init() {
    document.querySelectorAll('[data-kernel-demo-pill]').forEach(function (pill) {
      if (pill.dataset.bound === '1') return;
      pill.dataset.bound = '1';
      pill.addEventListener('click', function () {
        var isPressed = pill.getAttribute('aria-pressed') === 'true';
        var next = !isPressed;
        pill.setAttribute('aria-pressed', next ? 'true' : 'false');
        pill.classList.toggle('kernel-demo-pill--inactive', !next);
        document.dispatchEvent(new CustomEvent('kernel:demo-toggle', { detail: { active: next } }));
      });
    });
  }
  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();
})();
