// GET /api/export/tasks/pdf/[id] — one-task PDF report.
//
// The report covers task metadata, status, priority, assignee, creator, due
// date, completion details + comment, evidence file names, comments, activity
// history and the generated date (see src/lib/taskPdf.ts). Attachment BLOB content
// is never included. Access control mirrors the task details page: employees
// may only export tasks assigned to them or created by them. Inaccessible
// records use the same 404 response as missing records to avoid enumeration.

import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser } from '../../../../../lib/api-security';
import { canViewTask, getTaskDetail } from '../../../../../lib/taskDetails';
import { getTaskPdfData } from '../../../../../lib/pdfData';
import { buildTaskPdf } from '../../../../../lib/taskPdf';
import { Action, logActivity } from '../../../../../lib/activity';
import { parsePositiveId } from '../../../../../lib/validation';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const id = parsePositiveId(context.params.id);
  if (id == null) {
    return apiJsonError('Invalid task id.', 400);
  }

  // Access control first: inaccessible records are indistinguishable from
  // missing records so the export endpoint cannot be used as an oracle.
  const detail = getTaskDetail(id);
  if (!detail) {
    return apiJsonError('Task not found.', 404);
  }
  if (!canViewTask({ id: user.id, role: user.role }, detail)) {
    return apiJsonError('Task not found.', 404);
  }

  const data = getTaskPdfData(id);
  if (!data) {
    return apiJsonError('Task not found.', 404);
  }

  const buffer = await buildTaskPdf(data);
  const filename = `task-${id}.pdf`;

  // Only successful exports are audit events.
  logActivity({
    taskId: id,
    userId: user.id,
    action: Action.REPORT_EXPORTED,
    newValue: filename,
    note: 'PDF task report exported',
  });

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
