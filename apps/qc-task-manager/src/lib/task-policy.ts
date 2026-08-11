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

import type { TaskPriority, TaskRecurrence, TaskStatus } from './types';

// ─────────────────────────── Enumerations ───────────────────────────

/** All statuses a task can ever be in (matches the schema CHECK constraint). */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'not_started',
  'in_progress',
  'on_hold',
  'completed',
];

/** Statuses that can be set through the regular update form (completed is not one). */
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
/** Max depth walked when checking dependency cycles at creation time. */
export const MAX_DEPENDENCY_DEPTH = 20;

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

// ─────────────────────────── Predicates ───────────────────────────

/** RULE #3 — completed tasks are frozen for everyone. */
export function isTaskReadOnly(status: TaskStatus | string): boolean {
  return status === 'completed';
}

/** Is `status` a settable active state (not completed)? */
export function isActiveStatus(status: string): boolean {
  return (ACTIVE_TASK_STATUSES as readonly string[]).includes(status);
}

/**
 * RULE #3 — status transitions. Any active → any active is allowed; nothing may
 * leave `completed` (reopening is a deliberate, logged admin/manager action and
 * is handled separately from the generic update path).
 */
export function canTransitionStatus(from: TaskStatus | string, to: string): boolean {
  if (!isActiveStatus(to)) return false;
  return isTaskReadOnly(from) ? false : true;
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
