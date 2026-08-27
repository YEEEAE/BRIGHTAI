// Durable user-administration audit contract. Runs against a real temporary
// database so event rows, transaction boundaries, and the shared hash chain
// are all exercised together.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const temp = mkdtempSync(join(tmpdir(), 'brightai-user-audit-'));
const dbPath = join(temp, 'user-audit.db');
process.env.QC_DATABASE_PATH = dbPath;
process.env.QC_DB_PATH = '';
process.env.ADMIN_DEFAULT_PASSWORD = 'user-audit-admin-2026';
process.env.QC_SEED_MUST_CHANGE_PASSWORD = '0';

let passed = 0;
let failed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}

function userAuditRows(db) {
  return db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'USER' ORDER BY id ASC").all();
}

try {
  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const { verifyQcAuditChain } = await import('../src/lib/audit/qcChain.ts');
  const {
    createUser,
    updateUser,
    setUserActive,
    setCanCreateTasks,
    resetPassword,
  } = await import('../src/lib/users.ts');

  const db = getDb();
  const admin = db.prepare("SELECT id, username FROM users WHERE username = 'admin'").get();
  assert.ok(admin, 'seeded admin is available');

  const temporaryPassword = 'User-Audit-Temporary-9';
  const resetPasswordValue = 'User-Audit-Reset-9';
  const created = createUser(admin, {
    username: 'audited_employee',
    fullName: 'Audited Employee',
    password: temporaryPassword,
    role: 'employee',
    department: 'QC',
    canCreateTasks: false,
  });
  ok(created.ok === true, 'create succeeds');
  const targetId = created.userId;
  assert.ok(targetId, 'created user id is available');

  ok(userAuditRows(db).at(-1)?.action === 'USER_CREATE', 'create emits USER_CREATE');
  ok(JSON.parse(userAuditRows(db).at(-1).new_value).username === 'audited_employee', 'create audit identifies the target user');

  ok(updateUser(admin, targetId, { role: 'supervisor' }).ok === true, 'role update succeeds');
  ok(userAuditRows(db).at(-1)?.action === 'USER_ROLE_CHANGE', 'role update emits USER_ROLE_CHANGE');

  ok(updateUser(admin, targetId, { fullName: 'Audited Supervisor' }).ok === true, 'profile update succeeds');
  ok(userAuditRows(db).at(-1)?.action === 'USER_UPDATE', 'profile update emits USER_UPDATE');

  ok(setCanCreateTasks(admin, targetId, true).ok === true, 'capability update succeeds');
  ok(userAuditRows(db).at(-1)?.action === 'USER_UPDATE', 'capability update emits USER_UPDATE');

  ok(setUserActive(admin, targetId, false).ok === true, 'deactivation succeeds');
  ok(userAuditRows(db).at(-1)?.action === 'USER_DEACTIVATE', 'deactivation emits USER_DEACTIVATE');
  ok(setUserActive(admin, targetId, true).ok === true, 'activation succeeds');
  ok(userAuditRows(db).at(-1)?.action === 'USER_ACTIVATE', 'activation emits USER_ACTIVATE');

  ok(resetPassword(admin, targetId, resetPasswordValue).ok === true, 'password reset succeeds');
  ok(userAuditRows(db).at(-1)?.action === 'USER_PASSWORD_RESET', 'password reset emits USER_PASSWORD_RESET');

  const beforeFailure = userAuditRows(db).length;
  ok(createUser(admin, {
    username: 'audited_employee',
    fullName: 'Duplicate',
    password: 'Duplicate-Password-9',
    role: 'employee',
    department: 'QC',
    canCreateTasks: false,
  }).ok === false, 'duplicate create is rejected');
  ok(updateUser(admin, targetId, { role: 'not-a-role' }).ok === false, 'invalid update is rejected');
  ok(userAuditRows(db).length === beforeFailure, 'failed mutations emit no successful audit event');

  const auditText = userAuditRows(db)
    .flatMap((row) => [row.old_value, row.new_value, row.note])
    .filter(Boolean)
    .join('\n');
  ok(!auditText.includes(temporaryPassword) && !auditText.includes(resetPasswordValue), 'audit never persists password values');
  ok(!/password_hash|\$2[aby]\$/.test(auditText), 'audit never persists password hashes');
  ok(verifyQcAuditChain(db).status === 'PASS', 'shared QC audit hash chain passes after user events');

  closeDatabase();
} catch (error) {
  failed += 1;
  failures.push(`unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  console.error('❌ suite crashed:', error);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
console.log('ALL PASS ✅');
