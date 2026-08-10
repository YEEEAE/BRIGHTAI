// Activity logging helper. Every task mutation is recorded (CORE BUSINESS RULE #6).
//
// The activity log table is (task_id, user_id, action, old_value, new_value, created_at).
// The changed field name, when meaningful, is encoded in `action`
// (e.g. STATUS_CHANGED, PROGRESS_CHANGED) rather than stored in a separate column.

import { getDb } from './db';

/** Well-known action strings to keep the log consistent. */
export const Action = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  STATUS_CHANGED: 'status_changed',
  PROGRESS_CHANGED: 'progress_changed',
  FIELD_CHANGED: 'field_changed',
  BLOCKER_SET: 'blocker_set',
  COMMENT_ADDED: 'comment_added',
  CLOSURE_COMMENT_ADDED: 'closure_comment_added',
  EVIDENCE_UPLOADED: 'evidence_uploaded',
  EVIDENCE_SKIPPED: 'evidence_skipped',
  TASK_COMPLETED: 'task_completed',
  DELETE_REQUESTED: 'delete_requested',
  DELETE_APPROVED: 'delete_approved',
  DELETE_REJECTED: 'delete_rejected',
  TASK_DELETED: 'task_deleted',
} as const;

export type ActionType = (typeof Action)[keyof typeof Action];

/**
 * Append a single activity entry.
 * `action` identifies what happened (and, via the well-known constants above,
 * which field changed). `oldValue` / `newValue` capture the transition.
 */
export function logActivity(params: {
  taskId: number;
  userId: number;
  action: string;
  oldValue?: string | null | number | boolean;
  newValue?: string | null | number | boolean;
}): void {
  const db = getDb();
  const oldStr = params.oldValue == null ? null : String(params.oldValue);
  const newStr = params.newValue == null ? null : String(params.newValue);
  db.prepare(
    `INSERT INTO task_activity_log (task_id, user_id, action, old_value, new_value)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(params.taskId, params.userId, params.action, oldStr, newStr);
}
