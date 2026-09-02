// POST /api/tasks/[id]/comment — add a comment to a task.
//
// Auth: any authenticated role may comment, as long as they can VIEW the task
// (employee: assigned or created). Enforced here, not in middleware.
//
// CORE BUSINESS RULE #3: completed tasks are read-only for everyone → 403.
//
// Returns JSON so the CommentBox island can append the new comment instantly.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { canViewTask, getTaskCore } from '../../../../lib/taskDetails';
import { addTaskComment } from '../../../../lib/taskUpdates';
import { logActivity, Action } from '../../../../lib/activity';
import { createNotification } from '../../../../lib/notifications';
 import { parseFormData, commentSchema, parsePositiveId } from '../../../../lib/validation';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const taskId = parsePositiveId(context.params.id);
  if (taskId == null) {
    return apiJsonError('Invalid task id.', 404);
  }

  const task = getTaskCore(taskId);
  if (!task) return apiJsonError('Task not found.', 404);

  if (!canViewTask({ id: user.id, role: user.role }, task)) {
    return apiJsonError('Task not found.', 404);
  }
  if (task.status === 'completed') {
    return apiJsonError('This task is completed and is read-only.', 403);
  }
  if (task.status === 'cancelled') {
    return apiJsonError('This task is cancelled and is read-only.', 403);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(commentSchema, form);
  if (!parsed.ok) return apiJsonError(parsed.error, 400);
  const comment = parsed.data.comment;

  const { id: commentId, created_at } = addTaskComment(taskId, user.id, comment);

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

  return apiJson({
    comment: {
      id: commentId,
      task_id: taskId,
      user_id: user.id,
      comment,
      created_at,
      full_name: user.full_name,
    },
  });
};
