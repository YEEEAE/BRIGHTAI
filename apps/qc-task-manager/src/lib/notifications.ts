// In-app notifications for /notifications.
//
// Two sources are merged into one list:
//   1. PERSISTED — rows in the `notifications` table, written whenever the app
//      must notify someone explicitly (task assigned, due date / priority
//      changed for the assignee, next recurring task created). These carry an
//      is_read flag and can be cleared with markAllNotificationsRead.
//   2. DERIVED — computed from existing data (overdue / due soon / stale /
//      recent comments / pending deletion requests), so there is nothing to
//      keep in sync and no write path.
// Each notification links to the relevant page and carries a severity so the
// UI can style it.
//
// Scope rules:
//   - employee     → notifications about tasks they are assigned to or created
//   - supervisor+  → the whole team's tasks (overdue / due soon / stale)
//   - manager/admin→ additionally, pending deletion requests awaiting review

import { getDb } from './db';
import { isOverdue, localDateStr } from './format';
import type { Role } from './types';

export type NotificationKind =
  | 'overdue'
  | 'due_soon'
  | 'unstarted'
  | 'recent_comment'
  | 'pending_delete'
  | 'assigned'
  | 'due_date_changed'
  | 'priority_changed'
  | 'recurring_created'
  | 'task_completed';

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
}

const MAX_NOTIFICATIONS = 50;

// ─────────────────────────── Persisted notifications ───────────────────────

/**
 * Write an explicit in-app notification (assignments, due/priority changes,
 * recurring-task creation). Insert failures are swallowed on purpose — a
 * notification must never break the task mutation that triggered it.
 */
export function createNotification(params: {
  userId: number;
  taskId: number | null;
  type: NotificationKind;
  title: string;
  message: string;
}): void {
  try {
    getDb()
      .prepare(
        `INSERT INTO notifications (user_id, task_id, type, title, message)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(params.userId, params.taskId, params.type, params.title, params.message);
  } catch (err) {
    console.error('[notifications] failed to create notification:', err);
  }
}

/** Severity used for persisted notifications (derived ones set their own). */
const PERSISTED_SEVERITY: Record<string, NotificationSeverity> = {
  assigned: 'info',
  due_date_changed: 'warning',
  priority_changed: 'warning',
  recurring_created: 'success',
  task_completed: 'success',
};

/** Load the signed-in user's persisted notifications (newest first). */
function persistedForUser(userId: number): AppNotification[] {
  const rows = getDb()
    .prepare(
      `SELECT id, task_id, type, title, message, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(userId) as {
    id: number;
    task_id: number | null;
    type: string;
    title: string;
    message: string;
    created_at: string;
  }[];

  return rows.map((r) => ({
    key: `persisted-${r.id}`,
    kind: (r.type in PERSISTED_SEVERITY ? r.type : 'assigned') as NotificationKind,
    severity: PERSISTED_SEVERITY[r.type] ?? 'info',
    title: r.title,
    message: r.message,
    href: r.task_id != null ? `/tasks/${r.task_id}` : '/notifications',
    createdAt: r.created_at,
  }));
}

/** Mark every persisted notification of a user as read (returns count). */
export function markAllNotificationsRead(userId: number): number {
  const info = getDb()
    .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
    .run(userId);
  return info.changes;
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
  const plus3 = new Date();
  plus3.setDate(plus3.getDate() + 3);
  const todayPlus3 = localDateStr(plus3);

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
    } else if (
      task.due_date &&
      task.status !== 'completed' &&
      task.status !== 'cancelled' &&
      task.due_date >= today &&
      task.due_date <= todayPlus3
    ) {
      push({
        kind: 'due_soon',
        severity: 'warning',
        title: 'Due soon',
        message: `"${task.title}" is due on ${task.due_date}${task.assignee_name ? ` (assigned to ${task.assignee_name})` : ''}.`,
        href: `/tasks/${task.id}`,
        createdAt: task.due_date,
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

  // Recent comments by OTHER people on tasks the user is involved with.
  const { clause, params } = taskScope(user);
  const comments = getDb()
    .prepare(
      `SELECT c.id, c.comment, c.created_at, t.title, t.id AS task_id, u.full_name
       FROM task_comments c
       JOIN tasks t ON t.id = c.task_id
       JOIN users u ON u.id = c.user_id
       WHERE c.user_id != ? AND c.created_at >= datetime('now', '-7 days')
         AND t.status NOT IN ('completed', 'cancelled') ${clause}
       ORDER BY c.created_at DESC
       LIMIT 15`,
    )
    .all(user.id, ...params) as {
    id: number;
    comment: string;
    created_at: string;
    title: string;
    task_id: number;
    full_name: string;
  }[];

  for (const c of comments) {
    const snippet = c.comment.length > 90 ? `${c.comment.slice(0, 90)}…` : c.comment;
    push({
      key: `comment-${c.id}`,
      kind: 'recent_comment',
      severity: 'info',
      title: `New comment by ${c.full_name}`,
      message: `On "${c.title}": “${snippet}”`,
      href: `/tasks/${c.task_id}`,
      createdAt: c.created_at,
    });
  }

  // Pending deletion requests — manager/admin only (RULE #4).
  if (user.role === 'manager' || user.role === 'admin') {
    const pending = getDb()
      .prepare(
        `SELECT COUNT(*) AS n FROM task_delete_requests WHERE status = 'pending'`,
      )
      .get() as { n: number };
    if (pending.n > 0) {
      push({
        kind: 'pending_delete',
        severity: 'warning',
        title: 'Deletion requests awaiting review',
        message: `${pending.n} employee deletion request${pending.n === 1 ? '' : 's'} pending your approval.`,
        href: '/manager/requests',
        createdAt: new Date().toISOString(),
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
  const plus3 = new Date();
  plus3.setDate(plus3.getDate() + 3);
  const todayPlus3 = localDateStr(plus3);

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

  // Recent comments by OTHER people on tasks the user is involved with.
  total += count(
    `SELECT COUNT(*) AS n
     FROM task_comments c
     JOIN tasks t ON t.id = c.task_id
     WHERE c.user_id != ? AND c.created_at >= datetime('now', '-7 days')
       AND t.status NOT IN ('completed', 'cancelled') ${clause}`,
    [user.id, ...params],
  );

  // Pending deletion requests — manager/admin only (RULE #4).
  if (user.role === 'manager' || user.role === 'admin') {
    total += count(
      `SELECT COUNT(*) AS n FROM task_delete_requests WHERE status = 'pending'`,
      [],
    );
  }

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
