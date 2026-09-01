// POST /api/tasks/[id]/reopen — ADMIN/MANAGER ONLY (spec: "completed →
// reopened only by admin or manager"). Returns a completed task to In Progress
// (work resumes): clears completed_at/completed_by, unflags the completion
// comment back into the regular thread, and logs the reopen (reopenTask).
//
// Auth: session re-checked server-side; the role gate lives in reopenTask.
// Returns JSON for the island.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { reopenTask } from '../../../../lib/taskUpdates';
import { setFlash } from '../../../../lib/flash';
import { parsePositiveId } from '../../../../lib/validation';

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

  const result = reopenTask({ taskId, actor: { id: user.id, role: user.role } });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return apiJsonError(result.error, status);
  }
  setFlash(context, 'success', result.message);
  return apiJson({ message: result.message });
};
