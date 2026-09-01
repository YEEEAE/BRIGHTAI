// GET /api/export/tasks/pdf/[id] — one-task PDF report.
//
// The report covers task metadata, status, priority, assignee, creator, due
// date, completion details + comment, evidence file names, comments, activity
// history and the generated date (see src/lib/pdf.ts). Attachment BLOB content
// is never included. Access control mirrors the task details page: employees
// may only export tasks assigned to them or created by them; 403 otherwise.

import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser } from '../../../../../lib/api-security';
import { canViewTask, getTaskDetail } from '../../../../../lib/taskDetails';
import { getTaskPdfData } from '../../../../../lib/pdfData';
import { buildTaskPdf } from '../../../../../lib/pdf';
import { parsePositiveId } from '../../../../../lib/validation';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const id = parsePositiveId(context.params.id);
  if (id == null) {
    return apiJsonError('Invalid task id.', 400);
  }

  // Access control first (mirrors /tasks/[id]): 404 missing, 403 forbidden.
  const detail = getTaskDetail(id);
  if (!detail) {
    return apiJsonError('Task not found.', 404);
  }
  if (!canViewTask({ id: user.id, role: user.role }, detail)) {
    return apiJsonError('Forbidden.', 403);
  }

  const data = getTaskPdfData(id);
  if (!data) {
    return apiJsonError('Task not found.', 404);
  }

  const buffer = buildTaskPdf(data);
  const filename = `task-${id}.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
