// In-app notifications for /notifications + the navbar bell dropdown.
//
// Two sources are merged into one list:
//   1. PERSISTED — rows in the `notifications` table, written whenever the app
//      must notify someone explicitly (assigned / reassigned, due date or
//      priority changed, comment added, blocker added, task completed,
//      deletion request submitted/approved/rejected, task reopened, next
//      recurring task created). These carry an is_read flag, can be marked
//      read one-by-one or all at once, and drive the bell badge + dropdown.
//   2. DERIVED — computed from existing data (overdue / due soon / stale), so
//      there is nothing to keep in sync and no write path.
// Each notification links to the relevant page and carries a severity so the
// UI can style it.
//
// Scope rules:
//   - employee     → notifications about tasks they are assigned to or created
//   - supervisor+  → the whole team's tasks (overdue / due soon / stale)
//   - Inactive users are never notified (createNotification guards is_active).

import { getDb } from './db';
import { logActivity, Action } from './activity';
import { dueSoonEnd, isDueSoon, isOverdue, localDateStr } from './sla';
import type { Role } from './types';

export type NotificationKind =
  | 'overdue'
  | 'due_soon'
  | 'unstarted'
  | 'assigned'
  | 'due_date_changed'
  | 'priority_changed'
  | 'recurring_created'
  | 'task_completed'
  | 'comment_added'
  | 'blocker_added'
  | 'delete_requested'
  | 'delete_approved'
  | 'delete_rejected'
  | 'task_reopened'
  | 'sla_escalation'
  | 'lab_document_review_due'
  | 'lab_test_review_started'
  | 'lab_test_rejected'
  | 'lab_test_changes_requested'
  | 'lab_test_approved'
  | 'lab_test_voided'
  | 'lab_document_acknowledgement'
  | 'lab_document_acknowledged'
  | 'lab_document_review_started'
  | 'lab_document_changes_requested'
  | 'lab_document_approved'
  | 'lab_document_archived'
  | 'lab_document_content_started'
  | 'lab_calibration_due'
  | 'lab_calibration_overdue'
  | 'lab_maintenance_event'
  | 'lab_retest_update'
  | 'lab_repeat_failures'
  | 'lab_change_review_requested'
  | 'lab_change_review_approved'
  | 'lab_change_review_rejected';

export type NotificationSeverity = 'danger' | 'warning' | 'info' | 'success';

export interface AppNotification {
  /** Stable unique key for list rendering. */
  key: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  message: string;
  href: string;
  /** Sortable timestamp (SQLite UTC string). */
  createdAt: string;
  /** Persisted rows only: the notifications.id (mark-one-as-read). */
  notificationId?: number;
  /** Persisted rows only: read state (undefined for derived rows). */
  isRead?: boolean;
}

const MAX_NOTIFICATIONS = 50;

// ─────────────────────────── Persisted notifications ───────────────────────

/**
 * Write an explicit in-app notification (assignments, due/priority changes,
 * comments, blockers, deletion requests, completions, reopens, recurring-task
 * creation). Insert failures are swallowed on purpose — a notification must
 * never break the task mutation that triggered it.
 *
 * When `actorId` is supplied AND the notification is task-scoped (taskId != null),
 * a `notification_created` entry is appended to the task activity log attributed
 * to the actor (spec: "notification_created" must be recorded). The recipient's
 * name is resolved for a human-readable message ("notified Sara: …").
 */
export function createNotification(params: {
  userId: number;
  taskId: number | null;
  type: NotificationKind;
  title: string;
  message: string;
  /** Who triggered the notification (logged as the actor). Omit to skip logging. */
  actorId?: number;
  /**
   * Real source-record link (e.g. /lab/tests/12, /lab/equipment/3). Persisted
   * into entity_href (migration 022) and preferred over the legacy task link
   * by every list reader. Lab events carry taskId null, so without this they
   * would all fall back to the notifications page.
   */
  href?: string;
}): boolean {
  try {
    // Spec: "do not notify inactive users" — enforced centrally so every call
    // site is covered (the single active-user query is cheap and indexed).
    const active = getDb()
      .prepare('SELECT 1 AS one FROM users WHERE id = ? AND is_active = 1')
      .get(params.userId);
    if (!active) return false;
    getDb()
      .prepare(
        `INSERT INTO notifications (user_id, task_id, type, title, message, entity_href)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        params.userId,
        params.taskId,
        params.type,
        params.title,
        params.message,
        params.href ?? null,
      );

    // Activity-log audit (spec): record that this actor notified this user. Only
    // task-scoped notifications are logged — global/bell-only ones have no task.
    if (params.actorId != null && params.taskId != null) {
      const recipient =
        (getDb().prepare('SELECT full_name FROM users WHERE id = ?').get(params.userId) as
          | { full_name: string }
          | undefined)?.full_name ?? `user #${params.userId}`;
      logActivity({
        taskId: params.taskId,
        userId: params.actorId,
        action: Action.NOTIFICATION_CREATED,
        newValue: `${recipient} · ${params.title}`,
      });
    }
    return true;
  } catch (err) {
    console.error('[notifications] failed to create notification:', err);
    return false;
  }
}

/** Severity used for persisted notifications (derived ones set their own). */
const PERSISTED_SEVERITY: Record<string, NotificationSeverity> = {
  assigned: 'info',
  due_date_changed: 'warning',
  priority_changed: 'warning',
  recurring_created: 'success',
  task_completed: 'success',
  comment_added: 'info',
  blocker_added: 'warning',
  delete_requested: 'warning',
  delete_approved: 'success',
  delete_rejected: 'danger',
  task_reopened: 'warning',
  sla_escalation: 'danger',
  lab_document_review_due: 'warning',
  lab_test_review_started: 'warning',
  lab_test_rejected: 'danger',
  lab_test_changes_requested: 'warning',
  lab_test_approved: 'success',
  lab_test_voided: 'danger',
  lab_document_acknowledgement: 'warning',
  lab_document_acknowledged: 'success',
  lab_document_review_started: 'warning',
  lab_document_changes_requested: 'warning',
  lab_document_approved: 'success',
  lab_document_archived: 'info',
  lab_document_content_started: 'info',
  lab_calibration_due: 'warning',
  lab_calibration_overdue: 'danger',
  lab_maintenance_event: 'warning',
  lab_retest_update: 'info',
  lab_repeat_failures: 'danger',
  lab_change_review_requested: 'info',
  lab_change_review_approved: 'success',
  lab_change_review_rejected: 'danger',
};

/** A raw persisted notification row (with read state) for the UI layers. */
export interface PersistedNotification {
  id: number;
  taskId: number | null;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  isRead: boolean;
}

/**
 * The signed-in user's persisted notifications (newest first) — the raw rows
 * with read state. Used by the navbar dropdown and the notifications page.
 * Link resolution prefers the real source-record link written by the producer
 * (entity_href, migration 022), then falls back to the task link, then to the
 * notifications page. Deleted tasks leave task_id NULL via ON DELETE SET NULL.
 */
export function listPersistedNotifications(userId: number, limit = 10): PersistedNotification[] {
  const rows = getDb()
    .prepare(
      `SELECT id, task_id, type, title, message, is_read, created_at, entity_href
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(userId, limit) as {
    id: number;
    task_id: number | null;
    type: string;
    title: string;
    message: string;
    is_read: number;
    created_at: string;
    entity_href: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    taskId: r.task_id,
    kind: (r.type in PERSISTED_SEVERITY ? r.type : 'assigned') as NotificationKind,
    severity: PERSISTED_SEVERITY[r.type] ?? 'info',
    title: r.title,
    message: r.message,
    href: r.entity_href ?? (r.task_id != null ? `/tasks/${r.task_id}` : '/notifications'),
    createdAt: r.created_at,
    isRead: Number(r.is_read) === 1,
  }));
}

/** Load the signed-in user's persisted notifications as list items. */
function persistedForUser(userId: number): AppNotification[] {
  return listPersistedNotifications(userId, MAX_NOTIFICATIONS).map((n) => ({
    key: `persisted-${n.id}`,
    kind: n.kind,
    severity: n.severity,
    title: n.title,
    message: n.message,
    href: n.href,
    createdAt: n.createdAt,
    notificationId: n.id,
    isRead: n.isRead,
  }));
}

/** Mark every persisted notification of a user as read (returns count). */
export function markAllNotificationsRead(userId: number): number {
  const info = getDb()
    .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
    .run(userId);
  return info.changes;
}

/** Mark a single persisted notification as read (true when it actually changed). */
export function markNotificationRead(userId: number, notificationId: number): boolean {
  const info = getDb()
    .prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND is_read = 0')
    .run(notificationId, userId);
  return info.changes === 1;
}

// ─────────────────────────── Lab notifications (/lab/notifications) ───────────────────────────

/**
 * Every laboratory notification kind (contract §11). Persisted rows written by
 * the lab modules with these types are the ONLY source of /lab/notifications —
 * it is a lab-filtered view over the SAME notifications table, never a second
 * system (contract §5.2). Older rows written before the kinds were registered
 * (e.g. the calibration/maintenance alerts cast to `never`) still match,
 * because `type` is free text and this list is matched against the stored
 * string.
 */
export const LAB_NOTIFICATION_KINDS: readonly NotificationKind[] = [
  'lab_test_review_started',
  'lab_test_rejected',
  'lab_test_changes_requested',
  'lab_test_approved',
  'lab_test_voided',
  'lab_document_review_due',
  'lab_document_acknowledgement',
  'lab_document_acknowledged',
  'lab_document_review_started',
  'lab_document_changes_requested',
  'lab_document_approved',
  'lab_document_archived',
  'lab_document_content_started',
  'lab_calibration_due',
  'lab_calibration_overdue',
  'lab_maintenance_event',
  'lab_retest_update',
  'lab_repeat_failures',
  'lab_change_review_requested',
  'lab_change_review_approved',
  'lab_change_review_rejected',
];

const LAB_KIND_SQL_LIST = LAB_NOTIFICATION_KINDS.map(() => '?').join(', ');

/**
 * Split a notification message into text / link parts for rendering.
 * Only the targeted pre-filled finding-form URLs written by the scheduled
 * job are linkified — ordinary messages (and any other text) pass through
 * untouched. Odd indices are links.
 */
export function splitMessageLinks(message: string): Array<{ text: string; href?: string }> {
  const parts = message.split(/(\/findings\S*?#new-finding)/g);
  return parts
    .filter((p) => p !== '')
    .map((text, i) => (i % 2 === 1 ? { text, href: text } : { text }));
}

/**
 * The signed-in user's LABORATORY notifications (newest first) with read
 * state, unread-first ordering and a total — the /lab/notifications page's
 * data source. `unreadOnly` hides already-read rows (the "Unread" filter).
 * Read state uses the same is_read column as the global bell: marking a lab
 * notification read here also clears it from the /notifications page and the
 * navbar badge (and vice-versa) — one row, one read state.
 */
export function listLabNotifications(
  userId: number,
  options: { unreadOnly?: boolean } = {},
): { notifications: PersistedNotification[]; unread: number; total: number } {
  const db = getDb();
  const kinds = [...LAB_NOTIFICATION_KINDS];

  const countRow = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread
       FROM notifications
       WHERE user_id = ? AND type IN (${LAB_KIND_SQL_LIST})`,
    )
    .get(userId, ...kinds) as { total: number; unread: number | null };

  const rows = db
    .prepare(
      `SELECT id, task_id, type, title, message, is_read, created_at, entity_href
       FROM notifications
       WHERE user_id = ? AND type IN (${LAB_KIND_SQL_LIST})${options.unreadOnly ? ' AND is_read = 0' : ''}
       ORDER BY is_read ASC, created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(userId, ...kinds, 100) as {
    id: number;
    task_id: number | null;
    type: string;
    title: string;
    message: string;
    is_read: number;
    created_at: string;
    entity_href: string | null;
  }[];

  return {
    notifications: rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      kind: (r.type in PERSISTED_SEVERITY ? r.type : 'assigned') as NotificationKind,
      severity: PERSISTED_SEVERITY[r.type] ?? 'info',
      title: r.title,
      message: r.message,
      href: r.entity_href ?? (r.task_id != null ? `/tasks/${r.task_id}` : '/notifications'),
      createdAt: r.created_at,
      isRead: Number(r.is_read) === 1,
    })),
    unread: Number(countRow.unread ?? 0),
    total: Number(countRow.total ?? 0),
  };
}

/** Unread persisted notifications for the badge count. */
function countUnreadPersisted(userId: number): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(userId) as { n: number };
  return Number(row.n);
}

/**
 * SQL fragment + params scoping task rows to what the user may act on.
 * Columns are ALWAYS t-qualified: users also carries created_by/assigned_to-
 * like columns, so an unqualified name is ambiguous once tasks is joined.
 * Every caller must alias the tasks table as `t`.
 */
function taskScope(user: { id: number; role: Role }): { clause: string; params: unknown[] } {
  // Supervisors, managers and admins watch the whole team.
  if (user.role !== 'employee') return { clause: '', params: [] };
  // Employees care about tasks they own or were handed.
  return { clause: 'AND (t.assigned_to = ? OR t.created_by = ?)', params: [user.id, user.id] };
}

interface TaskRow {
  id: number;
  title: string;
  status: string;
  due_date: string | null;
  created_at: string;
  assignee_name: string | null;
}

/** Team-wide or self-scoped task list with the fields notifications need. */
function relevantTasks(user: { id: number; role: Role }): TaskRow[] {
  const { clause, params } = taskScope(user);
  const db = getDb();
  return db
    .prepare(
      `SELECT t.id, t.title, t.status, t.due_date, t.created_at,
              u.full_name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE 1=1 ${clause}
       ORDER BY t.due_date ASC, t.id DESC`,
    )
    .all(...params) as TaskRow[];
}

/** Build the notification list for a user. Cheap reads, capped at MAX_NOTIFICATIONS. */
export function getNotificationsForUser(user: { id: number; role: Role }): AppNotification[] {
  const today = localDateStr();

  const out: AppNotification[] = [];
  const push = (n: Omit<AppNotification, 'key'> & { key?: string }) => {
    out.push({
      key: n.key ?? `${n.kind}-${n.href}-${n.createdAt}`,
      ...n,
    });
  };

  // Persisted (explicit) notifications first — they are the most recent intent.
  for (const n of persistedForUser(user.id)) push(n);

  for (const task of relevantTasks(user)) {
    if (isOverdue(task.due_date, task.status)) {
      push({
        kind: 'overdue',
        severity: 'danger',
        title: 'Overdue task',
        message: `"${task.title}" was due on ${task.due_date} and is still ${task.status.replace(/_/g, ' ')}.`,
        href: `/tasks/${task.id}`,
        createdAt: task.due_date ?? task.created_at,
      });
    } else if (isDueSoon(task.due_date, task.status, today)) {
      const dueDate = task.due_date;
      push({
        kind: 'due_soon',
        severity: 'warning',
        title: 'Due soon',
        message: `"${task.title}" is due on ${task.due_date}${task.assignee_name ? ` (assigned to ${task.assignee_name})` : ''}.`,
        href: `/tasks/${task.id}`,
        createdAt: dueDate ?? today,
      });
    } else if (
      task.status === 'not_started' &&
      task.created_at < sqliteDaysAgo(2)
    ) {
      push({
        kind: 'unstarted',
        severity: 'info',
        title: 'Not started',
        message: `"${task.title}" has not been started yet (created ${task.created_at.slice(0, 10)}).`,
        href: `/tasks/${task.id}`,
        createdAt: task.created_at,
      });
    }
  }

  // Sort: danger → warning → info, then newest first within a severity.
  const rank: Record<NotificationSeverity, number> = { danger: 0, warning: 1, info: 2, success: 3 };
  out.sort((a, b) => {
    const r = rank[a.severity] - rank[b.severity];
    if (r !== 0) return r;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  return out.slice(0, MAX_NOTIFICATIONS);
}

/**
 * Lightweight count for the navbar badge — a few COUNT(*) queries instead of
 * building the full list, so it stays cheap on EVERY page load. Independent of
 * MAX_NOTIFICATIONS (the badge shows the true total, not the capped list).
 */
export function countNotifications(user: { id: number; role: Role }): number {
  const { clause, params } = taskScope(user);
  const db = getDb();
  const today = localDateStr();
  const todayPlus3 = dueSoonEnd(today);

  const count = (sql: string, p: unknown[]): number => {
    const row = db.prepare(sql).get(...p) as { n: number };
    return Number(row.n);
  };

  let total = countUnreadPersisted(user.id);

  // Overdue (due before today, still active).
  total += count(
    `SELECT COUNT(*) AS n FROM tasks t
     WHERE t.due_date < ? AND t.status NOT IN ('completed', 'cancelled') ${clause}`,
    [today, ...params],
  );

  // Due soon (today … today+3, still active).
  total += count(
    `SELECT COUNT(*) AS n FROM tasks t
     WHERE t.due_date >= ? AND t.due_date <= ? AND t.status NOT IN ('completed', 'cancelled') ${clause}`,
    [today, todayPlus3, ...params],
  );

  // Not started for 2+ days.
  total += count(
    `SELECT COUNT(*) AS n FROM tasks t
     WHERE t.status = 'not_started' AND t.created_at < ? ${clause}`,
    [sqliteDaysAgo(2), ...params],
  );

  return total;
}

/** SQLite datetime('now','-N days') equivalent as a UTC string (YYYY-MM-DD HH:MM:SS). */
function sqliteDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}
