// GET /api/lab/tests/export.xlsx — download the FILTERED laboratory test
// register as an Excel workbook.
//
// Same contract as export.csv: shares the query params and RBAC scope, single
// row mapping feeds both formats. Export is supervisor+ (canExportLabData).

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, apiJsonError } from '../../../../lib/api-security';
import { parseLabTestSearchFilters, searchLabTestRows } from '../../../../lib/lab/testSearch';
import { labTestRowsToXlsx } from '../../../../lib/lab/testExport';
import { canExportLabData } from '../../../../lib/permissions';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  if (!canExportLabData(user.role)) {
    return apiJsonError('Not authorized to export lab data.', 403);
  }

  const filters = parseLabTestSearchFilters(context.url, context);
  const rows = await searchLabTestRows(filters, { role: user.role, userId: user.id });
  const buffer = await labTestRowsToXlsx(rows);

  const date = new Date().toISOString().slice(0, 10);
  const filename = `qc-lab-tests-${date}.xlsx`;
  const encoded = encodeURIComponent(filename);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'no-store',
    },
  });
};