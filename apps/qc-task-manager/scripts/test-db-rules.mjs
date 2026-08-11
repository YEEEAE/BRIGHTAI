// Database-backed unit checks for authentication lockout and notification writes.
// This runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path.

import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-unit-'));
const dbPath = join(tempDir, 'rules.db');

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`  ✅ ${message}`);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';

  // Apply the same schema/seed path used by the app before importing DB-backed
  // modules. The child process intentionally owns this temporary database.
  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });
  // Avoid starting the production catch-up backup during this focused test;
  // backup behavior has its own deterministic unit/E2E coverage.
  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { verifyCredentials } = await import('../src/lib/auth.ts');
  const { createNotification, listPersistedNotifications } = await import('../src/lib/notifications.ts');
  const { getDb } = await import('../src/lib/db.ts');

  console.log('\n■ Login lockout');
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = verifyCredentials('employee', 'wrong-password', `192.0.2.${attempt}`);
    assert(result.status === (attempt === 5 ? 'locked' : 'invalid'), `lockout: failed attempt ${attempt} handled`);
  }
  const lockedLogin = verifyCredentials('employee', 'admin123', '198.51.100.10');
  assert(lockedLogin.status === 'locked', 'lockout: correct password rejected while account is locked');

  const db = getDb();
  db.prepare("UPDATE users SET locked_until = datetime('now', '-1 minute'), failed_login_attempts = 0 WHERE username = 'employee'").run();
  const unlockedLogin = verifyCredentials('employee', 'admin123', '198.51.100.11');
  assert(unlockedLogin.status === 'ok', 'lockout: expired lock permits a correct login');
  const auditRows = db.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE username = 'employee' AND succeeded = 0").get();
  assert(Number(auditRows.n) >= 5, 'lockout: failed attempts are audited');

  console.log('\n■ Notification creation');
  const manager = db.prepare("SELECT id FROM users WHERE username = 'manager'").get();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  const task = db.prepare('INSERT INTO tasks (title, created_by, assigned_to) VALUES (?, ?, ?)').run(
    'Notification unit fixture',
    employee.id,
    employee.id,
  );
  const taskId = Number(task.lastInsertRowid);
  createNotification({
    userId: manager.id,
    taskId,
    type: 'assigned',
    title: 'Task assigned',
    message: 'Notification unit fixture was assigned.',
    actorId: employee.id,
  });
  const persisted = listPersistedNotifications(manager.id, 10);
  assert(persisted.some((item) => item.taskId === taskId && item.kind === 'assigned'), 'notifications: active recipient receives persisted notification');
  const activity = db.prepare("SELECT action FROM task_activity_log WHERE task_id = ? AND action = 'notification_created'").get(taskId);
  assert(!!activity, 'notifications: notification creation is recorded in activity history');

  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(manager.id);
  createNotification({
    userId: manager.id,
    taskId,
    type: 'assigned',
    title: 'Should not arrive',
    message: 'Inactive recipients are skipped.',
    actorId: employee.id,
  });
  const inactiveCount = db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND title = 'Should not arrive'").get(manager.id);
  assert(Number(inactiveCount.n) === 0, 'notifications: inactive recipient is never notified');

  console.log('\nDatabase-backed unit checks passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
