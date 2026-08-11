// POST /api/tasks/[id]/update — update a task (status, progress, blocker,
// and — for supervisor/manager/admin — the locked fields).
//
// Auth: the session is re-checked here (server-side) and every field is
// permission-checked against the actor's role in src/lib/taskUpdates.ts
// (CORE BUSINESS RULE #2). Completed tasks are read-only for everyone.
// Returns JSON so the TaskUpdatePanel island can show errors inline.

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { applyTaskUpdate } from '../../../../lib/taskUpdates';
import { parseFormData, parsePositiveId, taskUpdateInputSchema } from '../../../../lib/validation';

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const taskId = parsePositiveId(context.params.id);
  if (taskId == null) {
    return json({ ok: false, error: 'Invalid task id.' }, 404);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(taskUpdateInputSchema, form);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);
  const result = applyTaskUpdate({ taskId, actor: { id: user.id, role: user.role }, form });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return json({ ok: false, error: result.error }, status);
  }
  return json({ ok: true, message: result.message, changed: result.changed });
};
