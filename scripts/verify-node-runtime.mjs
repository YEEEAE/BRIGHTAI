import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { request as httpRequest } from 'node:http';

// Repeatable local proof for the Node SSR runtime (P04 / OP01-OP03, OP05
// readiness). It starts the real `node scripts/server.mjs` entry point in
// isolated modes, so evidence describes the shipped server, not a stub.
//
//   npm run build
//   node scripts/verify-node-runtime.mjs
//
// Optional positive readiness case (local Postgres with aigas_tenants):
//   P04_READY_DATABASE_URL=postgresql://user@127.0.0.1:5432/aigas_p04 node scripts/verify-node-runtime.mjs
//
// No external network and no production secret is used: the only connections
// are 127.0.0.1 and a refused 127.0.0.1:1 used as a negative case.
const ROOT = new URL('../', import.meta.url);
const ENTRY = new URL('dist/server/entry.mjs', ROOT);
assert(existsSync(ENTRY), 'Run `npm run build` first: dist/server/entry.mjs is missing');
assert(existsSync(new URL('dist/server/version.json', ROOT)), 'Build artifact dist/server/version.json is missing');

const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
const SECRET_MARKER = 'p04-local-marker-never-echo';
const results = [];
const check = (name, fn) => fn().then(() => results.push({ name, status: 'PASS', at: new Date().toISOString() }), error => { results.push({ name, status: 'FAIL', at: new Date().toISOString(), detail: error.message }); });

async function waitFor(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try { await fetch(url, { redirect: 'manual' }); return; } catch {
      if (Date.now() > deadline) throw new Error(`server did not answer ${url}`);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
}

// fetch() refuses to set a Host header, so the CVE-2026-102984 cases speak raw HTTP.
async function requestWithHost(base, host, path = '/') {
  const { port } = new URL(base);
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: '127.0.0.1', port, path, method: 'GET', headers: { host }, setHost: false },
      response => {
        let body = '';
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body, location: response.headers.location ?? '' }));
      },
    );
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('host probe timed out')));
    req.end();
  });
}

// Starts the production entry point with a fixed environment; every child is
// killed before the next mode so a leaked process cannot answer a later check.
async function withServer(port, env, run) {
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
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitFor(`${base}/`);
    return await run(base);
  } finally {
    // A bind/startup failure may already have exited; do not wait forever for
    // an exit event that was emitted before cleanup began.
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exited;
    }
    assert(!/postgres(ql)?:\/\//.test(output), 'server output must never contain a connection string');
  }
}

// ---------------------------------------------------------------- mode A
// Portal closed, no database and no auth configuration: the shipped default for
// a service where AIGAS_APP_ENABLED is not yet authorized.
await withServer(4397, { AIGAS_APP_ENABLED: 'false' }, async base => {
  const health = await fetch(`${base}/healthz/`, { redirect: 'manual' });
  const body = await health.json();
  await check('A1 readiness is 503 without dependencies', async () => {
    assert.equal(health.status, 503);
    assert.equal(body.state, 'setup_required');
    assert.equal(body.dependencies.database, 'UNCONFIGURED');
    assert.equal(body.dependencies.auth, 'UNCONFIGURED');
    assert.equal(body.dependencies.portal, 'DISABLED');
  });
  await check('A2 build artifact identity is read back', async () => {
    assert.equal(body.release.artifact.present, true);
    assert.equal(body.release.commit, HEAD, 'artifact commit must equal the checked-out SHA');
    assert.match(body.release.artifact.digest, /^sha256:[a-f0-9]{64}$/);
    assert.match(body.release.artifact.packageLock, /^sha256:[a-f0-9]{64}$/);
    assert.equal(body.release.consistent, null, 'no platform commit to compare against locally');
  });
  await check('A3 readiness response is private and uncacheable', async () => {
    const header = name => health.headers.get(name);
    assert.match(header('cache-control') ?? '', /no-store/);
    assert.equal(header('x-robots-tag'), 'noindex, nofollow');
    assert.equal(header('cdn-cache-control'), 'no-store');
  });
  await check('A4 HEAD readiness answers without a body', async () => {
    const head = await fetch(`${base}/healthz/`, { method: 'HEAD', redirect: 'manual' });
    assert.equal(head.status, 503);
    assert.equal((await head.text()).length, 0);
  });
  await check('A5 public homepage is still server-rendered', async () => {
    const page = await fetch(`${base}/`);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type') ?? '', /text\/html/);
    assert.match(html, /<html lang="ar-SA" dir="rtl">/);
  });
  await check('A6 closed portal answers 503 HTML with private headers', async () => {
    const page = await fetch(`${base}/app/`);
    const html = await page.text();
    assert.equal(page.status, 503);
    assert.match(html, /APP_UNAVAILABLE/);
    assert.match(page.headers.get('cache-control') ?? '', /private, no-store/);
    assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
  });
  await check('A7 closed portal API answers JSON, not HTML', async () => {
    const api = await fetch(`${base}/app/api/kernel/health/`);
    const json = await api.json();
    assert.equal(api.status, 503);
    assert.match(api.headers.get('content-type') ?? '', /application\/json/);
    assert.equal(json.code, 'APP_UNAVAILABLE');
    assert.equal(json.rows, undefined);
  });
  await check('A8 encoded alias cannot bypass the gate', async () => {
    const page = await fetch(`${base}/%61pp/`);
    assert.equal(page.status, 503);
    const api = await fetch(`${base}/%61pp/api/kernel/health/`);
    assert.equal(api.status, 503);
    assert.equal((await api.json()).code, 'APP_UNAVAILABLE');
    const dotted = await fetch(`${base}/app/./api/kernel/health/`);
    assert.equal(dotted.status, 503, '/app/./ must normalise to the gated path');
  });
  await check('A12 GET/HEAD private responses bypass caches and vary by credentials', async () => {
    for (const path of ['/app/', '/app/api/kernel/health/', '/auth/sign-up/', '/auth/accept-invitation/']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await fetch(`${base}${path}`, { method, redirect: 'manual' });
        assert.equal(response.status, path.startsWith('/app/') ? 503 : 200, `${method} ${path}`);
        assert.match(response.headers.get('cache-control') ?? '', /private, no-store/);
        for (const header of ['cdn-cache-control', 'cloudflare-cdn-cache-control']) {
          assert.equal(response.headers.get(header), 'no-store', `${method} ${path}: ${header}`);
        }
        const vary = (response.headers.get('vary') ?? '').toLowerCase().split(',').map(value => value.trim());
        assert(vary.includes('authorization') && vary.includes('cookie'), `${method} ${path}: Vary`);
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
        if (method === 'HEAD') assert.equal(await response.text(), '');
      }
    }
  });
  await check('A13 GET/HEAD public redirects retain queries and missing routes return 404', async () => {
    for (const method of ['GET', 'HEAD']) {
      const redirect = await fetch(`${base}/terms?source=t01`, { method, redirect: 'manual' });
      assert.equal(redirect.status, 301);
      assert.equal(redirect.headers.get('location'), '/terms/?source=t01');
      const missing = await fetch(`${base}/t01-nonexistent-route/`, { method, redirect: 'manual' });
      assert.equal(missing.status, 404);
      if (method === 'HEAD') assert.equal(await missing.text(), '');
    }
  });
  await check('A9 no configuration value is echoed back', async () => {
    const text = JSON.stringify(body);
    assert(!text.includes(SECRET_MARKER));
    assert(!/postgres(ql)?:\/\//.test(text));
    assert(!/eyJ[A-Za-z0-9_-]{10,}/.test(text), 'no token-like value may be returned');
  });
  await check('A10 malformed Host is rejected before any route renders', async () => {
    // CVE-2026-102984 / GHSA-qh8j-hqjv-7m4x: the adapter throws `Invalid URL`
    // while building the request, which used to answer 500 on every SSR route.
    for (const host of ['example.com:65536', 'example.com:8080:8080', '[::1]:abc', '']) {
      const response = await requestWithHost(base, host, '/healthz/');
      assert.equal(response.status, 400, `${JSON.stringify(host)} must be rejected, not rendered`);
      assert(!/Invalid URL/.test(response.body), 'no adapter error text is returned');
    }
    const normal = await requestWithHost(base, `127.0.0.1:${new URL(base).port}`, '/healthz/');
    assert.equal(normal.status, 503, 'a well-formed Host still reaches the readiness route');
    const after = await fetch(`${base}/healthz/`);
    assert.equal(after.status, 503, 'the server keeps answering after malformed Host probes');
  });
  await check('A11 a backslash path cannot become a protocol-relative redirect', async () => {
    // GHSA-r557-wffq-wvrc: the trailing-slash redirect used to echo the raw path,
    // turning "/\\evil.example/app" into Location "/\\evil.example/app/", which a
    // browser resolves to //evil.example/app/.
    const authority = `127.0.0.1:${new URL(base).port}`;
    const attacked = await requestWithHost(base, authority, '/\\evil.example/app');
    assert.equal(attacked.status, 400, 'a raw backslash path must not be redirected');
    const encoded = await requestWithHost(base, authority, '/%5Cevil.example/app');
    assert(!encoded.location.includes('\\'), 'a Location header never carries a raw backslash');
    const normal = await requestWithHost(base, authority, '/terms');
    assert.equal(normal.status, 301, 'the trailing-slash redirect still works');
    assert.equal(normal.location, '/terms/');
  });
});

// ---------------------------------------------------------------- mode B
// Portal open, dependencies absent. This is the 401 versus 503 distinction:
// a missing session is the caller's problem, missing configuration is ours.
await withServer(4398, {
  AIGAS_APP_ENABLED: 'true',
  RENDER_SERVICE_ID: 'srv-local-proof',
  RENDER_SERVICE_NAME: 'brightai-local-proof',
  RENDER_SERVICE_TYPE: 'web',
  RENDER_GIT_COMMIT: HEAD,
  AIGAS_DEPLOY_ID: 'dep-local-proof',
  DATABASE_URL: `postgresql://p04:${SECRET_MARKER}@127.0.0.1:1/aigas`,
}, async base => {
  await check('B1 unauthenticated API answers 401 JSON', async () => {
    const api = await fetch(`${base}/app/api/kernel/members/`);
    const json = await api.json();
    assert.equal(api.status, 401);
    assert.match(api.headers.get('content-type') ?? '', /application\/json/);
    assert.equal(json.code, 'UNAUTHORIZED');
    assert.match(api.headers.get('cache-control') ?? '', /private, no-store/);
  });
  await check('B2 authenticated call with no auth config answers 503', async () => {
    const api = await fetch(`${base}/app/api/kernel/members/`, { headers: { authorization: 'Bearer local-invalid-token' } });
    const json = await api.json();
    assert.equal(api.status, 503);
    assert.equal(json.code, 'AUTH_SETUP_REQUIRED');
    assert.equal(json.dependencyStatus, 'not configured');
  });
  await check('B3 unreachable database closes readiness', async () => {
    const health = await fetch(`${base}/healthz/`);
    const json = await health.json();
    assert.equal(health.status, 503);
    assert.equal(json.dependencies.database, 'UNAVAILABLE');
    assert.equal(json.dependencies.portal, 'ENABLED');
  });
  await check('B4 service/deploy/commit identity is read back', async () => {
    const json = await (await fetch(`${base}/healthz/`)).json();
    assert.equal(json.service.id, 'srv-local-proof');
    assert.equal(json.service.name, 'brightai-local-proof');
    assert.equal(json.service.type, 'web');
    assert.equal(json.release.deploy.id, 'dep-local-proof');
    assert.equal(json.release.deploy.claimedCommit, HEAD);
    assert.equal(json.release.consistent, true, 'artifact and platform commit must agree');
  });
  await check('B5 readiness body never leaks the DSN marker', async () => {
    const text = await (await fetch(`${base}/healthz/`)).text();
    assert(!text.includes(SECRET_MARKER));
    assert(!/postgres(ql)?:\/\//.test(text));
  });
});

// ---------------------------------------------------------------- mode C
// Positive readiness, only when a disposable local database is supplied.
const readyUrl = process.env.P04_READY_DATABASE_URL;
if (!readyUrl) {
  results.push({ name: 'C readiness with a reachable database', status: 'SKIP', detail: 'P04_READY_DATABASE_URL not set' });
} else {
  await withServer(4399, {
    AIGAS_APP_ENABLED: 'false',
    DATABASE_URL: readyUrl,
    NEON_AUTH_BASE_URL: 'https://auth.example.invalid',
    NEON_AUTH_JWKS_URL: 'https://auth.example.invalid/.well-known/jwks.json',
  }, async base => {
    await check('C1 readiness is 200 when database and auth are configured', async () => {
      const health = await fetch(`${base}/healthz/`);
      const json = await health.json();
      assert.equal(health.status, 200);
      assert.equal(json.state, 'ready');
      assert.equal(json.dependencies.database, 'READY');
      assert.equal(json.dependencies.auth, 'READY');
      assert.equal(json.dependencies.authProbe, 'SKIPPED');
      assert.equal(json.release.commit, HEAD);
    });
  });
}

console.log(`SHA=${HEAD} node=${process.version} environment=isolated-loopback checkedAt=${new Date().toISOString()}`);
for (const { name, status, detail, at } of results) console.log(`${status}  ${name}${detail ? ` — ${detail}` : ''}${at ? ` [${at}]` : ''}`);
const count = status => results.filter(entry => entry.status === status).length;
console.log(`\n${count('PASS')} PASS / ${count('SKIP')} SKIP / ${count('FAIL')} FAIL`);
if (count('FAIL')) process.exitCode = 1;
