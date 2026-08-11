import type { ReportActor, ReportType } from './types';

export interface ReportAuthorization {
  allowed: boolean;
  scopeKind: 'organization' | 'department' | 'own_tasks' | 'none';
  reason?: string;
}

export function authorizeReport(actor: ReportActor, _reportType: ReportType, comprehensive: boolean): ReportAuthorization {
  if (actor.role === 'admin' || actor.role === 'manager') {
    return { allowed: true, scopeKind: 'organization' };
  }
  if (actor.role === 'supervisor') {
    return actor.department
      ? { allowed: true, scopeKind: 'department' }
      : { allowed: false, scopeKind: 'none', reason: 'Supervisor department scope is unavailable.' };
  }
  if (comprehensive) return { allowed: false, scopeKind: 'none', reason: 'Employees cannot generate comprehensive reports.' };
  return { allowed: true, scopeKind: 'own_tasks' };
}
