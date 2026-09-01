import { isLabReportType } from './types';
import { TASK_ROW_SCOPE_SQL, rowScopeParams } from '../scope';
import type { ReportActor, ReportFilters, ReportType, ResolvedDataScope } from './types';

export function resolveReportScope(actor: ReportActor, _filters: ReportFilters, reportType?: ReportType): ResolvedDataScope {
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
      sql: TASK_ROW_SCOPE_SQL, params: rowScopeParams(actor.id),
    };
  }
  if (actor.role === 'supervisor') {
    // The department is resolved ONLY from the actor's own profile. The query
    // string (`filters.department`) is never trusted for a supervisor whose
    // profile has no department — falling back to it would let the request
    // widen its own scope to any department.
    if (!actor.department) {
      return {
        kind: 'own_tasks', userId: actor.id, department: null,
        sql: TASK_ROW_SCOPE_SQL, params: rowScopeParams(actor.id),
      };
    }
    return {
      kind: 'department', userId: actor.id, department: actor.department,
      sql: 't.department = ?', params: [actor.department],
    };
  }
  return { kind: 'organization', userId: actor.id, department: null, sql: '1 = 1', params: [] };
}
