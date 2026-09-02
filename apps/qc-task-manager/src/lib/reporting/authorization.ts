import type { ReportActor, ReportType } from './types';
import { isLabReportType } from './types';
import { canViewLabReports, hasRankAtLeast } from '../permissions';

export interface ReportAuthorization {
  allowed: boolean;
  scopeKind: 'organization' | 'department' | 'own_tasks' | 'lab' | 'none';
  reason?: string;
}

export interface ReportAuditAuthorization {
  allowed: boolean;
  ownOnly: boolean;
  reason?: string;
}

/** Audit visibility follows the same reporting authorization boundary. */
export function authorizeReportAudit(actor: ReportActor): ReportAuditAuthorization {
  return !hasRankAtLeast(actor.role, 'supervisor')
    ? { allowed: true, ownOnly: true }
    : { allowed: true, ownOnly: false };
}

export function authorizeReport(actor: ReportActor, reportType: ReportType, comprehensive: boolean): ReportAuthorization {
  // Laboratory reports (§13): LAB_REPORT_VIEW / LAB_EXPORT are supervisor+.
  // Employees never see lab registers or lab exports — denied before any
  // task-scoping logic runs.
  if (isLabReportType(reportType)) {
    if (!canViewLabReports(actor.role)) {
      return { allowed: false, scopeKind: 'none', reason: 'Laboratory reports are available to supervisors and above.' };
    }
    return { allowed: true, scopeKind: 'lab' };
  }

  if (hasRankAtLeast(actor.role, 'manager')) {
    return { allowed: true, scopeKind: 'organization' };
  }
  if (hasRankAtLeast(actor.role, 'supervisor')) {
    return actor.department
      ? { allowed: true, scopeKind: 'department' }
      : { allowed: false, scopeKind: 'none', reason: 'Supervisor department scope is unavailable.' };
  }
  if (comprehensive) return { allowed: false, scopeKind: 'none', reason: 'Employees cannot generate comprehensive reports.' };
  return { allowed: true, scopeKind: 'own_tasks' };
}
