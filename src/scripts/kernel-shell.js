/**
 * kernel-shell.js — Kernel shell class + keyboard shortcuts.
 *
 * REPORTS-CSP-01 (2026-07-15): Extracted from KernelLayout.astro
 * <script is:inline> block (lines 487-521) to remove the inline
 * script and the 'unsafe-inline' it required from script-src.
 *
 * Why external (not inline):
 *   - Inline scripts require 'unsafe-inline' on script-src in CSP.
 *   - Imported from KernelLayout via <script>import '../scripts/kernel-shell.js';</script>
 *     (Astro bundles this as an external ES module).
 *
 * Behavior (unchanged from original — KRN-011 / EXEC-11):
 *   - Apply kernel-shell class to <body> on every page-load so the
 *     CSS grid layout for the kernel shell kicks in.
 *   - Register Cmd/Ctrl + key shortcuts:
 *     C → /kernel/chat/
 *     A → /kernel/approvals/
 *     S → /kernel/stats/
 *     T → /kernel/audit/
 *     R → reload current page
 *   - Shortcuts REQUIRE Cmd/Ctrl modifier (WCAG SC 2.1.4) so they
 *     don't fire by accident when typing Arabic text (e.g. the Arabic
 *     letter س maps to 's' on a US layout).
 *   - Skip shortcuts when target is INPUT/TEXTAREA/SELECT/contentEditable.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function initShell() {
    if (document.body && !document.body.classList.contains('kernel-shell')) {
      document.body.classList.add('kernel-shell');
    }
  }

  function handleShortcuts(e) {
    var target = /** @type {Element | null} */ (e.target);
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
    if (target && target.isContentEditable) return;
    // KRN-011 / EXEC-11: REQUIRE Cmd/Ctrl modifier (WCAG SC 2.1.4).
    // Single-key shortcuts trigger by accident on Arabic keyboards
    // (e.g. typing س which maps to 's' navigates away).
    if (!e.ctrlKey && !e.metaKey) return;
    var key = (e.key || '').toLowerCase();
    if (key === 'c') { window.location.href = '/kernel/chat/'; }
    else if (key === 'a') { window.location.href = '/kernel/approvals/'; }
    else if (key === 's') { window.location.href = '/kernel/stats/'; }
    else if (key === 't') { window.location.href = '/kernel/audit/'; }
    else if (key === 'r') { window.location.reload(); }
  }

  function initShortcuts() {
    document.removeEventListener('keydown', handleShortcuts);
    document.addEventListener('keydown', handleShortcuts);
  }

  document.addEventListener('astro:page-load', function () {
    initShell();
    initShortcuts();
  });
  if (document.readyState !== 'loading') initShell();
})();