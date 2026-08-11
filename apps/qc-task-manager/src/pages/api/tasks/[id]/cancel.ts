// POST /api/tasks/[id]/cancel — manager/admin cancellation (spec: "cancelled
// requires manager/admin approval"). The manager/admin IS the approver: they
// cancel directly with a mandatory reason, which is stored on the task
// (cancelled_at / cancelled_by) and recorded in the activity log. Employees
// cannot cancel; their path is the approved deletion workflow.
//
// Auth: session re-checked server-side; the role gate lives in cancelTask.
// Returns JSON for the island.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../../lib/session';
import { cancelTask } from '../../../../lib/taskUpdates';
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
  const reason = String(form.get('reason') ?? '');
  const result = cancelTask({ taskId, actor: { id: user.id, role: user.role }, reason });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return json({ ok: false, error: result.error }, status);
  }
  setFlash(context, 'success', result.message);
  return json({ ok: true, message: result.message });
};
