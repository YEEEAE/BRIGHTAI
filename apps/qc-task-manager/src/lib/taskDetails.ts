// Read-side queries + presentation helpers for the task details page.
//
// Responsibilities:
//   - Access control: who may VIEW a task (CORE RULE: employees see only their
//     own tasks; everyone else sees all tasks).
//   - Fetch task + joined creator/assignee/completer names.
//   - Fetch comments, attachment metadata (never the BLOBs), and activity log.
//   - Derive evidence + closure comment from the activity log (they have no
//     dedicated columns — the closure flow lives in the log).
//   - Map raw activity actions to icons/categories and plain-English text.
//
// All functions here are synchronous (better-sqlite3).

import { getDb } from './db';
import { statusLabel } from './format';
import type {
  Role,
  Task,
  TaskComment,
  TaskAttachment,
  ActivityLogEntry,
  TaskChecklistItem,
  DependencyInfo,
} from './types';

export type { DependencyInfo } from './types';

/**
 * Can `actor` view this task? Employees may view only tasks they were assigned
 * or that they created; every other role may view any task.
 */
export function canViewTask(
  actor: { id: number; role: Role },
  task: Pick<Task, 'assigned_to' | 'created_by'>,
): boolean {
  if (actor.role !== 'employee') return true;
  return task.assigned_to === actor.id || task.created_by === actor.id;
}

/** Task plus joined display names. Null when the task does not exist. */
export type TaskDetail = Task & {
  creator_name: string | null;
  assignee_name: string | null;
  completed_by_name: string | null;
  cancelled_by_name: string | null;
};

/** Load a single task with creator/assignee/completer/canceller display names. */
export function getTaskDetail(id: number): TaskDetail | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT t.*,
              creator.full_name   AS creator_name,
              assignee.full_name  AS assignee_name,
              completer.full_name AS completed_by_name,
              canceller.full_name AS cancelled_by_name
       FROM tasks t
       LEFT JOIN users creator   ON creator.id   = t.created_by
       LEFT JOIN users assignee  ON assignee.id  = t.assigned_to
       LEFT JOIN users completer ON completer.id = t.completed_by
       LEFT JOIN users canceller ON canceller.id = t.cancelled_by
       WHERE t.id = ?`,
    )
    .get(id) as TaskDetail | undefined;
  return row ?? null;
}

export type CommentWithAuthor = TaskComment & { full_name: string };

/** Comments in chronological order with the author's name. */
export function listComments(taskId: number): CommentWithAuthor[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, u.full_name
       FROM task_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC, c.id ASC`,
    )
    .all(taskId) as CommentWithAuthor[];
}

/** Checklist items in display order. */
export function listChecklist(taskId: number): TaskChecklistItem[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, task_id, title, sort_order, is_completed, completed_by, completed_at, created_at
       FROM task_checklists
       WHERE task_id = ?
       ORDER BY sort_order ASC, id ASC`,
    )
    .all(taskId) as TaskChecklistItem[];
}

/** All dependency edges of a task joined with the dependency task's display data. */
export function listDependencies(taskId: number): DependencyInfo[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT d.task_id, d.depends_on_task_id, t.title, t.status, t.progress_percent, t.due_date
       FROM task_dependencies d
       JOIN tasks t ON t.id = d.depends_on_task_id
       WHERE d.task_id = ?
       ORDER BY t.title ASC, t.id ASC`,
    )
    .all(taskId) as DependencyInfo[];
}

/** The parent task of a recurring child, if any (for the "series of" link). */
export function getRecurringParent(taskId: number): { id: number; title: string } | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.id, p.title
       FROM tasks t
       JOIN tasks p ON p.id = t.parent_recurring_task_id
       WHERE t.id = ?`,
    )
    .get(taskId) as { id: number; title: string } | undefined;
  return row ?? null;
}

/** Attachment metadata (never the BLOB) with the uploader's name. */
export type AttachmentMeta = Omit<TaskAttachment, 'file_data'> & { uploader: string };

export function listAttachmentMeta(taskId: number): AttachmentMeta[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.id, a.task_id, a.uploaded_by, a.file_name, a.mime_type,
              a.file_size, a.uploaded_at, u.full_name AS uploader
       FROM task_attachments a
       JOIN users u ON u.id = a.uploaded_by
       WHERE a.task_id = ?
       ORDER BY a.uploaded_at ASC, a.id ASC`,
    )
    .all(taskId) as AttachmentMeta[];
}

/** Full attachment row including the BLOB (for the download endpoint only). */
export function getAttachment(id: number, taskId: number): TaskAttachment | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, task_id, uploaded_by, file_name, mime_type, file_data, file_size, uploaded_at
       FROM task_attachments
       WHERE id = ? AND task_id = ?`,
    )
    .get(id, taskId) as TaskAttachment | undefined;
  return row ?? null;
}

export type ActivityEntry = ActivityLogEntry & { user_name: string };

/** Activity log in chronological order with the actor's name. */
export function listActivity(taskId: number): ActivityEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.*, u.full_name AS user_name
       FROM task_activity_log a
       JOIN users u ON u.id = a.user_id
       WHERE a.task_id = ?
       ORDER BY a.created_at ASC, a.id ASC`,
    )
    .all(taskId) as ActivityEntry[];
}

/**
 * Evidence decision derived from the latest EVIDENCE_UPLOADED / EVIDENCE_SKIPPED
 * activity entry. `uploaded` carries the file name; when an attachment matches
 * it we also return the attachment id so the page can link the download.
 */
export type EvidenceInfo =
  | { kind: 'uploaded'; fileName: string; attachmentId: number | null }
  | { kind: 'skipped' }
  | null;

export function getEvidenceInfo(taskId: number): EvidenceInfo {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT action, new_value
       FROM task_activity_log
       WHERE task_id = ? AND action IN ('evidence_uploaded', 'evidence_skipped')
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
    )
    .get(taskId) as { action: string; new_value: string | null } | undefined;
  if (!row) return null;
  if (row.action === 'evidence_skipped') return { kind: 'skipped' };
  const fileName = row.new_value ?? '';
  let attachmentId: number | null = null;
  if (fileName) {
    const att = db
      .prepare('SELECT id FROM task_attachments WHERE task_id = ? AND file_name = ? ORDER BY id DESC LIMIT 1')
      .get(taskId, fileName) as { id: number } | undefined;
    attachmentId = att?.id ?? null;
  }
  return { kind: 'uploaded', fileName, attachmentId };
}

/**
 * The completion comment is stored with is_completion_comment = 1 (the wizard
 * flow) and linked on tasks.completion_comment_id — a direct lookup, no longer
 * inferred from the activity log. After a reopen the flag is cleared and the
 * comment returns to the regular thread.
 */
export function getClosureComment(taskId: number): CommentWithAuthor | null {
  const db = getDb();
  const comment = db
    .prepare(
      `SELECT c.*, u.full_name
       FROM task_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ? AND c.is_completion_comment = 1
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT 1`,
    )
    .get(taskId) as CommentWithAuthor | undefined;
  return comment ?? null;
}

/**
 * Evidence attachments (is_evidence = 1) — the completion wizard's uploads.
 * All of them are shown on the completed-task panel (spec: "Evidence files").
 */
export function listEvidenceFiles(taskId: number): AttachmentMeta[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.id, a.task_id, a.uploaded_by, a.file_name, a.mime_type,
              a.file_size, a.uploaded_at, u.full_name AS uploader
       FROM task_attachments a
       JOIN users u ON u.id = a.uploaded_by
       WHERE a.task_id = ? AND a.is_evidence = 1
       ORDER BY a.uploaded_at ASC, a.id ASC`,
    )
    .all(taskId) as AttachmentMeta[];
}

/**
 * Coarse category for an activity action, used to pick the timeline icon + tone.
 * Keep in sync with the ICON_SVG / ICON_TONE maps in pages/tasks/[id].astro.
 */
export function actionCategory(action: string): string {
  switch (action) {
    case 'task_created':
      return 'created';
    case 'status_changed':
    case 'task_started':
    case 'task_completed':
    case 'task_reopened':
      return 'status';
    case 'task_cancelled':
      return 'delete';
    case 'progress_changed':
      return 'progress';
    case 'task_updated':
    case 'field_changed':
    case 'title_changed':
    case 'description_changed':
    case 'department_changed':
    case 'assignee_changed':
    case 'due_date_changed':
    case 'priority_changed':
    case 'recurrence_changed':
    case 'recurrence_end_date_changed':
      return 'field';
    case 'checklist_item_added':
    case 'checklist_item_updated':
    case 'checklist_item_removed':
      return 'checklist';
    case 'dependency_added':
    case 'dependency_removed':
    case 'dependency_override':
      return 'dependency';
    case 'recurring_task_created':
      return 'recurring';
    case 'blocker_set':
      return 'blocker';
    case 'comment_added':
    case 'closure_comment_added':
      return 'comment';
    case 'evidence_uploaded':
    case 'evidence_skipped':
    case 'attachment_uploaded':
      return 'evidence';
    case 'delete_requested':
    case 'delete_approved':
    case 'delete_rejected':
    case 'task_deleted':
      return 'delete';
    default:
      return 'other';
  }
}

/** Plain-English description of a single activity entry. */
export function describeAction(action: string, oldValue: string | null, newValue: string | null): string {
  switch (action) {
    case 'task_created':
      return `created this task${newValue ? `: "${newValue}"` : ''}.`;
    case 'status_changed':
      return `changed status from ${statusLabel(oldValue ?? 'unknown')} to ${statusLabel(newValue ?? 'unknown')}.`;
    case 'task_started':
      return 'started working on this task.';
    case 'task_completed':
      return 'marked the task completed.';
    case 'task_cancelled':
      return `cancelled this task${newValue ? `: ${fmtVal(newValue)}` : '.'}`;
    case 'task_reopened':
      return 'reopened this task — it is In Progress again.';
    case 'progress_changed':
      return `updated progress to ${newValue ?? '0'}%.`;
    case 'task_updated':
      return 'updated task details.';
    case 'title_changed':
      return `changed the title from ${fmtVal(oldValue)} to ${fmtVal(newValue)}.`;
    case 'description_changed':
      return oldValue ? 'updated the description.' : 'added a description.';
    case 'department_changed':
      return `changed the department from ${fmtVal(oldValue)} to ${fmtVal(newValue)}.`;
    case 'assignee_changed':
      return `reassigned the task from ${fmtVal(oldValue)} to ${fmtVal(newValue)}.`;
    case 'due_date_changed':
      return `changed the due date from ${fmtVal(oldValue)} to ${fmtVal(newValue)}.`;
    case 'priority_changed':
      return `changed priority from ${fmtVal(oldValue)} to ${fmtVal(newValue)}.`;
    case 'recurrence_changed':
      return `changed recurrence from ${fmtVal(oldValue)} to ${fmtVal(newValue)}.`;
    case 'recurrence_end_date_changed':
      return `changed the recurrence end date from ${fmtVal(oldValue)} to ${fmtVal(newValue)}.`;
    case 'checklist_item_added':
      return `added a checklist item: ${fmtVal(newValue)}.`;
    case 'checklist_item_updated':
      return `${oldValue === 'checked' ? 'unchecked' : 'checked off'} the checklist item ${fmtVal(newValue)}.`;
    case 'checklist_item_removed':
      return `removed the checklist item ${fmtVal(newValue)}.`;
    case 'dependency_added':
      return `added dependency task ${newValue ?? ''}.`;
    case 'dependency_removed':
      return `removed dependency task ${newValue ?? ''}.`;
    case 'dependency_override':
      return `overrode blocked dependencies (${fmtVal(oldValue)}) with reason: ${fmtVal(newValue)}.`;
    case 'recurring_task_created':
      return `created ${newValue ?? 'the next occurrence'}.`;
    case 'field_changed':
      return 'updated task details.';
    case 'blocker_set':
      return newValue ? 'added a blocker note.' : 'cleared the blocker note.';
    case 'comment_added':
      return 'added a comment.';
    case 'closure_comment_added':
      return 'added the completion comment.';
    case 'evidence_uploaded':
      return `uploaded evidence: ${newValue ?? 'a file'}.`;
    case 'evidence_skipped':
      return 'skipped the evidence upload.';
    case 'attachment_uploaded':
      return `uploaded an attachment: ${newValue ?? 'a file'}.`;
    case 'delete_requested':
      return 'requested deletion of this task.';
    case 'delete_approved':
      return 'approved the deletion request.';
    case 'delete_rejected':
      return 'rejected the deletion request.';
    case 'task_deleted':
      return 'deleted this task.';
    default:
      return `recorded ${action.replace(/_/g, ' ')}.`;
  }
}

/** Render a nullable old/new value in timeline text ("—" for null/empty). */
function fmtVal(value: string | null | undefined): string {
  if (!value) return '—';
  return `"${value}"`;
}
