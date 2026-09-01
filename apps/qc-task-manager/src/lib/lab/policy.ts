// QC Laboratory test-form policy (PROMPT 05).
//
// Single source of truth for the shared AIR/VACUUM test form (page reference
// §§11–19): field limits, the exact printed options, and the reference values
// that are DISPLAYED ONLY — never validated against measurements. Values here
// are copied verbatim from the approved printed form; nothing is invented.
//
// Reference values are owned by approved template versions. This module must
// not contain scientific defaults or create a reference snapshot.

/** Bounded sample grid (lab_test_records.sample_count CHECK: 1–20). */
export const LAB_SAMPLE_COUNT_MIN = 1;
export const LAB_SAMPLE_COUNT_MAX = 20;
export const LAB_SAMPLE_COUNT_DEFAULT = 5;

/** Printed Connector Type options — exact labels from the approved form (§11). */
export const LAB_CONNECTOR_TYPES = [
  'Non-locking (rigid) connector',
  'Connector with floating or movable collar',
  'Locking connector with fixed threads',
] as const;

/** FR-MA-018 sample decisions. Template-specific policies can override this list. */
export const LAB_SAMPLE_RESULT_OPTIONS = ['PASS', 'FAIL'] as const;
/** FR-MA-018 final disposition decisions. */
export const LAB_FINAL_RESULT_OPTIONS = ['PASS', 'FAIL', 'HOLD'] as const;
export const LAB_RESULT_OPTIONS = LAB_FINAL_RESULT_OPTIONS;
export type LabResultOption = (typeof LAB_FINAL_RESULT_OPTIONS)[number];
export type LabSampleResultOption = (typeof LAB_SAMPLE_RESULT_OPTIONS)[number];

/** Printed label shown for the stored 'HOLD' value (§16). */
export const LAB_RESULT_LABELS: Record<LabResultOption, string> = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  HOLD: 'HOLD / FURTHER EVALUATION',
};

// ── Free-text field limits (employee-entry fields only, printed-form §11–17) ──

/** Product Description, Lot Number, Sampling Area, Medium Used, Angle. */
export const LAB_SHORT_TEXT_MAX = 200;

/** Controlled retest reasons (lab_test_retests CHECK, migration 012 §46). */
export const LAB_RETEST_REASONS = ['FAIL', 'HOLD', 'SAMPLE_ISSUE', 'EQUIPMENT_ISSUE', 'PROCEDURAL_ISSUE', 'OTHER'] as const;
export type LabRetestReason = (typeof LAB_RETEST_REASONS)[number];
export const LAB_RETEST_REASON_LABELS: Record<LabRetestReason, string> = {
  FAIL: 'FAIL result',
  HOLD: 'HOLD / Further evaluation',
  SAMPLE_ISSUE: 'Sample issue',
  EQUIPMENT_ISSUE: 'Equipment issue',
  PROCEDURAL_ISSUE: 'Procedural issue',
  OTHER: 'Other documented reason',
};

/** Retest lifecycle: OPEN at creation, COMPLETED when the new test is approved. */
export const LAB_RETEST_STATUSES = ['OPEN', 'COMPLETED'] as const;
export type LabRetestStatus = (typeof LAB_RETEST_STATUSES)[number];
/** Remarks (free-form, sanitized server-side). */
export const LAB_REMARKS_MAX = 5000;
/** Connector Assembly / Differential Conversion / sample measurement cells. */
export const LAB_MEASUREMENT_MAX = 50;
/** Sample Part Name. */
export const LAB_PART_NAME_MAX = 200;

// ── Session environment readings (PROMPT 51) ────────────────────────────────

/**
 * Bounded readings log per test — supplementary observations only, never a
 * replacement for the headline temperature_measured field. The bound mirrors
 * the sample-grid ceiling: no arbitrary row growth.
 */
export const LAB_ENV_READINGS_MAX = 20;
/** Timestamp cell length (datetime-local values are well under this). */
export const LAB_ENV_READING_AT_MAX = 40;
/** Free-text note per reading. */
export const LAB_ENV_READING_NOTES_MAX = 2000;

// ── Maintenance event policy (/lab/equipment/[id]/maintenance) ──────────────

/**
 * Maintenance event status values — the single source of truth for the
 * maintenance log's controlled status field (page reference §36). These are
 * values the application defines for NEW events (never fabricated history),
 * and COMPLETED + completed_date is what the equipment timeline uses to
 * derive "returned to service". Store the uppercase token; display via
 * LAB_MAINTENANCE_STATUS_LABELS.
 */
export const LAB_MAINTENANCE_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type LabMaintenanceStatus = (typeof LAB_MAINTENANCE_STATUSES)[number];

export const LAB_MAINTENANCE_STATUS_LABELS: Record<LabMaintenanceStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ── Controlled document editor policy (/lab/documents/new + [id]/edit) ────────

/** Max length of the authored Markdown content (lab_document_versions.content_md). */
export const LAB_DOCUMENT_CONTENT_MAX = 200_000;
/** Max length of the change summary (required when revising an approved version). */
export const LAB_DOCUMENT_CHANGE_SUMMARY_MAX = 2000;
/** Max length of a document description (lab_documents.description). */
export const LAB_DOCUMENT_DESCRIPTION_MAX = 2000;
/** Max length of a document title (lab_documents.title). */
export const LAB_DOCUMENT_TITLE_MAX = 200;
/** Max length of a document code (lab_documents.code). */
export const LAB_DOCUMENT_CODE_MAX = 60;

/** Short retest-reason labels used on the test record + print views (the
 *  longer canonical labels in LAB_RETEST_REASON_LABELS serve the retest pages). */
export const LAB_RETEST_REASON_SHORT_LABELS: Record<string, string> = {
  FAIL: 'FAIL',
  HOLD: 'HOLD / Further Evaluation',
  SAMPLE_ISSUE: 'Sample Issue',
  EQUIPMENT_ISSUE: 'Equipment Issue',
  PROCEDURAL_ISSUE: 'Procedural Issue',
  OTHER: 'Other',
};

/** Sample-row status labels for the test record + print views. */
export const LAB_SAMPLE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  TESTED: 'Tested',
  APPROVED: 'Approved',
  VOID: 'Void',
};

/** Snapshot parameter labels for the test record + print views. */
export const LAB_TEST_PARAM_LABELS: Record<string, string> = {
  standard_parameter: 'Standard Parameter',
  acceptance_criteria: 'Acceptance Criteria',
  holding_time: 'Holding Time',
  actual_pressure_reference: 'Actual Pressure Reference',
};

/** Approved and voided lab records are frozen (§49 immutability rule). */
export function isLabTestRecordImmutable(status: string): boolean {
  return status === 'APPROVED' || status === 'VOID';
}

/** Product-fail-rate ratio (%) above which the lab surfaces turn red. */
export const LAB_FAIL_RATE_ALERT_THRESHOLD = 50;
