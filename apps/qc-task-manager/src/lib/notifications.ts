// Derived in-app notifications for /notifications.
//
// There is deliberately NO notifications table — everything is computed from
// the data we already have (tasks, comments, delete requests), so there is
// nothing to keep in sync and no write path. Each notification links to the
// relevant page and carries a severity so the UI can style it.
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
  | 'pending_delete';

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

const MAX_NOTIFICATIONS = 30;

/** SQL fragment + params scoping task rows to what the user may act on. */
function taskScope(user: { id: number; role: Role }): { clause: string; params: unknown[] } {
  // Supervisors, managers and admins watch the whole team.
  if (user.role !== 'employee') return { clause: '', params: [] };
  // Employees care about tasks they own or were handed.
  return { clause: 'AND (assigned_to = ? OR created_by = ?)', params: [user.id, user.id] };
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
         AND t.status != 'completed' ${clause}
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

  let total = 0;

  // Overdue (due before today, not completed).
  total += count(
    `SELECT COUNT(*) AS n FROM tasks
     WHERE due_date < ? AND status != 'completed' ${clause}`,
    [today, ...params],
  );

  // Due soon (today … today+3, not completed).
  total += count(
    `SELECT COUNT(*) AS n FROM tasks
     WHERE due_date >= ? AND due_date <= ? AND status != 'completed' ${clause}`,
    [today, todayPlus3, ...params],
  );

  // Not started for 2+ days.
  total += count(
    `SELECT COUNT(*) AS n FROM tasks
     WHERE status = 'not_started' AND created_at < ? ${clause}`,
    [sqliteDaysAgo(2), ...params],
  );

  // Recent comments by OTHER people on tasks the user is involved with.
  total += count(
    `SELECT COUNT(*) AS n
     FROM task_comments c
     JOIN tasks t ON t.id = c.task_id
     WHERE c.user_id != ? AND c.created_at >= datetime('now', '-7 days')
       AND t.status != 'completed' ${clause}`,
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
