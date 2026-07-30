/**
 * kernel-loading-state.js — Skeleton → content → empty state transition.
 *
 * Each kernel page adds `data-kernel-loading` to its `.kernel-main` wrapper.
 * A CSS rule in each page hides all children except the skeleton while the
 * attribute is present. This script removes the attribute after ~1.5s,
 * revealing the server-rendered content. If `data-kernel-count` is "0",
 * the empty state is shown instead.
 *
 * CSP-safe external module (BAI-SEC-18 pattern).
 * No inline event handlers, no define:vars, just DOM queries + setTimeout.
 */
(function () {
  'use strict';

  function init() {
    var main = document.querySelector('[data-kernel-loading]');
    if (!main) return;
    if (main.dataset.loadingBound === '1') return;
    main.dataset.loadingBound = '1';

    var skeleton = main.querySelector('[data-kernel-skeleton]');
    var emptyState = main.querySelector('[data-kernel-empty]');
    var count = parseInt(main.getAttribute('data-kernel-count') || '1', 10);

    // Simulate data fetch delay (static pages: data is already in DOM).
    // 1500ms gives the skeleton enough visibility without annoying users.
    var DELAY = 1500;

    setTimeout(function () {
      // Remove the loading attribute — the page CSS rule stops hiding children.
      main.removeAttribute('data-kernel-loading');

      // Hide the skeleton.
      if (skeleton) skeleton.hidden = true;

      // If no items were rendered, show the empty state instead.
      if (count === 0 && emptyState) {
        emptyState.hidden = false;
      }
    }, DELAY);
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();
})();