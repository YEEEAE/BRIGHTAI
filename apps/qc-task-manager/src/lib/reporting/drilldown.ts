export type DashboardKpiKey =
  | 'total' | 'completion_rate' | 'sla_compliance' | 'overdue' | 'on_hold'
  | 'critical_findings' | 'open_capa' | 'evidence_compliance' | 'average_resolution'
  | 'sla_breached';

export function buildKpiHref(kpi: DashboardKpiKey, source: URLSearchParams): string {
  const params = new URLSearchParams(source);
  switch (kpi) {
    case 'completion_rate': params.set('status', 'completed'); break;
    case 'sla_compliance': params.set('sla_status', 'NORMAL'); break;
    case 'sla_breached': params.set('sla_status', 'BREACHED'); break;
    case 'overdue': params.set('overdue', '1'); break;
    case 'on_hold': params.set('status', 'on_hold'); break;
    case 'critical_findings': params.set('kpi', 'critical_findings'); break;
    case 'open_capa': params.set('kpi', 'open_capa'); break;
    case 'evidence_compliance': params.set('kpi', 'evidence_compliance'); break;
    case 'average_resolution': params.set('kpi', 'average_resolution'); break;
    case 'total': break;
  }
  params.set('dashboard', '1');
  return `/dashboard/drilldown?${params.toString()}`;
}
