// QC Laboratory Audit Timeline (read-only view over the ONE shared audit log).
//
// This module renders a human-readable laboratory audit timeline — who did
// what, when, the value before, the value after, and the reason — strictly
// from `qc_audit_log` rows written by the lab service modules (tests, review,
// equipment, calibration, products, templates, documents, acknowledgements,
// finding links, retests). It NEVER writes, NEVER derives a second history,
// and NEVER invents events: if a row is absent from qc_audit_log it is absent
// from the timeline (verified by QC-LAB-AUDIT-COVERAGE-001 — every executed
// mutating path already audits inside its transaction).
//
// Reuse contract: qc_audit_log is the single audit system (migration 011
// extended its CHECK for LAB_* entities). old_value/new_value carry status
// transitions (e.g. SUBMITTED → UNDER_REVIEW) and note carries the human
// reason (reject / request-changes reasons are mandatory, §22) or a compact
// metadata summary written by the owning module.

import type { Database as Db } from 'better-sqlite3';
import { getDb } from '../db';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../pagination';

export type LabAuditEntity =
  | 'LAB_TEST'
  | 'LAB_RETEST'
  | 'LAB_PRODUCT'
  | 'LAB_TEMPLATE'
  | 'LAB_EQUIPMENT'
  | 'LAB_EQUIPMENT_MAINTENANCE'
  | 'LAB_EQUIPMENT_CALIBRATION'
  | 'LAB_DOCUMENT'
  | 'LAB_DOCUMENT_VERSION'
  | 'LAB_CHANGE_REQUEST';

export const LAB_AUDIT_ENTITIES: readonly LabAuditEntity[] = [
  'LAB_TEST',
  'LAB_RETEST',
  'LAB_PRODUCT',
  'LAB_TEMPLATE',
  'LAB_EQUIPMENT',
  'LAB_EQUIPMENT_MAINTENANCE',
  'LAB_EQUIPMENT_CALIBRATION',
  'LAB_DOCUMENT',
  'LAB_DOCUMENT_VERSION',
  'LAB_CHANGE_REQUEST',
];

/** Actions allowed by the extended qc_audit_log CHECK (migration 011). */
export const LAB_AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'STATUS_TRANSITION',
  'SUBMIT',
  'REQUEST_CHANGES',
  'REJECTION',
  'APPROVAL',
  'VOID',
  'SUPERSEDE',
  'ACKNOWLEDGE',
  'LINK',
  'UNLINK',
  'VERSION',
  'CLOSURE',
  'REOPEN',
] as const;
export type LabAuditActionName = (typeof LAB_AUDIT_ACTIONS)[number];

export const LAB_AUDIT_ENTITY_LABELS: Record<LabAuditEntity, string> = {
  LAB_TEST: 'Test',
  LAB_RETEST: 'Retest',
  LAB_PRODUCT: 'Product',
  LAB_TEMPLATE: 'Template',
  LAB_EQUIPMENT: 'Equipment',
  LAB_EQUIPMENT_MAINTENANCE: 'Maintenance',
  LAB_EQUIPMENT_CALIBRATION: 'Calibration',
  LAB_DOCUMENT: 'Document',
  LAB_DOCUMENT_VERSION: 'Document version',
  LAB_CHANGE_REQUEST: 'Change request',
};

/** Sentence verb per audit action — powers the readable "what" phrase. */
export const LAB_AUDIT_ACTION_VERBS: Record<LabAuditActionName, string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  STATUS_TRANSITION: 'changed the status of',
  SUBMIT: 'submitted',
  REQUEST_CHANGES: 'requested changes on',
  REJECTION: 'rejected',
  APPROVAL: 'approved',
  VOID: 'voided',
  SUPERSEDE: 'superseded',
  ACKNOWLEDGE: 'acknowledged',
  LINK: 'linked',
  UNLINK: 'unlinked',
  VERSION: 'created a new version of',
  CLOSURE: 'closed',
  REOPEN: 'reopened',
};

/** Actor role display labels for the readable "who" phrase. */
export const LAB_AUDIT_ROLE_LABELS: Record<string, string> = {
  employee: 'Employee',
  supervisor: 'Reviewer',
  manager: 'QC Manager',
  admin: 'Administrator',
};

export const LAB_AUDIT_PER_PAGE_OPTIONS = PER_PAGE_OPTIONS;
export const DEFAULT_LAB_AUDIT_PER_PAGE = DEFAULT_PER_PAGE;

export interface LabAuditTimelineEntry {
  id: number;
  created_at: string;
  actor_id: number;
  actor_name: string | null;
  actor_role: string | null;
  entity_type: LabAuditEntity;
  entity_id: number;
  action: LabAuditActionName;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  /** Human record reference from the owning register (e.g. LAB-TEST-00081). */
  record_label: string | null;
  /** Link into the owning record where an implemented route exists. */
  href: string | null;
}

export interface LabAuditTimelineFilters {
  q: string | null;
  entity: LabAuditEntity | null;
  action: LabAuditActionName | null;
  actor: number | null;
  from: string | null;
  to: string | null;
  page: number;
  per: number;
}

export const NO_LAB_AUDIT_FILTERS: LabAuditTimelineFilters = {
  q: null,
  entity: null,
  action: null,
  actor: null,
  from: null,
  to: null,
  page: 1,
  per: DEFAULT_LAB_AUDIT_PER_PAGE,
};

export function hasLabAuditFilters(f: LabAuditTimelineFilters): boolean {
  return Boolean(
    f.q || f.entity || f.action || f.actor || f.from || f.to || f.page !== 1 || f.per !== DEFAULT_LAB_AUDIT_PER_PAGE,
  );
}

export function labAuditFiltersToQuery(f: LabAuditTimelineFilters): string {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.entity) params.set('entity', f.entity);
  if (f.action) params.set('action', f.action);
  if (f.actor) params.set('actor', String(f.actor));
  if (f.from) params.set('from', f.from);
  if (f.to) params.set('to', f.to);
  if (f.page !== 1) params.set('page', String(f.page));
  if (f.per !== DEFAULT_LAB_AUDIT_PER_PAGE) params.set('per', String(f.per));
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** Invalid enum values are silently dropped (register convention). */
export function parseLabAuditFilters(searchParams: URLSearchParams): LabAuditTimelineFilters {
  const q = (searchParams.get('q') ?? '').trim().slice(0, 200) || null;
  const entityRaw = searchParams.get('entity');
  const entity = (LAB_AUDIT_ENTITIES as readonly string[]).includes(entityRaw ?? '')
    ? (entityRaw as LabAuditEntity)
    : null;
  const actionRaw = searchParams.get('action');
  const action = (LAB_AUDIT_ACTIONS as readonly string[]).includes(actionRaw ?? '')
    ? (actionRaw as LabAuditActionName)
    : null;
  const actorRaw = Number(searchParams.get('actor'));
  const actor = Number.isInteger(actorRaw) && actorRaw > 0 ? actorRaw : null;
  const fromRaw = searchParams.get('from') ?? '';
  const toRaw = searchParams.get('to') ?? '';
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const from = dateRe.test(fromRaw) ? fromRaw : null;
  const to = dateRe.test(toRaw) ? toRaw : null;
  const perRaw = Number(searchParams.get('per'));
  const per = (LAB_AUDIT_PER_PAGE_OPTIONS as readonly number[]).includes(perRaw)
    ? perRaw
    : DEFAULT_LAB_AUDIT_PER_PAGE;
  const pageRaw = Number(searchParams.get('page'));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return { q, entity, action, actor, from, to, page, per };
}

export function labAuditHref(entityType: LabAuditEntity, entityId: number): string | null {
  switch (entityType) {
    case 'LAB_TEST':
      return `/lab/tests/${entityId}`;
    case 'LAB_RETEST':
      return `/lab/retests/${entityId}`;
    case 'LAB_PRODUCT':
      return `/lab/products/${entityId}`;
    case 'LAB_TEMPLATE':
      return `/lab/templates/${entityId}`;
    case 'LAB_EQUIPMENT':
      return `/lab/equipment/${entityId}`;
    case 'LAB_EQUIPMENT_CALIBRATION':
      return `/lab/calibration/${entityId}`;
    case 'LAB_DOCUMENT':
      return `/lab/documents/${entityId}/edit`;
    case 'LAB_CHANGE_REQUEST':
      return `/lab/change-requests/${entityId}`;
    // Maintenance and document versions have no record-scoped route — the
    // owning module pages list them per parent entity.
    default:
      return null;
  }
}

/** Readable "what" sentence: "<verb> <entity> <record label>". */
export function labAuditSentence(entry: Pick<LabAuditTimelineEntry, 'action' | 'entity_type' | 'record_label'>): string {
  const verb = LAB_AUDIT_ACTION_VERBS[entry.action] ?? String(entry.action).toLowerCase();
  const entity = LAB_AUDIT_ENTITY_LABELS[entry.entity_type] ?? entry.entity_type;
  return `${verb} ${entity.toLowerCase()}${entry.record_label ? ` ${entry.record_label}` : ''}`;
}

export function labAuditRoleLabel(role: string | null): string {
  return (role && LAB_AUDIT_ROLE_LABELS[role]) || 'System';
}

// Scalar subqueries resolve each audited row into its owning register's human
// reference. LEFT-join semantics via NULL when the row's entity no longer
// exists — the audit row itself is always preserved and shown.
const RECORD_LABEL_SQL = `
  CASE a.entity_type
    WHEN 'LAB_TEST' THEN (SELECT t.test_number FROM lab_test_records t WHERE t.id = a.entity_id)
    WHEN 'LAB_RETEST' THEN (SELECT r.retest_number FROM lab_test_retests r WHERE r.id = a.entity_id)
    WHEN 'LAB_PRODUCT' THEN (SELECT p.name FROM lab_products p WHERE p.id = a.entity_id)
    WHEN 'LAB_TEMPLATE' THEN (SELECT tpl.name FROM lab_test_templates tpl WHERE tpl.id = a.entity_id)
    WHEN 'LAB_EQUIPMENT' THEN (SELECT e.code FROM lab_equipment e WHERE e.id = a.entity_id)
    WHEN 'LAB_EQUIPMENT_MAINTENANCE' THEN (
      SELECT e.code FROM lab_equipment_maintenance m JOIN lab_equipment e ON e.id = m.equipment_id
      WHERE m.id = a.entity_id)
    WHEN 'LAB_EQUIPMENT_CALIBRATION' THEN (
      SELECT e.code FROM lab_equipment_calibration c JOIN lab_equipment e ON e.id = c.equipment_id
      WHERE c.id = a.entity_id)
    WHEN 'LAB_DOCUMENT' THEN (SELECT d.code FROM lab_documents d WHERE d.id = a.entity_id)
    WHEN 'LAB_DOCUMENT_VERSION' THEN (
      SELECT d.code || ' v' || v.version FROM lab_document_versions v JOIN lab_documents d ON d.id = v.document_id
      WHERE v.id = a.entity_id)
    WHEN 'LAB_CHANGE_REQUEST' THEN ('CR-' || a.entity_id)
  END AS record_label`;

function buildWhere(f: LabAuditTimelineFilters): { where: string; params: unknown[] } {
  const clauses: string[] = [`a.entity_type LIKE 'LAB\\_%' ESCAPE '\\'`];
  const params: unknown[] = [];
  if (f.entity) {
    clauses.push('a.entity_type = ?');
    params.push(f.entity);
  }
  if (f.action) {
    clauses.push('a.action = ?');
    params.push(f.action);
  }
  if (f.actor) {
    clauses.push('a.actor_id = ?');
    params.push(f.actor);
  }
  if (f.q) {
    // Match the reason/details note, the before/after values AND the resolved
    // record label (e.g. typing "LAB-TEST-00081" finds its whole lifecycle).
    clauses.push(
      "(a.note LIKE ? ESCAPE '\\' OR a.old_value LIKE ? ESCAPE '\\' OR a.new_value LIKE ? ESCAPE '\\' OR record_label LIKE ? ESCAPE '\\')",
    );
    const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    params.push(like, like, like, like);
  }
  if (f.from) {
    clauses.push("date(a.created_at) >= date(?)");
    params.push(f.from);
  }
  if (f.to) {
    clauses.push("date(a.created_at) <= date(?)");
    params.push(f.to);
  }
  return { where: clauses.join(' AND '), params };
}

// Rows + record label resolved in an inner select so WHERE (notably the q
// filter) can reference record_label — SQLite cannot use a SELECT alias in
// the same query level's WHERE.
const BASE_SELECT_SQL = `
  SELECT a.id, a.created_at, a.actor_id, u.full_name AS actor_name, u.role AS actor_role,
         a.entity_type, a.entity_id, a.action, a.old_value, a.new_value, a.note,
         ${RECORD_LABEL_SQL}
  FROM qc_audit_log a
  LEFT JOIN users u ON u.id = a.actor_id`;

export interface LabAuditTimelineResult {
  rows: LabAuditTimelineEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export function searchLabAuditTimeline(filters: LabAuditTimelineFilters): LabAuditTimelineResult {
  const db: Db = getDb();
  const { where, params } = buildWhere(filters);

  const total = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM (${BASE_SELECT_SQL}) a WHERE ${where}`)
      .get(...params) as { n: number }
  ).n;
  const per = filters.per;
  const totalPages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * per;

  const rows = db
    .prepare(
      `SELECT * FROM (${BASE_SELECT_SQL}) a
       WHERE ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, per, offset) as LabAuditTimelineEntry[];

  return {
    rows: rows.map((row) => ({ ...row, href: labAuditHref(row.entity_type, row.entity_id) })),
    total,
    page,
    per_page: per,
    total_pages: totalPages,
  };
}

/** Actor dropdown from actual audit appearance (register convention). */
export function listLabAuditActors(): Array<{ id: number; full_name: string; role: string }> {
  return getDb()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name, u.role
       FROM qc_audit_log a JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type LIKE 'LAB\\_%' ESCAPE '\\'
       ORDER BY u.full_name COLLATE NOCASE, u.id`,
    )
    .all() as Array<{ id: number; full_name: string; role: string }>;
}
