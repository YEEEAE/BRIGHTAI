// GET /api/tasks/[id]/attachments/[attachmentId] — stream a stored attachment.
//
// Auth: same view rule as the task details page (employees: assigned or
// created). The BLOB stays in SQLite (CORE BUSINESS RULE #5) — this endpoint
// is the only way to download it. Responses are private and never cached.

import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser } from '../../../../../lib/api-security';
import { getAttachment, canViewTask, getTaskCore } from '../../../../../lib/taskDetails';
import { parsePositiveId } from '../../../../../lib/validation';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const taskId = parsePositiveId(context.params.id);
  const attachmentId = parsePositiveId(context.params.attachmentId);
  if (taskId == null || attachmentId == null) {
    return apiJsonError('Invalid task or attachment id.', 404);
  }

  const task = getTaskCore(taskId);
  if (!task) return apiJsonError('Task not found.', 404);
  if (!canViewTask({ id: user.id, role: user.role }, task)) {
    return apiJsonError('You cannot view this task.', 403);
  }

  const attachment = getAttachment(attachmentId, taskId);
  if (!attachment) return apiJsonError('Attachment not found.', 404);

  // RFC 5987 encodes non-ASCII file names safely; an ASCII filename= fallback
  // keeps very old browsers working.
  const encodedName = encodeURIComponent(attachment.file_name);
  // eslint-disable-next-line no-control-regex
  const asciiName = attachment.file_name.replace(/[^\x20-\x7e]/g, '_').replace(/[\\/"]/g, '_').slice(0, 180);
  return new Response(new Uint8Array(attachment.file_data), {
    headers: {
      'Content-Type': attachment.mime_type || 'application/octet-stream',
      'Content-Length': String(attachment.file_data.byteLength),
      'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      'Cache-Control': 'private, no-store',
    },
  });
};
