import { getDb } from '../db';
import { getKpiSnapshot, buildReportWhere } from './queries';
import { isLabReportType } from './types';
import { readLabReportRows, toLabReportFilters } from '../lab/labReports';
import type { ReportFilters, ReportType, ResolvedDataScope } from './types';

type Cell = string | number | null;
const CHUNK_SIZE = 500;

export async function* readReportRows(reportType: ReportType, filters: ReportFilters, scope: ResolvedDataScope, reportId: string): AsyncGenerator<readonly Cell[]> {
  // Laboratory reports (§13) — same pipeline, lab-shaped readers. The scope
  // parameter is neutral for lab types (authorizeReport already denied the
  // employee role; lab readers apply their own parameter-bound filters).
  if (isLabReportType(reportType)) {
    yield* readLabReportRows(reportType, reportId, toLabReportFilters(filters));
    return;
  }

  const db = getDb();
  if (reportType === 'monthly-qc') {
    const kpi = getKpiSnapshot(filters, scope);
    yield [reportId, filters.from?.slice(0, 7) ?? new Date().toISOString().slice(0, 7), kpi.total_tasks, kpi.completion_rate, kpi.sla_compliance, kpi.critical_findings, kpi.open_capa];
    return;
  }

  if (reportType === 'employee-performance') {
    const where = buildReportWhere(filters, scope);
    const rows = db.prepare(`
      SELECT u.full_name, t.department, COUNT(*) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed,
        ROUND(100.0 * SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS completion_rate,
        AVG(CASE WHEN t.status = 'completed' AND t.completed_at IS NOT NULL AND t.started_at IS NOT NULL THEN (julianday(t.completed_at) - julianday(t.started_at)) * 86400.0 END) AS avg_resolution
      FROM tasks t JOIN users u ON u.id = t.assigned_to ${where.sql}
      GROUP BY u.id, u.full_name, t.department ORDER BY u.full_name ASC LIMIT ${CHUNK_SIZE}
    `).all(...where.params) as { full_name: string; department: string; total_tasks: number; completed: number; completion_rate: number; avg_resolution: number | null }[];
    for (const row of rows) yield [reportId, row.full_name, row.department, Number(row.total_tasks), Number(row.completed), Number(row.completion_rate), row.avg_resolution == null ? null : Number(row.avg_resolution)];
    return;
  }

  let cursor: number | null = null;
  while (true) {
    const extra = cursor === null ? [] : [{ sql: 't.id < ?', params: [cursor] as (string | number)[] }];
    const where = buildReportWhere(filters, scope, extra);
    let rows: Record<string, Cell>[];
    if (reportType === 'sla') {
      rows = db.prepare(`SELECT t.id, t.title, t.department, t.sla_status, t.sla_percent_used, t.sla_due_at FROM tasks t ${where.sql} ORDER BY t.id DESC LIMIT ${CHUNK_SIZE}`).all(...where.params) as Record<string, Cell>[];
    } else if (reportType === 'overdue') {
      rows = db.prepare(`SELECT t.id, t.title, u.full_name AS employee, t.department, t.due_date, CAST(julianday('now','localtime') - julianday(t.due_date) AS INTEGER) AS days_overdue FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to ${where.sql} AND t.due_date IS NOT NULL AND date(t.due_date) < date('now','localtime') AND t.status NOT IN ('completed','cancelled') ORDER BY t.id DESC LIMIT ${CHUNK_SIZE}`).all(...where.params) as Record<string, Cell>[];
    } else if (reportType === 'evidence-compliance') {
      rows = db.prepare(`SELECT t.id, t.title, u.full_name AS employee, CASE WHEN EXISTS (SELECT 1 FROM task_attachments a WHERE a.task_id=t.id AND a.is_evidence=1) THEN 'Compliant' ELSE 'Missing' END AS evidence_status, t.completed_at FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to ${where.sql} AND t.status='completed' ORDER BY t.id DESC LIMIT ${CHUNK_SIZE}`).all(...where.params) as Record<string, Cell>[];
    } else if (reportType === 'findings') {
      rows = db.prepare(`SELECT f.finding_number, f.task_id, f.classification, f.severity, u.full_name AS owner, f.status, f.due_date, t.id FROM qc_findings f JOIN tasks t ON t.id=f.task_id LEFT JOIN users u ON u.id=f.owner ${where.sql} ORDER BY t.id DESC, f.id DESC LIMIT ${CHUNK_SIZE}`).all(...where.params) as Record<string, Cell>[];
    } else if (reportType === 'capa') {
      rows = db.prepare(`SELECT c.id, c.finding_id, u.full_name AS owner, c.status, c.due_date, r.full_name AS reviewer, t.id FROM qc_capa c JOIN qc_findings f ON f.id=c.finding_id JOIN tasks t ON t.id=f.task_id LEFT JOIN users u ON u.id=c.owner LEFT JOIN users r ON r.id=c.reviewer ${where.sql} ORDER BY t.id DESC, c.id DESC LIMIT ${CHUNK_SIZE}`).all(...where.params) as Record<string, Cell>[];
    } else {
      rows = db.prepare(`SELECT a.entity_type, a.entity_id, a.task_id, u.full_name AS actor, a.action, a.created_at, t.id FROM qc_audit_log a LEFT JOIN tasks t ON t.id=a.task_id LEFT JOIN users u ON u.id=a.actor_id ${where.sql} ORDER BY t.id DESC, a.id DESC LIMIT ${CHUNK_SIZE}`).all(...where.params) as Record<string, Cell>[];
    }
    if (rows.length === 0) return;
    for (const row of rows) {
      const id = Number(row.id);
      cursor = id;
      if (reportType === 'sla') yield [reportId, id, row.title, row.department, row.sla_status, row.sla_percent_used, row.sla_due_at];
      else if (reportType === 'overdue') yield [reportId, id, row.title, row.employee, row.department, row.due_date, row.days_overdue];
      else if (reportType === 'evidence-compliance') yield [reportId, id, row.title, row.employee, row.evidence_status, row.completed_at];
      else if (reportType === 'findings') yield [reportId, row.finding_number, row.task_id, row.classification, row.severity, row.owner, row.status, row.due_date];
      else if (reportType === 'capa') yield [reportId, row.id, row.finding_id, row.owner, row.status, row.due_date, row.reviewer];
      else yield [reportId, row.entity_type, row.entity_id, row.task_id, row.actor, row.action, row.created_at];
    }
    if (rows.length < CHUNK_SIZE) return;
  }
}
