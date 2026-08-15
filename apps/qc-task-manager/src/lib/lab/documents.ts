// QC Laboratory controlled documents register (PROMPT 39, /lab/documents).
//
// The SOP/WI library register (page reference §39) lists controlled documents
// from lab_documents (migration 013): document code, title, type (SOP/WI),
// current version (via current_version_id → lab_document_versions), status,
// owner, effective date, review due date, updated at. Identity lives in
// lab_documents while numbered content lives in lab_document_versions; the
// register joins the current version so the "Version" column shows the live
// version number (v{n}) or — when no version exists yet.
//
// Statuses are the stored five-state values (DRAFT / IN_REVIEW / APPROVED /
// SUPERSEDED / ARCHIVED) — unlike calibration, nothing is derived. Approved
// versions are immutable (contract §41/§42/§44): editing an APPROVED document
// creates a NEW DRAFT version; the approved version never mutates. This module
// is read-only; the editor/workflow pages arrive in later prompts.
//
// Filters: type / status / owner / equipment / product / review due (review=due
// matches the command-center KPI semantics in overview.ts: active documents
// whose review_due_date has been reached). Search (q) covers title, code,
// product name, and equipment code/name. All values are bound parameters; sort
// is a whitelisted union; pagination is server-side with total_pages clamping.

import { getDb } from '../db';
import type { LabDocumentStatus, LabDocumentType } from '../types';

// ─────────────────────────────── Policy ───────────────────────────────

/** Document types (lab_documents.type CHECK, migration 013). */
export const LAB_DOCUMENT_TYPES: readonly LabDocumentType[] = ['SOP', 'WI'];

/** Document statuses (lab_documents.status / lab_document_versions.status CHECKs). */
export const LAB_DOCUMENT_STATUSES: readonly LabDocumentStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'SUPERSEDED',
  'ARCHIVED',
];

export const LAB_DOCUMENT_STATUS_LABELS: Record<LabDocumentStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  SUPERSEDED: 'Superseded',
  ARCHIVED: 'Archived',
};

/** Document type badge labels. */
export const LAB_DOCUMENT_TYPE_LABELS: Record<LabDocumentType, string> = {
  SOP: 'SOP',
  WI: 'WI',
};

// ─────────────────────────────── List / search ───────────────────────────────

export type LabDocumentSortField =
  | 'code'
  | 'title'
  | 'type'
  | 'version'
  | 'status'
  | 'owner'
  | 'effective_date'
  | 'review_due_date'
  | 'updated_at';

export const LAB_DOCUMENT_SORT_FIELDS: readonly LabDocumentSortField[] = [
  'code',
  'title',
  'type',
  'version',
  'status',
  'owner',
  'effective_date',
  'review_due_date',
  'updated_at',
];

export const LAB_DOCUMENT_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_DOCUMENT_PER_PAGE = 25;
export const DEFAULT_LAB_DOCUMENT_SORT: LabDocumentSortField = 'updated_at';
export const DEFAULT_LAB_DOCUMENT_DIR: 'asc' | 'desc' = 'desc';

export interface LabDocumentSearchFilters {
  /** Free text — title, code, product name, equipment code/name (LIKE). */
  q: string | null;
  /** Document type filter — SOP or WI. */
  type: LabDocumentType | null;
  /** Stored status filter — one of LAB_DOCUMENT_STATUSES. */
  status: LabDocumentStatus | null;
  /** Restrict to one owner (users.id). */
  owner: number | null;
  /** Restrict to documents linked to one equipment id (lab_document_links). */
  equipment: number | null;
  /** Restrict to documents for one product id (product_id or PRODUCT link). */
  product: number | null;
  /** 'due' → active documents whose review_due_date has been reached (KPI). */
  review: 'due' | null;
  sort: LabDocumentSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_DOCUMENT_FILTERS: LabDocumentSearchFilters = {
  q: null,
  type: null,
  status: null,
  owner: null,
  equipment: null,
  product: null,
  review: null,
  sort: DEFAULT_LAB_DOCUMENT_SORT,
  dir: DEFAULT_LAB_DOCUMENT_DIR,
  page: 1,
  per_page: DEFAULT_LAB_DOCUMENT_PER_PAGE,
};

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeDocumentLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Local ISO date for today (matches overview.ts review-due semantics). */
function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parse + validate the /lab/documents query params. Invalid values drop silently. */
export function parseLabDocumentSearchFilters(url: URL): LabDocumentSearchFilters {
  const f: LabDocumentSearchFilters = { ...NO_LAB_DOCUMENT_FILTERS };
  const sp = url.searchParams;
  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);
  const type = sp.get('type');
  if (type && (LAB_DOCUMENT_TYPES as readonly string[]).includes(type)) {
    f.type = type as LabDocumentType;
  }
  const status = sp.get('status');
  if (status && (LAB_DOCUMENT_STATUSES as readonly string[]).includes(status)) {
    f.status = status as LabDocumentStatus;
  }
  const owner = positiveInt(sp.get('owner') ?? '');
  if (owner !== null) f.owner = owner;
  const equipment = positiveInt(sp.get('equipment') ?? '');
  if (equipment !== null) f.equipment = equipment;
  const product = positiveInt(sp.get('product') ?? '');
  if (product !== null) f.product = product;
  if (sp.get('review') === 'due') f.review = 'due';
  const sort = sp.get('sort');
  if (sort && (LAB_DOCUMENT_SORT_FIELDS as readonly string[]).includes(sort)) f.sort = sort as LabDocumentSortField;
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;
  const page = positiveInt(sp.get('page') ?? '');
  if (page !== null) f.page = page;
  const per = positiveInt(sp.get('per') ?? '');
  if (per !== null && (LAB_DOCUMENT_PER_PAGE_OPTIONS as readonly number[]).includes(per)) f.per_page = per;
  return f;
}

/** True when any list filter is active (drives the "Reset" affordance). */
export function hasLabDocumentFilters(f: LabDocumentSearchFilters): boolean {
  return Boolean(
    f.q || f.type || f.status || f.owner !== null || f.equipment !== null || f.product !== null || f.review !== null,
  );
}

/** Rebuild the querystring for the current filters (sort/pagination links). */
export function labDocumentFiltersToQuery(f: LabDocumentSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.type) sp.set('type', f.type);
  if (f.status) sp.set('status', f.status);
  if (f.owner !== null) sp.set('owner', String(f.owner));
  if (f.equipment !== null) sp.set('equipment', String(f.equipment));
  if (f.product !== null) sp.set('product', String(f.product));
  if (f.review === 'due') sp.set('review', 'due');
  if (f.sort !== DEFAULT_LAB_DOCUMENT_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_DOCUMENT_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_DOCUMENT_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

const LAB_DOCUMENT_LIST_SELECT = `
  SELECT d.id, d.code, d.title, d.type, d.status,
         d.effective_date, d.review_due_date, d.owner_id, d.created_at, d.updated_at,
         v.version,
         u.full_name AS owner_name,
         p.name AS product_name`;

const LAB_DOCUMENT_LIST_FROM = `
  FROM lab_documents d
  LEFT JOIN lab_document_versions v ON v.id = d.current_version_id
  LEFT JOIN users u ON u.id = d.owner_id
  LEFT JOIN lab_products p ON p.id = d.product_id`;

/** Whitelisted sort expression per field — raw input is never used as SQL. */
const SORT_SQL: Record<LabDocumentSortField, string> = {
  code: 'd.code COLLATE NOCASE',
  title: 'd.title COLLATE NOCASE',
  type: 'd.type',
  version: 'version',
  status: 'd.status',
  owner: 'owner_name COLLATE NOCASE',
  effective_date: 'd.effective_date',
  review_due_date: 'd.review_due_date',
  updated_at: 'd.updated_at',
};

/** Equipment link exists for a document (id comes in via params). */
const EQUIPMENT_LINK_EXISTS = `EXISTS (
  SELECT 1 FROM lab_document_links l
  JOIN lab_equipment e ON e.id = l.entity_id
  WHERE l.document_id = d.id AND l.entity_type = 'EQUIPMENT'`;

/** Product link exists for a document (id comes in via params). */
const PRODUCT_LINK_EXISTS = `EXISTS (
  SELECT 1 FROM lab_document_links l
  WHERE l.document_id = d.id AND l.entity_type = 'PRODUCT'`;

/** Product name/code through the PRODUCT link (used by the free-text search). */
const PRODUCT_LINK_NAME_EXISTS = `EXISTS (
  SELECT 1 FROM lab_document_links lp
  JOIN lab_products lpp ON lpp.id = lp.entity_id
  WHERE lp.document_id = d.id AND lp.entity_type = 'PRODUCT'`;

export interface LabDocumentListRow {
  id: number;
  code: string;
  title: string;
  type: LabDocumentType;
  status: LabDocumentStatus;
  version: number | null;
  owner_id: number | null;
  owner_name: string | null;
  product_name: string | null;
  effective_date: string | null;
  review_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabDocumentSearchResult {
  rows: LabDocumentListRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Paged, sorted, filtered SOP/WI library register. The current version comes
 * from the current_version_id join; owner/product are LEFT JOINs; equipment and
 * product filters use the typed lab_document_links table (migration 013).
 * Every value rides in the params array — no user input in SQL text.
 */
export function searchLabDocuments(f: LabDocumentSearchFilters): LabDocumentSearchResult {
  const db = getDb();
  const conds: string[] = [];
  const params: unknown[] = [];

  if (f.q) {
    const like = `%${escapeDocumentLike(f.q)}%`;
    conds.push(
      "(d.title LIKE ? ESCAPE '\\' OR d.code LIKE ? ESCAPE '\\' " +
        "OR p.name LIKE ? ESCAPE '\\' OR p.code LIKE ? ESCAPE '\\' " +
        `OR ${PRODUCT_LINK_NAME_EXISTS} AND (lpp.name LIKE ? ESCAPE '\\' OR lpp.code LIKE ? ESCAPE '\\')) ` +
        `OR ${EQUIPMENT_LINK_EXISTS} AND (e.code LIKE ? ESCAPE '\\' OR e.name LIKE ? ESCAPE '\\')))`,
    );
    params.push(like, like, like, like, like, like, like, like);
  }
  if (f.type) {
    conds.push('d.type = ?');
    params.push(f.type);
  }
  if (f.status) {
    conds.push('d.status = ?');
    params.push(f.status);
  }
  if (f.owner !== null) {
    conds.push('d.owner_id = ?');
    params.push(f.owner);
  }
  if (f.equipment !== null) {
    conds.push(`${EQUIPMENT_LINK_EXISTS} AND l.entity_id = ?)`);
    params.push(f.equipment);
  }
  if (f.product !== null) {
    conds.push(`(d.product_id = ? OR ${PRODUCT_LINK_EXISTS} AND l.entity_id = ?))`);
    params.push(f.product, f.product);
  }
  if (f.review === 'due') {
    // Command-center KPI semantics (overview.ts): active + review date reached.
    conds.push("d.status NOT IN ('SUPERSEDED', 'ARCHIVED') AND d.review_due_date IS NOT NULL AND date(d.review_due_date) <= date(?)");
    params.push(isoToday());
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS n FROM lab_documents d LEFT JOIN lab_products p ON p.id = d.product_id ${where}`)
    .get(...params) as { n: number };
  const total = Number(totalRow.n);
  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const rows = db
    .prepare(
      `${LAB_DOCUMENT_LIST_SELECT} ${LAB_DOCUMENT_LIST_FROM} ${where}
       ORDER BY ${SORT_SQL[f.sort]} ${dir}, d.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, f.per_page, offset) as LabDocumentListRow[];
  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ─────────────────────────────── Dropdowns ───────────────────────────────

/** Owners that own at least one document (owner filter dropdown). */
export function listLabDocumentOwners(): Array<{ id: number; full_name: string }> {
  return getDb()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name
       FROM lab_documents d JOIN users u ON u.id = d.owner_id
       ORDER BY u.full_name COLLATE NOCASE ASC`,
    )
    .all() as Array<{ id: number; full_name: string }>;
}

/** Equipment linked to at least one document (equipment filter dropdown). */
export function listLabDocumentEquipmentOptions(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare(
      `SELECT DISTINCT e.id, e.name, e.code
       FROM lab_document_links l JOIN lab_equipment e ON e.id = l.entity_id
       WHERE l.entity_type = 'EQUIPMENT'
       ORDER BY e.name COLLATE NOCASE ASC`,
    )
    .all() as Array<{ id: number; name: string; code: string }>;
}

/** Products owned by a document (product_id or PRODUCT link) — product filter dropdown. */
export function listLabDocumentProductOptions(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare(
      `SELECT DISTINCT p.id, p.name, p.code
       FROM lab_products p
       WHERE p.id IN (SELECT product_id FROM lab_documents WHERE product_id IS NOT NULL)
          OR p.id IN (SELECT entity_id FROM lab_document_links WHERE entity_type = 'PRODUCT')
       ORDER BY p.name COLLATE NOCASE ASC`,
    )
    .all() as Array<{ id: number; name: string; code: string }>;
}