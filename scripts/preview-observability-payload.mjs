// Offline payload preview for the P13 approval gate.
//
// It answers one question only: "what exactly would leave the process if the
// owner authorised these settings?" It never reads a real secret, never reads a
// .env file, never sends a request and never mutates process state outside its
// own run. Every value below is synthetic.
//
// Usage: node scripts/preview-observability-payload.mjs [--out <path>]
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describeSentryEventForTest } from '../src/server/observability/sentry.mjs';
import { buildProductEvent } from '../src/server/observability/posthog.mjs';
import { monitoringGates } from '../src/server/observability/config.mjs';
import { describeUrlPolicy, safeAnalyticsPath, safeAnalyticsReferrer, safeAnalyticsUrl } from '../src/server/observability/url-policy.mjs';

const MONITORING_KEYS = Object.keys(process.env).filter((key) => /^AIGAS_(MONITORING|SENTRY|POSTHOG|ANALYTICS)_/.test(key));
for (const key of MONITORING_KEYS) delete process.env[key];

const sha = (() => {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return null; }
})();

// Synthetic configuration. The DSN and project key are deliberately invalid
// real-world values and are never used for transport here.
const SYNTHETIC = {
  AIGAS_MONITORING_APPROVAL_REF: 'SYNTHETIC-OPS-PREVIEW',
  AIGAS_MONITORING_ENVIRONMENT: 'staging',
  AIGAS_MONITORING_RELEASE: sha && /^[a-f0-9]{40}$/.test(sha) ? sha : 'a'.repeat(40),
  AIGAS_SENTRY_ENABLED: 'true',
  AIGAS_SENTRY_APPROVAL_REF: 'SYNTHETIC-ERRORS-PREVIEW',
  AIGAS_SENTRY_DSN: `https://${'k'.repeat(32)}@collector.invalid/42`,
  AIGAS_SENTRY_APPROVED_ORIGIN: 'https://collector.invalid',
  AIGAS_SENTRY_BROWSER_ENABLED: 'true',
  AIGAS_POSTHOG_ENABLED: 'true',
  AIGAS_ANALYTICS_APPROVAL_REF: 'SYNTHETIC-ANALYTICS-PREVIEW',
  AIGAS_POSTHOG_API_KEY: `phc_${'p'.repeat(32)}`,
  AIGAS_POSTHOG_HOST: 'https://collector.invalid',
};

function withSyntheticEnv(run) {
  const previous = new Map();
  for (const [key, value] of Object.entries(SYNTHETIC)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }
  try { return run(); } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

const sentryCases = withSyntheticEnv(() => ([
  ['auth', 'server', 'AUTH_UNAVAILABLE', 503, '/app/?token=SYNTHETIC_MARKER'],
  ['db', 'kernel', 'KERNEL_DB_PRIVILEGE', 503, '/app/api/kernel/?email=SYNTHETIC_MARKER'],
  ['ai', 'secure-chat', 'PROVIDER_TIMEOUT', 504, '/app/api/secure-chat/'],
  ['ledger', 'ledger', 'LEDGER_VERIFICATION_MISMATCH', 500, '/app/api/ledger/verify'],
  ['product', 'risk-engine', null, 503, '/app/api/risk-engine/'],
  ['browser-auth', 'browser', 'CLIENT_AUTH_FAILURE', 401, '/auth/'],
]).map(([label, surface, code, status, pathname]) => ({
  label,
  envelope_event: describeSentryEventForTest({ code, status, surface, pathname, dependency: 'temporarily unavailable', operation: 'POST' }),
})));

const posthogEvents = withSyntheticEnv(() => ([
  ['portal_viewed', { section: 'portal' }],
  ['product_opened', { product: 'kernel' }],
  ['login_flow_result', { status_code: 200 }],
  ['login_flow_result', { status_code: 409 }],
  ['policy_action_result', { action_category: 'decision', status_code: 200 }],
  ['quota_exhausted', { product: 'secure-chat' }],
]).map(([name, properties]) => ({ input: { name, properties }, payload: buildProductEvent(name, properties) })));

const relayBodies = [
  { kind: 'login_flow_result', section: 'auth', status_code: 401 },
  { kind: 'client_error', section: 'kernel' },
  { kind: 'client_rejection', section: 'portal' },
];

// Negative cases: each one must NOT produce a payload.
const negativeCases = {
  unknown_product_event: buildProductEvent('signup_completed', { section: 'auth' }),
  prototype_event_name: buildProductEvent('__proto__', {}),
  extra_property: buildProductEvent('login_flow_result', { status_code: 200, user_id: 'SYNTHETIC' }),
  unknown_section_value: buildProductEvent('portal_viewed', { section: 'SYNTHETIC' }),
  raw_query_in_page_url: safeAnalyticsUrl('https://brightai.live/docs/?q=SYNTHETIC&utm_source=newsletter#token=SYNTHETIC'),
  private_path_in_page_url: safeAnalyticsUrl('https://brightai.live/auth/callback/SYNTHETIC_CODE?code=SYNTHETIC'),
  private_path_in_referrer: safeAnalyticsReferrer('https://brightai.live/app/kernel/SYNTHETIC_ID', 'https://brightai.live'),
  unknown_referrer_host: safeAnalyticsReferrer('https://evil-brightai.live/?token=SYNTHETIC', 'https://brightai.live'),
  encoded_public_path: safeAnalyticsPath('/docs/%2e%2e%2fSYNTHETIC'),
  unknown_code_falls_back_to_generic: describeSentryEventForTest({ code: 'SOMETHING_NEW', status: 503, surface: 'server', pathname: '/app/' })?.exception?.values?.[0]?.value,
};

const inventory = {
  sentry_organization: '659ec3bf0cec',
  sentry_region: 'https://us.sentry.io',
  sentry_projects: 0,
  posthog_organization: '01a1bd00-d4be-0000-c380-301b9d020f7c',
  posthog_projects: 1,
  posthog_project_id: 720936,
  posthog_project_limit: 1,
  posthog_plan: 'free',
  posthog_events_usage: 0,
  posthog_events_limit: 1000000,
  note: 'Read through MCP on 2026-11-10. No destination is approved; no project, key, setting or event was changed.',
};

const preview = {
  generated_at_utc: new Date().toISOString(),
  sha,
  scope: 'P13 payload preview — no transport, no external request, no secret read',
  gates: monitoringGates,
  synthetic_environment: SYNTHETIC.AIGAS_MONITORING_ENVIRONMENT,
  synthetic_release: SYNTHETIC.AIGAS_MONITORING_RELEASE,
  sentry_transport: {
    endpoint_shape: 'https://<approved-origin>/api/<project-id>/envelope/',
    public_key_placement: 'X-Sentry-Auth only; never an event field',
    timeout_ms: 2000,
    retries: 0,
    redirects: 'rejected',
  },
  posthog_transport: {
    endpoint_shape: 'https://<approved-origin>/i/v0/e/',
    api_key_placement: 'request body api_key; redacted in this preview',
    anonymous: { $process_person_profile: false, $geoip_disable: true },
    distinct_id: 'fresh random UUID per event',
    timeout_ms: 2000,
    retries: 0,
    redirects: 'rejected',
  },
  url_policy: describeUrlPolicy(),
  ga4_page_contract: {
    page_location: 'origin + sanitized pathname + allowlisted utm_* keys',
    page_referrer: 'always present; allowlisted origin+path or explicit empty string',
    private_paths: '/auth/*, /app/* and /api/* collapse to the section root',
    note: 'An omitted page_referrer lets gtag fall back to document.referrer; the snippet now sends an explicit empty value.',
  },
  sentry_payloads: sentryCases,
  posthog_payloads: posthogEvents,
  relay_bodies: relayBodies,
  negative_cases: negativeCases,
  inventory,
  still_requires_owner_authorization: [
    'choose or upgrade a destination project for each layer',
    'approve the payload in this file',
    'provide the named secrets through the approved secret store',
    'authorize one synthetic send per layer to prove ingestion',
  ],
};

// The preview must never contain a credential, even a synthetic one.
const serialized = JSON.stringify(preview, null, 2);
for (const forbidden of ['phc_', 'k'.repeat(32)]) {
  if (serialized.includes(forbidden)) throw new Error(`Preview leaked ${forbidden}`);
}

const outIndex = process.argv.indexOf('--out');
const out = resolve(outIndex > 0 && process.argv[outIndex + 1] ? process.argv[outIndex + 1] : 'Audit/p13-observability-2026-11-10/payload-preview.json');
await mkdir(dirname(out), { recursive: true });
await writeFile(out, `${serialized}\n`);
console.log(`payload preview written: ${out}`);
console.log(`sha: ${preview.sha}`);
console.log(`sentry payloads: ${preview.sentry_payloads.filter((item) => item.envelope_event).length}/${preview.sentry_payloads.length}`);
console.log(`posthog payloads: ${preview.posthog_payloads.filter((item) => item.payload).length}/${preview.posthog_payloads.length}`);
const rejected = Object.values(negativeCases).filter((value) => value === null).length;
console.log(`negative cases: ${Object.keys(negativeCases).length} documented — ${rejected} returned null, ${Object.keys(negativeCases).length - rejected} sanitized/generic by design`);
