/**
 * kernel-sidebar.js — BAI-SEC-18 (2026-07-25)
 *
 * Extracted from src/components/kernel/KernelSidebar.astro inline
 * <script is:inline> block to enable strict-CSP. The script is
 * loaded as a static ES module via
 * <script type="module" src="/js/kernel-sidebar.js">.
 *
 * Behavior preserved verbatim:
 *   - Toggle collapse/expand state via body[data-sidebar] attribute
 *   - Persist state in localStorage (key: 'brightai-kernel-sidebar')
 *   - Update aria-label + title + button text to match state
 *   - Survives Astro view transitions (data-bound flag on button)
 *   - Ensures body has 'kernel-shell' class (defensive — KernelLayout
 *     script may run after this)
 *   - Initialises on astro:page-load + on first DOMContentLoaded /
 *     immediate if document already ready
 */
(function () {
  'use strict';
  var KEY = 'brightai-kernel-sidebar';

  function syncLabel(state, btn) {
    var label = state === 'collapsed' ? 'فتح القائمة' : 'طي القائمة';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    var text = btn.querySelector('.kernel-sidebar__collapse-label');
    if (text) text.textContent = label;
  }

  function init() {
    var body = document.body;
    // Ensure body has kernel-shell class (KernelLayout script may run after)
    if (!body.classList.contains('kernel-shell')) {
      body.classList.add('kernel-shell');
    }
    var btn = document.querySelector('[data-kernel-sidebar-collapse]');
    if (!btn) return;

    try {
      var saved = localStorage.getItem(KEY);
      body.setAttribute('data-sidebar', saved === 'collapsed' ? 'collapsed' : 'expanded');
    } catch (e) {
      body.setAttribute('data-sidebar', 'expanded');
    }

    syncLabel(body.getAttribute('data-sidebar'), btn);

    // Avoid duplicate listeners across page transitions
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', function () {
      var next = body.getAttribute('data-sidebar') === 'collapsed' ? 'expanded' : 'collapsed';
      body.setAttribute('data-sidebar', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      syncLabel(next, btn);
    });
  }

  // Astro view transition hooks + initial load
  document.addEventListener('astro:page-load', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
