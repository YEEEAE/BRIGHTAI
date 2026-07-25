/**
 * lead-form-handler.js — LeadForm.astro runtime behavior (CRO audit Prompt 4).
 *
 * Companion script for src/components/LeadForm.astro. Wires up:
 *   - UTM / referrer / landing-page auto-capture
 *   - form_view / form_start / form_field_error / form_submit_* events
 *   - Inline validation (required + email + min-length + consent)
 *   - Honeypot (silent reject for bots)
 *   - Submit interception (AJAX with native fallback)
 *   - Loading / success / error UI states
 *   - Error summary that focuses the first invalid field
 *   - sessionStorage value preservation across Back / Retry
 *
 * PII rule: this file MUST NEVER read a field's value into an analytics
 * call. Only the field's `name` is sent (form_field_error). All telemetry
 * goes through src/lib/lead-tracker.ts.
 *
 * View transitions: this file binds on `astro:page-load` so it survives
 * Astro's view transitions, and also runs once on `DOMContentLoaded` for
 * the initial page load (when page-load might not fire if navigation
 * happened before listener attachment).
 */

import { leadTracker, ERROR_CODES } from '../lib/lead-tracker.ts';
import { SESSION_KEYS } from '../data/marketing.ts';

// ─────────────────────────────────────────────────────────────────────
// Validation rules
// ─────────────────────────────────────────────────────────────────────

/** RFC-light email regex. Soft check: passes obvious shapes, fails the
 *  obvious garbage. The server (formsubmit.co / our /api/lead) does the
 *  real verification; the client just keeps the user from obvious typos. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** International phone: optional +, then 8-15 digits with optional
 *  spaces or hyphens. */
const PHONE_RE = /^\+?[\d\s-]{8,15}$/;
/** Subset of free-mail domains we DO NOT block (per Product decision
 *  in the CRO audit — see MASTER-CRO-AUDIT-AR.md §10). Listed here so
 *  the soft-check stays in one place. */
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'yahoo.com', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'protonmail.com', 'proton.me', 'tutanota.com',
]);

function validateFieldValue(field) {
  const name = field.name;
  const value = (field.value || '').trim();
  const required = field.hasAttribute('required');
  const type = field.dataset.fieldType || field.type || 'text';

  if (required && !value) {
    return { ok: false, code: ERROR_CODES.VALIDATION_REQUIRED, msg: 'هذا الحقل مطلوب' };
  }
  if (!value) {
    return { ok: true }; // optional + empty = valid
  }
  if (type === 'email') {
    if (!EMAIL_RE.test(value)) {
      return { ok: false, code: ERROR_CODES.VALIDATION_EMAIL, msg: 'أدخل بريد إلكتروني صحيح' };
    }
    // Soft free-mail hint — never blocks, just nudges corporate leads.
    const domain = value.split('@')[1]?.toLowerCase();
    if (domain && FREE_MAIL_DOMAINS.has(domain)) {
      // Note: not an error. We accept it and let the inbox decide.
      return { ok: true, softHint: 'personal_email' };
    }
  }
  if (type === 'tel') {
    if (!PHONE_RE.test(value)) {
      return { ok: false, code: ERROR_CODES.VALIDATION_PHONE, msg: 'أدخل رقم جوال صحيح (8-15 رقم)' };
    }
  }
  if (name === 'full_name' && value.length < 2) {
    return { ok: false, code: ERROR_CODES.VALIDATION_MIN_LENGTH, msg: 'الاسم قصير جداً' };
  }
  if (name === 'company' && value.length < 2) {
    return { ok: false, code: ERROR_CODES.VALIDATION_MIN_LENGTH, msg: 'اسم الشركة قصير جداً' };
  }
  if (name === 'message' && value.length > 2000) {
    return { ok: false, code: ERROR_CODES.VALIDATION_MIN_LENGTH, msg: 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)' };
  }
  if (name === 'pdpl_consent' && !field.checked) {
    return { ok: false, code: ERROR_CODES.VALIDATION_CONSENT, msg: 'لازم توافق على سياسة الخصوصية عشان نكمل' };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// UTM / referrer / landing capture
// ─────────────────────────────────────────────────────────────────────

function readUtmFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || '',
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
    content: params.get('utm_content') || '',
    term: params.get('utm_term') || '',
  };
}

function readOrInitLanding() {
  try {
    let landing = sessionStorage.getItem(SESSION_KEYS.landingPage);
    if (!landing) {
      landing = window.location.pathname + window.location.search;
      sessionStorage.setItem(SESSION_KEYS.landingPage, landing);
    }
    return landing;
  } catch {
    // sessionStorage can throw in private mode — fall back to current path
    return window.location.pathname + window.location.search;
  }
}

function populateAttribution(form) {
  // URL params win over server-rendered defaults (UTM survives redirects).
  const utm = readUtmFromUrl();
  form.querySelectorAll('[data-utm]').forEach((input) => {
    const key = input.dataset.utm;
    const value = utm[key] || input.value || '';
    if (value) input.value = value;
  });

  // Referrer — only set if we actually came from somewhere (not direct).
  const referrerInput = form.querySelector('[data-meta="referrer"]');
  if (referrerInput) {
    const ref = document.referrer || '';
    if (ref) referrerInput.value = ref;
  }

  // Landing page — captured once per session, reused on every subsequent
  // submit so the first-touch attribution isn't lost when the user
  // navigates between pages.
  const landingInput = form.querySelector('[data-meta="landing_page"]');
  if (landingInput) {
    landingInput.value = readOrInitLanding();
  }
}

// ─────────────────────────────────────────────────────────────────────
// sessionStorage value preservation (non-sensitive fields only)
// ─────────────────────────────────────────────────────────────────────

const SENSITIVE_FIELDS = new Set(['pdpl_consent']);

function loadSavedValues(form) {
  const formId = form.dataset.formId;
  if (!formId) return;
  let raw;
  try {
    raw = sessionStorage.getItem(SESSION_KEYS.formValues(formId));
  } catch {
    return;
  }
  if (!raw) return;
  let saved;
  try { saved = JSON.parse(raw); } catch { return; }
  if (!saved || typeof saved !== 'object') return;
  form.querySelectorAll('[data-field]').forEach((field) => {
    const name = field.name;
    if (SENSITIVE_FIELDS.has(name)) return; // never restore consent
    if (!(name in saved)) return;
    const value = saved[name];
    if (field.type === 'checkbox') {
      field.checked = !!value;
    } else {
      field.value = value;
    }
  });
}

function saveValues(form) {
  const formId = form.dataset.formId;
  if (!formId) return;
  const values = {};
  form.querySelectorAll('[data-field]').forEach((field) => {
    const name = field.name;
    if (SENSITIVE_FIELDS.has(name)) return;
    if (field.type === 'checkbox') values[name] = field.checked;
    else values[name] = field.value;
  });
  try {
    sessionStorage.setItem(SESSION_KEYS.formValues(formId), JSON.stringify(values));
  } catch {
    // private mode / quota — silently skip
  }
}

function clearSavedValues(form) {
  const formId = form.dataset.formId;
  if (!formId) return;
  try {
    sessionStorage.removeItem(SESSION_KEYS.formValues(formId));
  } catch { /* noop */ }
}

// ─────────────────────────────────────────────────────────────────────
// Per-field error display
// ─────────────────────────────────────────────────────────────────────

function showFieldError(form, fieldName, message) {
  const formId = form.dataset.formId;
  const errorId = formId + '-' + fieldName + '-error';
  // pdpl_consent uses a non-prefixed error id
  const fallbackId = formId + '-pdpl-consent-error';
  const errorSpan = document.getElementById(errorId) || document.getElementById(fallbackId);
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.hidden = false;
  }
  const field = form.querySelector('[name="' + fieldName + '"]');
  if (field) field.setAttribute('aria-invalid', 'true');
}

function clearFieldError(form, fieldName) {
  const formId = form.dataset.formId;
  const errorId = formId + '-' + fieldName + '-error';
  const fallbackId = formId + '-pdpl-consent-error';
  const errorSpan = document.getElementById(errorId) || document.getElementById(fallbackId);
  if (errorSpan) {
    errorSpan.textContent = '';
    errorSpan.hidden = true;
  }
  const field = form.querySelector('[name="' + fieldName + '"]');
  if (field) field.removeAttribute('aria-invalid');
}

function clearAllFieldErrors(form) {
  form.querySelectorAll('[data-field-error]').forEach((el) => {
    el.textContent = '';
    el.hidden = true;
  });
  form.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
    el.removeAttribute('aria-invalid');
  });
}

function populateErrorSummary(form, errors) {
  const summary = form.querySelector('[data-form-error-summary]');
  const list = form.querySelector('[data-form-error-list]');
  if (!summary || !list) return;
  list.innerHTML = '';
  errors.forEach((err) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + form.dataset.formId + '-' + err.field;
    a.textContent = err.msg;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = form.querySelector('[name="' + err.field + '"]');
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    li.appendChild(a);
    list.appendChild(li);
  });
  summary.hidden = false;
}

function hideErrorSummary(form) {
  const summary = form.querySelector('[data-form-error-summary]');
  if (summary) {
    summary.hidden = true;
    const list = summary.querySelector('[data-form-error-list]');
    if (list) list.innerHTML = '';
  }
}

function showFormError(form, message) {
  const banner = form.querySelector('[data-form-error-banner]');
  if (!banner) return;
  const text = banner.querySelector('[data-form-error-banner-text]');
  if (text) text.textContent = message;
  banner.hidden = false;
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideFormError(form) {
  const banner = form.querySelector('[data-form-error-banner]');
  if (banner) {
    banner.hidden = true;
    const text = banner.querySelector('[data-form-error-banner-text]');
    if (text) text.textContent = '';
  }
}

// ─────────────────────────────────────────────────────────────────────
// Submit state UI
// ─────────────────────────────────────────────────────────────────────

function setSubmitState(form, state) {
  form.dataset.state = state;
  const btn = form.querySelector('[data-submit-button]');
  if (!btn) return;
  btn.setAttribute('data-state', state);
  const label = btn.querySelector('[data-submit-label]');
  const icon = btn.querySelector('[data-submit-icon]');
  const spinner = btn.querySelector('[data-submit-spinner]');
  if (state === 'loading') {
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    if (label) label.textContent = 'جاري الإرسال…';
    if (icon) icon.setAttribute('data-submit-icon', 'loading');
    if (spinner) spinner.hidden = false;
    // Activate focus trap when submitting
    const trapWrap = form.querySelector('[data-trap-focus]');
    if (trapWrap) trapWrap.setAttribute('data-active', 'true');
  } else {
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    btn.disabled = false;
    if (label) label.textContent = btn.dataset.defaultLabel || label.textContent;
    if (icon) icon.setAttribute('data-submit-icon', 'idle');
    if (spinner) spinner.hidden = true;
    // Deactivate focus trap
    const trapWrap = form.querySelector('[data-trap-focus]');
    if (trapWrap) trapWrap.setAttribute('data-active', 'false');
  }
}

function showSuccess(form) {
  form.dataset.state = 'success';
  const panel = form.querySelector('[data-form-success]');
  if (panel) {
    panel.hidden = false;
    // Move focus to the success panel for screen readers — but delay so
    // we don't steal focus from the user's submit-click moment.
    setTimeout(() => {
      const heading = panel.querySelector('.lead-form__success-title');
      if (heading) heading.setAttribute('tabindex', '-1');
      if (heading) heading.focus();
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }
}

function redirectAfterSuccess(form, leadId) {
  const url = form.dataset.redirectUrl;
  if (!url) return;
  // Use setTimeout to let the success panel render + announce first.
  setTimeout(() => {
    let target = url;
    if (leadId) {
      // Append the lead id as a query string so the thank-you page can
      // show "your request id is X" and so analytics can stitch the
      // session back to the lead. The id is opaque (not PII) so it can
      // live in the URL bar without privacy concerns.
      const sep = url.includes('?') ? '&' : '?';
      target = url + sep + 'id=' + encodeURIComponent(leadId);
    }
    window.location.href = target;
  }, 1500);
}

// ─────────────────────────────────────────────────────────────────────
// Field-level handler
// ─────────────────────────────────────────────────────────────────────

function attachFieldListeners(form) {
  const fields = Array.from(form.querySelectorAll('[data-field]'));
  fields.forEach((field) => {
    // form_start: first interaction with any field.
    if (!form.dataset.started) {
      const onFirstFocus = () => {
        form.dataset.started = '1';
        leadTracker.formStart(
          form.dataset.formId,
          window.location.pathname,
        );
        field.removeEventListener('focus', onFirstFocus);
      };
      field.addEventListener('focus', onFirstFocus);
    }

    // Validate on blur. Skip until the user has actually started typing.
    field.addEventListener('blur', () => {
      if (!form.dataset.started) return;
      const result = validateFieldValue(field);
      if (!result.ok) {
        showFieldError(form, field.name, result.msg);
        leadTracker.formFieldError(
          form.dataset.formId,
          window.location.pathname,
          field.name,
          result.code,
        );
      } else {
        clearFieldError(form, field.name);
      }
    });

    // Live-clear errors on input — once the user starts correcting, the
    // error message should disappear immediately rather than waiting for
    // the next blur.
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        const result = validateFieldValue(field);
        if (result.ok) {
          clearFieldError(form, field.name);
          // Recompute the summary if it's visible (one less error).
          recomputeSummaryAfterEdit(form);
        }
      }
      // Save values on every keystroke (no PII — just names + values).
      saveValues(form);
    });
    field.addEventListener('change', () => saveValues(form));
  });
}

function recomputeSummaryAfterEdit(form) {
  const summary = form.querySelector('[data-form-error-summary]');
  if (!summary || summary.hidden) return;
  // Re-collect current invalid fields.
  const errors = [];
  form.querySelectorAll('[data-field]').forEach((field) => {
    const r = validateFieldValue(field);
    if (!r.ok) errors.push({ field: field.name, msg: r.msg });
  });
  if (errors.length === 0) {
    hideErrorSummary(form);
  } else {
    populateErrorSummary(form, errors);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Form-level handler
// ─────────────────────────────────────────────────────────────────────

function attachSubmitListener(form) {
  function handleSubmit(event) {
    // Honor the submit mode set by the page.
    const mode = form.dataset.submitMode || 'both';
    if (mode === 'native') {
      // Skip interception — let the form POST naturally to formsubmit.co.
      // The handler still runs validation + analytics? No — if mode is
      // 'native' the page explicitly opted out of our JS submit path.
      // We still emit form_submit_attempt so the dashboard sees the
      // click, then let the browser handle the rest.
      leadTracker.formSubmitAttempt(
        form.dataset.formId,
        window.location.pathname,
        form.querySelector('[name="utm_source"]')?.value || undefined,
        form.querySelector('[name="utm_medium"]')?.value || undefined,
        form.querySelector('[name="utm_campaign"]')?.value || undefined,
      );
      return;
    }

    // Default (and 'both'): intercept the submit and POST via fetch.
    event.preventDefault();

    const formId = form.dataset.formId;
    const path = window.location.pathname;
    const source = form.querySelector('[name="utm_source"]')?.value || undefined;
    const medium = form.querySelector('[name="utm_medium"]')?.value || undefined;
    const campaign = form.querySelector('[name="utm_campaign"]')?.value || undefined;

    // 1. Honeypot — if filled, this is a bot. Fake success, never POST.
    const honeypot = form.querySelector('[data-honeypot]');
    if (honeypot && honeypot.value) {
      // Emit success so the dashboard sees activity (helps spot bot farms).
      leadTracker.formSubmitAttempt(formId, path, source, medium, campaign);
      leadTracker.formSubmitSuccess(formId, path, { durationMs: 0, mode: 'queued' });
      showSuccess(form);
      redirectAfterSuccess(form);
      return;
    }

    // 2. Validate every field, collect errors, show summary.
    clearAllFieldErrors(form);
    hideErrorSummary(form);
    hideFormError(form);
    const errors = [];
    const fields = Array.from(form.querySelectorAll('[data-field]'));
    fields.forEach((field) => {
      const r = validateFieldValue(field);
      if (!r.ok) {
        showFieldError(form, field.name, r.msg);
        errors.push({ field: field.name, msg: r.msg });
        leadTracker.formFieldError(formId, path, field.name, r.code);
      }
    });
    if (errors.length) {
      populateErrorSummary(form, errors);
      // Focus the first invalid field (WCAG 3.3.1).
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      leadTracker.formSubmitFailure(
        formId,
        path,
        ERROR_CODES.VALIDATION_REQUIRED,
        0,
      );
      return;
    }

    // 3. Submit attempt is real — measure duration from here.
    const startedAt = performance.now();
    leadTracker.formSubmitAttempt(formId, path, source, medium, campaign);
    setSubmitState(form, 'loading');
    hideErrorSummary(form);
    hideFormError(form);

    // 4. POST to the AJAX endpoint. Falls back to native submit if the
    //    network is offline or the endpoint errors.
    const ajaxEndpoint = form.dataset.formActionAjax;
    const fd = new FormData(form);

    // 5s timeout — long enough for slow connections, short enough that
    // the user notices the hang and can retry.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(ajaxEndpoint, {
      method: 'POST',
      body: fd,
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok && res.status !== 200) {
          throw new Error('http_' + res.status);
        }
        // formsubmit.co AJAX returns { success: "true", id: "..." } or
        // sometimes just a 200 with no body. Both are valid.
        return res.json().catch(() => ({ success: true }));
      })
      .then((body) => {
        const durationMs = performance.now() - startedAt;
        const leadId = body && (body.id || body.lead_id) ? String(body.id || body.lead_id) : undefined;
        leadTracker.formSubmitSuccess(formId, path, {
          durationMs,
          leadId,
          mode: 'shipped',
        });
        // GA4 conversion event: generate_lead — fires after successful
        // submit so Google Ads / GA4 conversion tracking attributes the
        // lead. Only carries form_id + page_path + UTM (never PII).
        leadTracker.generateLead(formId, path, {
          source: source || undefined,
          medium: medium || undefined,
          campaign: campaign || undefined,
        });
        // Mark the form as submitted so Back/Retry doesn't restore values.
        try {
          sessionStorage.setItem(SESSION_KEYS.submitted(formId), '1');
        } catch { /* noop */ }
        clearSavedValues(form);
        showSuccess(form);
        redirectAfterSuccess(form, leadId);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        const durationMs = performance.now() - startedAt;
        const isAbort = err && err.name === 'AbortError';
        const errorCode = isAbort
          ? ERROR_CODES.TIMEOUT
          : ERROR_CODES.NETWORK_ERROR;
        leadTracker.formSubmitFailure(formId, path, errorCode, durationMs);
        setSubmitState(form, 'error');

        // Fallback to native POST so the user still has a path forward.
        // formsubmit.co doesn't need JS — the <form> action+method handle
        // it once we let the default through.
        // BUT: only fall back if the form had a native action and the
        // error wasn't a 4xx (4xx = bad payload, retry won't help).
        const isHttpError = typeof err?.message === 'string' && err.message.startsWith('http_');
        if (isHttpError) {
          // Show form-level error, do NOT re-submit (would loop).
          // The user can adjust the values and retry.
          showFormError(form,
            'حصل خطأ في الخادم. حاول مرة ثانية بعد قليل.');
          setSubmitState(form, 'idle');
          // Move focus to the banner so screen readers announce it.
          const banner = form.querySelector('[data-form-error-banner]');
          if (banner) banner.setAttribute('tabindex', '-1');
          if (banner) banner.focus();
        } else {
          // Network / timeout → native fallback (one-shot, no re-intercept).
          form.removeEventListener('submit', handleSubmit);
          form.submit();
        }
      });
  }
  form.addEventListener('submit', handleSubmit);
}

// ─────────────────────────────────────────────────────────────────────
// form_view — emit once when the form scrolls into view
// ─────────────────────────────────────────────────────────────────────

function attachViewObserver(form) {
  if (!('IntersectionObserver' in window)) {
    leadTracker.formView(form.dataset.formId, window.location.pathname);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          leadTracker.formView(form.dataset.formId, window.location.pathname);
          observer.disconnect();
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );
  observer.observe(form);
}

// ─────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────

function initForm(form) {
  if (form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  const formId = form.dataset.formId;
  // If the user already submitted this form in this session, keep the
  // success panel visible instead of resetting it. View transitions
  // re-mount the form, so we have to ask storage.
  try {
    if (sessionStorage.getItem(SESSION_KEYS.submitted(formId)) === '1') {
      showSuccess(form);
      return;
    }
  } catch { /* noop */ }

  populateAttribution(form);
  loadSavedValues(form);
  attachFieldListeners(form);
  attachSubmitListener(form);
  attachViewObserver(form);
}

function init() {
  const forms = document.querySelectorAll('[data-lead-form]');
  forms.forEach(initForm);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Re-init after Astro view transitions.
document.addEventListener('astro:page-load', init);
