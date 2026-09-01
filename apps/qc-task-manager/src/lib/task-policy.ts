// Canonical task domain policy — the single source of truth for the CORE
// BUSINESS RULES that govern task state.
//
// Everything here is intentionally dependency-free (types only, no DB, no
// server-only imports) so it can be imported from server libs, pages, React
// islands, and the Node test runner alike. If a rule changes, it changes HERE:
//
//   RULE #1  Employees have no dashboard; roles route to roleHome().
//   RULE #2  Field locking: employees may only edit status / progress_percent /
//            blocker_note (comments + attachments go through dedicated APIs).
//   RULE #3  Completed tasks are read-only for everyone.
//   RULE #4  Employees never delete tasks — they submit delete requests.
//   RULE #5  Evidence/attachments are stored as BLOBs, validated ext+MIME+10 MB.
//   RULE #6  Every task mutation is recorded in task_activity_log.

import type { TaskPriority, TaskRecurrence, TaskStatus, RiskLevel, FindingClassification } from './types';

// ─────────────────────────── Enumerations ───────────────────────────

/** All statuses a task can ever be in (matches the schema CHECK constraint). */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'not_started',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
];

/**
 * Statuses that can be set through the regular update form (completed is not
 * one — it goes through the completion wizard; cancelled is manager/admin-only
 * through the dedicated cancel flow).
 */
export const ACTIVE_TASK_STATUSES: readonly TaskStatus[] = [
  'not_started',
  'in_progress',
  'on_hold',
];

/** Priorities (matches the schema CHECK constraint). */
export const TASK_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

/** Recurrence intervals (matches the schema CHECK constraint). */
export const TASK_RECURRENCES: readonly TaskRecurrence[] = ['none', 'daily', 'weekly', 'monthly'];

// ───────────────────────────── Limits ─────────────────────────────

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_BLOCKER_LENGTH = 1000;
export const MAX_REASON_LENGTH = 1000;
export const MAX_FILE_NAME = 200;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (per spec)
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_USERNAME_LENGTH = 50;
export const MAX_DEPARTMENT_LENGTH = 50;
/** Max checklist items per task (creation + editing). */
export const MAX_CHECKLIST_ITEMS = 30;
export const MAX_CHECKLIST_TITLE_LENGTH = 200;
/** Max dependencies per task. */
export const MAX_DEPENDENCIES = 20;
/** Max length of the explicit dependency-override reason (admin/manager only). */
export const MAX_OVERRIDE_REASON_LENGTH = 500;
export const MAX_QC_METADATA_LENGTH = 200;
export const RISK_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'critical'];
export const FINDING_CLASSIFICATIONS: readonly FindingClassification[] = ['conforming', 'minor', 'major', 'critical', 'observation'];
/** Max depth walked when checking dependency cycles at creation time. */
export const MAX_DEPENDENCY_DEPTH = 20;
/** Max length of a saved-search filter name (saved_filters.name). */
export const MAX_SAVED_FILTER_NAME = 100;
/** Max length of the stored filter JSON (saved_filters.filter_json). */
export const MAX_SAVED_FILTER_JSON = 4000;

// ───────────────────────── Field locking (RULE #2) ─────────────────────────

/** Fields an employee may edit after creation. */
export const EMPLOYEE_EDITABLE_FIELDS = [
  'status',
  'progress_percent',
  'blocker_note',
] as const;

/** Fields locked for employees (supervisor/manager/admin may edit them). */
export const EMPLOYEE_LOCKED_FIELDS = [
  'title',
  'description',
  'department',
  'assigned_to',
  'due_date',
  'priority',
  'recurrence',
  'recurrence_end_date',
  'checklist',
  'dependencies',
] as const;

export type EmployeeEditableField = (typeof EMPLOYEE_EDITABLE_FIELDS)[number];

// ─────────────────────── Upload allowlist (RULE #5) ───────────────────────

/**
 * Allowed extensions → accepted MIME types. A file passes validation ONLY when
 * BOTH its extension is listed here AND its declared MIME type is in the
 * extension's set (defense in depth against renamed executables).
 */
export const EXT_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/plain'],
  csv: ['text/csv', 'text/plain'],
  json: ['application/json', 'text/plain'],
  log: ['text/plain'],
  xml: ['application/xml', 'text/xml', 'text/plain'],
  sql: ['text/x-sql', 'application/sql', 'text/plain'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  xls: ['application/vnd.ms-excel'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  doc: ['application/msword'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ppt: ['application/vnd.ms-powerpoint'],
  zip: ['application/zip'],
};

export const ALLOWED_EXTENSIONS = Object.keys(EXT_MIME);

/** Readable list for UI hints, e.g. "pdf, png, jpg, …". */
export const ALLOWED_EXTENSIONS_HINT = ALLOWED_EXTENSIONS.join(', ');

/**
 * Evidence upload allowlist for the completion wizard — the ONLY types accepted
 * as completion evidence (per spec: PDF, PNG, JPG, JPEG, XLSX, DOCX).
 * Narrower than the generic attachment allowlist (EXT_MIME above).
 */
export const EVIDENCE_EXT_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export const EVIDENCE_EXTENSIONS = Object.keys(EVIDENCE_EXT_MIME);

/** Readable list for UI hints: "pdf, png, jpg, jpeg, xlsx, docx". */
export const EVIDENCE_EXTENSIONS_HINT = EVIDENCE_EXTENSIONS.join(', ');

/**
 * Magic bytes (file signatures) for the evidence types that have one. The
 * signature is checked IN ADDITION to extension + MIME where possible — a
 * renamed executable cannot pass even when its declared MIME matches.
 * xlsx/docx are OOXML ZIP packages (both start with the ZIP magic "PK..").
 */
export const EVIDENCE_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // \x89PNG\r\n\x1a\n
  jpg: [0xff, 0xd8, 0xff], // \xFF\xD8\xFF
  jpeg: [0xff, 0xd8, 0xff], // \xFF\xD8\xFF
  xlsx: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04 (ZIP container)
  docx: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04 (ZIP container)
};

/** Is `ext` one of the completion-evidence types? */
export function isEvidenceExtension(ext: string): boolean {
  return ext in EVIDENCE_EXT_MIME;
}

// ─────────────────────────── Predicates ───────────────────────────

/**
 * RULE #3 — completed AND cancelled tasks are frozen for everyone. Cancelled is
 * terminal (a manager/admin decision); it is not edited, only deleted via the
 * approved deletion workflow.
 */
export function isTaskReadOnly(status: TaskStatus | string): boolean {
  return status === 'completed' || status === 'cancelled';
}

/** Is `status` a settable active state (not completed/cancelled)? */
export function isActiveStatus(status: string): boolean {
  return (ACTIVE_TASK_STATUSES as readonly string[]).includes(status);
}

/**
 * RULE #3 — status transitions. The spec allows exactly these moves through
 * the regular update form:
 *   not_started → in_progress        (start work)
 *   not_started → on_hold            (blocker note REQUIRED — requiresBlockerNote)
 *   in_progress → on_hold            (blocker note REQUIRED — requiresBlockerNote)
 *   on_hold     → in_progress        (work resumes)
 * Everything else is rejected: going BACK to not_started is not in the spec,
 * `completed` only leaves via the admin/manager reopen flow, and `cancelled`
 * is set exclusively by the manager/admin cancel flow (never via this form).
 */
export function canTransitionStatus(from: TaskStatus | string, to: string): boolean {
  if (!isActiveStatus(to)) return false;
  if (isTaskReadOnly(from)) return false;
  if (from === to) return true;
  switch (to) {
    case 'in_progress':
      return from === 'not_started' || from === 'on_hold';
    case 'on_hold':
      return from === 'not_started' || from === 'in_progress';
    case 'not_started':
      return false;
    default:
      return false;
  }
}

/**
 * Moving a task INTO on_hold from not_started or in_progress requires a
 * non-empty blocker note explaining why work stopped (spec).
 */
export function requiresBlockerNote(from: TaskStatus | string, to: string): boolean {
  return to === 'on_hold' && (from === 'not_started' || from === 'in_progress');
}

/** Is `field` one of the employee-editable fields (RULE #2)? */
export function isEmployeeEditableField(field: string): boolean {
  return (EMPLOYEE_EDITABLE_FIELDS as readonly string[]).includes(field);
}

/** Is `field` locked for employees (RULE #2)? */
export function isEmployeeLockedField(field: string): boolean {
  return (EMPLOYEE_LOCKED_FIELDS as readonly string[]).includes(field);
}

/** A file extension is accepted when it is in the upload allowlist (RULE #5). */
export function isAllowedExtension(ext: string): boolean {
  return ext in EXT_MIME;
}

/** Is `recurrence` a valid interval (or 'none')? */
export function isRecurrence(value: string): value is TaskRecurrence {
  return (TASK_RECURRENCES as readonly string[]).includes(value);
}

/** A dependency override reason is required whenever admin/manager force past a block. */
export function isValidOverrideReason(reason: string): boolean {
  const r = reason.trim();
  return r.length > 0 && r.length <= MAX_OVERRIDE_REASON_LENGTH;
}

export function isRiskLevel(value: string): value is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(value);
}

export function isFindingClassification(value: string): value is FindingClassification {
  return (FINDING_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function normalizeOptionalMetadata(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.length <= MAX_QC_METADATA_LENGTH ? trimmed : undefined;
}

/** Delete-request eligibility (CORE BUSINESS RULE #4): employees may request
 *  deletion of their own tasks only while they are not started or in progress;
 *  completed tasks are never requestable (#3) and manager/admin delete directly.
 *  Single authority — the page renders this decision, the workflow enforces it. */
export function canRequestTaskDeletion(
  user: { userId: number; role: string },
  task: { status: string; created_by: number | null; assigned_to: number | null } | null,
): boolean {
  if (!task || user.role !== 'employee') return false;
  if (task.status !== 'not_started' && task.status !== 'in_progress') return false;
  return task.created_by === user.userId || task.assigned_to === user.userId;
}
