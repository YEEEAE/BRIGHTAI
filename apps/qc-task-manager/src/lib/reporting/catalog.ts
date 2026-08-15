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
  // ── Laboratory reports (QC-LAB-ARCHITECTURE.md §13 — 15 reports, supervisor+) ──
  'lab-test-register': { key: 'lab-test-register', label: 'Lab: Test Register', description: 'Complete AIR/VACUUM test register with workflow identities (metadata only — no snapshots).', headers: ['Report ID', 'Test Number', 'Type', 'Product', 'Equipment', 'Lot Number', 'Samples', 'Result', 'Status', 'Tested By', 'Tested At', 'Reviewed By', 'Approved By'] },
  'lab-test-register-air': { key: 'lab-test-register-air', label: 'Lab: AIR Test Register', description: 'AIR test register (test_type = air).', headers: ['Report ID', 'Test Number', 'Type', 'Product', 'Equipment', 'Lot Number', 'Samples', 'Result', 'Status', 'Tested By', 'Tested At', 'Reviewed By', 'Approved By'] },
  'lab-test-register-vacuum': { key: 'lab-test-register-vacuum', label: 'Lab: VACUUM Test Register', description: 'VACUUM test register (test_type = vacuum).', headers: ['Report ID', 'Test Number', 'Type', 'Product', 'Equipment', 'Lot Number', 'Samples', 'Result', 'Status', 'Tested By', 'Tested At', 'Reviewed By', 'Approved By'] },
  'lab-results': { key: 'lab-results', label: 'Lab: PASS/FAIL/HOLD', description: 'Final result distribution and details for approved decisions.', headers: ['Report ID', 'Test Number', 'Type', 'Result', 'Status', 'Product', 'Lot Number', 'Approved By', 'Approved At'] },
  'lab-retests': { key: 'lab-retests', label: 'Lab: Retest Report', description: 'Retest records with original result and reason.', headers: ['Report ID', 'Retest Number', 'Original Test', 'New Test', 'Reason', 'Status', 'Original Result', 'Created By', 'Created At'] },
  'lab-product-history': { key: 'lab-product-history', label: 'Lab: Product Test History', description: 'Full test history for a selected product.', headers: ['Report ID', 'Product', 'Test Number', 'Type', 'Lot Number', 'Result', 'Status', 'Tested By', 'Tested At'] },
  'lab-equipment-register': { key: 'lab-equipment-register', label: 'Lab: Equipment Register', description: 'Equipment registry with display status and calibration flag.', headers: ['Report ID', 'Equipment Code', 'Name', 'Location', 'Status', 'Calibration Flag', 'Serial Number', 'Archived'] },
  'lab-calibration': { key: 'lab-calibration', label: 'Lab: Equipment Calibration', description: 'Calibration records with derived due date (never stored state).', headers: ['Report ID', 'Equipment Code', 'Name', 'Last Calibrated', 'Due Date', 'Provider', 'Certificate', 'Result', 'Created At'] },
  'lab-maintenance': { key: 'lab-maintenance', label: 'Lab: Equipment Maintenance', description: 'Maintenance records per equipment.', headers: ['Report ID', 'Equipment Code', 'Name', 'Maintenance Date', 'Issue', 'Type', 'Technician/Vendor', 'Status', 'Completed Date'] },
  'lab-sop-register': { key: 'lab-sop-register', label: 'Lab: SOP Register', description: 'Controlled SOP document register (content never exported).', headers: ['Report ID', 'Document Code', 'Title', 'Version', 'Status', 'Owner', 'Reviewer', 'Approver', 'Effective Date', 'Review Due'] },
  'lab-wi-register': { key: 'lab-wi-register', label: 'Lab: WI Register', description: 'Controlled WI document register (content never exported).', headers: ['Report ID', 'Document Code', 'Title', 'Version', 'Status', 'Owner', 'Reviewer', 'Approver', 'Effective Date', 'Review Due'] },
  'lab-doc-review-due': { key: 'lab-doc-review-due', label: 'Lab: Document Review Due', description: 'Active documents with review due date within 30 days or overdue.', headers: ['Report ID', 'Document Code', 'Title', 'Type', 'Review Due Date', 'Days', 'Window', 'Status'] },
  'lab-acknowledgements': { key: 'lab-acknowledgements', label: 'Lab: Document Acknowledgements', description: 'Acknowledgement assignments and completion status.', headers: ['Report ID', 'Document Code', 'Version', 'Assignee', 'Assigned At', 'Acknowledged At', 'Status'] },
  'lab-activity': { key: 'lab-activity', label: 'Lab: Activity Report', description: 'Laboratory audit events (qc_audit_log LAB_* entries).', headers: ['Report ID', 'Timestamp', 'Entity Type', 'Entity ID', 'Action', 'Actor'] },
  'lab-data-quality': { key: 'lab-data-quality', label: 'Lab: Data Quality', description: 'Read-only data quality findings (tests, equipment, documents, products).', headers: ['Report ID', 'Category', 'Issue', 'Severity', 'Record', 'Detail', 'Link'] },
};
