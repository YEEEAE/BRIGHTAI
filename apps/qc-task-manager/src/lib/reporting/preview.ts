import { authorizeReport } from './authorization';
import { REPORT_CATALOG } from './catalog';
import { readReportRows } from './reader';
import { resolveReportScope } from './scope';
import type { ReportActor, ReportFilters, ReportType, ResolvedDataScope } from './types';

export interface AuthorizedReportContext {
  actor: ReportActor;
  reportType: ReportType;
  filters: ReportFilters;
  scope: ResolvedDataScope;
}

export type ReportPreview =
  | (AuthorizedReportContext & {
      allowed: true;
      matchingRowCount: number | null;
    })
  | { allowed: false; reason: string };

/** Single authorization/scope path shared by preview and final generation. */
export function resolveReportContext(input: Omit<AuthorizedReportContext, 'scope'> & { comprehensive: boolean }): AuthorizedReportContext | { allowed: false; reason: string } {
  const authorization = authorizeReport(input.actor, input.reportType, input.comprehensive);
  if (!authorization.allowed) return { allowed: false, reason: authorization.reason ?? 'You do not have permission to generate this report.' };
  return {
    actor: input.actor,
    reportType: input.reportType,
    filters: input.filters,
    scope: resolveReportScope(input.actor, input.filters, input.reportType),
  };
}

/**
 * Resolve only after authorization, then count the same rows the download
 * reader will consume. Large results intentionally show “not calculated”
 * rather than making the preview slow or leaking a count to a denied user.
 */
export async function resolveReportPreview(input: Omit<AuthorizedReportContext, 'scope'> & { comprehensive: boolean }): Promise<ReportPreview> {
  const context = resolveReportContext(input);
  if ('allowed' in context) return context;
  let matchingRowCount: number | null = null;
  try {
    let count = 0;
    for await (const _row of readReportRows(context.reportType, context.filters, context.scope, 'PREVIEW')) {
      count += 1;
      if (count > 10_000) break;
    }
    matchingRowCount = count > 10_000 ? null : count;
  } catch {
    matchingRowCount = null;
  }
  return { ...context, allowed: true, matchingRowCount };
}

export function reportFormatLabel(format: 'csv' | 'xlsx' | 'pdf'): string {
  return format === 'xlsx' ? 'Excel (XLSX)' : format.toUpperCase();
}

export function reportPreviewTitle(type: ReportType): string {
  return REPORT_CATALOG[type].label;
}
