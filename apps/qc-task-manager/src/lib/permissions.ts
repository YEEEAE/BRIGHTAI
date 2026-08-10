// Role-based permission checks. Single source of truth for authorization.
// All checks are documented against the CORE BUSINESS RULES in the spec.

import type { Role, Task, User } from './types';

/**
 * Higher rank = more privileges. Used for "at least" comparisons.
 * admin > manager > supervisor > employee.
 */
const ROLE_RANK: Record<Role, number> = {
  admin: 4,
  manager: 3,
  supervisor: 2,
  employee: 1,
};

export function roleRank(role: Role): number {
  return ROLE_RANK[role];
}

/** True if `a` has at least the rank of `b`. */
export function hasRankAtLeast(a: Role, b: Role): boolean {
  return ROLE_RANK[a] >= ROLE_RANK[b];
}

// ─────────────────────────────── Dashboard ───────────────────────────────
// Employees have NO dashboard (CORE BUSINESS RULE #1).
export function canViewDashboard(role: Role): boolean {
  return role !== 'employee';
}

/** Role landing page after login. Single source of truth for role routing. */
export function roleHome(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'manager':
      return '/manager';
    case 'supervisor':
      return '/supervisor';
    case 'employee':
      return '/employee';
  }
}

// ───────────────────────────── Task creation ─────────────────────────────
// Employees can create tasks only if can_create_tasks = 1; everyone else can.
export function canCreateTasks(user: Pick<User, 'role' | 'can_create_tasks'>): boolean {
  if (user.role === 'employee') return user.can_create_tasks === true;
  return true;
}

// ──────────────────────────── Task editing scope ─────────────────────────
// Employees can only edit status, progress_percent, comments, attachments, blocker_note.
// Manager/admin can edit everything. Completed tasks are read-only for everyone.
const EMPLOYEE_EDITABLE = new Set([
  'status',
  'progress_percent',
  'blocker_note',
  'comments', // via dedicated API
  'attachments', // via dedicated API
]);

/**
 * Can this user edit this task at all? (Completed tasks are frozen for everyone.)
 */
export function canEditTask(user: Pick<User, 'role' | 'id'>, task: Pick<Task, 'status' | 'created_by' | 'assigned_to'>): boolean {
  // Completed tasks are READ-ONLY for everyone (CORE BUSINESS RULE #2).
  if (task.status === 'completed') return false;
  if (hasRankAtLeast(user.role, 'manager')) return true;
  // supervisors edit anything they can see (create/edit/assign)
  if (user.role === 'supervisor') return true;
  // employees edit only tasks assigned to them or that they created
  return task.assigned_to === user.id || task.created_by === user.id;
}

/**
 * Can this user edit a specific LOCKED field (title, description, assigned_to, due_date, priority)?
 * Only manager/admin. Never employees (even if they created the task). CORE BUSINESS RULE #2.
 */
export function canEditLockedField(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}

/** Is a field editable by the given role per the lock rules? */
export function isFieldEditableForRole(role: Role, field: string): boolean {
  if (hasRankAtLeast(role, 'manager')) return true;
  return EMPLOYEE_EDITABLE.has(field);
}

// ─────────────────────────── Task deletion / requests ────────────────────
// Employees cannot delete; they submit a request. Manager/admin approve/reject.
export function canDeleteTaskDirectly(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}

export function canSubmitDeleteRequest(role: Role): boolean {
  return role === 'employee';
}

export function canReviewDeleteRequests(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}

// ─────────────────────────────── Assignment ──────────────────────────────
// Only supervisor/manager/admin assign tasks.
export function canAssignTask(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}

// ─────────────────────────────── User management ─────────────────────────
export function canManageUsers(role: Role): boolean {
  return role === 'admin';
}
