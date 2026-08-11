// Canonical SLA and due-date calculations.
// This module is pure and safe for server pages and client islands.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const SLA_STATUSES = ['NORMAL', 'AT_RISK', 'CRITICAL', 'BREACHED', 'PAUSED'] as const;
export type SlaStatus = (typeof SLA_STATUSES)[number];

export function parseServerTimestamp(value: string | Date): Date {
  if (value instanceof Date) return new Date(value.getTime());
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid server timestamp: ${value}`);
  return parsed;
}

export interface SlaSnapshotInput {
  startedAt: Date;
  dueAt: Date;
  elapsedSeconds: number;
  pausedAt: Date | null;
  pauseOnHold: boolean;
  taskStatus: string;
  now: Date;
  warningPercent?: number;
  criticalPercent?: number;
}

export interface SlaSnapshot {
  elapsedSeconds: number;
  remainingSeconds: number;
  percentUsed: number;
  status: SlaStatus;
}

/** Calculate an SLA snapshot using the server-provided clock, never the browser clock. */
export function calculateSlaSnapshot(input: SlaSnapshotInput): SlaSnapshot {
  const warning = input.warningPercent ?? 70;
  const critical = input.criticalPercent ?? 90;
  const duration = Math.max(1, Math.floor((input.dueAt.getTime() - input.startedAt.getTime()) / 1000));
  const checkpoint = Math.max(0, Math.floor(input.elapsedSeconds));
  const activeEnd = input.pauseOnHold && input.pausedAt ? input.pausedAt : input.now;
  const activeSeconds = Math.max(0, Math.floor((activeEnd.getTime() - input.startedAt.getTime()) / 1000));
  const elapsedSeconds = Math.max(checkpoint, activeSeconds);
  const remainingSeconds = duration - elapsedSeconds;
  const percentUsed = Math.round((elapsedSeconds / duration) * 10000) / 100;
  const status: SlaStatus =
    input.pauseOnHold && input.taskStatus === 'on_hold' && input.pausedAt
      ? 'PAUSED'
      : percentUsed >= 100 || remainingSeconds < 0
        ? 'BREACHED'
        : percentUsed >= critical
          ? 'CRITICAL'
          : percentUsed >= warning
            ? 'AT_RISK'
            : 'NORMAL';
  return { elapsedSeconds, remainingSeconds, percentUsed, status };
}

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
