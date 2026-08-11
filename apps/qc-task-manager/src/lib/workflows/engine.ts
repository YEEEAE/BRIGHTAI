import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { getDb } from '../db';
import { logActivity, Action } from '../activity';
import type { Role, WorkflowDefinition, WorkflowInstance, WorkflowStep } from '../types';

type Db = BetterSqliteDatabase;
type DefinitionRow = WorkflowDefinition & { step_json?: string };

function definitionForTask(task: { risk_level?: string | null; finding_classification?: string | null }, db: Db): DefinitionRow {
  const appliesTo = task.risk_level === 'critical' || task.finding_classification === 'critical' ? 'critical' : 'normal';
  const row = db.prepare(
    `SELECT id, code, name, applies_to, version, is_active,
            (SELECT json_group_array(json_object('id', s.id, 'step_key', s.step_key, 'label', s.label, 'role', s.role, 'step_order', s.step_order, 'is_required', s.is_required, 'approval_type', s.approval_type, 'sla_seconds', s.sla_seconds))
             FROM workflow_steps s WHERE s.definition_id = d.id ORDER BY s.step_order) AS step_json
     FROM workflow_definitions d WHERE d.applies_to = ? AND d.is_active = 1
     ORDER BY d.version DESC, d.id DESC LIMIT 1`,
  ).get(appliesTo) as DefinitionRow | undefined;
  if (!row) throw new Error(`No active ${appliesTo} workflow definition is configured.`);
  return { ...row, steps: JSON.parse(row.step_json ?? '[]') as WorkflowStep[] };
}

export function snapshotDefinition(definition: WorkflowDefinition): string {
  return JSON.stringify({ id: definition.id, code: definition.code, name: definition.name, applies_to: definition.applies_to, version: definition.version, steps: definition.steps.map((step) => ({ ...step })) });
}

export function createWorkflowInstance(taskId: number, createdBy: number, db: Db = getDb()): number {
  const existing = db.prepare('SELECT id FROM workflow_instances WHERE task_id = ?').get(taskId) as { id: number } | undefined;
  if (existing) return existing.id;
  const task = db.prepare('SELECT risk_level, finding_classification FROM tasks WHERE id = ?').get(taskId) as { risk_level: string | null; finding_classification: string | null } | undefined;
  if (!task) throw new Error('Task not found.');
  const definition = definitionForTask(task, db);
  const snapshot = snapshotDefinition(definition);
  const tx = db.transaction(() => {
    const result = db.prepare(
      `INSERT INTO workflow_instances (task_id, definition_id, definition_code, definition_version, definition_snapshot, current_step_order, status, created_by)
       VALUES (?, ?, ?, ?, ?, 1, 'ACTIVE', ?)`,
    ).run(taskId, definition.id, definition.code, definition.version, snapshot, createdBy);
    const instanceId = Number(result.lastInsertRowid);
    db.prepare(`INSERT INTO workflow_actions (instance_id, step_order, action, previous_state, next_state, reason, actor_id) VALUES (?, 1, 'SUBMITTED', 'NEW', ?, NULL, ?)`).run(instanceId, definition.steps[0]?.step_key ?? 'employee', definition.steps[0]?.step_order ? createdBy : createdBy);
    return instanceId;
  });
  return tx();
}

function parseInstance(row: any): WorkflowInstance {
  return { ...row, definition_snapshot: JSON.parse(row.definition_snapshot) as WorkflowDefinition } as WorkflowInstance;
}

export function getWorkflowInstance(taskId: number, db: Db = getDb()): WorkflowInstance | null {
  const row = db.prepare('SELECT * FROM workflow_instances WHERE task_id = ?').get(taskId);
  return row ? parseInstance(row) : null;
}

export function workflowForTask(taskId: number, db: Db = getDb()): WorkflowInstance | null {
  return getWorkflowInstance(taskId, db);
}

export function getCurrentWorkflowStep(instance: WorkflowInstance): WorkflowStep | null {
  return instance.definition_snapshot.steps.find((step) => step.step_order === instance.current_step_order) ?? null;
}

function canAct(step: WorkflowStep, actor: { id: number; role: Role }, task: any): boolean {
  if (actor.role === 'admin') return true;
  if (actor.role !== step.role) return false;
  return step.role !== 'employee' || task.assigned_to === actor.id || task.created_by === actor.id;
}

export function approveWorkflowStep(taskId: number, actor: { id: number; role: Role }, reason: string | null = null, db: Db = getDb()): WorkflowInstance {
  const instance = getWorkflowInstance(taskId, db);
  if (!instance || instance.status === 'COMPLETED') throw new Error('Workflow instance is not active.');
  const step = getCurrentWorkflowStep(instance);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!step || !task || !canAct(step, actor, task)) throw new Error('Actor is not allowed to approve this workflow step.');
  const next = instance.definition_snapshot.steps.find((candidate) => candidate.step_order > step.step_order);
  if (!next) throw new Error('The final workflow step must be closed, not approved.');
  db.transaction(() => {
    db.prepare(`UPDATE workflow_instances SET current_step_order = ?, status = 'ACTIVE', updated_at = datetime('now') WHERE id = ?`).run(next.step_order, instance.id);
    db.prepare(`INSERT INTO workflow_actions (instance_id, step_order, action, previous_state, next_state, reason, actor_id) VALUES (?, ?, 'APPROVED', ?, ?, ?, ?)`).run(instance.id, step.step_order, step.step_key, next.step_key, reason, actor.id);
    logActivity({ taskId, userId: actor.id, action: Action.WORKFLOW_APPROVED, oldValue: step.label, newValue: next.label });
  })();
  return getWorkflowInstance(taskId, db) as WorkflowInstance;
}

export function rejectWorkflowStep(taskId: number, actor: { id: number; role: Role }, reason: string, db: Db = getDb()): WorkflowInstance {
  const cleanReason = reason.trim();
  if (!cleanReason) throw new Error('Rejection reason is required.');
  const instance = getWorkflowInstance(taskId, db);
  if (!instance || instance.status === 'COMPLETED') throw new Error('Workflow instance is not active.');
  const step = getCurrentWorkflowStep(instance);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!step || !task || !canAct(step, actor, task)) throw new Error('Actor is not allowed to reject this workflow step.');
  const previous = instance.definition_snapshot.steps.find((candidate) => candidate.step_order < step.step_order) ?? step;
  db.transaction(() => {
    db.prepare(`UPDATE workflow_instances SET current_step_order = ?, status = 'REJECTED', updated_at = datetime('now') WHERE id = ?`).run(previous.step_order, instance.id);
    db.prepare(`INSERT INTO workflow_actions (instance_id, step_order, action, previous_state, next_state, reason, actor_id) VALUES (?, ?, 'REJECTED', ?, ?, ?, ?)`).run(instance.id, step.step_order, step.step_key, previous.step_key, cleanReason, actor.id);
    logActivity({ taskId, userId: actor.id, action: Action.WORKFLOW_REJECTED, oldValue: step.label, newValue: `${previous.label}: ${cleanReason}` });
  })();
  return getWorkflowInstance(taskId, db) as WorkflowInstance;
}

export function canCloseTaskWithWorkflow(taskId: number, actor: { id: number; role: Role }, db: Db = getDb()): boolean {
  const instance = getWorkflowInstance(taskId, db);
  if (!instance) return true;
  const step = getCurrentWorkflowStep(instance);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!step || !task || instance.status === 'COMPLETED') return false;
  const final = instance.definition_snapshot.steps.at(-1);
  const canCloseCurrent = !!final && step.step_order === final.step_order && canAct(step, actor, task);
  const next = instance.definition_snapshot.steps.find((candidate) => candidate.step_order === step.step_order + 1);
  const canCloseIntoFinal = !!final && next?.step_order === final.step_order && canAct(step, actor, task);
  return canCloseCurrent || canCloseIntoFinal;
}

export function closeWorkflowInstance(taskId: number, actor: { id: number; role: Role }, db: Db = getDb()): void {
  const instance = getWorkflowInstance(taskId, db);
  if (!instance || !canCloseTaskWithWorkflow(taskId, actor, db)) throw new Error('Workflow approvals are incomplete.');
  const step = getCurrentWorkflowStep(instance) as WorkflowStep;
  db.transaction(() => {
    db.prepare(`UPDATE workflow_instances SET status = 'COMPLETED', updated_at = datetime('now'), completed_at = datetime('now') WHERE id = ?`).run(instance.id);
    db.prepare(`INSERT INTO workflow_actions (instance_id, step_order, action, previous_state, next_state, reason, actor_id) VALUES (?, ?, 'CLOSED', ?, 'CLOSED', NULL, ?)`).run(instance.id, step.step_order, step.step_key, actor.id);
    logActivity({ taskId, userId: actor.id, action: Action.WORKFLOW_CLOSED, oldValue: step.label, newValue: 'Closed' });
  })();
}

export type WorkflowTransitionRequest = { taskId: number; actorId: number; action: 'approve' | 'reject' | 'close'; reason?: string | null };
