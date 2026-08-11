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
import { getCurrentUser } from '../../../../lib/session';
import { closeTask } from '../../../../lib/taskUpdates';
import { setFlash } from '../../../../lib/flash';

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

  const form = await context.request.formData();
  const result = await closeTask({
    taskId,
    actor: { id: user.id, role: user.role },
    form,
  });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return json({ ok: false, error: result.error }, status);
  }
  // Completing a recurring task may have spawned the next occurrence — surface
  // it as a one-shot flash so the reloaded page tells the user.
  if (result.nextTaskId != null) {
    setFlash(context, 'success', `Next recurring task created (#${result.nextTaskId}).`);
  }
  return json({ ok: true, taskId: result.taskId, nextTaskId: result.nextTaskId });
};
