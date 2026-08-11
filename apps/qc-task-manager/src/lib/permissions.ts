// Role-based permission checks. SINGLE SOURCE OF TRUTH for authorization.
//
// The spec requires a single `PERMISSIONS` object that every page, API
// endpoint, and the middleware imports from. No scattered role checks.
// Every check below is documented against the CORE BUSINESS RULES in the spec.

import { EMPLOYEE_EDITABLE_FIELDS, isEmployeeEditableField } from './task-policy';
import type { Role, Task, User } from './types';

type QcOwner = { owner: number };

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

/** True if `a` has at least the rank of `b`. */
export function hasRankAtLeast(a: Role, b: Role): boolean {
  return ROLE_RANK[a] >= ROLE_RANK[b];
}

/**
 * The single permission contract (spec-mandated shape).
 * All role checks elsewhere MUST go through this object.
 */
export const PERMISSIONS = {
  /** Employees have NO dashboard (CORE BUSINESS RULE #1). */
  canViewDashboard: (role: Role): boolean =>
    ['admin', 'manager', 'supervisor'].includes(role),

  /** Employees can create tasks ONLY if can_create_tasks = 1; others always can. */
  canCreateTask: (user: Pick<User, 'role' | 'can_create_tasks'>): boolean =>
    ['admin', 'manager', 'supervisor'].includes(user.role) || user.can_create_tasks === true,

  /** Manager/admin can edit all task fields; employees edit a locked subset. */
  canEditTaskFields: (role: Role): boolean => ['admin', 'manager'].includes(role),

  /** Employees never delete tasks directly — they submit a delete request (RULE #4). */
  canDeleteTask: (role: Role): boolean => ['admin', 'manager'].includes(role),

  /** User management is admin-only (RULE #1). */
  canManageUsers: (role: Role): boolean => role === 'admin',

  /** Task templates are administered by admins only (lifecycle + configuration). */
  canManageTemplates: (role: Role): boolean => role === 'admin',

  /** Manager/admin may override the required-evidence completion gate with a reason. */
  canOverrideEvidenceGate: (role: Role): boolean => hasRankAtLeast(role, 'manager'),

  /** Fields an employee may edit after task creation (CORE BUSINESS RULE #2). */
  employeeEditableFields: EMPLOYEE_EDITABLE_FIELDS,
};

// ─────────────────────────────── Area access ─────────────────────────────
// Route-prefix guards. These keep the middleware free of hardcoded role lists.

/** /manager/* — manager + admin. */
export function canAccessManagerArea(role: Role): boolean {
  return role === 'manager' || role === 'admin';
}

/** /supervisor/* — supervisor + manager + admin. */
export function canAccessSupervisorArea(role: Role): boolean {
  return ['supervisor', 'manager', 'admin'].includes(role);
}

/** Role landing page after login. Single source of truth for role routing. */
export function roleHome(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin/users';
    case 'manager':
      return '/manager';
    case 'supervisor':
      return '/supervisor';
    case 'employee':
      return '/employee';
  }
}

// ──────────────────────────── Task editing scope ─────────────────────────
// Employees can only edit status, progress_percent, comments, attachments,
// blocker_note. Manager/admin can edit everything. Completed tasks are
// read-only for everyone.

/**
 * Can this user edit this task at all? (Completed AND cancelled tasks are
 * frozen for everyone — RULE #3; cancelled is terminal.)
 */
export function canEditTask(user: Pick<User, 'role' | 'id'>, task: Pick<Task, 'status' | 'created_by' | 'assigned_to'>): boolean {
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  if (hasRankAtLeast(user.role, 'manager')) return true;
  // supervisors edit anything they can see (create/edit/assign)
  if (user.role === 'supervisor') return true;
  // employees edit only tasks assigned to them or that they created
  return task.assigned_to === user.id || task.created_by === user.id;
}

/**
 * Can this user edit a specific LOCKED field (title, description, assigned_to, due_date, priority)?
 * The FIELD LOCKING rule locks these for EMPLOYEES only; supervisors, managers
 * and admins all create/edit/assign tasks (CORE BUSINESS RULE #1).
 */
export function canEditLockedField(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}

/** Is a field editable by the given role per the lock rules? */
export function isFieldEditableForRole(role: Role, field: string): boolean {
  if (hasRankAtLeast(role, 'manager')) return true;
  return isEmployeeEditableField(field);
}

// ─────────────────────────── Task deletion / requests ────────────────────
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

/** Team workload comparisons are private to operational leads. */
export function canViewTeamWorkload(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}

/** QC Operations RBAC: employees can work only on assigned actions. */
export function canManageFinding(user: Pick<User, 'id' | 'role'>, finding: QcOwner): boolean {
  if (user.role === 'admin' || user.role === 'manager' || user.role === 'supervisor') return true;
  return user.id === finding.owner;
}

/** Content edits are reserved for assigned employees, managers, and admins;
 * supervisors operate the review/status lane. */
export function canEditFindingContent(user: Pick<User, 'id' | 'role'>, finding: QcOwner): boolean {
  if (user.role === 'admin' || user.role === 'manager') return true;
  return user.role === 'employee' && user.id === finding.owner;
}

export function canManageCapa(user: Pick<User, 'id' | 'role'>, capa: QcOwner): boolean {
  if (user.role === 'admin' || user.role === 'manager' || user.role === 'supervisor') return true;
  return user.id === capa.owner;
}

export function canApproveCapa(role: Role): boolean {
  return role === 'manager' || role === 'admin';
}

export function canApproveFinding(role: Role): boolean {
  return role === 'manager' || role === 'admin';
}

export function canEditChecklistStructure(user: Pick<User, 'id' | 'role'>, task: Pick<Task, 'created_by' | 'assigned_to'>): boolean {
  if (hasRankAtLeast(user.role, 'manager')) return true;
  return user.role === 'supervisor' && (task.created_by === user.id || task.assigned_to === user.id);
}

/** Admin-only gate for the /admin/templates area + template CRUD. */
export function canManageTemplates(role: Role): boolean {
  return role === 'admin';
}

/** Manager/admin may override the required-evidence completion gate with a reason. */
export function canOverrideEvidenceGate(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
