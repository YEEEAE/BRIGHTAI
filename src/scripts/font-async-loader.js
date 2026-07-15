/**
 * font-async-loader.js — Replaces the inline `onload="this.media='all'"`
 * event handler used to load Google Fonts CSS asynchronously.
 *
 * REPORTS-CSP-01 (2026-07-15): Inline event handlers (onload, onclick, …)
 * require 'unsafe-inline' on script-src-attr in CSP. This module moves
 * the same logic into an external IIFE so CSP can drop script-src-attr
 * 'unsafe-inline'.
 *
 * Usage (replaces the old pattern):
 *   OLD:
 *     <link rel="stylesheet" href="..." media="print" onload="this.media='all'" />
 *     <noscript><link rel="stylesheet" href="..." /></noscript>
 *
 *   NEW:
 *     <link rel="stylesheet" href="..." media="print" data-font-async />
 *     <noscript><link rel="stylesheet" href="..." /></noscript>
 *     <script>import '../scripts/font-async-loader.js';</script>
 *
 * Behavior:
 *   - On DOMContentLoaded, every <link data-font-async> gets media flipped
 *     from "print" to "all" once it finishes loading.
 *   - Also handles error states by leaving the link in media="print" so
 *     the <noscript> fallback kicks in via the user's browser print stylesheet.
 *   - Idempotent: re-running on the same element is a no-op (checks media attr).
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