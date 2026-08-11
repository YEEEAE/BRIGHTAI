import { getDb } from '../db';
import { createNotification } from '../notifications';
import { logActivity, Action } from '../activity';
import { calculateSlaSnapshot, parseServerTimestamp, type SlaStatus } from './index';

type Db = ReturnType<typeof getDb>;

export interface SlaPolicy {
  id: number;
  priority: string | null;
  department: string | null;
  task_type: string | null;
  target_duration_seconds: number;
  warning_percent: number;
  critical_percent: number;
  pause_on_hold: number;
}

export function serverNow(db: Db = getDb()): Date {
  const row = db.prepare("SELECT datetime('now') AS now").get() as { now: string };
  return parseServerTimestamp(row.now);
}

export function ensureDefaultSlaConfiguration(db: Db = getDb()): void {
  db.prepare(
    `INSERT INTO sla_policies
      (priority, department, task_type, target_duration_seconds, warning_percent, critical_percent, pause_on_hold, is_active)
     SELECT 'urgent', NULL, NULL, 86400, 70, 90, 0, 1
     WHERE NOT EXISTS (SELECT 1 FROM sla_policies WHERE priority = 'urgent' AND department IS NULL AND task_type IS NULL)`,
  ).run();
  db.prepare(
    `INSERT INTO sla_policies
      (priority, department, task_type, target_duration_seconds, warning_percent, critical_percent, pause_on_hold, is_active)
     SELECT NULL, NULL, NULL, 259200, 70, 90, 0, 1
     WHERE NOT EXISTS (SELECT 1 FROM sla_policies WHERE priority IS NULL AND department IS NULL AND task_type IS NULL)`,
  ).run();
  db.prepare(
    `INSERT OR IGNORE INTO escalation_policies (threshold_percent, recipient_roles, is_active)
     VALUES (?, ?, 1), (?, ?, 1), (?, ?, 1), (?, ?, 1)`,
  ).run(80, 'employee', 90, 'employee,supervisor', 100, 'supervisor,manager', 120, 'manager,admin');
}

export function findSlaPolicy(task: { priority: string; department: string; task_type: string | null }, db: Db = getDb()): SlaPolicy | null {
  ensureDefaultSlaConfiguration(db);
  return (db.prepare(
    `SELECT id, priority, department, task_type, target_duration_seconds, warning_percent, critical_percent, pause_on_hold
     FROM sla_policies
     WHERE is_active = 1
       AND (priority IS NULL OR priority = ?)
       AND (department IS NULL OR department = ?)
       AND (task_type IS NULL OR task_type = ?)
     ORDER BY (priority IS NOT NULL) DESC, (department IS NOT NULL) DESC, (task_type IS NOT NULL) DESC, id ASC
     LIMIT 1`,
  ).get(task.priority, task.department, task.task_type) ?? null) as SlaPolicy | null;
}

function updateSnapshot(taskId: number, snapshot: ReturnType<typeof calculateSlaSnapshot>, db: Db): void {
  db.prepare(
    `UPDATE tasks SET sla_elapsed_seconds = ?, sla_remaining_seconds = ?, sla_percent_used = ?, sla_status = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(snapshot.elapsedSeconds, snapshot.remainingSeconds, snapshot.percentUsed, snapshot.status, taskId);
}

function taskRow(taskId: number, db: Db = getDb()): any {
  return db.prepare(
    `SELECT id, priority, department, task_type, status, sla_policy_id, sla_started_at, sla_due_at,
            sla_paused_at, sla_elapsed_seconds, sla_remaining_seconds, sla_percent_used, sla_status,
            assigned_to, created_by, title
     FROM tasks WHERE id = ?`,
  ).get(taskId);
}

export function initializeTaskSla(taskId: number, db: Db = getDb(), now = serverNow(db)): void {
  const task = taskRow(taskId, db);
  if (!task || task.sla_started_at) return;
  const policy = findSlaPolicy(task, db);
  if (!policy) return;
  const due = new Date(now.getTime() + policy.target_duration_seconds * 1000);
  db.prepare(
    `UPDATE tasks SET sla_policy_id = ?, sla_started_at = ?, sla_due_at = ?, sla_elapsed_seconds = 0,
      sla_remaining_seconds = ?, sla_percent_used = 0, sla_status = 'NORMAL' WHERE id = ?`,
  ).run(policy.id, now.toISOString(), due.toISOString(), policy.target_duration_seconds, taskId);
}

export function refreshTaskSla(taskId: number, db: Db = getDb(), now = serverNow(db)): SlaStatus | null {
  initializeTaskSla(taskId, db, now);
  const task = taskRow(taskId, db);
  if (!task?.sla_started_at || !task.sla_due_at) return null;
  const policy = db.prepare('SELECT warning_percent, critical_percent, pause_on_hold FROM sla_policies WHERE id = ?').get(task.sla_policy_id) as Pick<SlaPolicy, 'warning_percent' | 'critical_percent' | 'pause_on_hold'> | undefined;
  if (!policy) return null;
  const snapshot = calculateSlaSnapshot({
    startedAt: parseServerTimestamp(task.sla_started_at),
    dueAt: parseServerTimestamp(task.sla_due_at),
    elapsedSeconds: Number(task.sla_elapsed_seconds ?? 0),
    pausedAt: task.sla_paused_at ? parseServerTimestamp(task.sla_paused_at) : null,
    pauseOnHold: Number(policy.pause_on_hold) === 1,
    taskStatus: task.status,
    now,
    warningPercent: Number(policy.warning_percent),
    criticalPercent: Number(policy.critical_percent),
  });
  updateSnapshot(taskId, snapshot, db);
  processEscalations(taskId, db, now);
  return snapshot.status;
}

export function checkpointTaskSla(taskId: number, fromStatus: string, toStatus: string, db: Db = getDb(), now = serverNow(db)): void {
  const task = taskRow(taskId, db);
  if (!task?.sla_started_at) return;
  const policy = db.prepare('SELECT pause_on_hold FROM sla_policies WHERE id = ?').get(task.sla_policy_id) as { pause_on_hold: number } | undefined;
  if (!policy || Number(policy.pause_on_hold) !== 1) return;
  if (toStatus === 'on_hold' && fromStatus !== 'on_hold') {
    refreshTaskSla(taskId, db, now);
    db.prepare('UPDATE tasks SET sla_paused_at = ? WHERE id = ?').run(now.toISOString(), taskId);
  } else if (fromStatus === 'on_hold' && toStatus !== 'on_hold') {
    const pausedAt = task.sla_paused_at ? parseServerTimestamp(task.sla_paused_at) : now;
    const pauseSeconds = Math.max(0, Math.floor((now.getTime() - pausedAt.getTime()) / 1000));
    db.prepare(`UPDATE tasks SET sla_due_at = datetime(sla_due_at, ? || ' seconds'), sla_paused_at = NULL WHERE id = ?`).run(`+${pauseSeconds}`, taskId);
  }
  refreshTaskSla(taskId, db, now);
}

function recipients(task: any, roles: string[], db: Db): { id: number; full_name: string }[] {
  const result: { id: number; full_name: string }[] = [];
  for (const role of roles) {
    if (role === 'employee' && task.assigned_to) {
      const user = db.prepare('SELECT id, full_name FROM users WHERE id = ? AND is_active = 1').get(task.assigned_to) as any;
      if (user) result.push(user);
    } else {
      result.push(...(db.prepare('SELECT id, full_name FROM users WHERE role = ? AND department = ? AND is_active = 1').all(role, task.department) as any[]));
    }
  }
  return [...new Map(result.map((user) => [user.id, user])).values()];
}

export function processEscalations(taskId: number, db: Db = getDb(), now = serverNow(db)): number {
  const task = taskRow(taskId, db);
  if (!task || task.status === 'cancelled') return 0;
  const policies = db.prepare('SELECT id, threshold_percent, recipient_roles FROM escalation_policies WHERE is_active = 1 ORDER BY threshold_percent ASC').all() as { id: number; threshold_percent: number; recipient_roles: string }[];
  let created = 0;
  for (const policy of policies) {
    if (Number(task.sla_percent_used ?? 0) < policy.threshold_percent) continue;
    for (const recipient of recipients(task, policy.recipient_roles.split(',').map((role) => role.trim()), db)) {
      const key = `${taskId}:${policy.id}:${recipient.id}`;
      const inserted = db.prepare(
        `INSERT OR IGNORE INTO escalation_events
          (task_id, escalation_policy_id, idempotency_key, trigger_rule, recipient_id, triggered_at, delivery_status)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      ).run(taskId, policy.id, key, `${policy.threshold_percent}%`, recipient.id, now.toISOString());
      if (inserted.changes === 0) continue;
      created += 1;
      const delivered = createNotification({
        userId: recipient.id,
        taskId,
        type: 'sla_escalation',
        title: `SLA escalation: ${task.title}`,
        message: `SLA consumption reached ${Number(task.sla_percent_used).toFixed(2)}% (${policy.threshold_percent}% rule).`,
      });
      db.prepare('UPDATE escalation_events SET delivery_status = ?, delivered_at = ?, retry_count = retry_count + ? WHERE idempotency_key = ?')
        .run(delivered ? 'DELIVERED' : 'FAILED', delivered ? now.toISOString() : null, delivered ? 0 : 1, key);
      logActivity({ taskId, userId: recipient.id, action: Action.SLA_ESCALATED, newValue: `${policy.threshold_percent}% → ${recipient.full_name}` });
    }
  }
  return created;
}

export function retryFailedEscalations(db: Db = getDb(), now = serverNow(db)): number {
  const events = db.prepare(
    `SELECT e.*, t.title, t.sla_percent_used FROM escalation_events e JOIN tasks t ON t.id = e.task_id
     WHERE e.delivery_status = 'FAILED' ORDER BY e.id ASC`,
  ).all() as any[];
  let recovered = 0;
  for (const event of events) {
    const delivered = createNotification({ userId: event.recipient_id, taskId: event.task_id, type: 'sla_escalation', title: `SLA escalation: ${event.title}`, message: `SLA consumption reached ${Number(event.sla_percent_used).toFixed(2)}%.` });
    db.prepare('UPDATE escalation_events SET delivery_status = ?, delivered_at = ?, retry_count = retry_count + 1, last_error = ? WHERE id = ?')
      .run(delivered ? 'DELIVERED' : 'FAILED', delivered ? now.toISOString() : null, delivered ? null : 'In-app notification failed', event.id);
    if (delivered) recovered += 1;
  }
  return recovered;
}
