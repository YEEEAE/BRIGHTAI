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
import { hasRankAtLeast } from '../permissions';
import { createNotification } from '../notifications';
import {
  statusLabel,
} from '../format';
import {
  MAX_REASON_LENGTH,
  isTaskReadOnly,
} from '../task-policy';
import { refreshTaskSla } from '../sla/engine';
import type { Role } from '../types';

import {
  type CancelResult,
  type ReopenResult,
  logActivity,
  loadEditableTask,
} from './shared';

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
  refreshTaskSla(task.id, db);
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
  refreshTaskSla(task.id, db);
  return { ok: true, message: `Task "${task.title}" reopened — it is In Progress again.` };
}
