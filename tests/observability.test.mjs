// Local contract tests for the monitoring layers. No network: fetch is replaced
// before every call and the process is also run behind tests/helpers/no-egress.
// Nothing here reads a real secret; every value is synthetic.
import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { posthogSettings, sentrySettings, parseSentryDsn } from '../src/server/observability/config.mjs';
import { captureIntegritySignal, captureServerFailure, shouldCaptureFailure } from '../src/server/observability/sentry.mjs';
import { buildProductEvent, captureProductEvent, productEventNames } from '../src/server/observability/posthog.mjs';
import { safeCode, safeRoute, safeSection, sectionFor } from '../src/server/observability/redact.mjs';
import { describeUrlPolicy, safeAnalyticsReferrer, safeAnalyticsUrl } from '../src/server/observability/url-policy.mjs';

const ENV_KEYS = [
  'AIGAS_MONITORING_APPROVAL_REF',
  'AIGAS_MONITORING_ENVIRONMENT',
  'AIGAS_MONITORING_RELEASE',
  'AIGAS_SENTRY_ENABLED',
  'AIGAS_SENTRY_APPROVAL_REF',
  'AIGAS_SENTRY_DSN',
  'AIGAS_SENTRY_APPROVED_ORIGIN',
  'AIGAS_SENTRY_BROWSER_ENABLED',
  'AIGAS_SENTRY_KILL_SWITCH',
  'AIGAS_POSTHOG_ENABLED',
  'AIGAS_ANALYTICS_APPROVAL_REF',
  'AIGAS_POSTHOG_API_KEY',
  'AIGAS_POSTHOG_HOST',
  'AIGAS_POSTHOG_KILL_SWITCH',
  'AIGAS_APP_ENABLED',
];

const KEY = 'k'.repeat(32);
const HOST = 'collector.invalid';
const positive = {
  AIGAS_MONITORING_APPROVAL_REF: 'SYNTHETIC-OPS-01',
  AIGAS_MONITORING_ENVIRONMENT: 'staging',
  AIGAS_MONITORING_RELEASE: 'a'.repeat(40),
  AIGAS_SENTRY_ENABLED: 'true',
  AIGAS_SENTRY_APPROVAL_REF: 'SYNTHETIC-ERRORS-01',
  AIGAS_SENTRY_DSN: `https://${KEY}@${HOST}/42`,
  AIGAS_SENTRY_APPROVED_ORIGIN: `https://${HOST}`,
  AIGAS_SENTRY_BROWSER_ENABLED: 'true',
  AIGAS_POSTHOG_ENABLED: 'true',
  AIGAS_ANALYTICS_APPROVAL_REF: 'SYNTHETIC-ANALYTICS-01',
  AIGAS_POSTHOG_API_KEY: `phc_${'p'.repeat(32)}`,
  AIGAS_POSTHOG_HOST: `https://${HOST}`,
};

let calls = [];
const originalFetch = globalThis.fetch;

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function setEnv(extra = {}) {
  clearEnv();
  for (const [key, value] of Object.entries(extra)) process.env[key] = value;
}

function approveAll(overrides = {}) {
  setEnv({ ...positive, ...overrides });
}

function mockFetch(status = 200) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(null, { status });
  };
}

function eventBody(call) {
  return JSON.parse(String(call.init.body).split('\n').at(-1));
}

beforeEach(() => {
  clearEnv();
  mockFetch();
});

after(() => {
  globalThis.fetch = originalFetch;
  clearEnv();
});

test('default is inert: no approval means no layer and no transport', async () => {
  assert.deepEqual(sentrySettings(), { enabled: false, reason: 'APPROVAL_REQUIRED' });
  assert.deepEqual(posthogSettings(), { enabled: false, reason: 'APPROVAL_REQUIRED' });
  assert.equal(await captureServerFailure(null, { status: 503, surface: 'kernel', code: 'AUTH_UNAVAILABLE' }), false);
  assert.equal(await captureProductEvent('login_flow_result', { status_code: 200 }), false);
  assert.equal(await captureIntegritySignal({ surface: 'ledger' }), false);
  assert.equal(calls.length, 0);
  // A monitoring approval is never a portal flag, and the portal flag never enables monitoring.
  process.env.AIGAS_APP_ENABLED = 'true';
  assert.equal(sentrySettings().enabled, false);
  assert.equal(posthogSettings().enabled, false);
});

test('common gates require an approval reference, an approved environment and a full release SHA', () => {
  setEnv({ AIGAS_MONITORING_ENVIRONMENT: 'staging' });
  assert.equal(sentrySettings().reason, 'APPROVAL_REQUIRED');
  setEnv({ AIGAS_MONITORING_APPROVAL_REF: 'SYNTHETIC-OPS-01', AIGAS_MONITORING_ENVIRONMENT: 'production-preview' });
  assert.equal(sentrySettings().reason, 'APPROVAL_REQUIRED');
  setEnv({ AIGAS_MONITORING_APPROVAL_REF: 'SYNTHETIC-OPS-01', AIGAS_MONITORING_ENVIRONMENT: 'staging', AIGAS_MONITORING_RELEASE: 'abc123' });
  assert.equal(sentrySettings().reason, 'RELEASE_REQUIRED');
  setEnv({ ...positive, AIGAS_MONITORING_RELEASE: 'A'.repeat(40) });
  assert.equal(sentrySettings().reason, 'RELEASE_REQUIRED', 'release must be lowercase hex, not a label');
});

test('each layer keeps its own approval and a different environment scope', () => {
  approveAll({ AIGAS_SENTRY_APPROVAL_REF: '' });
  assert.equal(sentrySettings().reason, 'SENTRY_APPROVAL_REQUIRED');
  assert.equal(posthogSettings().enabled, true);

  approveAll({ AIGAS_ANALYTICS_APPROVAL_REF: '' });
  assert.equal(posthogSettings().reason, 'ANALYTICS_APPROVAL_REQUIRED');
  assert.equal(sentrySettings().enabled, true);

  for (const environment of ['production', 'development', '']) {
    approveAll({ AIGAS_MONITORING_ENVIRONMENT: environment });
    assert.equal(posthogSettings().reason, environment === 'production' ? 'BETA_SCOPE_REQUIRED' : 'APPROVAL_REQUIRED');
  }
});

test('Sentry DSN parsing rejects every transport shape it must not use', () => {
  assert.equal(parseSentryDsn(`http://${KEY}@${HOST}/42`), null, 'plaintext transport');
  assert.equal(parseSentryDsn(`https://${KEY}:secret@${HOST}/42`), null, 'password component');
  assert.equal(parseSentryDsn(`https://${KEY}@${HOST}:8443/42`), null, 'non-default port');
  assert.equal(parseSentryDsn(`https://${KEY}@${HOST}/42?x=1`), null, 'query');
  assert.equal(parseSentryDsn(`https://${KEY}@${HOST}/42#x`), null, 'fragment');
  assert.equal(parseSentryDsn(`https://${KEY}@${HOST}/project/42`), null, 'non numeric project path');
  assert.equal(parseSentryDsn(`https://short@${HOST}/42`), null, 'short key');
  assert.equal(parseSentryDsn(`https://${KEY}@${HOST}/42`).endpoint, `https://${HOST}/api/42/envelope/`);
});

test('a DSN that does not match the approved origin never sends', async () => {
  approveAll({ AIGAS_SENTRY_APPROVED_ORIGIN: 'https://other.invalid' });
  assert.equal(sentrySettings().reason, 'DESTINATION_NOT_APPROVED');
  assert.equal(await captureServerFailure(null, { status: 503, surface: 'kernel' }), false);
  assert.equal(calls.length, 0);
});

test('PostHog host and key are exact, and the endpoint is fixed', async () => {
  for (const host of ['http://collector.invalid', 'https://collector.invalid/path', 'https://collector.invalid:8443', 'https://user:pw@collector.invalid']) {
    approveAll({ AIGAS_POSTHOG_HOST: host });
    assert.equal(posthogSettings().reason, 'HOST_INVALID', host);
  }
  approveAll({ AIGAS_POSTHOG_API_KEY: `pc_${'p'.repeat(32)}` });
  assert.equal(posthogSettings().reason, 'KEY_INVALID');
  approveAll();
  assert.equal(posthogSettings().endpoint, `https://${HOST}/i/v0/e/`);
  assert.equal(await captureProductEvent('login_flow_result', { status_code: 200 }), true);
  assert.equal(calls[0].url, `https://${HOST}/i/v0/e/`);
});

test('Sentry event carries only allowlisted constants, never the error, URL, SQL or token', async () => {
  approveAll();
  const secret = 'SYNTHETIC_SECRET_MARKER';
  const error = new Error(secret);
  error.stack = `Error: ${secret}\n    at handler (${secret}.js:1:1)`;
  assert.equal(await captureServerFailure(error, {
    code: 'KERNEL_DB_PRIVILEGE',
    status: 503,
    surface: 'kernel',
    pathname: `/app/api/kernel/?token=${secret}&email=${secret}@example.test`,
    dependency: secret,
    operation: secret,
  }), true);

  const sent = eventBody(calls[0]);
  const serialized = JSON.stringify(sent);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes(KEY), false);
  assert.equal(sent.exception.values[0].value, 'RLS_DENIED');
  assert.equal(sent.exception.values[0].stacktrace, undefined);
  assert.equal(sent.transaction, 'app.api.kernel');
  for (const field of ['request', 'user', 'extra', 'breadcrumbs', 'message', 'contexts']) assert.equal(sent[field], undefined);
  assert.deepEqual(sent.tags, { surface: 'kernel', status_code: '503' });
  assert.equal(sent.environment, 'staging');
  assert.equal(sent.release, 'a'.repeat(40));
  assert.match(sent.event_id, /^[a-f0-9]{32}$/);
  // The public key is transport authentication in X-Sentry-Auth, not an event field.
  assert.match(calls[0].init.headers['X-Sentry-Auth'], /^Sentry sentry_version=7, sentry_client=aigas-server\/1\.0, sentry_key=/);

  // A known dependency label is kept; an unknown one is dropped, not rewritten.
  calls = [];
  assert.equal(await captureServerFailure(null, { status: 503, surface: 'kernel', code: 'AUTH_UNAVAILABLE', dependency: 'not configured' }), true);
  assert.deepEqual(eventBody(calls[0]).tags, { surface: 'kernel', status_code: '503', dependency: 'not configured' });
});

test('capture policy: 5xx always, 4xx only for the named categories', () => {
  assert.equal(shouldCaptureFailure(null, 503), true);
  assert.equal(shouldCaptureFailure('INVALID_BODY', 400), false);
  assert.equal(shouldCaptureFailure('AUTH_UNAVAILABLE', 503), true);
  assert.equal(shouldCaptureFailure('AUTH_SETUP_REQUIRED', 503), true);
  assert.equal(shouldCaptureFailure('CLIENT_AUTH_FAILURE', 401), true);
  assert.equal(shouldCaptureFailure('PROVIDER_TIMEOUT', 504), true);
  assert.equal(shouldCaptureFailure('SOMETHING_NEW', 400), false);
  assert.equal(shouldCaptureFailure(null, 999), false);
  assert.equal(safeCode('SOMETHING_NEW'), null);
  assert.equal(safeCode('INVITATION_EXPIRED'), 'INVITATION_FAILURE');
  assert.equal(safeCode('TENANT_MISMATCH'), 'RLS_DENIED');
  assert.equal(safeCode('LEDGER_INTEGRITY_INVALID'), 'LEDGER_VERIFICATION_MISMATCH');
});

test('ledger integrity is an incident even when the HTTP result is not an exception', async () => {
  approveAll();
  assert.equal(await captureIntegritySignal({ surface: 'ledger', pathname: '/app/api/ledger/verify', operation: 'verify' }), true);
  const sent = eventBody(calls[0]);
  assert.equal(sent.exception.values[0].value, 'LEDGER_VERIFICATION_MISMATCH');
  assert.equal(sent.transaction, 'app.api.ledger.verify');
  assert.equal(sent.level, 'error');
});

test('product events are an explicit allowlist and cannot be extended by a caller', async () => {
  approveAll();
  assert.deepEqual(productEventNames, ['portal_viewed', 'login_flow_result', 'product_opened', 'policy_action_result', 'quota_exhausted']);
  assert.equal(buildProductEvent('__proto__', {}), null);
  assert.equal(buildProductEvent('constructor', {}), null);
  assert.equal(buildProductEvent('toString', {}), null);
  assert.equal(buildProductEvent('unknown_event', {}), null);
  assert.equal(buildProductEvent('login_flow_result', { status_code: 200, user_id: 'synthetic' }), null);
  assert.deepEqual(buildProductEvent('portal_viewed', { section: 'public' }), { event: 'portal_viewed', properties: { section: 'public' } });
  assert.equal(buildProductEvent('portal_viewed', { section: 'marketing' }), null);
  assert.equal(buildProductEvent('product_opened', { product: '../../etc' }), null);
  assert.deepEqual(buildProductEvent('policy_action_result', { action_category: 'decision', status_code: 403 }), { event: 'policy_action_result', properties: { action_category: 'decision', status_code: 403 } });
  assert.equal(buildProductEvent('login_flow_result', []), null);
});

test('product event payload is anonymous, environment-tagged and URL-free', async () => {
  approveAll();
  assert.equal(await captureProductEvent('login_flow_result', { status_code: 409 }), true);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.event, 'login_flow_result');
  assert.equal(body.properties.$process_person_profile, false);
  assert.equal(body.properties.$geoip_disable, true);
  assert.equal(body.properties.environment, 'staging');
  assert.equal(body.properties.release, 'a'.repeat(40));
  assert.deepEqual(body.properties, {
    $process_person_profile: false,
    $geoip_disable: true,
    $lib: 'aigas-server',
    environment: 'staging',
    release: 'a'.repeat(40),
    status_code: 409,
  });
  assert.match(body.distinct_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.equal(body.api_key, `phc_${'p'.repeat(32)}`);
  const serialized = JSON.stringify(body.properties);
  for (const forbidden of ['$current_url', '$referrer', '$initial_referrer', 'url', 'referrer', 'email', 'tenant', 'user_id', 'session_id', 'chat', 'prompt']) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  // A fresh identifier per event means two events cannot be joined into a person.
  calls = [];
  await captureProductEvent('portal_viewed', { section: 'portal' });
  assert.notEqual(JSON.parse(calls[0].init.body).distinct_id, body.distinct_id);
});

test('kill switches are independent, checked at send time, and never depend on the portal flag', async () => {
  approveAll();
  process.env.AIGAS_SENTRY_KILL_SWITCH = 'true';
  assert.deepEqual(sentrySettings(), { enabled: false, reason: 'KILL_SWITCH' });
  assert.equal(await captureServerFailure(null, { status: 503, surface: 'kernel' }), false);
  assert.equal(await captureProductEvent('portal_viewed', { section: 'portal' }), true);

  delete process.env.AIGAS_SENTRY_KILL_SWITCH;
  process.env.AIGAS_POSTHOG_KILL_SWITCH = 'true';
  assert.deepEqual(posthogSettings(), { enabled: false, reason: 'KILL_SWITCH' });
  assert.equal(await captureProductEvent('portal_viewed', { section: 'portal' }), false);
  assert.equal(await captureServerFailure(null, { status: 503, surface: 'kernel' }), true);

  process.env.AIGAS_POSTHOG_KILL_SWITCH = 'false';
  process.env.AIGAS_APP_ENABLED = 'false';
  assert.equal(sentrySettings().enabled, true);
  assert.equal(posthogSettings().enabled, true);
});

test('collector failure never throws, retries or changes the caller result', async () => {
  approveAll();
  globalThis.fetch = async () => new Response(null, { status: 500 });
  assert.equal(await captureServerFailure(null, { status: 503, surface: 'kernel' }), false);
  assert.equal(await captureProductEvent('portal_viewed', { section: 'portal' }), false);

  globalThis.fetch = async () => { throw new Error('SYNTHETIC_NETWORK_FAILURE'); };
  assert.equal(await captureServerFailure(null, { status: 503, surface: 'kernel' }), false);
  assert.equal(await captureProductEvent('portal_viewed', { section: 'portal' }), false);
});

test('route and section labels are fixed and cannot carry a query, fragment or identifier', () => {
  assert.equal(safeRoute('/app/api/kernel?token=SYNTHETIC'), 'app.api.kernel');
  assert.equal(safeRoute('/app/api/ledger/verify?x=1'), 'app.api.ledger.verify');
  assert.equal(safeRoute('/app/api/ledger/OTHER'), 'app.api.ledger');
  assert.equal(safeRoute('/auth/callback?code=SYNTHETIC'), 'auth.page');
  assert.equal(safeRoute('/unknown?email=SYNTHETIC'), 'other');
  assert.equal(safeRoute(undefined), 'unknown');
  assert.equal(safeSection('auth'), 'auth');
  assert.equal(safeSection('public'), 'public');
  assert.equal(safeSection('SYNTHETIC'), null);
  assert.equal(sectionFor('/auth/sign-in?token=SYNTHETIC'), 'auth');
  assert.equal(sectionFor('/app/kernel/?returnTo=/app/firewall/'), 'kernel');
  assert.equal(sectionFor('/docs/private'), 'public');
});

test('URL/referrer policy drops a free query and an unknown referrer instead of forwarding it', () => {
  const policy = describeUrlPolicy();
  assert.deepEqual(policy.pageQueryAllowlist, ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']);
  assert.deepEqual(policy.referrerHostAllowlist, ['brightai.live', 'www.brightai.live']);
  assert.equal(policy.fragment, 'dropped');

  assert.equal(safeAnalyticsUrl('https://brightai.live/docs/?q=secret&from=email#token'), 'https://brightai.live/docs/');
  assert.equal(safeAnalyticsUrl('https://brightai.live/pricing/?utm_source=newsletter&utm_medium=email&email=a@b.test'), 'https://brightai.live/pricing/?utm_source=newsletter&utm_medium=email');
  assert.equal(safeAnalyticsUrl('https://brightai.live/invite/?token=SYNTHETIC'), 'https://brightai.live/invite/');
  assert.equal(safeAnalyticsUrl('https://brightai.live/?utm_source=' + encodeURIComponent('a b'), 'https://brightai.live/'), 'https://brightai.live/');
  assert.equal(safeAnalyticsUrl('javascript:alert(1)', 'https://brightai.live/'), null);
  assert.equal(safeAnalyticsUrl('https://user:pw@brightai.live/', 'https://brightai.live/'), null);

  assert.equal(safeAnalyticsReferrer('https://brightai.live/docs/?q=secret', 'https://brightai.live'), 'https://brightai.live/docs/');
  assert.equal(safeAnalyticsReferrer('https://www.google.com/search?q=SYNTHETIC', 'https://brightai.live'), null);
  assert.equal(safeAnalyticsReferrer('https://evil-brightai.live/', 'https://brightai.live'), null);
  assert.equal(safeAnalyticsReferrer('', 'https://brightai.live'), null);
  assert.equal(safeAnalyticsReferrer('https://app.brightai.live/x?y=1', 'https://app.brightai.live'), 'https://app.brightai.live/x');
});

test('the shipped GA4 snippet obeys the same allowlist as the policy module', () => {
  const layout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const inline = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline, 'GA4 inline snippet must exist');

  function analyticsPage(href, referrer) {
    const url = new URL(href);
    const window = {
      dataLayer: [],
      location: { href, origin: url.origin, pathname: url.pathname },
    };
    vm.runInNewContext(inline, { window, document: { referrer }, URL, Date, console });
    const call = window.dataLayer.find((entry) => entry[0] === 'config');
    assert.ok(call, 'snippet must configure GA4');
    return JSON.parse(JSON.stringify(call[2]));
  }

  const leaked = analyticsPage('https://brightai.live/docs/?q=SYNTHETIC&token=SYNTHETIC&utm_source=newsletter#fragment', 'https://www.google.com/search?q=SYNTHETIC');
  assert.deepEqual(leaked, { page_location: 'https://brightai.live/docs/?utm_source=newsletter' });
  assert.equal(JSON.stringify(leaked).includes('SYNTHETIC'), false);

  assert.deepEqual(analyticsPage('https://brightai.live/pricing/?utm_medium=email&email=a@b.test', ''), { page_location: 'https://brightai.live/pricing/?utm_medium=email' });
  assert.deepEqual(analyticsPage('https://brightai.live/auth/?token=SYNTHETIC#x', 'https://brightai.live/docs/?q=SYNTHETIC'), {
    page_location: 'https://brightai.live/auth/',
    page_referrer: 'https://brightai.live/docs/',
  });
  assert.deepEqual(analyticsPage('https://brightai.live/', 'https://evil-brightai.live/?token=SYNTHETIC'), { page_location: 'https://brightai.live/' });
});
