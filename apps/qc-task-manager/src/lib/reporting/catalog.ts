import type { ReportType } from './types';

export interface ReportDefinition {
  key: ReportType;
  label: string;
  description: string;
  headers: readonly string[];
}

export const REPORT_CATALOG: Record<ReportType, ReportDefinition> = {
  'monthly-qc': { key: 'monthly-qc', label: 'Monthly QC', description: 'Monthly quality-control operations summary.', headers: ['Report ID', 'Month', 'Total Tasks', 'Completion Rate', 'SLA Compliance', 'Critical Findings', 'Open CAPA'] },
  sla: { key: 'sla', label: 'SLA', description: 'SLA status, compliance, and breach details.', headers: ['Report ID', 'Task ID', 'Task', 'Department', 'SLA Status', 'SLA Percent Used', 'Due Date'] },
  findings: { key: 'findings', label: 'Findings', description: 'QC findings, classification, severity, owner, and status.', headers: ['Report ID', 'Finding Number', 'Task ID', 'Classification', 'Severity', 'Owner', 'Status', 'Due Date'] },
  capa: { key: 'capa', label: 'CAPA', description: 'Corrective and preventive action status.', headers: ['Report ID', 'CAPA ID', 'Finding ID', 'Owner', 'Status', 'Due Date', 'Reviewer'] },
  'employee-performance': { key: 'employee-performance', label: 'Employee Performance', description: 'Scoped employee completion and resolution metrics.', headers: ['Report ID', 'Employee', 'Department', 'Total Tasks', 'Completed', 'Completion Rate', 'Average Resolution'] },
  'audit-trail': { key: 'audit-trail', label: 'Audit Trail', description: 'QC and report generation audit events.', headers: ['Report ID', 'Entity Type', 'Entity ID', 'Task ID', 'Actor', 'Action', 'Timestamp'] },
  'evidence-compliance': { key: 'evidence-compliance', label: 'Evidence Compliance', description: 'Completed task evidence coverage.', headers: ['Report ID', 'Task ID', 'Task', 'Employee', 'Evidence Status', 'Completed At'] },
  overdue: { key: 'overdue', label: 'Overdue', description: 'Open tasks past their due date.', headers: ['Report ID', 'Task ID', 'Task', 'Employee', 'Department', 'Due Date', 'Days Overdue'] },
};
