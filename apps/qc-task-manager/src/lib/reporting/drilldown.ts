import type { DashboardFilters } from '../dashboard';

export type DashboardKpiKey =
  | 'total' | 'not_started' | 'in_progress' | 'on_hold' | 'completed'
  | 'completion_rate' | 'sla_compliance' | 'overdue' | 'urgent_open'
  | 'completed_without_evidence' | 'critical_findings' | 'open_capa'
  | 'evidence_compliance' | 'average_resolution' | 'sla_started'
  | 'sla_at_risk' | 'sla_critical' | 'sla_breached';

/**
 * Build a drill-down URL from the already validated dashboard filters.
 * Dashboard-only names are translated explicitly so report parsing never sees
 * unsupported `range`, `assignee`, `status`, or `overdue` parameters.
 */
export function buildKpiHref(kpi: DashboardKpiKey, source: DashboardFilters): string {
  const params = new URLSearchParams();
  if (source.from) params.set('from', source.from);
  if (source.to) params.set('to', source.to);
  if (source.department) params.set('department', source.department);
  if (source.assignee !== null) params.set('employee', String(source.assignee));
  if (source.supervisor !== null) params.set('supervisor', String(source.supervisor));
  if (source.priority) params.set('priority', source.priority);
  if (source.risk) params.set('risk', source.risk);
  if (source.finding_classification) params.set('finding_classification', source.finding_classification);
  if (source.sla_status) params.set('sla_status', source.sla_status);
  if (source.status) params.set('task_status', source.status);
  if (source.overdue_only) params.set('overdue_filter', '1');
  params.set('kpi', kpi);
  return `/dashboard/drilldown?${params.toString()}`;
}
