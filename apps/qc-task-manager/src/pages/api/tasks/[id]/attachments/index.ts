// POST /api/tasks/[id]/attachments — upload an attachment (stored as a BLOB,
// CORE BUSINESS RULE #5).
//
// Auth: session re-checked server-side; the actor must be able to EDIT the
// task (employees: their own tasks). Validation (extension + MIME + 10 MB)
// lives in src/lib/taskUpdates.ts validateUploadedFile. Completed tasks reject
// uploads. Returns JSON for the AttachmentUploader island.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
import { uploadAttachment, MAX_UPLOAD_BYTES } from '../../../../../lib/taskUpdates';
import { parsePositiveId } from '../../../../../lib/validation';

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
  const rawFile = form.get('file');
  if (typeof rawFile !== 'object' || rawFile === null || !('size' in rawFile)) {
    return apiJsonError('No file provided.', 400);
  }
  const file = rawFile as File;
  if (file.size === 0) {
    return apiJsonError('The file is empty.', 400);
  }

  const result = await uploadAttachment({ taskId, actor: { id: user.id, role: user.role }, file });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return apiJsonError(result.error, status);
  }

  return apiJson({
    attachmentId: result.attachmentId,
    fileName: result.fileName,
    maxBytes: MAX_UPLOAD_BYTES,
  });
};
