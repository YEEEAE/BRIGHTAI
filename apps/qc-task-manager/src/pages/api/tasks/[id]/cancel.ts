// POST /api/tasks/[id]/cancel — manager/admin cancellation (spec: "cancelled
// requires manager/admin approval"). The manager/admin IS the approver: they
// cancel directly with a mandatory reason, which is stored on the task
// (cancelled_at / cancelled_by) and recorded in the activity log. Employees
// cannot cancel; their path is the approved deletion workflow.
//
// Auth: session re-checked server-side; the role gate lives in cancelTask.
// Returns JSON for the island.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { cancelTask } from '../../../../lib/taskUpdates';
import { setFlash } from '../../../../lib/flash';
import { parseFormData, parsePositiveId, cancelTaskInputSchema } from '../../../../lib/validation';

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
  const parsed = parseFormData(cancelTaskInputSchema, form);
  if (!parsed.ok) return apiJsonError(parsed.error, 400);
  const reason = parsed.data.reason;
  const result = cancelTask({ taskId, actor: { id: user.id, role: user.role }, reason });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return apiJsonError(result.error, status);
  }
  setFlash(context, 'success', result.message);
  return apiJson({ message: result.message });
};
