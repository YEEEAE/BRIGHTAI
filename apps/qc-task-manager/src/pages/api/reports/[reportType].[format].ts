import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, apiJsonError } from '../../../lib/api-security';
import { resolveReportContext } from '../../../lib/reporting/preview';
import { startReportAudit, completeReportAudit, failReportAudit } from '../../../lib/reporting/audit';
import { REPORT_CATALOG } from '../../../lib/reporting/catalog';
import { parseReportFilters, parseReportScope } from '../../../lib/reporting/filters';
import { readReportRows } from '../../../lib/reporting/reader';
import { rowsToPdfStreaming } from '../../../lib/reporting/writers/pdf';
import { csvCell } from '../../../lib/reporting/writers/csv';
import { writeRowsToXlsx } from '../../../lib/reporting/writers/xlsx';
import type { ReportFormat, ReportType } from '../../../lib/reporting/types';
import { createReadStream, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';

const formats: readonly ReportFormat[] = ['csv', 'xlsx', 'pdf'];

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const reportType = context.params.reportType as ReportType;
  const format = context.params.format as ReportFormat;
  if (!REPORT_CATALOG[reportType] || !formats.includes(format)) return apiJsonError('Unknown report or format.', 404);

  let filters;
  try {
    filters = parseReportFilters(context.url.searchParams);
  } catch (error) {
    return apiJsonError(error instanceof Error ? error.message : 'Invalid report filters.', 400);
  }
  let comprehensive;
  try {
    comprehensive = parseReportScope(context.url.searchParams);
  } catch (error) {
    return apiJsonError(error instanceof Error ? error.message : 'Invalid report scope.', 400);
  }
  const reportContext = resolveReportContext({ actor: { id: auth.id, role: auth.role, department: auth.department }, reportType, filters, comprehensive });
  if ('allowed' in reportContext) return apiJsonError(reportContext.reason, 403);
  const scope = reportContext.scope;
  const audit = startReportAudit({ reportType, generatedBy: auth.id, filters, format, dataScope: scope });
  const headers = REPORT_CATALOG[reportType].headers;

  if (format === 'csv') {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        let rows = 0;
        try {
          controller.enqueue(encoder.encode(`\uFEFF${headers.map(csvCell).join(',')}\r\n`));
          for await (const row of readReportRows(reportType, filters, scope, audit.reportId)) {
            controller.enqueue(encoder.encode(`${row.map(csvCell).join(',')}\r\n`));
            rows += 1;
          }
          completeReportAudit(audit.reportId, rows);
          controller.close();
        } catch (error) {
          failReportAudit(audit.reportId, error instanceof Error ? error.message : 'Report generation failed.');
          controller.error(error);
        }
      },
    });
    return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${reportType}.csv"`, 'Cache-Control': 'no-store' } });
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'brightai-report-'));
  let cleanupAfterReturn = true;
  try {
    if (format === 'xlsx') {
      const file = join(tempDir, `${reportType}.xlsx`);
      let rowCount = 0;
      const countedRows = (async function* () {
        for await (const row of readReportRows(reportType, filters, scope, audit.reportId)) {
          rowCount += 1;
          yield row;
        }
      })();
      await writeRowsToXlsx(file, headers, countedRows);
      completeReportAudit(audit.reportId, rowCount);
      const fileStream = createReadStream(file);
      fileStream.on('close', () => rmSync(tempDir, { recursive: true, force: true }));
      cleanupAfterReturn = false;
      const stream = Readable.toWeb(fileStream);
      const response = new Response(stream as unknown as BodyInit, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${reportType}.xlsx"`, 'Cache-Control': 'no-store' } });
      response.headers.set('X-Report-Id', audit.reportId);
      return response;
    }
    let rowCount = 0;
    const countedRows = (async function* () {
      for await (const row of readReportRows(reportType, filters, scope, audit.reportId)) {
        rowCount += 1;
        yield row;
      }
    })();
    const pdf = await rowsToPdfStreaming(headers, countedRows);
    completeReportAudit(audit.reportId, rowCount);
    return new Response(new Uint8Array(pdf), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${reportType}.pdf"`, 'Cache-Control': 'no-store', 'X-Report-Id': audit.reportId } });
  } catch (error) {
    failReportAudit(audit.reportId, error instanceof Error ? error.message : 'Report generation failed.');
    return apiJsonError('Report generation failed.', 500);
  } finally {
    if (cleanupAfterReturn) rmSync(tempDir, { recursive: true, force: true });
  }
};
