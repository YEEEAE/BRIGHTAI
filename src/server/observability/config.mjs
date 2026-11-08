// Monitoring configuration is resolved at request time from the runtime only.
// Nothing here is baked into the build, and nothing enables itself by default.
//
// Three independent gates must all be true before either layer can send:
//   1. AIGAS_MONITORING_APPROVAL_REF names an approved privacy/analytics decision.
//   2. AIGAS_MONITORING_ENVIRONMENT is one of the approved environment names.
//   3. The layer's own ENABLED flag is true and its credential is valid.
// In addition, each layer has its own kill switch. Neither switch reads
// AIGAS_APP_ENABLED: monitoring can be stopped without closing the portal, and
// opening the portal never turns monitoring on.
import { env } from '../kernel/env.mjs';

const APPROVED_ENVIRONMENTS = new Set(['staging', 'beta', 'production']);
const TRUE = 'true';

// A reference such as "PRIV-2026-014" or "OPS-ANALYTICS-04". It is an approval
// document identifier, not a secret, and it is never included in an event.
export function approvalReference() {
  const value = (env('AIGAS_MONITORING_APPROVAL_REF') ?? '').trim();
  return /^[A-Za-z0-9][A-Za-z0-9._/-]{2,119}$/.test(value) ? value : null;
}

export function monitoringEnvironment() {
  const value = (env('AIGAS_MONITORING_ENVIRONMENT') ?? '').trim();
  return APPROVED_ENVIRONMENTS.has(value) ? value : null;
}

// Optional release label (for example a short commit SHA). Strictly bounded so
// a misconfiguration cannot turn into free-form metadata.
export function monitoringRelease() {
  const value = (env('AIGAS_MONITORING_RELEASE') ?? '').trim();
  return /^[A-Za-z0-9._-]{1,80}$/.test(value) ? value : null;
}

// Parses a Sentry DSN without ever returning or logging the credential. HTTPS
// only: a plaintext DSN would send events over an unapproved transport.
export function parseSentryDsn(raw) {
  if (typeof raw !== 'string' || raw.length > 512) return null;
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' || !url.username) return null;
  if (!/^\/\d+$/.test(url.pathname)) return null;
  const publicKey = url.username;
  if (!/^[A-Za-z0-9]{16,64}$/.test(publicKey)) return null;
  if (url.search || url.hash) return null;
  const projectId = url.pathname.slice(1);
  return {
    endpoint: `${url.origin}/api/${projectId}/envelope/`,
    publicKey,
    projectId,
  };
}

function commonGate() {
  if (!approvalReference() || !monitoringEnvironment()) return 'APPROVAL_REQUIRED';
  return null;
}

export function sentrySettings() {
  if (env('AIGAS_SENTRY_KILL_SWITCH') === TRUE) return { enabled: false, reason: 'KILL_SWITCH' };
  const gate = commonGate();
  if (gate) return { enabled: false, reason: gate };
  if (env('AIGAS_SENTRY_ENABLED') !== TRUE) return { enabled: false, reason: 'DISABLED' };
  const dsn = parseSentryDsn(env('AIGAS_SENTRY_DSN'));
  if (!dsn) return { enabled: false, reason: 'DSN_INVALID' };
  return {
    enabled: true,
    dsn,
    environment: monitoringEnvironment(),
    release: monitoringRelease(),
  };
}

export function posthogSettings() {
  if (env('AIGAS_POSTHOG_KILL_SWITCH') === TRUE) return { enabled: false, reason: 'KILL_SWITCH' };
  const gate = commonGate();
  if (gate) return { enabled: false, reason: gate };
  if (env('AIGAS_POSTHOG_ENABLED') !== TRUE) return { enabled: false, reason: 'DISABLED' };
  const key = (env('AIGAS_POSTHOG_API_KEY') ?? '').trim();
  // PostHog project API keys are public identifiers with this prefix. The value
  // is still treated as configuration and never logged by this module.
  if (!/^phc_[A-Za-z0-9]{16,128}$/.test(key)) return { enabled: false, reason: 'KEY_INVALID' };
  const rawHost = (env('AIGAS_POSTHOG_HOST') ?? '').trim();
  let host;
  try { host = new URL(rawHost); } catch { return { enabled: false, reason: 'HOST_INVALID' }; }
  if (host.protocol !== 'https:' || host.username || host.password || host.search || host.hash) {
    return { enabled: false, reason: 'HOST_INVALID' };
  }
  return {
    enabled: true,
    apiKey: key,
    endpoint: `${host.origin.replace(/\/$/, '')}/capture/`,
    environment: monitoringEnvironment(),
    release: monitoringRelease(),
  };
}

// Named only so tests/docs can enumerate the gates without reading env values.
export const monitoringGates = Object.freeze({
  approval: 'AIGAS_MONITORING_APPROVAL_REF',
  environment: 'AIGAS_MONITORING_ENVIRONMENT',
  sentryEnabled: 'AIGAS_SENTRY_ENABLED',
  sentryDsn: 'AIGAS_SENTRY_DSN',
  sentryKillSwitch: 'AIGAS_SENTRY_KILL_SWITCH',
  posthogEnabled: 'AIGAS_POSTHOG_ENABLED',
  posthogKey: 'AIGAS_POSTHOG_API_KEY',
  posthogHost: 'AIGAS_POSTHOG_HOST',
  posthogKillSwitch: 'AIGAS_POSTHOG_KILL_SWITCH',
});
