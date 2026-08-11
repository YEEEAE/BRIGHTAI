// GET /api/export/tasks/pdf/[id] — one-task PDF report.
//
// The report covers task metadata, status, priority, assignee, creator, due
// date, completion details + comment, evidence file names, comments, activity
// history and the generated date (see src/lib/pdf.ts). Attachment BLOB content
// is never included. Access control mirrors the task details page: employees
// may only export tasks assigned to them or created by them; 403 otherwise.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../../../lib/session';
import { canViewTask, getTaskDetail } from '../../../../../lib/taskDetails';
import { getTaskPdfData } from '../../../../../lib/pdfData';
import { buildTaskPdf } from '../../../../../lib/pdf';

export const GET: APIRoute = async (context) => {
  const user = getCurrentUser(context);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid task id.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Access control first (mirrors /tasks/[id]): 404 missing, 403 forbidden.
  const detail = getTaskDetail(id);
  if (!detail) {
    return new Response(JSON.stringify({ ok: false, error: 'Task not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!canViewTask({ id: user.id, role: user.role }, detail)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = getTaskPdfData(id);
  if (!data) {
    return new Response(JSON.stringify({ ok: false, error: 'Task not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
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
