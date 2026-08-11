// Task creation layer. Single source of truth for the "create task" flow.
//
// - Inserts a row into `tasks` with the schema defaults/constraints.
// - Records the TASK_CREATED activity entry (CORE BUSINESS RULE #6) plus
//   checklist / dependency entries.
// - Enforces assignment scope: manager/admin may assign to any active user;
//   supervisors may assign only to active QC employees; employees may only
//   assign to themselves or leave the task unassigned (CORE BUSINESS RULE #2).
// - Assigning a task writes an in-app notification for the assignee.
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
import { createNotification } from './notifications';
import { initializeTaskSla } from './sla/engine';
import {
  MAX_DEPENDENCIES,
  MAX_DEPENDENCY_DEPTH,
  MAX_CHECKLIST_ITEMS,
} from './task-policy';
import { parseFormData, taskCreateInputSchema } from './validation';
import type { TaskPriority, TaskRecurrence } from './types';

/** Active users, used to populate the assignee dropdown (manager/admin). */
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
 * Active QC employees — the ONLY pool a supervisor may assign to (per spec:
 * "supervisor can create tasks and assign them to active QC employees").
 */
export function listActiveEmployees(): { id: number; full_name: string; role: string }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, full_name, role FROM users
       WHERE is_active = 1 AND role = 'employee'
       ORDER BY full_name ASC`,
    )
    .all() as { id: number; full_name: string; role: string }[];
}

/** Candidate tasks for the dependency picker (recent first, capped). */
export function listTasksForDependency(): { id: number; title: string; status: string }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, title, status FROM tasks ORDER BY id DESC LIMIT 100`,
    )
    .all() as { id: number; title: string; status: string }[];
}

/**
 * Walk an existing dependency graph (depth-limited) looking for a path back to
 * `taskId` — i.e. whether adding `dependencyIds` as dependencies of `taskId`
 * would create a cycle. `taskId` must already exist in the DB.
 */
export function wouldCreateCycle(taskId: number, dependencyIds: number[]): boolean {
  const db = getDb();
  const seen = new Set<number>();
  const stack = [...new Set(dependencyIds)];
  let depth = 0;
  while (stack.length > 0 && depth < MAX_DEPENDENCY_DEPTH) {
    depth += 1;
    const cur = stack.pop() as number;
    if (cur === taskId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const deps = db
      .prepare('SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?')
      .all(cur) as { depends_on_task_id: number }[];
    for (const d of deps) stack.push(d.depends_on_task_id);
  }
  return false;
}

/**
 * Validate a dependency list for a task. `taskId` is null for a task not yet
 * inserted (creation); pass the real id when adding dependencies to an
 * existing task so the self-dependency + cycle checks are exact.
 */
export function validateDependencies(
  dependencies: number[],
  taskId: number | null,
): { ok: true; ids: number[] } | { ok: false; error: string } {
  const ids = [...new Set(dependencies)].filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length > MAX_DEPENDENCIES) {
    return { ok: false, error: `A task can depend on at most ${MAX_DEPENDENCIES} tasks.` };
  }
  if (taskId !== null && ids.includes(taskId)) {
    return { ok: false, error: 'A task cannot depend on itself.' };
  }
  if (ids.length === 0) return { ok: true, ids };
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT id FROM tasks WHERE id IN (${placeholders})`)
    .all(...ids) as { id: number }[];
  const found = new Set(rows.map((r) => r.id));
  const missing = ids.find((id) => !found.has(id));
  if (missing !== undefined) {
    return { ok: false, error: `Dependency task #${missing} does not exist.` };
  }
  if (taskId !== null && wouldCreateCycle(taskId, ids)) {
    return { ok: false, error: 'Dependencies cannot form a cycle.' };
  }
  return { ok: true, ids };
}

/** Validate a checklist (non-empty titles, capped count) for creation. */
export function validateChecklist(
  checklist: string[],
): { ok: true; items: string[] } | { ok: false; error: string } {
  const items = [...new Set(checklist.map((s) => s.trim()).filter((s) => s.length > 0))];
  if (items.length > MAX_CHECKLIST_ITEMS) {
    return { ok: false, error: `A task can have at most ${MAX_CHECKLIST_ITEMS} checklist items.` };
  }
  return { ok: true, items };
}

/**
 * Insert a new task and record the creation activity. All validation must be
 * done by the caller; this function assumes the input is already clean.
 * The task, its checklist template, and its dependencies are inserted in ONE
 * transaction so a partial creation can never leak.
 */
export function createTask(params: {
  title: string;
  description: string | null;
  department: string;
  assignedTo: number | null;
  priority: TaskPriority;
  dueDate: string | null;
  recurrence: TaskRecurrence;
  recurrenceEndDate: string | null;
  inspectionType?: string | null;
  findingClassification?: string | null;
  riskLevel?: string | null;
  correctiveActionRequired?: number | null;
  referenceNumber?: string | null;
  auditBatchOrWorkOrder?: string | null;
  taskType?: string | null;
  checklist: string[];
  dependencies: number[];
  createdBy: number;
}): number {
  const db = getDb();
  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO tasks (title, description, department, status, priority, progress_percent,
                            created_by, assigned_to, due_date, recurrence, recurrence_end_date,
                            inspection_type, finding_classification, risk_level, corrective_action_required,
                            reference_number, audit_batch_or_work_order, task_type)
         VALUES (?, ?, ?, 'not_started', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        params.title,
        params.description,
        params.department,
        params.priority,
        params.createdBy,
        params.assignedTo,
        params.dueDate,
        params.recurrence,
        params.recurrenceEndDate,
        params.inspectionType ?? null,
        params.findingClassification ?? null,
        params.riskLevel ?? null,
        params.correctiveActionRequired ?? null,
        params.referenceNumber ?? null,
        params.auditBatchOrWorkOrder ?? null,
        params.taskType ?? params.inspectionType ?? null,
      );
    const taskId = Number(result.lastInsertRowid);

    // Checklist template (all items start unchecked).
    params.checklist.forEach((item, index) => {
      db.prepare(
        `INSERT INTO task_checklists (task_id, title, sort_order, is_completed)
         VALUES (?, ?, ?, 0)`,
      ).run(taskId, item, index);
    });

    // Dependencies.
    for (const depId of params.dependencies) {
      db.prepare(
        'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)',
      ).run(taskId, depId);
    }

    // Activity: the creation itself + checklist/dependency additions.
    logActivity({ taskId, userId: params.createdBy, action: Action.TASK_CREATED, newValue: params.title });
    for (const item of params.checklist) {
      logActivity({ taskId, userId: params.createdBy, action: Action.CHECKLIST_ITEM_ADDED, newValue: item });
    }
    for (const depId of params.dependencies) {
      logActivity({ taskId, userId: params.createdBy, action: Action.DEPENDENCY_ADDED, newValue: `#${depId}` });
    }
    return taskId;
  });
  const taskId = tx();
  initializeTaskSla(taskId, db);
  return taskId;
}

/** Notify the assignee that a task was assigned (creation + reassignment). */
export function notifyAssigned(params: {
  taskId: number;
  assigneeId: number;
  title: string;
  actorId: number;
}): void {
  createNotification({
    userId: params.assigneeId,
    taskId: params.taskId,
    type: 'assigned',
    title: 'New task assigned to you',
    message: `"${params.title}" has been assigned to you.`,
    actorId: params.actorId,
  });
}

/**
 * Normalize + validate the raw form body into clean task input.
 * All rules live in the Zod schema (src/lib/validation.ts) — this wrapper
 * only maps the parsed shape onto the task-layer field names.
 */
export function parseNewTaskInput(form: FormData): {
  ok: true;
  data: {
    title: string;
    description: string | null;
    department: string;
    assignedTo: number | null;
    priority: TaskPriority;
    dueDate: string | null;
    recurrence: TaskRecurrence;
    recurrenceEndDate: string | null;
    inspectionType: string | null;
    findingClassification: string | null;
    riskLevel: string | null;
    correctiveActionRequired: number | null;
    referenceNumber: string | null;
    auditBatchOrWorkOrder: string | null;
    checklist: string[];
    dependencies: number[];
  };
} | {
  ok: false;
  error: string;
} {
  const parsed = parseFormData(taskCreateInputSchema, form);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const {
    title,
    description,
    department,
    priority,
    assigned_to,
    due_date,
    recurrence,
    recurrence_end_date,
    inspection_type,
    finding_classification,
    risk_level,
    corrective_action_required,
    reference_number,
    audit_batch_or_work_order,
    checklist,
    dependencies,
  } = parsed.data;
  return {
    ok: true,
    data: {
      title,
      description,
      department,
      assignedTo: assigned_to,
      priority,
      dueDate: due_date,
      recurrence,
      recurrenceEndDate: recurrence_end_date,
      inspectionType: inspection_type,
      findingClassification: finding_classification,
      riskLevel: risk_level,
      correctiveActionRequired: corrective_action_required,
      referenceNumber: reference_number,
      auditBatchOrWorkOrder: audit_batch_or_work_order,
      checklist,
      dependencies,
    },
  };
}

/**
 * Validate an assignee against the current actor.
 * - manager/admin: any active user id is acceptable.
 * - supervisor: only ACTIVE QC EMPLOYEES may be assigned (per spec).
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
    .prepare('SELECT id, role, is_active FROM users WHERE id = ?')
    .get(assignedTo) as { id: number; role: string; is_active: number } | undefined;
  if (!target || Number(target.is_active) !== 1) {
    return { ok: false, error: 'Selected assignee does not exist or is inactive.' };
  }
  // Supervisors assign only to active QC employees.
  if (role === 'supervisor' && target.role !== 'employee') {
    return { ok: false, error: 'Supervisors can only assign tasks to QC employees.' };
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
  const {
    title,
    description,
    department,
    assignedTo,
    priority,
    dueDate,
    recurrence,
    recurrenceEndDate,
    inspectionType,
    findingClassification,
    riskLevel,
    correctiveActionRequired,
    referenceNumber,
    auditBatchOrWorkOrder,
    checklist,
    dependencies,
  } = parsed.data;

  const assigneeCheck = validateAssignee(user.role, assignedTo, user.id);
  if (!assigneeCheck.ok) {
    setFlash(context, 'error', assigneeCheck.error);
    return context.redirect(context.url.pathname);
  }
  const checklistCheck = validateChecklist(checklist);
  if (!checklistCheck.ok) {
    setFlash(context, 'error', checklistCheck.error);
    return context.redirect(context.url.pathname);
  }
  const depCheck = validateDependencies(dependencies, null);
  if (!depCheck.ok) {
    setFlash(context, 'error', depCheck.error);
    return context.redirect(context.url.pathname);
  }

  const taskId = createTask({
    title,
    description,
    department,
    assignedTo,
    priority,
    dueDate,
    recurrence,
    recurrenceEndDate,
    inspectionType,
    findingClassification,
    riskLevel,
    correctiveActionRequired,
    referenceNumber,
    auditBatchOrWorkOrder,
    checklist: checklistCheck.items,
    dependencies: depCheck.ids,
    createdBy: user.id,
  });

  // Assignment notification (spec: assigning a task creates an in-app notification).
  if (assignedTo !== null) {
    notifyAssigned({ taskId, assigneeId: assignedTo, title, actorId: user.id });
  }

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
