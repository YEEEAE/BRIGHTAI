// E2E spec for the admin user-management page (/admin/users).
//
// Verifies against a LIVE server sharing the same SQLite DB (QC_DATABASE_PATH):
//   1. Admin-only access + the full column set (incl. Last login).
//   2. Create user with a department (defaults to QC when blank).
//   3. New users can sign in immediately; they land on the forced
//      password-change flow (/account/security) because an admin-set
//      temporary password flags must_change_password (lifecycle detail is
//      covered by scripts/e2e-auth-password-flow.mjs).
//   4. Duplicate username → safe user-friendly flash error.
//   5. Password shorter than 8 chars → rejected.
//   6. Edit user: full name / role / department / can_create_tasks / is_active.
//   7. Admin cannot change their OWN role (self-demotion blocked).
//   8. Admin cannot deactivate their OWN account (via edit or toggle).
//   9. Username is immutable (no update path; survives edits untouched).
//  10. Password hashes never appear in the page HTML.
//  11. Zod server-side validation on create / edit / reset-password forms.
//  12. Reset password lets the user sign in with the new password and
//      re-enables must_change_password (forced change on next login).
//
// Usage: run against the built server:
//   pnpm build && PORT=4398 QC_DATABASE_PATH=<tmp.db> QC_SEED_MUST_CHANGE_PASSWORD=0 node dist/server/entry.mjs
//   QC_DATABASE_PATH=<tmp.db> node scripts/e2e-admin-users.mjs
// QC_SEED_MUST_CHANGE_PASSWORD=0 is the documented E2E fixture opt-out of the
// seeded first-login flag (never set it on a real deployment); this suite
// exercises the flag itself explicitly in scenarios 3 and 12.

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4398';
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
const adminCtx = await browser.newContext();

// Warm up: a GET /login never touches the DB (getSession bails before it), so
// the FIRST request that bootstraps schema + seed is a login POST. Fire one
// before the test opens the DB file directly, otherwise the schema is missing.
await adminCtx.request.post(`${BASE}/login`, {
  form: { username: '__warmup__', password: 'x' },
  headers: CSRF_HEADERS,
  maxRedirects: 0,
});

// ── DB helpers (opened AFTER the server bootstrapped the schema) ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const q = (sql, ...p) => db.prepare(sql).get(...p);
const userByName = (name) => q('SELECT * FROM users WHERE username = ?', name);

/** POST a form to /admin/users/api without following redirects. */
async function postAction(ctx, form) {
  const res = await ctx.request.post(`${BASE}/admin/users/api`, {
    form,
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  return { status: res.status(), location: res.headers()['location'] ?? '' };
}

/** Sign in and keep the session cookie inside `ctx`. */
async function login(ctx, username, password, redirect = '/') {
  const res = await ctx.request.post(`${BASE}/login`, {
    form: { username, password, redirect },
    headers: CSRF_HEADERS,
    maxRedirects: 0,
  });
  return { status: res.status(), location: res.headers()['location'] ?? '' };
}

/** Open /admin/users in `ctx` and read the flash message (if any). */
async function adminUsersFlash(ctx) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/users`);
  const flash = await page.locator('[role="alert"]').first().textContent().catch(() => null);
  const html = await page.content();
  await page.close();
  return { flash: (flash ?? '').trim(), html };
}

console.log(`\n▶ E2E admin users — ${BASE}\n`);

const testUsers = [];
try {
  const adm = userByName('admin');
  ok(!!adm, 'seeded admin exists');

  // ─────────────── 1. Admin-only + full column set ───────────────
  console.log('── 1. Access control + table columns ──');
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.request.get(`${BASE}/admin/users`, { maxRedirects: 0 });
  ok(
    anon.status() === 302 && (anon.headers()['location'] ?? '').startsWith('/login?redirect='),
    `1a. anonymous /admin/users → 302 login (got ${anon.status()})`,
  );
  await anonCtx.close();

  const empCtx = await browser.newContext();
  await login(empCtx, 'employee', PASS);
  const empDenied = await empCtx.request.get(`${BASE}/admin/users`, { maxRedirects: 0 });
  ok(
    empDenied.status() === 302 && (empDenied.headers()['location'] ?? '').startsWith('/employee'),
    `1b. employee /admin/users → 302 /employee (got ${empDenied.status()} ${empDenied.headers()['location']})`,
  );
  await empCtx.close();

  const aLogin = await login(adminCtx, 'admin', PASS, '/admin/users');
  ok(aLogin.status === 302 && aLogin.location === '/admin/users', `1c. admin signs in → /admin/users (got ${aLogin.status})`);
  const { html: adminHtml } = await adminUsersFlash(adminCtx);
  const requiredCols = ['Username', 'Name', 'Role', 'Department', 'Can create', 'Active', 'Created', 'Last login'];
  for (const col of requiredCols) {
    ok(adminHtml.includes(`>${col}<`), `1d. table column "${col}" present`);
  }
  const adminRow = userByName('admin');
  ok(!!adminRow.last_login_at, '1e. last_login_at recorded for admin after login');

  // ─────────────── 2 + 3. Create with department; immediate login ───────────────
  console.log('── 2/3. Create user (department) + immediate login ──');
  const c1 = await postAction(adminCtx, {
    action: 'create',
    username: 'e2e_emp',
    full_name: 'E2E Employee',
    password: 'pass12345',
    role: 'employee',
    department: 'Lab',
    can_create_tasks: '1',
  });
  ok(c1.status === 302, `2a. create user → 302 (got ${c1.status})`);
  let emp = userByName('e2e_emp');
  if (emp) testUsers.push(emp.id);
  ok(!!emp, '2b. e2e_emp row exists');
  ok(emp.department === 'Lab', `2c. department saved as "Lab" (got "${emp.department}")`);
  ok(Number(emp.is_active) === 1 && Number(emp.can_create_tasks) === 1, '2d. active + can_create_tasks=1 on create');

  // Department omitted/blank → defaults to QC.
  await postAction(adminCtx, {
    action: 'create',
    username: 'e2e_qc',
    full_name: 'E2E QC',
    password: 'pass12345',
    role: 'supervisor',
    department: '',
  });
  const qcUser = userByName('e2e_qc');
  if (qcUser) testUsers.push(qcUser.id);
  ok(qcUser.department === 'QC', `2e. blank department defaults to QC (got "${qcUser.department}")`);

  // The new user signs in immediately (no admin approval step). Because the
  // password was chosen by an ADMIN, the first login is forced through the
  // password-change flow (must_change_password = 1 at creation).
  const fresh = await browser.newContext();
  const nLogin = await login(fresh, 'e2e_emp', 'pass12345', '/employee');
  ok(
    nLogin.status === 302 && nLogin.location === '/account/security',
    `3. new user logs in immediately → forced /account/security (got ${nLogin.status} ${nLogin.location})`,
  );
  ok(Number(userByName('e2e_emp').must_change_password) === 1, '3b. created user is flagged must_change_password=1');
  await fresh.close();
  // The dedicated lifecycle suite covers the forced flow itself; clear the
  // flag here so the following user-management scenarios keep their existing
  // redirect expectations.
  db.prepare('UPDATE users SET must_change_password = 0 WHERE username = ?').run('e2e_emp');

  // ─────────────── 4 + 5. Duplicate username + short password ───────────────
  console.log('── 4/5. Duplicate username + password min length ──');
  await postAction(adminCtx, {
    action: 'create',
    username: 'e2e_emp',
    full_name: 'Dup',
    password: 'pass12345',
    role: 'employee',
  });
  const dup = await adminUsersFlash(adminCtx);
  ok(dup.flash.includes('already taken'), `4. duplicate username → friendly error (got "${dup.flash}")`);

  await postAction(adminCtx, {
    action: 'create',
    username: 'e2e_short',
    full_name: 'Short Pass',
    password: 'short',
    role: 'employee',
  });
  const short = await adminUsersFlash(adminCtx);
  ok(short.flash.includes('at least 8 characters'), `5. short password → error (got "${short.flash}")`);
  ok(!userByName('e2e_short'), '5b. no row created for invalid password');

  // ─────────────── 6. Edit user (all editable fields) ───────────────
  console.log('── 6. Edit user ──');
  const e1 = await postAction(adminCtx, {
    action: 'edit',
    user_id: String(emp.id),
    full_name: 'E2E Renamed',
    role: 'supervisor',
    department: 'Ops',
    can_create_tasks: '0',
    is_active: '0',
  });
  ok(e1.status === 302, `6a. edit user → 302 (got ${e1.status})`);
  let after = userByName('e2e_emp');
  ok(after.full_name === 'E2E Renamed', `6b. full name updated (got "${after.full_name}")`);
  ok(after.role === 'supervisor', `6c. role updated to supervisor (got "${after.role}")`);
  ok(after.department === 'Ops', `6d. department updated to Ops (got "${after.department}")`);
  ok(Number(after.can_create_tasks) === 0, '6e. can_create_tasks flipped to 0');
  ok(Number(after.is_active) === 0, '6f. is_active flipped to 0');
  ok(after.username === 'e2e_emp', `9a. username unchanged after edit (got "${after.username}")`);
  const disCtx = await browser.newContext();
  const disabledLogin = await login(disCtx, 'e2e_emp', 'pass12345');
  await disCtx.close();
  ok(
    disabledLogin.status === 302 && disabledLogin.location.includes('error=1'),
    `6g. deactivated user cannot sign in (got ${disabledLogin.location})`,
  );

  // Reactivate + demote role back for the next scenarios.
  await postAction(adminCtx, {
    action: 'edit',
    user_id: String(emp.id),
    full_name: 'E2E Renamed',
    role: 'employee',
    department: 'Ops',
    can_create_tasks: '0',
    is_active: '1',
  });

  // 6h. Reactivation via the EDIT form clears the brute-force lock — the same
  // behavior as the toggle button (the sanctioned unblock path).
  const lockCtx = await browser.newContext();
  for (let i = 0; i < 5; i++) await login(lockCtx, 'e2e_emp', 'wrong-pass');
  await lockCtx.close();
  ok(!!userByName('e2e_emp').locked_until, '6h1. e2e_emp locked after 5 failed logins');
  await postAction(adminCtx, {
    action: 'edit',
    user_id: String(emp.id),
    full_name: 'E2E Renamed',
    role: 'employee',
    department: 'Ops',
    can_create_tasks: '0',
    is_active: '0',
  });
  await postAction(adminCtx, {
    action: 'edit',
    user_id: String(emp.id),
    full_name: 'E2E Renamed',
    role: 'employee',
    department: 'Ops',
    can_create_tasks: '0',
    is_active: '1',
  });
  const unlocked = userByName('e2e_emp');
  ok(!unlocked.locked_until && Number(unlocked.failed_login_attempts) === 0, '6h2. edit-reactivation clears lock + counter');

  // ─────────────── 7 + 8. Self-demotion / self-deactivation blocked ───────────────
  console.log('── 7/8. Admin cannot demote or deactivate their own account ──');
  const s1 = await postAction(adminCtx, {
    action: 'edit',
    user_id: String(adm.id),
    full_name: 'Administrator',
    role: 'manager',
    department: 'QC',
    can_create_tasks: '1',
    is_active: '1',
  });
  const s1Flash = await adminUsersFlash(adminCtx);
  ok(s1Flash.flash.includes('cannot change your own role'), `7. self-role change blocked (got "${s1Flash.flash}")`);
  ok(userByName('admin').role === 'admin', '7b. admin role still admin in DB');

  const s2 = await postAction(adminCtx, {
    action: 'edit',
    user_id: String(adm.id),
    full_name: 'Administrator',
    role: 'admin',
    department: 'QC',
    can_create_tasks: '1',
    is_active: '0',
  });
  const s2Flash = await adminUsersFlash(adminCtx);
  ok(s2Flash.flash.includes('cannot deactivate your own account'), `8. self-deactivation blocked (got "${s2Flash.flash}")`);
  ok(Number(userByName('admin').is_active) === 1, '8b. admin still active in DB');

  // The toggle route is blocked too (defense in depth).
  const s3 = await postAction(adminCtx, {
    action: 'toggle_active',
    user_id: String(adm.id),
    value: '0',
  });
  const s3Flash = await adminUsersFlash(adminCtx);
  ok(s3Flash.flash.includes('cannot deactivate your own account'), `8c. toggle_active self blocked (got "${s3Flash.flash}")`);
  ok(Number(userByName('admin').is_active) === 1, '8d. admin still active after toggle attempt');

  // Benign self-edit (same role, still active) still works.
  const s4 = await postAction(adminCtx, {
    action: 'edit',
    user_id: String(adm.id),
    full_name: 'Administrator',
    role: 'admin',
    department: 'QC',
    can_create_tasks: '1',
    is_active: '1',
  });
  ok(s4.status === 302, '7c. benign self-edit still allowed');

  // ─────────────── 9. Username immutable (no update path) ───────────────
  console.log('── 9. Username immutability ──');
  const before = userByName('e2e_emp').username;
  await postAction(adminCtx, {
    action: 'edit',
    user_id: String(emp.id),
    full_name: 'E2E Renamed',
    role: 'employee',
    department: 'Ops',
    can_create_tasks: '0',
    is_active: '1',
  });
  eq(userByName('e2e_emp').username, before, '9b. username identical after edit (no username field in payload)');

  // ─────────────── 10. No password hashes in the page ───────────────
  console.log('── 10. Password hashes never exposed ──');
  const page = await adminCtx.newPage();
  await page.goto(`${BASE}/admin/users`);
  const html = await page.content();
  ok(!html.includes('password_hash'), '10a. HTML contains no password_hash column');
  ok(!html.includes('$2a$'), '10b. HTML contains no bcrypt hash values');
  ok(!html.includes('password_hash') && !html.includes('pass12345'), '10c. HTML leaks no hashes or plaintext passwords');
  await page.close();

  // ─────────────── 11. Zod server-side validation on forms ───────────────
  console.log('── 11. Zod validation (create / edit / reset) ──');
  await postAction(adminCtx, {
    action: 'edit',
    user_id: String(emp.id),
    full_name: '',
    role: 'employee',
    department: 'Ops',
    can_create_tasks: '0',
    is_active: '1',
  });
  const v1 = await adminUsersFlash(adminCtx);
  ok(v1.flash.includes('Full name is required'), `11a. empty full name → error (got "${v1.flash}")`);

  await postAction(adminCtx, {
    action: 'edit',
    user_id: String(emp.id),
    full_name: 'E2E Renamed',
    role: 'bogus',
    department: 'Ops',
    can_create_tasks: '0',
    is_active: '1',
  });
  const v2 = await adminUsersFlash(adminCtx);
  ok(v2.flash.includes('Invalid role'), `11b. bogus role → error (got "${v2.flash}")`);

  await postAction(adminCtx, {
    action: 'reset_password',
    user_id: String(emp.id),
    password: 'tiny',
  });
  const v3 = await adminUsersFlash(adminCtx);
  ok(v3.flash.includes('at least 8 characters'), `11c. short reset password → error (got "${v3.flash}")`);

  await postAction(adminCtx, {
    action: 'create',
    username: 'e2e_bad',
    full_name: 'Bad',
    password: 'pass12345',
    role: 'nope',
  });
  const v4 = await adminUsersFlash(adminCtx);
  ok(v4.flash.includes('Invalid role'), `11d. create with bogus role → error (got "${v4.flash}")`);

  // ─────────────── 12. Reset password → immediate sign-in ───────────────
  console.log('── 12. Reset password ──');
  await postAction(adminCtx, {
    action: 'reset_password',
    user_id: String(emp.id),
    password: 'brandnew99',
  });
  const rCtx = await browser.newContext();
  const rLogin = await login(rCtx, 'e2e_emp', 'brandnew99', '/employee');
  ok(
    rLogin.status === 302 && rLogin.location === '/account/security',
    `12. user signs in with the reset password → forced /account/security (got ${rLogin.status} ${rLogin.location})`,
  );
  ok(Number(userByName('e2e_emp').must_change_password) === 1, '12b. admin reset re-enabled must_change_password=1');
  await rCtx.close();
  db.prepare('UPDATE users SET must_change_password = 0 WHERE username = ?').run('e2e_emp');

  // ─────────────── Regression: toggle_create still works ───────────────
  console.log('── Regression: toggle_create ──');
  await postAction(adminCtx, {
    action: 'toggle_create',
    user_id: String(emp.id),
    value: '1',
  });
  ok(Number(userByName('e2e_emp').can_create_tasks) === 1, 'R1. toggle_create grants can_create_tasks');

  console.log('   📸 (no screenshots for admin-users flow)');
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  // ── cleanup: remove test users + sessions, keep seeded accounts ──
  for (const id of testUsers) {
    try {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    } catch {
      /* row already gone */
    }
  }
  db.prepare('UPDATE users SET full_name = ? WHERE username = ?').run('Administrator', 'admin');
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
