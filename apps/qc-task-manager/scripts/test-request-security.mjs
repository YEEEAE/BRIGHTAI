// Request-security contract for every QC mutation endpoint.
//
// Behavioral layer (isolated temp database, like test-lab-security.mjs):
//   - CSRF gate: Fetch Metadata (Sec-Fetch-Site) defense layered ON TOP of the
//     existing Origin check. cross-site is rejected outright, same-origin is
//     accepted immediately, and an absent/unknown value falls back to the
//     Origin logic so older clients stay protected by the original rule.
//   - Body guards: Content-Type allowlist and the 12 MB size ceiling.
//   - In-memory rate limits: the generic IP+pathname mutation budget and the
//     per-user AI budget (single writable instance — no Redis, by contract).
//   - Stale-entry pruning: expired buckets are removed so the maps stay
//     bounded for the process lifetime; a pruned limiter accepts again.
//   - Login brute-force protection: per-account lockout after 5 failures and
//     the per-IP gate after 20 failed attempts.
//
// Architecture layer (source scanning, like architecture-guard.mjs):
//   - EVERY api endpoint exporting POST/PUT/PATCH/DELETE calls the canonical
//     requireCsrf + requireApiUser helpers itself (no ad-hoc auth).
//   - Every page-form POST handler (handle*Post in src/lib) applies requireCsrf
//     itself; the two session.ts handlers are dispatched from middleware behind
//     an explicit requireCsrf(context) call (ordering verified below).
//   - The Origin/Sec-Fetch-Site logic lives ONLY in api-security.ts.
//   - No CORS headers, no wildcard origins, CSP keeps no unsafe-inline/eval,
//     rate limiters stay in-memory (no Redis), and UI islands only ever fetch
//     same-origin relative URLs.
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. The database is a throwaway temp file deleted
// on exit — nothing in the repo is ever touched.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-request-security-'));
const dbPath = join(tempDir, 'request-security.db');
const TEST_PASSWORD = 'request-security-test-pw';

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // No equipment seed needed for this suite; first-login flags must not gate
  // the seeded logins exercised by the lockout checks (documented fixture, the
  // same opt-out pattern e2e-acceptance uses).
  process.env.QC_SEED_LAB_EQUIPMENT = '0';
  process.env.ADMIN_DEFAULT_PASSWORD = TEST_PASSWORD;
  process.env.QC_SEED_MUST_CHANGE_PASSWORD = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(join(backupDir, 'status.json'), JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }));

  const apiSec = await import('../src/lib/api-security.ts');
  const auth = await import('../src/lib/auth.ts');

  const SITE = 'https://qc.local';
  /** Minimal dispatcher surface — exactly what requireCsrf/requireRequestSecurity read. */
  function ctx(url, { method, headers = {}, ip } = {}) {
    const request = new Request(url, method ? { method, headers } : { headers });
    return { request, url: new URL(url), ...(ip ? { clientAddress: ip } : {}) };
  }
  function postCtx(url, ip, extraHeaders = {}) {
    return ctx(url, { method: 'POST', headers: extraHeaders, ip });
  }

  // ── 1. CSRF: Fetch Metadata layered over the Origin check ──
  console.log('\n■ CSRF — Fetch Metadata (Sec-Fetch-Site)');
  {
    // same-origin metadata is accepted immediately — even with no Origin
    // header present, which the legacy rule alone would have refused.
    eq(
      apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { 'sec-fetch-site': 'same-origin' } })),
      null,
      'fetchmeta: Sec-Fetch-Site same-origin accepted',
    );
    eq(
      apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { 'sec-fetch-site': 'Same-Origin' } })),
      null,
      'fetchmeta: header value is case-insensitive',
    );

    // cross-site metadata is rejected outright — even a forged matching Origin
    // cannot smuggle the request past the browser-attested metadata.
    const cross = apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { 'sec-fetch-site': 'cross-site', origin: SITE } }));
    ok(cross instanceof Response && cross.status === 403, 'fetchmeta: cross-site rejected even with matching Origin');
    eq((await cross.json()).ok, false, 'fetchmeta: cross-site body is { ok:false }');

    // No Fetch Metadata → the original Origin rule still protects every route.
    eq(
      apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { origin: SITE } })),
      null,
      'fetchmeta: absent header falls back — matching Origin accepted',
    );
    const forged = apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { origin: 'https://evil.example' } }));
    ok(forged instanceof Response && forged.status === 403, 'fetchmeta: absent header falls back — forged Origin rejected');
    const noOrigin = apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST' }));
    ok(noOrigin instanceof Response && noOrigin.status === 403, 'fetchmeta: absent header and no Origin => 403 (non-browser clients)');

    // Unknown/related metadata values never widen access: they fall back.
    eq(
      apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { 'sec-fetch-site': 'same-site', origin: SITE } })),
      null,
      'fetchmeta: same-site falls back — matching Origin accepted',
    );
    const sameSiteNoOrigin = apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { 'sec-fetch-site': 'same-site' } }));
    ok(sameSiteNoOrigin instanceof Response && sameSiteNoOrigin.status === 403, 'fetchmeta: same-site falls back — missing Origin rejected');
    const noneVal = apiSec.requireCsrf(ctx(`${SITE}/api/tasks/1/update`, { method: 'POST', headers: { 'sec-fetch-site': 'none' } }));
    ok(noneVal instanceof Response && noneVal.status === 403, 'fetchmeta: none falls back — direct-nav POST rejected');
  }

  // ── 2. Body guards: Content-Type + size (preserved contracts) ──
  console.log('\n■ Request body / content-type guards');
  {
    eq(apiSec.requireRequestSecurity(ctx(`${SITE}/lab/tests`, { method: 'GET' })), null, 'reqsec: GET passes');

    const form = postCtx(`${SITE}/lab/tests/new`, '10.1.0.1', { 'content-type': 'application/x-www-form-urlencoded' });
    eq(apiSec.requireRequestSecurity(form), null, 'reqsec: urlencoded POST passes');

    const jsonBody = postCtx(`${SITE}/api/ai/task-analysis`, '10.1.0.2', { 'content-type': 'application/json' });
    eq(apiSec.requireRequestSecurity(jsonBody), null, 'reqsec: JSON POST passes');

    const weird = postCtx(`${SITE}/lab/tests/new`, '10.1.0.3', { 'content-type': 'text/plain' });
    const weirdRes = apiSec.requireRequestSecurity(weird);
    ok(weirdRes instanceof Response && weirdRes.status === 415, 'reqsec: unsupported content-type => 415');

    const huge = postCtx(`${SITE}/lab/tests/new`, '10.1.0.4', { 'content-length': '999999999', 'content-type': 'application/x-www-form-urlencoded' });
    const hugeRes = apiSec.requireRequestSecurity(huge);
    ok(hugeRes instanceof Response && hugeRes.status === 413, 'reqsec: oversized content-length => 413');
  }

  // ── 3. In-memory mutation rate limit (IP + pathname bucket) ──
  console.log('\n■ Mutation rate limit (in-memory)');
  const RATE_IP = '10.77.0.1';
  const RATE_URL = `${SITE}/rate-limit-probe`;
  {
    let last = null;
    for (let i = 0; i < 120; i += 1) {
      last = apiSec.requireRequestSecurity(postCtx(RATE_URL, RATE_IP));
    }
    eq(last, null, 'ratelimit: first 120 mutations in the window allowed');

    const over = apiSec.requireRequestSecurity(postCtx(RATE_URL, RATE_IP));
    ok(over instanceof Response && over.status === 429, 'ratelimit: 121st mutation => 429');

    // A different pathname or IP gets its own bucket.
    eq(apiSec.requireRequestSecurity(postCtx(`${SITE}/rate-limit-other`, RATE_IP)), null, 'ratelimit: separate path has its own bucket');
    eq(apiSec.requireRequestSecurity(postCtx(RATE_URL, '10.77.0.2')), null, 'ratelimit: separate IP has its own bucket');
  }

  // ── 4. In-memory AI rate limit (per-user budget) ──
  console.log('\n■ AI rate limiter (in-memory)');
  const AI_USER = 424242;
  {
    let last = null;
    for (let i = 0; i < 15; i += 1) {
      last = apiSec.requireAiRateLimit(AI_USER);
    }
    eq(last, null, 'ai-ratelimit: first 15 AI calls in the window allowed');

    const overAi = apiSec.requireAiRateLimit(AI_USER);
    ok(overAi instanceof Response && overAi.status === 429, 'ai-ratelimit: 16th AI call => 429');

    eq(apiSec.requireAiRateLimit(AI_USER + 1), null, 'ai-ratelimit: another user has its own budget');
  }

  // ── 5. Stale-entry pruning keeps the in-memory maps bounded ──
  console.log('\n■ Rate-limit bucket pruning');
  {
    // Seed fresh entries in both limiters (unique keys, post-rate-limit runs).
    eq(apiSec.requireAiRateLimit(88881), null, 'prune: seed AI bucket');
    eq(apiSec.requireRequestSecurity(postCtx(`${SITE}/prune-probe`, '10.88.0.1')), null, 'prune: seed mutation bucket');

    // Fast-forward the clock past the 60s window: both entries are stale.
    const pruned = apiSec.pruneRateLimitBuckets(Date.now() + 120_000);
    ok(pruned.ai >= 1, `prune: expired AI buckets removed (got ${pruned.ai})`);
    ok(pruned.mutations >= 1, `prune: expired mutation buckets removed (got ${pruned.mutations})`);

    // Nothing stale remains — a second sweep finds zero entries.
    const again = apiSec.pruneRateLimitBuckets(Date.now() + 240_000);
    eq(again.ai, 0, 'prune: second sweep removes nothing (maps bounded)');
    eq(again.mutations, 0, 'prune: mutation map empty after sweep');

    // Removing the bucket releases the throttle: the same key is accepted again.
    eq(apiSec.requireAiRateLimit(AI_USER), null, 'prune: AI limiter accepts again after window reset');
    eq(apiSec.requireRequestSecurity(postCtx(RATE_URL, RATE_IP)), null, 'prune: mutation limiter accepts again after window reset');
  }

  // ── 6. Login brute-force protection (account lockout + per-IP gate) ──
  console.log('\n■ Login lockout / IP gate');
  {
    // Account lockout: 4 failures stay "invalid", the 5th locks the account,
    // and the correct password is refused while the lock is active.
    for (let i = 0; i < 4; i += 1) {
      eq(auth.verifyCredentials('employee', 'wrong-password', '192.0.2.50').status, 'invalid', `lockout: failure ${i + 1} => invalid`);
    }
    eq(auth.verifyCredentials('employee', 'wrong-password', '192.0.2.50').status, 'locked', 'lockout: 5th consecutive failure locks the account');
    eq(auth.verifyCredentials('employee', TEST_PASSWORD, '192.0.2.50').status, 'locked', 'lockout: correct password refused while locked');

    // Per-IP gate: 20 failed attempts from one IP throttle every account from
    // that IP — while a clean IP signs in normally.
    const floodIp = '198.51.100.7';
    for (let i = 0; i < 20; i += 1) {
      auth.verifyCredentials('manager', 'wrong-password', floodIp);
    }
    eq(auth.verifyCredentials('supervisor', TEST_PASSWORD, floodIp).status, 'invalid', 'lockout: IP gate refuses any account after 20 failures');
    eq(auth.verifyCredentials('supervisor', TEST_PASSWORD, '198.51.100.8').status, 'ok', 'lockout: clean IP signs in normally');
  }

  // ── 7. Architecture / security source scan ──
  console.log('\n■ Architecture scan — canonical request security');
  const read = (p) => readFileSync(join(appDir, p), 'utf8');
  const srcFiles = walk(join(appDir, 'src'));
  const relOf = (p) => relative(appDir, p).split(sep).join('/');

  {
    const apiFiles = srcFiles.filter((f) => relOf(f).startsWith('src/pages/api/') && f.endsWith('.ts'));
    ok(apiFiles.length >= 30, `scan: api endpoint inventory found (${apiFiles.length} files)`);

    let csrfOk = true;
    let authOk = true;
    const csrfMisses = [];
    const authMisses = [];
    for (const file of apiFiles) {
      const content = readFileSync(file, 'utf8');
      const unsafe = [...content.matchAll(/export\s+(?:const|async function)\s+(POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
      if (unsafe.length > 0 && !content.includes('requireCsrf(')) {
        csrfOk = false;
        csrfMisses.push(`${relOf(file)} [${unsafe.join(',')}]`);
      }
      if (!content.includes('requireApiUser(') && !['health.ts', 'readiness.ts'].some((name) => file.endsWith(name))) {
        authOk = false;
        authMisses.push(relOf(file));
      }
    }
    ok(csrfOk, `scan: every unsafe api export applies requireCsrf${csrfMisses.length ? ` — missing: ${csrfMisses.join(', ')}` : ''}`);
    ok(authOk, `scan: every api endpoint applies requireApiUser (health.ts and readiness.ts are documented public probes)${authMisses.length ? ` — missing: ${authMisses.join(', ')}` : ''}`);
  }

  {
    // The origin / Fetch-Metadata logic must live only in api-security.ts.
    const duplicates = srcFiles
      .filter((f) => !relOf(f).startsWith('src/lib/api-security.ts'))
      .filter((f) => /\.(ts|tsx|astro)$/.test(f))
      .filter((f) => /headers\.get\(['"](?:origin|sec-fetch-site)['"]\)/.test(readFileSync(f, 'utf8')));
    eq(duplicates.length, 0, `scan: no duplicate origin/fetch-metadata logic${duplicates.length ? ` — found in: ${duplicates.map(relOf).join(', ')}` : ''}`);
  }

  {
    // Every page-form POST handler applies the canonical CSRF gate itself.
    // session.ts is the documented exception: middleware dispatches its two
    // handlers behind an explicit requireCsrf(context) — verified next.
    const libFiles = srcFiles.filter((f) => relOf(f).startsWith('src/lib/') && f.endsWith('.ts'));
    const misses = [];
    for (const file of libFiles) {
      const content = readFileSync(file, 'utf8');
      const handlers = [...content.matchAll(/export\s+async\s+function\s+(handle\w*Post)\b/g)].map((m) => m[1]);
      if (handlers.length === 0) continue;
      const isDocumentedException = relOf(file) === 'src/lib/session.ts';
      if (!isDocumentedException && !content.includes('requireCsrf(')) {
        misses.push(`${relOf(file)} [${handlers.join(',')}]`);
      }
    }
    eq(misses.length, 0, `scan: every page-form POST handler applies requireCsrf${misses.length ? ` — missing: ${misses.join(', ')}` : ''}`);

    // middleware ordering: requireCsrf(context) must precede the two session
    // dispatches, and requireRequestSecurity must wrap the whole pipeline.
    const mwLines = read('src/middleware.ts').split('\n');
    const csrfIdx = mwLines.map((l, i) => (l.includes('requireCsrf(context)') ? i : -1)).filter((i) => i >= 0);
    for (const handler of ['handleLoginPost', 'handlePasswordChangePost']) {
      const handlerIdx = mwLines.findIndex((l) => l.includes(`return ${handler}(`));
      ok(handlerIdx >= 0 && csrfIdx.some((i) => i < handlerIdx), `scan: middleware applies requireCsrf before ${handler}`);
    }
    ok(mwLines.some((l) => l.includes('requireRequestSecurity(context)')), 'scan: middleware applies requireRequestSecurity to every request');
  }

  {
    // CSP: no unsafe-inline/unsafe-eval, and the hardening directives stay.
    const mw = read('src/middleware.ts');
    const csp = mw.match(/'Content-Security-Policy',\s*\n\s*"([^"]+)"/);
    ok(csp != null, 'scan: middleware sets a Content-Security-Policy');
    if (csp) {
      const value = csp[1];
      ok(!value.includes('unsafe-inline') && !value.includes('unsafe-eval'), 'scan: CSP has no unsafe-inline / unsafe-eval');
      ok(value.includes("default-src 'self'") && value.includes("frame-ancestors 'none'") && value.includes("connect-src 'self'"), 'scan: CSP keeps default-src self / frame-ancestors none / connect-src self');
    }
    ok(mw.includes("'X-Frame-Options', 'DENY'") && mw.includes('nosniff'), 'scan: X-Frame-Options DENY + nosniff stay on every response');

    // No CORS headers anywhere — the app is strictly same-origin.
    const corsFiles = srcFiles.filter((f) => readFileSync(f, 'utf8').includes('Access-Control-Allow'));
    eq(corsFiles.length, 0, `scan: no CORS headers (wildcard or otherwise)${corsFiles.length ? ` — found in: ${corsFiles.map(relOf).join(', ')}` : ''}`);
  }

  {
    // Rate limiters stay in-memory (single writable instance), never Redis.
    const apiSecSrc = read('src/lib/api-security.ts');
    ok((apiSecSrc.match(/new Map</g) ?? []).length >= 2, 'scan: mutation + AI limiters are in-memory Maps');
    ok(apiSecSrc.includes("'POST', 'PUT', 'PATCH', 'DELETE'"), 'scan: request security covers POST/PUT/PATCH/DELETE');
    ok(apiSecSrc.includes('pruneRateLimitBuckets'), 'scan: stale-bucket pruning is wired into the limiters');
    const pkg = JSON.parse(read('package.json'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const redisDeps = Object.keys(deps).filter((d) => /redis/i.test(d));
    eq(redisDeps.length, 0, 'scan: no Redis dependency (in-memory by deployment contract)');
  }

  {
    // UI islands must only ever fetch same-origin relative URLs.
    const componentFiles = srcFiles.filter((f) => relOf(f).startsWith('src/components/'));
    const absoluteFetches = componentFiles.filter((f) => /fetch\(\s*['"`]https?:/i.test(readFileSync(f, 'utf8')));
    eq(absoluteFetches.length, 0, `scan: UI islands fetch same-origin relative URLs only${absoluteFetches.length ? ` — found in: ${absoluteFetches.map(relOf).join(', ')}` : ''}`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-request-security crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}
