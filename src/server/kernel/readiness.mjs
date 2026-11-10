import { env, isPortalEnabled } from './env.mjs';
import { authConfig } from './auth.mjs';
import { probeDatabase } from './db.mjs';
import { buildIdentity } from './version.mjs';

// Readiness contract for the Node SSR service.
//
// It answers three questions without exposing configuration:
//   1. Is the process serving the artifact built from the expected commit?
//   2. Can it reach the database with the schema the Kernel expects?
//   3. Is the auth verifier configured (and, when explicitly enabled, reachable)?
//
// Status is 200 only when every required dependency is ready; a closed portal
// (AIGAS_APP_ENABLED=false) is a deliberate product state and does not fail
// readiness. OP04 response hardening/caching for public responses stays with
// P18; this route only sets its own private no-store headers.
const AUTH_PROBE_TTL_MS = 15_000;
const AUTH_PROBE_TIMEOUT_MS = 2_000;

let authProbe = { at: 0, state: 'UNKNOWN' };

// An active JWKS probe is opt-in: it is the only readiness check that leaves the
// service, so it is enabled per environment (AIGAS_HEALTH_AUTH_PROBE=true) and
// cached to keep a platform checker from calling the auth host every few seconds.
async function authState(config) {
  if (!config) return { state: 'UNCONFIGURED', probe: 'SKIPPED' };
  if (env('AIGAS_HEALTH_AUTH_PROBE') !== 'true') return { state: 'READY', probe: 'SKIPPED' };
  const now = Date.now();
  if (authProbe.at && now - authProbe.at < AUTH_PROBE_TTL_MS) return { state: authProbe.state, probe: 'CACHED' };
  let state = 'UNREACHABLE';
  try {
    const response = await fetch(config.jwks, {
      headers: { accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(AUTH_PROBE_TIMEOUT_MS),
    });
    state = response.ok ? 'READY' : 'UNREACHABLE';
    await response.body?.cancel?.();
  } catch {
    state = 'UNREACHABLE';
  }
  authProbe = { at: Date.now(), state };
  return { state, probe: 'ACTIVE' };
}

// Setup gaps, a broken schema and an unreachable dependency are different
// operating conditions with different owners, so they are reported separately.
function stateOf(database, auth) {
  if (database === 'UNCONFIGURED' || auth === 'UNCONFIGURED') return 'setup_required';
  if (database === 'SCHEMA_MISSING' || database === 'PRIVILEGE_DENIED') return 'blocked';
  if (database === 'UNAVAILABLE' || auth === 'UNREACHABLE') return 'unavailable';
  return 'ready';
}

export async function readiness() {
  const identity = buildIdentity();
  const config = authConfig();
  const [database, auth] = await Promise.all([probeDatabase(), authState(config)]);
  const state = stateOf(database.state, auth.state);
  return {
    schema: 1,
    status: state === 'ready' ? 'ready' : 'not_ready',
    state,
    checkedAt: new Date().toISOString(),
    dependencies: {
      database: database.state,
      auth: auth.state,
      authProbe: auth.probe,
      portal: isPortalEnabled() ? 'ENABLED' : 'DISABLED',
    },
    release: {
      commit: identity.commit,
      consistent: identity.consistent,
      artifact: identity.artifact,
      deploy: identity.deploy,
    },
    service: identity.service,
  };
}
