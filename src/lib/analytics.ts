/**
 * analytics.ts — Unified marketing measurement layer (CRO audit Prompt 5).
 *
 * Single source of truth for every tracking call on the BrightAI site. Three
 * reasons it exists:
 *
 *   1. CONSISTENCY — every page emits the SAME event name for the SAME user
 *      action. "hero_cta_click" means exactly one thing everywhere. The
 *      dashboard filter sees a stable spelling.
 *
 *   2. PII SAFETY — no event payload may contain email/phone/name/company/
 *      message/referrer. A dev-mode assert catches new leaks at source
 *      instead of leaking them to a third-party dashboard. Production
 *      enforces the same allowlist silently for performance.
 *
 *   3. NO-PROVIDER SAFE — when no provider is configured (current default
 *      state — HubSpot/Bing/Mixpanel IDs are empty placeholders), calls
 *      are silent. No console errors, no broken dashboards, no failed
 *      network requests. The moment a real ID lands in marketing.ts +
 *      CSP allows the origin, events start flowing.
 *
 * The taxonomy + common properties are taken verbatim from
 * audit/CRO/MASTER-CRO-AUDIT-AR.md §10. Don't change names without
 * updating the dashboards + the analytics-test.mjs allowlist.
 *
 * Architectural contract:
 *   - ts imports:   import { track, ANALYTICS_EVENTS, hasConsent } from '@/lib/analytics';
 *   - runtime call: window.__BRIGHTAI_ANALYTICS__.track(name, payload);
 *   - consent set:  window.__BRIGHTAI_ANALYTICS__.setConsent(true|false);
 *   - provider reg: window.__BRIGHTAI_ANALYTICS__.registerProvider({ name, fn });
 *
 * The runtime lives in src/scripts/analytics.js. This file is the spec
 * + the dev-time guards. Keep them in sync.
 */

// ─────────────────────────────────────────────────────────────────────
// Event taxonomy
// ─────────────────────────────────────────────────────────────────────

/**
 * Canonical event names. Adding a new event:
 *   1. Add the literal here.
 *   2. Update the EventPayload type if it needs extra props.
 *   3. Update analytics-test.mjs ALLOWED_EVENTS to allow the spelling.
 *   4. Update docs/analytics/event-mapping.md for HubSpot/Mixpanel/Bing.
 */
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  HERO_CTA_CLICK: 'hero_cta_click',
  SECONDARY_CTA_CLICK: 'secondary_cta_click',
  WHATSAPP_CLICK: 'whatsapp_click',
  PRICING_VIEW: 'pricing_view',
  PRICING_CTA_CLICK: 'pricing_cta_click',
  DEMO_SUBMIT: 'demo_submit',
  CONTACT_SUBMIT: 'contact_submit',
  LEAD_CREATED: 'lead_created',
  ASSESSMENT_STARTED: 'assessment_started',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  NEWSLETTER_SIGNUP: 'newsletter_signup',
  RESOURCE_DOWNLOAD: 'resource_download',
  OUTBOUND_PARTNER_CLICK: 'outbound_partner_click',
  PROOF_ASSET_VIEW: 'proof_asset_view',
  CASE_STUDY_VIEW: 'case_study_view',
  ASSESSMENT_START: 'assessment_started',
  ASSESSMENT_COMPLETE: 'assessment_completed',
  FORM_VIEW: 'form_view',
  FORM_START: 'form_start',
  FORM_FIELD_ERROR: 'form_field_error',
  FORM_SUBMIT_ATTEMPT: 'form_submit_attempt',
  FORM_SUBMIT_SUCCESS: 'form_submit_success',
  FORM_SUBMIT_FAILURE: 'form_submit_failure',
  CALENDAR_OPEN: 'calendar_open',
  MEETING_BOOKED: 'meeting_booked',
  /** @deprecated use LEAD_CREATED. Kept only for source compatibility. */
  GENERATE_LEAD: 'lead_created',
  /** @deprecated use canonical conversion names above. */
  LEAD_STARTED: 'form_submit_attempt',
  /** @deprecated use LEAD_CREATED. */
  LEAD_COMPLETED: 'lead_created',
  CHAT_STARTED: 'chat_started',
  CHAT_COMPLETED: 'chat_completed',
  DEMO_OPENED: 'demo_opened',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Back-compat alias for the LeadForm module. */
export type LeadEventName =
  | 'form_view'
  | 'form_start'
  | 'form_field_error'
  | 'form_submit_attempt'
  | 'form_submit_success'
  | 'form_submit_failure';

// ─────────────────────────────────────────────────────────────────────
// PII guard
// ─────────────────────────────────────────────────────────────────────

/**
 * Keys that are NEVER allowed in an analytics payload. Adding to this
 * list is a security decision — when a new PII-like field appears, we
 * block the entire key + any suffix variants.
 *
 * Suffix rule: any key ending in `_email`, `_phone`, `_name`, `_message`
 * is blocked even if not listed (see `assertNoPii` below).
 */
const PII_KEYS = new Set<string>([
  // direct PII fields (form field names)
  'email', 'work_email', 'personal_email', 'phone', 'work_phone',
  'full_name', 'first_name', 'last_name', 'name',
  'company', 'organization', 'employer',
  'message', 'subject', 'body', 'notes',
  'address', 'street', 'city', 'country', 'postal_code', 'zip',
  // referrer / contact leakage vectors
  'referrer_email', 'referrer_name', 'referral_email', 'referral_name',
  'contact', 'contact_email',
  // consent / sensitive boolean states (still PII-shaped)
  'pdpl_consent', 'consent', 'gdpr_consent',
  // raw form values / serialized form data
  'form_data', 'payload', 'values', 'fields',
  // URL with query string (may carry UTM + accidental PII)
  'url', 'href', 'src',
]);

/**
 * Strict allowlist of common properties. The list is the contract — every
 * payload key MUST be in this set (or be a provider-specific override that
 * passes `assertNoPii`).
 *
 * If you need a new common property, add it here AND in
 * `COMMON_PROPS_HINT` so docs/analytics/dashboard-spec.md picks it up.
 */
const ALLOWED_COMMON_PROPS = new Set<string>([
  // Page
  'page_path', 'page_type', 'page_title', 'page_location',
  // Funnel
  'persona', 'offer', 'form_id', 'experiment_id', 'variant',
  // CTA context
  'cta_label', 'cta_position', 'cta_target',
  'cta_location', 'form_type', 'content_group',
  // Attribution
  'source', 'medium', 'campaign', 'content', 'term', 'referrer',
  // Device + lang
  'device', 'language', 'viewport', 'connection',
  // Form-internal
  'field_name', 'error_code', 'duration_ms', 'lead_id', 'mode',
  // Assessment / proof
  'asset_type', 'asset_id', 'case_study_id', 'step_number',
  // Provider timestamps
  'ts', 'event_id', 'session_id',
]);

const COMMON_PROPS_HINT = {
  // Page
  page_path: 'current URL path (Astro.url.pathname)',
  page_type: 'home | pricing | contact | solution | solution_sector | solution_city | assessment | customers | about | services | blog | docs | legal | kernel | other',
  page_title: 'document.title at emit time',
  page_location: 'window.location.href (NO query — strip UTM here)',
  // Funnel
  persona: 'CISO | DPO | CIO | Risk | CDO | Procurement | CEO | null',
  offer: 'assessment | pilot | enterprise | null',
  form_id: 'FORM_TAXONOMY value (contact_main, home_cta, kernel_lead, ...)',
  experiment_id: 'A/B test slug',
  variant: 'A | B | control',
  // CTA
  cta_label: 'visible button text (truncated to 80 chars)',
  cta_position: 'hero | final | header | footer | card | section | inline',
  cta_target: 'href value of the link/button (path only, no query)',
  cta_location: 'hero | header | footer | card | section | inline | results',
  form_type: 'contact | demo | newsletter | partner | referral | assessment | other',
  content_group: 'stable content grouping derived from page type',
  // Attribution
  source: 'utm_source (or "direct")',
  medium: 'utm_medium (or "none")',
  campaign: 'utm_campaign (or "none")',
  content: 'utm_content (or null)',
  term: 'utm_term (or null)',
  referrer: 'document.referrer (HOST only — strip path/query)',
  // Device
  device: 'mobile | tablet | desktop',
  language: 'ar-SA | en-SA',
  viewport: 'WIDTHxHEIGHT (e.g. 390x844)',
  connection: '4g | 3g | slow-2g | unknown',
  // Form-internal
  field_name: 'which field failed (form_field_error only)',
  error_code: 'machine code (form_submit_failure + form_field_error)',
  duration_ms: 'submit duration in ms',
  lead_id: 'server-returned opaque id (NOT PII — opaque token)',
  mode: 'shipped | queued | native',
  // Assessment / proof
  asset_type: 'case_study | architecture_diagram | evidence_pack | whitepaper',
  asset_id: 'stable id of the asset (e.g. case_study_bank_al_rajhi)',
  case_study_id: 'stable id (e.g. bank_al_rajhi)',
  step_number: '1..N for multi-step flows',
} as const;

// ─────────────────────────────────────────────────────────────────────
// Payload type
// ─────────────────────────────────────────────────────────────────────

/**
 * Common payload. Keys are restricted to the allowlist above. Numeric
 * fields (duration_ms) are clamped to integers. String fields are
 * truncated to 200 chars to keep dashboards readable.
 */
export interface AnalyticsPayload {
  // Index signature restricted to the allowlist at runtime via assertNoPii.
  [key: string]: string | number | boolean | null | undefined;
}

export type CommonProps = keyof typeof COMMON_PROPS_HINT;

/** Error code enum — re-exported for back-compat with lead-tracker.ts. */
export const ERROR_CODES = {
  // client-side
  VALIDATION_REQUIRED: 'validation_required',
  VALIDATION_EMAIL: 'validation_email',
  VALIDATION_PHONE: 'validation_phone',
  VALIDATION_MIN_LENGTH: 'validation_min_length',
  VALIDATION_CONSENT: 'validation_consent',
  // submit / network
  HONEYPOT_FILLED: 'honeypot_filled',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  SERVER_ERROR: 'server_error',
  RATE_LIMITED: 'rate_limited',
  // fallback
  UNKNOWN: 'unknown',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────

const MAX_STRING = 200;
const MAX_DURATION_MS = 60_000;

function sanitizeValue(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v === 'number') {
    if (Number.isFinite(v)) return Math.min(Math.max(Math.trunc(v), 0), MAX_DURATION_MS);
    return null;
  }
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.length > MAX_STRING) return trimmed.slice(0, MAX_STRING);
    return trimmed;
  }
  // objects / arrays / functions: drop them
  return null;
}

function isPiiKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (PII_KEYS.has(lower)) return true;
  // suffix rule — anything that looks like an email/phone/name/message field
  if (
    lower.endsWith('_email') ||
    lower.endsWith('_phone') ||
    lower.endsWith('_name') ||
    lower.endsWith('_message')
  ) return true;
  // exact matches we explicitly want blocked even if not in the suffix list
  if (lower === 'message' || lower === 'subject' || lower === 'notes') return true;
  return false;
}

/**
 * Dev-mode guard. Throws when a PII-shaped key is found. In production
 * the function is a fast no-op so hot-path tracking stays cheap.
 *
 * IMPORTANT: keep in sync with the validator in analytics-test.mjs.
 */
export function assertNoPii(payload: AnalyticsPayload): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __BRIGHTAI_DEBUG_TRACKING__?: boolean };
  if (!w.__BRIGHTAI_DEBUG_TRACKING__) return;

  for (const key of Object.keys(payload)) {
    if (isPiiKey(key)) {
      throw new Error(
        `[analytics] PII key "${key}" blocked. ` +
          `Use the common-props allowlist (page_path, form_id, error_code, ...), ` +
          `never raw form values.`,
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Deduplication
// ─────────────────────────────────────────────────────────────────────

/**
 * Dedupe window (ms). Two identical event+key combos fired within this
 * window collapse into a single emit. Stops Astro view transitions from
 * doubling up on page_view, stops the same CTA from firing twice on a
 * re-render after a soft navigation, stops mousedown+click pairs on the
 * same button from logging 2 events.
 */
const DEDUPE_WINDOW_MS = 1500;

/** Per-event key fingerprint. Used for dedupe + a stable id per emit. */
function fingerprint(name: string, payload: AnalyticsPayload): string {
  // Stable order-independent key (sorted JSON). Two calls with the same
  // payload + same event collapse.
  const keys = Object.keys(payload).filter(
    (k) => payload[k] !== undefined && payload[k] !== null,
  );
  keys.sort();
  const body = keys
    .map((k) => `${k}=${String(payload[k])}`)
    .join('|');
  return `${name}::${body}`;
}

interface DedupeEntry {
  ts: number;
}
const RECENT: Map<string, DedupeEntry> = (() => {
  if (typeof globalThis !== 'undefined' && typeof Map !== 'undefined') {
    return new Map<string, DedupeEntry>();
  }
  // SSR fallback — never read, but typed.
  return new Map<string, DedupeEntry>();
})();

function isDuplicate(name: string, payload: AnalyticsPayload): boolean {
  if (typeof window === 'undefined') return false;
  const now = Date.now();
  // sweep old entries (> DEDUPE_WINDOW_MS * 4 ago)
  RECENT.forEach((v, k) => {
    if (now - v.ts > DEDUPE_WINDOW_MS * 4) RECENT.delete(k);
  });
  const fp = fingerprint(name, payload);
  const prev = RECENT.get(fp);
  if (prev && now - prev.ts < DEDUPE_WINDOW_MS) return true;
  RECENT.set(fp, { ts: now });
  return false;
}

// ─────────────────────────────────────────────────────────────────────
// Consent
// ─────────────────────────────────────────────────────────────────────

/**
 * Consent state. `unknown` = user has not yet decided (banner showing
 * or first visit). `granted` = accepted tracking. `denied` = declined.
 *
 * The default is `unknown` (no tracking until the user clicks). The
 * banner in CookieConsent.astro calls `setConsent('granted' | 'denied')`
 * on click. While `unknown`, events are queued in-memory; on `granted`
 * they're flushed; on `denied` they're discarded.
 *
 * Important: we still emit `page_view` and `form_*` events even when
 * consent is `unknown` because those are SCOPED to the current session
 * and never touch third-party storage when no provider is configured.
 * When a real HubSpot/Mixpanel token lands, the provider function checks
 * `getConsent()` and decides whether to actually network out.
 */
export type ConsentState = 'unknown' | 'granted' | 'denied';

let CONSENT: ConsentState = 'unknown';
let CONSENT_LISTENERS: Array<(s: ConsentState) => void> = [];
const PENDING_QUEUE: Array<{ name: string; payload: AnalyticsPayload }> = [];

export function getConsent(): ConsentState {
  return CONSENT;
}

export function setConsent(next: ConsentState): void {
  if (CONSENT === next) return;
  CONSENT = next;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('brightai:tracking_consent', next);
    }
  } catch { /* private mode */ }
  for (const fn of CONSENT_LISTENERS) {
    try { fn(next); } catch { /* noop */ }
  }
  if (next === 'granted') flushQueue();
  if (next === 'denied') PENDING_QUEUE.length = 0;
}

export function onConsentChange(fn: (s: ConsentState) => void): () => void {
  CONSENT_LISTENERS.push(fn);
  return () => {
    CONSENT_LISTENERS = CONSENT_LISTENERS.filter((f) => f !== fn);
  };
}

/** Read consent on boot from localStorage (called by analytics.js init). */
export function hydrateConsentFromStorage(): ConsentState {
  if (typeof localStorage === 'undefined') return CONSENT;
  try {
    const stored = localStorage.getItem('brightai:tracking_consent');
    if (stored === 'granted' || stored === 'denied') {
      CONSENT = stored;
    }
  } catch { /* noop */ }
  return CONSENT;
}

function flushQueue(): void {
  while (PENDING_QUEUE.length > 0) {
    const next = PENDING_QUEUE.shift()!;
    dispatch(next.name, next.payload);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Provider registry
// ─────────────────────────────────────────────────────────────────────

/**
 * A provider is anything that turns an (event, payload) pair into a
 * network call. The function MUST be best-effort — any throw is
 * swallowed by `dispatch`. Return value is ignored.
 */
export type AnalyticsProvider = (event: string, payload: AnalyticsPayload) => void;

interface RegisteredProvider {
  name: 'gtag' | 'mixpanel' | 'hubspot' | 'bing' | 'clarity' | 'console' | string;
  fn: AnalyticsProvider;
  /** When true, the provider receives events regardless of consent
   *  (used by console debug). When false (default), the provider
   *  receives only `granted` events. */
  bypassConsent?: boolean;
}

const PROVIDERS: RegisteredProvider[] = [];

/**
 * Register a provider. Re-registering the same `name` overwrites.
 * Providers are called in registration order on every event.
 */
export function registerProvider(p: RegisteredProvider): void {
  const existing = PROVIDERS.findIndex((x) => x.name === p.name);
  if (existing >= 0) PROVIDERS[existing] = p;
  else PROVIDERS.push(p);
}

export function unregisterProvider(name: string): void {
  const idx = PROVIDERS.findIndex((x) => x.name === name);
  if (idx >= 0) PROVIDERS.splice(idx, 1);
}

export function listProviders(): string[] {
  return PROVIDERS.map((p) => p.name);
}

// ─────────────────────────────────────────────────────────────────────
// Common-property injection
// ─────────────────────────────────────────────────────────────────────

/** Properties that the runtime auto-injects. Form/CTA callers should
 *  not pass these — they're added here so every event has them. */
const AUTO_INJECTED: ReadonlyArray<keyof typeof COMMON_PROPS_HINT> = [
  'page_path',
  'page_type',
  'page_title',
  'language',
  'device',
  'viewport',
  'referrer',
  'source',
  'medium',
  'campaign',
  'content_group',
];

const SAFE_EVENT_PROPS = new Set(Object.keys(COMMON_PROPS_HINT));

function contentGroup(pageType: string): string {
  if (pageType === 'pricing' || pageType === 'contact' || pageType === 'solution' || pageType === 'solution_sector' || pageType === 'solution_city') return 'commercial';
  if (pageType === 'blog' || pageType === 'docs' || pageType === 'hub') return 'informational';
  if (pageType === 'assessment') return 'assessment';
  return pageType || 'other';
}

function readStoredAttribution(): AnalyticsPayload {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem('brightai:analytics:attribution');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

/** Recognize citation assistants by hostname only; never retain a conversation URL. */
export function classifyAiReferrer(referrer: string): string | undefined {
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    const assistants = {
      'chatgpt.com': 'chatgpt', 'chat.openai.com': 'chatgpt',
      'perplexity.ai': 'perplexity', 'gemini.google.com': 'gemini',
      'copilot.microsoft.com': 'copilot', 'claude.ai': 'claude',
    };
    for (const [domain, assistant] of Object.entries(assistants)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return assistant;
    }
  } catch { /* Missing or invalid referrer is not an AI visit. */ }
  return undefined;
}

function captureAttribution(w: { location: Location }): AnalyticsPayload {
  const params = new URLSearchParams(w.location.search);
  const stored = readStoredAttribution();
  const current = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    content: params.get('utm_content') || undefined,
    term: params.get('utm_term') || undefined,
  };
  const next = { ...stored, ...Object.fromEntries(Object.entries(current).filter(([, value]) => value)) };
  const aiSource = classifyAiReferrer(document.referrer);
  if (!next.source) next.source = aiSource || (document.referrer ? 'referral' : 'direct');
  if (!next.medium) next.medium = aiSource && !current.source && !stored.source ? 'ai_referral' : (document.referrer ? 'referral' : 'none');
  try { sessionStorage.setItem('brightai:analytics:attribution', JSON.stringify(next)); } catch { /* private mode */ }
  return next;
}

/** Compute the auto-injected set. Called per emit (cheap). */
function buildContext(overrides: AnalyticsPayload = {}): AnalyticsPayload {
  if (typeof window === 'undefined') return overrides;
  const ctx: AnalyticsPayload = { ...overrides };
  // Strip UTM from page_location if accidentally included.
  const w = window as unknown as {
    location: Location;
    document: Document;
    navigator: Navigator;
    screen: Screen;
  };
  if (!('page_path' in ctx) || ctx.page_path == null) {
    ctx.page_path = w.location.pathname;
  }
  if (!('content_group' in ctx) || ctx.content_group == null) {
    ctx.content_group = contentGroup(detectPageType());
  }
  if (!('page_title' in ctx) || ctx.page_title == null) {
    ctx.page_title = w.document.title;
  }
  if (!('language' in ctx) || ctx.language == null) {
    const lang = w.document.documentElement.lang || 'ar';
    ctx.language = lang === 'en' ? 'en-SA' : 'ar-SA';
  }
  if (!('device' in ctx) || ctx.device == null) {
    const w2 = window.innerWidth;
    ctx.device = w2 < 768 ? 'mobile' : w2 < 1024 ? 'tablet' : 'desktop';
  }
  if (!('viewport' in ctx) || ctx.viewport == null) {
    ctx.viewport = `${window.innerWidth}x${window.innerHeight}`;
  }
  if (!('referrer' in ctx) || ctx.referrer == null) {
    try {
      const ref = w.document.referrer;
      if (ref) {
        const u = new URL(ref);
        ctx.referrer = u.host; // host only — strip path/query to avoid leaking visited URLs
      }
    } catch { /* noop */ }
  }
  const attribution = captureAttribution(w);
  if (!('source' in ctx) || ctx.source == null) ctx.source = attribution.source || 'direct';
  if (!('medium' in ctx) || ctx.medium == null) ctx.medium = attribution.medium || 'none';
  if (!('campaign' in ctx) || ctx.campaign == null) ctx.campaign = attribution.campaign;
  if (!('content' in ctx) || ctx.content == null) ctx.content = attribution.content;
  if (!('term' in ctx) || ctx.term == null) ctx.term = attribution.term;
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────
// Core emit
// ─────────────────────────────────────────────────────────────────────

/**
 * Low-level emit. Always best-effort, always silent on provider failure.
 * Returns true if the event was dispatched, false if it was deduped or
 * consent-blocked (callers can ignore — the return is for tests).
 */
export function track(name: AnalyticsEventName | LeadEventName | string, payload: AnalyticsPayload = {}): boolean {
  // Durable lead creation is server-owned; browser code reports the
  // form-specific accepted event and must not duplicate `lead_created`.
  if (name === ANALYTICS_EVENTS.LEAD_CREATED) return false;
  let sanitized: AnalyticsPayload;
  try {
    sanitized = {};
    for (const [k, v] of Object.entries(payload)) {
      if (SAFE_EVENT_PROPS.has(k)) sanitized[k] = sanitizeValue(v) as never;
    }
    assertNoPii(sanitized);
  } catch (err) {
    // eslint-disable-next-line no-console
    if (typeof console !== 'undefined') console.error(err);
    return false;
  }

  if (typeof window === 'undefined') return false; // SSR no-op

  // LeadForm's bundled module and the deferred public runtime share consent
  // through this global. This prevents form events from being stranded in a
  // private queue when the public runtime is the component that received the
  // cookie-banner decision.
  try {
    const external = window.__BRIGHTAI_ANALYTICS__?.getConsent?.();
    if (external === 'granted' || external === 'denied') CONSENT = external;
    else if (CONSENT === 'unknown') hydrateConsentFromStorage();
  } catch { /* best effort */ }

  // Inject context (page_path, device, UTM, ...) — caller-provided values
  // win (they have higher specificity).
  const enriched = buildContext(sanitized);

  // Dedupe identical events fired in quick succession.
  if (isDuplicate(name, enriched)) return false;

  // Consent gate: if user declined, drop the event.
  // If still `unknown`, queue until consent decides.
  if (CONSENT === 'denied') return false;
  if (CONSENT === 'unknown') {
    PENDING_QUEUE.push({ name, payload: enriched });
    // Cap the queue to avoid memory bloat in case consent never lands.
    if (PENDING_QUEUE.length > 100) PENDING_QUEUE.shift();
    return false;
  }

  dispatch(name, enriched);
  return true;
}

function dispatch(name: string, payload: AnalyticsPayload): void {
  for (const p of PROVIDERS) {
    if (!p.bypassConsent && CONSENT !== 'granted') continue;
    try {
      p.fn(name, payload);
    } catch {
      // Provider failure is never allowed to surface. A failing Mixpanel
      // should never break the form submit it was logging.
    }
  }
  // LeadForm is bundled separately from the deferred public runtime. If its
  // module fires before the runtime registers the provider, use the already
  // loaded GA4 queue directly instead of silently losing the conversion.
  if (!PROVIDERS.some((p) => p.name === 'gtag') && typeof window !== 'undefined' && typeof window.gtag === 'function' && CONSENT === 'granted') {
    try { window.gtag('event', name, payload); } catch { /* best effort */ }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Public API surface
// ─────────────────────────────────────────────────────────────────────

/**
 * Page-type detection. Pages tag themselves with `<body data-page-type="...">`
 * and the runtime picks it up. Falls back to a path-based guess so the
 * first page_view still has a useful page_type.
 */
export function detectPageType(): string {
  if (typeof document === 'undefined') return 'other';
  const attr = document.body?.getAttribute('data-page-type');
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
    if (p.match(/\/solutions\/[a-z-]+\/[a-z-]+\/?$/i)) return 'solution_city';
    if (p.match(/\/solutions\/[a-z-]+\/?$/i)) return 'solution_sector';
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
// Runtime — installed by src/scripts/analytics.js on window
// ─────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    __BRIGHTAI_DEBUG_TRACKING__?: boolean;
    __BRIGHTAI_TRACKING_CONSENT__?: ConsentState;
    __BRIGHTAI_ANALYTICS__?: {
      track: typeof track;
      setConsent: typeof setConsent;
      getConsent: typeof getConsent;
      onConsentChange: typeof onConsentChange;
      registerProvider: typeof registerProvider;
      unregisterProvider: typeof unregisterProvider;
      listProviders: typeof listProviders;
      detectPageType: typeof detectPageType;
      events: typeof ANALYTICS_EVENTS;
      hydrateConsentFromStorage: typeof hydrateConsentFromStorage;
    };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    mixpanel?: { track: (event: string, props?: Record<string, unknown>) => void };
  }
}

/**
 * Install the public API on `window.__BRIGHTAI_ANALYTICS__`. Called by
 * the runtime module on every page load (including after view transitions).
 */
export function installRuntime(): void {
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
  // Convenience — read consent on install.
  hydrateConsentFromStorage();
}
