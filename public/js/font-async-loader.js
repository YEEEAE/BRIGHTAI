/**
 * font-async-loader.js — Replaces the inline onload-this-media-all
 * event handler used to load Google Fonts CSS asynchronously.
 *
 * REPORTS-CSP-01 (2026-07-15): Inline event handlers (onload, onclick, etc.)
 * require 'unsafe-inline' on script-src-attr in CSP. This module moves
 * the same logic into an external IIFE so CSP can drop script-src-attr
 * 'unsafe-inline'.
 *
 * Usage (replaces the old pattern):
 *   Add data-font-async to the Google Fonts link tag in the head.
 *   Then load this script as a static ES module from public/js/.
 *
 * Behavior:
 *   - On DOMContentLoaded, every element with data-font-async gets media
 *     flipped from "print" to "all" once it finishes loading.
 *   - Also handles error states by leaving the element in media="print" so
 *     the noscript fallback kicks in via the user's browser print stylesheet.
 *   - Idempotent: re-running on the same element is a no-op (checks media attr).
 *
 * FIX-2026-07-18 (KI-SYNTAX-2026-07-18-001): now loaded as a static ES
 * module from public/js/ instead of via inline `import` in BaseLayout. The
 * previous pattern failed at runtime because browsers cannot resolve a
 * relative `import` specifier inside an inline module.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function promote() {
    var links = document.querySelectorAll('link[data-font-async]');
    for (var i = 0; i < links.length; i++) {
      var el = /** @type {HTMLLinkElement} */ (links[i]);
      if (el.media === 'print') {
        el.media = 'all';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', promote, { once: true });
  } else {
    promote();
  }

  // Re-run after Astro view-transitions swap the document head.
  document.addEventListener('astro:after-swap', promote);
})();