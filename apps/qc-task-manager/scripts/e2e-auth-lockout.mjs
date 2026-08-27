// E2E spec for secure authentication hardening (account lockout).
//
// Verifies against a LIVE server sharing the same SQLite DB (QC_DB_PATH):
//   A. Successful login → session row (12h) + cookie flags (httpOnly,
//      SameSite=lax, Secure in production, qc_session name) + last_login_at.
//   B. Wrong password → generic "Invalid username or password." message.
//   C. 5 consecutive failures → account locked (users.locked_until set,
//      counter reset); correct password still gets the same generic failure;
//      every attempt is audited in login_attempts.
//   D. Lock expiry (simulated) → login works again with a fresh counter.
//   E. Successful login resets the failure counter.
//   F. Admin password reset clears the lock (sanctioned unblock) and
//      re-flags must_change_password — the next login is forced through
//      /account/security (full lifecycle coverage: e2e-auth-password-flow).
//   G. Admin reactivation clears the lock.
//   H. Deactivated account → generic failure (no counter bumps).
//   I. Anonymous request to a protected route → 302 to /login?redirect=…
//
// Usage: QC_DB_PATH=<app>/db/e2e_auth.db node scripts/e2e-auth-lockout.mjs
// (run against the built server: pnpm build && QC_SEED_MUST_CHANGE_PASSWORD=0 node dist/server/entry.mjs)
// QC_SEED_MUST_CHANGE_PASSWORD=0 is the documented E2E fixture opt-out of the
// seeded first-login flag (never set it on a real deployment); this suite
// asserts the post-reset flag in scenario F.

import { chromium } from 'playwright';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4323';
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
// Astro's built-in same-origin CSRF check requires an Origin header; real
// browsers send it on form POSTs, Playwright's APIRequestContext does not.
const CSRF_HEADERS = { Origin: BASE, Referer: `${BASE}/` };

// ── tiny test harness ──
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
  ok(JSON.stringify(actual) === JSON.stringify(expected), `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();

// A GET /login does not touch the database, so bootstrap the schema and seed
// through one harmless POST before opening the fixture database directly.
await ctx.request.post(`${BASE}/login`, {
  form: { username: '__warmup__', password: 'x' },
  headers: CSRF_HEADERS,
  maxRedirects: 0,
});

// ── DB helpers (opened after the server bootstrapped the schema) ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const q = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const userByName = (name) => q('SELECT * FROM users WHERE username = ?', name);

const SHOT_DIR = join(process.cwd(), 'download', 'qa');
if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true });

/** POST /login and return { status, location, setCookie } (no redirects). */
async function postLogin(username, password, redirect = '/') {
  const res = await ctx.request.post(`${BASE}/login`, {
    form: { username, password, redirect },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  const setCookies = res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value);
  return { status: res.status(), location: res.headers()['location'] ?? '', setCookies };
}

/** Open /login?<params> in a FRESH context (no session cookie) and return the page. */
async function loginPageWith(params) {
  const fresh = await browser.newContext();
  const page = await fresh.newPage();
  await page.goto(`${BASE}/login?${params}`);
  return { fresh, page };
}

console.log(`\n▶ E2E auth lockout — ${BASE}\n`);

try {
  const emp = userByName('employee');
  const adm = userByName('admin');
  ok(!!emp && !!adm, 'seeded roles exist (employee, admin)');

  // ─────────────── A. Successful login + cookie flags ───────────────
  console.log('── Scenario A: successful login → session row + secure cookie ──');
  db.prepare('DELETE FROM sessions').run();

  // The login form carries a redirect target; passing one exercises the
  // open-redirect-safe passthrough and lands straight on the target.
  const a = await postLogin('employee', PASS, '/employee');
  ok(a.status === 302 && a.location === '/employee', `A. correct login → 302 /employee (got ${a.status} ${a.location})`);

  const aCookie = a.setCookies.find((c) => c.startsWith('qc_session='));
  ok(!!aCookie, 'A. Set-Cookie contains qc_session');
  if (aCookie) {
    ok(/HttpOnly/i.test(aCookie), 'A. qc_session is HttpOnly');
    ok(/SameSite=lax/i.test(aCookie), 'A. qc_session SameSite=lax');
    ok(/Path=\//i.test(aCookie), 'A. qc_session Path=/');
    ok(/Max-Age=43200/i.test(aCookie), `A. qc_session Max-Age=43200 (12h) (got ${(aCookie.match(/Max-Age=(\d+)/) ?? [])[1]})`);
    // Secure follows the actual request scheme: the acceptance runner is HTTP;
    // production deployments are expected to exercise this over HTTPS.
    const secureExpected = BASE.startsWith('https://');
    ok(
      secureExpected === /Secure/i.test(aCookie),
      `A. qc_session Secure flag matches request scheme (expected ${secureExpected})`,
    );
  }

  const aToken = (aCookie ?? '').split(';')[0].split('=')[1];
  const aSession = q('SELECT * FROM sessions WHERE token = ?', aToken);
  ok(!!aSession, 'A. session row stored in sessions table');
  if (aSession) {
    const expiresMs = new Date(aSession.expires_at).getTime();
    const diffH = (expiresMs - Date.now()) / 3_600_000;
    ok(diffH > 11 && diffH <= 12, `A. session expires in ~12h (${diffH.toFixed(2)}h)`);
  }
  const aUser = userByName('employee');
  ok(!!aUser.last_login_at, 'A. last_login_at recorded on success');
  ok(Number(aUser.failed_login_attempts) === 0, 'A. failed_login_attempts reset to 0');

  // Login/logout integration contract: logout is a CSRF-protected POST that
  // destroys the server-side session and clears the browser cookie.
  const logout = await ctx.request.post(`${BASE}/logout`, {
    form: {},
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  ok(logout.status() === 302 && logout.headers()['location'] === '/login', 'A. logout redirects to /login');
  ok(!q('SELECT 1 FROM sessions WHERE token = ?', aToken), 'A. logout destroys the server-side session');

  // ─────────────── B. Generic invalid credentials ───────────────
  console.log('── Scenario B: wrong password → generic message ──');
  const b = await postLogin('employee', 'wrong-password');
  ok(b.status === 302 && b.location.includes('error=1'), `B. bad password → /login?error=1 (got ${b.location})`);
  const bUser = userByName('employee');
  ok(Number(bUser.failed_login_attempts) === 1, `B. counter incremented to 1 (got ${bUser.failed_login_attempts})`);

  // Fresh context (no session cookie) so /login actually renders the form +
  // error instead of redirecting an already-signed-in browser away.
  const { fresh: bFresh, page } = await loginPageWith('error=1');
  await page.waitForSelector('text=Invalid username or password.', { timeout: 10_000 });
  ok(true, 'B. page shows the generic "Invalid username or password." message');
  await bFresh.close();

  // ─────────────── C. Lockout after 5 consecutive failures ───────────────
  console.log('── Scenario C: 5 failures → 10-minute lock ──');
  // B left the counter at 1; 3 more failures → 4 (below the threshold).
  for (let i = 0; i < 3; i++) {
    await postLogin('employee', 'wrong-password');
  }
  const cUser = userByName('employee');
  ok(Number(cUser.failed_login_attempts) === 4, `C. counter reaches 4 (got ${cUser.failed_login_attempts})`);
  ok(!cUser.locked_until, 'C. not locked yet below the threshold');

  // The 5th consecutive failure triggers the lock (per spec: lock AFTER 5
  // failed attempts) and the counter resets for the post-lock window.
  await postLogin('employee', 'wrong-password');
  const cLocked = userByName('employee');
  ok(!!cLocked.locked_until, 'C. locked_until is set after the 5th failed attempt');
  if (cLocked.locked_until) {
    const minutes = (new Date(cLocked.locked_until).getTime() - Date.now()) / 60_000;
    ok(minutes > 9 && minutes <= 10, `C. lock duration ≈ 10 minutes (${minutes.toFixed(2)}m)`);
  }
  ok(Number(cLocked.failed_login_attempts) === 0, 'C. failure counter reset on lock');

  // Correct password while locked → still rejected with the generic message.
  const cCorrect = await postLogin('employee', PASS, '/employee');
  ok(cCorrect.status === 302 && cCorrect.location.includes('error=1'), `C. correct password while locked → generic /login?error=1 (got ${cCorrect.location})`);

  const { fresh: cFresh, page: cPage } = await loginPageWith('error=1');
  await cPage.waitForSelector('text=Invalid username or password.', { timeout: 10_000 });
  ok(true, 'C. locked account shows the generic login message');
  await cFresh.close();

  const cAudit = all('SELECT * FROM login_attempts WHERE username = ? AND succeeded = 0', 'employee');
  ok(cAudit.length >= 6, `C. failed attempts audited in login_attempts (${cAudit.length})`);
  ok(cAudit.every((r) => !!r.ip_address), 'C. audit rows carry an IP address');
  ok(cAudit.every((r) => !('password' in r)), 'C. audit rows never store the password');

  // ─────────────── D. Lock expiry → fresh attempts ───────────────
  console.log('── Scenario D: lock expiry (simulated) unblocks the account ──');
  db.prepare('UPDATE users SET locked_until = ? WHERE username = ?').run(
    new Date(Date.now() - 1000).toISOString(),
    'employee',
  );
  const d = await postLogin('employee', PASS, '/employee');
  ok(d.status === 302 && d.location === '/employee', `D. correct login after lock expiry → /employee (got ${d.status} ${d.location})`);
  const dUser = userByName('employee');
  ok(!dUser.locked_until && Number(dUser.failed_login_attempts) === 0, 'D. lock cleared + counter reset on expiry');

  // ─────────────── E. Success resets the counter ───────────────
  console.log('── Scenario E: successful login resets the counter ──');
  for (let i = 0; i < 3; i++) await postLogin('employee', 'wrong-password');
  ok(Number(userByName('employee').failed_login_attempts) === 3, 'E. counter at 3 after 3 failures');
  const e = await postLogin('employee', PASS, '/employee');
  ok(e.status === 302 && e.location === '/employee', `E. correct login still works below the threshold (got ${e.status})`);
  ok(Number(userByName('employee').failed_login_attempts) === 0, 'E. counter reset to 0 on success');

  // ─────────────── F. Admin password reset clears the lock ───────────────
  console.log('── Scenario F: admin password reset unblocks the account ──');
  for (let i = 0; i < 6; i++) await postLogin('employee', 'wrong-password');
  ok(!!userByName('employee').locked_until, 'F. employee is locked');

  // The admin actions need a REAL admin session (never the employee context).
  const adminCtx = await browser.newContext();
  const adminRes = await adminCtx.request.post(`${BASE}/login`, {
    form: { username: 'admin', password: PASS, redirect: '/admin/users' },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  ok(adminRes.status() === 302, `F. admin signs in (got ${adminRes.status()})`);
  const fReset = await adminCtx.request.post(`${BASE}/admin/users/api`, {
    form: { action: 'reset_password', user_id: String(emp.id), password: 'newpass123' },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  ok(fReset.status() === 302, `F. admin reset_password → redirect (got ${fReset.status()})`);
  const fUser = userByName('employee');
  ok(!fUser.locked_until && Number(fUser.failed_login_attempts) === 0, 'F. lock + counter cleared after reset');
  ok(Number(fUser.must_change_password) === 1, 'F. admin reset re-enabled must_change_password=1');
  // The reset password is temporary: the first login lands on the forced
  // password-change flow instead of the requested role home.
  const fLogin = await postLogin('employee', 'newpass123', '/employee');
  ok(fLogin.status === 302 && fLogin.location === '/account/security', `F. employee login after reset → forced /account/security (got ${fLogin.status} ${fLogin.location})`);
  await ctx.request.post(`${BASE}/logout`, {
    form: {},
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  // The dedicated lifecycle suite covers the forced flow itself; clear the
  // flag here so scenarios G/H keep their existing redirect expectations.
  db.prepare('UPDATE users SET must_change_password = 0 WHERE username = ?').run('employee');

  // ─────────────── G. Reactivation clears the lock ───────────────
  console.log('── Scenario G: reactivation unblocks the account ──');
  // Reset the cross-account/IP audit window between independent scenarios so
  // the account-lockout assertion is not short-circuited by the IP limiter.
  db.prepare('DELETE FROM login_attempts').run();
  for (let i = 0; i < 6; i++) await postLogin('employee', 'wrong-password');
  ok(!!userByName('employee').locked_until, 'G. employee is locked again');
  await adminCtx.request.post(`${BASE}/admin/users/api`, {
    form: { action: 'toggle_active', user_id: String(emp.id), value: '0' },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  await adminCtx.request.post(`${BASE}/admin/users/api`, {
    form: { action: 'toggle_active', user_id: String(emp.id), value: '1' },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  const gUser = userByName('employee');
  ok(!gUser.locked_until && Number(gUser.failed_login_attempts) === 0, 'G. lock + counter cleared after reactivation');
  const gLogin = await postLogin('employee', 'newpass123', '/employee');
  ok(gLogin.status === 302 && gLogin.location === '/employee', `G. employee logs in after reactivation (got ${gLogin.status} ${gLogin.location})`);
  await adminCtx.close();

  // ─────────────── H. Deactivated account → generic message ───────────────
  console.log('── Scenario H: deactivated account → generic message, no counter bumps ──');
  db.prepare('UPDATE users SET is_active = 0, failed_login_attempts = 0, locked_until = NULL WHERE username = ?').run('employee');
  const h = await postLogin('employee', 'newpass123', '/employee');
  ok(h.status === 302 && h.location.includes('error=1'), `H. disabled account → generic /login?error=1 (got ${h.location})`);
  const hUser = userByName('employee');
  ok(Number(hUser.failed_login_attempts) === 0, 'H. disabled account does not accumulate failures');
  const { fresh: hFresh, page: hPage } = await loginPageWith('error=1');
  await hPage.waitForSelector('text=Invalid username or password.', { timeout: 10_000 });
  ok(true, 'H. disabled account shows the generic login message');
  await hFresh.close();
  db.prepare('UPDATE users SET is_active = 1 WHERE username = ?').run('employee');

  // ─────────────── I. Anonymous → redirect to login ───────────────
  console.log('── Scenario I: anonymous request → 302 to /login ──');
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.request.get(`${BASE}/manager`, { maxRedirects: 0 });
  ok(
    anon.status() === 302 && (anon.headers()['location'] ?? '').startsWith('/login?redirect='),
    `I. anonymous /manager → 302 /login?redirect= (got ${anon.status()} ${anon.headers()['location']})`,
  );
  await anonCtx.close();

  console.log('   📸 (no screenshots for auth flow)');
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  // ── cleanup: remove test data, keep seeded users ──
  db.prepare('DELETE FROM sessions').run();
  db.prepare('DELETE FROM login_attempts').run();
  db.prepare('UPDATE users SET is_active = 1, failed_login_attempts = 0, locked_until = NULL WHERE username IN (?)').run('employee');
  await browser.close();
  db.close();
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('ALL PASS ✅');
