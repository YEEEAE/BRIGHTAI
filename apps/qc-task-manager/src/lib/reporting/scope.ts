import { isLabReportType } from './types';
import type { ReportActor, ReportFilters, ReportType, ResolvedDataScope } from './types';

export function resolveReportScope(actor: ReportActor, filters: ReportFilters, reportType?: ReportType): ResolvedDataScope {
  // Laboratory reports (§13): lab data has no department dimension and the
  // employee role is already denied upstream in authorizeReport, so every
  // authorized caller (supervisor/manager/admin) reads the full lab scope.
  // The sql/params stay neutral ('1 = 1') because lab readers apply their own
  // parameter-bound filters rather than the task-table WHERE clause.
  if (reportType && isLabReportType(reportType)) {
    return { kind: 'lab', userId: actor.id, department: actor.department, sql: '1 = 1', params: [] };
  }

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
