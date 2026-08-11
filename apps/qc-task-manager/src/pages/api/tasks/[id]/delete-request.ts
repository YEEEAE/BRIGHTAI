// POST /api/tasks/[id]/delete-request — employee submits a deletion request.
//
// Auth: the caller must be an authenticated employee who can view the task
// (assigned or created) and the task must not be completed. All rules are
// enforced in src/lib/deleteRequests.ts (submitDeleteRequest) — this endpoint
// only wires the form body through and maps errors to JSON.
//
// Returns JSON so the DeleteRequestDialog island can flip to the badge instantly.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../../lib/session';
import { submitDeleteRequest } from '../../../../lib/deleteRequests';
import { parseFormData, deleteRequestSchema } from '../../../../lib/validation';

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
  const parsed = parseFormData(deleteRequestSchema, form);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  const result = submitDeleteRequest({ taskId, userId: user.id, role: user.role, reason: parsed.data.reason });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return json({ ok: false, error: result.error }, status);
  }
  return json({ ok: true, requestId: result.requestId });
};
