// Activity logging helper. Every task mutation is recorded (CORE BUSINESS RULE #6).
//
// The activity log table is (task_id, user_id, action, old_value, new_value, created_at).
// The changed field name, when meaningful, is encoded in `action`
// (e.g. STATUS_CHANGED, PROGRESS_CHANGED) rather than stored in a separate column.

import { getDb } from './db';
import { backfillAuditChain, canonicalEvent, createAuditEventHash, verifyAuditChain } from './audit/chain';

export { backfillAuditChain, canonicalEvent, createAuditEventHash, verifyAuditChain };

/** Well-known action strings to keep the log consistent. */
export const Action = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  STATUS_CHANGED: 'status_changed',
  PROGRESS_CHANGED: 'progress_changed',
  FIELD_CHANGED: 'field_changed',
  BLOCKER_SET: 'blocker_set',
  TITLE_CHANGED: 'title_changed',
  DESCRIPTION_CHANGED: 'description_changed',
  DEPARTMENT_CHANGED: 'department_changed',
  ASSIGNEE_CHANGED: 'assignee_changed',
  DUE_DATE_CHANGED: 'due_date_changed',
  PRIORITY_CHANGED: 'priority_changed',
  RECURRENCE_CHANGED: 'recurrence_changed',
  RECURRENCE_END_CHANGED: 'recurrence_end_date_changed',
  CHECKLIST_ITEM_ADDED: 'checklist_item_added',
  CHECKLIST_ITEM_UPDATED: 'checklist_item_updated',
  CHECKLIST_ITEM_REMOVED: 'checklist_item_removed',
  CHECKLIST_REORDERED: 'checklist_reordered',
  CHECKLIST_OVERRIDE: 'checklist_override',
  DEPENDENCY_ADDED: 'dependency_added',
  DEPENDENCY_REMOVED: 'dependency_removed',
  DEPENDENCY_OVERRIDE: 'dependency_override',
  RECURRING_TASK_CREATED: 'recurring_task_created',
  TASK_STARTED: 'task_started',
  TASK_CANCELLED: 'task_cancelled',
  TASK_REOPENED: 'task_reopened',
  COMMENT_ADDED: 'comment_added',
  CLOSURE_COMMENT_ADDED: 'closure_comment_added',
  EVIDENCE_UPLOADED: 'evidence_uploaded',
  EVIDENCE_SKIPPED: 'evidence_skipped',
  EVIDENCE_REPLACED: 'evidence_replaced',
  EVIDENCE_GATE_OVERRIDE: 'evidence_gate_override',
  EVIDENCE_VERIFIED: 'evidence_verified',
  ATTACHMENT_UPLOADED: 'attachment_uploaded',
  TASK_COMPLETED: 'task_completed',
  DELETE_REQUESTED: 'delete_requested',
  DELETE_APPROVED: 'delete_approved',
  DELETE_REJECTED: 'delete_rejected',
  TASK_DELETED: 'task_deleted',
  NOTIFICATION_CREATED: 'notification_created',
  SLA_ESCALATED: 'sla_escalated',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_UPDATED: 'template_updated',
  TEMPLATE_ACTIVATED: 'template_activated',
  TEMPLATE_ARCHIVED: 'template_archived',
  TEMPLATE_UNARCHIVED: 'template_unarchived',
  TEMPLATE_INSTANTIATED: 'template_instantiated',
  WORKFLOW_APPROVED: 'workflow_approved',
  WORKFLOW_REJECTED: 'workflow_rejected',
  WORKFLOW_CLOSED: 'workflow_closed',
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
  field?: string | null;
  note?: string | null;
  ipAddress?: string | null;
}): void {
  const db = getDb();
  const oldStr = params.oldValue == null ? null : String(params.oldValue);
  const newStr = params.newValue == null ? null : String(params.newValue);
  const createdAt = new Date().toISOString();
  db.transaction(() => {
    const previous = db.prepare('SELECT event_hash FROM task_activity_log ORDER BY id DESC LIMIT 1').get() as { event_hash: string | null } | undefined;
    const event = { task_id: params.taskId, user_id: params.userId, action: params.action, field: params.field ?? null, old_value: oldStr, new_value: newStr, note: params.note ?? null, ip_address: params.ipAddress ?? null, created_at: createdAt };
    const eventHash = createAuditEventHash(event, previous?.event_hash ?? null);
    db.prepare(
      `INSERT INTO task_activity_log (task_id, user_id, action, field, old_value, new_value, note, ip_address, created_at, previous_hash, event_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(event.task_id, event.user_id, event.action, event.field, event.old_value, event.new_value, event.note, event.ip_address, event.created_at, previous?.event_hash ?? null, eventHash);
  })();
}
