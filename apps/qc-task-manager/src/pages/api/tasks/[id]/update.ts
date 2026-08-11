// POST /api/tasks/[id]/update — update a task (status, progress, blocker,
// and — for supervisor/manager/admin — the locked fields).
//
// Auth: the session is re-checked here (server-side) and every field is
// permission-checked against the actor's role in src/lib/taskUpdates.ts
// (CORE BUSINESS RULE #2). Completed tasks are read-only for everyone.
// Returns JSON so the TaskUpdatePanel island can show errors inline.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../../lib/session';
import { applyTaskUpdate } from '../../../../lib/taskUpdates';

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
  const result = applyTaskUpdate({ taskId, actor: { id: user.id, role: user.role }, form });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return json({ ok: false, error: result.error }, status);
  }
  return json({ ok: true, message: result.message, changed: result.changed });
};
