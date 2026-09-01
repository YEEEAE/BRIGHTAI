// Search-result exports — CSV (dependency-free, same shape as export.ts) and
// XLSX (exceljs). ONE row mapping feeds BOTH formats so the two files always
// agree column-for-column.
//
// Security rule from the spec: attachment BLOB content is NEVER exported.
// The "Evidence files" column carries only file NAMES (joined with "; ");
// file_data is never selected by the search query (see taskSearch.ts).

import { csvField } from './export';
import type { SearchTaskRow } from './taskSearch';

interface ExportColumn {
  header: string;
  key: keyof ExportCellMap;
  width: number;
}

/** Cell values are pre-formatted strings/numbers — the writers never coerce. */
type ExportCellMap = Record<string, string | number>;

const SEARCH_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 8 },
  { header: 'Title', key: 'title', width: 40 },
  { header: 'Description', key: 'description', width: 50 },
  { header: 'Status', key: 'status', width: 14 },
  { header: 'Priority', key: 'priority', width: 10 },
  { header: 'Progress (%)', key: 'progress', width: 12 },
  { header: 'Department', key: 'department', width: 14 },
  { header: 'Assignee', key: 'assignee', width: 20 },
  { header: 'Created by', key: 'creator', width: 20 },
  { header: 'Due date', key: 'due_date', width: 14 },
  { header: 'Created at', key: 'created_at', width: 22 },
  { header: 'Completed at', key: 'completed_at', width: 22 },
  { header: 'Blocker note', key: 'blocker_note', width: 40 },
  { header: 'Recurrence', key: 'recurrence', width: 12 },
  { header: 'Evidence files', key: 'evidence_files', width: 40 },
  { header: 'Evidence skipped', key: 'evidence_skipped', width: 14 },
  { header: 'Comments', key: 'comments_count', width: 10 },
  { header: 'Deletion requested', key: 'deletion_requested', width: 16 },
];

/** Map a search row onto the export cells (single source for CSV + XLSX). */
function searchRowToCells(row: SearchTaskRow): ExportCellMap {
  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? '',
    status: row.status ?? '',
    priority: row.priority ?? '',
    progress: row.progress_percent,
    department: row.department ?? '',
    assignee: row.assignee ?? '',
    creator: row.creator ?? '',
    due_date: row.due_date ?? '',
    created_at: row.created_at ?? '',
    completed_at: row.completed_at ?? '',
    blocker_note: row.blocker_note ?? '',
    recurrence: row.recurrence ?? '',
    evidence_files: row.evidence_files ?? '',
    evidence_skipped: Number(row.evidence_skipped) === 1 ? 'Yes' : 'No',
    comments_count: row.comments_count,
    deletion_requested: Number(row.delete_pending) === 1 ? 'Yes' : 'No',
  };
}

const SEARCH_HEADERS = SEARCH_EXPORT_COLUMNS.map((c) => c.header);

/** Render search rows to CSV (UTF-8 BOM + CRLF, RFC-4180-ish escaping). */
export function searchRowsToCsv(rows: SearchTaskRow[]): string {
  const lines = [SEARCH_HEADERS.map(csvField).join(',')];
  for (const row of rows) {
    const cells = searchRowToCells(row);
    lines.push(SEARCH_EXPORT_COLUMNS.map((c) => csvField(cells[c.key])).join(','));
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

/**
 * Render search rows to an XLSX workbook buffer (exceljs). One worksheet,
 * bold header row, sensible column widths. Returns the raw xlsx Buffer ready
 * for an attachment response.
 */
export async function searchRowsToXlsx(rows: SearchTaskRow[]): Promise<Buffer> {
  // exceljs is CJS: under Node's ESM interop the real exports live on
  // `.default` of the dynamic-import namespace (`.default ?? mod` covers both
  // Node and bundler-shaped namespaces).
  const mod = await import('exceljs');
  const ExcelJS = (mod as { default?: typeof import('exceljs') }).default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QC Task Manager';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Tasks');
  sheet.columns = SEARCH_EXPORT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  for (const row of rows) {
    sheet.addRow(searchRowToCells(row));
  }

  // Header styling + freeze so long exports stay navigable.
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.height = 20;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
