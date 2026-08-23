import type { FindingClassification, RiskLevel, Role, TaskPriority } from '../types';
import type { SlaStatus } from '../sla';

export type ReportFormat = 'csv' | 'xlsx' | 'pdf';
export type ReportType =
  // Task-based QC reports
  | 'monthly-qc' | 'sla' | 'findings' | 'capa' | 'employee-performance' | 'audit-trail' | 'evidence-compliance' | 'overdue'
  // Laboratory reports (QC-LAB-ARCHITECTURE.md §13 — same pipeline, same writers)
  | 'lab-test-register' | 'lab-test-register-air' | 'lab-test-register-vacuum'
  | 'lab-results' | 'lab-retests' | 'lab-product-history'
  | 'lab-equipment-register' | 'lab-calibration' | 'lab-maintenance'
  | 'lab-sop-register' | 'lab-wi-register' | 'lab-doc-review-due' | 'lab-acknowledgements'
  | 'lab-activity' | 'lab-data-quality' | 'lab-retention-status';

/** Task-report catalog order used by /reports; lab reports have their own page. */
export const TASK_REPORT_TYPES: readonly ReportType[] = [
  'monthly-qc', 'sla', 'findings', 'capa', 'employee-performance',
  'audit-trail', 'evidence-compliance', 'overdue',
];

/** Laboratory report types rendered from the lab_* tables (§13). */
export const LAB_REPORT_TYPES: readonly ReportType[] = [
  'lab-test-register', 'lab-test-register-air', 'lab-test-register-vacuum',
  'lab-results', 'lab-retests', 'lab-product-history',
  'lab-equipment-register', 'lab-calibration', 'lab-maintenance',
  'lab-sop-register', 'lab-wi-register', 'lab-doc-review-due', 'lab-acknowledgements',
  'lab-activity', 'lab-data-quality', 'lab-retention-status',
];

export function isLabReportType(type: ReportType): boolean {
  return LAB_REPORT_TYPES.includes(type);
}

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
  // Lab-only filter params (null for task reports; task filters are null for lab reports)
  test_type: 'air' | 'vacuum' | null;
  result: 'PASS' | 'FAIL' | 'HOLD' | null;
  status: string | null;
  reason: 'FAIL' | 'HOLD' | 'SAMPLE_ISSUE' | 'EQUIPMENT_ISSUE' | 'PROCEDURAL_ISSUE' | 'OTHER' | null;
  product: number | null;
  equipment: number | null;
}

export interface ReportActor {
  id: number;
  role: Role;
  department: string | null;
}

export interface ResolvedDataScope {
  kind: 'organization' | 'department' | 'own_tasks' | 'lab';
  userId: number;
  department: string | null;
  sql: string;
  params: (number | string)[];
}

export interface ReportCursor {
  id: number;
}
