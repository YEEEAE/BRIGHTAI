#!/usr/bin/env node
import process from 'node:process';

// Post-deploy smoke test for the readiness endpoint. Read-only: it performs
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
  if (body.schema !== 1) fail(`${label}: schema must be 1, got ${JSON.stringify(body.schema)}`);
  if (!['ready', 'not_ready'].includes(body.status)) fail(`${label}: invalid status ${JSON.stringify(body.status)}`);
  if (!['ready', 'setup_required', 'blocked', 'unavailable'].includes(body.state)) fail(`${label}: invalid state ${JSON.stringify(body.state)}`);
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
    fail(`${label}: status/state disagree (${body.status}/${body.state})`);
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

for (const path of ['/healthz', '/healthz/']) {
  const before = failures.length;
  let result;
  try {
    result = await get(path);
  } catch (error) {
    fail(`GET ${path}: request failed (${error?.name ?? 'error'})`);
    continue;
  }
  const { response, text } = result;
  const label = `GET ${path}`;
  if (response.status >= 300 && response.status < 400) {
    fail(`${label}: ${response.status} redirect to ${response.headers.get('location') ?? 'unknown'} — checker never reaches readiness`);
    continue;
  }
  if (![200, 503].includes(response.status)) {
    fail(`${label}: expected 200 or 503, got ${response.status}`);
    continue;
  }
  const type = response.headers.get('content-type') ?? '';
  if (!/^application\/json/.test(type)) fail(`${label}: content-type is ${JSON.stringify(type)}`);
  const cache = response.headers.get('cache-control') ?? '';
  if (!/no-store/.test(cache)) fail(`${label}: cache-control is not no-store`);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    fail(`${label}: body is not JSON`);
    continue;
  }
  verifyBody(body, label);

  const expectedStatus = body.status === 'ready' && body.state === 'ready' ? 200 : 503;
  if (response.status !== expectedStatus) fail(`${label}: HTTP ${response.status} does not match ${body.status}/${body.state}`);
  if (requireReady && response.status !== 200) fail(`${label}: --require-ready but state is ${body.state}`);

  if (failures.length === before) pass(`${label}: ${response.status} ${body.status}/${body.state}`);

  if (expectCommit) {
    const actual = body.release?.commit ?? null;
    if (actual !== expectCommit) fail(`${label}: release.commit is ${actual ?? 'null'}, expected ${expectCommit}`);
    else pass(`${label}: release.commit matches`);
  }
  if (body.release?.consistent === false) fail(`${label}: artifact/platform commit mismatch`);

  const headResult = await head(path);
  const headStatus = headResult.response.status;
  if (headStatus >= 300 && headStatus < 400) fail(`HEAD ${path}: ${headStatus} redirect`);
  else if (![200, 503].includes(headStatus)) fail(`HEAD ${path}: expected 200 or 503, got ${headStatus}`);
  else if (headResult.text.length !== 0) fail(`HEAD ${path}: body must be empty`);
  else if (!/^application\/json/.test(headResult.response.headers.get('content-type') ?? '')) fail(`HEAD ${path}: content-type is not JSON`);
  else pass(`HEAD ${path}: ${headStatus}`);
}

const target = failures.length === 0 ? 'OK' : `${failures.length} FAILED`;
console.log(`\nhealthz smoke: ${target}`);
if (failures.length) process.exitCode = 1;
