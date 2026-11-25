import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { request } from 'node:http';
import net from 'node:net';

// Integration coverage for the shipped Node entry point (scripts/server.mjs).
// It builds nothing and touches no database: the default environment has no
// DATABASE_URL, so the honest answer is 503 with the fixed readiness schema.
//
//   npm run build
//   node --test tests/readyz-integration.test.mjs
//
// A positive 200 case runs only when HEALTHZ_READY_DATABASE_URL points at a
// disposable localhost database that already contains public.aigas_tenants.

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ENTRY = fileURLToPath(new URL('../dist/server/entry.mjs', import.meta.url));
const BUILT = existsSync(ENTRY);
const BUILT_REASON = 'run `npm run build` first: dist/server/entry.mjs is missing';
const READY_DATABASE_URL = process.env.HEALTHZ_READY_DATABASE_URL;
const FORBIDDEN = [/postgres(ql)?:\/\//i, /aigas_runtime/i, /password/i, /PGPASSWORD/i, /<!doctype/i, /<html/i];

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(base, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await fetch(`${base}/healthz/`, { redirect: 'manual' });
      return;
    } catch {
      if (Date.now() > deadline) throw new Error(`server did not answer ${base}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

async function withServer(env, run) {
  const port = await freePort();
  const child = spawn(process.execPath, ['scripts/server.mjs'], {
    cwd: ROOT,
    env: {
      PATH: process.env.PATH,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(port),
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.resume();
  child.stderr.resume();
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitFor(base);
    return await run(base);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exited;
    }
  }
}

function assertEnvelope(body) {
  assert.deepEqual(Object.keys(body).sort(), ['checkedAt', 'commit', 'dependencies', 'error', 'release', 'schema', 'service', 'state', 'status', 'version']);
  assert.deepEqual(Object.keys(body.dependencies).sort(), ['auth', 'authProbe', 'database', 'portal']);
  assert.equal(body.schema, 1);
  assert.equal(Number.isNaN(Date.parse(body.checkedAt)), false);
}

function assertNoDisclosure(text) {
  for (const pattern of FORBIDDEN) assert(!pattern.test(text), `response must not match ${pattern}`);
}

function assertNotReady(body) {
  assert.equal(body.status, 'not_ready');
  assert.notEqual(body.state, 'ready');
}

test('GET and HEAD /readyz answer the JSON readiness contract', { skip: BUILT ? false : BUILT_REASON }, async () => {
  await withServer({ AIGAS_APP_ENABLED: 'false' }, async base => {
    for (const path of ['/healthz', '/healthz/']) {
      const get = await fetch(`${base}${path}`, { redirect: 'manual' });
      assert.equal(get.status, 200);
      assert.equal(get.headers.has('location'), false);
      assert.match(get.headers.get('content-type'), /^application\/json/);
      assert.match(get.headers.get('cache-control'), /no-store/);
      const body = await get.json();
      assert.deepEqual(Object.keys(body).sort(), ['commit', 'status', 'version']);
      assert.equal(body.status, 'ok');
      assert.match(body.version, /^\d+\.\d+\.\d+/);
      assert.match(body.commit, /^[a-f0-9]{40}$/);
      const head = await fetch(`${base}${path}`, { method: 'HEAD', redirect: 'manual' });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), '');
    }
    for (const path of ['/readyz', '/readyz/']) {
      const response = await fetch(`${base}${path}`, { redirect: 'manual' });
      assert.equal(response.status, 503, `${path} must not redirect or fall through to Astro HTML`);
      assert.match(response.headers.get('content-type') ?? '', /^application\/json/, `${path} content-type`);
      assert.match(response.headers.get('cache-control') ?? '', /no-store/);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      const text = await response.text();
      assertNoDisclosure(text);
      const body = JSON.parse(text);
      assertEnvelope(body);
      assertNotReady(body);
      assert.equal(body.dependencies.database, 'UNCONFIGURED');
      assert.equal(body.dependencies.auth, 'UNCONFIGURED');
      assert.equal(body.dependencies.authProbe, 'SKIPPED');
      assert.equal(body.dependencies.portal, 'DISABLED');
    }

    for (const path of ['/readyz', '/readyz/']) {
      const head = await fetch(`${base}${path}`, { method: 'HEAD', redirect: 'manual' });
      assert.equal(head.status, 503, `HEAD ${path}`);
      assert.match(head.headers.get('content-type') ?? '', /^application\/json/, `HEAD ${path} content-type`);
      assert.equal(await head.text(), '', `HEAD ${path} must not send a body`);
    }
  });
});

test('a ready database and configured auth answer 200', {
  skip: !BUILT ? BUILT_REASON : !READY_DATABASE_URL ? 'HEALTHZ_READY_DATABASE_URL not set' : false,
}, async () => {
  await withServer({
    AIGAS_APP_ENABLED: 'false',
    DATABASE_URL: READY_DATABASE_URL,
    NEON_AUTH_BASE_URL: 'https://auth.example.test',
    NEON_AUTH_JWKS_URL: 'https://auth.example.test/jwks',
  }, async base => {
    for (const path of ['/readyz', '/readyz/']) {
      const response = await fetch(`${base}${path}`, { redirect: 'manual' });
      assert.equal(response.status, 200, `${path} must be 200 when dependencies are ready`);
      const body = await response.json();
      assertEnvelope(body);
      assert.equal(body.status, 'ready');
      assert.equal(body.state, 'ready');
      assert.equal(body.dependencies.database, 'READY');
      assert.equal(body.dependencies.auth, 'READY');
      assert.equal(body.error, null);
    }
    const head = await fetch(`${base}/readyz`, { method: 'HEAD', redirect: 'manual' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  });
});

test('database connection failure degrades readiness only', async () => {
  const closedPort = await freePort();
  await withServer({
    DATABASE_URL: `postgresql://probe:synthetic_secret@127.0.0.1:${closedPort}/unavailable`,
    NEON_AUTH_BASE_URL: 'https://auth.example.test',
    NEON_AUTH_JWKS_URL: 'https://auth.example.test/jwks',
  }, async base => {
    const live = await fetch(`${base}/healthz/`, { redirect: 'manual' });
    const ready = await fetch(`${base}/readyz/`, { redirect: 'manual' });
    assert.equal(live.status, 200);
    assert.equal(ready.status, 503);
    const text = await ready.text();
    assertNoDisclosure(text);
    assert(!text.includes('synthetic_secret'));
    const body = JSON.parse(text);
    assert.equal(body.dependencies.database, 'UNAVAILABLE');
    const identity = await live.json();
    assert.equal(body.version, identity.version);
    assert.equal(body.commit, identity.commit);
  });
});

test('malformed requests are rejected and ordinary canonical redirects still work', async () => {
  await withServer({}, async base => {
    for (const path of ['/healthz', '/healthz/', '/readyz', '/readyz/']) {
      const badHost = await new Promise((resolve, reject) => {
        const req = request(`${base}${path}`, { headers: { Host: 'example.test:65536' } }, response => {
          response.resume();
          resolve(response.statusCode);
        });
        req.on('error', reject);
        req.end();
      });
      assert.equal(badHost, 400);
      const post = await fetch(`${base}${path}`, { method: 'POST', redirect: 'manual' });
      assert.equal(post.status, 405);
      assert.equal(post.headers.get('allow'), 'GET, HEAD');
      assert.deepEqual(await post.json(), { error: 'METHOD_NOT_ALLOWED' });
    }
    const malformedPath = await fetch(`${base}/readyz/%ZZ`, { redirect: 'manual' });
    assert.equal(malformedPath.status, 400);
    const canonical = await fetch(`${base}/terms?source=probe`, { redirect: 'manual' });
    assert.equal(canonical.status, 301);
    assert.equal(canonical.headers.get('location'), '/terms/?source=probe');
    assert.equal((await fetch(`${base}/healthz/`)).status, 200);
  });
});
