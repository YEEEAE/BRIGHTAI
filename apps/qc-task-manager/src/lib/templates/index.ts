// Task Templates — pure policy module (single source of truth for the template
// lifecycle, configuration shape, and snapshot semantics).
//
// Persistence lives in templatesStore.ts (DB mutations). This module is
// dependency-free (types + constants + pure functions only), mirroring the
// capa/findings convention so it can be imported anywhere — server libs, Astro
// pages, React islands, the Node test runner.
//
// Responsibilities:
//   * Lifecycle enum + transition map (DRAFT → ACTIVE → ARCHIVED)
//   * Template configuration shape + validation
//   * buildSnapshot(): freeze a template's configuration into an immutable JSON
//     blob stored on the task so later template edits never mutate existing tasks
//   * summarizeTemplateForForm(): populate the create-task form defaults

import { normalizeEvidenceRequirements, serializeEvidenceRequirements, type EvidenceRequirementSpec } from '../evidence';
import type { TaskPriority, TaskRecurrence } from '../types';

// Re-export so callers can import template + evidence helpers from one place.
export { normalizeEvidenceRequirements, serializeEvidenceRequirements };
export type { EvidenceRequirementSpec };

// ─────────────────────────── Lifecycle ───────────────────────────

/** A template moves DRAFT → ACTIVE → ARCHIVED. Only ACTIVE may be instantiated. */
export const TEMPLATE_LIFECYCLE = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type TemplateLifecycle = (typeof TEMPLATE_LIFECYCLE)[number];

/** Human-readable label for a lifecycle status. */
export const TEMPLATE_LIFECYCLE_LABELS: Record<TemplateLifecycle, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

export function isTemplateLifecycle(value: string): value is TemplateLifecycle {
  return (TEMPLATE_LIFECYCLE as readonly string[]).includes(value);
}

/**
 * Allowed transitions. ARCHIVED → DRAFT re-enables editing (un-archive); an
 * archived template is read-only and cannot be instantiated.
 */
const TEMPLATE_TRANSITIONS: Record<TemplateLifecycle, readonly TemplateLifecycle[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT'],
};

export function canTransitionTemplate(from: string, to: string): boolean {
  return (
    isTemplateLifecycle(from) &&
    isTemplateLifecycle(to) &&
    (from === to || TEMPLATE_TRANSITIONS[from].includes(to))
  );
}

/** Only ACTIVE templates can be instantiated into tasks. */
export function isInstantiable(lifecycle: string): boolean {
  return lifecycle === 'ACTIVE';
}

// ─────────────────────────── Configuration shape ───────────────────────────

/** A checklist template entry (title + order; copied unchecked onto the task). */
export interface ChecklistTemplateItem {
  title: string;
  sortOrder: number;
}

/**
 * Finding defaults applied to optional QC metadata when the task is created
 * from the template. All fields optional — legacy tasks remain unaffected.
 */
export interface FindingDefaults {
  inspectionType?: string;
  classification?: string;
  severity?: string;
  riskLevel?: string;
  correctiveActionRequired?: boolean;
}

/**
 * Assignment rules consulted at instantiation. `autoAssignUserId` (when set)
 * pre-assigns the new task; `allowedAssigneeRole` narrows who may be assigned.
 */
export interface AssignmentRules {
  defaultDepartment?: string;
  autoAssignUserId?: number | null;
  allowedAssigneeRole?: string;
}

/**
 * The structured configuration stored in the JSON columns of task_templates.
 * This is the canonical shape — form input and DB rows are normalized to it.
 */
export interface TemplateConfig {
  title: string;
  description?: string;
  department: string;
  priority: TaskPriority;
  taskType?: string;
  slaPolicyId?: number | null;
  checklist: ChecklistTemplateItem[];
  evidenceRequirements: EvidenceRequirementSpec[];
  recurrence: TaskRecurrence;
  findingDefaults: FindingDefaults;
  assignmentRules: AssignmentRules;
}

// ─────────────────────────── Limits ───────────────────────────

export const MAX_TEMPLATE_CODE_LENGTH = 60;
export const MAX_TEMPLATE_TITLE_LENGTH = 200;
export const MAX_TEMPLATE_DESCRIPTION_LENGTH = 5000;
export const MAX_CHECKLIST_ITEMS = 30;
export const MAX_CHECKLIST_TITLE_LENGTH = 200;
export const MAX_EVIDENCE_REQUIREMENTS = 20;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─────────────────────────── Validation ───────────────────────────

export interface TemplateValidationResult {
  ok: boolean;
  errors: string[];
  config?: TemplateConfig;
}

/**
 * Validate a raw template input (from form or JSON) into a clean TemplateConfig.
 * Returns a list of user-facing error strings; `ok` is true when there are none.
 */
export function validateTemplateConfig(input: unknown): TemplateValidationResult {
  const errors: string[] = [];
  const src: Record<string, unknown> =
    input && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  const title = String(src.title ?? '').trim();
  if (!title) errors.push('Template title is required.');
  else if (title.length > MAX_TEMPLATE_TITLE_LENGTH) errors.push(`Title must be ${MAX_TEMPLATE_TITLE_LENGTH} characters or fewer.`);

  const descriptionRaw = src.description;
  const description =
    descriptionRaw == null ? undefined : String(descriptionRaw).trim() || undefined;
  if (description && description.length > MAX_TEMPLATE_DESCRIPTION_LENGTH) {
    errors.push(`Description must be ${MAX_TEMPLATE_DESCRIPTION_LENGTH} characters or fewer.`);
  }

  const department = String(src.department ?? 'QC').trim() || 'QC';
  if (department.length > 50) errors.push('Department must be 50 characters or fewer.');

  const priority = String(src.priority ?? 'medium').toLowerCase();
  if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
    errors.push('Priority must be one of: low, medium, high, urgent.');
  }

  const taskTypeRaw = src.taskType ?? src.task_type;
  const taskType = taskTypeRaw == null ? undefined : String(taskTypeRaw).trim() || undefined;

  const recurrence = String(src.recurrence ?? 'none').toLowerCase();
  if (!['none', 'daily', 'weekly', 'monthly'].includes(recurrence)) {
    errors.push('Recurrence must be one of: none, daily, weekly, monthly.');
  }

  let slaPolicyId: number | null | undefined = undefined;
  if (src.slaPolicyId != null && src.slaPolicyId !== '' && src.sla_policy_id == null) {
    // no-op
  }
  const slaRaw = src.slaPolicyId ?? src.sla_policy_id;
  if (slaRaw != null && slaRaw !== '') {
    const n = Number(slaRaw);
    if (!Number.isInteger(n) || n <= 0) errors.push('SLA policy must be a positive integer.');
    else slaPolicyId = n;
  } else {
    slaPolicyId = null;
  }

  // Checklist normalization.
  const checklistRaw = Array.isArray(src.checklist) ? src.checklist : [];
  if (checklistRaw.length > MAX_CHECKLIST_ITEMS) {
    errors.push(`A template may have at most ${MAX_CHECKLIST_ITEMS} checklist items.`);
  }
  const checklist: ChecklistTemplateItem[] = [];
  checklistRaw.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const title = String((item as Record<string, unknown>).title ?? '').trim();
    if (!title) {
      errors.push(`Checklist item ${index + 1} is missing a title.`);
      return;
    }
    if (title.length > MAX_CHECKLIST_TITLE_LENGTH) {
      errors.push(`Checklist item ${index + 1} title must be ${MAX_CHECKLIST_TITLE_LENGTH} characters or fewer.`);
      return;
    }
    const sortOrder = Number((item as Record<string, unknown>).sortOrder ?? (item as Record<string, unknown>).sort_order ?? index);
    checklist.push({ title, sortOrder: Number.isFinite(sortOrder) ? sortOrder : index });
  });

  // Evidence requirements normalization (delegates to the evidence module so the
  // rule lives in one place).
  let evidenceRequirements: EvidenceRequirementSpec[] = [];
  const evidenceRaw = src.evidenceRequirements ?? src.evidence_requirements ?? [];
  try {
    evidenceRequirements = normalizeEvidenceRequirements(evidenceRaw);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Evidence requirements are invalid.');
  }
  if (evidenceRequirements.length > MAX_EVIDENCE_REQUIREMENTS) {
    errors.push(`A template may declare at most ${MAX_EVIDENCE_REQUIREMENTS} evidence requirements.`);
  }

  const findingDefaultsRaw = (src.findingDefaults ?? src.finding_defaults ?? {}) as Record<string, unknown>;
  const findingDefaults: FindingDefaults = {};
  if (findingDefaultsRaw.inspectionType ?? findingDefaultsRaw.inspection_type) {
    findingDefaults.inspectionType = String(findingDefaultsRaw.inspectionType ?? findingDefaultsRaw.inspection_type).trim();
  }
  if (findingDefaultsRaw.classification) {
    findingDefaults.classification = String(findingDefaultsRaw.classification).trim();
  }
  if (findingDefaultsRaw.severity) {
    findingDefaults.severity = String(findingDefaultsRaw.severity).trim();
  }
  if (findingDefaultsRaw.riskLevel ?? findingDefaultsRaw.risk_level) {
    findingDefaults.riskLevel = String(findingDefaultsRaw.riskLevel ?? findingDefaultsRaw.risk_level).trim();
  }
  if (findingDefaultsRaw.correctiveActionRequired ?? findingDefaultsRaw.corrective_action_required) {
    findingDefaults.correctiveActionRequired = true;
  }

  const assignmentRaw = (src.assignmentRules ?? src.assignment_rules ?? {}) as Record<string, unknown>;
  const assignmentRules: AssignmentRules = {};
  if (assignmentRaw.defaultDepartment ?? assignmentRaw.default_department) {
    assignmentRules.defaultDepartment = String(assignmentRaw.defaultDepartment ?? assignmentRaw.default_department).trim();
  }
  if (assignmentRaw.autoAssignUserId ?? assignmentRaw.auto_assign_user_id) {
    const n = Number(assignmentRaw.autoAssignUserId ?? assignmentRaw.auto_assign_user_id);
    if (Number.isInteger(n) && n > 0) assignmentRules.autoAssignUserId = n;
  }
  if (assignmentRaw.allowedAssigneeRole ?? assignmentRaw.allowed_assignee_role) {
    assignmentRules.allowedAssigneeRole = String(assignmentRaw.allowedAssigneeRole ?? assignmentRaw.allowed_assignee_role).trim();
  }

  if (errors.length > 0) return { ok: false, errors };

  const config: TemplateConfig = {
    title,
    description,
    department,
    priority: priority as TaskPriority,
    taskType,
    slaPolicyId: slaPolicyId ?? null,
    checklist,
    evidenceRequirements,
    recurrence: recurrence as TaskRecurrence,
    findingDefaults,
    assignmentRules,
  };
  return { ok: true, errors: [], config };
}

// ─────────────────────────── Snapshot ───────────────────────────

/**
 * The immutable JSON blob copied onto a task when it is instantiated from a
 * template. It captures the configuration AS IT WAS at instantiation time so
 * editing the template later never mutates existing tasks (CORE requirement).
 */
export interface TemplateSnapshot {
  templateId: number;
  templateCode: string;
  templateTitle: string;
  snapshotVersion: number;
  snapshotTakenAt: string;
  title: string;
  description?: string;
  department: string;
  priority: TaskPriority;
  taskType?: string;
  slaPolicyId?: number | null;
  checklist: ChecklistTemplateItem[];
  evidenceRequirements: EvidenceRequirementSpec[];
  recurrence: TaskRecurrence;
  findingDefaults: FindingDefaults;
  assignmentRules: AssignmentRules;
}

/**
 * Build an immutable snapshot from a template row + its parsed config. The
 * caller supplies `now` (ISO) and the template's lifecycle version so the
 * snapshot is deterministic and testable without touching the DB.
 */
export function buildSnapshot(params: {
  templateId: number;
  templateCode: string;
  templateTitle: string;
  version: number;
  now: string;
  config: TemplateConfig;
}): TemplateSnapshot {
  return {
    templateId: params.templateId,
    templateCode: params.templateCode,
    templateTitle: params.templateTitle,
    snapshotVersion: params.version,
    snapshotTakenAt: params.now,
    title: params.config.title,
    description: params.config.description,
    department: params.config.department,
    priority: params.config.priority,
    taskType: params.config.taskType,
    slaPolicyId: params.config.slaPolicyId ?? null,
    checklist: params.config.checklist.map((c, i) => ({ title: c.title, sortOrder: c.sortOrder ?? i })),
    evidenceRequirements: serializeEvidenceRequirements(params.config.evidenceRequirements),
    recurrence: params.config.recurrence,
    findingDefaults: { ...params.config.findingDefaults },
    assignmentRules: { ...params.config.assignmentRules },
  };
}

/**
 * Parse a stored snapshot JSON blob. Tolerant: returns null when the task has no
 * template linkage (legacy tasks), and normalizes the evidence requirements.
 */
export function parseSnapshot(json: string | null | undefined): TemplateSnapshot | null {
  if (!json) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<TemplateSnapshot> & { evidenceRequirements?: unknown };
  if (typeof r.templateId !== 'number') return null;
  try {
    r.evidenceRequirements = normalizeEvidenceRequirements(r.evidenceRequirements);
  } catch {
    r.evidenceRequirements = [];
  }
  return r as TemplateSnapshot;
}

// ─────────────────────────── Form summarization ───────────────────────────

/**
 * A compact summary used by the create-task form to prefill defaults when a
 * template is selected. Strings only — safe to embed in data-* attributes.
 */
export interface TemplateFormSummary {
  id: number;
  code: string;
  title: string;
  description: string;
  department: string;
  priority: string;
  taskType: string;
  recurrence: string;
  slaPolicyId: number | null;
  checklist: ChecklistTemplateItem[];
  evidenceRequirements: EvidenceRequirementSpec[];
  autoAssignUserId: number | null;
}

/**
 * Project a snapshot (or template config) into the form-friendly summary. This
 * is what the NewTaskForm reads to populate fields when a user picks a template.
 */
export function summarizeTemplateForForm(snapshot: TemplateSnapshot): TemplateFormSummary {
  return {
    id: snapshot.templateId,
    code: snapshot.templateCode,
    title: snapshot.title,
    description: snapshot.description ?? '',
    department: snapshot.department,
    priority: snapshot.priority,
    taskType: snapshot.taskType ?? '',
    recurrence: snapshot.recurrence,
    slaPolicyId: snapshot.slaPolicyId ?? null,
    checklist: snapshot.checklist,
    evidenceRequirements: snapshot.evidenceRequirements,
    autoAssignUserId: snapshot.assignmentRules.autoAssignUserId ?? null,
  };
}

// ─────────────────────────── Code (slug) validation ───────────────────────────

/** Validate a template code (URL-safe kebab-case slug). */
export function isValidTemplateCode(code: string): boolean {
  const c = code.trim().toLowerCase();
  return c.length > 0 && c.length <= MAX_TEMPLATE_CODE_LENGTH && SLUG_RE.test(c);
}

/** Produce a slug from arbitrary input (used as a default code suggestion). */
export function slugifyTemplateCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TEMPLATE_CODE_LENGTH);
}
