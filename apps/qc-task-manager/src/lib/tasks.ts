// Task creation layer. Single source of truth for the "create task" flow.
//
// - Inserts a row into `tasks` with the schema defaults/constraints.
// - Records the TASK_CREATED activity entry (CORE BUSINESS RULE #6).
// - Enforces assignment scope: manager/supervisor may assign to any active
//   user; employees may only assign to themselves or leave the task
//   unassigned (CORE BUSINESS RULE #2 / canAssignTask).
//
// The GET form lives in the .astro pages (/manager/new, /supervisor/new,
// /employee/new); the POST is short-circuited in src/middleware.ts because
// Astro 6 pages have no named request handlers (same pattern as POST /login).

import type { APIContext } from 'astro';
import { getDb } from './db';
import { logActivity, Action } from './activity';
import { getCurrentUser } from './session';
import { setFlash } from './flash';
import { PERMISSIONS } from './permissions';
import { parseFormData, taskCreateInputSchema } from './validation';
import type { TaskPriority } from './types';

/** Active users, used to populate the assignee dropdown. */
export function listActiveUsers(): { id: number; full_name: string; role: string }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, full_name, role FROM users
       WHERE is_active = 1
       ORDER BY full_name ASC`,
    )
    .all() as { id: number; full_name: string; role: string }[];
}

/**
 * Insert a new task and record the creation activity. All validation must be
 * done by the caller; this function assumes the input is already clean.
 */
export function createTask(params: {
  title: string;
  description: string | null;
  assignedTo: number | null;
  priority: TaskPriority;
  dueDate: string | null;
  createdBy: number;
}): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to, due_date)
       VALUES (?, ?, 'not_started', ?, 0, ?, ?, ?)`,
    )
    .run(
      params.title,
      params.description,
      params.priority,
      params.createdBy,
      params.assignedTo,
      params.dueDate,
    );
  const taskId = Number(result.lastInsertRowid);

  logActivity({ taskId, userId: params.createdBy, action: Action.TASK_CREATED, newValue: params.title });
  return taskId;
}

/**
 * Normalize + validate the raw form body into clean task input.
 * All rules live in the Zod schema (src/lib/validation.ts) — this wrapper
 * only maps the parsed shape onto the task-layer field names.
 */
export function parseNewTaskInput(form: FormData): {
  ok: true;
  data: { title: string; description: string | null; assignedTo: number | null; priority: TaskPriority; dueDate: string | null };
} | {
  ok: false;
  error: string;
} {
  const parsed = parseFormData(taskCreateInputSchema, form);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { title, description, priority, assigned_to, due_date } = parsed.data;
  return {
    ok: true,
    data: {
      title,
      description,
      assignedTo: assigned_to,
      priority,
      dueDate: due_date,
    },
  };
}

/**
 * Validate an assignee against the current actor.
 * - manager/supervisor/admin: any active user id is acceptable.
 * - employee: only their own id (or null/unassigned) is allowed.
 */
export function validateAssignee(
  role: string,
  assignedTo: number | null,
  actorId: number,
): { ok: true } | { ok: false; error: string } {
  if (assignedTo === null) return { ok: true };
  const db = getDb();
  const target = db
    .prepare('SELECT id, is_active FROM users WHERE id = ?')
    .get(assignedTo) as { id: number; is_active: number } | undefined;
  if (!target || Number(target.is_active) !== 1) {
    return { ok: false, error: 'Selected assignee does not exist or is inactive.' };
  }
  // Employees may only assign tasks to themselves (per product decision).
  if (role === 'employee' && assignedTo !== actorId) {
    return { ok: false, error: 'Employees can only assign tasks to themselves.' };
  }
  return { ok: true };
}

export interface CreateTaskOptions {
  /** 'all' = assign to any active user; 'self' = self or unassigned only. */
  assignmentScope: 'all' | 'self';
}

/**
 * Handle the POST for a "new task" form. Resolves the current user, validates
 * the submission, inserts the task, flashes the result, and redirects back to
 * the appropriate task list. The route guard in middleware has already
 * confirmed the user may reach this area before this handler runs.
 *
 * The assignment restriction itself (employees → self only) is enforced by
 * validateAssignee via the user's role; `assignmentScope` exists to make the
 * caller's intent explicit and is asserted here.
 */
export async function handleCreateTaskPost(
  context: APIContext,
  opts: CreateTaskOptions,
): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }

  // Server-side canCreateTask gate (CORE BUSINESS RULE #1). The GET form on
  // /employee/new already checks it, but a POST bypass must not be possible.
  if (!PERMISSIONS.canCreateTask(user)) {
    setFlash(context, 'error', 'You do not have permission to create tasks.');
    return context.redirect(taskListFor(user.role));
  }

  // A manager/admin/supervisor posting to /employee/new is unexpected; the
  // employee scope only allows self-assignment. Treat it as self-or-unassigned.
  if (opts.assignmentScope === 'self' && user.role !== 'employee') {
    setFlash(context, 'error', 'Use the manager or supervisor new-task page.');
    return context.redirect(taskListFor(user.role));
  }

  const form = await context.request.formData();
  const parsed = parseNewTaskInput(form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(context.url.pathname);
  }
  const { title, description, assignedTo, priority, dueDate } = parsed.data;

  const assigneeCheck = validateAssignee(user.role, assignedTo, user.id);
  if (!assigneeCheck.ok) {
    setFlash(context, 'error', assigneeCheck.error);
    return context.redirect(context.url.pathname);
  }

  createTask({
    title,
    description,
    assignedTo,
    priority,
    dueDate,
    createdBy: user.id,
  });

  setFlash(context, 'success', `Task "${title}" created.`);
  return context.redirect(taskListFor(user.role));
}

/** Where a user lands after creating a task. */
export function taskListFor(role: string): string {
  switch (role) {
    case 'admin':
    case 'manager':
      return '/manager';
    case 'supervisor':
      return '/supervisor';
    default:
      return '/employee';
  }
}
