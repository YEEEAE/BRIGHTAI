/* Canonical form contract for QC Task Manager. Dependency-free progressive
 * enhancement: server-side Zod validation remains authoritative. */
(function () {
  'use strict';
  var DRAFT_PREFIX = 'qc-form-draft:v1:';
  var SAVE_DELAY = 500;
  var sensitiveNames = /password|passcode|pin|secret|token|signature/i;

  function currentUserId() {
    var id = document.body && document.body.dataset.qcUserId;
    return id && id !== 'anonymous' ? id : null;
  }
  function sensitive(field) { return sensitiveNames.test(field.name || '') || sensitiveNames.test(field.id || ''); }
  function keyFor(form) {
    var id = currentUserId();
    return id ? DRAFT_PREFIX + id + ':' + location.pathname + location.search + ':' + (form.id || form.action || 'form') : null;
  }
  function formFields(form) {
    return Array.prototype.filter.call(form.elements || [], function (field) {
      return field.name && !field.disabled && !sensitive(field) && field.type !== 'file' && field.type !== 'submit' && field.type !== 'button' && field.type !== 'reset';
    });
  }
  function snapshot(form) {
    var values = {};
    formFields(form).forEach(function (field) {
      var value = field.type === 'checkbox' || field.type === 'radio' ? (field.checked ? field.value || 'on' : '') : field.value;
      if (!values[field.name]) values[field.name] = [];
      values[field.name].push(value);
    });
    return JSON.stringify(values);
  }
  function css(value) { return window.CSS && CSS.escape ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  function labelFor(field) {
    var label = field.form && field.id && field.form.querySelector('label[for="' + css(field.id) + '"]');
    return label ? label.textContent.replace('*', '').trim() : field.name || 'This field';
  }
  function errorFor(field) { return field.form && field.form.querySelector('[data-qc-error-for="' + css(field.id || field.name) + '"]'); }
  function renderError(field) {
    var id = field.id || field.name;
    if (!id) return;
    var error = errorFor(field);
    if (field.validity.valid) { field.removeAttribute('aria-invalid'); if (error) error.remove(); return; }
    field.setAttribute('aria-invalid', 'true');
    if (!error) {
      error = document.createElement('p');
      error.dataset.qcErrorFor = id;
      error.id = id + '-error';
      error.className = 'mt-1 text-sm text-red-700';
      error.setAttribute('role', 'alert');
      field.insertAdjacentElement('afterend', error);
    }
    error.textContent = field.validity.valueMissing ? labelFor(field) + ' is required.' : field.validationMessage;
    var described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (described.indexOf(error.id) < 0) described.push(error.id);
    field.setAttribute('aria-describedby', described.join(' '));
  }
  function setPending(button) {
    if (button.dataset.qcPending === 'true') return;
    button.dataset.qcPending = 'true'; button.disabled = true; button.setAttribute('aria-busy', 'true');
    button.dataset.qcOriginalText = button.textContent.trim();
    button.innerHTML = '<span class="qc-form-spinner" aria-hidden="true"></span> جاري الحفظ...';
  }
  function clear(key) { if (key) { try { localStorage.removeItem(key); } catch (_) {} } }
  function restore(form, draft) {
    if (!draft || !draft.values) return;
    formFields(form).forEach(function (field) {
      var values = draft.values[field.name]; if (!values) return;
      if (field.type === 'checkbox' || field.type === 'radio') field.checked = values.indexOf(field.value || 'on') >= 0;
      else if (values[0] !== undefined) { field.value = values[0]; field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    form.dataset.qcRestored = 'true';
    form.dispatchEvent(new CustomEvent('qc:draft-restored', { bubbles: true }));
  }
  function setup(form) {
    if (form.dataset.qcCanonicalReady === 'true' || form.method.toLowerCase() === 'dialog') return;
    if (form.action && /\/login(?:$|[?#])/.test(form.action)) return;
    form.dataset.qcCanonicalReady = 'true'; form.dataset.qcForm = form.dataset.qcForm || 'canonical';
    var key = keyFor(form), initial = snapshot(form), dirty = false, submitted = false, draftTimer;
    var banner = document.createElement('div');
    banner.className = 'qc-form-draft-banner mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950';
    banner.hidden = true; banner.setAttribute('role', 'status');
    banner.innerHTML = '<span>فيه مسودة محفوظة غير مرسلة لهذا النموذج.</span> <button type="button" class="ms-2 font-semibold underline" data-qc-restore>استعادة المسودة</button> <button type="button" class="ms-2 underline" data-qc-discard>تجاهل</button>';
    form.prepend(banner);
    var previous = null;
    if (key) { try { previous = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { clear(key); } }
    if (previous && previous.values) {
      banner.hidden = false;
      banner.querySelector('[data-qc-restore]').addEventListener('click', function () { restore(form, previous); banner.hidden = true; dirty = true; save(); });
      banner.querySelector('[data-qc-discard]').addEventListener('click', function () { clear(key); banner.hidden = true; });
    }
    function save() {
      if (!key || submitted) return;
      clearTimeout(draftTimer);
      draftTimer = setTimeout(function () { try { localStorage.setItem(key, JSON.stringify({ version: 1, url: location.href, savedAt: new Date().toISOString(), values: JSON.parse(snapshot(form)) })); } catch (_) {} }, SAVE_DELAY);
    }
    form.addEventListener('input', function (event) { var field = event.target; if (!field || !field.matches || !field.matches('input, select, textarea')) return; dirty = snapshot(form) !== initial; renderError(field); save(); });
    form.addEventListener('change', function () { dirty = snapshot(form) !== initial; save(); });
    form.addEventListener('submit', function (event) {
      var invalid = formFields(form).filter(function (field) { return !field.checkValidity(); });
      if (invalid.length) { event.preventDefault(); invalid.forEach(renderError); invalid[0].focus(); return; }
      if (submitted) { event.preventDefault(); return; }
      submitted = true; dirty = false; form.querySelectorAll('button[type="submit"], input[type="submit"]').forEach(setPending);
      var method = (form.method || 'get').toUpperCase();
      if (method !== 'POST' || form.dataset.qcNativeSubmit === 'true') { clear(key); return; }
      event.preventDefault();
      fetch(form.action, { method: method, body: new FormData(form), credentials: 'same-origin', redirect: 'follow' }).then(function (response) { if (!response.ok) throw new Error(String(response.status)); clear(key); location.assign(response.url || form.action); }).catch(function () {
        submitted = false; dirty = true;
        form.querySelectorAll('[data-qc-pending="true"]').forEach(function (button) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = button.dataset.qcOriginalText || 'Save'; button.dataset.qcPending = 'false'; });
        form.dispatchEvent(new CustomEvent('qc:submit-failed', { bubbles: true }));
      });
    });
    form.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function (event) { if (dirty && !submitted && link.target !== '_blank' && !window.confirm('You have unsaved changes. Leave without saving?')) event.preventDefault(); }); });
    window.addEventListener('beforeunload', function (event) { if (!dirty || submitted) return; event.preventDefault(); event.returnValue = ''; });
  }
  function clearUserDrafts() {
    var id = currentUserId(); if (!id) return; var prefix = DRAFT_PREFIX + id + ':';
    try { Object.keys(localStorage).filter(function (key) { return key.indexOf(prefix) === 0; }).forEach(function (key) { localStorage.removeItem(key); }); } catch (_) {}
  }
  document.addEventListener('submit', function (event) { var form = event.target; if (form && /\/logout(?:$|[?#])/.test(form.action || '')) clearUserDrafts(); }, true);
  document.querySelectorAll('form').forEach(setup);
  new MutationObserver(function () { document.querySelectorAll('form').forEach(setup); }).observe(document.documentElement, { childList: true, subtree: true });
})();
