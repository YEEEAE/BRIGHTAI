import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { resetBuildIdentity } from '../src/server/kernel/version.mjs';
import { evaluateHealth, failureReport, readyResponse } from '../src/server/kernel/health-endpoint.mjs';

// Unit coverage for the readiness HTTP contract. These tests never reach a real
// database or auth host: pg.Client is stubbed, and the network probe is disabled.
// Driver errors are synthesized with realistic secrets so a leak is caught.

const SAVED_ENV = { ...process.env };
const ORIGINAL_CLIENT = Object.fromEntries(['connect', 'query', 'end'].map(key => [key, pg.Client.prototype[key]]));
const ENV_KEYS = [
  'DATABASE_URL', 'AIGAS_DB_RUNTIME_ROLE', 'NEON_AUTH_BASE_URL', 'NEON_AUTH_JWKS_URL',
  'NEON_AUTH_URL', 'NEON_JWKS_URL', 'AIGAS_HEALTH_AUTH_PROBE', 'AIGAS_RELEASE_SHA',
  'RENDER_GIT_COMMIT', 'AIGAS_VERSION_FILE', 'RENDER_SERVICE_ID', 'RENDER_SERVICE_NAME',
];
const FORBIDDEN = [/postgres(ql)?:\/\//i, /aigas_runtime/i, /password/i, /db\.internal/i, /PGPASSWORD/i, /permission denied/i];

function prepare(t) {
  t.after(() => {
    Object.assign(pg.Client.prototype, ORIGINAL_CLIENT);
    process.env = { ...SAVED_ENV };
    resetBuildIdentity();
  });
  for (const key of ENV_KEYS) delete process.env[key];
  process.env.NODE_ENV = 'production';
  process.env.AIGAS_APP_ENABLED = 'false';
  resetBuildIdentity();
}

function configureAuth() {
  process.env.NEON_AUTH_BASE_URL = 'https://auth.example.test';
  process.env.NEON_AUTH_JWKS_URL = 'https://auth.example.test/jwks';
}

function stubPostgres({ rows = [{ kernel_schema: true }], queryError, connectError } = {}) {
  pg.Client.prototype.connect = async () => {
    if (connectError) throw connectError;
  };
  pg.Client.prototype.end = async () => {};
  pg.Client.prototype.query = async sql => {
    if (queryError) throw queryError;
    if (/SET LOCAL ROLE/.test(sql)) return { rows: [] };
    if (/pg_roles/.test(sql)) return { rows: [{ role: 'aigas_runtime', rolsuper: false, rolbypassrls: false }] };
    return { rows };
  };
}

function assertFixedEnvelope(body) {
  assert.deepEqual(Object.keys(body).sort(), ['checkedAt', 'commit', 'dependencies', 'error', 'release', 'schema', 'service', 'state', 'status', 'version']);
  assert.deepEqual(Object.keys(body.dependencies).sort(), ['auth', 'authProbe', 'database', 'portal']);
  assert.equal(body.schema, 1);
  assert.equal(Number.isNaN(Date.parse(body.checkedAt)), false);
}

function assertNoDisclosure(text) {
  for (const pattern of FORBIDDEN) assert(!pattern.test(text), `response must not match ${pattern}`);
}

test('ready dependencies answer 200 with the fixed schema', async t => {
  prepare(t);
  process.env.DATABASE_URL = 'postgresql://runtime:secret@db.internal:5432/aigas';
  configureAuth();
  stubPostgres();

  const response = await readyResponse('GET');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^application\/json/);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  const body = await response.json();
  assertFixedEnvelope(body);
  assert.equal(body.status, 'ready');
  assert.equal(body.state, 'ready');
  assert.equal(body.error, null);
  assert.deepEqual(body.dependencies, {
    database: 'READY', auth: 'READY', authProbe: 'SKIPPED', portal: 'DISABLED',
  });
  assertNoDisclosure(JSON.stringify(body));
});

test('missing configuration answers 503, never a 200', async t => {
  prepare(t);
  stubPostgres();
  const response = await readyResponse('GET');
  assert.equal(response.status, 503);
  const body = await response.json();
  assertFixedEnvelope(body);
  assert.equal(body.status, 'not_ready');
  assert.equal(body.state, 'setup_required');
  assert.equal(body.dependencies.database, 'UNCONFIGURED');
  assert.equal(body.dependencies.auth, 'UNCONFIGURED');
});

test('unreachable database answers 503 and never echoes the driver message', async t => {
  prepare(t);
  process.env.DATABASE_URL = 'postgresql://runtime:SYNTHETIC_SECRET@db.internal:5432/aigas';
  configureAuth();
  const driver = Object.assign(new Error('connect failed for postgresql://runtime:SYNTHETIC_SECRET@db.internal/aigas role=aigas_runtime'), { code: 'ECONNREFUSED' });
  stubPostgres({ connectError: driver });

  const response = await readyResponse('GET');
  assert.equal(response.status, 503);
  const body = await response.json();
  assertFixedEnvelope(body);
  assert.equal(body.state, 'unavailable');
  assert.equal(body.dependencies.database, 'UNAVAILABLE');
  assertNoDisclosure(JSON.stringify(body));
  assert(!JSON.stringify(body).includes('SYNTHETIC_SECRET'));
});

test('a 42501 privilege error is reported as blocked without naming the role', async t => {
  prepare(t);
  process.env.DATABASE_URL = 'postgresql://runtime:secret@db.internal:5432/aigas';
  process.env.AIGAS_DB_RUNTIME_ROLE = 'aigas_runtime';
  configureAuth();
  const denied = Object.assign(new Error('permission denied for table aigas_tenants while acting as aigas_runtime'), { code: '42501' });
  stubPostgres({ queryError: denied });

  const response = await readyResponse('GET');
  assert.equal(response.status, 503);
  const body = await response.json();
  assertFixedEnvelope(body);
  assert.equal(body.state, 'blocked');
  assert.equal(body.dependencies.database, 'PRIVILEGE_DENIED');
  assertNoDisclosure(JSON.stringify(body));
});

test('a missing kernel schema answers 503 blocked', async t => {
  prepare(t);
  process.env.DATABASE_URL = 'postgresql://runtime:secret@db.internal:5432/aigas';
  configureAuth();
  stubPostgres({ rows: [{ kernel_schema: false }] });

  const response = await readyResponse('GET');
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.state, 'blocked');
  assert.equal(body.dependencies.database, 'SCHEMA_MISSING');
});

test('a configured runtime role is used but never returned', async t => {
  prepare(t);
  process.env.DATABASE_URL = 'postgresql://runtime:secret@db.internal:5432/aigas';
  process.env.AIGAS_DB_RUNTIME_ROLE = 'aigas_runtime';
  configureAuth();
  stubPostgres();

  const body = await (await readyResponse('GET')).json();
  assert.equal(body.state, 'ready');
  assert(!JSON.stringify(body).includes('aigas_runtime'));
});

test('a thrown readiness check keeps the fixed schema and a bounded code', async t => {
  prepare(t);
  const response = await readyResponse('GET', {
    check: async () => { throw new Error('postgresql://runtime:secret@db.internal/aigas'); },
  });
  assert.equal(response.status, 503);
  const body = await response.json();
  assertFixedEnvelope(body);
  assert.equal(body.error, 'READINESS_CHECK_FAILED');
  assert.equal(body.state, 'unavailable');
  assert.equal(body.dependencies.database, 'UNKNOWN');
  assertNoDisclosure(JSON.stringify(body));
});

test('a malformed readiness report fails closed instead of answering 200', async t => {
  prepare(t);
  const response = await readyResponse('GET', { check: async () => ({ state: 'ready', status: 'ready' }) });
  assert.equal(response.status, 503);
  const body = await response.json();
  assertFixedEnvelope(body);
  assert.equal(body.error, 'READINESS_CONTRACT_INVALID');
});

test('200 requires both status=ready and state=ready', async t => {
  prepare(t);
  const report = {
    schema: 1, status: 'not_ready', state: 'ready', checkedAt: new Date().toISOString(),
    dependencies: { database: 'READY', auth: 'READY', authProbe: 'SKIPPED', portal: 'DISABLED' },
    release: null, service: null,
  };
  const { status } = await evaluateHealth({ check: async () => report });
  assert.equal(status, 503);
});

test('HEAD carries the JSON headers and no body', async t => {
  prepare(t);
  process.env.DATABASE_URL = 'postgresql://runtime:secret@db.internal:5432/aigas';
  configureAuth();
  stubPostgres();

  const response = await readyResponse('HEAD');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^application\/json/);
  assert.equal(await response.text(), '');
});

test('failureReport always contains every required key', () => {
  const body = failureReport('SOMETHING_FAILED');
  assertFixedEnvelope(body);
  assert.equal(body.error, 'SOMETHING_FAILED');
  assert.equal(body.status, 'not_ready');
});

test('Render health check points at the readiness route, not a redirect', () => {
  const yaml = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
  assert.match(yaml, /^\s*healthCheckPath:\s*\/readyz\/\s*$/m);
  assert(!/^\s*healthCheckPath:\s*\/(?:\s*)$/m.test(yaml), 'healthCheckPath must not be /');
});
