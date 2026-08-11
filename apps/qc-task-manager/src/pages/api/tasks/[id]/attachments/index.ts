// POST /api/tasks/[id]/attachments — upload an attachment (stored as a BLOB,
// CORE BUSINESS RULE #5).
//
// Auth: session re-checked server-side; the actor must be able to EDIT the
// task (employees: their own tasks). Validation (extension + MIME + 10 MB)
// lives in src/lib/taskUpdates.ts validateUploadedFile. Completed tasks reject
// uploads. Returns JSON for the AttachmentUploader island.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../../../lib/session';
import { uploadAttachment, MAX_UPLOAD_BYTES } from '../../../../../lib/taskUpdates';

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
  const rawFile = form.get('file');
  if (typeof rawFile !== 'object' || rawFile === null || !('size' in rawFile)) {
    return json({ ok: false, error: 'No file provided.' }, 400);
  }
  const file = rawFile as File;
  if (file.size === 0) {
    return json({ ok: false, error: 'The file is empty.' }, 400);
  }

  const result = await uploadAttachment({ taskId, actor: { id: user.id, role: user.role }, file });
  if (!result.ok) {
    const status = result.error === 'Task not found.' ? 404 : 400;
    return json({ ok: false, error: result.error }, status);
  }

  return json({
    ok: true,
    attachmentId: result.attachmentId,
    fileName: result.fileName,
    maxBytes: MAX_UPLOAD_BYTES,
  });
};
