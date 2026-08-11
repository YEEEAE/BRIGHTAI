// Delete-request workflow layer (CORE BUSINESS RULE #4).
//
// Employees cannot delete tasks directly — they submit a request that a
// manager/admin approves or rejects. This module owns the entire lifecycle:
//   submit  → INSERT a 'pending' row (duplicate pending requests blocked)
//   review  → 'approved' (hard-deletes the task, cascade cleans children) or
//             'rejected' (task stays untouched)
//
// Every transition is written to task_activity_log where the task still exists
// (submit + reject always; approve is logged before the task is deleted, so the
// row is cascade-removed with the task — "where possible" per the spec).
//
// Per the production schema the request row is a child of its task (task_id
// ON DELETE CASCADE): approving a request deletes the task AND the request row
// together. Task titles are read live via a JOIN, so history rows always render
// the current task name (rejected requests keep their task alive).

import { getDb } from './db';
import { logActivity, Action } from './activity';
import { canViewTask } from './taskDetails';
import { canReviewDeleteRequests, canSubmitDeleteRequest } from './permissions';
import type { Role, Task } from './types';

export type SubmitResult = { ok: true; requestId: number } | { ok: false; error: string };
export type ReviewResult = { ok: true; message: string } | { ok: false; error: string };

const REASON_MAX_LENGTH = 500;

/** True when this task has a live 'pending' deletion request (blocks duplicates). */
export function hasPendingDeleteRequest(taskId: number): boolean {
  const row = getDb()
    .prepare(
      "SELECT 1 AS one FROM task_delete_requests WHERE task_id = ? AND status = 'pending' LIMIT 1",
    )
    .get(taskId);
  return row !== undefined;
}

/** The pending deletion request for a task (for badge / UI state), or null. */
export function getPendingDeleteRequest(taskId: number): { id: number; reason: string | null } | null {
  const row = getDb()
    .prepare(
      "SELECT id, reason FROM task_delete_requests WHERE task_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1",
    )
    .get(taskId) as { id: number; reason: string | null } | undefined;
  return row ?? null;
}

/**
 * Submit a deletion request (employee → manager/admin review).
 * All guards live here so no endpoint can bypass them:
 *   - only employees submit requests (CORE BUSINESS RULE #4);
 *   - employees may only request tasks they can view (assigned or created);
 *   - completed tasks are never requestable (CORE BUSINESS RULE #3);
 *   - one pending request per task (duplicates blocked).
 */
export function submitDeleteRequest(params: {
  taskId: number;
  userId: number;
  role: Role;
  reason: string | null;
}): SubmitResult {
  const db = getDb();
  const task = db
    .prepare('SELECT id, status, created_by, assigned_to FROM tasks WHERE id = ?')
    .get(params.taskId) as
    | (Pick<Task, 'id' | 'status' | 'created_by' | 'assigned_to'>)
    | undefined;
  if (!task) return { ok: false, error: 'Task not found.' };
  if (task.status === 'completed') {
    return { ok: false, error: 'Completed tasks cannot be deleted via a request.' };
  }
  if (!canSubmitDeleteRequest(params.role)) {
    return { ok: false, error: 'Only employees submit deletion requests.' };
  }
  if (!canViewTask({ id: params.userId, role: params.role }, task)) {
    return { ok: false, error: 'You cannot request deletion of this task.' };
  }
  if (hasPendingDeleteRequest(params.taskId)) {
    return { ok: false, error: 'A deletion request for this task is already pending.' };
  }

  const reason = params.reason?.trim() || null;
  if (reason && reason.length > REASON_MAX_LENGTH) {
    return { ok: false, error: `Reason must be ${REASON_MAX_LENGTH} characters or fewer.` };
  }

  let requestId: number;
  try {
    const info = db
      .prepare(
        `INSERT INTO task_delete_requests (task_id, requested_by, reason)
         VALUES (?, ?, ?)`,
      )
      .run(params.taskId, params.userId, reason);
    requestId = Number(info.lastInsertRowid);
  } catch (err) {
    // Defense in depth: the partial unique index
    // (task_id) WHERE status = 'pending' makes duplicate blocking atomic.
    if (err instanceof Error && /UNIQUE constraint failed/i.test(err.message)) {
      return { ok: false, error: 'A deletion request for this task is already pending.' };
    }
    throw err;
  }

  logActivity({
    taskId: params.taskId,
    userId: params.userId,
    action: Action.DELETE_REQUESTED,
    newValue: reason ?? 'no reason given',
  });
  return { ok: true, requestId };
}

export interface DeleteRequestRow {
  id: number;
  task_id: number;
  /** Live title via JOIN — the task always exists (approved rows cascade away). */
  task_title: string;
  reason: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  requester_name: string;
  reviewer_name: string | null;
}

const REQUEST_LIST_SQL = `
  SELECT r.id, r.task_id, t.title AS task_title, r.reason, r.status, r.created_at, r.reviewed_at,
         req.full_name AS requester_name,
         rev.full_name AS reviewer_name
  FROM task_delete_requests r
  JOIN tasks t ON t.id = r.task_id
  JOIN users req ON req.id = r.requested_by
  LEFT JOIN users rev ON rev.id = r.reviewed_by
  WHERE r.status = ?
  ORDER BY r.created_at DESC, r.id DESC`;

/** Pending requests awaiting review (task still exists by definition). */
export function listPendingDeleteRequests(): DeleteRequestRow[] {
  return getDb().prepare(REQUEST_LIST_SQL).all('pending') as DeleteRequestRow[];
}

/** Approved/rejected requests (history). Approved tasks may already be deleted. */
export function listReviewedDeleteRequests(limit = 20): DeleteRequestRow[] {
  const approved = getDb().prepare(`${REQUEST_LIST_SQL} LIMIT ?`).all('approved', limit) as DeleteRequestRow[];
  const rejected = getDb().prepare(`${REQUEST_LIST_SQL} LIMIT ?`).all('rejected', limit) as DeleteRequestRow[];
  return approved
    .concat(rejected)
    .sort((a, b) => String(b.reviewed_at).localeCompare(String(a.reviewed_at)))
    .slice(0, limit);
}

/**
 * Review a pending request. Only manager/admin (canReviewDeleteRequests).
 *   approve → mark 'approved' (reviewed_by/at), log delete_approved, then
 *             hard-delete the task. Cascades clear comments/attachments/activity.
 *   reject → mark 'rejected' (reviewed_by/at) and log delete_rejected; the
 *            task is untouched and the badge clears.
 */
export function reviewDeleteRequest(params: {
  requestId: number;
  reviewer: { id: number; role: Role; username: string };
  decision: 'approved' | 'rejected';
}): ReviewResult {
  const db = getDb();
  if (!canReviewDeleteRequests(params.reviewer.role)) {
    return { ok: false, error: 'You do not have permission to review deletion requests.' };
  }
  if (params.decision !== 'approved' && params.decision !== 'rejected') {
    return { ok: false, error: 'Invalid decision.' };
  }

  const request = db
    .prepare(
      `SELECT id, task_id, status FROM task_delete_requests WHERE id = ?`,
    )
    .get(params.requestId) as
    | { id: number; task_id: number; status: string }
    | undefined;
  if (!request) return { ok: false, error: 'Deletion request not found.' };
  if (request.status !== 'pending') {
    return { ok: false, error: 'This request has already been reviewed.' };
  }

  // Title for user-facing messages — read live while the task still exists
  // (approval deletes the task right after this point).
  const taskTitle =
    (db.prepare('SELECT title FROM tasks WHERE id = ?').get(request.task_id) as
      | { title: string }
      | undefined)?.title ?? `task #${request.task_id}`;

  const markReviewed = db.prepare(
    `UPDATE task_delete_requests
     SET status = ?, reviewed_by = ?, reviewed_at = datetime('now')
     WHERE id = ? AND status = 'pending'`,
  );

  if (params.decision === 'rejected') {
    // Conditional update: if the row was already reviewed between our SELECT
    // and this UPDATE, changes === 0 and we bail instead of overwriting.
    const info = markReviewed.run('rejected', params.reviewer.id, request.id);
    if (info.changes !== 1) {
      return { ok: false, error: 'This request has already been reviewed.' };
    }
    logActivity({ taskId: request.task_id, userId: params.reviewer.id, action: Action.DELETE_REJECTED });
    console.log(
      `[tasks] deletion request #${request.id} (task #${request.task_id}) rejected by ${params.reviewer.username}`,
    );
    return { ok: true, message: `Delete request for "${taskTitle}" rejected.` };
  }

  // approve — log first (the activity row dies with the task), then delete.
  const tx = db.transaction(() => {
    logActivity({ taskId: request.task_id, userId: params.reviewer.id, action: Action.DELETE_APPROVED });
    const info = markReviewed.run('approved', params.reviewer.id, request.id);
    if (info.changes !== 1) {
      throw new Error('already reviewed');
    }
    db.prepare('DELETE FROM tasks WHERE id = ?').run(request.task_id);
  });
  try {
    tx();
  } catch (err) {
    // Rolled back (nothing deleted, nothing logged) — the request changed
    // under us (e.g. a second reviewer clicked first).
    if (err instanceof Error && err.message === 'already reviewed') {
      return { ok: false, error: 'This request has already been reviewed.' };
    }
    throw err;
  }
  console.log(
    `[tasks] deletion request #${request.id} approved by ${params.reviewer.username}; task #${request.task_id} deleted`,
  );
  return { ok: true, message: `Deletion approved — task "${taskTitle}" deleted.` };
}
