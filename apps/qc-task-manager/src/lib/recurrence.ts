// Recurring-task logic — pure, dependency-free, unit-testable.
//
// Business rules (from the shared task spec):
//   * A recurring task NEVER spawns future occurrences up front — the next
//     occurrence is created ONLY when the current one is completed
//     (see closeTask in taskUpdates.ts). This keeps the series finite and
//     on-demand instead of generating endless tasks.
//   * The next occurrence is created only when:
//       recurrence != 'none'  AND  due_date is set  AND
//       (recurrence_end_date IS NULL OR next due date <= recurrence_end_date)
//   * nextDueDate() advances by interval: daily +1 day, weekly +7 days,
//     monthly +1 month (day-of-month clamped to the target month's length,
//     e.g. Jan 31 → Feb 28).

import type { TaskRecurrence } from './types';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Add `months` to a YYYY-MM-DD string, clamping the day to the month length. */
function addMonths(dateStr: string, months: number): string | null {
  const m = DATE_RE.exec(dateStr);
  if (!m) return null;
  const [, y, mo, d] = m;
  const base = new Date(Date.UTC(Number(y), Number(mo) - 1 + months, 1));
  const daysInTargetMonth = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(Number(d), daysInTargetMonth);
  const out = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), day));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${out.getUTCFullYear()}-${pad(out.getUTCMonth() + 1)}-${pad(out.getUTCDate())}`;
}

/** Add `days` to a YYYY-MM-DD string. */
function addDays(dateStr: string, days: number): string | null {
  const m = DATE_RE.exec(dateStr);
  if (!m) return null;
  const [, y, mo, d] = m;
  const out = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d) + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${out.getUTCFullYear()}-${pad(out.getUTCMonth() + 1)}-${pad(out.getUTCDate())}`;
}

/**
 * Compute the next occurrence's due date for a recurrence interval.
 * Returns null when there is nothing to schedule (recurrence 'none' or a
 * missing/invalid due date).
 */
export function nextDueDate(
  recurrence: TaskRecurrence | string,
  dueDate: string | null | undefined,
): string | null {
  if (recurrence === 'none' || !dueDate) return null;
  switch (recurrence) {
    case 'daily':
      return addDays(dueDate, 1);
    case 'weekly':
      return addDays(dueDate, 7);
    case 'monthly':
      return addMonths(dueDate, 1);
    default:
      return null;
  }
}

/**
 * Should the next occurrence be created after this task completes?
 *   recurrence != 'none' AND a due date exists AND the next due date is
 *   within the series window (end date NULL = open-ended, but creation is
 *   still only ever triggered by a completion).
 */
export function shouldCreateNextOccurrence(params: {
  recurrence: TaskRecurrence | string;
  dueDate: string | null | undefined;
  recurrenceEndDate: string | null | undefined;
}): boolean {
  const next = nextDueDate(params.recurrence, params.dueDate);
  if (!next) return false;
  if (!params.recurrenceEndDate) return true;
  // ISO date strings compare lexicographically.
  return next <= params.recurrenceEndDate;
}
