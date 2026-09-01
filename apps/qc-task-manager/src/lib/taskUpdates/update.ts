// Split from the former 1,556-line taskUpdates.ts (QC-100-ARCHITECTURE-002).
// Seams follow the file's own section markers; the public API is unchanged —
// everything is re-exported from taskUpdates/index.ts.

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


import { getDb } from '../db';
import { Action } from '../audit';
import { canEditTask, canEditLockedField, canEditChecklistStructure, hasRankAtLeast } from '../permissions';
import { createNotification } from '../notifications';
import { validateDependencies } from '../tasks';
import {
  statusLabel,
  priorityLabel,
  formatDueDate,
  recurrenceLabel,
} from '../format';
import {
  MAX_BLOCKER_LENGTH,
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_TITLE_LENGTH,
  MAX_DEPARTMENT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  TASK_PRIORITIES,
  canTransitionStatus,
  isRecurrence,
  isTaskReadOnly,
  isValidOverrideReason,
  requiresBlockerNote,
} from '../task-policy';
import { checkpointTaskSla, refreshTaskSla } from '../sla/engine';
import type { Role } from '../types';

import {
  type UpdateResult,
  logActivity,
  userName,
  loadEditableTask,
  listBlockingDependencies,
} from './shared';

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

  if (changes.includes('status')) {
    checkpointTaskSla(task.id, task.status, String(form.get('status')), db);
  } else {
    refreshTaskSla(task.id, db);
  }

  return {
    ok: true,
    message: totalChanges === 1 ? 'Task updated.' : `${totalChanges} fields updated.`,
    changed: changes,
  };
}
