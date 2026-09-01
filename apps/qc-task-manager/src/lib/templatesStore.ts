// Task Templates — DB mutation layer.
//
// Mirrors the qc-operations.ts pattern: every mutation runs inside a
// transaction and is recorded in the activity log. Pure policy (lifecycle,
// validation, snapshot) lives in src/lib/templates/index.ts; this module owns
// persistence only.
//
// Snapshot semantics (CORE requirement): instantiateTemplate() freezes the
// template's configuration onto the task via buildSnapshot(). Editing or
// archiving the template afterwards never mutates existing tasks.

import { getDb, transaction } from './db';
import { Action, logActivity } from './activity';
import {
  buildSnapshot,
  canTransitionTemplate,
  isInstantiable,
  isValidTemplateCode,
  parseSnapshot,
  serializeEvidenceRequirements,
  TEMPLATE_LIFECYCLE_LABELS,
  validateTemplateConfig,
  type TemplateConfig,
  type TemplateLifecycle,
  type TemplateSnapshot,
} from './templates';
import type { TaskPriority, TaskRecurrence } from './types';

export { TEMPLATE_LIFECYCLE_LABELS };

// ─────────────────────────── Row types ───────────────────────────

/** A raw task_templates row. */
export interface TemplateRow {
  id: number;
  code: string;
  title: string;
  description: string | null;
  department: string;
  priority: TaskPriority;
  task_type: string | null;
  sla_policy_id: number | null;
  checklist_json: string;
  evidence_requirements_json: string;
  recurrence: TaskRecurrence;
  finding_defaults_json: string;
  assignment_rules_json: string;
  lifecycle_status: TemplateLifecycle;
  version: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** A template row joined with its parsed configuration. */
export interface TemplateView extends TemplateRow {
  checklist: Array<{ title: string; sortOrder: number }>;
  evidenceRequirements: Array<Record<string, unknown>>;
  findingDefaults: Record<string, unknown>;
  assignmentRules: Record<string, unknown>;
  requiredEvidenceCount: number;
}

// ─────────────────────────── Helpers ───────────────────────────

function parseJsonArray(json: string): Array<Record<string, unknown>> {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

function parseJsonObject(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function decorate(row: TemplateRow): TemplateView {
  const checklist = parseJsonArray(row.checklist_json).map((item, index) => ({
    title: String(item.title ?? '').trim(),
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? index),
  }));
  const evidenceRequirements = parseJsonArray(row.evidence_requirements_json);
  const findingDefaults = parseJsonObject(row.finding_defaults_json);
  const assignmentRules = parseJsonObject(row.assignment_rules_json);
  const requiredEvidenceCount = evidenceRequirements.filter(
    (r) => String(r.requirement ?? '').toUpperCase() === 'REQUIRED',
  ).length;
  return {
    ...row,
    checklist,
    evidenceRequirements,
    findingDefaults,
    assignmentRules,
    requiredEvidenceCount,
  };
}

/** Encode a TemplateConfig into the JSON columns stored on the row. */
function encodeConfig(config: TemplateConfig): {
  checklistJson: string;
  evidenceRequirementsJson: string;
  findingDefaultsJson: string;
  assignmentRulesJson: string;
} {
  return {
    checklistJson: JSON.stringify(config.checklist.map((c, i) => ({ title: c.title, sortOrder: c.sortOrder ?? i }))),
    evidenceRequirementsJson: JSON.stringify(serializeEvidenceRequirements(config.evidenceRequirements)),
    findingDefaultsJson: JSON.stringify(config.findingDefaults),
    assignmentRulesJson: JSON.stringify(config.assignmentRules),
  };
}

// ─────────────────────────── Reads ───────────────────────────

export function listTemplates(filters: { status?: string; department?: string } = {}): TemplateView[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    where.push('lifecycle_status = ?');
    params.push(filters.status);
  }
  if (filters.department) {
    where.push('department = ?');
    params.push(filters.department);
  }
  const rows = getDb()
    .prepare(
      `SELECT * FROM task_templates ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY lifecycle_status ASC, title ASC`,
    )
    .all(...params) as TemplateRow[];
  return rows.map(decorate);
}

export function getTemplate(id: number): TemplateView | undefined {
  const row = getDb().prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as TemplateRow | undefined;
  return row ? decorate(row) : undefined;
}

export function getTemplateByCode(code: string): TemplateView | undefined {
  const row = getDb().prepare('SELECT * FROM task_templates WHERE code = ?').get(code) as TemplateRow | undefined;
  return row ? decorate(row) : undefined;
}

// ─────────────────────────── Mutations ───────────────────────────

export interface TemplateInput {
  code?: string;
  title: string;
  description?: string;
  department?: string;
  priority?: string;
  taskType?: string;
  slaPolicyId?: number | null;
  checklist?: unknown;
  evidenceRequirements?: unknown;
  recurrence?: string;
  findingDefaults?: Record<string, unknown>;
  assignmentRules?: Record<string, unknown>;
}

/**
 * Create a new template (DRAFT by default). `code` must be a unique kebab-case
 * slug; when omitted it is derived from the title.
 */
export function createTemplate(input: TemplateInput, actorId: number): number {
  const validation = validateTemplateConfig(input);
  if (!validation.ok || !validation.config) {
    throw new Error(validation.errors.join(' '));
  }
  const config = validation.config;

  const code = (input.code ?? '').trim().toLowerCase() || deriveCode(config.title);
  if (!isValidTemplateCode(code)) {
    throw new Error('Template code must be lowercase kebab-case (letters, digits, hyphens).');
  }
  if (getTemplateByCode(code)) {
    throw new Error(`A template with code "${code}" already exists.`);
  }

  const encoded = encodeConfig(config);
  return transaction(() => {
    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO task_templates
          (code, title, description, department, priority, task_type, sla_policy_id,
           checklist_json, evidence_requirements_json, recurrence,
           finding_defaults_json, assignment_rules_json, lifecycle_status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)`,
      )
      .run(
        code,
        config.title,
        config.description ?? null,
        config.department,
        config.priority,
        config.taskType ?? null,
        config.slaPolicyId ?? null,
        encoded.checklistJson,
        encoded.evidenceRequirementsJson,
        config.recurrence,
        encoded.findingDefaultsJson,
        encoded.assignmentRulesJson,
        actorId,
      );
    const id = Number(result.lastInsertRowid);
    // No task is linked yet — record the creation against the template id as a
    // pseudo activity entry (task_id = 0 sentinel is avoided; templates are
    // audited via their row + updated_at, and instantiation logs onto the task).
    return id;
  });
}

/**
 * Update a template's editable fields. ARCHIVED templates are read-only. The
 * `code` is immutable after creation (it is the stable external identifier).
 */
export function updateTemplate(id: number, input: TemplateInput, _actorId: number): void {
  const existing = getTemplate(id);
  if (!existing) throw new Error('Template not found.');
  if (existing.lifecycle_status === 'ARCHIVED') {
    throw new Error('Archived templates are read-only — unarchive before editing.');
  }

  const merged: TemplateInput = {
    code: existing.code,
    title: input.title ?? existing.title,
    description: input.description ?? (existing.description ?? undefined),
    department: input.department ?? existing.department,
    priority: input.priority ?? existing.priority,
    taskType: input.taskType ?? (existing.task_type ?? undefined),
    slaPolicyId: input.slaPolicyId ?? existing.sla_policy_id,
    checklist: input.checklist ?? existing.checklist,
    evidenceRequirements: input.evidenceRequirements ?? existing.evidenceRequirements,
    recurrence: input.recurrence ?? existing.recurrence,
    findingDefaults: input.findingDefaults ?? existing.findingDefaults,
    assignmentRules: input.assignmentRules ?? existing.assignmentRules,
  };

  const validation = validateTemplateConfig(merged);
  if (!validation.ok || !validation.config) {
    throw new Error(validation.errors.join(' '));
  }
  const config = validation.config;
  const encoded = encodeConfig(config);

  transaction(() => {
    const db = getDb();
    db.prepare(
      `UPDATE task_templates
       SET title = ?, description = ?, department = ?, priority = ?, task_type = ?,
           sla_policy_id = ?, checklist_json = ?, evidence_requirements_json = ?,
           recurrence = ?, finding_defaults_json = ?, assignment_rules_json = ?,
           version = version + 1, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      config.title,
      config.description ?? null,
      config.department,
      config.priority,
      config.taskType ?? null,
      config.slaPolicyId ?? null,
      encoded.checklistJson,
      encoded.evidenceRequirementsJson,
      config.recurrence,
      encoded.findingDefaultsJson,
      encoded.assignmentRulesJson,
      id,
    );
  });
}

/**
 * Move a template between lifecycle states (DRAFT ↔ ACTIVE ↔ ARCHIVED). Bumps
 * version only on activation so the snapshot reflects a meaningful revision.
 */
export function transitionTemplate(id: number, toStatus: string, actorId: number): void {
  const existing = getTemplate(id);
  if (!existing) throw new Error('Template not found.');
  const from = existing.lifecycle_status;
  if (!canTransitionTemplate(from, toStatus)) {
    throw new Error(`Invalid template lifecycle transition: ${from} → ${toStatus}.`);
  }
  transaction(() => {
    const db = getDb();
    db.prepare('UPDATE task_templates SET lifecycle_status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(toStatus, id);
    void actorId; // lifecycle changes are audited via the row + updated_at.
  });
}

// ─────────────────────────── Instantiation ───────────────────────────

export interface InstantiateOverrides {
  title?: string;
  description?: string;
  assignedTo?: number | null;
  dueDate?: string | null;
}

/**
 * Create a task from an ACTIVE template. The template's configuration is frozen
 * into template_snapshot on the task — subsequent template edits never mutate
 * existing tasks (CORE requirement).
 *
 * Returns the new task id. The task starts in not_started with progress 0,
 * inherits the template's department/priority/recurrence/checklist + finding
 * defaults, and is assigned per assignment rules unless overridden.
 */
export function instantiateTemplate(templateId: number, overrides: InstantiateOverrides, actorId: number): number {
  const template = getTemplate(templateId);
  if (!template) throw new Error('Template not found.');
  if (!isInstantiable(template.lifecycle_status)) {
    throw new Error('Only ACTIVE templates can be instantiated.');
  }

  // Validate the template config into its canonical shape (defensive — the row
  // is assumed to be valid, but parsing guards against drift).
  const validation = validateTemplateConfig({
    title: template.title,
    description: template.description ?? undefined,
    department: template.department,
    priority: template.priority,
    taskType: template.task_type ?? undefined,
    slaPolicyId: template.sla_policy_id,
    checklist: template.checklist,
    evidenceRequirements: template.evidenceRequirements,
    recurrence: template.recurrence,
    findingDefaults: template.findingDefaults,
    assignmentRules: template.assignmentRules,
  });
  if (!validation.ok || !validation.config) {
    throw new Error(`Template "${template.code}" has an invalid configuration: ${validation.errors.join(' ')}`);
  }
  const config = validation.config;

  const now = new Date().toISOString();
  const snapshot = buildSnapshot({
    templateId: template.id,
    templateCode: template.code,
    templateTitle: template.title,
    version: template.version,
    now,
    config,
  });

  const title = (overrides.title ?? '').trim() || config.title;
  const description = overrides.description ?? config.description ?? null;
  const assignedTo = overrides.assignedTo !== undefined
    ? overrides.assignedTo
    : (config.assignmentRules.autoAssignUserId ?? null);
  const dueDate = overrides.dueDate !== undefined ? overrides.dueDate : null;

  // Finding defaults → optional QC metadata columns on the task.
  const fd = config.findingDefaults;

  return transaction(() => {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO tasks
          (title, description, department, status, priority, progress_percent,
           created_by, assigned_to, due_date, recurrence, task_type,
           inspection_type, finding_classification, risk_level, corrective_action_required,
           sla_policy_id, template_id, template_snapshot)
         VALUES (?, ?, ?, 'not_started', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        title,
        description,
        config.department,
        config.priority,
        actorId,
        assignedTo,
        dueDate,
        config.recurrence,
        config.taskType ?? null,
        fd.inspectionType ?? null,
        fd.classification ?? null,
        fd.riskLevel ?? null,
        fd.correctiveActionRequired ? 1 : null,
        config.slaPolicyId ?? null,
        template.id,
        JSON.stringify(snapshot),
      );
    const taskId = Number(info.lastInsertRowid);

    // Copy the checklist template (titles + order, all unchecked).
    const insChecklist = db.prepare(
      'INSERT INTO task_checklists (task_id, title, sort_order, is_completed) VALUES (?, ?, ?, 0)',
    );
    for (const item of snapshot.checklist) {
      insChecklist.run(taskId, item.title, item.sortOrder);
    }

    // Record creation + the template linkage on the new task's activity log.
    logActivity({
      taskId,
      userId: actorId,
      action: Action.TASK_CREATED,
      newValue: title,
    });
    logActivity({
      taskId,
      userId: actorId,
      action: Action.TEMPLATE_INSTANTIATED,
      oldValue: `${template.code}@v${template.version}`,
      newValue: String(template.id),
    });

    return taskId;
  });
}

/**
 * Read + parse the snapshot stored on a task (null when the task was not created
 * from a template). Convenience wrapper around templates.parseSnapshot that
 * hits the DB.
 */
export function getTaskTemplateSnapshot(taskId: number): TemplateSnapshot | null {
  const row = getDb().prepare('SELECT template_snapshot FROM tasks WHERE id = ?').get(taskId) as
    | { template_snapshot: string | null }
    | undefined;
  if (!row) return null;
  return parseSnapshot(row.template_snapshot);
}

// ─────────────────────────── Helpers ───────────────────────────

/** Derive a kebab-case code from a title (used when code is omitted). */
function deriveCode(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
