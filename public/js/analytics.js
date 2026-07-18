/**
 * analytics.js — Unified marketing measurement runtime (CRO audit Prompt 5).
 *
 * Self-contained ES module loaded from BaseLayout.astro as
 *   <script type="module" src="/js/analytics.js" nonce="...">
 *
 * Why public/js/ (not src/scripts/):
 *   The other 4 in-page scripts (font-async-loader, page-view, scroll-reveal,
 *   focus-trap) live in src/scripts/ and are loaded via
 *   <script nonce="...">import '...';</script>. KI-SYNTAX-2026-07-18-001
 *   discovered that Astro does NOT bundle the import when a nonce is present
 *   — the raw import statement is shipped to the browser, which then throws
 *   SyntaxError ("Cannot use import statement outside a module"). To avoid
 *   the same trap, this file lives in public/js/ as a fully self-contained
 *   module (no external imports). It loads with type="module" so the browser
 *   handles it natively.
 *
 * What it does:
 *   1. Installs window.__BRIGHTAI_ANALYTICS__ — track(), setConsent(),
 *      getConsent(), registerProvider(), unregisterProvider(), listProviders(),
 *      onConsentChange(), detectPageType(), events (the canonical names).
 *   2. Click delegation on document for [data-cta], [data-cta-secondary],
 *      [data-whatsapp]. Routes to the right event name based on attributes.
 *   3. IntersectionObserver for [data-asset-type] and [data-case-study].
 *   4. First-focus listener for [data-assessment-form] → assessment_start.
 *   5. Form-submit listener for [data-assessment-form] → assessment_complete.
 *   6. Fires page_view on every page load + Astro view transition.
 *   7. Auto-registers a console debug provider (dev tools only).
 *
 * Provider scripts (gtag-init, mixpanel-init, bing-uet) self-register by
 * calling window.__BRIGHTAI_ANALYTICS__.registerProvider() in their init.
 * If the runtime isn't installed yet when they try, they poll every 20ms
 * for up to 1s.
 *
 * PII rule: assertNoPii() in track() blocks any PII-shaped key. The
 * dev-mode flag window.__BRIGHTAI_DEBUG_TRACKING__ must be true to see
 * the throws (production is a silent drop for performance).
 *
 * No-provider mode: when no provider has registered (current default —
 * HubSpot/Bing/Mixpanel IDs are empty), calls are silent. No console
 * errors, no broken dashboards, no network requests.
 */

// ─────────────────────────────────────────────────────────────────────
// Event taxonomy
// ─────────────────────────────────────────────────────────────────────

const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  HERO_CTA_CLICK: 'hero_cta_click',
  SECONDARY_CTA_CLICK: 'secondary_cta_click',
  WHATSAPP_CLICK: 'whatsapp_click',
  PRICING_VIEW: 'pricing_view',
  PRICING_CTA_CLICK: 'pricing_cta_click',
  PROOF_ASSET_VIEW: 'proof_asset_view',
  CASE_STUDY_VIEW: 'case_study_view',
  ASSESSMENT_START: 'assessment_start',
  ASSESSMENT_COMPLETE: 'assessment_complete',
  FORM_VIEW: 'form_view',
  FORM_START: 'form_start',
  FORM_FIELD_ERROR: 'form_field_error',
  FORM_SUBMIT_ATTEMPT: 'form_submit_attempt',
  FORM_SUBMIT_SUCCESS: 'form_submit_success',
  FORM_SUBMIT_FAILURE: 'form_submit_failure',
  CALENDAR_OPEN: 'calendar_open',
  MEETING_BOOKED: 'meeting_booked',
  // ── Kernel funnel events (KERNEL-ANALYTICS-2026-07-18) ──
  // Non-PII only. Lead is linked to aggregated scenario context (slugs),
  // never to message text or contact details. Consent gating + dedupe are
  // inherited from the shared track() path.
  KERNEL_STARTED: 'kernel_started',
  SCENARIO_SELECTED: 'scenario_selected',
  MESSAGE_ALLOWED: 'message_allowed',
  MESSAGE_BLOCKED: 'message_blocked',
  EVIDENCE_VIEWED: 'evidence_viewed',
  LEAD_SUBMITTED: 'lead_submitted',
};

// ─────────────────────────────────────────────────────────────────────
// PII guard
// ─────────────────────────────────────────────────────────────────────

const PII_KEYS = new Set([
  'email', 'work_email', 'personal_email', 'phone', 'work_phone',
  'full_name', 'first_name', 'last_name', 'name',
  'company', 'organization', 'employer',
  'message', 'subject', 'body', 'notes',
  'address', 'street', 'city', 'country', 'postal_code', 'zip',
  'referrer_email', 'referrer_name', 'referral_email', 'referral_name',
  'contact', 'contact_email',
  'pdpl_consent', 'consent', 'gdpr_consent',
  'form_data', 'payload', 'values', 'fields',
  'url', 'href', 'src',
]);

function isPiiKey(key) {
  const lower = key.toLowerCase();
  if (PII_KEYS.has(lower)) return true;
  if (
    lower.endsWith('_email') ||
    lower.endsWith('_phone') ||
    lower.endsWith('_name') ||
    lower.endsWith('_message')
  ) return true;
  if (lower === 'message' || lower === 'subject' || lower === 'notes') return true;
  return false;
}

function assertNoPii(payload) {
  if (typeof window === 'undefined') return;
  if (!window.__BRIGHTAI_DEBUG_TRACKING__) return;
  for (const key of Object.keys(payload)) {
    if (isPiiKey(key)) {
      throw new Error(
        '[analytics] PII key "' + key + '" blocked. ' +
        'Use the common-props allowlist (page_path, form_id, error_code, ...), ' +
        'never raw form values.'
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Deduplication
// ─────────────────────────────────────────────────────────────────────

const DEDUPE_WINDOW_MS = 1500;
const recent = new Map();

function fingerprint(name, payload) {
  const keys = Object.keys(payload).filter(
    (k) => payload[k] !== undefined && payload[k] !== null
  );
  keys.sort();
  return name + '::' + keys.map((k) => k + '=' + String(payload[k])).join('|');
}

function isDuplicate(name, payload) {
  if (typeof window === 'undefined') return false;
  const now = Date.now();
  recent.forEach((v, k) => {
    if (now - v.ts > DEDUPE_WINDOW_MS * 4) recent.delete(k);
  });
  const fp = fingerprint(name, payload);
  const prev = recent.get(fp);
  if (prev && now - prev.ts < DEDUPE_WINDOW_MS) return true;
  recent.set(fp, { ts: now });
  return false;
}

// ─────────────────────────────────────────────────────────────────────
// Consent
// ─────────────────────────────────────────────────────────────────────

let consent = 'unknown';
let consentListeners = [];
const pendingQueue = [];

function setConsent(next) {
  if (consent === next) return;
  consent = next;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('brightai:tracking_consent', next);
    }
  } catch (e) { /* private mode */ }
  for (const fn of consentListeners) {
    try { fn(next); } catch (e) { /* noop */ }
  }
  if (next === 'granted') flushQueue();
  if (next === 'denied') pendingQueue.length = 0;
}

function getConsent() {
  return consent;
}

function onConsentChange(fn) {
  consentListeners.push(fn);
  return () => {
    consentListeners = consentListeners.filter((f) => f !== fn);
  };
}

function hydrateConsentFromStorage() {
  if (typeof localStorage === 'undefined') return consent;
  try {
    const stored = localStorage.getItem('brightai:tracking_consent');
    if (stored === 'granted' || stored === 'denied') {
      consent = stored;
    }
  } catch (e) { /* noop */ }
  return consent;
}

function flushQueue() {
  while (pendingQueue.length > 0) {
    const next = pendingQueue.shift();
    dispatch(next.name, next.payload);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Provider registry
// ─────────────────────────────────────────────────────────────────────

const providers = [];

function registerProvider(p) {
  const existing = providers.findIndex((x) => x.name === p.name);
  if (existing >= 0) providers[existing] = p;
  else providers.push(p);
}

function unregisterProvider(name) {
  const idx = providers.findIndex((x) => x.name === name);
  if (idx >= 0) providers.splice(idx, 1);
}

function listProviders() {
  return providers.map((p) => p.name);
}

// ─────────────────────────────────────────────────────────────────────
// Context injection (auto page_path, device, UTM, etc.)
// ─────────────────────────────────────────────────────────────────────

function buildContext(overrides) {
  overrides = overrides || {};
  const ctx = Object.assign({}, overrides);
  if (typeof window === 'undefined') return ctx;
  if (!('page_path' in ctx) || ctx.page_path == null) {
    ctx.page_path = window.location.pathname;
  }
  if (!('page_title' in ctx) || ctx.page_title == null) {
    ctx.page_title = document.title;
  }
  if (!('page_type' in ctx) || ctx.page_type == null) {
    ctx.page_type = detectPageType();
  }
  if (!('language' in ctx) || ctx.language == null) {
    const lang = document.documentElement.lang || 'ar';
    ctx.language = lang === 'en' ? 'en-SA' : 'ar-SA';
  }
  if (!('device' in ctx) || ctx.device == null) {
    const w = window.innerWidth;
    ctx.device = w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  }
  if (!('viewport' in ctx) || ctx.viewport == null) {
    ctx.viewport = window.innerWidth + 'x' + window.innerHeight;
  }
  if (!('referrer' in ctx) || ctx.referrer == null) {
    try {
      const ref = document.referrer;
      if (ref) {
        const u = new URL(ref);
        ctx.referrer = u.host;
      }
    } catch (e) { /* noop */ }
  }
  try {
    const usp = new URLSearchParams(window.location.search);
    if (!('source' in ctx) || ctx.source == null) {
      ctx.source = usp.get('utm_source') || 'direct';
    }
    if (!('medium' in ctx) || ctx.medium == null) {
      ctx.medium = usp.get('utm_medium') || 'none';
    }
    if (!('campaign' in ctx) || ctx.campaign == null) {
      ctx.campaign = usp.get('utm_campaign') || 'none';
    }
  } catch (e) { /* noop */ }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────
// Core track()
// ─────────────────────────────────────────────────────────────────────

const MAX_STRING = 200;
const MAX_DURATION_MS = 60000;

function sanitizeValue(v) {
  if (v == null) return v;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    return Math.min(Math.max(Math.trunc(v), 0), MAX_DURATION_MS);
  }
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.length > MAX_STRING) return trimmed.slice(0, MAX_STRING);
    return trimmed;
  }
  return null;
}

function track(name, payload) {
  payload = payload || {};
  try {
    const sanitized = {};
    for (const k of Object.keys(payload)) {
      sanitized[k] = sanitizeValue(payload[k]);
    }
    assertNoPii(sanitized);
  } catch (err) {
    if (typeof console !== 'undefined') console.error(err);
    return false;
  }

  if (typeof window === 'undefined') return false;

  const enriched = buildContext(payload);

  if (isDuplicate(name, enriched)) return false;

  if (consent === 'denied') return false;
  if (consent === 'unknown') {
    pendingQueue.push({ name, payload: enriched });
    if (pendingQueue.length > 100) pendingQueue.shift();
    return false;
  }

  dispatch(name, enriched);
  return true;
}

function dispatch(name, payload) {
  for (const p of providers) {
    if (!p.bypassConsent && consent !== 'granted') continue;
    try {
      p.fn(name, payload);
    } catch (e) {
      // provider failure is never allowed to surface
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Page-type detection
// ─────────────────────────────────────────────────────────────────────

function detectPageType() {
  if (typeof document === 'undefined') return 'other';
  const attr = document.body && document.body.getAttribute('data-page-type');
  if (attr) return attr;
  const p = window.location.pathname;
  if (p === '/' || p === '') return 'home';
  if (p.startsWith('/pricing')) return 'pricing';
  if (p.startsWith('/contact')) return 'contact';
  if (p.startsWith('/assessment')) return 'assessment';
  if (p.startsWith('/customers') || p.startsWith('/case-studies')) return 'customers';
  if (p.startsWith('/about')) return 'about';
  if (p.startsWith('/services')) return 'services';
  if (p.startsWith('/solutions')) {
    if (p.match(/\/solutions\/[a-z0-9-]+\/[a-z0-9-]+\/?$/i)) return 'solution_city';
    if (p.match(/\/solutions\/[a-z0-9-]+\/?$/i)) return 'solution_sector';
    return 'solution';
  }
  if (p.startsWith('/blog')) return 'blog';
  if (p.startsWith('/docs')) return 'docs';
  if (p.startsWith('/kernel')) return 'kernel';
  if (p.startsWith('/hub')) return 'hub';
  if (p.match(/\/(privacy|terms|cookie|legal|pdpl|dpa|privacy-cookies|privacy-policy)/)) return 'legal';
  return 'other';
}

// ─────────────────────────────────────────────────────────────────────
// Public runtime on window
// ─────────────────────────────────────────────────────────────────────

function installRuntime() {
  if (typeof window === 'undefined') return;
  window.__BRIGHTAI_ANALYTICS__ = {
    track,
    setConsent,
    getConsent,
    onConsentChange,
    registerProvider,
    unregisterProvider,
    listProviders,
    detectPageType,
    events: ANALYTICS_EVENTS,
    hydrateConsentFromStorage,
  };
  hydrateConsentFromStorage();
}

// ─────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────

let BOOTED = false;

function bootOnce() {
  if (BOOTED) return;
  BOOTED = true;

  installRuntime();

  // Console debug provider (dev tools only — bypassConsent so it always sees events).
  window.__BRIGHTAI_ANALYTICS__.registerProvider({
    name: 'console',
    bypassConsent: true,
    fn: (event, payload) => {
      if (window.__BRIGHTAI_DEBUG_TRACKING__) {
        console.debug('[analytics]', event, payload);
      }
    },
  });

  // Mark page_type on <body> if the page didn't already.
  const body = document.body;
  if (body && !body.hasAttribute('data-page-type')) {
    body.setAttribute('data-page-type', detectPageType());
  }

  installClickDelegation();
  installViewObservers();
}

// ─────────────────────────────────────────────────────────────────────
// Click delegation
// ─────────────────────────────────────────────────────────────────────

function installClickDelegation() {
  if (typeof document === 'undefined') return;

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const cta = target.closest('[data-cta], [data-cta-secondary], [data-whatsapp]');
      if (!cta) return;

      const ds = (key) => cta.getAttribute('data-' + key) || undefined;
      const basePayload = {
        cta_label: truncate(cta.getAttribute('data-cta-label') || textOf(cta), 80),
        cta_position: ds('position') || ds('cta-position') || 'inline',
        cta_target: pathOnly(cta.getAttribute('href')),
        page_type: detectPageType(),
        persona: ds('persona') || undefined,
        offer: ds('offer') || undefined,
      };

      if (cta.matches('[data-whatsapp]')) {
        track(ANALYTICS_EVENTS.WHATSAPP_CLICK, basePayload);
        return;
      }
      if (cta.matches('[data-cta-secondary]')) {
        track(ANALYTICS_EVENTS.SECONDARY_CTA_CLICK, {
          ...basePayload,
          cta_label: cta.getAttribute('data-cta-label') || textOf(cta) || 'secondary',
        });
        return;
      }
      if (cta.matches('[data-cta]')) {
        const explicit = cta.getAttribute('data-cta');
        const href = cta.getAttribute('href') || '';
        const isPricing = basePayload.page_type === 'pricing' ||
                          (explicit && explicit.indexOf('pricing') === 0);
        const isAssessment = explicit === 'assessment_start' ||
                             href.indexOf('/assessment/') === 0;
        const isCalendar = /calendly|cal\.com|hubspot.*meeting|book/i.test(href) ||
                           cta.getAttribute('data-calendar') !== null;
        const isProof = cta.closest('[data-asset-type]') !== null;
        if (isCalendar) {
          track(ANALYTICS_EVENTS.CALENDAR_OPEN, basePayload);
        } else if (isAssessment) {
          track(ANALYTICS_EVENTS.ASSESSMENT_START, basePayload);
        } else if (isPricing) {
          track(ANALYTICS_EVENTS.PRICING_CTA_CLICK, basePayload);
        } else if (isProof) {
          track(ANALYTICS_EVENTS.HERO_CTA_CLICK, basePayload);
        } else {
          const eventName = basePayload.cta_position === 'hero'
            ? ANALYTICS_EVENTS.HERO_CTA_CLICK
            : ANALYTICS_EVENTS.SECONDARY_CTA_CLICK;
          track(eventName, basePayload);
        }
      }
    },
    { capture: true }
  );
}

// ─────────────────────────────────────────────────────────────────────
// IntersectionObserver — view-based events
// ─────────────────────────────────────────────────────────────────────

function installViewObservers() {
  if (typeof window === 'undefined') return;
  if (!('IntersectionObserver' in window)) {
    emitFallbackViews();
    return;
  }

  const pageType = detectPageType();
  if (pageType === 'pricing') {
    observeElement(document.body, () => {
      track(ANALYTICS_EVENTS.PRICING_VIEW, { page_type: 'pricing' });
    });
  }

  document.querySelectorAll('[data-asset-type]').forEach((el) => {
    observeElement(el, () => {
      track(ANALYTICS_EVENTS.PROOF_ASSET_VIEW, {
        asset_type: el.getAttribute('data-asset-type') || undefined,
        asset_id: el.getAttribute('data-asset-id') || undefined,
        cta_label: truncate(el.getAttribute('data-asset-title') || textOf(el), 80),
        page_type: pageType,
      });
    });
  });

  document.querySelectorAll('[data-case-study]').forEach((el) => {
    observeElement(el, () => {
      track(ANALYTICS_EVENTS.CASE_STUDY_VIEW, {
        case_study_id: el.getAttribute('data-case-study') || undefined,
        cta_label: truncate(el.getAttribute('data-case-title') || textOf(el), 80),
        page_type: pageType,
      });
    });
  });

  // assessment form
  const assessmentForm = document.querySelector('[data-assessment-form]');
  if (assessmentForm instanceof HTMLFormElement) {
    let startedFired = false;
    assessmentForm.addEventListener('focusin', () => {
      if (startedFired) return;
      startedFired = true;
      track(ANALYTICS_EVENTS.ASSESSMENT_START, {
        form_id: 'assessment_readiness',
        page_type: 'assessment',
      });
    });
    assessmentForm.addEventListener('submit', () => {
      track(ANALYTICS_EVENTS.ASSESSMENT_COMPLETE, {
        form_id: 'assessment_readiness',
        page_type: 'assessment',
      });
    });
  }

  // meeting booked success element
  const meetingEl = document.querySelector('[data-meeting-booked]');
  if (meetingEl) {
    observeElement(meetingEl, () => {
      track(ANALYTICS_EVENTS.MEETING_BOOKED, { page_type: pageType });
    });
  }
}

function emitFallbackViews() {
  const pageType = detectPageType();
  if (pageType === 'pricing') {
    track(ANALYTICS_EVENTS.PRICING_VIEW, { page_type: 'pricing' });
  }
  document.querySelectorAll('[data-asset-type]').forEach((el) => {
    track(ANALYTICS_EVENTS.PROOF_ASSET_VIEW, {
      asset_type: el.getAttribute('data-asset-type') || undefined,
      asset_id: el.getAttribute('data-asset-id') || undefined,
      page_type: pageType,
    });
  });
  document.querySelectorAll('[data-case-study]').forEach((el) => {
    track(ANALYTICS_EVENTS.CASE_STUDY_VIEW, {
      case_study_id: el.getAttribute('data-case-study') || undefined,
      page_type: pageType,
    });
  });
}

function observeElement(el, callback) {
  if (typeof IntersectionObserver === 'undefined') {
    callback();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  );
  observer.observe(el);
}

// ─────────────────────────────────────────────────────────────────────
// page_view
// ─────────────────────────────────────────────────────────────────────

function emitPageView() {
  if (typeof window === 'undefined') return;
  track(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_type: detectPageType(),
    page_title: document.title,
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bootOnce();
      emitPageView();
    });
  } else {
    bootOnce();
    emitPageView();
  }
  document.addEventListener('astro:page-load', () => {
    bootOnce();
    emitPageView();
  });
  document.addEventListener('astro:after-swap', () => {
    emitPageView();
  });
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function textOf(el) {
  if (!el) return '';
  const clone = el.cloneNode(true);
  clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return (clone.textContent || '').trim().replace(/\s+/g, ' ');
}

function truncate(s, n) {
  if (!s) return undefined;
  return s.length > n ? s.slice(0, n) : s;
}

function pathOnly(href) {
  if (!href) return undefined;
  try {
    if (href.startsWith('#')) return href;
    if (/^(https?:|mailto:|tel:|wa\.me:|javascript:)/.test(href)) {
      const u = new URL(href, window.location.origin);
      return u.pathname;
    }
    const u = new URL(href, window.location.origin);
    return u.pathname;
  } catch (e) {
    return undefined;
  }
}

// Expose helpers to other scripts (for testing + advanced usage).
export {
  track,
  setConsent,
  getConsent,
  onConsentChange,
  registerProvider,
  unregisterProvider,
  listProviders,
  detectPageType,
  ANALYTICS_EVENTS,
  assertNoPii,
  installRuntime,
  hydrateConsentFromStorage,
};
