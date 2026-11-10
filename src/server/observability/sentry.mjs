// Minimal, dependency-free Sentry transport for server-side error tracking.
//
// This is not an SDK and does not enable default integrations. It builds a
// single, fully specified event from an allowlist and posts one Sentry
// envelope. There is no breadcrumb collection, no request capture, no user
// context, no session replay, no auto-instrumentation, and no PII field.
//
// The layer stays inert unless config.mjs reports all approval gates satisfied.
import { randomUUID } from 'node:crypto';
import { sentrySettings } from './config.mjs';
import { safeCode, safeRoute, safeStatus } from './redact.mjs';

const CLIENT = 'aigas-server/1.0';
const TIMEOUT_MS = 2000;
const CAPTURE_CODES = new Set(['AUTH_UNAVAILABLE', 'AUTH_SETUP_REQUIRED', 'INVITATION_FAILURE', 'PROVIDER_TIMEOUT', 'LEDGER_VERIFICATION_MISMATCH', 'RLS_DENIED', 'SCHEMA_MISSING', 'CLIENT_ERROR', 'CLIENT_REJECTION', 'CLIENT_AUTH_FAILURE']);

// A 5xx is always a server failure. 4xx is not sent by default: expired tokens
// and ordinary validation noise would bury real incidents. Auth setup, invite
// failures, RLS/privilege denials, schema drift, ledger integrity, and provider
// timeouts are the explicit exceptions.
export function shouldCaptureFailure(code, status) {
  const normalizedStatus = safeStatus(status);
  if (normalizedStatus && normalizedStatus >= 500) return true;
  const normalizedCode = safeCode(code);
  if (!normalizedCode) return false;
  return CAPTURE_CODES.has(normalizedCode);
}

function normalizeSurface(value) {
  return ['kernel', 'firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat', 'browser', 'server'].includes(value) ? value : 'server';
}

function buildEvent(settings, { code, status, surface, pathname, dependency, operation }) {
  const eventCode = safeCode(code) ?? 'UNEXPECTED_FAILURE';
  const route = safeRoute(pathname);
  const statusCode = safeStatus(status);
  const safeSurface = normalizeSurface(surface);
  const safeOperation = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(operation) ? operation : null;
  const safeDependency = ['not configured', 'access denied', 'temporarily unavailable', 'available'].includes(dependency) ? dependency : null;

  const tags = { surface: safeSurface };
  if (statusCode) tags.status_code = String(statusCode);
  if (safeDependency) tags.dependency = safeDependency;
  if (safeOperation) tags.operation = safeOperation;

  const event = {
    event_id: randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: safeSurface === 'browser' ? 'javascript' : 'node',
    level: statusCode && statusCode >= 500 ? 'error' : 'warning',
    logger: 'aigas.server',
    environment: settings.environment,
    transaction: route,
    fingerprint: ['aigas', safeSurface, eventCode],
    tags,
    // Only a stable machine code. Never error.message, SQL text, a URL, a
    // header, a cookie, a token, a provider body, or a chat message.
    exception: {
      values: [{
        type: `Aigas${safeSurface.replace(/(^|-)([a-z])/g, (_m, _d, c) => c.toUpperCase())}Error`,
        value: eventCode,
      }],
    },
  };
  if (settings.release) event.release = settings.release;
  return event;
}

async function sendEvent(settings, event) {
  const envelope = [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event', content_type: 'application/json' }),
    JSON.stringify(event),
  ].join('\n');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(settings.dsn.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=${CLIENT}, sentry_key=${settings.dsn.publicKey}`,
      },
      body: envelope,
      signal: controller.signal,
      redirect: 'error',
    });
    return response.ok;
  } catch {
    // Monitoring must never break the request it observes.
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Fire-and-forget by design. Callers use `void captureServerFailure(...)` so a
// slow or unreachable collector cannot delay an HTTP response.
export async function captureServerFailure(error, context = {}) {
  const settings = sentrySettings();
  if (!settings.enabled) return false;
  const code = safeCode(context.code);
  const status = safeStatus(context.status);
  if (!shouldCaptureFailure(code, status)) return false;
  const event = buildEvent(settings, {
    code,
    status,
    surface: context.surface,
    pathname: context.pathname,
    dependency: context.dependency,
    operation: context.operation,
    // Do not inspect error properties, including stack/file names, which can
    // contain customer text or connection credentials.
  });
  return sendEvent(settings, event);
}

// A ledger mismatch is evidence, not an exception: it can be returned with a
// 200 response while still being an integrity incident.
export async function captureIntegritySignal(context = {}) {
  const settings = sentrySettings();
  if (!settings.enabled) return false;
  const event = buildEvent(settings, {
    code: 'LEDGER_VERIFICATION_MISMATCH',
    status: 500,
    surface: context.surface ?? 'ledger',
    pathname: context.pathname,
    dependency: null,
    operation: context.operation,
  });
  return sendEvent(settings, event);
}

// Exposed for a future authorized test that asserts the payload shape without
// sending anything. It contains no process environment and no error object.
export function describeSentryEventForTest(input) {
  const settings = sentrySettings();
  if (!settings.enabled) return null;
  return buildEvent(settings, input);
}
