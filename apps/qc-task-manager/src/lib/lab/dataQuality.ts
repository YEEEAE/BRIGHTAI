// QC Laboratory Data Quality detectors (PROMPT 27, page reference §56/§75).
//
// READ-ONLY informational checks. This module only ever SELECTs from the lab_*
// tables and never mutates a single row — the Data Quality page reports
// incomplete or inconsistent records and links to them; fixing them is always
// a human action in the owning module.
//
// Every detector reports ONLY conditions backed by stored data + established
// policy:
//   * Tests — required-field gaps at submit time (the shared form enforces
//     lot/equipment/tester/complete sample grid for submission, PROMPT 05) and
//     final result at approval (a human decision, §76); workflow consistency
//     checks follow the transition writes in review.ts (UNDER_REVIEW/APPROVED
//     always set reviewed_at; APPROVED always sets approved_at; any post-draft
//     status has submitted_at); VOID records are excluded everywhere except
//     the consistency checks (voiding preserves fields as-is).
//   * Equipment — registry identity gaps on non-archived rows (code/serial/
//     location are stored fields; the registry's calibration flag is the
//     yes/no field from migration 018 — a NULL flag is "Unknown"). Dated
//     calibration records are the calibration register's concern, not a
//     master-data gap.
//   * Documents — active documents (SUPERSEDED/ARCHIVED excluded): owner,
//     review date, effective date, current version pointer; APPROVED
//     documents must additionally carry approval metadata (the document-level
//     approver + date columns from migration 013).
//   * Products — active products: code + default test type (the KPI policy
//     from §56 "incomplete reference setup"); PLUS inactive products that are
//     still referenced by live (non-VOID, non-DRAFT) test records.
//
// Deliberately NOT reported (no data/policy supports them today):
//   * "Product missing applicable SOP/WI" — nothing in the schema or the
//     forms makes an applicable document mandatory for a product, so flagging
//     it would be invented policy.

import { getDb } from '../db';

export type LabDataQualityCategory = 'tests' | 'equipment' | 'documents' | 'products';

export type LabDataQualityKind =
  // Tests
  | 'test_missing_lot'
  | 'test_missing_equipment'
  | 'test_missing_tester'
  | 'test_incomplete_samples'
  | 'test_missing_final_result'
  | 'test_missing_submission'
  | 'test_inconsistent_status'
  // Equipment
  | 'equipment_missing_code'
  | 'equipment_missing_serial'
  | 'equipment_missing_calibration_state'
  | 'equipment_missing_location'
  // Documents
  | 'document_missing_owner'
  | 'document_missing_review_date'
  | 'document_missing_effective_date'
  | 'document_missing_current_version'
  | 'document_missing_approval_metadata'
  // Products
  | 'product_missing_code'
  | 'product_missing_default_test_type'
  | 'product_inactive_in_use';

export interface LabDataQualityIssue {
  kind: LabDataQualityKind;
  category: LabDataQualityCategory;
  /** Stable record identifier for display (number/code/name — never an id alone). */
  record: string;
  /** Human-readable gap description. */
  detail: string;
  /** Link to the affected record in its owning register. */
  href: string;
}

export const LAB_DATA_QUALITY_ISSUE_LABELS: Record<LabDataQualityKind, string> = {
  test_missing_lot: 'Missing Lot Number',
  test_missing_equipment: 'Missing Equipment',
  test_missing_tester: 'Missing Tester',
  test_incomplete_samples: 'Incomplete samples',
  test_missing_final_result: 'Missing Final Result',
  test_missing_submission: 'Missing submission date',
  test_inconsistent_status: 'Inconsistent workflow status',
  equipment_missing_code: 'Missing code',
  equipment_missing_serial: 'Missing serial number',
  equipment_missing_calibration_state: 'Missing calibration state',
  equipment_missing_location: 'Missing location',
  document_missing_owner: 'Missing owner',
  document_missing_review_date: 'Missing review date',
  document_missing_effective_date: 'Missing effective date',
  document_missing_current_version: 'Missing current version',
  document_missing_approval_metadata: 'Missing approval metadata',
  product_missing_code: 'Missing code',
  product_missing_default_test_type: 'Missing default test type',
  product_inactive_in_use: 'Inactive product in use',
};

/** Issue kinds that signal data integrity problems (not just gaps). */
const DANGEROUS_KINDS: ReadonlySet<LabDataQualityKind> = new Set([
  'test_missing_final_result',
  'test_missing_submission',
  'test_inconsistent_status',
  'product_inactive_in_use',
]);

export function labDataQualitySeverity(kind: LabDataQualityKind): 'danger' | 'info' {
  return DANGEROUS_KINDS.has(kind) ? 'danger' : 'info';
}

interface TestGapRow {
  id: number;
  test_number: string;
  sample_count: number;
  sample_rows: number;
}

// Shared WHERE fragments. VOID is exempt from required-field checks because
// voiding intentionally preserves a record as-is.
const NOT_VOID = `t.status <> 'VOID'`;

function testRows(where: string): TestGapRow[] {
  return getDb()
    .prepare(
      `SELECT t.id, t.test_number, t.sample_count,
              (SELECT COUNT(*) FROM lab_test_samples s WHERE s.test_id = t.id) AS sample_rows
       FROM lab_test_records t
       WHERE ${where}
       ORDER BY t.id ASC`,
    )
    .all() as TestGapRow[];
}

/** Tests with required-field gaps or workflow inconsistencies (see header). */
export function detectLabTestIssues(): LabDataQualityIssue[] {
  const db = getDb();
  const issues: LabDataQualityIssue[] = [];
  const href = (id: number) => `/lab/tests/${id}`;

  for (const r of testRows(`${NOT_VOID} AND (t.lot_number IS NULL OR TRIM(t.lot_number) = '')`)) {
    issues.push({
      kind: 'test_missing_lot',
      category: 'tests',
      record: r.test_number,
      detail: 'The Lot Number is empty.',
      href: href(r.id),
    });
  }

  for (const r of testRows(`${NOT_VOID} AND t.equipment_id IS NULL`)) {
    issues.push({
      kind: 'test_missing_equipment',
      category: 'tests',
      record: r.test_number,
      detail: 'No equipment is linked to this test.',
      href: href(r.id),
    });
  }

  for (const r of testRows(`${NOT_VOID} AND t.tested_by IS NULL`)) {
    issues.push({
      kind: 'test_missing_tester',
      category: 'tests',
      record: r.test_number,
      detail: 'No tester is recorded.',
      href: href(r.id),
    });
  }

  for (const r of testRows(
    `${NOT_VOID} AND (SELECT COUNT(*) FROM lab_test_samples s WHERE s.test_id = t.id) <> t.sample_count`,
  )) {
    issues.push({
      kind: 'test_incomplete_samples',
      category: 'tests',
      record: r.test_number,
      detail: `${r.sample_rows} of ${r.sample_count} expected sample rows are recorded.`,
      href: href(r.id),
    });
  }

  // Final result is a human decision that must exist once a test is approved.
  for (const r of testRows(`t.status = 'APPROVED' AND t.final_result IS NULL`)) {
    issues.push({
      kind: 'test_missing_final_result',
      category: 'tests',
      record: r.test_number,
      detail: 'Approved without a Final Result (PASS/FAIL/HOLD).',
      href: href(r.id),
    });
  }

  // Workflow consistency — the transitions in review.ts always write these
  // timestamps, so their absence means the record did not flow through the
  // controlled workflow. (A SUBMITTED record without submitted_at is the
  // same class of gap — the KPI counts it the same way, §56.)
  const inconsistent = db
    .prepare(
      `SELECT t.id, t.test_number, t.status, t.submitted_at, t.reviewed_at, t.approved_at
       FROM lab_test_records t
       WHERE (t.status IN ('SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'APPROVED') AND t.submitted_at IS NULL)
          OR (t.status IN ('UNDER_REVIEW', 'APPROVED') AND t.reviewed_at IS NULL)
          OR (t.status = 'APPROVED' AND t.approved_at IS NULL)
       ORDER BY t.id ASC`,
    )
    .all() as Array<{
    id: number;
    test_number: string;
    status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    approved_at: string | null;
  }>;

  for (const r of inconsistent) {
    const missing: string[] = [];
    if (r.status !== 'DRAFT' && r.submitted_at == null) missing.push('submitted_at');
    if ((r.status === 'UNDER_REVIEW' || r.status === 'APPROVED') && r.reviewed_at == null) missing.push('reviewed_at');
    if (r.status === 'APPROVED' && r.approved_at == null) missing.push('approved_at');
    issues.push({
      kind: r.submitted_at == null && r.status !== 'DRAFT' ? 'test_missing_submission' : 'test_inconsistent_status',
      category: 'tests',
      record: r.test_number,
      detail: `Status is ${r.status} but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not recorded.`,
      href: href(r.id),
    });
  }

  return issues;
}

interface EquipmentGapRow {
  id: number;
  code: string | null;
  name: string;
}

function equipmentRows(where: string): EquipmentGapRow[] {
  return getDb()
    .prepare(
      `SELECT e.id, e.code, e.name
       FROM lab_equipment e
       WHERE e.is_archived = 0 AND (${where})
       ORDER BY e.id ASC`,
    )
    .all() as EquipmentGapRow[];
}

function equipmentLabel(r: EquipmentGapRow): string {
  return r.code && r.code.trim() !== '' ? r.code : r.name;
}

/** Non-archived equipment with missing registry identity (code/serial/flag/location). */
export function detectLabEquipmentIssues(): LabDataQualityIssue[] {
  const issues: LabDataQualityIssue[] = [];
  const href = (id: number) => `/lab/equipment/${id}`;

  for (const r of equipmentRows(`e.code IS NULL OR TRIM(e.code) = ''`)) {
    issues.push({
      kind: 'equipment_missing_code',
      category: 'equipment',
      record: equipmentLabel(r),
      detail: 'The equipment code is empty.',
      href: href(r.id),
    });
  }

  for (const r of equipmentRows(`e.serial_number IS NULL`)) {
    issues.push({
      kind: 'equipment_missing_serial',
      category: 'equipment',
      record: equipmentLabel(r),
      detail: 'No serial number is recorded.',
      href: href(r.id),
    });
  }

  // The registry's own calibration flag (migration 018) — NULL = Unknown.
  for (const r of equipmentRows(`e.calibration_status_raw IS NULL`)) {
    issues.push({
      kind: 'equipment_missing_calibration_state',
      category: 'equipment',
      record: equipmentLabel(r),
      detail: 'The calibration flag is not set (Unknown).',
      href: href(r.id),
    });
  }

  for (const r of equipmentRows(`e.location IS NULL`)) {
    issues.push({
      kind: 'equipment_missing_location',
      category: 'equipment',
      record: equipmentLabel(r),
      detail: 'No location is recorded.',
      href: href(r.id),
    });
  }

  return issues;
}

interface DocumentGapRow {
  id: number;
  code: string;
}

function documentRows(where: string): DocumentGapRow[] {
  return getDb()
    .prepare(
      `SELECT d.id, d.code
       FROM lab_documents d
       WHERE d.status NOT IN ('SUPERSEDED', 'ARCHIVED')
         AND NOT (d.type = 'WI' AND COALESCE(d.source_register_code, '') = 'F-4-2-1-2' AND d.current_version_id IS NULL)
         AND (${where})
       ORDER BY d.id ASC`,
    )
    .all() as DocumentGapRow[];
}

/** Active documents with ownership/date/version/approval gaps. */
export function detectLabDocumentIssues(): LabDataQualityIssue[] {
  const issues: LabDataQualityIssue[] = [];
  const href = (id: number) => `/lab/documents/${id}/edit`;

  for (const r of documentRows(`d.owner_id IS NULL`)) {
    issues.push({
      kind: 'document_missing_owner',
      category: 'documents',
      record: r.code,
      detail: 'No owner is assigned.',
      href: href(r.id),
    });
  }

  for (const r of documentRows(`d.review_due_date IS NULL`)) {
    issues.push({
      kind: 'document_missing_review_date',
      category: 'documents',
      record: r.code,
      detail: 'No review due date is set.',
      href: href(r.id),
    });
  }

  for (const r of documentRows(`d.effective_date IS NULL`)) {
    issues.push({
      kind: 'document_missing_effective_date',
      category: 'documents',
      record: r.code,
      detail: 'No effective date is set.',
      href: href(r.id),
    });
  }

  for (const r of documentRows(`d.current_version_id IS NULL`)) {
    issues.push({
      kind: 'document_missing_current_version',
      category: 'documents',
      record: r.code,
      detail: 'The current version pointer is not set.',
      href: href(r.id),
    });
  }

  // Approval metadata lives on the document-level columns (migration 013).
  for (const r of documentRows(`d.status = 'APPROVED' AND (d.approver_id IS NULL OR d.approved_at IS NULL)`)) {
    issues.push({
      kind: 'document_missing_approval_metadata',
      category: 'documents',
      record: r.code,
      detail: 'Approved without approver / approval date metadata.',
      href: href(r.id),
    });
  }

  return issues;
}

interface ProductGapRow {
  id: number;
  code: string | null;
  name: string;
}

/** Active products with identity/reference gaps + inactive products still in use. */
export function detectLabProductIssues(): LabDataQualityIssue[] {
  const db = getDb();
  const issues: LabDataQualityIssue[] = [];
  const href = (id: number) => `/lab/products/${id}`;
  const label = (r: ProductGapRow) => (r.code && r.code.trim() !== '' ? r.code : r.name);

  const activeWhere = (where: string) =>
    db
      .prepare(
        `SELECT p.id, p.code, p.name FROM lab_products p WHERE p.is_active = 1 AND (${where}) ORDER BY p.id ASC`,
      )
      .all() as ProductGapRow[];

  for (const r of activeWhere(`p.code IS NULL OR TRIM(p.code) = ''`)) {
    issues.push({
      kind: 'product_missing_code',
      category: 'products',
      record: label(r),
      detail: 'The product code is empty.',
      href: href(r.id),
    });
  }

  for (const r of activeWhere(`p.default_test_type IS NULL`)) {
    issues.push({
      kind: 'product_missing_default_test_type',
      category: 'products',
      record: label(r),
      detail: 'No default test type (AIR/VACUUM) is set.',
      href: href(r.id),
    });
  }

  // Inactive products still referenced by live tests (non-DRAFT, non-VOID) —
  // an archive that unexpectedly still participates in testing.
  const inactive = db
    .prepare(
      `SELECT p.id, p.code, p.name,
              (SELECT COUNT(*) FROM lab_test_records t
                WHERE t.product_id = p.id AND t.status NOT IN ('DRAFT', 'VOID')) AS live_tests
       FROM lab_products p
       WHERE p.is_active = 0
         AND EXISTS (SELECT 1 FROM lab_test_records t
                     WHERE t.product_id = p.id AND t.status NOT IN ('DRAFT', 'VOID'))
       ORDER BY p.id ASC`,
    )
    .all() as Array<ProductGapRow & { live_tests: number }>;

  for (const r of inactive) {
    issues.push({
      kind: 'product_inactive_in_use',
      category: 'products',
      record: label(r),
      detail: `Inactive product still referenced by ${r.live_tests} live test record(s).`,
      href: href(r.id),
    });
  }

  return issues;
}

export interface LabDataQualityReport {
  tests: LabDataQualityIssue[];
  equipment: LabDataQualityIssue[];
  documents: LabDataQualityIssue[];
  products: LabDataQualityIssue[];
  total: number;
}

/** Full read-only report (page + KPI). Never mutates anything. */
export function runLabDataQualityChecks(): LabDataQualityReport {
  const tests = detectLabTestIssues();
  const equipment = detectLabEquipmentIssues();
  const documents = detectLabDocumentIssues();
  const products = detectLabProductIssues();
  return { tests, equipment, documents, products, total: tests.length + equipment.length + documents.length + products.length };
}
