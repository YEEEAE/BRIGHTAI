// Task update, closure, and attachment-upload layer.
//
// Single source of truth for MUTATING a task after creation:
//   applyTaskUpdate  → status / progress / blocker (+ locked fields for
//                      supervisor/manager/admin, per CORE BUSINESS RULE #2)
//   closeTask        → the COMPLETION WIZARD flow (CORE BUSINESS RULE #3),
//                      atomic: status=Completed → evidence BLOBs (restricted
//                      allowlist + magic bytes, or recorded skip) → completion
//                      comment (is_completion_comment=1) → completed_at/by →
//                      notifications for creator + managers + supervisors
//   cancelTask       → manager/admin-only cancellation (reason required)
//   reopenTask       → admin/manager-only reopen of a completed task
//   uploadAttachment → generic attachment upload with extension + MIME + 10 MB
//                      validation (CORE BUSINESS RULE #5: BLOBs in SQLite)
//
// Every mutation re-checks the actor against the CURRENT task row and is fully
// parameterized. Completed tasks are read-only for everyone (#2/#3) — enforced
// here, so no endpoint can bypass it.

import { createHash } from 'node:crypto';

import { getDb } from './db';
import { logActivity, Action } from './activity';
import { canEditTask, canEditLockedField, canEditChecklistStructure, hasRankAtLeast } from './permissions';
import { createNotification } from './notifications';
import { validateDependencies } from './tasks';
import {
  statusLabel,
  priorityLabel,
  formatDueDate,
  recurrenceLabel,
  MAX_COMMENT_LENGTH,
} from './format';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_EXTENSIONS_HINT,
  EVIDENCE_EXTENSIONS_HINT,
  EVIDENCE_EXT_MIME,
  EVIDENCE_SIGNATURES,
  EXT_MIME,
  MAX_BLOCKER_LENGTH,
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_TITLE_LENGTH,
  MAX_DEPARTMENT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_NAME,
  MAX_OVERRIDE_REASON_LENGTH,
  MAX_REASON_LENGTH,
  MAX_UPLOAD_BYTES,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  canTransitionStatus,
  isRecurrence,
  isTaskReadOnly,
  isValidOverrideReason,
  requiresBlockerNote,
} from './task-policy';
import { nextDueDate, shouldCreateNextOccurrence } from './recurrence';
import type { Role, Task } from './types';

// Back-compat re-exports (constants moved to the canonical src/lib/task-policy.ts).
export {
  ALLOWED_EXTENSIONS,
  ALLOWED_EXTENSIONS_HINT,
  EXT_MIME,
  MAX_BLOCKER_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_NAME,
  MAX_UPLOAD_BYTES,
} from './task-policy';
export { ACTIVE_TASK_STATUSES as STATUSES } from './task-policy';

// ─────────────────────────── Result types ───────────────────────────

export type UpdateResult =
  | { ok: true; message: string; changed: string[] }
  | { ok: false; error: string };

export type CloseResult =
  | { ok: true; taskId: number; nextTaskId: number | null }
  | { ok: false; error: string };

export type UploadResult =
  | { ok: true; attachmentId: number; fileName: string }
  | { ok: false; error: string };

export type CancelResult = { ok: true; message: string } | { ok: false; error: string };

export type ReopenResult = { ok: true; message: string } | { ok: false; error: string };

// ─────────────────────── Shared helpers ───────────────────────

/** Strip path components + control characters from a file name. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  // Dot-only names and leading dots are not useful download names and can
  // cause platform-specific hidden-file behavior.
  const safe = clean.replace(/^\.+/, '');
  return safe.slice(0, MAX_FILE_NAME);
}

/** SHA-256 hex digest of a file's bytes (spec: "calculate SHA-256 hash"). */
function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Validate an uploaded file against extension + MIME + size rules. */
export function validateUploadedFile(
  file: File,
  bytes?: Buffer,
): { ok: true; fileName: string; mimeType: string } | { ok: false; error: string } {
  const fileName = sanitizeFileName(file.name);
  if (!fileName) {
    return { ok: false, error: 'The file must have a name.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'The file is empty.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.`,
    };
  }
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const allowedTypes = EXT_MIME[ext];
  if (!allowedTypes) {
    return {
      ok: false,
      error: `File type ".${ext || 'unknown'}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS_HINT}.`,
    };
  }
  const declared = (file.type || '').toLowerCase();
  if (!declared || !allowedTypes.includes(declared)) {
    return {
      ok: false,
      error: `The file's MIME type (${declared || 'unknown'}) does not match a ".${ext}" file.`,
    };
  }
  if (bytes) {
    const signature = GENERIC_SIGNATURES[ext];
    if (isExecutableBytes(bytes)) {
      return { ok: false, error: 'Executable files are not allowed.' };
    }
    if (signature && !matchesSignature(bytes, signature)) {
      return { ok: false, error: `The file's content does not match a ".${ext}" file.` };
    }
    if (TEXT_EXTENSIONS.has(ext) && bytes.includes(0)) {
      return { ok: false, error: 'Binary content is not allowed for text files.' };
    }
  }
  return { ok: true, fileName, mimeType: declared };
}

const TEXT_EXTENSIONS = new Set(['txt', 'md', 'csv', 'json', 'log', 'xml', 'sql']);
const GENERIC_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
  zip: [0x50, 0x4b, 0x03, 0x04],
  xlsx: [0x50, 0x4b, 0x03, 0x04],
  docx: [0x50, 0x4b, 0x03, 0x04],
  pptx: [0x50, 0x4b, 0x03, 0x04],
  xls: [0xd0, 0xcf, 0x11, 0xe0],
  doc: [0xd0, 0xcf, 0x11, 0xe0],
  ppt: [0xd0, 0xcf, 0x11, 0xe0],
};

function isExecutableBytes(bytes: Buffer): boolean {
  // Windows PE, ELF, Mach-O (32/64-bit) and script shebangs.
  return (
    (bytes[0] === 0x4d && bytes[1] === 0x5a) ||
    (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) ||
    ([0xfe, 0xce, 0xcf, 0xca].includes(bytes[0]) && [0xed, 0xfa, 0xfe, 0xcf].includes(bytes[1])) ||
    (bytes[0] === 0x23 && bytes[1] === 0x21)
  );
}

/**
 * Validate a completion-evidence file — the RESTRICTED evidence allowlist
 * (pdf/png/jpg/jpeg/xlsx/docx, per spec) with extension + MIME + 10 MB + magic
 * bytes where the type has a signature. `bytes` is the file content already
 * read by the caller (needed for the signature check).
 */
export function validateEvidenceFile(
  file: File,
  bytes: Buffer,
): { ok: true; fileName: string; mimeType: string } | { ok: false; error: string } {
  const fileName = sanitizeFileName(file.name);
  if (!fileName) {
    return { ok: false, error: 'The file must have a name.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'The file is empty.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.`,
    };
  }
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const allowedTypes = EVIDENCE_EXT_MIME[ext];
  if (!allowedTypes) {
    return {
      ok: false,
      error: `File type ".${ext || 'unknown'}" is not allowed for evidence. Allowed: ${EVIDENCE_EXTENSIONS_HINT}.`,
    };
  }
  const declared = (file.type || '').toLowerCase();
  if (!declared || !allowedTypes.includes(declared)) {
    return {
      ok: false,
      error: `The file's MIME type (${declared || 'unknown'}) does not match a ".${ext}" file.`,
    };
  }
  const sig = EVIDENCE_SIGNATURES[ext];
  if (sig && !matchesSignature(bytes, sig)) {
    return {
      ok: false,
      error: `The file's content does not match a ".${ext}" file — upload a valid file.`,
    };
  }
  return { ok: true, fileName, mimeType: declared };
}

/** True when the byte buffer starts with the given magic bytes. */
function matchesSignature(bytes: Buffer, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

/** Resolve a user's display name (for assignee activity entries). */
function userName(id: number | null | undefined): string | null {
  if (id == null) return null;
  const row = getDb()
    .prepare('SELECT full_name FROM users WHERE id = ?')
    .get(id) as { full_name: string } | undefined;
  return row?.full_name ?? null;
}

/** Load the mutable task row (all editable columns). */
function loadEditableTask(taskId: number) {
  return getDb()
    .prepare(
      `SELECT id, title, description, department, status, priority, progress_percent,
              created_by, assigned_to, due_date, blocker_note, recurrence,
              recurrence_end_date, started_at, completed_at, cancelled_at, cancelled_by,
              inspection_type, finding_classification, risk_level, corrective_action_required,
              reference_number, audit_batch_or_work_order
       FROM tasks WHERE id = ?`,
    )
    .get(taskId) as
    | (Pick<
        Task,
        | 'id'
        | 'title'
        | 'description'
        | 'department'
        | 'status'
        | 'priority'
        | 'progress_percent'
        | 'created_by'
        | 'assigned_to'
        | 'due_date'
        | 'blocker_note'
        | 'recurrence'
        | 'recurrence_end_date'
        | 'started_at'
        | 'completed_at'
        | 'cancelled_at'
        | 'cancelled_by'
        | 'inspection_type'
        | 'finding_classification'
        | 'risk_level'
        | 'corrective_action_required'
        | 'reference_number'
        | 'audit_batch_or_work_order'
      >)
    | undefined;
}

/**
 * Dependencies of `taskId` that are NOT completed/cancelled (they block moving
 * the task to In Progress). Returns task ids + titles for messages and the UI.
 * Interpretation: "incomplete" = not completed; a cancelled dependency is
 * terminal (nothing will ever finish it), so it does NOT block — the app layer
 * cannot produce 'cancelled' today, but the schema allows it.
 */
export function listBlockingDependencies(taskId: number): { task_id: number; title: string; status: string }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT d.depends_on_task_id AS task_id, t.title, t.status
       FROM task_dependencies d
       JOIN tasks t ON t.id = d.depends_on_task_id
       WHERE d.task_id = ? AND t.status NOT IN ('completed', 'cancelled')
       ORDER BY t.title ASC, t.id ASC`,
    )
    .all(taskId) as { task_id: number; title: string; status: string }[];
}

// ─────────────────────────── Generic update ───────────────────────────

/**
 * Apply a non-closure update. Only the fields present in the form are
 * candidates; every candidate is permission-checked against the actor's role:
 *   - status / progress_percent / blocker_note → any editor (employee included,
 *     for tasks they can edit);
 *   - title / description / assigned_to / due_date / priority → LOCKED for
 *     employees (canEditLockedField).
 * Setting status='completed' here is rejected — completion goes through
 * closeTask so the mandatory comment/evidence steps cannot be skipped.
 */
export function applyTaskUpdate(params: {
  taskId: number;
  actor: { id: number; role: Role };
  form: FormData;
}): UpdateResult {
  const db = getDb();
  const task = loadEditableTask(params.taskId);
  if (!task) return { ok: false, error: 'Task not found.' };

  // Completed/cancelled tasks are read-only for EVERYONE — checked before
  // canEditTask so the message says why (CORE BUSINESS RULES #2/#3).
  if (isTaskReadOnly(task.status)) {
    return {
      ok: false,
      error:
        task.status === 'completed'
          ? 'This task is completed and is read-only for everyone.'
          : 'This task is cancelled and is read-only for everyone.',
    };
  }
  if (!canEditTask(params.actor, task)) {
    return { ok: false, error: 'You do not have permission to edit this task.' };
  }

  const canEditLocked = canEditLockedField(params.actor.role);
  const canEditChecklist = canEditChecklistStructure(params.actor, task);
  const form = params.form;
  const changes: string[] = [];
  const sets: string[] = [];
  const values: unknown[] = [];
  const activity: Array<{ action: string; oldValue: string | null; newValue: string | null }> = [];
  // The assignee this task WILL have after this request — due/priority-change
  // notifications go to the NEW assignee when the same request reassigns it.
  let effectiveAssignee: number | null = task.assigned_to;
  // Set when THIS request adds/replaces a blocker note; the notifications are
  // queued AFTER the assignee section so they reach the NEW assignee too.
  let pendingBlockerNote: string | null = null;
  // Self-contained mutations (checklist / dependency ops) executed inside the tx.
  const ops: Array<() => void> = [];
  // Explicit notifications to persist after the mutation succeeds.
  const notifications: Array<{
    userId: number;
    type: 'assigned' | 'due_date_changed' | 'priority_changed' | 'blocker_added';
    title: string;
    message: string;
  }> = [];

  const fieldErr = (field: string): { ok: false; error: string } => ({
    ok: false,
    error: `You do not have permission to edit "${field}".`,
  });

  // status (employees may set any of the three active states)
  const rawStatus = form.get('status');
  if (rawStatus !== null) {
    const s = String(rawStatus);
    if (s === 'completed') {
      return {
        ok: false,
        error: 'Use the "Complete task" flow — a completion comment and evidence are required.',
      };
    }
    if (s === 'cancelled') {
      return {
        ok: false,
        error: 'Cancelling a task requires manager/admin approval — use the Cancel task action.',
      };
    }
    // RULE #3 transition rules live in task-policy (strict set per spec).
    if (!canTransitionStatus(task.status, s)) {
      return { ok: false, error: 'Invalid status transition.' };
    }
    if (s !== task.status) {
      // on_hold from not_started/in_progress requires a blocker note explaining
      // why work stopped (spec). The note must come in THIS submission.
      if (requiresBlockerNote(task.status, s)) {
        const b = String(form.get('blocker_note') ?? '').trim();
        if (!b) {
          return { ok: false, error: 'A blocker note is required to put the task on hold.' };
        }
      }
      // Dependency gate: a task cannot move to In Progress while any dependency
      // is incomplete. Admin/manager may override ONLY with an explicit reason,
      // and the override is logged (spec: dependency behavior). The check is
      // read-then-write (not inside the tx): on this single-writer SQLite app a
      // concurrent completion of the dependency between check and write is an
      // acceptable, harmless race (the task simply starts while the dependency
      // finishes a moment later).
      if (s === 'in_progress') {
        const blocking = listBlockingDependencies(task.id);
        if (blocking.length > 0) {
          const overrideReason = String(form.get('dependency_override_reason') ?? '').trim();
          if (hasRankAtLeast(params.actor.role, 'manager') && isValidOverrideReason(overrideReason)) {
            activity.push({
              action: Action.DEPENDENCY_OVERRIDE,
              oldValue: blocking.map((b) => `#${b.task_id} ${b.title}`).join('; '),
              newValue: overrideReason,
            });
          } else if (hasRankAtLeast(params.actor.role, 'manager')) {
            return {
              ok: false,
              error: `An explicit reason is required to override blocked dependencies (blocked by: ${blocking.map((b) => b.title).join(', ')}).`,
            };
          } else {
            return {
              ok: false,
              error: `This task cannot be started yet — it is blocked by incomplete dependencies: ${blocking.map((b) => b.title).join(', ')}.`,
            };
          }
        }
      }

      // First time the task enters In Progress → stamp started_at (once) and
      // log the start (spec). on_hold → in_progress keeps the ORIGINAL
      // started_at — work resumed, not restarted.
      if (s === 'in_progress' && task.started_at === null) {
        sets.push("started_at = datetime('now')");
        activity.push({
          action: Action.TASK_STARTED,
          oldValue: null,
          newValue: statusLabel('in_progress'),
        });
      }
      sets.push('status = ?');
      values.push(s);
      activity.push({
        action: Action.STATUS_CHANGED,
        oldValue: statusLabel(task.status),
        newValue: statusLabel(s),
      });
      changes.push('status');
    }
  }

  // progress_percent (0–100)
  const rawProgress = form.get('progress_percent');
  if (rawProgress !== null) {
    const p = Number(rawProgress);
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      return { ok: false, error: 'Progress must be a number between 0 and 100.' };
    }
    const rounded = Math.round(p);
    if (rounded !== task.progress_percent) {
      sets.push('progress_percent = ?');
      values.push(rounded);
      activity.push({
        action: Action.PROGRESS_CHANGED,
        oldValue: String(task.progress_percent),
        newValue: String(rounded),
      });
      changes.push('progress_percent');
    }
  }

  // blocker_note (any editor)
  const rawBlocker = form.get('blocker_note');
  if (rawBlocker !== null) {
    const b = String(rawBlocker).trim();
    if (b.length > MAX_BLOCKER_LENGTH) {
      return { ok: false, error: `Blocker note must be ${MAX_BLOCKER_LENGTH} characters or fewer.` };
    }
    const next = b.length > 0 ? b : null;
    if (next !== task.blocker_note) {
      sets.push('blocker_note = ?');
      values.push(next);
      activity.push({
        action: Action.BLOCKER_SET,
        oldValue: task.blocker_note,
        newValue: next,
      });
      changes.push('blocker_note');
      // A blocker note (added or replaced) — queued here, recipients resolved
      // after the assignee section (see below) so a same-request reassignment
      // reaches the NEW assignee (spec: "a blocker note is added").
      if (next !== null) pendingBlockerNote = next;
    }
  }

  // ── locked fields: title / description / assigned_to / due_date / priority ──
  const rawTitle = form.get('title');
  if (rawTitle !== null) {
    if (!canEditLocked) return fieldErr('title');
    const t = String(rawTitle).trim();
    if (!t) return { ok: false, error: 'Title is required.' };
    if (t.length > 200) return { ok: false, error: 'Title must be 200 characters or fewer.' };
    if (t !== task.title) {
      sets.push('title = ?');
      values.push(t);
      activity.push({ action: Action.TITLE_CHANGED, oldValue: task.title, newValue: t });
      changes.push('title');
    }
  }

  const rawDescription = form.get('description');
  if (rawDescription !== null) {
    if (!canEditLocked) return fieldErr('description');
    const d = String(rawDescription).trim();
    if (d.length > MAX_DESCRIPTION_LENGTH) {
      return { ok: false, error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` };
    }
    const next = d.length > 0 ? d : null;
    if (next !== task.description) {
      sets.push('description = ?');
      values.push(next);
      activity.push({
        action: Action.DESCRIPTION_CHANGED,
        oldValue: task.description ?? null,
        newValue: next ?? null,
      });
      changes.push('description');
    }
  }

  const rawAssignee = form.get('assigned_to');
  if (rawAssignee !== null) {
    if (!canEditLocked) return fieldErr('assigned_to');
    let next: number | null = null;
    if (String(rawAssignee).trim() !== '') {
      const id = Number(rawAssignee);
      if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid assignee.' };
      const exists = db
        .prepare('SELECT id FROM users WHERE id = ? AND is_active = 1')
        .get(id);
      if (!exists) return { ok: false, error: 'Selected assignee does not exist or is inactive.' };
      next = id;
    }
    effectiveAssignee = next;
    if (next !== task.assigned_to) {
      sets.push('assigned_to = ?');
      values.push(next);
      activity.push({
        action: Action.ASSIGNEE_CHANGED,
        oldValue: userName(task.assigned_to),
        newValue: userName(next),
      });
      changes.push('assigned_to');
      // Assignment notification goes to the NEW assignee (spec).
      if (next !== null) {
        notifications.push({
          userId: next,
          type: 'assigned',
          title: 'Task assigned to you',
          message: `"${task.title}" is now assigned to you.`,
        });
      }
    }
  }

  const rawDue = form.get('due_date');
  if (rawDue !== null) {
    if (!canEditLocked) return fieldErr('due_date');
    let next: string | null = null;
    if (String(rawDue).trim() !== '') {
      const v = String(rawDue).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return { ok: false, error: 'Due date must be a valid date (YYYY-MM-DD).' };
      }
      next = v;
    }
    if (next !== task.due_date) {
      sets.push('due_date = ?');
      values.push(next);
      activity.push({
        action: Action.DUE_DATE_CHANGED,
        oldValue: formatDueDate(task.due_date),
        newValue: formatDueDate(next),
      });
      changes.push('due_date');
      // Due-date change notifies the assignee (spec) — the NEW one if the same
      // request also reassigned the task.
      if (effectiveAssignee != null) {
        notifications.push({
          userId: effectiveAssignee,
          type: 'due_date_changed',
          title: 'Task due date changed',
          message: `The due date of "${task.title}" changed from ${formatDueDate(task.due_date)} to ${formatDueDate(next)}.`,
        });
      }
    }
  }

  const rawPriority = form.get('priority');
  if (rawPriority !== null) {
    if (!canEditLocked) return fieldErr('priority');
    const p = String(rawPriority);
    if (!(TASK_PRIORITIES as readonly string[]).includes(p)) {
      return { ok: false, error: 'Invalid priority value.' };
    }
    if (p !== task.priority) {
      sets.push('priority = ?');
      values.push(p);
      activity.push({
        action: Action.PRIORITY_CHANGED,
        oldValue: priorityLabel(task.priority),
        newValue: priorityLabel(p),
      });
      changes.push('priority');
      // Priority ESCALATION notifies the assignee (spec: "priority changes to
      // high or urgent") — the NEW one if the same request also reassigned the
      // task. Downgrades to low/medium do not notify.
      if (effectiveAssignee != null && (p === 'high' || p === 'urgent')) {
        notifications.push({
          userId: effectiveAssignee,
          type: 'priority_changed',
          title: 'Task priority changed',
          message: `The priority of "${task.title}" changed from ${priorityLabel(task.priority)} to ${priorityLabel(p)}.`,
        });
      }
    }
  }

  // Blocker notification — queued here (AFTER the assignee section) so it uses
  // the effective (post-update) assignee, matching the due/priority pattern.
  // Recipients: assignee + creator, excluding whoever typed the note.
  if (pendingBlockerNote !== null) {
    const recipients = new Set<number>();
    if (effectiveAssignee != null) recipients.add(effectiveAssignee);
    if (task.created_by != null) recipients.add(task.created_by);
    recipients.delete(params.actor.id);
    for (const uid of recipients) {
      notifications.push({
        userId: uid,
        type: 'blocker_added',
        title: 'Blocker added',
        message: `A blocker note was added to "${task.title}": “${pendingBlockerNote}”`,
      });
    }
  }

  // ── locked fields: department / recurrence / recurrence_end_date ──
  const rawDepartment = form.get('department');
  if (rawDepartment !== null) {
    if (!canEditLocked) return fieldErr('department');
    const d = String(rawDepartment).trim();
    if (!d) return { ok: false, error: 'Department is required.' };
    if (d.length > MAX_DEPARTMENT_LENGTH) {
      return { ok: false, error: `Department must be ${MAX_DEPARTMENT_LENGTH} characters or fewer.` };
    }
    if (d !== task.department) {
      sets.push('department = ?');
      values.push(d);
      activity.push({
        action: Action.DEPARTMENT_CHANGED,
        oldValue: task.department,
        newValue: d,
      });
      changes.push('department');
    }
  }

  const rawRecurrence = form.get('recurrence');
  if (rawRecurrence !== null) {
    if (!canEditLocked) return fieldErr('recurrence');
    const r = String(rawRecurrence);
    if (!isRecurrence(r)) return { ok: false, error: 'Invalid recurrence value.' };
    if (r !== task.recurrence) {
      sets.push('recurrence = ?');
      values.push(r);
      activity.push({
        action: Action.RECURRENCE_CHANGED,
        oldValue: recurrenceLabel(task.recurrence),
        newValue: recurrenceLabel(r),
      });
      changes.push('recurrence');
    }
  }

  const rawRecEnd = form.get('recurrence_end_date');
  if (rawRecEnd !== null) {
    if (!canEditLocked) return fieldErr('recurrence_end_date');
    let next: string | null = null;
    if (String(rawRecEnd).trim() !== '') {
      const v = String(rawRecEnd).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return { ok: false, error: 'Recurrence end date must be a valid date (YYYY-MM-DD).' };
      }
      next = v;
    }
    if (next !== task.recurrence_end_date) {
      sets.push('recurrence_end_date = ?');
      values.push(next);
      activity.push({
        action: Action.RECURRENCE_END_CHANGED,
        oldValue: formatDueDate(task.recurrence_end_date),
        newValue: formatDueDate(next),
      });
      changes.push('recurrence_end_date');
    }
  }

  // Optional QC metadata. These remain nullable for legacy tasks.
  const metadataFields = [
    ['inspection_type', task.inspection_type],
    ['finding_classification', task.finding_classification],
    ['risk_level', task.risk_level],
    ['corrective_action_required', task.corrective_action_required],
    ['reference_number', task.reference_number],
    ['audit_batch_or_work_order', task.audit_batch_or_work_order],
  ] as const;
  for (const [key, oldValue] of metadataFields) {
    const raw = form.get(key);
    if (raw === null) continue;
    if (!canEditLocked) return fieldErr(key);
    const rawString = String(raw).trim();
    let next: string | number | null = rawString || null;
    if (key === 'corrective_action_required') {
      if (!['', '0', '1'].includes(rawString)) return { ok: false, error: 'Corrective action value is invalid.' };
      next = rawString === '' ? null : Number(rawString);
    }
    if (key === 'risk_level' && next !== null && !['low', 'medium', 'high', 'critical'].includes(String(next))) return { ok: false, error: 'Risk level is invalid.' };
    if (key === 'finding_classification' && next !== null && !['conforming', 'minor', 'major', 'critical', 'observation'].includes(String(next))) return { ok: false, error: 'Finding classification is invalid.' };
    if (typeof next === 'string' && next.length > 200) return { ok: false, error: `${key} must be 200 characters or fewer.` };
    if (String(next ?? '') !== String(oldValue ?? '')) {
      sets.push(`${key} = ?`); values.push(next); changes.push(key);
      activity.push({ action: Action.FIELD_CHANGED, oldValue: `${key}: ${oldValue ?? ''}`, newValue: `${key}: ${next ?? ''}` });
    }
  }

  // ── checklist ops (toggle: permitted editor; structure: owner/supervisor+) ──
  const rawToggle = form.get('checklist_toggle');
  if (rawToggle !== null) {
    const id = Number(rawToggle);
    if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid checklist item.' };
    const item = db
      .prepare('SELECT id, title, is_completed FROM task_checklists WHERE id = ? AND task_id = ?')
      .get(id, task.id) as { id: number; title: string; is_completed: number } | undefined;
    if (!item) return { ok: false, error: 'Checklist item not found.' };
    const toggledOn = Number(item.is_completed) === 0;
    ops.push(() => {
      if (toggledOn) {
        db.prepare(
          `UPDATE task_checklists SET is_completed = 1, completed_by = ?, completed_at = datetime('now')
           WHERE id = ?`,
        ).run(params.actor.id, id);
      } else {
        db.prepare(
          `UPDATE task_checklists SET is_completed = 0, completed_by = NULL, completed_at = NULL
           WHERE id = ?`,
        ).run(id);
      }
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.CHECKLIST_ITEM_UPDATED,
        oldValue: toggledOn ? 'unchecked' : 'checked',
        newValue: item.title,
      });
    });
  }

  const rawAdd = form.get('checklist_add');
  if (rawAdd !== null) {
    if (!canEditChecklist) return fieldErr('checklist');
    const title = String(rawAdd).trim();
    if (!title) return { ok: false, error: 'Checklist item cannot be empty.' };
    if (title.length > MAX_CHECKLIST_TITLE_LENGTH) {
      return { ok: false, error: `Checklist items must be ${MAX_CHECKLIST_TITLE_LENGTH} characters or fewer.` };
    }
    const count = db
      .prepare('SELECT COUNT(*) AS n FROM task_checklists WHERE task_id = ?')
      .get(task.id) as { n: number };
    if (Number(count.n) >= MAX_CHECKLIST_ITEMS) {
      return { ok: false, error: `A task can have at most ${MAX_CHECKLIST_ITEMS} checklist items.` };
    }
    ops.push(() => {
      const nextOrder = db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM task_checklists WHERE task_id = ?')
        .get(task.id) as { n: number };
      db.prepare(
        'INSERT INTO task_checklists (task_id, title, sort_order, is_completed) VALUES (?, ?, ?, 0)',
      ).run(task.id, title, Number(nextOrder.n));
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.CHECKLIST_ITEM_ADDED,
        newValue: title,
      });
    });
  }

  const rawRemove = form.get('checklist_remove');
  if (rawRemove !== null) {
    if (!canEditChecklist) return fieldErr('checklist');
    const id = Number(rawRemove);
    if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid checklist item.' };
    const item = db
      .prepare('SELECT id, title FROM task_checklists WHERE id = ? AND task_id = ?')
      .get(id, task.id) as { id: number; title: string } | undefined;
    if (!item) return { ok: false, error: 'Checklist item not found.' };
    ops.push(() => {
      db.prepare('DELETE FROM task_checklists WHERE id = ?').run(id);
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.CHECKLIST_ITEM_REMOVED,
        newValue: item.title,
      });
    });
  }

  const rawReorder = form.get('checklist_reorder');
  if (rawReorder !== null) {
    if (!canEditChecklist) return fieldErr('checklist');
    const ids = String(rawReorder).split(',').map((v) => Number(v));
    const current = db.prepare('SELECT id FROM task_checklists WHERE task_id = ? ORDER BY sort_order ASC, id ASC').all(task.id) as { id: number }[];
    if (ids.length !== current.length || new Set(ids).size !== current.length || ids.some((id) => !current.some((row) => row.id === id))) return { ok: false, error: 'Checklist order is invalid.' };
    ops.push(() => {
      const update = db.prepare('UPDATE task_checklists SET sort_order = ? WHERE id = ? AND task_id = ?');
      ids.forEach((id, index) => update.run(index, id, task.id));
      logActivity({ taskId: task.id, userId: params.actor.id, action: Action.CHECKLIST_REORDERED, oldValue: current.map((x) => x.id).join(','), newValue: ids.join(',') });
    });
  }

  // ── dependency ops (supervisor+) ──
  const depAdd = form.get('dependency_add');
  if (depAdd !== null) {
    if (!canEditLocked) return fieldErr('dependencies');
    const id = Number(depAdd);
    const check = validateDependencies([id], task.id);
    if (!check.ok) return { ok: false, error: check.error };
    const depId = check.ids[0];
    if (depId === undefined) return { ok: false, error: 'Invalid dependency task id.' };
    ops.push(() => {
      db.prepare('INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)').run(task.id, depId);
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.DEPENDENCY_ADDED,
        newValue: `#${depId}`,
      });
    });
  }

  const depRemove = form.get('dependency_remove');
  if (depRemove !== null) {
    if (!canEditLocked) return fieldErr('dependencies');
    const id = Number(depRemove);
    if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid dependency task id.' };
    const exists = db
      .prepare('SELECT 1 AS one FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ?')
      .get(task.id, id);
    if (!exists) return { ok: false, error: 'That dependency does not exist.' };
    ops.push(() => {
      db.prepare('DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ?').run(task.id, id);
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.DEPENDENCY_REMOVED,
        newValue: `#${id}`,
      });
    });
  }

  const totalChanges = changes.length + ops.length;
  if (totalChanges === 0) {
    return { ok: true, message: 'No changes were made.', changed: [] };
  }

  if (changes.length > 0) sets.push("updated_at = datetime('now')");
  const tx = db.transaction(() => {
    if (changes.length > 0) {
      db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values, task.id);
    }
    for (const a of activity) {
      logActivity({ taskId: task.id, userId: params.actor.id, action: a.action, oldValue: a.oldValue, newValue: a.newValue });
    }
    for (const op of ops) op();
    for (const n of notifications) {
      createNotification({ userId: n.userId, taskId: task.id, type: n.type, title: n.title, message: n.message, actorId: params.actor.id });
    }
  });
  tx();

  return {
    ok: true,
    message: totalChanges === 1 ? 'Task updated.' : `${totalChanges} fields updated.`,
    changed: changes,
  };
}

// ─────────────────────────── Closure flow ───────────────────────────

/**
 * CORE BUSINESS RULE #3 — the closure flow, executed atomically:
 *   1. status = 'completed'
 *   2. evidence step: the uploaded file is stored + logged as
 *      evidence_uploaded; otherwise the skip is RECORDED as evidence_skipped.
 *   3. completion comment (MANDATORY) → stored in task_comments + logged.
 *   4. completed_at + completed_by are auto-filled by the system.
 * After this, the task is read-only for everyone.
 */
export async function closeTask(params: {
  taskId: number;
  actor: { id: number; role: Role };
  form: FormData;
}): Promise<CloseResult> {
  const db = getDb();
  const task = loadEditableTask(params.taskId);
  if (!task) return { ok: false, error: 'Task not found.' };

  if (isTaskReadOnly(task.status)) {
    return {
      ok: false,
      error:
        task.status === 'completed'
          ? 'This task is already completed.'
          : 'This task is cancelled and cannot be completed.',
    };
  }
  if (!canEditTask(params.actor, task)) {
    return { ok: false, error: 'You do not have permission to edit this task.' };
  }

  const checklistState = db.prepare(
    'SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END), 0) AS completed FROM task_checklists WHERE task_id = ?',
  ).get(task.id) as { total: number; completed: number };
  const incompleteChecklist = Number(checklistState.total) - Number(checklistState.completed);
  let checklistOverrideReason: string | null = null;
  if (incompleteChecklist > 0) {
    const rawOverride = String(params.form.get('checklist_override_reason') ?? '').trim();
    if (!hasRankAtLeast(params.actor.role, 'manager')) {
      return { ok: false, error: `Complete all ${incompleteChecklist} remaining checklist item(s) before completing this task.` };
    }
    if (!isValidOverrideReason(rawOverride)) {
      return { ok: false, error: `Complete all ${incompleteChecklist} remaining checklist item(s), or provide a manager/admin override reason.` };
    }
    checklistOverrideReason = rawOverride;
  }

  const completionComment = String(params.form.get('completion_comment') ?? '').trim();
  if (!completionComment) {
    return { ok: false, error: 'A completion comment is required to complete the task.' };
  }
  if (completionComment.length > MAX_COMMENT_LENGTH) {
    return {
      ok: false,
      error: `Completion comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`,
    };
  }

  // Evidence step: zero or more uploaded files — each validated against the
  // RESTRICTED evidence allowlist (pdf/png/jpg/jpeg/xlsx/docx) + MIME + size +
  // magic bytes — or a recorded skip. The bytes are read BEFORE the transaction
  // (transaction callbacks are synchronous), so this function is async.
  const rawFiles = params.form.getAll('evidence');
  const files = rawFiles.filter(
    (f): f is File => typeof f === 'object' && f !== null && 'size' in f && f.size > 0,
  );
  const skipEvidence = String(params.form.get('skip_evidence') ?? '') === '1';

  interface PreparedEvidence {
    fileName: string;
    mimeType: string;
    bytes: Buffer;
    hash: string;
  }
  const evidenceFiles: PreparedEvidence[] = [];
  for (const f of files) {
    // Reject over-limit input before allocating a Buffer from FormData. This
    // is the last guard before any BLOB-sized allocation or database insert.
    if (f.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.` };
    }
    const bytes = Buffer.from(await f.arrayBuffer());
    const validated = validateEvidenceFile(f, bytes);
    if (!validated.ok) return { ok: false, error: validated.error };
    evidenceFiles.push({ fileName: validated.fileName, mimeType: validated.mimeType, bytes, hash: sha256Hex(bytes) });
  }

  let nextTaskId: number | null = null;

  const tx = db.transaction(() => {
    // Conditional update (status != 'completed') makes the transition atomic:
    // a concurrent second close hits changes === 0 and the whole tx rolls back
    // instead of clobbering completed_at/completed_by.
    const info = db
      .prepare(
        `UPDATE tasks
         SET status = 'completed', progress_percent = 100,
             completed_at = datetime('now'), completed_by = ?,
             updated_at = datetime('now')
         WHERE id = ? AND status != 'completed'`,
      )
      .run(params.actor.id, task.id);
    if (info.changes !== 1) {
      throw new Error('already completed');
    }

    // Evidence BLOBs — each stored with is_evidence = 1 and logged individually.
    for (const ev of evidenceFiles) {
      db.prepare(
        `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_data, file_size, file_hash, is_evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      ).run(task.id, params.actor.id, ev.fileName, ev.mimeType, ev.bytes, ev.bytes.length, ev.hash);
      logActivity({
        taskId: task.id,
        userId: params.actor.id,
        action: Action.EVIDENCE_UPLOADED,
        newValue: ev.fileName,
      });
    }
    if (evidenceFiles.length === 0) {
      // Skipping must still be recorded in the activity log (CORE BUSINESS RULE #3).
      logActivity({ taskId: task.id, userId: params.actor.id, action: Action.EVIDENCE_SKIPPED });
    }

    // Completion comment stored with is_completion_comment = 1 and linked on
    // the task row (spec) so it stays unambiguous even after a reopen unflags
    // it back into the regular thread.
    const commentInfo = db
      .prepare(
        `INSERT INTO task_comments (task_id, user_id, comment, is_completion_comment)
         VALUES (?, ?, ?, 1)`,
      )
      .run(task.id, params.actor.id, completionComment);
    db.prepare('UPDATE tasks SET completion_comment_id = ? WHERE id = ?').run(
      Number(commentInfo.lastInsertRowid),
      task.id,
    );

    logActivity({ taskId: task.id, userId: params.actor.id, action: Action.TASK_COMPLETED });
    if (checklistOverrideReason) {
      logActivity({ taskId: task.id, userId: params.actor.id, action: Action.CHECKLIST_OVERRIDE, newValue: checklistOverrideReason });
    }
    logActivity({
      taskId: task.id,
      userId: params.actor.id,
      action: Action.CLOSURE_COMMENT_ADDED,
      newValue: completionComment,
    });

    // Completion notifications (spec): the task creator, plus every active
    // manager and supervisor — deduped and excluding the completer.
    const notifyIds = new Set<number>();
    if (task.created_by !== params.actor.id) notifyIds.add(task.created_by);
    const leaders = db
      .prepare("SELECT id FROM users WHERE is_active = 1 AND role IN ('manager', 'supervisor')")
      .all() as { id: number }[];
    for (const row of leaders) {
      if (row.id !== params.actor.id) notifyIds.add(row.id);
    }
    const completerName =
      (db.prepare('SELECT full_name FROM users WHERE id = ?').get(params.actor.id) as
        | { full_name: string }
        | undefined)?.full_name ?? 'a team member';
    for (const userId of notifyIds) {
      createNotification({
        userId,
        taskId: task.id,
        type: 'task_completed',
        title: 'Task completed',
        message: `"${task.title}" was completed by ${completerName}.`,
        actorId: params.actor.id,
      });
    }

    // ── Recurring series: spawn the NEXT occurrence, but ONLY here (on
    // completion), never up front — no endless tasks. The next task is linked
    // via parent_recurring_task_id and copies the checklist TEMPLATE (titles
    // + order, all unchecked) plus the business fields, but NOT comments,
    // evidence, activity logs, or completion metadata.
    if (
      shouldCreateNextOccurrence({
        recurrence: task.recurrence,
        dueDate: task.due_date,
        recurrenceEndDate: task.recurrence_end_date,
      })
    ) {
      const nextDue = nextDueDate(task.recurrence, task.due_date);
      if (nextDue) {
        const ins = db
          .prepare(
            `INSERT INTO tasks (title, description, department, status, priority, progress_percent,
                                created_by, assigned_to, due_date, recurrence, recurrence_end_date,
                                parent_recurring_task_id)
             VALUES (?, ?, ?, 'not_started', ?, 0, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            task.title,
            task.description,
            task.department,
            task.priority,
            task.created_by,
            task.assigned_to,
            nextDue,
            task.recurrence,
            task.recurrence_end_date,
            task.id,
          );
        nextTaskId = Number(ins.lastInsertRowid);

        const template = db
          .prepare(
            'SELECT title, sort_order FROM task_checklists WHERE task_id = ? ORDER BY sort_order ASC, id ASC',
          )
          .all(task.id) as { title: string; sort_order: number }[];
        for (const it of template) {
          db.prepare(
            'INSERT INTO task_checklists (task_id, title, sort_order, is_completed) VALUES (?, ?, ?, 0)',
          ).run(nextTaskId, it.title, it.sort_order);
        }

        // Recurring creation is recorded in the activity log on BOTH sides of
        // the series (spec: record recurring task creation).
        logActivity({
          taskId: task.id,
          userId: params.actor.id,
          action: Action.RECURRING_TASK_CREATED,
          newValue: `next occurrence created (#${nextTaskId})`,
        });
        logActivity({
          taskId: nextTaskId,
          userId: task.created_by,
          action: Action.TASK_CREATED,
          newValue: task.title,
        });
        logActivity({
          taskId: nextTaskId,
          userId: task.created_by,
          action: Action.RECURRING_TASK_CREATED,
          newValue: `next occurrence of recurring task #${task.id}`,
        });

        if (task.assigned_to != null) {
          createNotification({
            userId: task.assigned_to,
            taskId: nextTaskId,
            type: 'recurring_created',
            title: 'Next recurring task created',
            message: `The next occurrence of "${task.title}" is scheduled for ${nextDue}.`,
            actorId: params.actor.id,
          });
        }
      }
    }
  });
  try {
    tx();
  } catch (err) {
    // Rolled back — the task was completed between our check and the update.
    if (err instanceof Error && err.message === 'already completed') {
      return { ok: false, error: 'This task is already completed.' };
    }
    throw err;
  }

  return { ok: true, taskId: task.id, nextTaskId };
}

// ────────────────────────── Cancel / reopen ──────────────────────────

/**
 * Manager/admin cancellation (spec: "cancelled requires manager/admin
 * approval"). The manager/admin IS the approver — they cancel directly with a
 * mandatory reason. Employees cannot cancel here; their path is the existing
 * approved deletion workflow (request → manager/admin review).
 */
export function cancelTask(params: {
  taskId: number;
  actor: { id: number; role: Role };
  reason: string;
}): CancelResult {
  const db = getDb();
  const task = loadEditableTask(params.taskId);
  if (!task) return { ok: false, error: 'Task not found.' };
  if (isTaskReadOnly(task.status)) {
    return { ok: false, error: 'This task is already completed or cancelled.' };
  }
  if (!hasRankAtLeast(params.actor.role, 'manager')) {
    return { ok: false, error: 'Only managers and admins can cancel tasks.' };
  }
  const reason = params.reason.trim();
  if (!reason) {
    return { ok: false, error: 'A cancellation reason is required.' };
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return { ok: false, error: `Cancellation reason must be ${MAX_REASON_LENGTH} characters or fewer.` };
  }

  // Conditional update keeps the transition atomic (a concurrent close/cancel
  // between check and write hits changes === 0 and nothing is overwritten).
  const info = db
    .prepare(
      `UPDATE tasks
       SET status = 'cancelled', cancelled_at = datetime('now'), cancelled_by = ?,
           updated_at = datetime('now')
       WHERE id = ? AND status NOT IN ('completed', 'cancelled')`,
    )
    .run(params.actor.id, task.id);
  if (info.changes !== 1) {
    return { ok: false, error: 'This task is already completed or cancelled.' };
  }

  logActivity({
    taskId: task.id,
    userId: params.actor.id,
    action: Action.TASK_CANCELLED,
    oldValue: statusLabel(task.status),
    newValue: reason,
  });
  return { ok: true, message: `Task "${task.title}" cancelled.` };
}

/**
 * Reopen a completed task — ADMIN/MANAGER ONLY (spec). Returns the task to
 * In Progress (work resumes): clears completed_at/completed_by, unflags the
 * completion comment back into the regular thread, and logs the reopen.
 * started_at is kept (the task was genuinely started once).
 */
export function reopenTask(params: {
  taskId: number;
  actor: { id: number; role: Role };
}): ReopenResult {
  const db = getDb();
  const task = loadEditableTask(params.taskId);
  if (!task) return { ok: false, error: 'Task not found.' };
  if (task.status !== 'completed') {
    return { ok: false, error: 'Only completed tasks can be reopened.' };
  }
  if (!hasRankAtLeast(params.actor.role, 'manager')) {
    return { ok: false, error: 'Only managers and admins can reopen completed tasks.' };
  }

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `UPDATE tasks
         SET status = 'in_progress', completed_at = NULL, completed_by = NULL,
             completion_comment_id = NULL, updated_at = datetime('now')
         WHERE id = ? AND status = 'completed'`,
      )
      .run(task.id);
    if (info.changes !== 1) throw new Error('not completed');
    db.prepare(
      'UPDATE task_comments SET is_completion_comment = 0 WHERE task_id = ? AND is_completion_comment = 1',
    ).run(task.id);
    logActivity({
      taskId: task.id,
      userId: params.actor.id,
      action: Action.TASK_REOPENED,
      oldValue: 'completed',
      newValue: 'in_progress',
    });
    // Notify the people doing the work (assignee + creator), excluding the
    // admin/manager who reopened it (spec: "a task is reopened").
    const recipients = new Set<number>();
    if (task.assigned_to != null) recipients.add(task.assigned_to);
    if (task.created_by != null) recipients.add(task.created_by);
    recipients.delete(params.actor.id);
    for (const uid of recipients) {
      createNotification({
        userId: uid,
        taskId: task.id,
        type: 'task_reopened',
        title: 'Task reopened',
        message: `"${task.title}" was reopened and is In Progress again.`,
        actorId: params.actor.id,
      });
    }
  });
  try {
    tx();
  } catch (err) {
    if (err instanceof Error && err.message === 'not completed') {
      return { ok: false, error: 'Only completed tasks can be reopened.' };
    }
    throw err;
  }
  return { ok: true, message: `Task "${task.title}" reopened — it is In Progress again.` };
}

// ─────────────────────── Attachment upload ───────────────────────

/**
 * Generic attachment upload (CORE BUSINESS RULE #5 — BLOB in SQLite).
 * Any editor of the task may attach a file; completed tasks reject uploads.
 * Validation: extension + MIME + 10 MB (validateUploadedFile).
 */
export async function uploadAttachment(params: {
  taskId: number;
  actor: { id: number; role: Role };
  file: File;
}): Promise<UploadResult> {
  const db = getDb();
  const task = loadEditableTask(params.taskId);
  if (!task) return { ok: false, error: 'Task not found.' };

  if (isTaskReadOnly(task.status)) {
    return {
      ok: false,
      error:
        task.status === 'completed'
          ? 'This task is completed and is read-only for everyone.'
          : 'This task is cancelled and is read-only for everyone.',
    };
  }
  if (!canEditTask(params.actor, task)) {
    return { ok: false, error: 'You do not have permission to edit this task.' };
  }

  if (params.file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.` };
  }
  const bytes = Buffer.from(await params.file.arrayBuffer());
  const validated = validateUploadedFile(params.file, bytes);
  if (!validated.ok) return { ok: false, error: validated.error };
  const hash = sha256Hex(bytes);
  const info = db
    .prepare(
      `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_data, file_size, file_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(task.id, params.actor.id, validated.fileName, validated.mimeType, bytes, bytes.length, hash);

  logActivity({
    taskId: task.id,
    userId: params.actor.id,
    action: Action.ATTACHMENT_UPLOADED,
    newValue: validated.fileName,
  });

  return { ok: true, attachmentId: Number(info.lastInsertRowid), fileName: validated.fileName };
}
