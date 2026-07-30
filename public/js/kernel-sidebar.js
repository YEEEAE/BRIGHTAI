/**
 * kernel-sidebar.js — BAI-SEC-18 (2026-07-25) + mobile drawer (2026-07-30)
 *
 * Extracted from src/components/kernel/KernelSidebar.astro inline
 * <script is:inline> block to enable strict-CSP. The script is
 * loaded as a static ES module via
 * <script type="module" src="/js/kernel-sidebar.js">.
 *
 * Desktop behavior (≥1024px):
 *   - Toggle collapse/expand state via body[data-sidebar] attribute
 *   - Persist state in localStorage (key: 'brightai-kernel-sidebar')
 *   - Update aria-label + title + button text to match state
 *
 * Mobile behavior (<1024px) — added 2026-07-30:
 *   - Hamburger button (data-kernel-sidebar-toggle) opens the drawer
 *   - body[data-sidebar-open="true"] drives the CSS transform
 *   - Overlay tap (data-kernel-sidebar-overlay) closes the drawer
 *   - Close button (data-kernel-sidebar-close) closes the drawer
 *   - Escape key closes the drawer
 *   - Focus moves to the sidebar when opened, returns to hamburger when closed
 *   - Open state is NOT persisted (reverts to closed on every page load)
 *
 * Both:
 *   - Survives Astro view transitions (data-bound flag on buttons)
 *   - Ensures body has 'kernel-shell' class (defensive)
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

  /* ── Mobile drawer helpers ────────────────────────────────────────── */

  function openDrawer(body, hamburger, sidebar) {
    body.setAttribute('data-sidebar-open', 'true');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    if (sidebar) {
      sidebar.setAttribute('aria-hidden', 'false');
      // Move focus into the drawer so keyboard users can navigate it.
      // Use rAF so the transform has started before focus moves.
      requestAnimationFrame(function () {
        var firstItem = sidebar.querySelector('a, button');
        if (firstItem) firstItem.focus();
      });
    }
  }

  function closeDrawer(body, hamburger, sidebar) {
    body.setAttribute('data-sidebar-open', 'false');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      // Return focus to the hamburger so the user doesn't lose their place.
      hamburger.focus();
    }
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
  }

  function isDrawerOpen(body) {
    return body.getAttribute('data-sidebar-open') === 'true';
  }

  /* ── Init ─────────────────────────────────────────────────────────── */

  function init() {
    var body = document.body;
    // Ensure body has kernel-shell class (KernelLayout script may run after)
    if (!body.classList.contains('kernel-shell')) {
      body.classList.add('kernel-shell');
    }

    // Desktop collapse button
    var collapseBtn = document.querySelector('[data-kernel-sidebar-collapse]');
    // Mobile hamburger + overlay + close
    var hamburger = document.querySelector('[data-kernel-sidebar-toggle]');
    var overlay = document.querySelector('[data-kernel-sidebar-overlay]');
    var closeBtn = document.querySelector('[data-kernel-sidebar-close]');
    var sidebar = document.getElementById('kernel-sidebar');

    // Restore desktop collapse state from localStorage
    if (collapseBtn) {
      try {
        var saved = localStorage.getItem(KEY);
        body.setAttribute('data-sidebar', saved === 'collapsed' ? 'collapsed' : 'expanded');
      } catch (e) {
        body.setAttribute('data-sidebar', 'expanded');
      }
      syncLabel(body.getAttribute('data-sidebar'), collapseBtn);

      // Avoid duplicate listeners across page transitions
      if (collapseBtn.dataset.bound !== '1') {
        collapseBtn.dataset.bound = '1';
        collapseBtn.addEventListener('click', function () {
          var next = body.getAttribute('data-sidebar') === 'collapsed' ? 'expanded' : 'collapsed';
          body.setAttribute('data-sidebar', next);
          try { localStorage.setItem(KEY, next); } catch (e) {}
          syncLabel(next, collapseBtn);
        });
      }
    }

    // Mobile drawer: ensure closed on every page load (not persisted)
    body.setAttribute('data-sidebar-open', 'false');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');

    // Bind hamburger toggle (avoid duplicates across view transitions)
    if (hamburger && hamburger.dataset.bound !== '1') {
      hamburger.dataset.bound = '1';
      hamburger.addEventListener('click', function () {
        if (isDrawerOpen(body)) {
          closeDrawer(body, hamburger, sidebar);
        } else {
          openDrawer(body, hamburger, sidebar);
        }
      });
    }

    // Bind overlay tap (closes drawer)
    if (overlay && overlay.dataset.bound !== '1') {
      overlay.dataset.bound = '1';
      overlay.addEventListener('click', function () {
        if (isDrawerOpen(body)) closeDrawer(body, hamburger, sidebar);
      });
    }

    // Bind close button (inside drawer footer)
    if (closeBtn && closeBtn.dataset.bound !== '1') {
      closeBtn.dataset.bound = '1';
      closeBtn.addEventListener('click', function () {
        if (isDrawerOpen(body)) closeDrawer(body, hamburger, sidebar);
      });
    }

    // Escape key closes drawer (bound once on document)
    if (!document.__kernelSidebarEscapeBound) {
      document.__kernelSidebarEscapeBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isDrawerOpen(body)) {
          closeDrawer(body, hamburger, sidebar);
        }
      });
    }
  }

  // Astro view transition hooks + initial load
  document.addEventListener('astro:page-load', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
