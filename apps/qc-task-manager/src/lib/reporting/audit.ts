import { randomUUID } from 'node:crypto';
import { getDb } from '../db';
import type { ReportFilters, ReportFormat, ReportType, ResolvedDataScope } from './types';

export interface ReportAuditContext {
  reportId: string;
  reportType: ReportType;
  generatedBy: number;
  filters: ReportFilters;
  format: ReportFormat;
  dataScope: ResolvedDataScope;
}

export function startReportAudit(input: Omit<ReportAuditContext, 'reportId'>): ReportAuditContext {
  const reportId = `RPT-${randomUUID()}`;
  const context = { ...input, reportId };
  getDb().prepare(`
    INSERT INTO report_audit_log (report_id, report_type, generated_by, filters_json, format, data_scope_json, status)
    VALUES (?, ?, ?, ?, ?, ?, 'started')
  `).run(reportId, input.reportType, input.generatedBy, JSON.stringify(input.filters), input.format, JSON.stringify(input.dataScope));
  return context;
}

export function completeReportAudit(reportId: string, rowCount: number): void {
  getDb().prepare("UPDATE report_audit_log SET status = 'completed', row_count = ?, failure_reason = NULL WHERE report_id = ?").run(rowCount, reportId);
}

export function failReportAudit(reportId: string, reason: string): void {
  getDb().prepare("UPDATE report_audit_log SET status = 'failed', failure_reason = ? WHERE report_id = ?").run(reason.slice(0, 500), reportId);
}
