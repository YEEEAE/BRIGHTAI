/**
 * prevent-default-forms.js — BAI-SEC-18 (2026-07-25)
 *
 * Replaces the legacy `onsubmit="return false;"` inline event
 * handlers that were used to prevent form submission on forms
 * whose submit button is wired to a custom handler via JavaScript
 * (chat composer, lead form, AI assistant, docs search, etc.).
 *
 * Behaviour: every <form> that carries the `data-prevent-default`
 * attribute has its submit event prevented. The form's own JS
 * still receives the submit event (no `return false;` swallow), so
 * downstream handlers continue to fire.
 *
 * Why centralised:
 *   - Eliminates the need for `onsubmit="return false;"` inline
 *     event handlers, which require `script-src-attr 'unsafe-inline'`
 *     in CSP (we want to keep that as 'none').
 *   - One place to change the behaviour if we ever need a different
 *     strategy (e.g. visual feedback before prevent).
 *
 * Loaded globally from BaseLayout.astro as a static ES module
 * before any form-using components mount (so the listener is
 * installed before astro:page-load fires).
 */
(function () {
  'use strict';
  function init() {
    document.querySelectorAll('form[data-prevent-default]').forEach(function (form) {
      if (form.dataset.preventDefaultBound === '1') return;
      form.dataset.preventDefaultBound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
      });
    });
  }
  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();
})();
