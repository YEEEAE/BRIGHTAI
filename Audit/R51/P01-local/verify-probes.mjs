#!/usr/bin/env node
// P01 local evidence: probe/API HTTP contracts from the fresh npm start process.
// Read-only GET/HEAD/POST-405 checks; no credentials, no external calls.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { request } from 'node:http';

const origin = new URL(process.env.P01_BASE_URL ?? 'http://127.0.0.1:4399');
const hostHeader = value => ({ host: value ?? '127.0.0.1' });

function call(path, method = 'GET', host) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: origin.hostname, port: origin.port, path, method, headers: hostHeader(host) }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          path, method, host: host ?? '127.0.0.1', status: response.statusCode,
          headers: {
            contentType: response.headers['content-type'] ?? null,
            cacheControl: response.headers['cache-control'] ?? null,
            cdnCacheControl: response.headers['cdn-cache-control'] ?? null,
            cfCacheControl: response.headers['cloudflare-cdn-cache-control'] ?? null,
            robots: response.headers['x-robots-tag'] ?? null,
            allow: response.headers['allow'] ?? null,
            requestId: response.headers['x-request-id'] ?? null,
          },
          body: body.toString('utf8'),
          bodySha256: 'sha256:' + createHash('sha256').update(body).digest('hex'),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const checks = [];
const records = [];
async function record(path, method = 'GET', host) {
  const result = await call(path, method, host);
  records.push(result);
  return result;
}
function expect(label, condition) {
  checks.push({ label, pass: Boolean(condition) });
}

for (const path of ['/healthz', '/healthz/', '/readyz', '/readyz/']) {
  const live = path.startsWith('/healthz');
  const r = await record(path);
  expect(`${path} status`, live ? r.status === 200 : [200, 503].includes(r.status));
  expect(`${path} JSON`, /^application\/json/.test(r.headers.contentType ?? ''));
  expect(`${path} no-store`, /no-store/.test(r.headers.cacheControl ?? '') && r.headers.cdnCacheControl === 'no-store' && r.headers.cfCacheControl === 'no-store');
  expect(`${path} noindex`, r.headers.robots === 'noindex, nofollow');
  const body = JSON.parse(r.body);
  if (live) {
    expect(`${path} liveness keys`, JSON.stringify(Object.keys(body).sort()) === '["commit","status","version"]' && body.status === 'ok');
  } else if (r.status === 503) {
    expect(`${path} 503 public envelope`, JSON.stringify(Object.keys(body).sort()) === '["code","dependencyStatus","message","requestId"]' && body.requestId === r.headers.requestId);
  } else {
    expect(`${path} readiness keys`, JSON.stringify(Object.keys(body).sort()) === '["checkedAt","commit","dependencies","error","release","schema","service","state","status","version"]');
    expect(`${path} status/state agree`, (body.status === 'ready') === (body.state === 'ready'));
  }
  const head = await record(path, 'HEAD');
  expect(`HEAD ${path} status/empty body`, head.status === r.status && head.body === '');
}
for (const path of ['/healthz/', '/readyz/']) {
  const r = await record(path, 'POST');
  expect(`POST ${path} 405`, r.status === 405 && r.headers.allow === 'GET, HEAD' && /no-store/.test(r.headers.cacheControl ?? '') && r.headers.robots === 'noindex, nofollow');
}
for (const path of ['/api/trial-availability/', '/api/measurement-status/', '/api/enterprise-inquiry/']) {
  const r = await record(path);
  expect(`${path} JSON 200`, r.status === 200 && /^application\/json/.test(r.headers.contentType ?? ''));
  JSON.parse(r.body);
}
const preview = await record('/', 'GET', 'brightai-r51-audit.onrender.com');
expect('preview origin noindex header', preview.headers.robots === 'noindex, nofollow');
expect('preview canonical unchanged', preview.body.includes('rel="canonical" href="https://brightai.live/"'));
const publicPage = await record('/', 'GET', 'brightai.live');
expect('public origin not noindexed', !/noindex/.test(publicPage.headers.robots ?? ''));
expect('public canonical unchanged', publicPage.body.includes('rel="canonical" href="https://brightai.live/"'));

const report = {
  generatedAt: new Date().toISOString(),
  base: origin.origin,
  passes: checks.filter(item => item.pass).length,
  failures: checks.filter(item => !item.pass),
  checks,
  responses: records,
};
writeFileSync(new URL('./evidence.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(`P01 local probes: ${report.passes}/${checks.length} PASS`);
for (const failure of report.failures) console.log('FAIL', failure.label);
if (report.failures.length) process.exitCode = 1;
