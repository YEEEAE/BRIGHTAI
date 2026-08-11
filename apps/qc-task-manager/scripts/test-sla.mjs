import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const {
  calculateSlaSnapshot,
  parseServerTimestamp,
  SLA_STATUSES,
} = await import('../src/lib/sla/index.ts');

const at = (value) => new Date(value);
const base = {
  startedAt: at('2026-08-11T10:00:00.000Z'),
  dueAt: at('2026-08-11T11:00:00.000Z'),
  elapsedSeconds: 0,
  pausedAt: null,
  pauseOnHold: false,
  taskStatus: 'in_progress',
};

assert.equal(parseServerTimestamp('2026-08-11 10:00:00').toISOString(), '2026-08-11T10:00:00.000Z');
assert.deepEqual(SLA_STATUSES, ['NORMAL', 'AT_RISK', 'CRITICAL', 'BREACHED', 'PAUSED']);

assert.equal(calculateSlaSnapshot({ ...base, now: at('2026-08-11T10:20:00.000Z') }).status, 'NORMAL');
assert.equal(calculateSlaSnapshot({ ...base, now: at('2026-08-11T10:45:00.000Z') }).status, 'AT_RISK');
assert.equal(calculateSlaSnapshot({ ...base, now: at('2026-08-11T10:55:00.000Z') }).status, 'CRITICAL');
assert.equal(calculateSlaSnapshot({ ...base, now: at('2026-08-11T11:01:00.000Z') }).status, 'BREACHED');

const defaultHold = calculateSlaSnapshot({ ...base, taskStatus: 'on_hold', now: at('2026-08-11T10:45:00.000Z') });
assert.equal(defaultHold.status, 'AT_RISK');
assert.equal(defaultHold.elapsedSeconds, 2700);

const pausedHold = calculateSlaSnapshot({
  ...base,
  pauseOnHold: true,
  taskStatus: 'on_hold',
  pausedAt: at('2026-08-11T10:30:00.000Z'),
  now: at('2026-08-11T11:30:00.000Z'),
});
assert.equal(pausedHold.status, 'PAUSED');
assert.equal(pausedHold.elapsedSeconds, 1800);
assert.equal(pausedHold.remainingSeconds, 1800);

const completed = calculateSlaSnapshot({ ...base, taskStatus: 'completed', now: at('2026-08-11T10:40:00.000Z') });
assert.equal(completed.elapsedSeconds, 2400);
assert.equal(completed.percentUsed, 66.67);

console.log('SLA pure calculation tests passed.');

const tempDir = mkdtempSync(join(tmpdir(), 'brightai-sla-'));
const dbPath = join(tempDir, 'sla.db');
try {
  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  mkdirSync(join(tempDir, 'backups'), { recursive: true });
  writeFileSync(join(tempDir, 'backups', 'status.json'), JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }));
  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const { stopBackupScheduler } = await import('../src/lib/backup-scheduler.ts');
  const { processEscalations, retryFailedEscalations, refreshTaskSla } = await import('../src/lib/sla/engine.ts');
  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE role = 'employee' LIMIT 1").get();
  db.prepare("INSERT INTO sla_policies (priority, target_duration_seconds, warning_percent, critical_percent, pause_on_hold) VALUES ('high', 100, 70, 90, 0)").run();
  const policy = db.prepare("SELECT id FROM sla_policies WHERE priority = 'high'").get();
  db.prepare("INSERT INTO escalation_policies (threshold_percent, recipient_roles, is_active) VALUES (80, 'employee', 1)").run();
  const escalationPolicy = db.prepare("SELECT id FROM escalation_policies WHERE threshold_percent = 80").get();
  const start = '2026-08-11T10:00:00.000Z';
  const due = '2026-08-11T10:01:40.000Z';
  const task = db.prepare(
    `INSERT INTO tasks (title, department, status, priority, created_by, assigned_to, sla_policy_id, sla_started_at, sla_due_at, sla_elapsed_seconds, sla_remaining_seconds, sla_percent_used, sla_status)
     VALUES ('SLA escalation fixture', 'QC', 'in_progress', 'high', ?, ?, ?, ?, ?, 0, 100, 0, 'NORMAL')`,
  ).run(employee.id, employee.id, policy.id, start, due);
  const taskId = Number(task.lastInsertRowid);
  refreshTaskSla(taskId, db, at('2026-08-11T10:01:19.000Z'));
  assert.equal(processEscalations(taskId, db, at('2026-08-11T10:01:19.000Z')), 0, 'below 80% does not escalate');
  db.prepare('UPDATE tasks SET sla_elapsed_seconds = 80, sla_remaining_seconds = 20, sla_percent_used = 80, sla_status = \'AT_RISK\' WHERE id = ?').run(taskId);
  assert.equal(processEscalations(taskId, db, at('2026-08-11T10:01:20.000Z')), 1, 'threshold creates one escalation');
  assert.equal(processEscalations(taskId, db, at('2026-08-11T10:01:21.000Z')), 0, 'same threshold is idempotent');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM escalation_events WHERE task_id = ?').get(taskId).n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE task_id = ? AND type = \'sla_escalation\'').get(taskId).n, 1);
  db.prepare("UPDATE escalation_events SET delivery_status = 'FAILED', delivered_at = NULL WHERE task_id = ?").run(taskId);
  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(employee.id);
  assert.equal(retryFailedEscalations(db, at('2026-08-11T10:02:00.000Z')), 0, 'failed delivery remains failed when recipient is inactive');
  db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(employee.id);
  assert.equal(retryFailedEscalations(db, at('2026-08-11T10:03:00.000Z')), 1, 'failed delivery recovers after retry');
  assert.equal(db.prepare('SELECT delivery_status FROM escalation_events WHERE task_id = ?').get(taskId).delivery_status, 'DELIVERED');
  closeDatabase();
  stopBackupScheduler();
  console.log('SLA escalation idempotency and retry tests passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
