import { getDb } from '../db';
import type { ReportFilters } from './types';
import type { ResolvedDataScope } from './types';

export interface KpiSnapshot {
  total_tasks: number;
  completion_rate: number;
  sla_compliance: number;
  overdue: number;
  on_hold: number;
  critical_findings: number;
  open_capa: number;
  evidence_compliance: number;
  average_resolution_seconds: number | null;
}

export interface DrilldownTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  department: string;
  assignee: string | null;
  due_date: string | null;
  sla_status: string;
}

export const DRILLDOWN_KPIS = [
  'total', 'not_started', 'in_progress', 'on_hold', 'completed',
  'completion_rate', 'overdue', 'urgent_open', 'completed_without_evidence',
  'average_resolution', 'sla_compliance', 'sla_started', 'sla_at_risk',
  'sla_critical', 'sla_breached', 'critical_findings', 'open_capa',
  'evidence_compliance',
] as const;

export type DrilldownKpi = (typeof DRILLDOWN_KPIS)[number];

export interface DrilldownContextFilters {
  taskStatus: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | null;
  overdueOnly: boolean;
}

interface QueryPart { sql: string; params: (string | number)[] }

export function buildReportWhere(filters: ReportFilters, scope: ResolvedDataScope, extra: QueryPart[] = []): QueryPart {
  const conditions = [scope.sql, ...extra.map((part) => part.sql)];
  const params: (string | number)[] = [...scope.params, ...extra.flatMap((part) => part.params)];
  if (filters.from) { conditions.push("date(t.created_at, 'localtime') >= date(?)"); params.push(filters.from); }
  if (filters.to) { conditions.push("date(t.created_at, 'localtime') <= date(?)"); params.push(filters.to); }
  if (filters.department && scope.kind !== 'department') { conditions.push('t.department = ?'); params.push(filters.department); }
  if (filters.employee !== null && scope.kind !== 'own_tasks') { conditions.push('t.assigned_to = ?'); params.push(filters.employee); }
  if (filters.supervisor !== null) { conditions.push('t.created_by = ?'); params.push(filters.supervisor); }
  if (filters.priority) { conditions.push('t.priority = ?'); params.push(filters.priority); }
  if (filters.risk) { conditions.push('t.risk_level = ?'); params.push(filters.risk); }
  if (filters.finding_classification) { conditions.push('t.finding_classification = ?'); params.push(filters.finding_classification); }
  if (filters.sla_status) { conditions.push('t.sla_status = ?'); params.push(filters.sla_status); }
  return { sql: `WHERE ${conditions.join(' AND ')}`, params };
}

function metricPredicate(kpi: DrilldownKpi): QueryPart | null {
  switch (kpi) {
    case 'not_started': return { sql: "t.status = 'not_started'", params: [] };
    case 'in_progress': return { sql: "t.status = 'in_progress'", params: [] };
    case 'completed':
    case 'completion_rate': return { sql: "t.status = 'completed'", params: [] };
    case 'overdue': return { sql: "t.due_date IS NOT NULL AND date(t.due_date) < date('now', 'localtime') AND t.status NOT IN ('completed', 'cancelled')", params: [] };
    case 'on_hold': return { sql: "t.status = 'on_hold'", params: [] };
    case 'urgent_open': return { sql: "t.priority = 'urgent' AND t.status NOT IN ('completed', 'cancelled')", params: [] };
    case 'completed_without_evidence': return { sql: "t.status = 'completed' AND NOT EXISTS (SELECT 1 FROM task_attachments a WHERE a.task_id = t.id AND a.is_evidence = 1)", params: [] };
    case 'sla_compliance': return { sql: "t.status = 'completed' AND t.sla_started_at IS NOT NULL AND t.sla_percent_used <= 100", params: [] };
    case 'sla_started': return { sql: 't.sla_started_at IS NOT NULL', params: [] };
    case 'sla_at_risk': return { sql: "t.sla_status = 'AT_RISK'", params: [] };
    case 'sla_critical': return { sql: "t.sla_status = 'CRITICAL'", params: [] };
    case 'sla_breached': return { sql: "t.sla_status = 'BREACHED'", params: [] };
    case 'critical_findings': return { sql: "EXISTS (SELECT 1 FROM qc_findings f WHERE f.task_id = t.id AND (f.severity = 'critical' OR f.classification = 'critical') AND f.status <> 'CLOSED')", params: [] };
    case 'open_capa': return { sql: "EXISTS (SELECT 1 FROM qc_capa c JOIN qc_findings f ON f.id = c.finding_id WHERE f.task_id = t.id AND c.status <> 'CLOSED')", params: [] };
    case 'evidence_compliance': return { sql: "t.status = 'completed' AND EXISTS (SELECT 1 FROM task_attachments a WHERE a.task_id = t.id AND a.is_evidence = 1)", params: [] };
    case 'average_resolution': return { sql: "t.status = 'completed' AND t.completed_at IS NOT NULL AND t.started_at IS NOT NULL", params: [] };
    default: return null;
  }
}

export function getKpiSnapshot(filters: ReportFilters, scope: ResolvedDataScope): KpiSnapshot {
  const db = getDb();
  const base = buildReportWhere(filters, scope);
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total_tasks,
      COALESCE(ROUND(100.0 * SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2), 0) AS completion_rate,
      COALESCE(ROUND(100.0 * SUM(CASE WHEN t.sla_started_at IS NOT NULL AND t.sla_status <> 'BREACHED' THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN t.sla_started_at IS NOT NULL THEN 1 ELSE 0 END), 0), 2), 0) AS sla_compliance,
      COALESCE(SUM(CASE WHEN t.due_date IS NOT NULL AND date(t.due_date) < date('now', 'localtime') AND t.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END), 0) AS overdue,
      COALESCE(SUM(CASE WHEN t.status = 'on_hold' THEN 1 ELSE 0 END), 0) AS on_hold,
      COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM qc_findings f WHERE f.task_id = t.id AND (f.severity = 'critical' OR f.classification = 'critical') AND f.status <> 'CLOSED') THEN 1 ELSE 0 END), 0) AS critical_findings,
      COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM qc_capa c JOIN qc_findings f ON f.id = c.finding_id WHERE f.task_id = t.id AND c.status <> 'CLOSED') THEN 1 ELSE 0 END), 0) AS open_capa,
      COALESCE(ROUND(100.0 * SUM(CASE WHEN t.status = 'completed' AND EXISTS (SELECT 1 FROM task_attachments a WHERE a.task_id = t.id AND a.is_evidence = 1) THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0), 2), 0) AS evidence_compliance,
      AVG(CASE WHEN t.status = 'completed' AND t.completed_at IS NOT NULL AND t.started_at IS NOT NULL THEN (julianday(t.completed_at) - julianday(t.started_at)) * 86400.0 END) AS average_resolution_seconds
    FROM tasks t ${base.sql}
  `).get(...base.params) as KpiSnapshot;
  return {
    total_tasks: Number(row.total_tasks), completion_rate: Number(row.completion_rate), sla_compliance: Number(row.sla_compliance),
    overdue: Number(row.overdue), on_hold: Number(row.on_hold), critical_findings: Number(row.critical_findings), open_capa: Number(row.open_capa),
    evidence_compliance: Number(row.evidence_compliance), average_resolution_seconds: row.average_resolution_seconds == null ? null : Number(row.average_resolution_seconds),
  };
}

export function listDrilldownTasks(
  filters: ReportFilters,
  scope: ResolvedDataScope,
  kpi: DrilldownKpi,
  cursor: number | null = null,
  requestedLimit = 50,
  context: DrilldownContextFilters = { taskStatus: null, overdueOnly: false },
): DrilldownTask[] {
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), 500);
  const predicate = metricPredicate(kpi);
  const extra: QueryPart[] = [];
  if (predicate) extra.push(predicate);
  if (context.taskStatus) extra.push({ sql: 't.status = ?', params: [context.taskStatus] });
  if (context.overdueOnly) {
    extra.push({ sql: "t.due_date IS NOT NULL AND date(t.due_date) < date('now', 'localtime') AND t.status NOT IN ('completed', 'cancelled')", params: [] });
  }
  if (cursor !== null && Number.isInteger(cursor) && cursor > 0) extra.push({ sql: 't.id < ?', params: [cursor] });
  const where = buildReportWhere(filters, scope, extra);
  return getDb().prepare(`
    SELECT t.id, t.title, t.status, t.priority, t.department, u.full_name AS assignee, t.due_date, t.sla_status
    FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
    ${where.sql} ORDER BY t.id DESC LIMIT ?
  `).all(...where.params, limit) as DrilldownTask[];
}
