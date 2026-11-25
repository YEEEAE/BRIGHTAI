#!/usr/bin/env node
import process from 'node:process';

// Post-deploy smoke test for both process probes. Read-only: it performs
// GET/HEAD requests and never sends a credential, a cookie or a query string.
//
//   node scripts/smoke-healthz.mjs https://brightai-site.onrender.com
//   node scripts/smoke-healthz.mjs https://… --require-ready --expect-commit=<sha>
//
// Environment equivalents: SMOKE_BASE_URL, SMOKE_REQUIRE_READY=true,
// SMOKE_EXPECT_COMMIT=<sha>. Exit 0 only when both spellings answer the fixed
// JSON contract with a status that matches the body.
//
// A 3xx is always a failure here even though Render accepts it as "healthy":
// the redirect would bypass the dependency check this endpoint exists to do.

const args = process.argv.slice(2);
const baseArg = args.find(argument => !argument.startsWith('--')) ?? process.env.SMOKE_BASE_URL ?? process.env.HEALTHZ_BASE_URL;
const requireReady = args.includes('--require-ready') || process.env.SMOKE_REQUIRE_READY === 'true';
const commitArg = args.find(argument => argument.startsWith('--expect-commit='))?.slice('--expect-commit='.length)
  ?? process.env.SMOKE_EXPECT_COMMIT ?? '';
const expectCommit = /^[a-f0-9]{40}$/i.test(commitArg.trim()) ? commitArg.trim().toLowerCase() : null;
if (commitArg.trim() && !expectCommit) {
  console.error('smoke: --expect-commit must be a 40-character git SHA');
  process.exit(2);
}

if (!baseArg) {
  console.error('usage: node scripts/smoke-healthz.mjs <base-url> [--require-ready] [--expect-commit=<40-char-sha>]');
  process.exit(2);
}

let base;
try {
  const parsed = new URL(baseArg);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
  base = parsed.origin;
} catch {
  console.error('smoke: base URL must be an absolute http(s) URL');
  process.exit(2);
}

const REQUIRED = ['schema', 'status', 'state', 'checkedAt', 'dependencies'];
const DEPENDENCY_KEYS = ['database', 'auth', 'authProbe', 'portal'];
const FORBIDDEN = [
  [/postgres(ql)?:\/\//i, 'connection string'],
  [/aigas_runtime/i, 'database role'],
  [/\bPGPASSWORD\b/i, 'database password variable'],
  [/\bDATABASE_URL\b/i, 'configuration variable'],
  [/\bpermission denied\b/i, 'raw driver message'],
  [/<!doctype|<html/i, 'HTML document'],
];

const failures = [];
const pass = message => console.log(`PASS  ${message}`);
const fail = message => { failures.push(message); console.log(`FAIL  ${message}`); };

function verifyBody(body, label) {
  for (const key of REQUIRED) {
    if (!(key in body)) return fail(`${label}: missing "${key}"`);
  }
  if (body.schema !== 1) fail(`${label}: schema must be 1, got unexpected value`);
  if (!['ready', 'not_ready'].includes(body.status)) fail(`${label}: invalid status value`);
  if (!['ready', 'setup_required', 'blocked', 'unavailable'].includes(body.state)) fail(`${label}: invalid state value`);
  if (typeof body.checkedAt !== 'string' || Number.isNaN(Date.parse(body.checkedAt))) fail(`${label}: checkedAt is not an ISO timestamp`);
  if (!body.dependencies || typeof body.dependencies !== 'object') return fail(`${label}: dependencies is not an object`);
  for (const key of DEPENDENCY_KEYS) {
    if (typeof body.dependencies[key] !== 'string') fail(`${label}: dependencies.${key} is missing`);
  }
  const text = JSON.stringify(body);
  for (const [pattern, name] of FORBIDDEN) {
    if (pattern.test(text)) fail(`${label}: response exposes a ${name}`);
  }
  if ((body.status === 'ready') !== (body.state === 'ready')) {
    fail(`${label}: status/state disagree `);
  }
  return undefined;
}

async function get(path) {
  const response = await fetch(`${base}${path}`, {
    method: 'GET',
    redirect: 'manual',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  const text = await response.text();
  return { response, text };
}

async function head(path) {
  const response = await fetch(`${base}${path}`, {
    method: 'HEAD',
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
  });
  return { response, text: await response.text() };
}

console.log(`healthz smoke: ${base}`);

let reference;
for (const path of ['/healthz', '/healthz/', '/readyz', '/readyz/']) {
  const live = path.startsWith('/healthz');
  for (const [method, request] of [['GET', get], ['HEAD', head]]) {
    const label = `${method} ${path}`;
    const before = failures.length;
    try {
      const { response, text } = await request(path);
      const expected = live || requireReady ? [200] : [200, 503];
      if (!expected.includes(response.status)) fail(`${label}: unexpected HTTP ${response.status}`);
      if (response.headers.has('location')) fail(`${label}: unexpected Location header`);
      if (!/^application\/json/.test(response.headers.get('content-type') ?? '')) fail(`${label}: expected JSON`);
      if (!/no-store/.test(response.headers.get('cache-control') ?? '')) fail(`${label}: expected no-store`);
      if (method === 'HEAD') {
        if (text !== '') fail(`${label}: unexpected body`);
      } else if (expected.includes(response.status)) {
        const body = JSON.parse(text);
        if (!body || typeof body !== 'object') throw new Error('Invalid JSON envelope');
        if (typeof body.version !== 'string' || !/^\d+\.\d+\.\d+/.test(body.version)) fail(`${label}: invalid version`);
        if (typeof body.commit !== 'string' || !/^[a-f0-9]{40}$/.test(body.commit)) fail(`${label}: invalid commit SHA`);
        if (expectCommit && body.commit !== expectCommit) fail(`${label}: unexpected commit SHA`);
        const identity = JSON.stringify([body.version, body.commit]);
        reference ??= identity;
        if (reference !== identity) fail(`${label}: inconsistent build identity`);
        if (live) {
          if (body.status !== 'ok' || Object.keys(body).length !== 3) fail(`${label}: invalid liveness envelope`);
        } else {
          verifyBody(body, label);
          if (response.status !== (body.status === 'ready' ? 200 : 503)) fail(`${label}: status does not match body`);
          if (body.release?.consistent === false) fail(`${label}: artifact/platform commit mismatch`);
        }
      }
      if (failures.length === before) pass(`${label}: ${response.status}`);
    } catch {
      fail(`${label}: request failed or response body was invalid`);
    }
  }
}

console.log(failures.length ? `\nprobe smoke: ${failures.length} FAILED` : '\nprobe smoke: OK');
if (failures.length) process.exitCode = 1;
