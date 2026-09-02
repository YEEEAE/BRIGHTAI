// Accessible confirmation dialog for high-authority actions that require
// password re-verification (e-signature step). External file because the app's
// strict CSP blocks inline scripts; same-origin scripts are allowed.

(function () {
  'use strict';

  function init() {
    const dialog = document.getElementById('esign-dialog');
    if (!dialog || dialog.dataset.esignBound === '1') return;
    dialog.dataset.esignBound = '1';

    const input = document.getElementById('esign-password');
    const reasonInput = document.getElementById('esign-reason');
    const errorEl = document.getElementById('esign-error');
    const cancelBtn = document.getElementById('esign-cancel');
    let pendingForm = null;
    let pendingButton = null;

    function open(form, button) {
      pendingForm = form;
      pendingButton = button;
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = '';
      }
      if (input) input.value = '';
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      if (input) input.focus();
    }

    function close() {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      pendingForm = null;
      pendingButton = null;
    }

    function confirm() {
      if (!pendingForm || !pendingButton) {
        close();
        return;
      }
      const value = input ? input.value : '';
      if (!value) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent =
            'كلمة المرور مطلوبة لتأكيد هذا الإجراء.';
        }
        if (input) input.focus();
        return;
      }
      const reasonVal = reasonInput && reasonInput.value.trim() ? reasonInput.value.trim() : 'I approve this test result for release';
      let hiddenReason = pendingForm.querySelector('input[name="signature_reason"]');
      if (!hiddenReason) {
        hiddenReason = document.createElement('input');
        hiddenReason.type = 'hidden';
        hiddenReason.name = 'signature_reason';
        pendingForm.appendChild(hiddenReason);
      }
      hiddenReason.value = reasonVal;

      let hidden = pendingForm.querySelector('input[name="esignature_password"]');
      if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'esignature_password';
        pendingForm.appendChild(hidden);
      }
      hidden.value = value;
      const form = pendingForm;
      const button = pendingButton;
      close();
      // Re-dispatch through requestSubmit so the original submitter (action
      // name/value pairs such as action=approve) is preserved.
      try {
        form.requestSubmit(button);
      } catch {
        form.submit();
      }
    }

    document.addEventListener(
      'click',
      function (event) {
        const trigger = event.target instanceof Element ? event.target.closest('[data-esign-trigger]') : null;
        if (!trigger) return;
        const form = trigger.closest('form');
        if (!form) return;
        event.preventDefault();
        open(form, trigger);
      },
      true,
    );

    if (cancelBtn) cancelBtn.addEventListener('click', close);
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });
    const confirmBtn = document.getElementById('esign-confirm');
    if (confirmBtn) confirmBtn.addEventListener('click', confirm);
    dialog.addEventListener('submit', function (event) {
      event.preventDefault();
      confirm();
    });
    if (input) {
      input.addEventListener('input', function () {
        if (errorEl) {
          errorEl.hidden = true;
          errorEl.textContent = '';
        }
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
