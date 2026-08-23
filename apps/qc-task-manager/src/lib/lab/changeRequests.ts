// Controlled contributor proposals for laboratory master data.
//
// This module is the only change-request authority. Browser input is converted
// into an already validated canonical form before it reaches the persistence
// functions; proposed_snapshot_json is never accepted from the client.

import type { APIContext } from 'astro';
import { getDb, transaction } from '../db';
import { getCurrentUser } from '../session';
import { setFlash } from '../flash';
import { requireCsrf } from '../api-security';
import { createNotification } from '../notifications';
import { canApproveLabChangeRequest, canReviewLabChangeRequests, canSubmitLabChangeRequest } from '../permissions';
import type { Role } from '../types';
import { labEquipmentSchema, labProductSchema, labCalibrationSchema, labRetestSchema, parseFormData } from '../validation';
import type { LabEquipmentFormData } from './equipment';
import type { LabProductFormData } from './products';
import type { LabCalibrationFormData } from './calibration';
import type { LabRetestFormData } from './retests';
import { createLabEquipment, updateLabEquipment } from './equipment';
import { createLabProduct, updateLabProduct } from './products';
import { createLabCalibration, updateLabCalibration } from './calibration';

export type ChangeEntityType = 'EQUIPMENT' | 'PRODUCT' | 'CALIBRATION' | 'RETEST_REQUEST';
export type ChangeOperation = 'CREATE' | 'UPDATE';
export type ChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export const CHANGE_REQUEST_CONFLICT = 'The target changed after this request was submitted. Review the latest record and resubmit the change.';

export type LabChangePayload =
  | { entity_type: 'EQUIPMENT'; data: LabEquipmentFormData }
  | { entity_type: 'PRODUCT'; data: LabProductFormData }
  | { entity_type: 'CALIBRATION'; data: LabCalibrationFormData }
  | { entity_type: 'RETEST_REQUEST'; data: LabRetestFormData & { original_test_id: number } };

export interface LabChangeRequest {
  id: number;
  entity_type: ChangeEntityType;
  operation: ChangeOperation;
  entity_id: number | null;
  base_updated_at: string | null;
  base_snapshot_json: string | null;
  proposed_snapshot_json: string;
  status: ChangeStatus;
  requested_by: number;
  requested_by_name?: string | null;
  requested_by_role?: Role | null;
  reviewed_by: number | null;
  reviewed_by_name?: string | null;
  review_note: string | null;
  applied_entity_id: number | null;
  created_at: string;
  reviewed_at: string | null;
}

export class LabChangeRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LabChangeRequestError';
  }
}

function json(value: unknown): string { return JSON.stringify(value); }

function audit(requestId: number, actorId: number, action: 'SUBMIT' | 'APPROVAL' | 'REJECTION', oldValue: string | null, newValue: string | null, note: string | null): void {
  getDb().prepare(
    `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note)
     VALUES ('LAB_CHANGE_REQUEST', ?, NULL, ?, ?, ?, ?, ?)`,
  ).run(requestId, actorId, action, oldValue, newValue, note);
}

function getTargetSnapshot(type: ChangeEntityType, id: number): { snapshot: Record<string, unknown>; updated_at: string | null } | null {
  const db = getDb();
  let row: Record<string, unknown> | undefined;
  if (type === 'EQUIPMENT') row = db.prepare('SELECT name, code, location, status_raw, calibration_status_raw, serial_number, notes, is_archived, updated_at FROM lab_equipment WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (type === 'PRODUCT') {
    row = db.prepare('SELECT name, code, description, connector_type, default_test_type, default_template_id, applicable_sop_id, applicable_wi_id, is_active, notes, updated_at FROM lab_products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (row) row.equipment_ids = (db.prepare('SELECT equipment_id FROM lab_product_equipment WHERE product_id = ? ORDER BY equipment_id').all(id) as Array<{ equipment_id: number }>).map((x) => x.equipment_id);
  }
  if (type === 'CALIBRATION') row = db.prepare('SELECT equipment_id, last_calibrated_at, calibration_due_at, provider, certificate_reference, result, next_due_at, notes, created_at AS updated_at FROM lab_equipment_calibration WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (type === 'RETEST_REQUEST') row = db.prepare('SELECT id AS original_test_id FROM lab_test_records WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  const updated = row.updated_at == null ? null : String(row.updated_at);
  delete row.updated_at;
  return { snapshot: row, updated_at: updated };
}

function validatePayload(payload: LabChangePayload): void {
  const result = payload.entity_type === 'EQUIPMENT'
    ? labEquipmentSchema.safeParse(payload.data)
    : payload.entity_type === 'PRODUCT'
      ? labProductSchema.safeParse(payload.data)
      : payload.entity_type === 'CALIBRATION'
        ? labCalibrationSchema.safeParse(payload.data)
        : labRetestSchema.safeParse({ reason: payload.data.reason, reason_note: payload.data.reason_note });
  if (!result.success) throw new LabChangeRequestError(result.error.issues[0]?.message ?? 'Invalid laboratory proposal.');
  if (payload.entity_type === 'RETEST_REQUEST' && (!Number.isInteger(payload.data.original_test_id) || payload.data.original_test_id <= 0)) throw new LabChangeRequestError('A valid original test is required.');
}

export function submitChangeRequest(params: { actor: { id: number; role: Role }; entity_type: ChangeEntityType; operation: ChangeOperation; entity_id?: number | null; payload: LabChangePayload }): LabChangeRequest {
  if (!canSubmitLabChangeRequest(params.actor.role)) throw new LabChangeRequestError('You do not have permission to submit laboratory change requests.');
  if (params.payload.entity_type !== params.entity_type) throw new LabChangeRequestError('The proposal entity does not match the request entity.');
  if (params.entity_type === 'RETEST_REQUEST' && params.operation !== 'CREATE') throw new LabChangeRequestError('Retest requests support CREATE only.');
  validatePayload(params.payload);
  return transaction(() => {
    const db = getDb();
    const entityId = params.entity_id ?? null;
    const base = params.operation === 'UPDATE'
      ? (entityId == null ? null : getTargetSnapshot(params.entity_type, entityId))
      : null;
    if (params.operation === 'UPDATE' && (!entityId || !base)) throw new LabChangeRequestError('The target record does not exist.');
    if (params.operation === 'CREATE' && params.entity_type === 'RETEST_REQUEST') {
      const original = getTargetSnapshot('RETEST_REQUEST', Number((params.payload.data as { original_test_id: number }).original_test_id));
      if (!original) throw new LabChangeRequestError('The original test does not exist.');
    }
    const proposed = json(params.payload.data);
    const inserted = db.prepare(
      `INSERT INTO lab_change_requests (entity_type, operation, entity_id, base_updated_at, base_snapshot_json, proposed_snapshot_json, requested_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(params.entity_type, params.operation, entityId, base?.updated_at ?? null, base ? json(base.snapshot) : null, proposed, params.actor.id);
    const requestId = Number(inserted.lastInsertRowid);
    audit(requestId, params.actor.id, 'SUBMIT', base ? json(base.snapshot) : null, proposed, null);
    const reviewers = db.prepare("SELECT id FROM users WHERE is_active = 1 AND role IN ('manager','admin') AND id <> ?").all(params.actor.id) as Array<{ id: number }>;
    for (const reviewer of reviewers) createNotification({ userId: reviewer.id, taskId: null, type: 'lab_change_review_requested', title: 'Laboratory change request pending', message: `A ${params.operation.toLowerCase()} proposal for ${params.entity_type.toLowerCase()} is awaiting review.`, href: `/lab/change-requests/${requestId}` });
    return getChangeRequest(requestId)!;
  });
}

export function getChangeRequest(id: number): LabChangeRequest | null {
  return (getDb().prepare(`SELECT r.*, u.full_name AS requested_by_name, u.role AS requested_by_role, v.full_name AS reviewed_by_name
    FROM lab_change_requests r JOIN users u ON u.id = r.requested_by LEFT JOIN users v ON v.id = r.reviewed_by WHERE r.id = ?`).get(id) as LabChangeRequest | undefined) ?? null;
}

export function listPendingChangeRequests(): LabChangeRequest[] {
  return getDb().prepare(`SELECT r.*, u.full_name AS requested_by_name, u.role AS requested_by_role FROM lab_change_requests r JOIN users u ON u.id = r.requested_by WHERE r.status = 'PENDING' ORDER BY r.created_at ASC, r.id ASC`).all() as LabChangeRequest[];
}

/** All requests are visible to management; contributors are scoped elsewhere. */
export function listAllChangeRequests(): LabChangeRequest[] {
  return getDb().prepare(`SELECT r.*, u.full_name AS requested_by_name, u.role AS requested_by_role,
    v.full_name AS reviewed_by_name FROM lab_change_requests r JOIN users u ON u.id = r.requested_by
    LEFT JOIN users v ON v.id = r.reviewed_by ORDER BY CASE r.status WHEN 'PENDING' THEN 0 ELSE 1 END,
    r.created_at DESC, r.id DESC`).all() as LabChangeRequest[];
}

export interface ChangeDiffRow { field: string; before: string; proposed: string; }

function displayValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Stable, human-readable top-level diff; raw JSON remains available for diagnostics. */
export function buildChangeDiff(beforeJson: string | null, proposedJson: string): ChangeDiffRow[] {
  let before: Record<string, unknown> = {};
  let proposed: Record<string, unknown> = {};
  try { before = beforeJson ? JSON.parse(beforeJson) as Record<string, unknown> : {}; } catch { /* diagnostics still render */ }
  try { proposed = JSON.parse(proposedJson) as Record<string, unknown>; } catch { return []; }
  const fields = [...new Set([...Object.keys(before), ...Object.keys(proposed)])].sort();
  return fields.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(proposed[field])).map((field) => ({
    field,
    before: displayValue(before[field]),
    proposed: displayValue(proposed[field]),
  }));
}

export interface ChangeRequestPresentation {
  target_label: string;
  target_href: string | null;
  stale: boolean;
  diff: ChangeDiffRow[];
}

function targetLabel(type: ChangeEntityType, id: number | null): string {
  if (id == null) return 'New record';
  const target = getTargetSnapshot(type, id);
  if (!target) return `${type} #${id}`;
  const snapshot = target.snapshot;
  return String(snapshot.code ?? snapshot.serial_number ?? snapshot.name ?? snapshot.test_number ?? `${type} #${id}`);
}

export function isChangeRequestStale(request: Pick<LabChangeRequest, 'entity_type' | 'operation' | 'entity_id' | 'base_updated_at' | 'base_snapshot_json'>): boolean {
  if (request.operation !== 'UPDATE' || request.entity_id == null) return false;
  const current = getTargetSnapshot(request.entity_type, request.entity_id);
  return !current || current.updated_at !== request.base_updated_at || json(current.snapshot) !== request.base_snapshot_json;
}

export function getChangeRequestPresentation(id: number): ChangeRequestPresentation | null {
  const request = getChangeRequest(id);
  if (!request) return null;
  return {
    target_label: targetLabel(request.entity_type, request.entity_id),
    target_href: request.entity_id == null ? null : getChangeRequestTargetHref(request.entity_type, request.entity_id),
    stale: isChangeRequestStale(request),
    diff: request.operation === 'UPDATE' ? buildChangeDiff(request.base_snapshot_json, request.proposed_snapshot_json) : [],
  };
}

function getChangeRequestTargetHref(type: ChangeEntityType, id: number): string | null {
  if (type === 'EQUIPMENT') return `/lab/equipment/${id}`;
  if (type === 'PRODUCT') return `/lab/products/${id}`;
  if (type === 'CALIBRATION') return `/lab/calibration/${id}`;
  if (type === 'RETEST_REQUEST') return `/lab/tests/${id}`;
  return null;
}

export function listUserChangeRequests(userId: number): LabChangeRequest[] {
  return getDb().prepare(`SELECT r.*, u.full_name AS requested_by_name, u.role AS requested_by_role FROM lab_change_requests r JOIN users u ON u.id = r.requested_by WHERE r.requested_by = ? ORDER BY r.created_at DESC, r.id DESC`).all(userId) as LabChangeRequest[];
}

export function countPendingChangeRequests(entityType: ChangeEntityType, entityId: number, requesterId?: number): number {
  const condition = requesterId == null ? 'entity_type = ? AND entity_id = ? AND status = \'PENDING\'' : 'entity_type = ? AND entity_id = ? AND status = \'PENDING\' AND requested_by = ?';
  const params = requesterId == null ? [entityType, entityId] : [entityType, entityId, requesterId];
  return Number((getDb().prepare(`SELECT COUNT(*) AS n FROM lab_change_requests WHERE ${condition}`).get(...params) as { n: number }).n);
}

export function getChangeRequestForViewer(id: number, viewer: { id: number; role: Role }): LabChangeRequest | null {
  const request = getChangeRequest(id);
  if (!request) return null;
  if (canReviewLabChangeRequests(viewer.role) || request.requested_by === viewer.id) return request;
  return null;
}

function applyCanonical(request: LabChangeRequest, actorId: number, data: Record<string, any>): number {
  const db = getDb();
  if (request.entity_type === 'EQUIPMENT') {
    return request.operation === 'CREATE'
      ? createLabEquipment(data as LabEquipmentFormData, actorId)
      : (updateLabEquipment(Number(request.entity_id), data as LabEquipmentFormData, actorId), Number(request.entity_id));
  }
  if (request.entity_type === 'PRODUCT') {
    return request.operation === 'CREATE'
      ? createLabProduct(data as LabProductFormData, actorId)
      : (updateLabProduct(Number(request.entity_id), data as LabProductFormData, actorId), Number(request.entity_id));
  }
  if (request.entity_type === 'CALIBRATION') {
    return request.operation === 'CREATE'
      ? createLabCalibration(data as LabCalibrationFormData, actorId)
      : (updateLabCalibration(Number(request.entity_id), data as LabCalibrationFormData, actorId), Number(request.entity_id));
  }
  if (request.entity_type === 'RETEST_REQUEST') {
    const originalId = Number(data.original_test_id);
    const original = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(originalId) as Record<string, any> | undefined;
    if (!original) throw new LabChangeRequestError('Original test not found.');
    if (!['APPROVED', 'REJECTED', 'VOID'].includes(String(original.status))) throw new LabChangeRequestError('The original test is not eligible for a retest.');
    const count = Number((db.prepare('SELECT COUNT(*) AS n FROM lab_test_retests WHERE original_test_id = ?').get(originalId) as { n: number }).n);
    const digits = String(original.test_number).replace(/^LAB-TEST-/, '');
    const retestNumber = `LAB-RETEST-${digits}-${String(count + 1).padStart(2, '0')}`;
    const retest = db.prepare(`INSERT INTO lab_test_retests (retest_number, original_test_id, reason, reason_note, status, original_result, original_status, created_by) VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)`).run(retestNumber, originalId, data.reason, data.reason_note, original.final_result ?? null, original.status, actorId);
    const retestId = Number(retest.lastInsertRowid);
    const newTest = db.prepare(`INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number, sampling_area, medium_used, connector_type, sample_count, status, tested_by, created_by, template_id, template_version_id, sop_version_id, wi_version_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL, ?, ?, ?, ?, ?)`).run(
      `PENDING-CR-${request.id}`, original.test_type, original.product_id ?? null, original.equipment_id ?? null, original.lot_number ?? null, original.sampling_area ?? null, original.medium_used ?? null, original.connector_type ?? null, original.sample_count ?? 5, actorId, original.template_id ?? null, original.template_version_id ?? null, original.sop_version_id ?? null, original.wi_version_id ?? null,
    );
    const newTestId = Number(newTest.lastInsertRowid);
    db.prepare('UPDATE lab_test_retests SET new_test_id=?, updated_at=datetime(\'now\') WHERE id=?').run(newTestId, retestId);
    db.prepare(`INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, note) VALUES ('LAB_RETEST', ?, NULL, ?, 'CREATE', ?)`).run(retestId, actorId, `created by change request #${request.id}`);
    db.prepare(`INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, note) VALUES ('LAB_TEST', ?, NULL, ?, 'LINK', ?)`).run(originalId, actorId, `retest ${retestNumber} → test ${newTestId}`);
    return retestId;
  }
  throw new LabChangeRequestError('Unsupported laboratory change entity.');
}

export function approveChangeRequest(id: number, actor: { id: number; role: Role }, reviewNote = ''): LabChangeRequest {
  const request = getChangeRequest(id);
  if (!request) throw new LabChangeRequestError('Change request not found.');
  if (!canApproveLabChangeRequest(actor, request)) throw new LabChangeRequestError('You cannot approve this change request.');
  if (request.status !== 'PENDING') throw new LabChangeRequestError('This change request has already been reviewed.');
  const proposed = JSON.parse(request.proposed_snapshot_json) as Record<string, any>;
  validatePayload({ entity_type: request.entity_type, data: proposed } as LabChangePayload);
  return transaction(() => {
    const current = request.entity_id == null ? null : getTargetSnapshot(request.entity_type, request.entity_id);
    if (request.operation === 'UPDATE' && (!current || current.updated_at !== request.base_updated_at || json(current.snapshot) !== request.base_snapshot_json)) {
      throw new LabChangeRequestError(CHANGE_REQUEST_CONFLICT);
    }
    const appliedId = applyCanonical(request, actor.id, proposed);
    const changed = getDb().prepare(`UPDATE lab_change_requests SET status='APPROVED', reviewed_by=?, review_note=?, applied_entity_id=?, reviewed_at=datetime('now') WHERE id=? AND status='PENDING'`).run(actor.id, reviewNote || null, appliedId, id);
    if (changed.changes !== 1) throw new LabChangeRequestError('This change request has already been reviewed.');
    audit(id, actor.id, 'APPROVAL', request.proposed_snapshot_json, request.proposed_snapshot_json, reviewNote || null);
    createNotification({ userId: request.requested_by, taskId: null, type: 'lab_change_review_approved', title: 'Laboratory change request approved', message: `Your laboratory ${request.entity_type.toLowerCase()} proposal was approved.`, href: `/lab/change-requests/${id}` });
    return getChangeRequest(id)!;
  });
}

export function rejectChangeRequest(id: number, actor: { id: number; role: Role }, reviewNote: string): LabChangeRequest {
  const request = getChangeRequest(id);
  if (!request) throw new LabChangeRequestError('Change request not found.');
  if (!canApproveLabChangeRequest(actor, request)) throw new LabChangeRequestError('You cannot reject this change request.');
  if (request.status !== 'PENDING') throw new LabChangeRequestError('This change request has already been reviewed.');
  if (reviewNote.trim().length < 3) throw new LabChangeRequestError('A meaningful review note is required when rejecting a request.');
  return transaction(() => {
    const changed = getDb().prepare(`UPDATE lab_change_requests SET status='REJECTED', reviewed_by=?, review_note=?, reviewed_at=datetime('now') WHERE id=? AND status='PENDING'`).run(actor.id, reviewNote.trim(), id);
    if (changed.changes !== 1) throw new LabChangeRequestError('This change request has already been reviewed.');
    audit(id, actor.id, 'REJECTION', request.proposed_snapshot_json, null, reviewNote.trim());
    createNotification({ userId: request.requested_by, taskId: null, type: 'lab_change_review_rejected', title: 'Laboratory change request rejected', message: `Your laboratory ${request.entity_type.toLowerCase()} proposal was rejected: ${reviewNote.trim()}`, href: `/lab/change-requests/${id}` });
    return getChangeRequest(id)!;
  });
}

export function cancelOwnPendingChangeRequest(id: number, actorId: number): boolean {
  return getDb().prepare("UPDATE lab_change_requests SET status='REJECTED', reviewed_by=?, review_note='Cancelled by requester', reviewed_at=datetime('now') WHERE id=? AND requested_by=? AND status='PENDING'").run(actorId, id, actorId).changes === 1;
}

function field(form: FormData, name: string): string | null { const value = form.get(name); return value == null ? null : String(value); }
function formObject(form: FormData, names: string[]): Record<string, unknown> { return Object.fromEntries(names.map((name) => [name, field(form, name)])); }

export async function handleLabChangeRequestSubmitPost(context: APIContext): Promise<Response> {
  const user = getCurrentUser(context); if (!user) return context.redirect('/login');
  const csrf = requireCsrf(context); if (csrf) return csrf;
  const form = await context.request.formData();
  const type = field(form, 'entity_type') as ChangeEntityType | null;
  const operation = field(form, 'operation') as ChangeOperation | null;
  const entityIdRaw = field(form, 'entity_id'); const entityId = entityIdRaw ? Number(entityIdRaw) : null;
  try {
    let payload: LabChangePayload;
    if (type === 'EQUIPMENT') payload = { entity_type: type, data: (labEquipmentSchema.parse(formObject(form, ['name','code','location','status_raw','calibration_status_raw','serial_number','notes']))) as LabEquipmentFormData };
    else if (type === 'PRODUCT') payload = { entity_type: type, data: { ...labProductSchema.parse(formObject(form, ['name','code','description','connector_type','default_test_type','default_template_id','applicable_sop_id','applicable_wi_id','is_active','notes'])), equipment_ids: form.getAll('equipment_ids').map(Number) } as LabProductFormData };
    else if (type === 'CALIBRATION') payload = { entity_type: type, data: labCalibrationSchema.parse(formObject(form, ['equipment_id','last_calibrated_at','calibration_due_at','provider','certificate_reference','result','next_due_at','notes'])) as LabCalibrationFormData };
    else if (type === 'RETEST_REQUEST') payload = { entity_type: type, data: { ...labRetestSchema.parse(formObject(form, ['reason','reason_note'])), original_test_id: Number(field(form, 'original_test_id')) } as LabRetestFormData & { original_test_id: number } };
    else throw new LabChangeRequestError('Select a valid laboratory entity.');
    if (operation !== 'CREATE' && operation !== 'UPDATE') throw new LabChangeRequestError('Select a valid operation.');
    if (operation === 'UPDATE') throw new LabChangeRequestError('Edit the canonical record to submit an update proposal.');
    submitChangeRequest({ actor: { id: user.id, role: user.role }, entity_type: type!, operation, entity_id: entityId, payload });
    setFlash(context, 'success', 'Your laboratory change request was submitted for review.');
  } catch (error) { setFlash(context, 'error', error instanceof Error ? error.message : 'Could not submit the change request.'); }
  return context.redirect('/lab/change-requests');
}

export async function handleLabChangeRequestReviewPost(context: APIContext, id: number): Promise<Response> {
  const user = getCurrentUser(context); if (!user) return context.redirect('/login');
  const csrf = requireCsrf(context); if (csrf) return csrf;
  if (!canReviewLabChangeRequests(user.role)) { setFlash(context, 'error', 'Only managers and administrators can review change requests.'); return context.redirect('/lab/change-requests'); }
  const form = await context.request.formData();
  const parsed = parseFormData((await import('../validation')).labChangeRequestReviewSchema, form);
  if (!parsed.ok) { setFlash(context, 'error', parsed.error); return context.redirect('/lab/change-requests'); }
  const { action, review_note: note } = parsed.data;
  try { if (action === 'approve') approveChangeRequest(id, { id: user.id, role: user.role }, note); else rejectChangeRequest(id, { id: user.id, role: user.role }, note); setFlash(context, 'success', `Change request ${action}d.`); }
  catch (error) { setFlash(context, 'error', error instanceof Error ? error.message : 'Could not review the change request.'); }
  return context.redirect('/lab/change-requests');
}
