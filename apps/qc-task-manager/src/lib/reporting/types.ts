import type { FindingClassification, RiskLevel, Role, TaskPriority } from '../types';
import type { SlaStatus } from '../sla';

export type ReportFormat = 'csv' | 'xlsx' | 'pdf';
export type ReportType = 'monthly-qc' | 'sla' | 'findings' | 'capa' | 'employee-performance' | 'audit-trail' | 'evidence-compliance' | 'overdue';

export interface ReportFilters {
  from: string | null;
  to: string | null;
  department: string | null;
  employee: number | null;
  supervisor: number | null;
  priority: TaskPriority | null;
  risk: RiskLevel | null;
  finding_classification: FindingClassification | null;
  sla_status: SlaStatus | null;
}

export interface ReportActor {
  id: number;
  role: Role;
  department: string | null;
}

export interface ResolvedDataScope {
  kind: 'organization' | 'department' | 'own_tasks';
  userId: number;
  department: string | null;
  sql: string;
  params: (number | string)[];
}

export interface ReportCursor {
  id: number;
}
