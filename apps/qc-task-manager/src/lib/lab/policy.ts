// QC Laboratory test-form policy (PROMPT 05).
//
// Single source of truth for the shared AIR/VACUUM test form (page reference
// §§11–19): field limits, the exact printed options, and the reference values
// that are DISPLAYED ONLY — never validated against measurements. Values here
// are copied verbatim from the approved printed form; nothing is invented.
//
// Reference values are also snapshotted onto the test record at submission
// (parameters_snapshot_json) so an approved record keeps the criteria it was
// tested against, even if this file changes later.

/** Bounded sample grid (lab_test_records.sample_count CHECK: 1–20). */
export const LAB_SAMPLE_COUNT_MIN = 1;
export const LAB_SAMPLE_COUNT_MAX = 20;
export const LAB_SAMPLE_COUNT_DEFAULT = 5;

/** Printed Connector Type options — exact labels from the approved form (§11). */
export const LAB_CONNECTOR_TYPES = [
  'Non-locking (Lipid connector)',
  'Connector with floating or rotatable collar',
  'Locking connector with fixed threads',
] as const;

/** Sample + final result choices. 'HOLD' is stored; the printed label is longer. */
export const LAB_RESULT_OPTIONS = ['PASS', 'FAIL', 'HOLD'] as const;
export type LabResultOption = (typeof LAB_RESULT_OPTIONS)[number];

/** Printed label shown for the stored 'HOLD' value (§16). */
export const LAB_RESULT_LABELS: Record<LabResultOption, string> = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  HOLD: 'HOLD / FURTHER EVALUATION',
};

/** Section 3 — Actual Pressure display reference (display only, no validation). */
export const LAB_ACTUAL_PRESSURE_REFERENCE = '(-2.5 ~ -4) in./Hg';

/** Section 5 — controlled reference values (display only, no validation). */
export const LAB_STANDARD_PARAMETER = 'Subatmospheric Pressure -40 ~ -80 kPa';
export const LAB_ACCEPTANCE_CRITERIA = '≤ 800 Pa';
export const LAB_HOLDING_TIME = '18 ~ 56 Sec.';

/** Section 5 values serialized into parameters_snapshot_json at submission. */
export function labParametersSnapshotJson(): string {
  return JSON.stringify({
    standard_parameter: LAB_STANDARD_PARAMETER,
    acceptance_criteria: LAB_ACCEPTANCE_CRITERIA,
    holding_time: LAB_HOLDING_TIME,
    actual_pressure_reference: LAB_ACTUAL_PRESSURE_REFERENCE,
  });
}

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