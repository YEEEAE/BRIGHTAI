// GET /api/export/search.csv — download the FILTERED search results as CSV.
//
// Accepts the exact same query params as /search (q, status, priority,
// department, assigned, creator, date ranges, overdue, has_evidence,
// evidence_skipped, recurrence, deletion) and exports EVERY matching row (no
// pagination, capped at EXPORT_MAX_ROWS). Role scoping applies: employees only
// get their own tasks. Attachment BLOB content is never included — the
// "Evidence files" column carries file names only.

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser } from '../../../lib/api-security';
import { parseTaskSearchFilters, searchTaskRows } from '../../../lib/taskSearch';
import { searchRowsToCsv } from '../../../lib/searchExport';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const filters = parseTaskSearchFilters(context.url, context);
  const rows = await searchTaskRows(filters, { role: user.role, userId: user.id });
  const csv = searchRowsToCsv(rows);

  const date = new Date().toISOString().slice(0, 10);
  const filename = `qc-task-search-${date}.csv`;
  const encoded = encodeURIComponent(filename);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'no-store',
    },
  });
};
