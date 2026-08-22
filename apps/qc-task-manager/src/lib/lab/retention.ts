// Retention AWARENESS readers (QC-LAB-ARCHITECTURE.md §13 pattern).
//
// ABSOLUTE RULE: this module is READ-ONLY awareness. It never deletes,
// purges, archives, flags-for-deletion, or triggers any automatic action.
// The only deliverable is a supervisor+ report listing records that have
// become ELIGIBLE FOR ARCHIVAL REVIEW under the configured retention
// policy. Any actual archival/destruction decision remains a separate,
// human-initiated workflow outside this module.
//
// The retention period is a documented business constant — NOT a regulatory
// claim. Default is 5 years measured from the record's approval date; the
// business may change the constants below without touching any query.

import { getDb } from '../db';
import type { ReportFilters } from '../reporting/types';
import type { ReportCell, LabReportFilterValues } from './labReports';

/**
 * Documented business default (years from approval date). This number carries
 * NO regulatory authority — it is an operational default the business owns
 * and may change here in one place.
 */
export const LAB_RETENTION_YEARS_DEFAULT = 5;

/** Per-record-family retention configuration (business-changeable constants). */
export interface LabRetentionPolicyEntry {
  /** Human-readable family name used in the report rows. */
  family: string;
  /** Retention period in years from the anchor date. */
  retentionYears: number;
  /** Anchor date column: retention is measured FROM APPROVAL DATE. */
  anchorColumn: 'approved_at';
}

export const LAB_RETENTION_POLICY: ReadonlyArray<LabRetentionPolicyEntry> = [
  { family: 'Test Records', retentionYears: LAB_RETENTION_YEARS_DEFAULT, anchorColumn: 'approved_at' },
  { family: 'Controlled Documents', retentionYears: LAB_RETENTION_YEARS_DEFAULT, anchorColumn: 'approved_at' },
];

const CHUNK_SIZE = 500;

function* yieldFamilyRows(
  reportId: string,
  policy: LabRetentionPolicyEntry,
  selectBase: string,
): Generator<readonly ReportCell[]> {
  const db = getDb();
  let cursor: number | null = null;
  for (;;) {
    // Eligible for ARCHIVAL REVIEW = approved on/before (now − retention).
    // Purely derived at read time; nothing stored, nothing mutated.
    const eligibility =
      `date(a.${policy.anchorColumn}) <= date('now','localtime','-${policy.retentionYears} years')`;
    const sql = cursor === null
      ? `${selectBase} WHERE a.status = 'APPROVED' AND a.${policy.anchorColumn} IS NOT NULL AND ${eligibility}
         ORDER BY a.id DESC LIMIT ${CHUNK_SIZE}`
      : `${selectBase} WHERE a.status = 'APPROVED' AND a.${policy.anchorColumn} IS NOT NULL AND ${eligibility}
         AND a.id < ? ORDER BY a.id DESC LIMIT ${CHUNK_SIZE}`;
    const params: (string | number)[] = cursor === null ? [] : [cursor];
    const rows = db.prepare(sql).all(...params) as Record<string, ReportCell>[];
    if (rows.length === 0) return;
    cursor = Number(rows[rows.length - 1].id);
    for (const row of rows) {
      yield [
        reportId,
        policy.family,
        row.record_ref,
        row.detail,
        row[policy.anchorColumn],
        row.retention_until,
        Number(row.days_remaining),
        'Eligible for archival review',
      ];
    }
    if (rows.length < CHUNK_SIZE) return;
  }
}

const TEST_SELECT = `
  SELECT a.id, a.test_number AS record_ref,
         COALESCE(p.name, '') || ' / lot ' || COALESCE(a.lot_number, '-') AS detail,
         a.approved_at,
         date(a.approved_at, '+${LAB_RETENTION_YEARS_DEFAULT} years') AS retention_until,
         CAST(julianday(date(a.approved_at, '+${LAB_RETENTION_YEARS_DEFAULT} years'))
              - julianday('now','localtime') AS INTEGER) AS days_remaining
  FROM lab_test_records a
  LEFT JOIN lab_products p ON p.id = a.product_id`;

const DOCUMENT_SELECT = `
  SELECT a.id, a.code AS record_ref, a.title AS detail,
         a.approved_at,
         date(a.approved_at, '+${LAB_RETENTION_YEARS_DEFAULT} years') AS retention_until,
         CAST(julianday(date(a.approved_at, '+${LAB_RETENTION_YEARS_DEFAULT} years'))
              - julianday('now','localtime') AS INTEGER) AS days_remaining
  FROM lab_documents a`;/**
 * Read-only Retention Status report. Yields one row per record whose
 * configured retention window has fully elapsed — i.e. candidates a human
 * MAY choose to review for archiving. Performs NO writes of any kind.
 */
export function* readLabRetentionStatus(reportId: string, _filters: LabReportFilterValues | ReportFilters): Generator<readonly ReportCell[]> {
  void _filters;
  for (const policy of LAB_RETENTION_POLICY) {
    const base = policy.family === 'Test Records' ? TEST_SELECT : DOCUMENT_SELECT;
    yield* yieldFamilyRows(reportId, policy, base);
  }
}
