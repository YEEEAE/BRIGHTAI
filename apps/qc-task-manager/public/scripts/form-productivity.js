/* Shared progressive enhancement for operational QC forms.
 * Server schemas remain authoritative; this only improves feedback and safety.
 */
(function () {
  function fieldLabel(field) {
    var label = field.form && field.form.querySelector('label[for="' + field.id + '"]');
    return label ? label.textContent.replace('*', '').trim() : field.name || 'This field';
  }

  function errorFor(field) {
    return field.form.querySelector('[data-qc-error-for="' + field.id + '"]');
  }

  function renderFieldError(field) {
    if (field.validity.valid) {
      field.removeAttribute('aria-invalid');
      var old = errorFor(field);
      if (old) old.remove();
      return;
    }
    field.setAttribute('aria-invalid', 'true');
    var error = errorFor(field) || document.createElement('p');
    error.dataset.qcErrorFor = field.id;
    error.id = field.id + '-error';
    error.className = 'mt-1 text-sm text-red-700';
    error.setAttribute('role', 'alert');
    error.textContent = field.validity.valueMissing
      ? fieldLabel(field) + ' is required.'
      : field.validationMessage;
    field.insertAdjacentElement('afterend', error);
  }

  function setup(form) {
    if (form.dataset.qcProductivityReady) return;
    form.dataset.qcProductivityReady = 'true';
    var dirty = false;
    var submitted = false;
    var summary = document.createElement('div');
    summary.className = 'mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800';
    summary.setAttribute('role', 'region');
    summary.setAttribute('aria-label', 'Validation summary');
    summary.setAttribute('aria-live', 'assertive');
    summary.hidden = true;
    summary.tabIndex = -1;
    form.prepend(summary);

    form.addEventListener('input', function (event) {
      dirty = true;
      var target = event.target;
      if (target && target.matches('input, select, textarea')) renderFieldError(target);
    });
    form.addEventListener('change', function () { dirty = true; });

    window.addEventListener('beforeunload', function (event) {
      if (!dirty || submitted) return;
      event.preventDefault();
      event.returnValue = '';
    });

    form.addEventListener('submit', function (event) {
      var fields = Array.from(form.querySelectorAll('input, select, textarea'))
        .filter(function (field) { return !field.disabled && field.type !== 'hidden'; });
      var invalid = fields.filter(function (field) { return !field.checkValidity(); });
      if (invalid.length) {
        event.preventDefault();
        invalid.forEach(renderFieldError);
        summary.hidden = false;
        summary.textContent = invalid.length === 1
          ? 'Please correct the highlighted field before saving.'
          : 'Please correct the ' + invalid.length + ' highlighted fields before saving.';
        summary.focus();
        invalid[0].focus();
        return;
      }
      if (submitted) {
        event.preventDefault();
        return;
      }
      submitted = true;
      dirty = false;
      form.querySelectorAll('button[type="submit"]').forEach(function (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        if (!button.dataset.originalText) button.dataset.originalText = button.textContent.trim();
        button.textContent = 'Saving…';
      });
    });

    form.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (!dirty || submitted || link.target === '_blank') return;
        if (!window.confirm('You have unsaved changes. Leave without saving?')) event.preventDefault();
      });
    });
  }

  document.querySelectorAll('form[data-qc-form]').forEach(setup);
})();
