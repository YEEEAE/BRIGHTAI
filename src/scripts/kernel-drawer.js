/**
 * kernel-drawer.js — Kernel mobile drawer open/close behavior.
 *
 * REPORTS-CSP-01 (2026-07-15): Extracted from KernelLayout.astro
 * <script is:inline> block (lines 433-484) to remove the inline
 * script and the 'unsafe-inline' it required from script-src.
 *
 * Why external (not inline):
 *   - Inline scripts require 'unsafe-inline' on script-src in CSP.
 *   - Imported from KernelLayout via <script>import '../scripts/kernel-drawer.js';</script>
 *     (Astro bundles this as an external ES module).
 *
 * Behavior (unchanged from original):
 *   - Toggles drawer via [data-kernel-drawer-toggle] click.
 *   - Closes drawer via [data-kernel-drawer-close] click.
 *   - Body-scroll lock synced with focus-trap.js lifecycle events
 *     (a11y:modal-opened / a11y:modal-closed).
 *   - Visual hide (display:none) when focus-trap closes via Escape.
 *
 * Imports focus-trap.js indirectly — that module is loaded globally
 * by BaseLayout, so this script just listens for its events.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function initKernelDrawer() {
    var toggle = document.querySelector('[data-kernel-drawer-toggle]');
    var drawer = document.getElementById('k-drawer');
    if (!toggle || !drawer) return;

    function openDrawer() {
      drawer.setAttribute('aria-hidden', 'false');
      drawer.style.display = 'block';
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      drawer.setAttribute('aria-hidden', 'true');
      drawer.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var isOpen = drawer.getAttribute('aria-hidden') === 'false';
      if (isOpen) closeDrawer(); else openDrawer();
    });

    drawer.querySelectorAll('[data-kernel-drawer-close]').forEach(function (el) {
      el.addEventListener('click', closeDrawer);
    });

    // Body scroll lock + visual hide, synced with focus-trap.js lifecycle events.
    // a11y:modal-opened → focus-trap.js called open() (Tab trap active, siblings inert).
    // a11y:modal-closed → focus-trap.js called close() (focus restored to opener, inert cleared).
    drawer.addEventListener('a11y:modal-opened', function () {
      document.body.style.overflow = 'hidden';
    });
    drawer.addEventListener('a11y:modal-closed', function () {
      document.body.style.overflow = '';
      // When close originates from focus-trap (Escape), display:none never fires
      // there because focus-trap only flips aria-hidden. Sync the visual state here
      // so the drawer actually disappears instead of staying as an invisible overlay.
      if (drawer.style.display !== 'none') {
        drawer.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('astro:page-load', initKernelDrawer);
})();