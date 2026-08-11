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
import { canEditTask, canEditLockedField, hasRankAtLeast } from './permissions';
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
  EXT_MIME,
  MAX_BLOCKER_LENGTH,
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_TITLE_LENGTH,
  MAX_DEPARTMENT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_NAME,
  MAX_OVERRIDE_REASON_LENGTH,
  MAX_UPLOAD_BYTES,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  canTransitionStatus,
  isRecurrence,
  isValidOverrideReason,
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
      `SELECT id, title, description, department, status, priority, progress_percent,
              created_by, assigned_to, due_date, blocker_note, recurrence,
              recurrence_end_date, completed_at
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
        | 'completed_at'
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
  // The assignee this task WILL have after this request — due/priority-change
  // notifications go to the NEW assignee when the same request reassigns it.
  let effectiveAssignee: number | null = task.assigned_to;
  // Self-contained mutations (checklist / dependency ops) executed inside the tx.
  const ops: Array<() => void> = [];
  // Explicit notifications to persist after the mutation succeeds.
  const notifications: Array<{
    userId: number;
    type: 'assigned' | 'due_date_changed' | 'priority_changed';
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
    // RULE #3 transition rules live in task-policy (any active → any active).
    if (!canTransitionStatus(task.status, s)) {
      return { ok: false, error: 'Invalid status value.' };
    }
    if (s !== task.status) {
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
      // Priority change notifies the assignee (spec) — the NEW one if the same
      // request also reassigned the task.
      if (effectiveAssignee != null) {
        notifications.push({
          userId: effectiveAssignee,
          type: 'priority_changed',
          title: 'Task priority changed',
          message: `The priority of "${task.title}" changed from ${priorityLabel(task.priority)} to ${priorityLabel(p)}.`,
        });
      }
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

  // ── checklist ops (toggle: any editor; add/remove: supervisor+) ──
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
    if (!canEditLocked) return fieldErr('checklist');
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
    if (!canEditLocked) return fieldErr('checklist');
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
      createNotification({ userId: n.userId, taskId: task.id, type: n.type, title: n.title, message: n.message });
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
