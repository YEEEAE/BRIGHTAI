// POST /api/tasks/[id]/comment — add a comment to a task.
//
// Auth: any authenticated role may comment, as long as they can VIEW the task
// (employee: assigned or created). Enforced here, not in middleware.
//
// CORE BUSINESS RULE #3: completed tasks are read-only for everyone → 403.
//
// Returns JSON so the CommentBox island can append the new comment instantly.

import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { getCurrentUser } from '../../../../lib/session';
import { canViewTask } from '../../../../lib/taskDetails';
import { logActivity, Action } from '../../../../lib/activity';
import { createNotification } from '../../../../lib/notifications';
import { parseFormData, commentSchema } from '../../../../lib/validation';
import type { Task } from '../../../../lib/types';

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async (context) => {
  const user = getCurrentUser(context);
  if (!user) return json({ ok: false, error: 'Not authenticated.' }, 401);

  const taskId = Number(context.params.id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return json({ ok: false, error: 'Invalid task id.' }, 404);
  }

  const task = getDb().prepare('SELECT id, status, created_by, assigned_to, title FROM tasks WHERE id = ?').get(taskId) as
    | Pick<Task, 'id' | 'status' | 'created_by' | 'assigned_to' | 'title'>
    | undefined;
  if (!task) return json({ ok: false, error: 'Task not found.' }, 404);

  if (!canViewTask({ id: user.id, role: user.role }, task)) {
    return json({ ok: false, error: 'You cannot view this task.' }, 403);
  }
  if (task.status === 'completed') {
    return json({ ok: false, error: 'This task is completed and is read-only.' }, 403);
  }
  if (task.status === 'cancelled') {
    return json({ ok: false, error: 'This task is cancelled and is read-only.' }, 403);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(commentSchema, form);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);
  const comment = parsed.data.comment;

  const db = getDb();
  const result = db
    .prepare('INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)')
    .run(taskId, user.id, comment);
  const commentId = Number(result.lastInsertRowid);

  logActivity({ taskId, userId: user.id, action: Action.COMMENT_ADDED, newValue: comment });

  // Comment notification (spec: "a comment is added to a task"): the assignee
  // + creator, excluding the commenter, get a persisted in-app alert.
  const recipients = new Set<number>();
  if (task.assigned_to != null) recipients.add(task.assigned_to);
  if (task.created_by != null) recipients.add(task.created_by);
  recipients.delete(user.id);
  const snippet = comment.length > 90 ? `${comment.slice(0, 90)}…` : comment;
  for (const uid of recipients) {
    createNotification({
      userId: uid,
      taskId,
      type: 'comment_added',
      title: `New comment by ${user.full_name}`,
      message: `On "${task.title}": “${snippet}”`,
    });
  }

  const created = db
    .prepare('SELECT created_at FROM task_comments WHERE id = ?')
    .get(commentId) as { created_at: string };

  return json({
    ok: true,
    comment: {
      id: commentId,
      task_id: taskId,
      user_id: user.id,
      comment,
      created_at: created.created_at,
      full_name: user.full_name,
    },
  });
};
