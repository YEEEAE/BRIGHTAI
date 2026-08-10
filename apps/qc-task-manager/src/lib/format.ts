// Pure formatting helpers for QC Task Manager.
//
// These are intentionally dependency-free so they can be imported from Astro
// pages (server) AND React islands (client). No server-only imports here.
//
// SQLite timestamps are UTC strings in the shape "YYYY-MM-DD HH:MM:SS"
// (schema default datetime('now')). All parsing treats them as UTC so display
// time is consistent everywhere in the app.

const DT_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS") into a Date. Null-safe. */
export function parseDbDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = DT_RE.exec(value) ?? DATE_RE.exec(value);
  if (!m) return null;
  const [, y, mo, d, h = 0, mi = 0, s = 0] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
}

const DATE_FMT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};
const DATETIME_FMT: Intl.DateTimeFormatOptions = {
  ...DATE_FMT,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

/** "2026-08-11 09:30:00" → "11 Aug 2026, 09:30" (local time). */
export function formatDbDate(value: string | null | undefined): string {
  const d = parseDbDate(value);
  if (!d) return '—';
  return d.toLocaleString('en-GB', DATETIME_FMT);
}

/** "2026-08-11" → "11 Aug 2026". Falls back to the raw string if unparseable. */
export function formatDueDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = parseDbDate(value);
  if (!d) return value;
  return d.toLocaleString('en-GB', DATE_FMT);
}

/** Byte count → human readable (e.g. 1536 → "1.5 KB"). */
export function humanFileSize(bytes: number | null | undefined): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
};

/** Human label for a task status code. Unknown codes fall back to the raw value. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/** Human label for a task priority code. */
export function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority;
}
