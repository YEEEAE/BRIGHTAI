// QC Laboratory Test Register export (PROMPT 06) — CSV + XLSX.
//
// ONE row mapping feeds BOTH formats so the two files always agree
// column-for-column (same pattern as src/lib/searchExport.ts). Rows come from
// searchLabTestRows (RBAC-scoped, filtered, capped at LAB_TEST_EXPORT_MAX_ROWS).
// No document/attachment content is exported — this is the register metadata.

import { csvField } from '../export';
import { LAB_TEST_STATUS_LABELS } from './testSearch';
import { LAB_RESULT_LABELS } from './policy';
import type { LabTestSearchRow } from './testSearch';

export interface LabTestExportColumn {
  header: string;
  key: keyof LabTestExportCellMap;
  width: number;
}

/** Cell values are pre-formatted strings/numbers — the writers never coerce. */
export type LabTestExportCellMap = Record<string, string | number>;

export const LAB_TEST_EXPORT_COLUMNS: LabTestExportColumn[] = [
  { header: 'Test ID', key: 'test_number', width: 16 },
  { header: 'Type', key: 'test_type', width: 12 },
  { header: 'Product', key: 'product_name', width: 32 },
  { header: 'Product Code', key: 'product_code', width: 16 },
  { header: 'Lot', key: 'lot_number', width: 14 },
  { header: 'Sampling Area', key: 'sampling_area', width: 20 },
  { header: 'Equipment', key: 'equipment_name', width: 28 },
  { header: 'Equipment Code', key: 'equipment_code', width: 16 },
  { header: 'Tester', key: 'tester_name', width: 22 },
  { header: 'Result', key: 'final_result', width: 10 },
  { header: 'Workflow Status', key: 'status', width: 16 },
  { header: 'Created at', key: 'created_at', width: 22 },
  { header: 'Updated at', key: 'updated_at', width: 22 },
];

/** Map a register row onto the export cells (single source for CSV + XLSX). */
export function labTestRowToCells(row: LabTestSearchRow): LabTestExportCellMap {
  const status = row.status as keyof typeof LAB_TEST_STATUS_LABELS;
  const result = row.final_result as keyof typeof LAB_RESULT_LABELS | null;
  return {
    test_number: row.test_number,
    test_type: row.test_type ? row.test_type.toUpperCase() : '',
    product_name: row.product_name ?? '',
    product_code: row.product_code ?? '',
    lot_number: row.lot_number ?? '',
    sampling_area: row.sampling_area ?? '',
    equipment_name: row.equipment_name ?? '',
    equipment_code: row.equipment_code ?? '',
    tester_name: row.tester_name ?? '',
    final_result: result ? (LAB_RESULT_LABELS[result] ?? row.final_result) : '',
    status: LAB_TEST_STATUS_LABELS[status] ?? row.status,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  };
}

const LAB_TEST_HEADERS = LAB_TEST_EXPORT_COLUMNS.map((c) => c.header);

/** Render register rows to CSV (UTF-8 BOM + CRLF, RFC-4180-ish escaping). */
export function labTestRowsToCsv(rows: LabTestSearchRow[]): string {
  const lines = [LAB_TEST_HEADERS.map(csvField).join(',')];
  for (const row of rows) {
    const cells = labTestRowToCells(row);
    lines.push(LAB_TEST_EXPORT_COLUMNS.map((c) => csvField(cells[c.key])).join(','));
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

/**
 * Render register rows to an XLSX workbook buffer (exceljs). One worksheet,
 * bold header row, sensible column widths. Returns the raw xlsx Buffer ready
 * for an attachment response.
 */
export async function labTestRowsToXlsx(rows: LabTestSearchRow[]): Promise<Buffer> {
  // exceljs is CJS: under Node's ESM interop the real exports live on
  // `.default` of the dynamic-import namespace (`.default ?? mod` covers both
  // Node and bundler-shaped namespaces).
  const mod = await import('exceljs');
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QC Task Manager';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Lab Tests');
  sheet.columns = LAB_TEST_EXPORT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  for (const row of rows) {
    sheet.addRow(labTestRowToCells(row));
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.height = 20;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}