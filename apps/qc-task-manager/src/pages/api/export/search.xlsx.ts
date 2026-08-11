// GET /api/export/search.xlsx — download the FILTERED search results as an
// Excel workbook (xlsx). Built with exceljs (the safe existing library added
// per product decision). Same query params + role scoping as the CSV export;
// same column set, so the two files always agree.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/session';
import { parseTaskSearchFilters, searchTaskRows } from '../../../lib/taskSearch';
import { searchRowsToXlsx } from '../../../lib/searchExport';

export const GET: APIRoute = async (context) => {
  const user = getCurrentUser(context);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const filters = parseTaskSearchFilters(context.url, context);
  const rows = await searchTaskRows(filters, { role: user.role, userId: user.id });
  const buffer = await searchRowsToXlsx(rows);

  const date = new Date().toISOString().slice(0, 10);
  const filename = `qc-task-search-${date}.xlsx`;
  const encoded = encodeURIComponent(filename);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'no-store',
    },
  });
};
