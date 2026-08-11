// GET /api/export/tasks.csv — download the task list as CSV.
//
// Auth: any authenticated role may export, but rows are role-scoped:
//   - employee     → tasks assigned to them or created by them
//   - supervisor+  → every task
// The middleware already walls /api/* behind a session; this endpoint
// re-checks the session (defense in depth) and returns an attachment.

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser } from '../../../lib/api-security';
import { exportTasksForRole } from '../../../lib/export';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const csv = await exportTasksForRole(user.role, user.id);
  const date = new Date().toISOString().slice(0, 10);
  const encoded = encodeURIComponent(`qc-tasks-${date}.csv`);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      // RFC 5987 filename* for the real name + ASCII fallback.
      'Content-Disposition': `attachment; filename="qc-tasks-${date}.csv"; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'no-store',
    },
  });
};
