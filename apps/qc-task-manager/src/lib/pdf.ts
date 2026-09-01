// Task PDF report BUILDER for QC Task Manager.
//
// `buildTaskPdf` is a PURE function over an already-assembled data object (no
// DB import — see pdfData.ts for the SQLite side) so it can be unit-tested
// without a server.
//
// The PDF is a minimal, dependency-free document (single standard font,
// multi-page when the report is long) — the same approach the marketing site
// uses in certificate-verifier.ts. Non-ASCII characters (Arabic comments etc.)
// are rendered as '?' because embedding a Unicode font is out of scope; the
// on-screen task page remains the canonical rich view.

import { formatDbDate, formatDueDate } from './format';

// ─────────────────────────────── Data model ───────────────────────────────

export interface TaskPdfData {
  /** Task #id / title / description / department / progress %. */
  id: number;
  title: string;
  description: string | null;
  department: string;
  progress_percent: number;
  status_label: string;
  priority_label: string;
  recurrence_label: string;
  assignee: string | null;
  creator: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  started_at: string | null;
  /** Completion details (only when completed). */
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  completion_comment: string | null;
  /** Evidence file NAMES only — never BLOB content. */
  evidence_files: string[];
  evidence_skipped: boolean;
  cancelled: boolean;
  cancelled_at: string | null;
  cancelled_by: string | null;
  /** Regular comments (completion comment is excluded — it has its own block). */
  comments: { author: string; date: string; text: string }[];
  /** Activity history, newest last, already humanized. */
  activity: { user: string; date: string; text: string }[];
  /** When the PDF was generated (local date + time). */
  generated_at: string;
}

// ─────────────────────────────── PDF rendering ───────────────────────────────

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_LEFT = 40;
const TOP = 770;
const BOTTOM = 40;
const LINE_H = 13;
const MAX_LINES = Math.floor((TOP - BOTTOM) / LINE_H);

/** ASCII-safe, PDF-string-escaped line (non-Latin-1 chars become '?'). */
function pdfLine(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/** Flatten the report into wrapped text lines (multi-line fields split). */
function reportLines(data: TaskPdfData): string[] {
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);
  const pushBlock = (label: string, value: string | null | undefined) => {
    if (!value) return;
    const inner = String(value);
    push(`${label}: ${inner.split(/\r?\n/).join(' | ')}`);
  };

  push('QC TASK MANAGER - TASK REPORT');
  push(`Task #${data.id}: ${data.title}`);
  push('='.repeat(64));
  push('');
  pushBlock('Status', data.status_label);
  pushBlock('Priority', data.priority_label);
  pushBlock('Department', data.department);
  pushBlock('Progress', `${data.progress_percent}%`);
  pushBlock('Recurrence', data.recurrence_label);
  pushBlock('Assignee', data.assignee);
  pushBlock('Created by', data.creator);
  pushBlock('Due date', data.due_date ? formatDueDate(data.due_date) : null);
  pushBlock('Created at', data.created_at ? formatDbDate(data.created_at) : null);
  pushBlock('Updated at', data.updated_at ? formatDbDate(data.updated_at) : null);
  if (data.started_at) pushBlock('Started at', formatDbDate(data.started_at));

  if (data.completed) {
    push('');
    push('COMPLETION DETAILS');
    push('-'.repeat(64));
    pushBlock('Completed at', data.completed_at ? formatDbDate(data.completed_at) : null);
    pushBlock('Completed by', data.completed_by);
    pushBlock('Completion comment', data.completion_comment);
  }
  if (data.cancelled) {
    push('');
    push('CANCELLATION DETAILS');
    push('-'.repeat(64));
    pushBlock('Cancelled at', data.cancelled_at ? formatDbDate(data.cancelled_at) : null);
    pushBlock('Cancelled by', data.cancelled_by);
  }

  push('');
  push('EVIDENCE');
  push('-'.repeat(64));
  if (data.evidence_files.length > 0) {
    data.evidence_files.forEach((f) => push(`  - ${f}`));
  } else if (data.evidence_skipped) {
    push('  Evidence skipped.');
  } else {
    push('  No evidence recorded.');
  }

  push('');
  push(`COMMENTS (${data.comments.length})`);
  push('-'.repeat(64));
  if (data.comments.length === 0) {
    push('  No comments.');
  } else {
    for (const c of data.comments) {
      push(`  ${c.author} (${c.date}): ${c.text.split(/\r?\n/).join(' | ')}`);
    }
  }

  push('');
  push(`ACTIVITY HISTORY (${data.activity.length})`);
  push('-'.repeat(64));
  if (data.activity.length === 0) {
    push('  No activity recorded.');
  } else {
    for (const a of data.activity) {
      push(`  ${a.date} - ${a.user}: ${a.text}`);
    }
  }

  push('');
  push('='.repeat(64));
  push(`Generated: ${data.generated_at}`);
  return lines;
}

/**
 * Build the minimal PDF (A4, Courier, multi-page) from the report data.
 * Pure — takes the assembled object, returns a Buffer.
 */
export function buildTaskPdf(data: TaskPdfData): Buffer {
  const raw = reportLines(data);
  const pages: string[][] = [];
  for (let i = 0; i < raw.length; i += MAX_LINES) {
    pages.push(raw.slice(i, i + MAX_LINES));
  }
  if (pages.length === 0) pages.push(['No data.']);

  // Object layout: 1 catalog, 2 pages, 3 font, 4..3+n page objects,
  // then 4+n..3+2n content streams.
  const n = pages.length;
  const pageObjId = (i: number) => 4 + i;
  const streamObjId = (i: number) => 4 + n + i;

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObjId(i)} 0 R`).join(' ')}] /Count ${n} >>\nendobj\n`,
  );
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n');
  pages.forEach((_pageLines, i) => {
    objects.push(
      `${pageObjId(i)} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}]` +
        ` /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamObjId(i)} 0 R >>\nendobj\n`,
    );
  });
  pages.forEach((pageLines, i) => {
    const body = ['BT', '/F1 9 Tf', `${LINE_H} TL`, `${MARGIN_LEFT} ${TOP} Td`];
    pageLines.forEach((line, li) => {
      if (li > 0) body.push('T*');
      body.push(`(${pdfLine(line)}) Tj`);
    });
    body.push('ET');
    const stream = body.join('\n');
    objects.push(
      `${streamObjId(i)} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}
