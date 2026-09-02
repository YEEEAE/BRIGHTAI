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
import { canEditTask } from '../permissions';
import {
  MAX_UPLOAD_BYTES,
  isTaskReadOnly,
} from '../task-policy';
import type { Role } from '../types';

import {
  type UploadResult,
  logActivity,
  loadEditableTask,
  sha256Hex,
  validateUploadedFile,
} from './shared';

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

  if (params.file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `The file exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit.` };
  }
  const bytes = Buffer.from(await params.file.arrayBuffer());
  const validated = validateUploadedFile(params.file, bytes);
  if (!validated.ok) return { ok: false, error: validated.error };
  const hash = sha256Hex(bytes);
  const info = db.transaction(() => {
    const insertResult = db
      .prepare(
        `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_data, file_size, file_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(task.id, params.actor.id, validated.fileName, validated.mimeType, bytes, bytes.length, hash);

    logActivity({
      taskId: task.id,
      userId: params.actor.id,
      action: Action.ATTACHMENT_UPLOADED,
      newValue: validated.fileName,
    });

    return insertResult;
  })();

  return { ok: true, attachmentId: Number(info.lastInsertRowid), fileName: validated.fileName };
}

/**
 * Persist a task comment (POST /api/tasks/[id]/comment). Returns the stored
 * row id + server timestamp so the endpoint can echo the created comment.
 */
export function addTaskComment(taskId: number, userId: number, comment: string): { id: number; created_at: string } {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)')
    .run(taskId, userId, comment);
  const commentId = Number(result.lastInsertRowid);
  const created = db
    .prepare('SELECT created_at FROM task_comments WHERE id = ?')
    .get(commentId) as { created_at: string };
  return { id: commentId, created_at: created.created_at };
}
