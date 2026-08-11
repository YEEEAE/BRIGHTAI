import type { ReportActor, ReportFilters, ResolvedDataScope } from './types';

export function resolveReportScope(actor: ReportActor, filters: ReportFilters): ResolvedDataScope {
  if (actor.role === 'employee') {
    return {
      kind: 'own_tasks', userId: actor.id, department: actor.department,
      sql: '(t.assigned_to = ? OR t.created_by = ?)', params: [actor.id, actor.id],
    };
  }
  if (actor.role === 'supervisor') {
    const department = actor.department ?? filters.department;
    return {
      kind: 'department', userId: actor.id, department,
      sql: 't.department = ?', params: [department ?? ''],
    };
  }
  return { kind: 'organization', userId: actor.id, department: null, sql: '1 = 1', params: [] };
}
