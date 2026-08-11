import { getDb } from './db';
import type { WorkloadSummary } from './types';

export function getEmployeeWorkload(userId: number, db = getDb()): WorkloadSummary | null {
  const row = db.prepare(
    `SELECT u.id AS user_id, u.full_name, u.department,
      SUM(CASE WHEN t.status NOT IN ('completed','cancelled') THEN 1 ELSE 0 END) AS active_tasks,
      SUM(CASE WHEN t.status NOT IN ('completed','cancelled') AND t.due_date < date('now') THEN 1 ELSE 0 END) AS overdue,
      SUM(CASE WHEN t.status NOT IN ('completed','cancelled') AND t.sla_status = 'AT_RISK' THEN 1 ELSE 0 END) AS at_risk,
      SUM(CASE WHEN t.status NOT IN ('completed','cancelled') AND t.sla_status IN ('CRITICAL','BREACHED') THEN 1 ELSE 0 END) AS critical,
      SUM(CASE WHEN t.status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold,
      (SELECT COUNT(*) FROM tasks h WHERE h.assigned_to = u.id AND h.status = 'completed') AS completed_count,
      (SELECT COUNT(*) FROM tasks h WHERE h.assigned_to = u.id AND h.status IN ('completed','cancelled')) AS resolved_count,
      (SELECT AVG((julianday(h.completed_at) - julianday(h.created_at)) * 86400.0) FROM tasks h WHERE h.assigned_to = u.id AND h.status = 'completed' AND h.completed_at IS NOT NULL) AS average_resolution_seconds
     FROM users u LEFT JOIN tasks t ON t.assigned_to = u.id
     WHERE u.id = ? GROUP BY u.id`,
  ).get(userId) as any;
  if (!row) return null;
  const active = Number(row.active_tasks ?? 0);
  const overdue = Number(row.overdue ?? 0);
  const atRisk = Number(row.at_risk ?? 0);
  const critical = Number(row.critical ?? 0);
  const onHold = Number(row.on_hold ?? 0);
  const score = Math.round(Math.min(100, active * 8 + overdue * 18 + atRisk * 12 + critical * 20 + onHold * 5));
  return { user_id: row.user_id, full_name: row.full_name, department: row.department, active_tasks: active, overdue, at_risk: atRisk, critical, on_hold: onHold, completion_rate: row.resolved_count ? Math.round((Number(row.completed_count) / Number(row.resolved_count)) * 100) : 0, average_resolution_seconds: row.average_resolution_seconds == null ? null : Math.round(Number(row.average_resolution_seconds)), workload_score: score };
}

export function listEmployeeWorkloads(db = getDb()): WorkloadSummary[] {
  const users = db.prepare("SELECT id FROM users WHERE role = 'employee' AND is_active = 1 ORDER BY full_name").all() as { id: number }[];
  return users.map((user) => getEmployeeWorkload(user.id, db) as WorkloadSummary);
}
