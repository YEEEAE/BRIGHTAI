// QC Laboratory Product Master (PROMPT 08, /lab/products).
//
// One module owns the Product Master: the searchable list (URL-driven,
// fully-parameterized SQL, whitelisted sort — same shape as testSearch.ts),
// the detail loader (fields + related equipment + test usage), and the
// create/update service (single transaction covering the
// lab_product_equipment link table). Every change writes the shared
// qc_audit_log with entity_type='LAB_PRODUCT' — never a second audit system.
//
// Historical identity: tests reference products by product_id (canonical)
// and approved tests keep product_snapshot_json frozen at approval
// (written by review.ts) — master edits can never alter an approved test.
//
// "Populate, never overwrite" on the test form: the form reads
// listLabProductReferences() to SUGGEST the product's approved reference
// values and linked documents; measured values stay editable and are never
// silently replaced.

import type { APIContext } from 'astro';
import { getDb, transaction } from '../db';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { canCreateLabProduct, canEditLabProduct, canProposeLabProductCreate, canProposeLabProductEdit } from '../permissions';
import { submitChangeRequest } from './changeRequests';
import type { LabProduct, LabTestType } from '../types';
import { appendQcAudit } from '../audit/qcChain';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../pagination';
import { labProductSchema, parseFormData } from '../validation';

// ─────────────────────────────── Audit ───────────────────────────────

type LabProductAuditAction = 'CREATE' | 'UPDATE';

function auditLabProduct(productId: number, actorId: number, action: LabProductAuditAction, note: string | null = null): void {
  appendQcAudit(getDb(), { entityType: 'LAB_PRODUCT', entityId: productId, actorId, action, note });
}

/** Change history for one product — the shared audit log, newest first. */
export function getLabProductAuditTimeline(productId: number): Array<Record<string, unknown>> {
  return getDb()
    .prepare(
      `SELECT a.id, a.action, a.note, a.created_at, u.full_name AS actor_name
       FROM qc_audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_PRODUCT' AND a.entity_id = ?
       ORDER BY a.created_at DESC, a.id DESC`,
    )
    .all(productId) as Array<Record<string, unknown>>;
}

// ─────────────────────────────── List / search ───────────────────────────────

export type LabProductSortField = 'code' | 'name' | 'connector_type' | 'default_test_type' | 'is_active' | 'updated_at';

export const LAB_PRODUCT_SORT_FIELDS: readonly LabProductSortField[] = [
  'code',
  'name',
  'connector_type',
  'default_test_type',
  'is_active',
  'updated_at',
];

export const LAB_PRODUCT_PER_PAGE_OPTIONS = PER_PAGE_OPTIONS;
export const DEFAULT_LAB_PRODUCT_PER_PAGE = DEFAULT_PER_PAGE;
export const DEFAULT_LAB_PRODUCT_SORT: LabProductSortField = 'updated_at';
export const DEFAULT_LAB_PRODUCT_DIR: 'asc' | 'desc' = 'desc';

export interface LabProductSearchFilters {
  /** Free text — code / name / description (LIKE). */
  q: string | null;
  connector_type: string | null;
  default_test_type: LabTestType | null;
  active: '1' | '0' | null;
  sort: LabProductSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_PRODUCT_FILTERS: LabProductSearchFilters = {
  q: null,
  connector_type: null,
  default_test_type: null,
  active: null,
  sort: DEFAULT_LAB_PRODUCT_SORT,
  dir: DEFAULT_LAB_PRODUCT_DIR,
  page: 1,
  per_page: DEFAULT_LAB_PRODUCT_PER_PAGE,
};

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeProductLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Parse + validate the /lab/products query params into a typed filter object.
 * Invalid values are silently dropped (never throws) — same contract as
 * parseLabTestSearchFilters minus the flash (this list has no date window).
 */
export function parseLabProductSearchFilters(url: URL): LabProductSearchFilters {
  const f: LabProductSearchFilters = { ...NO_LAB_PRODUCT_FILTERS };
  const sp = url.searchParams;
  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);
  const connector = sp.get('connector');
  if (connector && connector.trim() !== '') f.connector_type = connector.trim().slice(0, 200);
  const type = sp.get('type');
  if (type === 'air' || type === 'vacuum') f.default_test_type = type;
  const active = sp.get('active');
  if (active === '1' || active === '0') f.active = active;
  const sort = sp.get('sort');
  if (sort && (LAB_PRODUCT_SORT_FIELDS as readonly string[]).includes(sort)) f.sort = sort as LabProductSortField;
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;
  const page = positiveInt(sp.get('page') ?? '');
  if (page !== null) f.page = page;
  const per = positiveInt(sp.get('per') ?? '');
  if (per !== null && (LAB_PRODUCT_PER_PAGE_OPTIONS as readonly number[]).includes(per)) f.per_page = per;
  return f;
}

/** True when any list filter is active (drives the "Reset" affordance). */
export function hasLabProductFilters(f: LabProductSearchFilters): boolean {
  return Boolean(f.q || f.connector_type || f.default_test_type || f.active !== null);
}

/** Rebuild the querystring for the current filters (sort/pagination links). */
export function labProductFiltersToQuery(f: LabProductSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.connector_type) sp.set('connector', f.connector_type);
  if (f.default_test_type) sp.set('type', f.default_test_type);
  if (f.active !== null) sp.set('active', f.active);
  if (f.sort !== DEFAULT_LAB_PRODUCT_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_PRODUCT_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_PRODUCT_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fully-parameterized WHERE builder for the product list. Exported for unit
 * tests: the SQL text NEVER contains user input — every value rides in the
 * returned params in placeholder order.
 */
export function buildLabProductWhere(f: LabProductSearchFilters): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    const like = `%${escapeProductLike(f.q)}%`;
    conds.push("(p.code LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')");
    params.push(like, like, like);
  }
  if (f.connector_type) {
    conds.push('p.connector_type = ?');
    params.push(f.connector_type);
  }
  if (f.default_test_type) {
    conds.push('p.default_test_type = ?');
    params.push(f.default_test_type);
  }
  if (f.active !== null) {
    conds.push('p.is_active = ?');
    params.push(Number(f.active));
  }
  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

/** Whitelisted sort expression per field — raw input is never used as SQL. */
const SORT_SQL: Record<LabProductSortField, string> = {
  code: 'p.code COLLATE NOCASE',
  name: 'p.name COLLATE NOCASE',
  connector_type: 'p.connector_type COLLATE NOCASE',
  default_test_type: 'p.default_test_type',
  is_active: 'p.is_active',
  updated_at: 'p.updated_at',
};

export interface LabProductListRow {
  id: number;
  code: string;
  name: string;
  connector_type: string | null;
  default_test_type: LabTestType | null;
  is_active: number;
  updated_at: string;
  test_count: number;
}

export interface LabProductSearchResult {
  rows: LabProductListRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const LIST_SELECT = `SELECT p.id, p.code, p.name, p.connector_type, p.default_test_type, p.is_active, p.updated_at,
  (SELECT COUNT(*) FROM lab_test_records t WHERE t.product_id = p.id) AS test_count
FROM lab_products p`;

/** Paged, sorted, filtered Product Master list. All SQL is parameterized. */
export function searchLabProducts(f: LabProductSearchFilters): LabProductSearchResult {
  const db = getDb();
  const where = buildLabProductWhere(f);
  const totalRow = db.prepare(`SELECT COUNT(*) AS n FROM lab_products p ${where.sql}`).get(...where.params) as { n: number };
  const total = Number(totalRow.n);
  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const rows = db
    .prepare(`${LIST_SELECT} ${where.sql} ORDER BY ${SORT_SQL[f.sort]} ${dir}, p.id DESC LIMIT ? OFFSET ?`)
    .all(...where.params, f.per_page, offset) as LabProductListRow[];
  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ─────────────────────────────── Detail ───────────────────────────────

export interface LabProductDetailView {
  product: LabProduct;
  template_name: string | null;
  template_code: string | null;
  sop_title: string | null;
  sop_code: string | null;
  wi_title: string | null;
  wi_code: string | null;
  equipment: Array<{ id: number; name: string; code: string }>;
  test_count: number;
}

/** Full detail view: fields, resolved reference names, related equipment, usage. */
export function getLabProductDetail(id: number): LabProductDetailView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = getDb()
    .prepare(
      `SELECT p.*, t.name AS template_name, t.code AS template_code,
              sop.title AS sop_title, sop.code AS sop_code,
              wi.title AS wi_title, wi.code AS wi_code
       FROM lab_products p
       LEFT JOIN lab_test_templates t ON t.id = p.default_template_id
       LEFT JOIN lab_documents sop ON sop.id = p.applicable_sop_id
       LEFT JOIN lab_documents wi ON wi.id = p.applicable_wi_id
       WHERE p.id = ?`,
    )
    .get(id) as (LabProduct & Partial<LabProductDetailView>) | undefined;
  if (!row) return null;
  const equipment = getDb()
    .prepare(
      `SELECT e.id, e.name, e.code
       FROM lab_product_equipment pe JOIN lab_equipment e ON e.id = pe.equipment_id
       WHERE pe.product_id = ? ORDER BY e.name COLLATE NOCASE ASC, e.id ASC`,
    )
    .all(id) as Array<{ id: number; name: string; code: string }>;
  const usage = getDb()
    .prepare('SELECT COUNT(*) AS n FROM lab_test_records WHERE product_id = ?')
    .get(id) as { n: number };
  const { template_name, template_code, sop_title, sop_code, wi_title, wi_code, ...product } = row;
  return {
    product: product as unknown as LabProduct,
    template_name: template_name ?? null,
    template_code: template_code ?? null,
    sop_title: sop_title ?? null,
    sop_code: sop_code ?? null,
    wi_title: wi_title ?? null,
    wi_code: wi_code ?? null,
    equipment,
    test_count: Number(usage.n),
  };
}

/** Ids of the equipment linked to a product (edit form prefill). */
export function getLabProductEquipmentIds(productId: number): number[] {
  return (
    getDb()
      .prepare('SELECT equipment_id FROM lab_product_equipment WHERE product_id = ? ORDER BY equipment_id ASC')
      .all(productId) as Array<{ equipment_id: number }>
  ).map((r) => Number(r.equipment_id));
}

// ─────────────────────────────── Dropdown data ───────────────────────────────

/** Non-archived equipment for the "Related Equipment" checkboxes. */
export function listLabEquipmentForProductForm(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_equipment WHERE is_archived = 0 ORDER BY name COLLATE NOCASE ASC, id ASC')
    .all() as Array<{ id: number; name: string; code: string }>;
}

/** Test templates (any status — status is display info, not a form gate). */
export function listLabTemplatesForProductForm(): Array<{ id: number; name: string; code: string; test_type: string }> {
  return getDb()
    .prepare('SELECT id, name, code, test_type FROM lab_test_templates ORDER BY name COLLATE NOCASE ASC, id ASC')
    .all() as Array<{ id: number; name: string; code: string; test_type: string }>;
}

/** Approved SOP / WI controlled documents for the applicable-SOP/WI selects. */
export function listLabDocumentsForProductForm(
  type: 'SOP' | 'WI',
): Array<{ id: number; title: string; code: string }> {
  return getDb()
    .prepare("SELECT id, title, code FROM lab_documents WHERE type = ? AND status = 'APPROVED' ORDER BY code COLLATE NOCASE ASC, id ASC")
    .all(type) as Array<{ id: number; title: string; code: string }>;
}

// ─────────────────────────────── Create / update ───────────────────────────────

/** Normalized form input after Zod validation (labProductSchema). */
export interface LabProductFormData {
  name: string;
  code: string;
  description: string | null;
  connector_type: string | null;
  default_test_type: LabTestType | null;
  default_template_id: number | null;
  applicable_sop_id: number | null;
  applicable_wi_id: number | null;
  equipment_ids: number[];
  is_active: boolean;
  notes: string | null;
}

/** Thrown on UNIQUE(code) collisions so the handlers can flash a clear message. */
export class LabProductCodeConflictError extends Error {
  constructor(code: string) {
    super(`A product with code "${code}" already exists.`);
    this.name = 'LabProductCodeConflictError';
  }
}

function assertCodeAvailable(code: string, excludeId: number | null): void {
  const row = getDb().prepare('SELECT id FROM lab_products WHERE code = ? COLLATE NOCASE LIMIT 1').get(code) as
    | { id: number }
    | undefined;
  if (row && Number(row.id) !== excludeId) throw new LabProductCodeConflictError(code);
}

/** Assert every referenced id exists (templates/documents/equipment). */
function assertReferencesExist(data: LabProductFormData): void {
  const db = getDb();
  if (data.default_template_id !== null && !db.prepare('SELECT 1 FROM lab_test_templates WHERE id = ?').get(data.default_template_id)) {
    throw new Error('The selected test template does not exist.');
  }
  for (const [id, label] of [
    [data.applicable_sop_id, 'SOP'],
    [data.applicable_wi_id, 'WI'],
  ] as Array<[number | null, string]>) {
    if (id !== null && !db.prepare('SELECT 1 FROM lab_documents WHERE id = ?').get(id)) {
      throw new Error(`The selected ${label} document does not exist.`);
    }
  }
  const invalidEquipment = data.equipment_ids.filter((eid) => !db.prepare('SELECT 1 FROM lab_equipment WHERE id = ?').get(eid));
  if (invalidEquipment.length > 0) {
    throw new Error('One or more selected equipment entries do not exist.');
  }
}

function replaceEquipmentLinks(productId: number, equipmentIds: number[]): void {
  const db = getDb();
  db.prepare('DELETE FROM lab_product_equipment WHERE product_id = ?').run(productId);
  const insert = db.prepare('INSERT INTO lab_product_equipment (product_id, equipment_id) VALUES (?, ?)');
  for (const eid of [...new Set(equipmentIds)].sort((a, b) => a - b)) insert.run(productId, eid);
}

function formSummary(data: LabProductFormData): string {
  return [
    `code=${data.code}`,
    `connector=${data.connector_type ?? '—'}`,
    `test_type=${data.default_test_type ?? '—'}`,
    `active=${data.is_active ? 1 : 0}`,
    `equipment=${data.equipment_ids.length}`,
  ].join('; ');
}

/** Create a Product Master row + equipment links + CREATE audit (one transaction). */
export function createLabProduct(data: LabProductFormData, actorId: number): number {
  return transaction(() => {
    const db = getDb();
    assertReferencesExist(data);
    assertCodeAvailable(data.code, null);
    const result = db
      .prepare(
        `INSERT INTO lab_products (
           name, code, description, connector_type, default_test_type,
           default_template_id, applicable_sop_id, applicable_wi_id,
           is_active, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.name,
        data.code,
        data.description,
        data.connector_type,
        data.default_test_type,
        data.default_template_id,
        data.applicable_sop_id,
        data.applicable_wi_id,
        data.is_active ? 1 : 0,
        data.notes,
        actorId,
      );
    const id = Number(result.lastInsertRowid);
    replaceEquipmentLinks(id, data.equipment_ids);
    auditLabProduct(id, actorId, 'CREATE', formSummary(data));
    return id;
  });
}

/** Update a Product Master row + equipment links + UPDATE audit (one transaction). */
export function updateLabProduct(id: number, data: LabProductFormData, actorId: number): void {
  transaction(() => {
    const db = getDb();
    const existing = db.prepare('SELECT id, code FROM lab_products WHERE id = ?').get(id) as { id: number; code: string } | undefined;
    if (!existing) throw new Error('Product not found.');
    assertReferencesExist(data);
    assertCodeAvailable(data.code, id);
    db.prepare(
      `UPDATE lab_products SET
         name = ?, code = ?, description = ?, connector_type = ?, default_test_type = ?,
         default_template_id = ?, applicable_sop_id = ?, applicable_wi_id = ?,
         is_active = ?, notes = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      data.name,
      data.code,
      data.description,
      data.connector_type,
      data.default_test_type,
      data.default_template_id,
      data.applicable_sop_id,
      data.applicable_wi_id,
      data.is_active ? 1 : 0,
      data.notes,
      id,
    );
    replaceEquipmentLinks(id, data.equipment_ids);
    const codeChanged = existing.code !== data.code;
    auditLabProduct(id, actorId, 'UPDATE', `${formSummary(data)}${codeChanged ? `; code_changed_from=${existing.code}` : ''}`);
  });
}

// ─────────────────────────────── Archive / restore (PROMPT 43-A) ───────────────────────────────

export class LabProductNotFoundError extends Error {
  constructor() {
    super('Product not found.');
    this.name = 'LabProductNotFoundError';
  }
}

/**
 * Toggle is_active on a Product Master row (PROMPT 43-A) — archive or restore.
 * Audited with the reserved STATUS_TRANSITION verb (same as template archive;
 * the qc_audit_log CHECK from migration 011 has no dedicated ARCHIVE verb),
 * old/new values carry the ACTIVE/INACTIVE transition. Archiving is allowed
 * even when non-VOID tests reference the product: product_id stays the
 * canonical relationship, historical tests keep their rows (and approved
 * tests keep their frozen product snapshot), and the Data Quality Center
 * already reports `product_inactive_in_use` live — no silent writes.
 */
export function setLabProductActive(productId: number, active: boolean, actorId: number): void {
  transaction(() => {
    const row = getDb().prepare('SELECT id, code, is_active FROM lab_products WHERE id = ?').get(productId) as
      | { id: number; code: string; is_active: number }
      | undefined;
    if (!row) throw new LabProductNotFoundError();
    const next = active ? 1 : 0;
    if (Number(row.is_active) === next) {
      throw new Error(active ? 'The product is already active.' : 'The product is already inactive.');
    }
    getDb().prepare("UPDATE lab_products SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(next, productId);
    appendQcAudit(getDb(), {
      entityType: 'LAB_PRODUCT', entityId: productId, actorId, action: 'STATUS_TRANSITION',
      oldValue: row.is_active === 1 ? 'ACTIVE' : 'INACTIVE', newValue: next === 1 ? 'ACTIVE' : 'INACTIVE',
      note: active ? `restored ${row.code}` : `archived ${row.code}${nonVoidTestCount(productId) > 0 ? '; used by non-VOID tests (product_inactive_in_use)' : ''}`,
    });
  });
}

function nonVoidTestCount(productId: number): number {
  return Number(
    (getDb().prepare("SELECT COUNT(*) AS n FROM lab_test_records WHERE product_id = ? AND status <> 'VOID'").get(productId) as { n: number }).n,
  );
}

/**
 * POST /lab/products/[id]/archive|restore — the dedicated is_active toggle
 * (canEditLabProduct). Product id from the path segment only; CSRF is the
 * existing origin check. Flash + redirect back to the product detail.
 */
export async function handleLabProductArchivePost(context: APIContext, productId: number, restore: boolean): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(`/lab/products/${productId}`)}`);
  }
  if (!canEditLabProduct(user.role)) {
    setFlash(context, 'error', 'You do not have permission to manage the Product Master.');
    return context.redirect(`/lab/products/${productId}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  try {
    setLabProductActive(productId, restore, user.id);
    setFlash(context, 'success', restore ? 'Product restored to active.' : 'Product archived — it no longer appears on new-test forms.');
  } catch (err) {
    if (err instanceof LabProductNotFoundError) {
      setFlash(context, 'error', 'Product not found.');
    } else {
      setFlash(context, 'error', err instanceof Error ? err.message : 'Could not update the product.');
    }
  }
  return context.redirect(`/lab/products/${productId}`);
}

// ─────────────────────────────── Test-form reference data ───────────────────────────────

export interface LabProductReference {
  id: number;
  name: string;
  code: string;
  connector_type: string | null;
  default_test_type: LabTestType | null;
  template_name: string | null;
  sop_title: string | null;
  sop_code: string | null;
  wi_title: string | null;
  wi_code: string | null;
}

/**
 * Active products with their approved linked documents and defaults — the
 * data behind the test form's "populate suggestions" panel. The form ONLY
 * prefills untouched/empty fields and displays the linked documents; it
 * never overwrites values the tester entered (page reference §28/§78).
 */
export function listLabProductReferences(): LabProductReference[] {
  return getDb()
    .prepare(
      `SELECT p.id, p.name, p.code, p.connector_type, p.default_test_type,
              t.name AS template_name,
              sop.title AS sop_title, sop.code AS sop_code,
              wi.title AS wi_title, wi.code AS wi_code
       FROM lab_products p
       LEFT JOIN lab_test_templates t ON t.id = p.default_template_id
       LEFT JOIN lab_documents sop ON sop.id = p.applicable_sop_id
       LEFT JOIN lab_documents wi ON wi.id = p.applicable_wi_id
       WHERE p.is_active = 1
       ORDER BY p.name COLLATE NOCASE ASC, p.id ASC`,
    )
    .all() as LabProductReference[];
}

// ─────────────────────────────── POST handlers ───────────────────────────────

/**
 * Shared POST body for create + edit (middleware short-circuit — same pattern
 * as handleLabTestFormPost). `productId` comes from the matched path segment,
 * never from the body. Re-checks the permission, CSRF-validates, then flashes
 * + redirects back to the product.
 */
async function handleLabProductPost(context: APIContext, productId: number | null): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const allowed = productId === null
    ? canCreateLabProduct(user.role) || canProposeLabProductCreate(user.role)
    : canEditLabProduct(user.role) || canProposeLabProductEdit(user.role);
  if (!allowed) {
    setFlash(context, 'error', 'You do not have permission to manage the Product Master.');
    return context.redirect('/lab/products');
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  const backUrl = productId === null ? '/lab/products/new' : `/lab/products/${productId}/edit`;
  const form = await context.request.formData();

  // the same way testSearch.ts does (validation.ts has no ?raw imports, but
  // the pattern is consistent and cheap).
  const parsed = parseFormData(labProductSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }

  // The form serializes the "Related Equipment" checkboxes as duplicate
  // `equipment_ids` entries; collect them before schema-level typing.
  const equipmentIds = [...form.getAll('equipment_ids')].map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
  const data: LabProductFormData = {
    ...(parsed.data as Omit<LabProductFormData, 'equipment_ids'>),
    equipment_ids: equipmentIds,
  };
  if (!canCreateLabProduct(user.role) && !canEditLabProduct(user.role)) data.is_active = true;

  try {
    if (!canCreateLabProduct(user.role) && !canEditLabProduct(user.role)) {
      const request = submitChangeRequest({
        actor: { id: user.id, role: user.role },
        entity_type: 'PRODUCT',
        operation: productId === null ? 'CREATE' : 'UPDATE',
        entity_id: productId,
        payload: { entity_type: 'PRODUCT', data },
      });
      setFlash(context, 'success', 'Product proposal submitted for management review.');
      return context.redirect(`/lab/change-requests/${request.id}`);
    }
    if (productId === null) {
      const id = createLabProduct(data, user.id);
      setFlash(context, 'success', `Product ${data.code} created.`);
      return context.redirect(`/lab/products/${id}`);
    }
    updateLabProduct(productId, data, user.id);
    setFlash(context, 'success', `Product ${data.code} updated.`);
    return context.redirect(`/lab/products/${productId}`);
  } catch (err) {
    if (err instanceof LabProductCodeConflictError) {
      setFlash(context, 'error', err.message);
    } else {
      console.error('[lab] product form save failure', err);
      setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the product.');
    }
    return context.redirect(backUrl);
  }
}

/** POST /lab/products/new */
export async function handleLabProductCreatePost(context: APIContext): Promise<Response> {
  return handleLabProductPost(context, null);
}

/** POST /lab/products/[id]/edit — the id is extracted by the middleware from the path. */
export async function handleLabProductEditPost(context: APIContext, productId: number): Promise<Response> {
  return handleLabProductPost(context, productId);
}
