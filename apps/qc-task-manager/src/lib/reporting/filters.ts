import { FINDING_CLASSIFICATIONS, RISK_LEVELS, TASK_PRIORITIES } from '../task-policy';
import { SLA_STATUSES } from '../sla';
import { LAB_RESULT_OPTIONS, LAB_RETEST_REASONS } from '../lab/policy';
import { LAB_REPORT_STATUSES } from '../lab/labReports';
import type { ReportFilters } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const REPORT_QUERY_KEYS = new Set([
  'from', 'to', 'department', 'employee', 'supervisor', 'priority', 'risk',
  'finding_classification', 'sla_status', 'test_type', 'result', 'status',
  'reason', 'product', 'equipment', 'scope',
]);

function rejectUnsupportedParameters(params: URLSearchParams): void {
  for (const key of params.keys()) {
    if (!REPORT_QUERY_KEYS.has(key)) throw new Error(`Unsupported report parameter: ${key}`);
  }
}

function date(value: string | null, field: string): string | null {
  if (!value) return null;
  if (!DATE_RE.test(value)) throw new Error(`Invalid ${field} date`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`Invalid ${field} date`);
  return value;
}

function enumValue<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[], uppercase = false): T | null {
  const raw = params.get(key);
  if (!raw) return null;
  const normalized = uppercase ? raw.toUpperCase() : raw;
  if (!allowed.includes(normalized as T)) throw new Error(`Invalid ${key} filter`);
  return normalized as T;
}

function positiveId(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`Invalid ${key} filter`);
  return value;
}

export function parseReportFilters(params: URLSearchParams): ReportFilters {
  rejectUnsupportedParameters(params);
  const scope = params.get('scope');
  if (scope && scope !== 'organization') throw new Error('Invalid scope parameter');
  const from = date(params.get('from'), 'from');
  const to = date(params.get('to'), 'to');
  if (from && to && from > to) throw new Error('From date must be on or before the to date');
  const department = params.get('department')?.trim() || null;
  if (department && department.length > 50) throw new Error('Invalid department filter');
  return {
    from,
    to,
    department,
    employee: positiveId(params, 'employee'),
    supervisor: positiveId(params, 'supervisor'),
    priority: enumValue(params, 'priority', TASK_PRIORITIES),
    risk: enumValue(params, 'risk', RISK_LEVELS),
    finding_classification: enumValue(params, 'finding_classification', FINDING_CLASSIFICATIONS),
    sla_status: enumValue(params, 'sla_status', SLA_STATUSES, true),
    // Laboratory report filters (§13) — ignored by task reports, validated here.
    test_type: enumValue(params, 'test_type', ['air', 'vacuum'] as const),
    result: enumValue(params, 'result', LAB_RESULT_OPTIONS, true),
    status: enumValue(params, 'status', LAB_REPORT_STATUSES),
    reason: enumValue(params, 'reason', LAB_RETEST_REASONS),
    product: positiveId(params, 'product'),
    equipment: positiveId(params, 'equipment'),
  };
}

/** Parse the only scope escalation advertised by the reports UI. */
export function parseReportScope(params: URLSearchParams): boolean {
  const scope = params.get('scope');
  if (scope && scope !== 'organization') throw new Error('Invalid scope parameter');
  return scope === 'organization';
}

export const emptyReportFilters: ReportFilters = {
  from: null, to: null, department: null, employee: null, supervisor: null,
  priority: null, risk: null, finding_classification: null, sla_status: null,
  test_type: null, result: null, status: null, reason: null, product: null, equipment: null,
};
