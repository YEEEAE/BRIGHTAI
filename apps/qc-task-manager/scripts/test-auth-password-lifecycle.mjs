// Unit suite: first-login password lifecycle (migration 036).
//
// Covers the service layer against a real temp SQLite database:
//   1. Migration 036 applied (schema version 36).
//   2. Fresh seeded accounts are flagged must_change_password = 1.
//   3. Admin-created users are flagged must_change_password = 1.
//   4. Admin password reset re-flags an unflagged account and clears
//      password_changed_at.
//   5. Session payload exposes mustChangePassword (read from the live row).
//   6. changeOwnPassword: wrong current password rejected; short new password
//      rejected by the existing policy; confirmation mismatch is a form-level
//      schema concern (asserted in the E2E suite); success clears the flag,
//      stamps password_changed_at, invalidates every OTHER session, and keeps
//      the current session.
//   7. The QC_SEED_MUST_CHANGE_PASSWORD=0 fixture opt-out (child process).
//   8. No password value or hash fragment is ever logged by the service layer.
//
// Run: pnpm test:auth-password-lifecycle

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const temp = mkdtempSync(join(tmpdir(), 'brightai-pw-lifecycle-'));
const dbPath = join(temp, 'lifecycle.db');
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

// Never let an ambient fixture variable weaken the default-enforcement test.
delete process.env.QC_SEED_MUST_CHANGE_PASSWORD;
process.env.QC_DATABASE_PATH = dbPath;
process.env.QC_DB_PATH = '';
// Deterministic, non-default seed credential (allowed outside production).
process.env.ADMIN_DEFAULT_PASSWORD = 'lifecycle-seed-pass-2026';

// Console capture: the service layer must never log passwords or hashes.
const SECRETS = [
  'lifecycle-seed-pass-2026', // seeded credential
  'TempPass-Admin-Set-9', // admin-created credential
  'Reset-Temporary-77', // admin reset credential
  'MyOwn-New-Pass-2026', // self-service new password
  '$2a$10$', '$2b$10$', '$2y$10$', // bcrypt hash prefixes
];
const consoleLines = [];
for (const method of ['log', 'warn', 'error', 'info']) {
  const original = console[method].bind(console);
  console[method] = (...args) => {
    consoleLines.push(args.map((a) => String(a)).join(' '));
    // Keep the output for debugging while still capturing it.
    original(...args);
  };
}

try {
  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const { verifyCredentials, createSession, getSession, changeOwnPassword, getUserById } = await import('../src/lib/auth.ts');
  const { createUser, resetPassword } = await import('../src/lib/users.ts');

  const db = getDb();

  // ── 1. Migration 036 applied ──
  const version = db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get();
  ok(version.v === 36, `1. schema version is 36 (got ${version.v})`);
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  ok(cols.includes('must_change_password') && cols.includes('password_changed_at'), '1b. users has lifecycle columns');

  // ── 2. Fresh seeded accounts are flagged ──
  const seeded = db.prepare('SELECT username, must_change_password FROM users').all();
  ok(seeded.length === 4, `2. four seeded accounts (got ${seeded.length})`);
  ok(seeded.every((u) => Number(u.must_change_password) === 1), '2b. every seeded account has must_change_password=1');

  // ── 5. Session payload exposes the flag (read-time, not stored) ──
  const adminRow = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
  const adminUser = getUserById(Number(adminRow.id));
  assert.ok(adminUser, 'seeded admin resolves through getUserById');
  const adminToken = createSession(adminUser);
  const adminSession = getSession(adminToken);
  ok(adminSession?.mustChangePassword === true, '5. SessionData.mustChangePassword=true for a flagged account');

  // ── 3. Admin-created user is flagged ──
  const created = createUser({ id: adminUser.id, username: adminUser.username }, {
    username: 'pilot_emp',
    fullName: 'Pilot Employee',
    password: 'TempPass-Admin-Set-9',
    role: 'employee',
    department: 'QC',
    canCreateTasks: true,
  });
  ok(created.ok === true, '3. admin-created user persisted');
  const pilot = db.prepare("SELECT * FROM users WHERE username = 'pilot_emp'").get();
  ok(Number(pilot.must_change_password) === 1, '3b. created user has must_change_password=1');

  // ── 4. Admin reset re-flags + clears password_changed_at ──
  db.prepare("UPDATE users SET must_change_password = 0, password_changed_at = '2026-01-01T00:00:00.000Z' WHERE username = 'pilot_emp'").run();
  const reset = resetPassword({ id: adminUser.id, username: adminUser.username }, Number(pilot.id), 'Reset-Temporary-77');
  ok(reset.ok === true, '4. admin reset accepted');
  const afterReset = db.prepare("SELECT must_change_password, password_changed_at FROM users WHERE username = 'pilot_emp'").get();
  ok(Number(afterReset.must_change_password) === 1, '4b. reset re-enabled must_change_password=1');
  ok(afterReset.password_changed_at === null, '4c. reset cleared password_changed_at until the user changes it');

  // ── 6. Self-service change ──
  const pilotUser = getUserById(Number(pilot.id));
  assert.ok(pilotUser, 'created pilot user resolves through getUserById');
  const tokenA = createSession(pilotUser);
  const tokenB = createSession(pilotUser);
  ok(getSession(tokenA)?.mustChangePassword === true, '6. pilot session reflects the flag');

  // 6a. Wrong current password rejected.
  const wrongCurrent = changeOwnPassword(pilotUser.id, 'Wrong-Current-1', 'MyOwn-New-Pass-2026', tokenA);
  ok(wrongCurrent.ok === false && wrongCurrent.error === 'Current password is incorrect.', '6a. wrong current password rejected with the generic message');

  // 6b. New password below the existing policy rejected.
  const tooShort = changeOwnPassword(pilotUser.id, 'Reset-Temporary-77', 'short', tokenA);
  ok(tooShort.ok === false && tooShort.error.includes('at least 8 characters'), '6b. short new password rejected by the existing policy');

  // 6c. Successful change: flag cleared, timestamp stamped, OTHER session dead,
  //     current session alive.
  const changed = changeOwnPassword(pilotUser.id, 'Reset-Temporary-77', 'MyOwn-New-Pass-2026', tokenA);
  ok(changed.ok === true, '6c. password change accepted');
  const afterChange = db.prepare("SELECT must_change_password, password_changed_at FROM users WHERE username = 'pilot_emp'").get();
  ok(Number(afterChange.must_change_password) === 0, '6d. must_change_password cleared after the change');
  ok(!!afterChange.password_changed_at, '6e. password_changed_at stamped');
  ok(getSession(tokenB) === null, '6f. the OTHER session was invalidated');
  ok(getSession(tokenA)?.username === 'pilot_emp', '6g. the CURRENT session survives');
  ok(getSession(tokenA)?.mustChangePassword === false, '6h. session flag now false');
  // Old password no longer verifies; new one does (same generic invalid path).
  ok(verifyCredentials('pilot_emp', 'Reset-Temporary-77').status === 'invalid', '6i. old password rejected');
  ok(verifyCredentials('pilot_emp', 'MyOwn-New-Pass-2026').status === 'ok', '6j. new password verifies');

  // ── 8. No password/hash in service-layer logs ──
  const leaked = consoleLines.filter((line) => SECRETS.some((s) => line.includes(s)));
  ok(leaked.length === 0, `8. no password/hash fragment in console output (${leaked.length} leaks)`);

  closeDatabase();

  // ── 7. Fixture opt-out runs in a child process (fresh env + fresh DB) ──
  const childDb = join(temp, 'optout.db');
  const fixture = join(temp, 'seed-optout-fixture.mjs');
  writeFileSync(fixture, `
    process.env.QC_DATABASE_PATH = ${JSON.stringify(childDb)};
    process.env.QC_DB_PATH = '';
    process.env.ADMIN_DEFAULT_PASSWORD = 'lifecycle-seed-pass-2026';
    process.env.QC_SEED_MUST_CHANGE_PASSWORD = '0';
    const { getDb } = await import(${JSON.stringify(join(process.cwd(), 'src/lib/db.ts'))});
    const db = getDb();
    const rows = db.prepare('SELECT must_change_password FROM users').all();
    console.log('FLAGGED=' + rows.filter((r) => Number(r.must_change_password) === 1).length + ' TOTAL=' + rows.length);
  `);
  const child = spawnSync(process.execPath, [
    '--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types', fixture,
  ], { cwd: process.cwd(), encoding: 'utf8', timeout: 60_000 });
  const out = (child.stdout ?? '') + (child.stderr ?? '');
  ok(child.status === 0 && out.includes('FLAGGED=0 TOTAL=4'), `7. QC_SEED_MUST_CHANGE_PASSWORD=0 seeds unflagged fixtures (got: ${out.match(/FLAGGED=\d+ TOTAL=\d+/)?.[0] ?? child.stderr.slice(-200)})`);
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ suite crashed:', err);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('ALL PASS ✅');
