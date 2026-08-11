// Task update, closure, and attachment-upload layer.
//
// Single source of truth for MUTATING a task after creation:
//   applyTaskUpdate  → status / progress / blocker (+ locked fields for
//                      supervisor/manager/admin, per CORE BUSINESS RULE #2)
//   closeTask        → the CLOSURE FLOW (CORE BUSINESS RULE #3), atomic:
//                      status=Completed → evidence (or recorded skip) →
//                      completion comment (mandatory) → completed_at/completed_by
//   uploadAttachment → generic attachment upload with extension + MIME + 10 MB
//                      validation (CORE BUSINESS RULE #5: BLOBs in SQLite)
//
// Every mutation re-checks the actor against the CURRENT task row and is fully
// parameterized. Completed tasks are read-only for everyone (#2/#3) — enforced
// here, so no endpoint can bypass it.

import { getDb } from './db';
import { logActivity, Action } from './activity';
import { canEditTask, canEditLockedField } from './permissions';
import { statusLabel, priorityLabel, formatDueDate, MAX_COMMENT_LENGTH } from './format';
import type { Role, Task, TaskPriority } from './types';

// ─────────────────────────────── Limits ───────────────────────────────

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (per spec)
export const MAX_FILE_NAME = 200;
export const MAX_BLOCKER_LENGTH = 1000;
export const MAX_DESCRIPTION_LENGTH = 5000;

const STATUSES = ['not_started', 'in_progress', 'on_hold'] as const;
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

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

// ─────────────────────────── Result types ───────────────────────────

export type UpdateResult =
  | { ok: true; message: string; changed: string[] }
  | { ok: false; error: string };

export type CloseResult = { ok: true; taskId: number } | { ok: false; error: string };

export type UploadResult =
  | { ok: true; attachmentId: number; fileName: string }
  | { ok: false; error: string };

// ─────────────────────── Shared helpers ───────────────────────

/** Strip path components + control characters from a file name. */
function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return clean.slice(0, MAX_FILE_NAME);
}

/** Validate an uploaded file against extension + MIME + size rules. */
export function validateUploadedFile(
  file: File,
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
  return { ok: true, fileName, mimeType: declared };
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
      `SELECT id, title, description, status, priority, progress_percent,
              created_by, assigned_to, due_date, blocker_note, completed_at
       FROM tasks WHERE id = ?`,
    )
    .get(taskId) as
    | (Pick<
        Task,
        | 'id'
        | 'title'
        | 'description'
        | 'status'
        | 'priority'
        | 'progress_percent'
        | 'created_by'
        | 'assigned_to'
        | 'due_date'
        | 'blocker_note'
        | 'completed_at'
      >)
    | undefined;
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

  // Completed tasks are read-only for EVERYONE — checked before canEditTask so
  // the message says why (CORE BUSINESS RULES #2/#3).
  if (task.status === 'completed') {
    return { ok: false, error: 'This task is completed and is read-only for everyone.' };
  }
  if (!canEditTask(params.actor, task)) {
    return { ok: false, error: 'You do not have permission to edit this task.' };
  }

  const canEditLocked = canEditLockedField(params.actor.role);
  const form = params.form;
  const changes: string[] = [];
  const sets: string[] = [];
  const values: unknown[] = [];
  const activity: Array<{ action: string; oldValue: string | null; newValue: string | null }> = [];

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
    if (!(STATUSES as readonly string[]).includes(s)) {
      return { ok: false, error: 'Invalid status value.' };
    }
    if (s !== task.status) {
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
    if (next !== task.assigned_to) {
      sets.push('assigned_to = ?');
      values.push(next);
      activity.push({
        action: Action.ASSIGNEE_CHANGED,
        oldValue: userName(task.assigned_to),
        newValue: userName(next),
      });
      changes.push('assigned_to');
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
    }
  }

  const rawPriority = form.get('priority');
  if (rawPriority !== null) {
    if (!canEditLocked) return fieldErr('priority');
    const p = String(rawPriority);
    if (!(PRIORITIES as string[]).includes(p)) {
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
    }
  }

  if (changes.length === 0) {
    return { ok: true, message: 'No changes were made.', changed: [] };
  }

  sets.push("updated_at = datetime('now')");
  const tx = db.transaction(() => {
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values, task.id);
    for (const a of activity) {
      logActivity({ taskId: task.id, userId: params.actor.id, action: a.action, oldValue: a.oldValue, newValue: a.newValue });
    }
  });
  tx();

  return {
    ok: true,
    message: changes.length === 1 ? 'Task updated.' : `${changes.length} fields updated.`,
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

  if (task.status === 'completed') {
    return { ok: false, error: 'This task is already completed.' };
  }
  if (!canEditTask(params.actor, task)) {
    return { ok: false, error: 'You do not have permission to edit this task.' };
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

  // Evidence step: a file upload, or a recorded skip. The file's bytes are read
  // BEFORE the transaction (transaction callbacks are synchronous), so this
  // function is async.
  const rawFile = params.form.get('evidence');
  const hasFile =
    typeof rawFile === 'object' && rawFile !== null && 'size' in rawFile && rawFile.size > 0;

  let evidenceAction: string;
  let evidenceValue: string | null;
  let evidenceBytes: Buffer | null = null;
  let evidenceName: string | null = null;
  let evidenceMime: string | null = null;
  if (hasFile) {
    const validated = validateUploadedFile(rawFile as File);
    if (!validated.ok) return { ok: false, error: validated.error };
    evidenceBytes = Buffer.from(await rawFile.arrayBuffer());
    evidenceName = validated.fileName;
    evidenceMime = validated.mimeType;
    evidenceAction = Action.EVIDENCE_UPLOADED;
    evidenceValue = validated.fileName;
  } else {
    // Skipping must still be recorded in the activity log (CORE BUSINESS RULE #3).
    evidenceAction = Action.EVIDENCE_SKIPPED;
    evidenceValue = null;
  }

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

    if (evidenceBytes && evidenceName) {
      db.prepare(
        `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_data, file_size)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(task.id, params.actor.id, evidenceName, evidenceMime, evidenceBytes, evidenceBytes.length);
    }

    db.prepare('INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)').run(
      task.id,
      params.actor.id,
      completionComment,
    );

    logActivity({ taskId: task.id, userId: params.actor.id, action: Action.TASK_COMPLETED });
    logActivity({
      taskId: task.id,
      userId: params.actor.id,
      action: Action.CLOSURE_COMMENT_ADDED,
      newValue: completionComment,
    });
    logActivity({
      taskId: task.id,
      userId: params.actor.id,
      action: evidenceAction,
      newValue: evidenceValue ?? undefined,
    });
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

  return { ok: true, taskId: task.id };
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

  if (task.status === 'completed') {
    return { ok: false, error: 'This task is completed and is read-only for everyone.' };
  }
  if (!canEditTask(params.actor, task)) {
    return { ok: false, error: 'You do not have permission to edit this task.' };
  }

  const validated = validateUploadedFile(params.file);
  if (!validated.ok) return { ok: false, error: validated.error };

  const bytes = Buffer.from(await params.file.arrayBuffer());
  const info = db
    .prepare(
      `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_data, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(task.id, params.actor.id, validated.fileName, validated.mimeType, bytes, bytes.length);

  logActivity({
    taskId: task.id,
    userId: params.actor.id,
    action: Action.ATTACHMENT_UPLOADED,
    newValue: validated.fileName,
  });

  return { ok: true, attachmentId: Number(info.lastInsertRowid), fileName: validated.fileName };
}
