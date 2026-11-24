import { readiness } from './readiness.mjs';
import { buildIdentity } from './version.mjs';
import { isPortalEnabled } from './env.mjs';

// HTTP contract for the platform readiness endpoint.
//
// The body is deliberately stable across success and failure so a checker, a
// dashboard or a post-deploy smoke test can read the same keys every time:
//
//   { schema, status, state, checkedAt, dependencies, release, service, error }
//
// `release` and `service` are additive identity fields; they are never
// configuration values. A failure path must not drop keys, because a missing
// `dependencies` object is indistinguishable from a healthy empty answer to a
// naive consumer.
export const HEALTH_SCHEMA = 1;

const STATES = new Set(['ready', 'setup_required', 'blocked', 'unavailable']);
const STATUSES = new Set(['ready', 'not_ready']);
const DEPENDENCY_KEYS = ['database', 'auth', 'authProbe', 'portal'];
const DEPENDENCY_VALUE = /^[A-Z][A-Z_]{0,31}$/;
const ERROR_CODE = /^[A-Z][A-Z_]{0,63}$/;

export const HEALTH_HEADERS = Object.freeze({
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
});

function identity() {
  try {
    return buildIdentity();
  } catch {
    return null;
  }
}

function safeErrorCode(value, fallback) {
  return typeof value === 'string' && ERROR_CODE.test(value) ? value : fallback;
}

// A failed check still has to answer with the fixed schema. The thrown error is
// never serialized: a driver message can contain a host, a role, a password or
// a fragment of the connection string.
export function failureReport(errorCode = 'READINESS_CHECK_FAILED') {
  const current = identity();
  return {
    schema: HEALTH_SCHEMA,
    status: 'not_ready',
    state: 'unavailable',
    checkedAt: new Date().toISOString(),
    dependencies: {
      database: 'UNKNOWN',
      auth: 'UNKNOWN',
      authProbe: 'UNKNOWN',
      portal: isPortalEnabled() ? 'ENABLED' : 'DISABLED',
    },
    release: current
      ? { commit: current.commit, consistent: current.consistent, artifact: current.artifact, deploy: current.deploy }
      : null,
    service: current?.service ?? null,
    error: safeErrorCode(errorCode, 'READINESS_CHECK_FAILED'),
  };
}

// Readiness is trusted, but its shape is still validated: a refactor that drops
// `dependencies` must fail closed as 503, not answer a malformed 200.
function normalize(report) {
  if (!report || typeof report !== 'object') return null;
  if (!STATUSES.has(report.status) || !STATES.has(report.state)) return null;
  if (typeof report.checkedAt !== 'string' || Number.isNaN(Date.parse(report.checkedAt))) return null;
  if (!report.dependencies || typeof report.dependencies !== 'object') return null;
  const dependencies = {};
  for (const key of DEPENDENCY_KEYS) {
    const value = report.dependencies[key];
    if (typeof value !== 'string' || !DEPENDENCY_VALUE.test(value)) return null;
    dependencies[key] = value;
  }
  return {
    schema: HEALTH_SCHEMA,
    status: report.status,
    state: report.state,
    checkedAt: report.checkedAt,
    dependencies,
    release: report.release && typeof report.release === 'object' ? report.release : null,
    service: report.service && typeof report.service === 'object' ? report.service : null,
    error: null,
  };
}

// 200 only when the report itself says both layers are ready. Everything else —
// a dependency failure, a blocked release, or an invalid report — is 503.
export async function evaluateHealth(options = {}) {
  const check = options.check ?? readiness;
  try {
    const report = normalize(await check());
    if (!report) return { status: 503, body: failureReport('READINESS_CONTRACT_INVALID') };
    const ready = report.status === 'ready' && report.state === 'ready';
    return { status: ready ? 200 : 503, body: report };
  } catch {
    return { status: 503, body: failureReport('READINESS_CHECK_FAILED') };
  }
}

export async function healthResponse(method = 'GET', options = {}) {
  const { status, body } = await evaluateHealth(options);
  const headers = new Headers(HEALTH_HEADERS);
  // HEAD must expose the same media type as GET. The body stays empty, but a
  // checker that only inspects headers still sees a JSON contract, not HTML.
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(method === 'HEAD' ? null : JSON.stringify(body), { status, headers });
}
