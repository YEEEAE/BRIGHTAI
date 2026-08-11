// Canonical SLA and due-date calculations.
// This module is pure and safe for server pages and client islands.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today's local date as YYYY-MM-DD, matching the task due_date contract. */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Active tasks with a due date before today are overdue. */
export function isOverdue(
  dueDate: string | null | undefined,
  status: string,
  today = localDateStr(),
): boolean {
  if (!dueDate || !DATE_RE.test(dueDate)) return false;
  if (status === 'completed' || status === 'cancelled') return false;
  return dueDate < today;
}

/** A due date is soon when it falls today through the next three local days. */
export function isDueSoon(
  dueDate: string | null | undefined,
  status: string,
  today = localDateStr(),
): boolean {
  if (!dueDate || !DATE_RE.test(dueDate)) return false;
  if (status === 'completed' || status === 'cancelled') return false;
  return dueDate >= today && dueDate <= dueSoonEnd(today);
}

export function dueSoonEnd(today = localDateStr()): string {
  const end = new Date(`${today}T00:00:00`);
  end.setDate(end.getDate() + 3);
  return localDateStr(end);
}
