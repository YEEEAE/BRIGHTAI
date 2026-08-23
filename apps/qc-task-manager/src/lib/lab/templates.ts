// QC Laboratory Test Templates (PROMPT 10, /lab/templates).
//
// One module owns the versioned Test Templates: the searchable list
// (URL-driven, fully-parameterized SQL, whitelisted sort — same shape as
// products.ts/testSearch.ts), the detail loader (identity + version history +
// equipment compatibility + usage), and the create/update/approve/archive
// service. Every change writes the shared qc_audit_log with
// entity_type='LAB_TEMPLATE' — never a second audit system.
//
// Version semantics (page reference §29-§30):
//   - A template's content lives in lab_test_template_versions; version 1 is
//     created with the template (DRAFT) and stays editable in place while it
//     is unapproved.
//   - Approving a version freezes it (approved versions are IMMUTABLE) and
//     sets current_version_id + template.status='ACTIVE'.
//   - Editing a template whose current version is approved creates version
//     N+1 as a DRAFT — versioning never mutates an approved version in place.
//   - A test created from a template stores template_id + template_version_id
//     (migration 017); a v2 test keeps pointing at v2 even after v3 becomes
//     current, and approval writes template_snapshot_json (review.ts).
//
// "Populate, never overwrite" on the test form: listLabTemplateReferences()
// feeds a display-only suggestions panel; measured values stay editable and
// are never silently replaced by template content.

import type { APIContext } from 'astro';
import { getDb, transaction } from '../db';
import { appendQcAudit } from '../audit/qcChain';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import {
  canApproveLabTemplateVersionRecord,
  canArchiveLabTemplate,
  canCreateLabTemplate,
  canEditLabTemplateRecord,
  canReviewLabTemplateRecord,
  canSubmitLabTemplateRecord,
} from '../permissions';
import {
  ESIGN_FAILURE_MESSAGE_AR,
  ESIGN_FIELD_NAME,
  ESIGN_RATE_LIMITED_MESSAGE_AR,
  esignAuditNote,
  requireEsignature,
} from './esignature';
import {
  LAB_CONNECTOR_TYPES,
} from './policy';
import type { LabTestTemplate, LabTestTemplateVersion, LabTestType } from '../types';

// ─────────────────────────────── Audit ───────────────────────────────

type LabTemplateAuditAction = 'CREATE' | 'UPDATE' | 'VERSION' | 'APPROVAL' | 'STATUS_TRANSITION' | 'SUBMIT' | 'REQUEST_CHANGES' | 'SUPERSEDE';

function auditLabTemplate(templateId: number, actorId: number, action: LabTemplateAuditAction, note: string | null = null, oldValue: string | null = null, newValue: string | null = null): void {
  appendQcAudit(getDb(), { entityType: 'LAB_TEMPLATE', entityId: templateId, actorId, action, oldValue, newValue, note });
}

/** Change history for one template — the shared audit log, newest first. */
export function getLabTemplateAuditTimeline(templateId: number): Array<Record<string, unknown>> {
  return getDb()
    .prepare(
      `SELECT a.id, a.action, a.note, a.created_at, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_TEMPLATE' AND a.entity_id = ?
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(templateId) as Array<Record<string, unknown>>;
}

// ─────────────────────────────── List / search ───────────────────────────────

export type LabTemplateSortField = 'code' | 'name' | 'test_type' | 'status' | 'updated_at';

export const LAB_TEMPLATE_SORT_FIELDS: readonly LabTemplateSortField[] = [
  'code',
  'name',
  'test_type',
  'status',
  'updated_at',
];

export const LAB_TEMPLATE_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_TEMPLATE_PER_PAGE = 25;
export const DEFAULT_LAB_TEMPLATE_SORT: LabTemplateSortField = 'updated_at';
export const DEFAULT_LAB_TEMPLATE_DIR: 'asc' | 'desc' = 'desc';

export interface LabTemplateSearchFilters {
  /** Free text — code / name (LIKE). */
  q: string | null;
  test_type: LabTestType | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | null;
  sort: LabTemplateSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_TEMPLATE_FILTERS: LabTemplateSearchFilters = {
  q: null,
  test_type: null,
  status: null,
  sort: DEFAULT_LAB_TEMPLATE_SORT,
  dir: DEFAULT_LAB_TEMPLATE_DIR,
  page: 1,
  per_page: DEFAULT_LAB_TEMPLATE_PER_PAGE,
};

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeTemplateLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Parse + validate the /lab/templates query params into a typed filter object.
 * Invalid values are silently dropped (never throws) — same contract as the
 * product list.
 */
export function parseLabTemplateSearchFilters(url: URL): LabTemplateSearchFilters {
  const f: LabTemplateSearchFilters = { ...NO_LAB_TEMPLATE_FILTERS };
  const sp = url.searchParams;
  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);
  const type = sp.get('type');
  if (type === 'air' || type === 'vacuum') f.test_type = type;
  const status = sp.get('status');
  if (status === 'DRAFT' || status === 'ACTIVE' || status === 'ARCHIVED') f.status = status;
  const sort = sp.get('sort');
  if (sort && (LAB_TEMPLATE_SORT_FIELDS as readonly string[]).includes(sort)) f.sort = sort as LabTemplateSortField;
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;
  const page = positiveInt(sp.get('page') ?? '');
  if (page !== null) f.page = page;
  const per = positiveInt(sp.get('per') ?? '');
  if (per !== null && (LAB_TEMPLATE_PER_PAGE_OPTIONS as readonly number[]).includes(per)) f.per_page = per;
  return f;
}

/** True when any list filter is active (drives the "Reset" affordance). */
export function hasLabTemplateFilters(f: LabTemplateSearchFilters): boolean {
  return Boolean(f.q || f.test_type || f.status);
}

/** Rebuild the querystring for the current filters (sort/pagination links). */
export function labTemplateFiltersToQuery(f: LabTemplateSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.test_type) sp.set('type', f.test_type);
  if (f.status) sp.set('status', f.status);
  if (f.sort !== DEFAULT_LAB_TEMPLATE_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_TEMPLATE_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_TEMPLATE_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fully-parameterized WHERE builder for the template list. Exported for unit
 * tests: the SQL text NEVER contains user input — every value rides in the
 * returned params in placeholder order.
 */
export function buildLabTemplateWhere(f: LabTemplateSearchFilters): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    const like = `%${escapeTemplateLike(f.q)}%`;
    conds.push("(t.code LIKE ? ESCAPE '\\' OR t.name LIKE ? ESCAPE '\\')");
    params.push(like, like);
  }
  if (f.test_type) {
    conds.push('t.test_type = ?');
    params.push(f.test_type);
  }
  if (f.status) {
    conds.push('t.status = ?');
    params.push(f.status);
  }
  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

/** Whitelisted sort expression per field — raw input is never used as SQL. */
const SORT_SQL: Record<LabTemplateSortField, string> = {
  code: 't.code COLLATE NOCASE',
  name: 't.name COLLATE NOCASE',
  test_type: 't.test_type',
  status: 't.status',
  updated_at: 't.updated_at',
};

export interface LabTemplateListRow {
  id: number;
  code: string;
  name: string;
  test_type: LabTestType;
  status: string;
  current_version: number | null;
  default_sample_count: number | null;
  updated_at: string;
  test_count: number;
}

export interface LabTemplateSearchResult {
  rows: LabTemplateListRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const LIST_SELECT = `SELECT t.id, t.code, t.name, t.test_type, t.status, t.updated_at,
  cv.version AS current_version, cv.default_sample_count,
  (SELECT COUNT(*) FROM lab_test_records r WHERE r.template_id = t.id) AS test_count
FROM lab_test_templates t
LEFT JOIN lab_test_template_versions cv ON cv.id = t.current_version_id`;

/** Paged, sorted, filtered Test Template list. All SQL is parameterized. */
export function searchLabTemplates(f: LabTemplateSearchFilters): LabTemplateSearchResult {
  const db = getDb();
  const where = buildLabTemplateWhere(f);
  const totalRow = db.prepare(`SELECT COUNT(*) AS n FROM lab_test_templates t ${where.sql}`).get(...where.params) as { n: number };
  const total = Number(totalRow.n);
  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const rows = db
    .prepare(`${LIST_SELECT} ${where.sql} ORDER BY ${SORT_SQL[f.sort]} ${dir}, t.id DESC LIMIT ? OFFSET ?`)
    .all(...where.params, f.per_page, offset) as LabTemplateListRow[];
  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ─────────────────────────────── Detail ───────────────────────────────

export interface LabTemplateVersionRow extends LabTestTemplateVersion {
  created_by_name: string | null;
  submitted_by_name: string | null;
  reviewed_by_name: string | null;
  approved_by_name: string | null;
  test_count: number;
}

export interface LabTemplateDetailView {
  template: LabTestTemplate;
  currentVersion: LabTestTemplateVersion | null;
  versions: LabTemplateVersionRow[];
  equipment: Array<{ id: number; name: string; code: string }>;
  test_count: number;
  product_name: string | null;
  product_code: string | null;
  primary_equipment_name: string | null;
  primary_equipment_code: string | null;
  sop_title: string | null;
  sop_code: string | null;
  wi_title: string | null;
  wi_code: string | null;
}

/** Full detail view: identity, current version, full version history, links, usage. */
export function getLabTemplateDetail(id: number): LabTemplateDetailView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = getDb();
  const template = db.prepare('SELECT * FROM lab_test_templates WHERE id = ?').get(id) as LabTestTemplate | undefined;
  if (!template) return null;

  const versions = db
    .prepare(
      `SELECT v.*, cu.full_name AS created_by_name, su.full_name AS submitted_by_name,
        ru.full_name AS reviewed_by_name, au.full_name AS approved_by_name,
        (SELECT COUNT(*) FROM lab_test_records r WHERE r.template_version_id = v.id) AS test_count
       FROM lab_test_template_versions v
       LEFT JOIN users cu ON cu.id = v.created_by
       LEFT JOIN users su ON su.id = v.submitted_by
       LEFT JOIN users ru ON ru.id = v.reviewed_by
       LEFT JOIN users au ON au.id = v.approved_by
       WHERE v.template_id = ?
       ORDER BY v.version ASC`,
    )
    .all(id) as LabTemplateVersionRow[];

  const currentVersion = template.current_version_id
    ? ((versions.find((v) => v.id === template.current_version_id) as LabTestTemplateVersion | undefined) ?? null)
    : null;

  const equipment = db
    .prepare(
      `SELECT e.id, e.name, e.code
       FROM lab_template_equipment te JOIN lab_equipment e ON e.id = te.equipment_id
       WHERE te.template_id = ? ORDER BY e.name COLLATE NOCASE ASC, e.id ASC`,
    )
    .all(id) as Array<{ id: number; name: string; code: string }>;

  const usage = db.prepare('SELECT COUNT(*) AS n FROM lab_test_records WHERE template_id = ?').get(id) as { n: number };

  // Reference names resolve from the CURRENT version (approved content wins).
  const v = currentVersion ?? versions[versions.length - 1] ?? null;
  let refs: Record<string, string | null> = {
    product_name: null,
    product_code: null,
    primary_equipment_name: null,
    primary_equipment_code: null,
    sop_title: null,
    sop_code: null,
    wi_title: null,
    wi_code: null,
  };
  if (v) {
    refs = (db
      .prepare(
        `SELECT p.name AS product_name, p.code AS product_code,
                e.name AS primary_equipment_name, e.code AS primary_equipment_code,
                sop.title AS sop_title, sop.code AS sop_code,
                wi.title AS wi_title, wi.code AS wi_code
         FROM lab_test_template_versions v
         LEFT JOIN lab_products p ON p.id = v.applicable_product_id
         LEFT JOIN lab_equipment e ON e.id = v.applicable_equipment_id
         LEFT JOIN lab_documents sop ON sop.id = v.sop_id
         LEFT JOIN lab_documents wi ON wi.id = v.wi_id
         WHERE v.id = ?`,
      )
      .get(v.id) ?? { ...refs }) as Record<string, string | null>;
  }

  return {
    template,
    currentVersion,
    versions,
    equipment,
    test_count: Number(usage.n),
    product_name: refs.product_name ?? null,
    product_code: refs.product_code ?? null,
    primary_equipment_name: refs.primary_equipment_name ?? null,
    primary_equipment_code: refs.primary_equipment_code ?? null,
    sop_title: refs.sop_title ?? null,
    sop_code: refs.sop_code ?? null,
    wi_title: refs.wi_title ?? null,
    wi_code: refs.wi_code ?? null,
  };
}

/** The editable version + prefill state for the edit form. */
export interface LabTemplateEditView {
  template: LabTestTemplate;
  version: LabTemplateVersionRow;
  equipmentIds: number[];
}

/**
 * The version the edit form edits: the newest version (the only one that can
 * legally be a DRAFT — everything older is frozen). Archived templates are
 * not editable at all.
 */
export function getLabTemplateForEdit(id: number): LabTemplateEditView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = getDb();
  const template = db.prepare('SELECT * FROM lab_test_templates WHERE id = ?').get(id) as LabTestTemplate | undefined;
  if (!template) return null;
  const row = db
    .prepare(
      `SELECT v.*, cu.full_name AS created_by_name, su.full_name AS submitted_by_name,
        ru.full_name AS reviewed_by_name, au.full_name AS approved_by_name, 0 AS test_count
       FROM lab_test_template_versions v
       LEFT JOIN users cu ON cu.id = v.created_by
       LEFT JOIN users su ON su.id = v.submitted_by
       LEFT JOIN users ru ON ru.id = v.reviewed_by
       LEFT JOIN users au ON au.id = v.approved_by
       WHERE v.template_id = ? ORDER BY v.version DESC LIMIT 1`,
    )
    .get(id) as LabTemplateVersionRow | undefined;
  if (!row) return null;
  const equipmentIds = (
    db.prepare('SELECT equipment_id FROM lab_template_equipment WHERE template_id = ? ORDER BY equipment_id ASC').all(id) as Array<
      { equipment_id: number }
    >
  ).map((r) => Number(r.equipment_id));
  return { template, version: row, equipmentIds };
}

// ─────────────────────────────── Dropdown data ───────────────────────────────

/** Non-archived equipment for the "Equipment Compatibility" checkboxes. */
export function listLabEquipmentForTemplateForm(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_equipment WHERE is_archived = 0 ORDER BY name COLLATE NOCASE ASC, id ASC')
    .all() as Array<{ id: number; name: string; code: string }>;
}

/** Active products for the "Applicable Product" select. */
export function listLabProductsForTemplateForm(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_products WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC, id ASC')
    .all() as Array<{ id: number; name: string; code: string }>;
}

/** Approved SOP / WI controlled documents for the applicable-SOP/WI selects. */
export function listLabDocumentsForTemplateForm(
  type: 'SOP' | 'WI',
): Array<{ id: number; title: string; code: string }> {
  return getDb()
    .prepare("SELECT id, title, code FROM lab_documents WHERE type = ? AND status = 'APPROVED' ORDER BY code COLLATE NOCASE ASC, id ASC")
    .all(type) as Array<{ id: number; title: string; code: string }>;
}

// ─────────────────────────────── Create / update / actions ───────────────────────────────

/** Normalized form input after Zod validation (labTemplateSchema). */
export interface LabTemplateFormData {
  name: string;
  code: string;
  test_type: LabTestType;
  default_sample_count: number | null;
  standard_parameter: string | null;
  acceptance_criteria: string | null;
  holding_time: string | null;
  actual_pressure_reference: string | null;
  medium_name: string | null;
  actual_force_reference: string | null;
  torque_reference: string | null;
  time_reference: string | null;
  angle_reference: string | null;
  temperature_reference: string | null;
  humidity_reference: string | null;
  standard_condition: string | null;
  leakage_reference: string | null;
  holding_time_reference: string | null;
  effective_date: string | null;
  requires_approved_template_for_submission: boolean;
  /** Subset of LAB_CONNECTOR_TYPES (repeated checkbox key — collected raw). */
  connector_choices: string[];
  applicable_product_id: number | null;
  applicable_equipment_id: number | null;
  sop_id: number | null;
  wi_id: number | null;
  equipment_ids: number[];
}

/** Thrown on UNIQUE(code) collisions so the handlers can flash a clear message. */
export class LabTemplateCodeConflictError extends Error {
  constructor(code: string) {
    super(`A test template with code "${code}" already exists.`);
    this.name = 'LabTemplateCodeConflictError';
  }
}

export class LabTemplateConcurrencyError extends Error {
  constructor() {
    super('This template changed after you opened it. Reload the latest draft before saving.');
    this.name = 'LabTemplateConcurrencyError';
  }
}

function assertCodeAvailable(code: string, excludeId: number | null): void {
  const row = getDb().prepare('SELECT id FROM lab_test_templates WHERE code = ? COLLATE NOCASE LIMIT 1').get(code) as
    | { id: number }
    | undefined;
  if (row && Number(row.id) !== excludeId) throw new LabTemplateCodeConflictError(code);
}

/** Assert every referenced id exists (product/equipment/documents). */
function assertReferencesExist(data: LabTemplateFormData): void {
  const db = getDb();
  if (data.applicable_product_id !== null && !db.prepare('SELECT 1 FROM lab_products WHERE id = ?').get(data.applicable_product_id)) {
    throw new Error('The selected applicable product does not exist.');
  }
  const invalidEquipment = [...(data.applicable_equipment_id !== null ? [data.applicable_equipment_id] : []), ...data.equipment_ids].filter(
    (eid) => !db.prepare('SELECT 1 FROM lab_equipment WHERE id = ?').get(eid),
  );
  if (invalidEquipment.length > 0) {
    throw new Error('One or more selected equipment entries do not exist.');
  }
  for (const [id, label] of [
    [data.sop_id, 'SOP'],
    [data.wi_id, 'WI'],
  ] as Array<[number | null, string]>) {
    if (id !== null && !db.prepare('SELECT 1 FROM lab_documents WHERE id = ?').get(id)) {
      throw new Error(`The selected ${label} document does not exist.`);
    }
  }
}

/** Only printed connector options are legal template choices. */
function normalizeConnectorChoices(choices: string[]): string[] | null {
  const filtered = [...new Set(choices)].filter((c) => (LAB_CONNECTOR_TYPES as readonly string[]).includes(c));
  return filtered.length > 0 ? filtered : null;
}

/** Reference display values stored in parameters_json (nulls omitted). */
function buildParametersJson(data: LabTemplateFormData): string {
  const params: Record<string, string> = {};
  if (data.standard_parameter) params.standard_parameter = data.standard_parameter;
  if (data.acceptance_criteria) params.acceptance_criteria = data.acceptance_criteria;
  if (data.holding_time) params.holding_time = data.holding_time;
  if (data.actual_pressure_reference) params.actual_pressure_reference = data.actual_pressure_reference;
  for (const key of ['medium_name', 'actual_force_reference', 'torque_reference', 'time_reference', 'angle_reference', 'temperature_reference', 'humidity_reference', 'standard_condition', 'leakage_reference', 'holding_time_reference'] as const) {
    if (data[key]) params[key] = data[key] as string;
  }
  return JSON.stringify(params);
}

/** Parse parameters_json back into the four display strings (with printed defaults). */
export function parseTemplateParameters(parametersJson: string): {
  [key: string]: string | null;
} {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(parametersJson) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  const str = (key: string): string | null => (typeof parsed[key] === 'string' && parsed[key] !== '' ? (parsed[key] as string) : null);
  return Object.fromEntries([
    'medium_name', 'actual_force_reference', 'torque_reference', 'time_reference',
    'angle_reference', 'temperature_reference', 'humidity_reference',
    'standard_condition', 'leakage_reference', 'holding_time_reference',
    'standard_parameter', 'acceptance_criteria', 'holding_time', 'actual_pressure_reference',
  ].map((key) => [key, str(key)]));
}

function replaceEquipmentLinks(templateId: number, equipmentIds: number[]): void {
  const db = getDb();
  db.prepare('DELETE FROM lab_template_equipment WHERE template_id = ?').run(templateId);
  const insert = db.prepare('INSERT INTO lab_template_equipment (template_id, equipment_id) VALUES (?, ?)');
  for (const eid of [...new Set(equipmentIds)].sort((a, b) => a - b)) insert.run(templateId, eid);
}

function versionSummary(data: LabTemplateFormData): string {
  const params = parseTemplateParameters(buildParametersJson(data));
  return [
    `code=${data.code}`,
    `test_type=${data.test_type}`,
    `samples=${data.default_sample_count ?? '—'}`,
    `connectors=${data.connector_choices.length}`,
    `equipment=${data.equipment_ids.length}`,
    `standard_parameter=${params.standard_parameter}`,
  ].join('; ');
}

/**
 * Create a test template + version 1 (DRAFT) + equipment links + CREATE audit
 * in one transaction.
 */
export function createLabTemplate(data: LabTemplateFormData, actorId: number): number {
  return transaction(() => {
    const db = getDb();
    assertReferencesExist(data);
    assertCodeAvailable(data.code, null);
    const result = db
      .prepare(`INSERT INTO lab_test_templates (name, code, test_type, status, created_by) VALUES (?, ?, ?, 'DRAFT', ?)`)
      .run(data.name, data.code, data.test_type, actorId);
    const templateId = Number(result.lastInsertRowid);
    const connectors = normalizeConnectorChoices(data.connector_choices);
    const versionResult = db
      .prepare(
        `INSERT INTO lab_test_template_versions (
           template_id, version, default_sample_count, parameters_json, connector_choices_json,
           applicable_product_id, applicable_equipment_id, sop_id, wi_id, effective_date, requires_approved_template_for_submission, created_by
         ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        templateId,
        data.default_sample_count,
        buildParametersJson(data),
        connectors === null ? null : JSON.stringify(connectors),
        data.applicable_product_id,
        data.applicable_equipment_id,
        data.sop_id,
        data.wi_id,
        data.effective_date,
        data.requires_approved_template_for_submission ? 1 : 0,
        actorId,
      );
    db.prepare('UPDATE lab_test_templates SET current_version_id = ? WHERE id = ?').run(Number(versionResult.lastInsertRowid), templateId);
    replaceEquipmentLinks(templateId, data.equipment_ids);
    auditLabTemplate(templateId, actorId, 'CREATE', versionSummary(data));
    return templateId;
  });
}

/**
 * Update a test template (one transaction). Identity fields update in place;
 * content follows the versioning rule: the newest version updates in place
 * while it is still a DRAFT, otherwise editing creates version N+1 (VERSION
 * audit) — approved versions are immutable. Archived templates are read-only.
 */
export function updateLabTemplate(id: number, data: LabTemplateFormData, actorId: number, expectedUpdatedAt?: string | null): void {
  transaction(() => {
    const db = getDb();
    const existing = db.prepare('SELECT id, code, test_type, status, updated_at FROM lab_test_templates WHERE id = ?').get(id) as
      | { id: number; code: string; test_type: LabTestType; status: string; updated_at: string }
      | undefined;
    if (!existing) throw new Error('Test template not found.');
    if (existing.status === 'ARCHIVED') throw new Error('Archived test templates are read-only.');
    if (expectedUpdatedAt != null && expectedUpdatedAt !== existing.updated_at) throw new LabTemplateConcurrencyError();
    assertReferencesExist(data);
    assertCodeAvailable(data.code, id);

    const latest = db
      .prepare('SELECT id, version, status, approved_by FROM lab_test_template_versions WHERE template_id = ? ORDER BY version DESC LIMIT 1')
      .get(id) as { id: number; version: number; status: string; approved_by: number | null };
    const hasApprovedVersion = Boolean(db.prepare("SELECT 1 FROM lab_test_template_versions WHERE template_id = ? AND status = 'APPROVED' LIMIT 1").get(id));
    if (hasApprovedVersion && data.code !== existing.code) throw new Error('Template code is immutable after the first approved version. Create a new template instead.');
    if (hasApprovedVersion && data.test_type !== existing.test_type) throw new Error('Test type is immutable after the first approved version because it changes historical meaning. Create a new template instead.');
    const connectorJson = normalizeConnectorChoices(data.connector_choices);
    const connectorValue = connectorJson === null ? null : JSON.stringify(connectorJson);
    const parametersJson = buildParametersJson(data);

    db.prepare(
      `UPDATE lab_test_templates SET name = ?, code = ?, test_type = ?, updated_at = strftime('%Y-%m-%d %H:%M:%f','now') WHERE id = ?`,
    ).run(data.name, data.code, data.test_type, id);

    if (latest.status === 'DRAFT') {
      db.prepare(
        `UPDATE lab_test_template_versions SET
           default_sample_count = ?, parameters_json = ?, connector_choices_json = ?,
           applicable_product_id = ?, applicable_equipment_id = ?, sop_id = ?, wi_id = ?, effective_date = ?, requires_approved_template_for_submission = ?,
           updated_at = strftime('%Y-%m-%d %H:%M:%f','now')
         WHERE id = ?`,
      ).run(
        data.default_sample_count,
        parametersJson,
        connectorValue,
        data.applicable_product_id,
        data.applicable_equipment_id,
        data.sop_id,
        data.wi_id,
        data.effective_date,
        data.requires_approved_template_for_submission ? 1 : 0,
        latest.id,
      );
      replaceEquipmentLinks(id, data.equipment_ids);
      auditLabTemplate(
        id,
        actorId,
        'UPDATE',
        versionSummary(data),
      );
    } else {
      db
        .prepare(
          `INSERT INTO lab_test_template_versions (
             template_id, version, default_sample_count, parameters_json, connector_choices_json,
             applicable_product_id, applicable_equipment_id, sop_id, wi_id, effective_date, requires_approved_template_for_submission, created_by, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
        )
        .run(
          id,
          latest.version + 1,
          data.default_sample_count,
          parametersJson,
          connectorValue,
          data.applicable_product_id,
          data.applicable_equipment_id,
          data.sop_id,
          data.wi_id,
          data.effective_date,
          data.requires_approved_template_for_submission ? 1 : 0,
          actorId,
        );
      replaceEquipmentLinks(id, data.equipment_ids);
      auditLabTemplate(id, actorId, 'VERSION', `v${latest.version + 1}: ${versionSummary(data)}`);
    }
  });
}

/**
 * Approve the newest version (one transaction): freezes it (approved_by),
 * promotes it to current_version_id and sets the template ACTIVE. The approver
 * identity always comes from the session, never the request body.
 */
export function submitLabTemplate(id: number, actor: { id: number; role: import('../types').Role }, expectedUpdatedAt?: string | null): void {
  transaction(() => {
    const db = getDb();
    const template = db.prepare('SELECT id, status, updated_at FROM lab_test_templates WHERE id = ?').get(id) as { id: number; status: string; updated_at: string } | undefined;
    if (!template) throw new Error('Test template not found.');
    if (template.status === 'ARCHIVED') throw new Error('Archived templates cannot be submitted.');
    if (expectedUpdatedAt != null && expectedUpdatedAt !== template.updated_at) throw new LabTemplateConcurrencyError();
    const latest = db.prepare('SELECT id, version, status, created_by FROM lab_test_template_versions WHERE template_id = ? ORDER BY version DESC LIMIT 1').get(id) as { id: number; version: number; status: string; created_by: number };
    if (!canSubmitLabTemplateRecord(actor, { status: latest.status, created_by: latest.created_by })) throw new Error('Only the template author can submit a draft for review.');
    const now = new Date().toISOString();
    db.prepare("UPDATE lab_test_template_versions SET status = 'IN_REVIEW', submitted_by = ?, submitted_at = ?, updated_at = ? WHERE id = ? AND status = 'DRAFT'").run(actor.id, now, now, latest.id);
    db.prepare('UPDATE lab_test_templates SET updated_at = ? WHERE id = ?').run(now, id);
    auditLabTemplate(id, actor.id, 'SUBMIT', `submitted v${latest.version}`, 'DRAFT', 'IN_REVIEW');
  });
}

/** Record an independent supervisor review while keeping the version IN_REVIEW. */
export function reviewLabTemplate(id: number, actor: { id: number; role: import('../types').Role }, expectedUpdatedAt?: string | null): void {
  transaction(() => {
    const db = getDb();
    const template = db.prepare('SELECT id, status, updated_at FROM lab_test_templates WHERE id = ?').get(id) as { id: number; status: string; updated_at: string } | undefined;
    if (!template) throw new Error('Test template not found.');
    if (template.status === 'ARCHIVED') throw new Error('Archived templates are read-only.');
    if (expectedUpdatedAt != null && expectedUpdatedAt !== template.updated_at) throw new LabTemplateConcurrencyError();
    const latest = db.prepare('SELECT id, version, status, created_by FROM lab_test_template_versions WHERE template_id = ? ORDER BY version DESC LIMIT 1').get(id) as { id: number; version: number; status: string; created_by: number };
    if (!canReviewLabTemplateRecord(actor, { status: latest.status, created_by: latest.created_by })) throw new Error('You cannot review this template version.');
    const now = new Date().toISOString();
    db.prepare("UPDATE lab_test_template_versions SET reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ? AND status = 'IN_REVIEW'").run(actor.id, now, now, latest.id);
    db.prepare('UPDATE lab_test_templates SET updated_at = ? WHERE id = ?').run(now, id);
    auditLabTemplate(id, actor.id, 'STATUS_TRANSITION', `reviewed v${latest.version}`, 'IN_REVIEW', 'IN_REVIEW');
  });
}

/** Approve an IN_REVIEW version; e-signature is verified by the HTTP handler. */
export function approveLabTemplate(id: number, actor: { id: number; role: import('../types').Role }, expectedUpdatedAt?: string | null, note?: string | null): void {
  transaction(() => {
    const db = getDb();
    const template = db.prepare('SELECT id, code, status, updated_at FROM lab_test_templates WHERE id = ?').get(id) as { id: number; code: string; status: string; updated_at: string } | undefined;
    if (!template) throw new Error('Test template not found.');
    if (template.status === 'ARCHIVED') throw new Error('Archived templates cannot be approved.');
    if (expectedUpdatedAt != null && expectedUpdatedAt !== template.updated_at) throw new LabTemplateConcurrencyError();
    const latest = db.prepare('SELECT id, version, status, created_by FROM lab_test_template_versions WHERE template_id = ? ORDER BY version DESC LIMIT 1').get(id) as { id: number; version: number; status: string; created_by: number };
    if (!canApproveLabTemplateVersionRecord(actor, { status: latest.status, created_by: latest.created_by })) throw new Error('You cannot approve this template version.');
    const now = new Date().toISOString();
    const previous = db.prepare("SELECT id, version FROM lab_test_template_versions WHERE template_id = ? AND status = 'APPROVED' AND id <> ?").all(id, latest.id) as Array<{ id: number; version: number }>;
    for (const prev of previous) {
      db.prepare("UPDATE lab_test_template_versions SET status = 'SUPERSEDED', updated_at = ? WHERE id = ?").run(now, prev.id);
      auditLabTemplate(id, actor.id, 'SUPERSEDE', `v${prev.version} superseded by v${latest.version}`, 'APPROVED', 'SUPERSEDED');
    }
    db.prepare("UPDATE lab_test_template_versions SET status = 'APPROVED', approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ? AND status = 'IN_REVIEW'").run(actor.id, now, now, latest.id);
    db.prepare("UPDATE lab_test_templates SET current_version_id = ?, status = 'ACTIVE', updated_at = ? WHERE id = ?").run(latest.id, now, id);
    auditLabTemplate(id, actor.id, 'APPROVAL', esignAuditNote(note) + `; approved v${latest.version} (${template.code})`, 'IN_REVIEW', 'APPROVED');
  });
}

/**
 * Archive a test template (one transaction). Archived templates disappear
 * from form dropdowns and are read-only; existing tests keep their template
 * references and snapshots untouched.
 */
export function archiveLabTemplate(id: number, actorId: number): void {
  transaction(() => {
    const db = getDb();
    const template = db.prepare('SELECT id, code, status FROM lab_test_templates WHERE id = ?').get(id) as
      | { id: number; code: string; status: string }
      | undefined;
    if (!template) throw new Error('Test template not found.');
    if (template.status === 'ARCHIVED') throw new Error('The test template is already archived.');
    db.prepare("UPDATE lab_test_templates SET status = 'ARCHIVED', updated_at = datetime('now') WHERE id = ?").run(id);
    auditLabTemplate(id, actorId, 'STATUS_TRANSITION', `archived ${template.code}`, template.status, 'ARCHIVED');
  });
}

// ─────────────────────────────── Test-form reference data ───────────────────────────────

export interface LabTemplateReference {
  id: number;
  version_id: number;
  name: string;
  code: string;
  test_type: LabTestType;
  version: number;
  default_sample_count: number | null;
  connector_choices_json: string | null;
  parameters_json: string;
  sop_title: string | null;
  sop_code: string | null;
  sop_version: number | null;
  sop_status: string | null;
  wi_title: string | null;
  wi_code: string | null;
  wi_version: number | null;
  wi_status: string | null;
  effective_date: string | null;
  requires_approved_template_for_submission: number;
}

/**
 * ACTIVE templates with their approved current version — the data behind the
 * test form's template suggestions. The form only prefills untouched/empty
 * fields (sample count, connector type) and displays the reference values;
 * it never overwrites values the tester entered (page reference §29/§78).
 */
export function listLabTemplateReferences(): LabTemplateReference[] {
  return getDb()
    .prepare(
      `SELECT t.id, v.id AS version_id, t.name, t.code, t.test_type, v.version,
              v.default_sample_count, v.connector_choices_json, v.parameters_json,
              sop.title AS sop_title, sop.code AS sop_code,
              sopv.version AS sop_version, sopv.status AS sop_status,
              wi.title AS wi_title, wi.code AS wi_code,
              wiv.version AS wi_version, wiv.status AS wi_status,
              v.effective_date, v.requires_approved_template_for_submission
       FROM lab_test_templates t
       JOIN lab_test_template_versions v ON v.id = t.current_version_id
       LEFT JOIN lab_documents sop ON sop.id = v.sop_id
       LEFT JOIN lab_document_versions sopv ON sopv.id = sop.current_version_id
       LEFT JOIN lab_documents wi ON wi.id = v.wi_id
       LEFT JOIN lab_document_versions wiv ON wiv.id = wi.current_version_id
       WHERE t.status = 'ACTIVE' AND v.status = 'APPROVED'
       ORDER BY t.name COLLATE NOCASE ASC, t.id ASC`,
    )
    .all() as LabTemplateReference[];
}

// ─────────────────────────────── POST handlers ───────────────────────────────

/**
 * Shared POST body for create + edit (middleware short-circuit — same pattern
 * as handleLabProductPost). `templateId` comes from the matched path segment,
 * never from the body. The edit form carries a hidden `form_action`
 * (save|approve|archive); approve/archive re-check their own permission.
 * Repeated checkbox keys (`equipment_ids`, `connector_choices`) are collected
 * from the raw form before schema-level typing.
 */
async function handleLabTemplatePost(context: APIContext, templateId: number | null): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }

  const backUrl = templateId === null ? '/lab/templates/new' : `/lab/templates/${templateId}/edit`;
  const form = await context.request.formData();
  const formAction = templateId === null ? 'save' : String(form.get('form_action') ?? 'save');

  const allowed =
    formAction === 'submit'
      ? (() => { const view = getLabTemplateForEdit(templateId as number); return Boolean(view && canSubmitLabTemplateRecord({ id: user.id, role: user.role }, { status: view.version.status, created_by: view.version.created_by })); })()
      : formAction === 'review'
        ? (() => { const view = getLabTemplateForEdit(templateId as number); return Boolean(view && canReviewLabTemplateRecord({ id: user.id, role: user.role }, { status: view.version.status, created_by: view.version.created_by })); })()
        : formAction === 'approve'
          ? (() => { const view = getLabTemplateForEdit(templateId as number); return Boolean(view && canApproveLabTemplateVersionRecord({ id: user.id, role: user.role }, { status: view.version.status, created_by: view.version.created_by })); })()
      : formAction === 'archive'
        ? canArchiveLabTemplate(user.role)
        : templateId === null
          ? canCreateLabTemplate(user.role)
          : (() => {
              const view = getLabTemplateForEdit(templateId);
              return Boolean(view && canEditLabTemplateRecord({ id: user.id, role: user.role }, { status: view.version.status, created_by: view.version.created_by, author_id: null }));
            })();
  if (!allowed) {
    setFlash(context, 'error', 'You do not have permission to manage test templates.');
    return context.redirect('/lab/templates');
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  try {
    if (formAction === 'submit') {
      submitLabTemplate(templateId as number, { id: user.id, role: user.role }, String(form.get('version_token') || '') || null);
      setFlash(context, 'success', 'Test template submitted for review.');
      return context.redirect(`/lab/templates/${templateId}`);
    }
    if (formAction === 'review') {
      reviewLabTemplate(templateId as number, { id: user.id, role: user.role }, String(form.get('version_token') || '') || null);
      setFlash(context, 'success', 'Test template review recorded.');
      return context.redirect(`/lab/templates/${templateId}`);
    }
    if (formAction === 'approve') {
      const outcome = requireEsignature(user.id, form.get(ESIGN_FIELD_NAME)?.toString() ?? null);
      if (outcome === 'rate_limited') { setFlash(context, 'error', ESIGN_RATE_LIMITED_MESSAGE_AR); return context.redirect(`/lab/templates/${templateId}`); }
      if (outcome === 'invalid') { setFlash(context, 'error', ESIGN_FAILURE_MESSAGE_AR); return context.redirect(`/lab/templates/${templateId}`); }
      approveLabTemplate(templateId as number, { id: user.id, role: user.role }, String(form.get('version_token') || '') || null, form.get('note')?.toString() ?? null);
      setFlash(context, 'success', 'Test template version approved.');
      return context.redirect(`/lab/templates/${templateId}`);
    }
    if (formAction === 'archive') {
      archiveLabTemplate(templateId as number, user.id);
      setFlash(context, 'success', 'Test template archived.');
      return context.redirect(`/lab/templates/${templateId}`);
    }

    const { parseFormData, labTemplateSchema } = await import('../validation');
    const parsed = parseFormData(labTemplateSchema, form);
    if (!parsed.ok) {
      setFlash(context, 'error', parsed.error);
      return context.redirect(backUrl);
    }

    // Repeated checkbox keys ride as duplicate FormData entries.
    const equipmentIds = [...form.getAll('equipment_ids')].map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
    const connectorChoices = [...form.getAll('connector_choices')].map((v) => String(v));
    const data: LabTemplateFormData = {
      ...(parsed.data as Omit<LabTemplateFormData, 'equipment_ids' | 'connector_choices'>),
      equipment_ids: equipmentIds,
      connector_choices: connectorChoices,
    };

    if (templateId === null) {
      const id = createLabTemplate(data, user.id);
      setFlash(context, 'success', `Test template ${data.code} created.`);
      return context.redirect(`/lab/templates/${id}`);
    }
    updateLabTemplate(templateId, data, user.id, String(form.get('version_token') || '') || null);
    setFlash(context, 'success', `Test template ${data.code} updated.`);
    return context.redirect(`/lab/templates/${templateId}`);
  } catch (err) {
    if (err instanceof LabTemplateCodeConflictError) {
      setFlash(context, 'error', err.message);
    } else {
      console.error('[lab] template form save failure', err);
      setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the test template.');
    }
    return context.redirect(templateId === null ? '/lab/templates/new' : `/lab/templates/${templateId}`);
  }
}

/** POST /lab/templates/new */
export async function handleLabTemplateCreatePost(context: APIContext): Promise<Response> {
  return handleLabTemplatePost(context, null);
}

/** POST /lab/templates/[id]/edit — the id is extracted by the middleware from the path. */
export async function handleLabTemplateEditPost(context: APIContext, templateId: number): Promise<Response> {
  return handleLabTemplatePost(context, templateId);
}
