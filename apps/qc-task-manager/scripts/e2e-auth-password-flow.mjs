// E2E spec: first-login password lifecycle (must_change_password).
//
// SELF-CONTAINED: this suite spawns its OWN standalone server on an isolated
// port + temp database, deliberately WITHOUT the QC_SEED_MUST_CHANGE_PASSWORD
// fixture opt-out, so it exercises the enforced production behavior:
//
//   A. Fresh seeded accounts are flagged must_change_password = 1.
//   B. First login redirects to /account/security (not the role home).
//   C. Cannot bypass: every other page/API POST while flagged bounces to
//      /account/security — only the change flow and /logout are reachable.
//   D. Logout stays reachable while flagged.
//   E. Wrong current password → generic error, flag unchanged.
//   F. Confirmation mismatch → schema error, flag unchanged.
//   G. Password below the existing policy → policy error, flag unchanged.
//   H. Successful change → role home, flag cleared, password_changed_at set.
//   I. Every OTHER session for the user is invalidated; current session kept.
//   J. Admin (after completing their own forced change) resets the employee
//      password → must_change_password re-enabled → next login forced again.
//   K. AI absent (no GROQ_API_KEY in the server env): core app renders, the AI
//      endpoint answers with the controlled unavailable state, and
//      /admin/system-health reports provider diagnostics without any secret.
//   L. No password value or bcrypt hash fragment ever appears in the captured
//      server stdout/stderr.
//
// Usage (isolated): pnpm build && QC_DATABASE_PATH=<tmp.db> node scripts/e2e-auth-password-flow.mjs
// Registered in scripts/e2e-registry.mjs and executed by the acceptance runner
// like every other suite; the runner-provided server on BASE_URL is ignored.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SEED_PASS = 'lifecycle-e2e-seed-2026';
const OWN_PORT = 4540; // above the acceptance runner's computed range
const BASE = `http://127.0.0.1:${OWN_PORT}`;
const CSRF_HEADERS = { Origin: BASE, Referer: `${BASE}/` };

// Every password value used in this suite — asserted absent from server logs.
const SECRETS = [
  SEED_PASS,
  'MyOwn-Emp-Pass-2026',
  'MyOwn-Admin-Pass-2026',
  'AdminReset-Temp-42',
  '$2a$10$', '$2b$10$', '$2y$10$',
];

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

const temp = mkdtempSync(join(tmpdir(), 'brightai-pw-flow-'));
const dbPath = join(temp, 'lifecycle.db');

// ── server with captured output; NO GROQ_API_KEY, NO seed opt-out ──
const serverEnv = { ...process.env };
delete serverEnv.GROQ_API_KEY;
delete serverEnv.QC_SEED_MUST_CHANGE_PASSWORD;
Object.assign(serverEnv, {
  NODE_ENV: 'production',
  HOST: '127.0.0.1',
  PORT: String(OWN_PORT),
  QC_DATABASE_PATH: dbPath,
  QC_DB_PATH: dbPath,
  ADMIN_DEFAULT_PASSWORD: SEED_PASS,
});
const server = spawn(process.execPath, ['./dist/server/entry.mjs'], {
  cwd: appDir,
  env: serverEnv,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk; });
server.stderr.on('data', (chunk) => { serverLog += chunk; });

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`server exited before readiness (code ${server.exitCode})`);
    try {
      const response = await fetch(`${BASE}/login`, { redirect: 'manual' });
      if (response.status === 200) return;
    } catch { /* retry while Astro boots */ }
    await sleep(250);
  }
  throw new Error('server did not become ready');
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();

/** POST /login without following redirects. */
async function postLogin(username, password, redirect = '/') {
  const res = await ctx.request.post(`${BASE}/login`, {
    form: { username, password, redirect },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  return { status: res.status(), location: res.headers()['location'] ?? '' };
}

/** Authenticated GET without following redirects. */
async function get(path) {
  const res = await ctx.request.get(`${BASE}${path}`, { maxRedirects: 0 });
  return { status: res.status(), location: res.headers()['location'] ?? '' };
}

/** POST the change-password form and return { status, location } (no follow). */
async function postChange(currentPassword, newPassword, confirmPassword) {
  const res = await ctx.request.post(`${BASE}/account/security`, {
    form: { currentPassword, newPassword, confirmPassword },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  return { status: res.status(), location: res.headers()['location'] ?? '' };
}

/** Follow the redirect chain once and read the rendered flash message. */
async function readFlash() {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/account/security`);
  const flash = await page.locator('[role="alert"]').first().textContent().catch(() => null);
  await page.close();
  return (flash ?? '').trim();
}

/** Open a fresh context, log in, return the context + login result. */
async function loginInNewContext(username, password, redirect = '/') {
  const fresh = await browser.newContext();
  const res = await fresh.request.post(`${BASE}/login`, {
    form: { username, password, redirect },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  return { context: fresh, status: res.status(), location: res.headers()['location'] ?? '' };
}

try {
  await waitForServer();

  // Warmup: bootstraps schema + seed (flag enforced — no opt-out here).
  await ctx.request.post(`${BASE}/login`, {
    form: { username: '__warmup__', password: 'x' },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  const q = (sql, ...p) => db.prepare(sql).get(...p);
  const userByName = (name) => q('SELECT * FROM users WHERE username = ?', name);

  // ── A. Fresh seeded accounts are flagged ──
  console.log('── A. fresh seed flags every account ──');
  const seeded = db.prepare('SELECT username, must_change_password FROM users').all();
  ok(seeded.length === 4 && seeded.every((u) => Number(u.must_change_password) === 1), `A. all ${seeded.length} seeded accounts have must_change_password=1`);

  // ── B. First login redirects to the password-change flow ──
  console.log('── B. first login redirect ──');
  const b = await postLogin('employee', SEED_PASS, '/employee');
  ok(b.status === 302 && b.location === '/account/security', `B. flagged login → 302 /account/security (got ${b.status} ${b.location})`);

  // ── C. Direct-URL bypass attempts all bounce ──
  console.log('── C. bypass attempts while flagged ──');
  for (const path of ['/employee', '/dashboard', '/manager', '/admin/users', '/notifications', '/search', '/lab', '/', '/login']) {
    const res = await get(path);
    ok(res.status === 302 && res.location === '/account/security', `C. GET ${path} → /account/security (got ${res.status} ${res.location})`);
  }
  const apiProbe = await get('/api/notifications');
  ok(apiProbe.status === 302 && apiProbe.location === '/account/security', `C. GET /api/notifications → /account/security (got ${apiProbe.status} ${apiProbe.location})`);

  // ── E/F/G. Rejected changes (wrong current / mismatch / policy) ──
  console.log('── E/F/G. rejected change attempts ──');
  const wrongCurrent = await postChange('Totally-Wrong-1', 'MyOwn-Emp-Pass-2026', 'MyOwn-Emp-Pass-2026');
  ok(wrongCurrent.status === 302 && wrongCurrent.location === '/account/security', `E. wrong current password → redirect (got ${wrongCurrent.status} ${wrongCurrent.location})`);
  const wrongFlash = await readFlash();
  ok(wrongFlash === 'Current password is incorrect.', `E. flash says the current password is incorrect (got "${wrongFlash}")`);

  const mismatch = await postChange(SEED_PASS, 'MyOwn-Emp-Pass-2026', 'Different-Confirm-9');
  ok(mismatch.status === 302, 'F. confirmation mismatch → redirect');
  const mismatchFlash = await readFlash();
  ok(mismatchFlash.includes('do not match'), `F. flash reports the mismatch (got "${mismatchFlash}")`);

  const tooShort = await postChange(SEED_PASS, 'short', 'short');
  ok(tooShort.status === 302, 'G. short new password → redirect');
  const shortFlash = await readFlash();
  ok(shortFlash.includes('at least 8 characters'), `G. flash states the policy (got "${shortFlash}")`);

  ok(Number(userByName('employee').must_change_password) === 1, 'E/F/G. flag unchanged after rejected attempts');

  // ── D. Logout stays reachable while flagged ──
  console.log('── D. logout reachable while flagged ──');
  const beforeLogoutToken = db.prepare("SELECT token FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.username = 'employee'").get()?.token;
  const logout = await ctx.request.post(`${BASE}/logout`, { form: {}, headers: CSRF_HEADERS, maxRedirects: 0 });
  ok(logout.status() === 302 && logout.headers()['location'] === '/login', 'D. POST /logout → 302 /login while flagged');
  ok(!q('SELECT 1 FROM sessions WHERE token = ?', beforeLogoutToken), 'D. flagged logout destroyed the server session');
  await postLogin('employee', SEED_PASS, '/employee'); // session back for H/I

  // ── I. Second session exists, then dies with the password change ──
  console.log('── H/I. successful change + other-session invalidation ──');
  const second = await loginInNewContext('employee', SEED_PASS, '/employee');
  ok(second.location === '/account/security', 'I. second context is also flagged');
  const empSessionsBefore = db.prepare("SELECT token FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.username = 'employee'").all().map((r) => r.token);
  ok(empSessionsBefore.length === 2, `I. two live employee sessions before the change (got ${empSessionsBefore.length})`);

  const success = await postChange(SEED_PASS, 'MyOwn-Emp-Pass-2026', 'MyOwn-Emp-Pass-2026');
  ok(success.status === 302 && success.location === '/employee', `H. change succeeded → role home (got ${success.status} ${success.location})`);
  const empAfter = userByName('employee');
  ok(Number(empAfter.must_change_password) === 0, 'H. flag cleared');
  ok(!!empAfter.password_changed_at, 'H. password_changed_at stamped');

  const tokensAfter = db.prepare("SELECT token FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.username = 'employee'").all().map((r) => r.token);
  ok(tokensAfter.length === 1, `I. exactly one employee session remains (got ${tokensAfter.length})`);
  const secondTokenAlive = await second.context.request.get(`${BASE}/employee`, { maxRedirects: 0 });
  ok(secondTokenAlive.status() === 302 && (secondTokenAlive.headers()['location'] ?? '').startsWith('/login'), 'I. the OTHER session is signed out');
  const currentAlive = await get('/employee');
  ok(currentAlive.status === 200, 'I. the CURRENT session still works and reaches the role home');
  await second.context.close();

  // ── J. Admin forced change, then reset re-flags the employee ──
  console.log('── J. admin reset re-enables the flag ──');
  const admin = await loginInNewContext('admin', SEED_PASS, '/admin/users');
  ok(admin.location === '/account/security', 'J. admin is flagged too (seeded account)');
  // Admin completes their own forced change through the flow.
  const adminSelf = await admin.context.request.post(`${BASE}/account/security`, {
    form: { currentPassword: SEED_PASS, newPassword: 'MyOwn-Admin-Pass-2026', confirmPassword: 'MyOwn-Admin-Pass-2026' },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  ok(adminSelf.status() === 302 && adminSelf.headers()['location'] === '/admin/users', `J. admin completed the forced change → /admin/users (got ${adminSelf.headers()['location']})`);
  // Sanctioned admin reset of the employee password.
  const reset = await admin.context.request.post(`${BASE}/admin/users/api`, {
    form: { action: 'reset_password', user_id: String(userByName('employee').id), password: 'AdminReset-Temp-42' },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  ok(reset.status() === 302, 'J. admin reset_password accepted');
  ok(Number(userByName('employee').must_change_password) === 1, 'J. reset re-enabled must_change_password=1');
  const reflogged = await loginInNewContext('employee', 'AdminReset-Temp-42', '/employee');
  ok(reflogged.location === '/account/security', 'J. employee login after reset → forced /account/security');
  await reflogged.context.close();
  // Admin context stays open for the AI-absence checks below (K).

  // ── K. AI absent: controlled unavailable state, core app unaffected ──
  console.log('── K. AI absent → controlled unavailable state ──');
  const aiRes = await admin.context.request.post(`${BASE}/api/ai/management-summary`, {
    data: {},
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  ok(aiRes.status() === 503, `K. AI endpoint → 503 without a provider (got ${aiRes.status()})`);
  const aiPayload = await aiRes.json().catch(() => ({}));
  ok(aiPayload.aiUnavailable === true && typeof aiPayload.error === 'string' && aiPayload.ok === false, 'K. controlled unavailable payload (aiUnavailable=true)');
  const healthPage = await admin.context.request.get(`${BASE}/admin/system-health`, { maxRedirects: 0 });
  ok(healthPage.status() === 200, 'K. /admin/system-health renders');
  const healthHtml = await healthPage.text();
  ok(healthHtml.includes('AI provider') && healthHtml.includes('Not configured'), 'K. provider-health diagnostics report the unconfigured state');
  ok(!healthHtml.includes('GROQ_API_KEY') && !/\$2[aby]\$10\$/.test(healthHtml), 'K. health page exposes no credential material');
  await admin.context.close();

  db.close();

  // ── L. No password/hash ever reached the server log ──
  console.log('── L. no secrets in server output ──');
  const leaked = SECRETS.filter((s) => serverLog.includes(s));
  ok(leaked.length === 0, `L. no password/hash fragment in captured server output (leaked: ${leaked.length})`);
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  server.kill('SIGTERM');
  await sleep(500);
  if (server.exitCode === null) server.kill('SIGKILL');
  await browser.close();
  rmSync(temp, { recursive: true, force: true });
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('ALL PASS ✅');
