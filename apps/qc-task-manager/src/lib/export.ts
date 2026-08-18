// CSV export of tasks (GET /api/export/tasks.csv).
//
// `tasksToCsv` is a pure function over already-shaped rows — no DB import — so
// it can be unit-tested without a server. `exportTasksForRole` pulls the rows
// from SQLite (via a dynamic import so this module stays loadable in
// server-less tests) and scopes them to the requesting role:
//   - employee     → tasks assigned to them or created by them
//   - supervisor+  → every task

import { sanitizeCsvFormula } from './reporting/writers/csv';
import type { Role } from './types';

export interface ExportTaskRow {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  progress_percent: number;
  assignee: string | null;
  created_by_name: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  blocker_note: string | null;
}

const HEADERS = [
  'ID',
  'Title',
  'Description',
  'Status',
  'Priority',
  'Progress (%)',
  'Assignee',
  'Created by',
  'Due date',
  'Created at',
  'Completed at',
  'Blocker note',
] as const;

/**
 * RFC-4180-ish escaping: fields containing a quote, comma, CR or LF are wrapped
 * in double quotes and embedded quotes are doubled. Null/empty → empty cell.
 * Cells starting with a formula marker (=, +, -, @, tab, CR) are neutralized
 * against spreadsheet formula injection (OWASP) before escaping.
 */
export function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = sanitizeCsvFormula(String(value));
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Render rows to CSV with a UTF-8 BOM (Excel-friendly) and CRLF line endings. */
export function tasksToCsv(rows: ExportTaskRow[]): string {
  const lines = [HEADERS.map(csvField).join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.title,
        r.description,
        r.status,
        r.priority,
        r.progress_percent,
        r.assignee,
        r.created_by_name,
        r.due_date,
        r.created_at,
        r.completed_at,
        r.blocker_note,
      ]
        .map(csvField)
        .join(','),
    );
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

/**
 * Load the role-scoped task rows and render the CSV. The SQLite import is
 * deferred (dynamic) so the pure CSV helpers above stay importable in the
 * Node test runner without a database.
 */
export async function exportTasksForRole(role: Role, userId: number): Promise<string> {
  const { getDb } = await import('./db');
  const db = getDb();

  const scopeClause =
    role === 'employee' ? 'WHERE (t.assigned_to = ? OR t.created_by = ?)' : '';
  const scopeParams = role === 'employee' ? [userId, userId] : [];

  const rows = db
    .prepare(
      `SELECT t.id, t.title, t.description, t.status, t.priority, t.progress_percent,
              t.due_date, t.created_at, t.completed_at, t.blocker_note,
              a.full_name AS assignee, c.full_name AS created_by_name
       FROM tasks t
       LEFT JOIN users a ON a.id = t.assigned_to
       LEFT JOIN users c ON c.id = t.created_by
       ${scopeClause}
       ORDER BY t.id ASC`,
    )
    .all(...scopeParams) as ExportTaskRow[];

  return tasksToCsv(rows);
}
