// POST /api/tasks/[id]/close — CORE BUSINESS RULE #3 closure flow.
//
// Multipart form: completion_comment (mandatory) + optional `evidence` file.
// When no file is present the evidence step is recorded as SKIPPED in the
// activity log. The endpoint sets status=Completed, fills completed_at /
// completed_by, stores the completion comment, and logs every step
// atomically (src/lib/taskUpdates.ts closeTask).
//
// Auth: session re-checked server-side; the actor must be able to edit the
// task. Completed tasks are rejected. Returns JSON for the island.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { closeTask } from '../../../../lib/taskUpdates';
import { setFlash } from '../../../../lib/flash';
import { parseFormData, parsePositiveId, closeTaskInputSchema } from '../../../../lib/validation';

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

  const form = await context.request.formData();
  const parsed = parseFormData(closeTaskInputSchema, form);
  if (!parsed.ok) return apiJsonError(parsed.error, 400);
  const result = await closeTask({
    taskId,
    actor: { id: user.id, role: user.role },
    form,
  });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return apiJsonError(result.error, status);
  }
  // Completing a recurring task may have spawned the next occurrence — surface
  // it as a one-shot flash so the reloaded page tells the user.
  if (result.nextTaskId != null) {
    setFlash(context, 'success', `Next recurring task created (#${result.nextTaskId}).`);
  }
  return apiJson({ taskId: result.taskId, nextTaskId: result.nextTaskId });
};
