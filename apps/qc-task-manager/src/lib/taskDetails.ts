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
import type { Role, Task, TaskComment, TaskAttachment, ActivityLogEntry } from './types';

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
};

/** Load a single task with creator/assignee/completer display names. */
export function getTaskDetail(id: number): TaskDetail | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT t.*,
              creator.full_name  AS creator_name,
              assignee.full_name AS assignee_name,
              completer.full_name AS completed_by_name
       FROM tasks t
       LEFT JOIN users creator   ON creator.id   = t.created_by
       LEFT JOIN users assignee  ON assignee.id  = t.assigned_to
       LEFT JOIN users completer ON completer.id = t.completed_by
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
 * Completion comment matched back from the latest CLOSURE_COMMENT_ADDED entry
 * (new_value holds the comment text) to its row in task_comments.
 */
export function getClosureComment(taskId: number): CommentWithAuthor | null {
  const db = getDb();
  const entry = db
    .prepare(
      `SELECT new_value
       FROM task_activity_log
       WHERE task_id = ? AND action = 'closure_comment_added'
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
    )
    .get(taskId) as { new_value: string | null } | undefined;
  if (!entry?.new_value) return null;
  const comment = db
    .prepare(
      `SELECT c.*, u.full_name
       FROM task_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ? AND c.comment = ?
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT 1`,
    )
    .get(taskId, entry.new_value) as CommentWithAuthor | undefined;
  return comment ?? null;
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
    case 'task_completed':
      return 'status';
    case 'progress_changed':
      return 'progress';
    case 'task_updated':
    case 'field_changed':
      return 'field';
    case 'blocker_set':
      return 'blocker';
    case 'comment_added':
    case 'closure_comment_added':
      return 'comment';
    case 'evidence_uploaded':
    case 'evidence_skipped':
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
    case 'task_completed':
      return 'marked the task completed.';
    case 'progress_changed':
      return `updated progress to ${newValue ?? '0'}%.`;
    case 'task_updated':
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
