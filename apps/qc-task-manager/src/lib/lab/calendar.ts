// QC Laboratory calendar (PROMPT 25).
//
// Contract §5.2 pins /lab/calendar to LAB_VIEW with "Events derived from
// calibration/maintenance/document-review/acknowledgement dates; click-through
// to source records", and §14 (decision from QC-LAB-DB-FOUNDATION-001) forbids
// a lab_calendar_items table until a genuinely normalized entity is proven.
// Every event here is therefore DERIVED AT READ TIME from a real date already
// stored by another lab module — the calendar never invents, synthesizes, or
// defaults a date:
//
//   * equipment calibration  — lab_equipment_calibration latest-record
//                              COALESCE(next_due_at, calibration_due_at), the
//                              exact same derivation as overview.ts / calibration.ts
//   * equipment maintenance  — lab_equipment_maintenance.maintenance_date
//                              (scheduled) or completed_date (done)
//   * SOP / WI review        — lab_documents.review_due_date for live
//                              (non-SUPERSEDED/ARCHIVED) documents
//   * document acknowledgement — the parent document's review_due_date as the
//                              deadline for still-PENDING acknowledgements (the
//                              schema stores no per-ack deadline column, so the
//                              document's real review date is the only true date)
//   * tests / retests        — real lifecycle dates (created / submitted /
//                              approved, retest created)
//
// Employee scope mirrors the task-list rule (lab/testSearch.ts scopeClause):
// acknowledgement events are restricted to the employee's own assignments,
// test events to t.tested_by = me OR created_by = me. Everything else is
// shared operational data under the page-level LAB_VIEW guard (the middleware
// enforces it for /lab/calendar).

import { getDb } from '../db';
import { LAB_TEST_ROW_SCOPE_SQL, rowScopeParams } from '../scope';
import { localToday } from '../dashboard';
import { LAB_MAINTENANCE_STATUS_LABELS } from './policy';

/** Days ahead the month grid renders, mirroring the document-review buckets (30/15/7). */
export const LAB_CALENDAR_LOOKAHEAD_DAYS = 30;

/**
 * The date columns whose events land on the calendar (PROMPT 25). Test
 * lifecycle dates are intentionally excluded here — test events surface under
 * their own lifecycle-date labels, never under an operational-deadline type.
 */
export type LabCalendarDeadlineType =
  | 'calibration'
  | 'maintenance'
  | 'sop_review'
  | 'wi_review'
  | 'acknowledgement';

/** Every calendar event kind, including test/retest lifecycle events. */
export type LabCalendarEventType =
  | LabCalendarDeadlineType
  | 'test_created'
  | 'test_submitted'
  | 'test_approved'
  | 'retest_created';

export const LAB_CALENDAR_TYPE_LABELS: Record<LabCalendarEventType, string> = {
  calibration: 'Calibration due',
  maintenance: 'Maintenance',
  sop_review: 'SOP review due',
  wi_review: 'WI review due',
  acknowledgement: 'Acknowledgement due',
  test_created: 'Test created',
  test_submitted: 'Test submitted',
  test_approved: 'Test approved',
  retest_created: 'Retest created',
};

/**
 * Types that count as an operational deadline (an obligation with a real due
 * date in the data). Used for the upcoming-window counts; lifecycle events are
 * informational and never imply an obligation.
 */
export const LAB_CALENDAR_DEADLINE_TYPES: readonly LabCalendarDeadlineType[] = [
  'calibration',
  'maintenance',
  'sop_review',
  'wi_review',
  'acknowledgement',
];

export interface LabCalendarEvent {
  id: string;
  type: LabCalendarEventType;
  date: string; // YYYY-MM-DD — always a real stored date
  label: string;
  detail: string;
  href: string; // click-through to the source record (page reference §54)
}

export interface LabCalendarDay {
  iso: string; // YYYY-MM-DD (local)
  inMonth: boolean; // belongs to the displayed month (grid padding otherwise)
  isToday: boolean;
  events: LabCalendarEvent[];
}

export interface LabCalendarMonth {
  year: number;
  month: number; // 1-12
  label: string; // "August 2026"
  prev: string; // "/lab/calendar?month=YYYY-MM"
  next: string;
  days: LabCalendarDay[]; // 42 cells (6 rows) — padding days included
}

/**
 * Parse a `?month=YYYY-MM` parameter (or fall back to today's month). The
 * month grid is built on ISO keys, so timezone cannot skew the layout.
 */
export function resolveCalendarMonth(raw: string | null, today: string): { year: number; month: number } {
  const fallback = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  if (!raw) return fallback;
  const m = /^(\d{4})-(\d{2})$/.exec(raw.trim());
  if (!m) return fallback;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return fallback;
  return { year, month };
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Add `days` to an ISO date using Date.UTC (no local-time drift). */
export function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** "YYYY-MM" label for a month, used in the prev/next links. */
export function monthParam(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

/** Build the 6-row (42-cell) grid for a month: Monday-first, padded with adjacent-month days. */
export function buildCalendarMonth(year: number, month: number, today: string): LabCalendarMonth {
  const firstIso = `${year}-${pad2(month)}-01`;
  const dow = new Date(`${firstIso}T00:00:00Z`).getUTCDay(); // 0=Sunday
  const lead = (dow + 6) % 7; // Monday-first padding
  const days: LabCalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const iso = shiftIsoDate(firstIso, i - lead);
    days.push({
      iso,
      inMonth: Number(iso.slice(5, 7)) === month && Number(iso.slice(0, 4)) === year,
      isToday: iso === today,
      events: [],
    });
  }
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return {
    year,
    month,
    label,
    prev: `/lab/calendar?month=${monthParam(prev.year, prev.month)}`,
    next: `/lab/calendar?month=${monthParam(next.year, next.month)}`,
    days,
  };
}

/** Assign events to their day cells (events outside the grid are dropped). */
export function placeEvents(month: LabCalendarMonth, events: LabCalendarEvent[]): void {
  const byDay = new Map(month.days.map((d) => [d.iso, d]));
  for (const ev of events) {
    byDay.get(ev.date)?.events.push(ev);
  }
  for (const day of month.days) {
    // Deterministic order: calibration → maintenance → reviews → acknowledgements
    // → test/retest lifecycle; stable within a type (insertion order).
    day.events.sort((a, b) => typeRank(a.type) - typeRank(b.type));
  }
}

const TYPE_RANK: readonly LabCalendarEventType[] = [
  'calibration',
  'maintenance',
  'sop_review',
  'wi_review',
  'acknowledgement',
  'test_created',
  'test_submitted',
  'test_approved',
  'retest_created',
];

function typeRank(type: LabCalendarEventType): number {
  return TYPE_RANK.indexOf(type);
}

// ── derived event queries (all dates are real stored values) ─────────────

const ACTIVE_DOCUMENT_STATUSES = `('DRAFT', 'IN_REVIEW', 'APPROVED')`;

/** Calibration due dates: latest-record COALESCE(next_due_at, calibration_due_at). */
function calibrationEvents(fromIso: string, toIso: string): LabCalendarEvent[] {
  return getDb()
    .prepare(
      `SELECT
         e.id AS equipment_id,
         e.name AS equipment_name,
         date(COALESCE(c.next_due_at, c.calibration_due_at)) AS due_date,
         c.certificate_reference
       FROM lab_equipment e
       JOIN lab_equipment_calibration c ON c.id = (
         SELECT c2.id FROM lab_equipment_calibration c2
         WHERE c2.equipment_id = e.id
         ORDER BY c2.created_at DESC, c2.id DESC
         LIMIT 1
       )
       WHERE COALESCE(e.is_archived, 0) = 0
         AND date(COALESCE(c.next_due_at, c.calibration_due_at)) IS NOT NULL
         AND date(COALESCE(c.next_due_at, c.calibration_due_at)) BETWEEN date(?) AND date(?)
       ORDER BY due_date, equipment_name`,
    )
    .all(fromIso, toIso)
    .map((r) => {
      const row = r as { equipment_id: number; equipment_name: string; due_date: string; certificate_reference: string | null };
      const detail = row.certificate_reference?.trim()
        ? `Certificate ${row.certificate_reference.trim()}`
        : 'Certificate on file';
      return {
        id: `calibration-${row.equipment_id}`,
        type: 'calibration',
        date: row.due_date,
        label: row.equipment_name,
        detail,
        href: `/lab/equipment/${row.equipment_id}`,
      };
    });
}

/** Maintenance: real maintenance_date (planned/in-progress) or completed_date (done). CANCELLED rows never surface. */
function maintenanceEvents(fromIso: string, toIso: string): LabCalendarEvent[] {
  return getDb()
    .prepare(
      `SELECT
         m.id AS maintenance_id,
         m.equipment_id,
         e.name AS equipment_name,
         m.issue,
         m.maintenance_type,
         m.status,
         m.maintenance_date,
         m.completed_date
       FROM lab_equipment_maintenance m
       JOIN lab_equipment e ON e.id = m.equipment_id
       WHERE COALESCE(e.is_archived, 0) = 0
         AND COALESCE(m.status, '') <> 'CANCELLED'
         AND (
           (m.maintenance_date IS NOT NULL AND date(m.maintenance_date) BETWEEN date(?) AND date(?))
           OR (m.completed_date IS NOT NULL AND date(m.completed_date) BETWEEN date(?) AND date(?))
         )
       ORDER BY COALESCE(m.maintenance_date, m.completed_date), e.name`,
    )
    .all(fromIso, toIso, fromIso, toIso)
    .map((r): LabCalendarEvent => {
      const row = r as {
        maintenance_id: number;
        equipment_id: number;
        equipment_name: string;
        issue: string | null;
        maintenance_type: string | null;
        status: string | null;
        maintenance_date: string | null;
        completed_date: string | null;
      };
      const scheduled = row.maintenance_date ? row.maintenance_date.slice(0, 10) : null;
      const completed = row.completed_date ? row.completed_date.slice(0, 10) : null;
      const done = row.status === 'COMPLETED';
      // A completed job lands on its real completed_date; anything still open
      // sits on its planned maintenance_date (falling back to completed_date
      // only when no planned date was recorded).
      const date = (done && completed) || scheduled || completed || '';
      const statusLabel = LAB_MAINTENANCE_STATUS_LABELS[(row.status ?? 'PLANNED') as keyof typeof LAB_MAINTENANCE_STATUS_LABELS]
        ?? (row.status ?? 'Planned');
      const issue = row.issue?.trim() ? ` — ${row.issue.trim()}` : '';
      return {
        id: `maintenance-${row.maintenance_id}`,
        type: 'maintenance',
        date,
        label: `${row.equipment_name}${issue}`,
        detail: `${row.maintenance_type ?? 'Maintenance'} (${statusLabel.toLowerCase()})`,
        href: `/lab/equipment/${row.equipment_id}`,
      };
    })
    .filter((ev) => ev.date !== '');
}

/** SOP/WI review deadlines: live documents with a real review_due_date. */
function documentReviewEvents(fromIso: string, toIso: string): LabCalendarEvent[] {
  return getDb()
    .prepare(
      `SELECT d.id, d.code, d.title, d.type, d.status, date(d.review_due_date) AS due_date
       FROM lab_documents d
       WHERE d.type IN ('SOP', 'WI')
         AND d.status IN ${ACTIVE_DOCUMENT_STATUSES}
         AND d.review_due_date IS NOT NULL
         AND date(d.review_due_date) BETWEEN date(?) AND date(?)
       ORDER BY due_date, d.code`,
    )
    .all(fromIso, toIso)
    .map((r) => {
      const row = r as { id: number; code: string; title: string; type: string; status: string; due_date: string };
      return {
        id: `doc-review-${row.id}`,
        type: row.type === 'SOP' ? 'sop_review' : 'wi_review',
        date: row.due_date,
        label: `${row.code} — ${row.title}`,
        detail: `${row.type} review due (${row.status.replace(/_/g, ' ').toLowerCase()})`,
        href: `/lab/documents/${row.id}/edit`,
      };
    }) as LabCalendarEvent[];
}

/**
 * Acknowledgement deadlines: still-PENDING acknowledgements of live documents,
 * anchored to the parent document's real review_due_date. The schema stores no
 * per-ack deadline column, so this is the only true date — nothing is invented.
 */
function acknowledgementEvents(fromIso: string, toIso: string, userId: number | null): LabCalendarEvent[] {
  const scope = userId === null ? '' : 'AND a.user_id = ?';
  const params = userId === null ? [fromIso, toIso] : [fromIso, toIso, userId];
  return getDb()
    .prepare(
      `SELECT
         d.id AS document_id,
         d.code,
         d.title,
         d.type,
         date(d.review_due_date) AS due_date,
         COUNT(a.id) AS pending_count
       FROM lab_document_acknowledgements a
       JOIN lab_document_versions v ON v.id = a.document_version_id
       JOIN lab_documents d ON d.id = v.document_id
       WHERE a.status = 'PENDING'
         AND d.type IN ('SOP', 'WI')
         AND d.status IN ${ACTIVE_DOCUMENT_STATUSES}
         AND d.review_due_date IS NOT NULL
         AND date(d.review_due_date) BETWEEN date(?) AND date(?)
         ${scope}
       GROUP BY d.id
       ORDER BY due_date, d.code`,
    )
    .all(...params)
    .map((r) => {
      const row = r as { document_id: number; code: string; title: string; type: string; due_date: string; pending_count: number };
      const who = userId === null ? `${row.pending_count} pending` : 'your acknowledgement pending';
      return {
        id: `ack-${row.document_id}`,
        type: 'acknowledgement',
        date: row.due_date,
        label: `${row.code} — ${row.title}`,
        detail: `${row.type} — ${who}`,
        href: `/lab/acknowledgements`,
      };
    });
}

/** Test lifecycle events (created / submitted / approved) — real dates only. */
function testEvents(
  fromIso: string,
  toIso: string,
  opts: { scopeToUser: boolean; userId: number },
): LabCalendarEvent[] {
  const scope = opts.scopeToUser ? `AND ${LAB_TEST_ROW_SCOPE_SQL}` : '';
  const scopeParams = opts.scopeToUser ? rowScopeParams(opts.userId) : [];
  const rows = getDb()
    .prepare(
      `SELECT
         t.id,
         t.test_number,
         t.test_type,
         t.status,
         date(t.created_at) AS created_date,
         date(t.submitted_at) AS submitted_date,
         date(t.approved_at) AS approved_date
       FROM lab_test_records t
       WHERE (
         (t.created_at IS NOT NULL AND date(t.created_at) BETWEEN date(?) AND date(?))
         OR (t.submitted_at IS NOT NULL AND date(t.submitted_at) BETWEEN date(?) AND date(?))
         OR (t.approved_at IS NOT NULL AND date(t.approved_at) BETWEEN date(?) AND date(?))
       ) ${scope}
       ORDER BY t.test_number`,
    )
    .all(fromIso, toIso, fromIso, toIso, fromIso, toIso, ...scopeParams);
  const events: LabCalendarEvent[] = [];
  for (const r of rows) {
    const row = r as {
      id: number;
      test_number: string;
      test_type: string;
      status: string;
      created_date: string | null;
      submitted_date: string | null;
      approved_date: string | null;
    };
    const label = `${row.test_number} (${row.test_type.toUpperCase()})`;
    const href = `/lab/tests/${row.id}`;
    if (row.created_date) {
      events.push({ id: `test-created-${row.id}`, type: 'test_created', date: row.created_date, label, detail: 'Test created', href });
    }
    if (row.submitted_date) {
      events.push({ id: `test-submitted-${row.id}`, type: 'test_submitted', date: row.submitted_date, label, detail: 'Submitted for review', href });
    }
    if (row.approved_date) {
      events.push({ id: `test-approved-${row.id}`, type: 'test_approved', date: row.approved_date, label, detail: 'Approved', href });
    }
  }
  return events;
}

/** Retest lifecycle events (created/updated) — real dates only. */
function retestEvents(fromIso: string, toIso: string): LabCalendarEvent[] {
  return getDb()
    .prepare(
      `SELECT
         r.id,
         r.retest_number,
         r.status,
         t.test_number AS original_test_number,
         date(r.created_at) AS created_date,
         date(r.updated_at) AS updated_date
       FROM lab_test_retests r
       LEFT JOIN lab_test_records t ON t.id = r.original_test_id
       WHERE (r.created_at IS NOT NULL AND date(r.created_at) BETWEEN date(?) AND date(?))
          OR (r.updated_at IS NOT NULL AND date(r.updated_at) BETWEEN date(?) AND date(?))
       ORDER BY r.retest_number`,
    )
    .all(fromIso, toIso, fromIso, toIso)
    .flatMap((r) => {
      const row = r as {
        id: number;
        retest_number: string;
        status: string;
        original_test_number: string | null;
        created_date: string | null;
        updated_date: string | null;
      };
      const label = row.original_test_number
        ? `${row.retest_number} (${row.original_test_number})`
        : row.retest_number;
      const href = `/lab/retests/${row.id}`;
      const events: LabCalendarEvent[] = [];
      if (row.created_date) {
        events.push({
          id: `retest-created-${row.id}`,
          type: 'retest_created',
          date: row.created_date,
          label,
          detail: `Retest created (${row.status.toLowerCase()})`,
          href,
        });
      }
      return events;
    });
}

// ── public API ────────────────────────────────────────────────────────────

export interface LabCalendarEventsInput {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
  role: string;
  userId: number;
}

/**
 * All real operational dates inside [from, to] for `role` (see the scoping
 * note at the top). Every returned event carries a stored date and a
 * click-through href to its source record — the calendar invents nothing.
 */
export function labCalendarEvents(input: LabCalendarEventsInput): LabCalendarEvent[] {
  const { from, to, role, userId } = input;
  const isEmployee = role === 'employee';
  const events: LabCalendarEvent[] = [
    ...calibrationEvents(from, to),
    ...maintenanceEvents(from, to),
    ...documentReviewEvents(from, to),
    ...acknowledgementEvents(from, to, isEmployee ? userId : null),
    ...testEvents(from, to, { scopeToUser: isEmployee, userId }),
    ...retestEvents(from, to),
  ];
  return events.sort((a, b) => a.date.localeCompare(b.date) || typeRank(a.type) - typeRank(b.type));
}

export interface LabCalendarData {
  month: LabCalendarMonth;
  events: LabCalendarEvent[];
  upcoming: LabCalendarEvent[]; // deadline-type events today..+30d, date order
  overdue: LabCalendarEvent[]; // deadline-type events before today (any past date)
  today: string; // YYYY-MM-DD local
}

/**
 * Page data for /lab/calendar: the month grid with events placed, plus the
 * upcoming/overdue deadline lists used by the summary panel.
 */
export function labCalendarData(opts: { monthParam?: string | null; role: string; userId: number }): LabCalendarData {
  const today = localToday();
  const { year, month } = resolveCalendarMonth(opts.monthParam ?? null, today);
  const monthGrid = buildCalendarMonth(year, month, today);
  const gridFrom = monthGrid.days[0].iso;
  const gridTo = monthGrid.days[monthGrid.days.length - 1].iso;

  const events = labCalendarEvents({ from: gridFrom, to: gridTo, role: opts.role, userId: opts.userId });
  placeEvents(monthGrid, events);

  // Window queries use the true deadlines regardless of which month is viewed.
  const windowTo = shiftIsoDate(today, LAB_CALENDAR_LOOKAHEAD_DAYS);
  const windowEvents = labCalendarEvents({ from: '0001-01-01', to: windowTo, role: opts.role, userId: opts.userId });
  const deadlines = windowEvents.filter((ev) => (LAB_CALENDAR_DEADLINE_TYPES as readonly string[]).includes(ev.type));

  return {
    month: monthGrid,
    events,
    upcoming: deadlines.filter((ev) => ev.date >= today),
    overdue: deadlines.filter((ev) => ev.date < today),
    today,
  };
}
