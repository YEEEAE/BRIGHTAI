// Role-based permission checks. SINGLE SOURCE OF TRUTH for authorization.
//
// The spec requires a single `PERMISSIONS` object that every page, API
// endpoint, and the middleware imports from. No scattered role checks.
// Every check below is documented against the CORE BUSINESS RULES in the spec.

import { EMPLOYEE_EDITABLE_FIELDS, isEmployeeEditableField } from './task-policy';
import type { LabDocumentStatus, LabTestStatus, Role, Task, User } from './types';

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

// ───────────────────────── QC Laboratory RBAC ─────────────────────────────
// Mirrors docs/QC-LAB-ARCHITECTURE.md §6.2 (the binding contract). All LAB_*
// permission authority lives HERE and nowhere else (architecture-guard).
//
// Hard invariants enforced by the entity-context predicates below:
//   1. A tester can NEVER review or approve their own test.
//   2. A document editor can NEVER approve their own version.
//   3. Tested/Reviewed/Approved By are derived from the session, never input.
//   4. Terminal states (APPROVED / VOID / SUPERSEDED / ARCHIVED) are immutable.
// Contract decisions baked in: D-4 (supervisor test approval denied by
// default) and D-5 (retest creation is supervisor+ only).

/** Minimal shape needed for lab test authorization checks. */
type LabTestAuth = { status: LabTestStatus; tested_by: number | null; reviewed_by: number | null; created_by: number };
/** Minimal shape needed for lab document authorization checks. */
type LabDocumentAuth = { status: LabDocumentStatus; owner_id: number | null; created_by: number; author_id?: number | null; source_register_code?: string | null };
type LabTemplateAuth = { status: string; created_by: number; author_id?: number | null };

const ALL_ROLES: readonly Role[] = ['admin', 'manager', 'supervisor', 'employee'];

/** /lab — every role may enter the laboratory workspace (contract: LAB_VIEW = all). */
export function canViewLab(role: Role): boolean {
  return ALL_ROLES.includes(role);
}

// ── Lab tests ──
export function canViewLabTests(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canCreateLabTest(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
/** Editing is status-scoped: see canEditLabTest(user, test) for the entity check. */
export function canEditLabTest(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canSubmitLabTest(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
/** Review queue: manager/admin, plus supervisor EXCEPT their own tests (entity check below). */
export function canReviewLabTest(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}
/** Approval: admin, or manager EXCEPT their own test. Supervisor denied by default (D-4). */
export function canApproveLabTest(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canVoidLabTest(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}

// ── Lab products (Product Master) ──
export function canViewLabProducts(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canCreateLabProduct(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canEditLabProduct(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canArchiveLabProduct(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canProposeLabProductCreate(role: Role): boolean {
  return role === 'employee' || role === 'supervisor';
}
export function canProposeLabProductEdit(role: Role): boolean {
  return canProposeLabProductCreate(role);
}

// ── Lab test templates (≠ /admin/templates task templates) ──
export function canViewLabTemplates(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canCreateLabTemplate(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canEditLabTemplate(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canApproveLabTemplate(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canArchiveLabTemplate(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canApproveLabTemplateRecord(
  user: Pick<User, 'id' | 'role'>,
  template: LabTemplateAuth,
): boolean {
  if (!canApproveLabTemplate(user.role)) return false;
  if (template.created_by === user.id || template.author_id === user.id) return false;
  return template.status === 'DRAFT';
}
export function canEditLabTemplateRecord(
  user: Pick<User, 'id' | 'role'>,
  template: LabTemplateAuth,
): boolean {
  if (template.status === 'ARCHIVED') return false;
  if (hasRankAtLeast(user.role, 'manager')) return true;
  return (template.created_by === user.id || template.author_id === user.id) && template.status === 'DRAFT';
}

// ── Lab equipment registry ──
export function canViewLabEquipment(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canCreateLabEquipment(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canEditLabEquipment(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canArchiveLabEquipment(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canProposeLabEquipmentCreate(role: Role): boolean {
  return role === 'employee' || role === 'supervisor';
}
export function canProposeLabEquipmentEdit(role: Role): boolean {
  return canProposeLabEquipmentCreate(role);
}
export function canApplyLabEquipmentChange(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canRecordLabEquipmentMaintenance(role: Role): boolean {
  return ALL_ROLES.includes(role);
}

// ── Lab calibration (status derived from dates at read time — never stored) ──
export function canViewLabCalibration(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canCreateLabCalibration(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canEditLabCalibration(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canProposeLabCalibrationCreate(role: Role): boolean {
  return role === 'employee' || role === 'supervisor';
}
export function canProposeLabCalibrationEdit(role: Role): boolean {
  return canProposeLabCalibrationCreate(role);
}

// ── Controlled documents (SOP / WI) ──
export function canViewLabDocuments(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canCreateLabDocument(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canEditLabDocument(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canReviewLabDocument(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}
export function canApproveLabDocument(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canArchiveLabDocument(role: Role): boolean {
  return hasRankAtLeast(role, 'manager');
}
export function canAcknowledgeLabDocument(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
/** Assigning employees to acknowledge a document version — supervisor+ bar, the
 *  same level as document creation/editing (only APPROVED versions assignable). */
export function canAssignLabDocumentAcknowledgement(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}

// ── Retests (D-5: originals never overwritten; supervisor+ may create) ──
export function canViewLabRetests(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canCreateLabRetest(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}

// ── Lab test ↔ finding traceability links (PROMPT 20) ──
/** Linking a lab test to a QC Finding is a quality-significant mutation —
 *  same supervisor+ bar as retest creation (D-5). */
export function canLinkLabTestToFinding(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}

// ── Reporting / exports / dashboards ──
export function canViewLabReports(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}
export function canExportLabData(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}
export function canViewLabDataQuality(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}
export function canViewLabManagementDashboard(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}
/** Lab-wide audit timeline — cross-entity read over the shared qc_audit_log.
 *  Same supervisor+ bar as reports/data-quality (employees still see the
 *  audit section on their own test records). */
export function canViewLabAudit(role: Role): boolean {
  return hasRankAtLeast(role, 'supervisor');
}

// ── Laboratory contributor change review queue ───────────────────────────
// Contributors propose validated master-data changes; only manager/admin can
// review, and the requester is never allowed to approve their own proposal.
export function canSubmitLabChangeRequest(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canViewOwnLabChangeRequests(role: Role): boolean {
  return ALL_ROLES.includes(role);
}
export function canReviewLabChangeRequests(role: Role): boolean {
  return role === 'manager' || role === 'admin';
}
export function canApproveLabChangeRequest(
  user: Pick<User, 'id' | 'role'>,
  request: Pick<{ requested_by: number }, 'requested_by'>,
): boolean {
  return canReviewLabChangeRequests(user.role) && user.id !== request.requested_by;
}

// ── AI assist (advisory only — AI NEVER decides PASS/FAIL or approves) ──
export function canUseLabAiAssist(role: Role): boolean {
  return ALL_ROLES.includes(role);
}

// ── Lab entity-context predicates (hard server-side invariants) ──────────

/**
 * Can the user edit this test record? Manager/admin: any non-terminal test.
 * Employee/supervisor: only their own DRAFT/REJECTED tests. Terminal states
 * (APPROVED/VOID) are immutable for everyone.
 */
export function canEditLabTestRecord(
  user: Pick<User, 'id' | 'role'>,
  test: LabTestAuth,
): boolean {
  if (test.status === 'APPROVED' || test.status === 'VOID') return false;
  if (hasRankAtLeast(user.role, 'manager')) return true;
  const isOwn = test.tested_by === user.id || test.created_by === user.id;
  return isOwn && (test.status === 'DRAFT' || test.status === 'REJECTED');
}

/**
 * True when the caller may edit this record AND it is a DRAFT (PROMPT 43-B:
 * DRAFT only — SUBMITTED and beyond belong to the review flow).
 */
export function canEditLabTestDraft(
  user: Pick<User, 'id' | 'role'>,
  test: LabTestAuth,
): boolean {
  return test.status === 'DRAFT' && canEditLabTestRecord(user, test);
}

/**
 * Can the user submit this test for review? Own non-terminal, not-yet-submitted
 * workflow states only (DRAFT/REJECTED rework). Never from the session of
 * another tester — tested_by is the authority, not request input.
 */
export function canSubmitLabTestRecord(
  user: Pick<User, 'id' | 'role'>,
  test: LabTestAuth,
): boolean {
  const isOwn = test.tested_by === user.id || test.created_by === user.id;
  if (!isOwn) return false;
  return test.status === 'DRAFT' || test.status === 'REJECTED';
}

/**
 * Review authority for a specific test. A tester can NEVER review their own
 * test — hard invariant #1 (tested_by === actor → denied, even for admins).
 */
export function canReviewLabTestRecord(
  user: Pick<User, 'id' | 'role'>,
  test: LabTestAuth,
): boolean {
  if (!canReviewLabTest(user.role)) return false;
  if (test.tested_by === user.id || test.created_by === user.id) return false;
  return test.status === 'SUBMITTED' || test.status === 'UNDER_REVIEW';
}

/**
 * Approval authority for a specific test. The tester and the reviewer can
 * NEVER approve it; supervisor is denied by default (D-4).
 */
export function canApproveLabTestRecord(
  user: Pick<User, 'id' | 'role'>,
  test: LabTestAuth,
): boolean {
  if (!canApproveLabTest(user.role)) return false;
  if (test.tested_by === user.id || test.created_by === user.id) return false;
  if (test.reviewed_by === user.id) return false;
  return test.status === 'SUBMITTED' || test.status === 'UNDER_REVIEW';
}

/**
 * Void authority for a specific test (PROMPT 42). Allowed for manager/admin
 * from any non-terminal status except APPROVED and VOID (approved records are
 * immutable quality records; VOID is terminal).
 */
export function canVoidLabTestRecord(
  user: Pick<User, 'id' | 'role'>,
  test: LabTestAuth,
): boolean {
  if (!canVoidLabTest(user.role)) return false;
  if (test.status === 'APPROVED' || test.status === 'VOID') return false;
  return test.status === 'DRAFT' || test.status === 'SUBMITTED' || test.status === 'UNDER_REVIEW' || test.status === 'REJECTED';
}

/**
 * Edit authority for a controlled document. Editing an APPROVED document
 * means creating a NEW draft version (contract §9) — the approved version is
 * immutable. Employees/supervisors are limited to their own editable drafts.
 */
export function canEditLabDocumentRecord(
  user: Pick<User, 'id' | 'role'>,
  doc: LabDocumentAuth,
): boolean {
  if (!canEditLabDocument(user.role)) return false;
  if (doc.status === 'ARCHIVED' || doc.status === 'SUPERSEDED') return false;
  if (hasRankAtLeast(user.role, 'manager')) return true;
  // employee/supervisor: only owned/authored DRAFT content may be edited.
  return doc.status === 'DRAFT' && (
    doc.owner_id === user.id ||
    doc.created_by === user.id ||
    (doc.source_register_code === 'F-4-2-1-2' && doc.owner_id === null && doc.author_id == null)
  );
}

/**
 * Review authority for a specific document — never the author's own
 * (owner/created_by/author_id === actor → denied).
 */
export function canReviewLabDocumentRecord(
  user: Pick<User, 'id' | 'role'>,
  doc: LabDocumentAuth,
): boolean {
  if (!canReviewLabDocument(user.role)) return false;
  if (doc.owner_id === user.id || doc.created_by === user.id) return false;
  if (doc.author_id != null && doc.author_id === user.id) return false;
  return doc.status === 'IN_REVIEW' || doc.status === 'DRAFT';
}

/**
 * Approval authority for a specific document — the editor/author can NEVER
 * approve their own version (hard invariant #2: owner/created_by/author_id === actor → denied).
 */
export function canApproveLabDocumentRecord(
  user: Pick<User, 'id' | 'role'>,
  doc: LabDocumentAuth,
): boolean {
  if (!canApproveLabDocument(user.role)) return false;
  if (doc.owner_id === user.id || doc.created_by === user.id) return false;
  if (doc.author_id != null && doc.author_id === user.id) return false;
  return doc.status === 'IN_REVIEW';
}
