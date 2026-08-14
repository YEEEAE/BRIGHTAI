// GET /api/lab/tests/export.csv — download the FILTERED laboratory test
// register as CSV.
//
// Accepts the exact same query params as /lab/tests (q, type, status, result,
// tester, equipment, product, lot, created/from/to) and exports EVERY matching
// row (no pagination, capped at LAB_TEST_EXPORT_MAX_ROWS). RBAC: employees
// only get their own tests; export itself is supervisor+ (canExportLabData).

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser } from '../../../../lib/api-security';
import { parseLabTestSearchFilters, searchLabTestRows } from '../../../../lib/lab/testSearch';
import { labTestRowsToCsv } from '../../../../lib/lab/testExport';
import { canExportLabData } from '../../../../lib/permissions';
import { apiJsonError } from '../../../../lib/api-security';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  if (!canExportLabData(user.role)) {
    return apiJsonError('Not authorized to export lab data.', 403);
  }

  const filters = parseLabTestSearchFilters(context.url, context);
  const rows = await searchLabTestRows(filters, { role: user.role, userId: user.id });
  const csv = labTestRowsToCsv(rows);

  const date = new Date().toISOString().slice(0, 10);
  const filename = `qc-lab-tests-${date}.csv`;
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