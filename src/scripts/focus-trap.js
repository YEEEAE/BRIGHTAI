/**
 * focus-trap.js — Shared focus trap helper for modal dialogs
 *
 * DEC-A11Y-003 (2026-07-14): A reusable, vanilla-JS focus trap for `role="dialog"`
 * + `aria-modal="true"` modals. Auto-applies to every `[role="dialog"]` element
 * on the page (or its inner modal panel — see `data-focus-trap`).
 *
 * Used by:
 *   - src/components/MobileNav.astro (already has its own trap — left in place)
 *   - src/pages/kernel/connectors.astro (#connector-modal)
 *   - src/pages/kernel/approvals.astro ([data-kernel-approval-modal])
 *   - src/pages/kernel/scenarios.astro (role=dialog modal)
 *   - any future modal in the codebase
 *
 * Behavior (WCAG 2.4.3 + APG dialog pattern):
 *   1. On open():
 *      - Remembers the currently-focused element (the "opener")
 *      - Sets `inert` on all sibling elements of the modal (or `aria-hidden="true"`)
 *        so screen readers and keyboard nav don't reach them
 *      - Moves focus to the first focusable element in the modal
 *        (or to the modal container itself if no focusable child exists)
 *   2. While open:
 *      - Tab/Shift+Tab cycle through focusable elements inside the modal
 *      - Escape key calls close()
 *   3. On close():
 *      - Removes `inert` from siblings
 *      - Restores focus to the opener
 *      - Calls the user-supplied `onClose` callback (optional)
 *
 * Auto-application:
 *   - On every `astro:page-load` (handles view-transitions)
 *   - Scans for [data-focus-trap] elements (or [role="dialog"] if no attribute)
 *   - Watches `hidden` attribute via MutationObserver
 *   - Opens/closes the trap automatically when visibility changes
 *
 * Browser support: works in all evergreen browsers. IE11 not supported.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

function getFocusable(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    if (el.getClientRects().length === 0) return false;
    return true;
  });
}

function getSiblings(root) {
  const parent = root.parentNode;
  if (!parent) return [];
  return Array.from(parent.children).filter((el) => el !== root);
}

/**
 * Create a focus trap for a modal element.
 *
 * @param {HTMLElement} modal - The dialog/modal element to trap focus inside.
 * @param {Object} options
 * @param {() => void} [options.onOpen] - Called when the trap is opened.
 * @param {() => void} [options.onClose] - Called when the trap is closed.
 * @param {string} [options.initialFocus] - CSS selector for the element to focus when opened.
 * @returns {{ open: () => void, close: () => void, isOpen: () => boolean, destroy: () => void }}
 */
export function createFocusTrap(modal, options = {}) {
  const { onOpen, onClose, initialFocus } = options;
  let opener = null;
  let isOpen = false;
  let keydownHandler = null;

  function open() {
    if (isOpen) return;
    isOpen = true;
    opener = document.activeElement;

    // Inert the page (siblings) so screen readers and keyboard nav skip them
    const siblings = getSiblings(modal);
    siblings.forEach((sib) => {
      sib.setAttribute('inert', '');
      sib.setAttribute('aria-hidden', 'true');
    });
    modal.setAttribute('aria-hidden', 'false');

    // Move focus
    const focusTarget = initialFocus
      ? modal.querySelector(initialFocus)
      : getFocusable(modal)[0] || modal;
    requestAnimationFrame(() => {
      try {
        focusTarget.focus({ preventScroll: false });
      } catch (e) {
        modal.focus();
      }
    });

    keydownHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = getFocusable(modal);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !modal.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !modal.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keydownHandler, true);

    if (typeof onOpen === 'function') onOpen();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    const siblings = getSiblings(modal);
    siblings.forEach((sib) => {
      sib.removeAttribute('inert');
      sib.removeAttribute('aria-hidden');
    });
    modal.setAttribute('aria-hidden', 'true');

    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler, true);
      keydownHandler = null;
    }

    if (opener && typeof opener.focus === 'function') {
      try {
        opener.focus({ preventScroll: false });
      } catch (e) {
        // opener may have been removed; ignore
      }
    }
    opener = null;

    if (typeof onClose === 'function') onClose();
  }

  function destroy() {
    close();
  }

  return { open, close, isOpen: () => isOpen, destroy };
}

/**
 * Auto-apply focus trap to all modals on the page.
 * Called automatically on astro:page-load.
 */
function autoApply() {
  // Find all modals that want a focus trap.
  // Selector: elements with [role="dialog"] AND either [data-focus-trap] OR
  // an [aria-modal="true"] attribute (most common pattern).
  const modals = document.querySelectorAll(
    '[role="dialog"][aria-modal="true"], [data-focus-trap]'
  );

  modals.forEach((modal) => {
    // Skip if already wired
    if (modal.__focusTrapInstalled) return;
    modal.__focusTrapInstalled = true;

    const trap = createFocusTrap(modal, {
      onOpen: () => {
        modal.dispatchEvent(new CustomEvent('a11y:modal-opened', { bubbles: true }));
      },
      onClose: () => {
        modal.dispatchEvent(new CustomEvent('a11y:modal-closed', { bubbles: true }));
      },
    });

    // Watch the `hidden` attribute and toggle the trap
    const isVisible = () => {
      if (modal.hasAttribute('hidden')) return false;
      if (getComputedStyle(modal).display === 'none') return false;
      if (getComputedStyle(modal).visibility === 'hidden') return false;
      return true;
    };

    const sync = () => {
      if (isVisible()) {
        if (!trap.isOpen()) trap.open();
      } else {
        if (trap.isOpen()) trap.close();
      }
    };

    // Initial sync (in case the modal is open on page load — unusual)
    sync();

    // Observe hidden / style / class changes
    const observer = new MutationObserver(sync);
    observer.observe(modal, {
      attributes: true,
      attributeFilter: ['hidden', 'style', 'class', 'data-open', 'aria-hidden'],
    });
  });
}

// Auto-init on page load (and after view-transitions)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoApply);
  } else {
    autoApply();
  }
  document.addEventListener('astro:page-load', autoApply);
}
