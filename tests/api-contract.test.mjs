import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request as nodeRequest } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { apiBoundary } from '../src/server/api/boundary.mjs';
import { authOperations, routes } from '../src/server/api/routes.mjs';
import { authBodySchemas, bodySchemaFor } from '../src/server/api/request-schemas.mjs';
import { responseSchemas } from '../src/server/api/response-schemas.mjs';
import { errorSchema, requestIdSchema } from '../src/server/api/schemas.mjs';
import { hasTrustedApiOrigin } from '../src/server/api/origin.mjs';
import { readJsonObject } from '../src/server/api/json.mjs';

const uuid = '11111111-1111-4111-8111-111111111111';
const executablePath = path => path.replace(/\[[^\]]+\]/g, uuid) + '/';
let server;
let base;

before(async () => {
  server = spawn(process.execPath, ['scripts/server.mjs'], {
    env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: '0', NODE_ENV: 'production', AIGAS_APP_ENABLED: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // PORT=0 asks Node for an available port. Read the listener's actual address.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local API server start timed out')), 10000);
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Local API server exited (${code})`)); });
    server.stderr.on('data', chunk => process.stderr.write(chunk));
    server.stdout.on('data', chunk => {
      const match = /listening on 127\.0\.0\.1:(\d+)/.exec(chunk.toString());
      if (!match || match[1] === '0') return;
      base = `http://127.0.0.1:${match[1]}`;
      clearTimeout(timer);
      resolve();
    });
  });
});

after(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    server.kill();
    await once(server, 'exit');
  }
});

async function errorOf(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('x-aigas-error-contract'), 'aigas-error-v2');
  const body = errorSchema.parse(await response.json());
  assert.equal(body.requestId, response.headers.get('x-request-id'));
  return body;
}
function expectedStatus(path) {
  if (['/healthz', '/api/measurement-status', '/app/api/kernel/health'].includes(path)) return 200;
  if (['/api/observability', '/api/security/csp-report'].includes(path)) return 204;
  if (path === '/app/api/secure-chat/messages') return 403;
  if (path.startsWith('/auth/api/') || ['/api/public-demo/groq-sandbox', '/readyz'].includes(path)) return 503;
  return 401;
}

test('route registry matches every first-party handler export and has a response schema', async () => {
  const folder = new URL('../src/pages/', import.meta.url);
  const files = await readdir(folder, { recursive: true });
  const keys = [];
  for (const file of files.filter(file => /^(?:(?:app\/|auth\/)?api\/.*|healthz|readyz)\.ts$/.test(file))) {
    const path = '/' + file.replace(/\.ts$/, '').replace(/\/index$/, '');
    const source = await readFile(new URL(file, folder), 'utf8');
    if (path === '/auth/api/[...operation]') {
      for (const [operation, method] of Object.entries(authOperations)) keys.push(`${method} /auth/api/${operation}`);
    } else if (path === '/healthz' || path === '/readyz') {
      keys.push(`GET ${path}`);
    } else {
      for (const [, method] of source.matchAll(/export const (GET|POST|PATCH|PUT|DELETE|OPTIONS)\b/g)) keys.push(`${method} ${path}`);
    }
  }
  assert.deepEqual(routes.flatMap(({ path, methods }) => methods.filter(method => method !== 'HEAD').map(method => `${method} ${path}`)).sort(), keys.sort());
  assert.deepEqual(Object.keys(responseSchemas).sort(), keys.sort());
});

for (const { path, methods } of routes) {
  for (const method of methods) {
    test(`${method} ${path} has an HTTP contract`, async () => {
      const url = new URL(executablePath(path), base);
      const options = { method, headers: { 'X-Request-ID': 'client-supplied', Origin: 'https://untrusted.invalid' }, redirect: 'manual' };
      if (path === '/api/security/csp-report') {
        options.headers['Content-Type'] = 'application/csp-report';
        options.body = JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src' } });
      }
      const response = await fetch(url, options);
      const status = expectedStatus(path);
      assert.equal(response.status, status);
      assert.equal(response.headers.get('access-control-allow-origin'), null);
      const id = requestIdSchema.parse(response.headers.get('x-request-id'));
      assert.notEqual(id, 'client-supplied');
      if (method === 'HEAD' || status === 204) assert.equal(await response.text(), '');
      else if (status >= 400) await errorOf(response, status);
      else responseSchemas[`${method} ${path}`].parse(await response.json());

      url.searchParams.set('unexpected', '1');
      const invalid = await fetch(url, options);
      if (method === 'HEAD') {
        assert.equal(invalid.status, 400);
        assert.equal(await invalid.text(), '');
      } else {
        assert.notEqual((await errorOf(invalid, 400)).requestId, id);
      }

      if (method === 'POST' && path.startsWith('/auth/api/')) {
        assert.equal(authBodySchemas[path.slice('/auth/api/'.length)].safeParse({ unexpected: true }).success, false);
      }
      if (['POST', 'PATCH', 'DELETE'].includes(method) && path.startsWith('/app/api/')) {
        const request = new Request(new URL(executablePath(path), 'https://brightai.live'), { method });
        const schema = bodySchemaFor(request);
        assert.ok(schema);
        assert.equal(schema.safeParse({ unexpected: true }).success, false);
      }
    });
  }
  test(`OPTIONS ${path} refuses CORS preflight`, async () => {
    const response = await fetch(new URL(executablePath(path), base), {
      method: 'OPTIONS',
      headers: { Origin: 'https://untrusted.invalid', 'Access-Control-Request-Method': methods[0] },
    });
    assert.equal(response.headers.get('allow'), methods.join(', '));
    await errorOf(response, 405);
  });
}

test('rejects malformed dynamic IDs, duplicate filters and paths outside the inventory', async () => {
  await errorOf(await fetch(new URL('/app/api/ledger/events/unsupported/', base)), 400);
  await errorOf(await fetch(new URL('/app/api/ledger/events/?page=1&page=2', base)), 400);
  await errorOf(await fetch(new URL('/api/unknown/', base)), 404);
});

test('policy history accepts independent bounded page parameters on HTTP', async () => {
  const url = new URL('/app/api/kernel/policies/', base);
  url.searchParams.set('versions_page', '2');
  await errorOf(await fetch(url), 400);
  url.searchParams.set('policy_id', uuid);
  url.searchParams.set('approvals_page', '3');
  await errorOf(await fetch(url), 401);
  url.searchParams.set('approvals_page', '1000');
  await errorOf(await fetch(url), 400);
});
test('unexpected failures lose internal exception contents and CORS headers', async () => {
  const path = '/api/measurement-status/';
  const request = new Request('https://brightai.live' + path);
  await errorOf(await apiBoundary(request, path, () => { throw new Error('SQL fixture secret'); }), 500);
  const response = await apiBoundary(request, path, () => Response.json({ stack: 'private' }, { status: 500, headers: {
    'Access-Control-Allow-Origin': 'https://untrusted.invalid',
    'Access-Control-Allow-Credentials': 'true',
  } }));
  const error = await errorOf(response, 500);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
  assert.doesNotMatch(JSON.stringify(error), /private|SQL fixture secret/);
});

test('untrusted request authority and forwarding headers cannot authorize Origin', () => {
  assert.equal(hasTrustedApiOrigin(new Request('https://rejected.invalid/', { headers: {
    Host: 'rejected.invalid', Origin: 'https://rejected.invalid', 'X-Forwarded-Host': 'brightai.live',
  } })), false);
  assert.equal(hasTrustedApiOrigin(new Request('https://brightai.live/', { headers: { Origin: 'https://brightai.live' } })), true);
  for (const origin of ['null', 'https://www.brightai.live', 'https://brightai.live,https://other.invalid']) {
    assert.equal(hasTrustedApiOrigin(new Request('https://brightai.live/', { headers: { Origin: origin } })), false);
  }
});

test('Node rejects a forged same-origin authority and emits the JSON envelope', async () => {
  const response = await new Promise((resolve, reject) => {
    const req = nodeRequest(new URL('/app/api/secure-chat/messages/', base), {
      method: 'POST',
      headers: {
        Host: 'forged.invalid', Origin: 'http://forged.invalid', 'X-Forwarded-Host': 'forged.invalid',
        'Content-Type': 'application/json', 'Content-Length': 2,
      },
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end('{}');
  });
  assert.equal((await errorOf(response, 403)).code, 'ORIGIN_REJECTED');
});

test('an invalid or unsupported idempotency header is rejected before a write', async () => {
  for (const [path, key] of [['/app/api/kernel/', 'contains space'], ['/app/api/firewall/evaluate/', uuid]]) {
    const response = await fetch(new URL(path, base), { method: 'POST', headers: { 'Idempotency-Key': key } });
    assert.equal((await errorOf(response, 400)).code, 'INVALID_IDEMPOTENCY_KEY');
  }
});

test('strict auth input validates types, lengths, enums and extra fields', () => {
  const body = { email: 'synthetic@example.test', otp: '123456' };
  const schema = authBodySchemas['sign-in/email-otp'];
  assert.equal(schema.safeParse(body).success, true);
  for (const invalid of [{ ...body, otp: 123456 }, { ...body, otp: '1'.repeat(64) }, { ...body, role: 'owner' }]) {
    assert.equal(schema.safeParse(invalid).success, false);
  }
});

test('JSON transport rejects invalid UTF-8, oversized input and wrong media type', async () => {
  const make = (body, media = 'application/json') => new Request('https://brightai.live/', { method: 'POST', body, headers: { 'Content-Type': media } });
  await assert.rejects(readJsonObject(make(new Uint8Array([255])), 16), { status: 400 });
  await assert.rejects(readJsonObject(make('{"name":"' + 'x'.repeat(32) + '"}'), 16), { status: 413 });
  await assert.rejects(readJsonObject(make('{}', 'application/jsonx'), 16), { status: 415 });
  assert.deepEqual(await readJsonObject(make('{}', 'Application/JSON; charset=utf-8'), 16), {});
});
