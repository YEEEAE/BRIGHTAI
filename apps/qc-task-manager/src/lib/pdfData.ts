// DB-side assembly of the task PDF report data.
//
// Kept in its OWN module (separate from the pure buildTaskPdf builder) so the
// server-less test runner can import pdf.ts without loading db.ts — db.ts
// imports schema.sql?raw, which plain Node cannot resolve (same constraint as
// taskSearch.ts / export.ts).

import {
  formatDbDate,
  priorityLabel,
  recurrenceLabel,
  statusLabel,
} from './format';
import type { TaskPdfData } from './pdf';
import {
  describeAction,
  getClosureComment,
  getTaskDetail,
  listActivity,
  listComments,
  listEvidenceFiles,
  type ActivityEntry,
  type CommentWithAuthor,
} from './taskDetails';

/**
 * Assemble the full report payload for one task from SQLite. Returns null when
 * the task does not exist. Access control is the CALLER's job (canViewTask).
 */
export function getTaskPdfData(taskId: number): TaskPdfData | null {
  const task = getTaskDetail(taskId);
  if (!task) return null;

  const allComments = listComments(taskId);
  const completionComment = getClosureComment(taskId);
  const regularComments = allComments.filter((c) => Number(c.is_completion_comment) !== 1);
  const evidence = listEvidenceFiles(taskId);
  const activity = listActivity(taskId);
  const evidenceSkipped = activity.some((a) => a.action === 'evidence_skipped');

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    department: task.department,
    progress_percent: task.progress_percent,
    status_label: statusLabel(task.status),
    priority_label: priorityLabel(task.priority),
    recurrence_label: recurrenceLabel(task.recurrence),
    assignee: task.assignee_name ?? 'Unassigned',
    creator: task.creator_name ?? 'Unknown',
    due_date: task.due_date,
    created_at: task.created_at,
    updated_at: task.updated_at,
    started_at: task.started_at,
    completed: task.status === 'completed',
    completed_at: task.completed_at,
    completed_by: task.completed_by_name ?? 'Unknown',
    completion_comment: completionComment?.comment ?? null,
    evidence_files: evidence.map((e) => e.file_name),
    evidence_skipped: evidenceSkipped,
    cancelled: task.status === 'cancelled',
    cancelled_at: task.cancelled_at,
    cancelled_by: task.cancelled_by_name ?? 'Unknown',
    comments: regularComments.map(formatComment),
    activity: activity.map(formatActivity),
    generated_at: formatDbDate(new Date().toISOString().replace('T', ' ').slice(0, 19)),
  };
}

function formatComment(c: CommentWithAuthor): TaskPdfData['comments'][number] {
  return { author: c.full_name, date: formatDbDate(c.created_at), text: c.comment };
}

function formatActivity(a: ActivityEntry): TaskPdfData['activity'][number] {
  return {
    user: a.user_name,
    date: formatDbDate(a.created_at),
    text: describeAction(a.action, a.old_value, a.new_value),
  };
}
