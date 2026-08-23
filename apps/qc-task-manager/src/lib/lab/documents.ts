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
// creates a NEW DRAFT version; the approved version never mutates.
//
// Since PROMPT 41 this module also owns the document editor + versioning: it
// writes identity (lab_documents) + numbered content (lab_document_versions)
// + equipment links (lab_document_links) + the qc_audit_log row in a single
// transaction. The create/edit handlers are shared middleware short-circuits.
//
// Filters: type / status / owner / equipment / product / review due (review=due
// matches the command-center KPI semantics in overview.ts: active documents
// whose review_due_date has been reached). Search (q) covers title, code,
// product name, and equipment code/name. All values are bound parameters; sort
// is a whitelisted union; pagination is server-side with total_pages clamping.

import type { APIContext } from 'astro';
import { getDb, transaction } from '../db';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { createNotification } from '../notifications';
import {
  canApproveLabDocumentRecord,
  canArchiveLabDocument,
  canCreateLabDocument,
  canEditLabDocumentRecord,
  canReviewLabDocumentRecord,
} from '../permissions';
import type { LabDocument, LabDocumentStatus, LabDocumentType, LabDocumentVersion, Role } from '../types';
import { renderDocumentContent } from './documentContent';
import {
  ESIGN_FAILURE_MESSAGE_AR,
  ESIGN_FIELD_NAME,
  ESIGN_RATE_LIMITED_MESSAGE_AR,
  esignAuditNote,
  requireEsignature,
} from './esignature';

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

// ─────────────────────────────── Review state (derived) ───────────────────────────────

/**
 * Derived review-timing state for a controlled document (review management).
 * Computed at read time from review_due_date — never stored. Windows are
 * mutually exclusive and mirror the review-scheduling buckets (30 / 15 / 7
 * days remaining, due today, overdue):
 *   - OVERDUE      review_due_date < today
 *   - DUE_TODAY    review_due_date = today
 *   - DUE_7        today < review_due_date <= today + 7
 *   - DUE_15       today + 7 < review_due_date <= today + 15
 *   - DUE_30       today + 15 < review_due_date <= today + 30
 *   - OK           review_due_date > today + 30
 * null (no review date) → no state. SUPERSEDED / ARCHIVED documents never
 * match the review windows (active-only, same KPI semantics as review=due in
 * overview.ts), though the row badge still shows their factual state.
 */
export type LabDocumentReviewState = 'OVERDUE' | 'DUE_TODAY' | 'DUE_7' | 'DUE_15' | 'DUE_30' | 'OK';

export const LAB_DOCUMENT_REVIEW_STATE_LABELS: Record<LabDocumentReviewState, string> = {
  OVERDUE: 'Overdue',
  DUE_TODAY: 'Due today',
  DUE_7: 'Due within 7 days',
  DUE_15: 'Due within 15 days',
  DUE_30: 'Due within 30 days',
  OK: 'Current',
};

/** Review-window filter values accepted on the register (?review=…). */
export const LAB_DOCUMENT_REVIEW_FILTERS = ['due', 'overdue', 'today', '7', '15', '30'] as const;
export type LabDocumentReviewFilter = (typeof LAB_DOCUMENT_REVIEW_FILTERS)[number];

/** Local ISO date offset from a base ISO date by `days` (negative = earlier). */
function isoOffsetFrom(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Derive the review-timing state for one document (null when no date). The
 * buckets are mutually exclusive; the 7-day window wins inside 15, and 15
 * wins inside 30 (a due date 5 days out is DUE_7, never DUE_15/DUE_30).
 */
export function deriveDocumentReviewState(
  reviewDueIso: string | null | undefined,
  today = isoOffsetFrom(isoToday(), 0),
): LabDocumentReviewState | null {
  if (!reviewDueIso) return null;
  if (reviewDueIso < today) return 'OVERDUE';
  if (reviewDueIso === today) return 'DUE_TODAY';
  if (reviewDueIso <= isoOffsetFrom(today, 7)) return 'DUE_7';
  if (reviewDueIso <= isoOffsetFrom(today, 15)) return 'DUE_15';
  if (reviewDueIso <= isoOffsetFrom(today, 30)) return 'DUE_30';
  return 'OK';
}

/**
 * SQL CASE expression deriving each row's review state (same windows as
 * deriveDocumentReviewState). The derived alias may be sorted or displayed;
 * all values ride in the params array — no user input in SQL text.
 */
export function documentReviewStateSql(): { sql: string; params: string[] } {
  const today = isoToday();
  return {
    sql: `CASE
      WHEN d.review_due_date IS NULL THEN NULL
      WHEN date(d.review_due_date) < date(?) THEN 'OVERDUE'
      WHEN date(d.review_due_date) = date(?) THEN 'DUE_TODAY'
      WHEN date(d.review_due_date) <= date(?) THEN 'DUE_7'
      WHEN date(d.review_due_date) <= date(?) THEN 'DUE_15'
      WHEN date(d.review_due_date) <= date(?) THEN 'DUE_30'
      ELSE 'OK'
    END`,
    params: [today, today, isoOffsetFrom(today, 7), isoOffsetFrom(today, 15), isoOffsetFrom(today, 30)],
  };
}

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
  | 'review'
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
  'review',
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
  /**
   * Review-timing window filter. 'due' → active documents whose review date
   * has been reached (command-center KPI semantics); 'overdue' / 'today' /
   * '7' / '15' / '30' → the five mutually exclusive review-scheduling buckets
   * (review state derivation in this module).
   */
  review: LabDocumentReviewFilter | null;
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
  const review = sp.get('review');
  if (review && (LAB_DOCUMENT_REVIEW_FILTERS as readonly string[]).includes(review)) {
    f.review = review as LabDocumentReviewFilter;
  }
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
  if (f.review !== null) sp.set('review', f.review);
  if (f.sort !== DEFAULT_LAB_DOCUMENT_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_DOCUMENT_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_DOCUMENT_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

const LAB_DOCUMENT_LIST_SELECT = `
  SELECT d.id, d.code, d.title, d.type, d.status,
         d.effective_date, d.review_due_date, d.owner_id, d.created_by, d.created_at, d.updated_at,
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
  review: 'review_state',
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
  created_by: number;
  effective_date: string | null;
  review_due_date: string | null;
  /** Derived review-timing bucket (review management) — null when no date. */
  review_state: LabDocumentReviewState | null;
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
  } else if (f.review === 'overdue') {
    conds.push("d.status NOT IN ('SUPERSEDED', 'ARCHIVED') AND d.review_due_date IS NOT NULL AND date(d.review_due_date) < date(?)");
    params.push(isoToday());
  } else if (f.review === 'today') {
    conds.push("d.status NOT IN ('SUPERSEDED', 'ARCHIVED') AND d.review_due_date IS NOT NULL AND date(d.review_due_date) = date(?)");
    params.push(isoToday());
  } else if (f.review === '7') {
    conds.push(
      "d.status NOT IN ('SUPERSEDED', 'ARCHIVED') AND d.review_due_date IS NOT NULL " +
        "AND date(d.review_due_date) > date(?) AND date(d.review_due_date) <= date(?, '+7 days')",
    );
    params.push(isoToday(), isoToday());
  } else if (f.review === '15') {
    conds.push(
      "d.status NOT IN ('SUPERSEDED', 'ARCHIVED') AND d.review_due_date IS NOT NULL " +
        "AND date(d.review_due_date) > date(?, '+7 days') AND date(d.review_due_date) <= date(?, '+15 days')",
    );
    params.push(isoToday(), isoToday());
  } else if (f.review === '30') {
    conds.push(
      "d.status NOT IN ('SUPERSEDED', 'ARCHIVED') AND d.review_due_date IS NOT NULL " +
        "AND date(d.review_due_date) > date(?, '+15 days') AND date(d.review_due_date) <= date(?, '+30 days')",
    );
    params.push(isoToday(), isoToday());
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
  const stateSql = documentReviewStateSql();
  const rows = db
    .prepare(
      `${LAB_DOCUMENT_LIST_SELECT},\n${stateSql.sql} AS review_state ${LAB_DOCUMENT_LIST_FROM} ${where}
       ORDER BY ${SORT_SQL[f.sort]} ${dir}, d.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...stateSql.params, ...params, f.per_page, offset) as LabDocumentListRow[];
  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ─────────────────────────────── Review summary ───────────────────────────────

export interface LabDocumentReviewSummary {
  overdue: number;
  due_today: number;
  due_7: number;
  due_15: number;
  due_30: number;
}

/**
 * Per-window counts of ACTIVE documents for the register's review summary
 * strip (30 / 15 / 7 days remaining, due today, overdue). Same active-only
 * semantics as the review filters — SUPERSEDED / ARCHIVED never count.
 */
export function getLabDocumentReviewSummary(): LabDocumentReviewSummary {
  const today = isoToday();
  const row = getDb()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN date(d.review_due_date) < date(?) THEN 1 ELSE 0 END), 0) AS overdue,
         COALESCE(SUM(CASE WHEN date(d.review_due_date) = date(?) THEN 1 ELSE 0 END), 0) AS due_today,
         COALESCE(SUM(CASE WHEN date(d.review_due_date) > date(?) AND date(d.review_due_date) <= date(?, '+7 days') THEN 1 ELSE 0 END), 0) AS due_7,
         COALESCE(SUM(CASE WHEN date(d.review_due_date) > date(?, '+7 days') AND date(d.review_due_date) <= date(?, '+15 days') THEN 1 ELSE 0 END), 0) AS due_15,
         COALESCE(SUM(CASE WHEN date(d.review_due_date) > date(?, '+15 days') AND date(d.review_due_date) <= date(?, '+30 days') THEN 1 ELSE 0 END), 0) AS due_30
       FROM lab_documents d
       WHERE d.status NOT IN ('SUPERSEDED', 'ARCHIVED') AND d.review_due_date IS NOT NULL`,
    )
    .get(today, today, today, today, today, today, today, today) as {
    overdue: number;
    due_today: number;
    due_7: number;
    due_15: number;
    due_30: number;
  };
  return {
    overdue: Number(row.overdue),
    due_today: Number(row.due_today),
    due_7: Number(row.due_7),
    due_15: Number(row.due_15),
    due_30: Number(row.due_30),
  };
}

/** Count of controlled documents currently IN_REVIEW (In Review queue badge). */
export function getLabDocumentInReviewCount(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM lab_documents WHERE status = 'IN_REVIEW'").get() as { n: number };
  return Number(row.n ?? 0);
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

// ─────────────────────────────── Editor (PROMPT 41) ───────────────────────────────

/**
 * One document + its current version + links, ready for the editor page
 * (/lab/documents/[id]/edit). Editing an APPROVED document creates a NEW DRAFT
 * version; the approved version never mutates (contract §41/§42/§44). This
 * module owns document writes (single transaction: row + version + links +
 * qc_audit_log) — never a second audit system.
 */

/** Editor form input after Zod validation (labDocumentSchema). */
export interface LabDocumentFormData {
  type: LabDocumentType;
  code: string;
  title: string;
  description: string | null;
  product_id: number | null;
  owner_id: number | null;
  effective_date: string | null;
  review_due_date: string | null;
  change_summary: string | null;
  content: string;
  equipment_ids: number[];
}

type DocumentActor = number | { id: number; role: Role };

function actorId(actor: DocumentActor): number {
  return typeof actor === 'number' ? actor : actor.id;
}

function actorRole(actor: DocumentActor): Role | null {
  return typeof actor === 'number' ? null : actor.role;
}

/** Editor page view: identity + current version + related-equipment ids. */
export interface LabDocumentEditorView {
  document: LabDocument;
  version: LabDocumentVersion | null;
  equipment_ids: number[];
}

/** Load the editor view for one document (id from the path, never the body). */
export function getLabDocumentEditor(id: number): LabDocumentEditorView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const document = getDb()
    .prepare(
      `SELECT d.*,
              (SELECT full_name FROM users u WHERE u.id = d.owner_id) AS owner_name,
              (SELECT full_name FROM users u WHERE u.id = d.created_by) AS created_by_name
       FROM lab_documents d WHERE d.id = ?`,
    )
    .get(id) as (LabDocument & { owner_name: string | null; created_by_name: string | null }) | undefined;
  if (!document) return null;
  const version = document.current_version_id
    ? (getDb().prepare('SELECT * FROM lab_document_versions WHERE id = ?').get(document.current_version_id) as
        | LabDocumentVersion
        | undefined)
    : null;
  const equipment_ids = (
    getDb()
      .prepare(
        `SELECT entity_id FROM lab_document_links
         WHERE document_id = ? AND entity_type = 'EQUIPMENT'
         ORDER BY entity_id ASC`,
      )
      .all(id) as Array<{ entity_id: number }>
  ).map((r) => Number(r.entity_id));
  return { document, version: version ?? null, equipment_ids };
}

/** Thrown on UNIQUE(code) collisions so the handlers can flash a clear message. */
export class LabDocumentCodeConflictError extends Error {
  constructor(code: string) {
    super(`A document with code "${code}" already exists.`);
    this.name = 'LabDocumentCodeConflictError';
  }
}

function assertDocumentCodeAvailable(code: string, excludeId: number | null): void {
  const row = getDb().prepare('SELECT id FROM lab_documents WHERE code = ? COLLATE NOCASE LIMIT 1').get(code) as
    | { id: number }
    | undefined;
  if (row && Number(row.id) !== excludeId) throw new LabDocumentCodeConflictError(code);
}

/** Assert every referenced id exists (owner/product/equipment). */
function assertDocumentReferencesExist(data: LabDocumentFormData): void {
  const db = getDb();
  if (data.owner_id !== null && !db.prepare('SELECT 1 FROM users WHERE id = ? AND is_active = 1').get(data.owner_id)) {
    throw new Error('The selected owner is not an active user.');
  }
  if (data.product_id !== null && !db.prepare('SELECT 1 FROM lab_products WHERE id = ?').get(data.product_id)) {
    throw new Error('The selected product does not exist.');
  }
  const invalidEquipment = data.equipment_ids.filter((eid) => !db.prepare('SELECT 1 FROM lab_equipment WHERE id = ?').get(eid));
  if (invalidEquipment.length > 0) {
    throw new Error('One or more selected equipment entries do not exist.');
  }
}

function replaceDocumentEquipmentLinks(documentId: number, equipmentIds: number[], actorId: number): void {
  const db = getDb();
  db.prepare("DELETE FROM lab_document_links WHERE document_id = ? AND entity_type = 'EQUIPMENT'").run(documentId);
  const insert = db.prepare(
    "INSERT INTO lab_document_links (document_id, entity_type, entity_id, created_by) VALUES (?, 'EQUIPMENT', ?, ?)",
  );
  for (const eid of [...new Set(equipmentIds)].sort((a, b) => a - b)) insert.run(documentId, eid, actorId);
}

/**
 * Notify the document owner when the document sits in a review window
 * (30 / 15 / 7 days remaining, due today, overdue). Reuses the existing
 * notification engine (createNotification) with the documented
 * `lab_document_review_due` kind; entity_href opens the document editor
 * (migration 022). This is a request-triggered write-time evaluation — the
 * same pattern as the calibration attention alerts — so NO scheduler cron is
 * introduced: the review date is evaluated whenever the document is created
 * or edited.
 */
function notifyDocumentReviewDue(document: {
  id: number;
  code: string;
  title: string;
  owner_id: number | null;
  created_by: number;
  review_due_date: string | null;
}): void {
  const state = deriveDocumentReviewState(document.review_due_date);
  if (!state || state === 'OK') return;
  const ownerId = document.owner_id ?? document.created_by;
  if (!ownerId) return;
  createNotification({
    userId: ownerId,
    taskId: null,
    type: 'lab_document_review_due',
    title: `Document review ${state === 'OVERDUE' ? 'overdue' : 'due'}: ${document.code}`,
    message: `${document.code} — ${LAB_DOCUMENT_REVIEW_STATE_LABELS[state].toLowerCase()} (review due ${document.review_due_date}).`,
    href: `/lab/documents/${document.id}/edit`,
  });
}

function auditLabDocument(
  documentId: number,
  actorId: number,
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'STATUS_TRANSITION'
    | 'SUBMIT'
    | 'REQUEST_CHANGES'
    | 'APPROVAL'
    | 'SUPERSEDE'
    | 'ACKNOWLEDGE'
    | 'VERSION',
  note: string | null,
  oldValue: string | null = null,
  newValue: string | null = null,
): void {
  getDb()
    .prepare(
      `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note)
       VALUES ('LAB_DOCUMENT', ?, NULL, ?, ?, ?, ?, ?)`,
    )
    .run(documentId, actorId, action, oldValue, newValue, note);
}

function auditLabDocumentVersion(versionId: number, actorIdValue: number, action: 'CREATE' | 'VERSION', note: string): void {
  getDb()
    .prepare(
      `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note)
       VALUES ('LAB_DOCUMENT_VERSION', ?, NULL, ?, ?, NULL, ?, ?)`,
    )
    .run(versionId, actorIdValue, action, 'DRAFT', note);
}

function notifyDocumentContentStarted(documentId: number, code: string, actor: number): void {
  const recipients = getDb()
    .prepare("SELECT id FROM users WHERE is_active = 1 AND role IN ('manager', 'admin') AND id <> ?")
    .all(actor) as Array<{ id: number }>;
  for (const recipient of recipients) {
    createNotification({
      userId: recipient.id,
      taskId: null,
      type: 'lab_document_content_started',
      title: 'Document content started',
      message: `${code} now has its first authored content.`,
      actorId: actor,
      href: `/lab/documents/${documentId}`,
    });
  }
}

function documentFormSummary(data: LabDocumentFormData, version: number): string {
  return `code=${data.code}; version=v${version}; type=${data.type}; owner=${data.owner_id ?? '—'}; product=${data.product_id ?? '—'}; equipment=${data.equipment_ids.length}`;
}

/** Active (non-archived) equipment for the editor's Related Equipment checkboxes. */
export function listLabEquipmentForDocumentForm(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_equipment WHERE is_archived = 0 ORDER BY name COLLATE NOCASE ASC, id ASC')
    .all() as Array<{ id: number; name: string; code: string }>;
}

/** Active products for the editor's Product Reference select. */
export function listLabProductsForDocumentForm(): Array<{ id: number; name: string; code: string }> {
  return getDb()
    .prepare('SELECT id, name, code FROM lab_products WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC, id ASC')
    .all() as Array<{ id: number; name: string; code: string }>;
}

/** Active users for the editor's Owner select. */
export function listLabUsersForDocumentForm(): Array<{ id: number; full_name: string }> {
  return getDb()
    .prepare('SELECT id, full_name FROM users WHERE is_active = 1 ORDER BY full_name COLLATE NOCASE ASC, id ASC')
    .all() as Array<{ id: number; full_name: string }>;
}

/**
 * Create a document + version 1 (DRAFT) + equipment links + CREATE audit (one
 * transaction). Identity lives on lab_documents; the numbered content + change
 * summary live on lab_document_versions; current_version_id points at v1.
 */
export function createLabDocument(data: LabDocumentFormData, actor: DocumentActor): number {
  const sessionActorId = actorId(actor);
  const role = actorRole(actor);
  return transaction(() => {
    const db = getDb();
    assertDocumentReferencesExist(data);
    assertDocumentCodeAvailable(data.code, null);
    const ownerId = role === 'employee' ? sessionActorId : data.owner_id ?? sessionActorId;
    const result = db
      .prepare(
        `INSERT INTO lab_documents (code, title, type, description, product_id, owner_id, status, effective_date, review_due_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)`,
      )
      .run(
        data.code,
        data.title,
        data.type,
        data.description,
        data.product_id,
        ownerId,
        data.effective_date,
        data.review_due_date,
        sessionActorId,
      );
    const documentId = Number(result.lastInsertRowid);
    auditLabDocument(documentId, sessionActorId, 'CREATE', data.content.trim() ? documentFormSummary(data, 1) : 'Document identity created; content not entered.');
    if (data.content.trim()) {
      const html = renderDocumentContent(data.content);
      const v = db
        .prepare(
          `INSERT INTO lab_document_versions (document_id, version, content_md, content_html_sanitized, change_summary, author_id, status)
           VALUES (?, 1, ?, ?, ?, ?, 'DRAFT')`,
        )
        .run(documentId, data.content, html, data.change_summary, sessionActorId);
      const versionId = Number(v.lastInsertRowid);
      db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, documentId);
      auditLabDocumentVersion(versionId, sessionActorId, 'VERSION', `Created v1 for ${data.code}.`);
      notifyDocumentContentStarted(documentId, data.code, sessionActorId);
    }
    replaceDocumentEquipmentLinks(documentId, data.equipment_ids, sessionActorId);
    notifyDocumentReviewDue({
      id: documentId,
      code: data.code,
      title: data.title,
      owner_id: ownerId,
      created_by: sessionActorId,
      review_due_date: data.review_due_date,
    });
    return documentId;
  });
}

/**
 * Update a document. Editing an APPROVED document creates a NEW DRAFT version
 * (v+1) — the approved version stays immutable (contract §41/§42/§44); editing
 * a DRAFT/IN_REVIEW document updates its current version in place. Both paths
 * write identity + content + links + audit in one transaction.
 */
export function updateLabDocument(id: number, data: LabDocumentFormData, actor: DocumentActor): void {
  const sessionActorId = actorId(actor);
  const role = actorRole(actor);
  transaction(() => {
    const db = getDb();
    const document = db.prepare('SELECT * FROM lab_documents WHERE id = ?').get(id) as LabDocument | undefined;
    if (!document) throw new Error('Document not found.');
    if (document.status === 'ARCHIVED' || document.status === 'SUPERSEDED') {
      throw new Error('Archived and superseded documents cannot be edited.');
    }
    assertDocumentReferencesExist(data);
    assertDocumentCodeAvailable(data.code, id);

    const ownerId = role === 'employee' ? document.owner_id ?? sessionActorId : data.owner_id ?? document.owner_id ?? sessionActorId;
    if (!data.content.trim() && !document.current_version_id) {
      db.prepare(
        `UPDATE lab_documents SET code = ?, title = ?, type = ?, description = ?, product_id = ?, owner_id = ?, effective_date = ?, review_due_date = ?, updated_at = datetime('now') WHERE id = ?`,
      ).run(data.code, data.title, data.type, data.description, data.product_id, ownerId, data.effective_date, data.review_due_date, id);
      replaceDocumentEquipmentLinks(id, data.equipment_ids, sessionActorId);
      auditLabDocument(id, sessionActorId, 'UPDATE', 'Catalog identity updated; content remains unentered.');
      return;
    }
    if (!data.content.trim()) throw new Error('Document content is required to create or update a version.');
    const html = renderDocumentContent(data.content);
    const current = document.current_version_id
      ? (db.prepare('SELECT * FROM lab_document_versions WHERE id = ?').get(document.current_version_id) as
          | LabDocumentVersion
          | undefined)
      : null;

    let targetVersionId: number;
    let versionNumber: number;
    let action: 'UPDATE' | 'VERSION' = 'UPDATE';

    if (current && current.status === 'APPROVED') {
      // Revising an approved version → new DRAFT version; change summary required.
      if (!data.change_summary || data.change_summary.trim() === '') {
        throw new Error('A change summary is required when revising an approved document.');
      }
      const next = current.version + 1;
      const v = db
        .prepare(
          `INSERT INTO lab_document_versions (document_id, version, content_md, content_html_sanitized, change_summary, author_id, status)
           VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')`,
        )
        .run(id, next, data.content, html, data.change_summary, sessionActorId);
      targetVersionId = Number(v.lastInsertRowid);
      versionNumber = next;
      action = 'VERSION';
    } else {
      // DRAFT / IN_REVIEW → update the current version in place.
      if (!current) {
        const v = db
          .prepare(
            `INSERT INTO lab_document_versions (document_id, version, content_md, content_html_sanitized, change_summary, author_id, status)
             VALUES (?, 1, ?, ?, ?, ?, 'DRAFT')`,
          )
          .run(id, data.content, html, data.change_summary, sessionActorId);
        targetVersionId = Number(v.lastInsertRowid);
        versionNumber = 1;
      } else {
        db.prepare(
          `UPDATE lab_document_versions SET content_md = ?, content_html_sanitized = ?, change_summary = ? WHERE id = ?`,
        ).run(data.content, html, data.change_summary, current.id);
        targetVersionId = current.id;
        versionNumber = current.version;
      }
    }

    // Editing an approved doc creates a new DRAFT version → the document
    // returns to DRAFT; in-place edits keep the current status.
    const nextStatus = action === 'VERSION' ? 'DRAFT' : document.status;
    db.prepare(
      `UPDATE lab_documents SET
         code = ?, title = ?, type = ?, description = ?, product_id = ?, owner_id = ?,
         effective_date = ?, review_due_date = ?, current_version_id = ?, status = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
      .run(
        data.code,
        data.title,
        data.type,
        data.description,
        data.product_id,
        ownerId,
        data.effective_date,
        data.review_due_date,
        targetVersionId,
        nextStatus,
        id,
      );
    if (!document.current_version_id) {
      auditLabDocumentVersion(targetVersionId, sessionActorId, 'VERSION', `Created v${versionNumber} for ${data.code}.`);
      notifyDocumentContentStarted(id, data.code, sessionActorId);
    }
    replaceDocumentEquipmentLinks(id, data.equipment_ids, sessionActorId);
    auditLabDocument(id, sessionActorId, action, documentFormSummary(data, versionNumber));
    notifyDocumentReviewDue({
      id,
      code: data.code,
      title: data.title,
      owner_id: ownerId,
      created_by: document.created_by,
      review_due_date: data.review_due_date,
    });
  });
}

// ─────────────────────────────── Version history (/lab/documents/[id]/versions) ───────────────────────────────

/** One version row for the version-history table (joined author/reviewer/approver names). */
export interface LabDocumentVersionRow {
  id: number;
  version: number;
  status: LabDocumentStatus;
  change_summary: string | null;
  created_at: string;
  author_id: number;
  author_name: string | null;
  reviewed_by: number | null;
  reviewer_name: string | null;
  approved_by: number | null;
  approver_name: string | null;
  approved_at: string | null;
}

/** Version-history page view: document identity + versions newest-first. */
export interface LabDocumentVersionsView {
  document: LabDocument & { owner_name: string | null; created_by_name: string | null };
  versions: LabDocumentVersionRow[];
}

/**
 * Load the version-history view for one document. Returns null for a missing or
 * invalid id. Approved versions are immutable (contract §41/§42/§44), so this
 * page is strictly read-only — every column is a stored value or a user join.
 */
export function getLabDocumentVersions(id: number): LabDocumentVersionsView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = getDb();
  const document = db
    .prepare(
      `SELECT d.*,
              (SELECT full_name FROM users u WHERE u.id = d.owner_id) AS owner_name,
              (SELECT full_name FROM users u WHERE u.id = d.created_by) AS created_by_name
       FROM lab_documents d WHERE d.id = ?`,
    )
    .get(id) as (LabDocument & { owner_name: string | null; created_by_name: string | null }) | undefined;
  if (!document) return null;
  const versions = db
    .prepare(
      `SELECT v.id, v.version, v.status, v.change_summary, v.created_at,
              v.author_id, au.full_name AS author_name,
              v.reviewed_by, ru.full_name AS reviewer_name,
              v.approved_by, pr.full_name AS approver_name,
              v.approved_at
       FROM lab_document_versions v
       LEFT JOIN users au ON au.id = v.author_id
       LEFT JOIN users ru ON ru.id = v.reviewed_by
       LEFT JOIN users pr ON pr.id = v.approved_by
       WHERE v.document_id = ?
       ORDER BY v.version DESC, v.id DESC`,
    )
    .all(id) as LabDocumentVersionRow[];
  return { document, versions };
}

/**
 * Load one version's stored sanitized HTML for the read-only comparison panes.
 * Returns null when the version does not belong to the document. The stored
 * content_html_sanitized cache is preferred; when absent (older rows), the
 * markdown is re-rendered through the same escape-only renderer used at write
 * time, so injected HTML is never passed through.
 */
export function getLabDocumentVersionContent(
  documentId: number,
  versionId: number,
): { version: LabDocumentVersion; html: string } | null {
  if (!Number.isInteger(documentId) || documentId <= 0 || !Number.isInteger(versionId) || versionId <= 0) return null;
  const version = getDb()
    .prepare('SELECT * FROM lab_document_versions WHERE id = ? AND document_id = ?')
    .get(versionId, documentId) as LabDocumentVersion | undefined;
  if (!version) return null;
  const html = version.content_html_sanitized ?? renderDocumentContent(version.content_md);
  return { version, html };
}

// ─────────────────────────────── Workflow (PROMPT 41) ───────────────────────────────

/**
 * Submit a DRAFT document for review (DRAFT → IN_REVIEW).
 * Requires change_summary (from input or current version).
 * Actor must have edit authority on the document.
 */
export function submitLabDocument(
  documentId: number,
  actor: { id: number; role: Role },
  changeSummary?: string | null,
): void {
  transaction(() => {
    const db = getDb();
    const document = db.prepare('SELECT * FROM lab_documents WHERE id = ?').get(documentId) as LabDocument | undefined;
    if (!document) throw new Error('Document not found.');
    if (document.status !== 'DRAFT') {
      throw new Error(`Document ${document.code} is not a draft (current status: ${document.status}).`);
    }
    if (!canEditLabDocumentRecord(actor, document)) {
      throw new Error('You do not have permission to submit this document for review.');
    }

    const current = document.current_version_id
      ? (db.prepare('SELECT * FROM lab_document_versions WHERE id = ?').get(document.current_version_id) as
          | LabDocumentVersion
          | undefined)
      : null;
    if (!current) throw new Error('Document has no version to submit.');

    const summary = changeSummary?.trim() || current.change_summary?.trim() || null;
    if (!summary) {
      throw new Error('A change summary is required to submit a document for review.');
    }

    const dbNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (changeSummary?.trim() && changeSummary.trim() !== current.change_summary) {
      db.prepare("UPDATE lab_document_versions SET change_summary = ?, status = 'IN_REVIEW' WHERE id = ?").run(
        changeSummary.trim(),
        current.id,
      );
    } else {
      db.prepare("UPDATE lab_document_versions SET status = 'IN_REVIEW' WHERE id = ?").run(current.id);
    }

    db.prepare("UPDATE lab_documents SET status = 'IN_REVIEW', updated_at = ? WHERE id = ?").run(dbNow, documentId);

    auditLabDocument(documentId, actor.id, 'SUBMIT', summary, 'DRAFT', 'IN_REVIEW');

    const ownerId = document.owner_id ?? document.created_by;
    if (ownerId && ownerId !== actor.id) {
      createNotification({
        userId: ownerId,
        taskId: null,
        type: 'lab_document_review_started',
        title: 'Document submitted for review',
        message: `${document.code} was submitted for review.`,
        actorId: actor.id,
        href: `/lab/documents/${documentId}`,
      });
    }
  });
}

/**
 * Request changes on an IN_REVIEW document (IN_REVIEW → DRAFT).
 * Requires mandatory reason.
 * Approver/reviewer cannot be the author/owner (no self-review).
 */
export function requestChangesLabDocument(
  documentId: number,
  actor: { id: number; role: Role },
  reason: string,
): void {
  transaction(() => {
    const db = getDb();
    const document = db.prepare('SELECT * FROM lab_documents WHERE id = ?').get(documentId) as LabDocument | undefined;
    if (!document) throw new Error('Document not found.');
    if (document.status !== 'IN_REVIEW') {
      throw new Error(`Document ${document.code} is not in review (current status: ${document.status}).`);
    }

    const current = document.current_version_id
      ? (db.prepare('SELECT * FROM lab_document_versions WHERE id = ?').get(document.current_version_id) as
          | LabDocumentVersion
          | undefined)
      : null;

    const docAuth = {
      status: document.status,
      owner_id: document.owner_id,
      created_by: document.created_by,
      author_id: current?.author_id ?? null,
    };

    if (!canReviewLabDocumentRecord(actor, docAuth)) {
      throw new Error('You do not have permission to review this document.');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('A reason is required to request changes.');
    }

    const dbNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (current) {
      db.prepare("UPDATE lab_document_versions SET status = 'DRAFT', reviewed_by = ?, reviewed_at = ? WHERE id = ?").run(
        actor.id,
        dbNow,
        current.id,
      );
    }

    db.prepare("UPDATE lab_documents SET status = 'DRAFT', reviewer_id = ?, updated_at = ? WHERE id = ?").run(
      actor.id,
      dbNow,
      documentId,
    );

    auditLabDocument(documentId, actor.id, 'REQUEST_CHANGES', reason.trim(), 'IN_REVIEW', 'DRAFT');

    const recipient = current?.author_id ?? document.owner_id ?? document.created_by;
    if (recipient) {
      createNotification({
        userId: recipient,
        taskId: null,
        type: 'lab_document_changes_requested',
        title: 'Changes requested',
        message: `${document.code} was returned for changes: ${reason.trim()}`,
        actorId: actor.id,
        href: `/lab/documents/${documentId}/edit`,
      });
    }
  });
}

/**
 * Approve an IN_REVIEW document (IN_REVIEW → APPROVED).
 * Approver cannot be author/owner (no self-approval).
 * Sets approver_id + approved_at + effective_date.
 * Automatically supersedes any previous approved version.
 */
export function approveLabDocument(
  documentId: number,
  actor: { id: number; role: Role },
  note?: string | null,
): void {
  transaction(() => {
    const db = getDb();
    const document = db.prepare('SELECT * FROM lab_documents WHERE id = ?').get(documentId) as LabDocument | undefined;
    if (!document) throw new Error('Document not found.');
    if (document.status !== 'IN_REVIEW') {
      throw new Error(`Document ${document.code} is not in review (current status: ${document.status}).`);
    }

    const current = document.current_version_id
      ? (db.prepare('SELECT * FROM lab_document_versions WHERE id = ?').get(document.current_version_id) as
          | LabDocumentVersion
          | undefined)
      : null;
    if (!current) throw new Error('Document has no version to approve.');

    const docAuth = {
      status: document.status,
      owner_id: document.owner_id,
      created_by: document.created_by,
      author_id: current.author_id,
    };

    if (!canApproveLabDocumentRecord(actor, docAuth)) {
      throw new Error('You do not have permission to approve this document.');
    }

    const dbNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const isoDate = dbNow.slice(0, 10);

    // Supersede previous approved versions of this document
    const prevApproved = db
      .prepare("SELECT id, version FROM lab_document_versions WHERE document_id = ? AND status = 'APPROVED' AND id <> ?")
      .all(documentId, current.id) as Array<{ id: number; version: number }>;

    for (const prev of prevApproved) {
      db.prepare("UPDATE lab_document_versions SET status = 'SUPERSEDED' WHERE id = ?").run(prev.id);
      auditLabDocument(
        documentId,
        actor.id,
        'SUPERSEDE',
        `v${prev.version} superseded by v${current.version}`,
        'APPROVED',
        'SUPERSEDED',
      );
    }

    db.prepare(
      "UPDATE lab_document_versions SET status = 'APPROVED', approved_by = ?, approved_at = ? WHERE id = ?",
    ).run(actor.id, dbNow, current.id);

    const effectiveDate = document.effective_date ?? isoDate;
    db.prepare(
      `UPDATE lab_documents SET
         status = 'APPROVED', approver_id = ?, approved_at = ?,
         reviewer_id = COALESCE(reviewer_id, ?),
         effective_date = ?, updated_at = ?
       WHERE id = ?`,
    ).run(actor.id, dbNow, actor.id, effectiveDate, dbNow, documentId);

    const auditNote = note?.trim() || `Approved v${current.version}`;
    auditLabDocument(documentId, actor.id, 'APPROVAL', auditNote, 'IN_REVIEW', 'APPROVED');

    const recipient = current.author_id ?? document.owner_id ?? document.created_by;
    if (recipient) {
      createNotification({
        userId: recipient,
        taskId: null,
        type: 'lab_document_approved',
        title: 'Document approved',
        message: `${document.code} v${current.version} was approved.`,
        actorId: actor.id,
        href: `/lab/documents/${documentId}`,
      });
    }
  });
}

/**
 * Archive an APPROVED, SUPERSEDED, or DRAFT/IN_REVIEW document.
 * Sets status = 'ARCHIVED' for document + active versions.
 * Archived documents never appear in test dropdowns but stay readable.
 */
export function archiveLabDocument(
  documentId: number,
  actor: { id: number; role: Role },
  reason?: string | null,
): void {
  transaction(() => {
    const db = getDb();
    const document = db.prepare('SELECT * FROM lab_documents WHERE id = ?').get(documentId) as LabDocument | undefined;
    if (!document) throw new Error('Document not found.');
    if (document.status === 'ARCHIVED') {
      throw new Error(`Document ${document.code} is already archived.`);
    }
    if (!canArchiveLabDocument(actor.role)) {
      throw new Error('You do not have permission to archive controlled documents.');
    }

    const prevStatus = document.status;
    const dbNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.prepare("UPDATE lab_documents SET status = 'ARCHIVED', updated_at = ? WHERE id = ?").run(dbNow, documentId);
    db.prepare(
      "UPDATE lab_document_versions SET status = 'ARCHIVED' WHERE document_id = ? AND status IN ('APPROVED', 'SUPERSEDED', 'DRAFT', 'IN_REVIEW')",
    ).run(documentId);

    const note = reason?.trim() || `Archived ${document.code}`;
    auditLabDocument(documentId, actor.id, 'STATUS_TRANSITION', note, prevStatus, 'ARCHIVED');

    const recipient = document.owner_id ?? document.created_by;
    if (recipient) {
      createNotification({
        userId: recipient,
        taskId: null,
        type: 'lab_document_archived',
        title: 'Document archived',
        message: `${document.code} was archived.`,
        actorId: actor.id,
        href: `/lab/documents/${documentId}`,
      });
    }
  });
}

// ─────────────────────────────── Detail reader (/lab/documents/[id]) ───────────────────────────────

export interface LabDocumentDetailView {
  document: LabDocument & {
    owner_name: string | null;
    reviewer_name: string | null;
    approver_name: string | null;
    created_by_name: string | null;
    product_name: string | null;
    product_code: string | null;
  };
  currentVersion: (LabDocumentVersion & {
    author_name: string | null;
    reviewer_name: string | null;
    approver_name: string | null;
  }) | null;
  contentHtml: string;
  equipmentLinks: Array<{ id: number; name: string; code: string }>;
  auditTimeline: Array<{
    id: number;
    action: string;
    actor_id: number;
    actor_name: string | null;
    old_value: string | null;
    new_value: string | null;
    note: string | null;
    created_at: string;
  }>;
}

export function getLabDocumentDetail(id: number): LabDocumentDetailView | null {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = getDb();
  const document = db
    .prepare(
      `SELECT d.*,
              ou.full_name AS owner_name,
              ru.full_name AS reviewer_name,
              au.full_name AS approver_name,
              cu.full_name AS created_by_name,
              p.name AS product_name,
              p.code AS product_code
       FROM lab_documents d
       LEFT JOIN users ou ON ou.id = d.owner_id
       LEFT JOIN users ru ON ru.id = d.reviewer_id
       LEFT JOIN users au ON au.id = d.approver_id
       LEFT JOIN users cu ON cu.id = d.created_by
       LEFT JOIN lab_products p ON p.id = d.product_id
       WHERE d.id = ?`,
    )
    .get(id) as LabDocumentDetailView['document'] | undefined;
  if (!document) return null;

  let currentVersion: LabDocumentDetailView['currentVersion'] = null;
  let contentHtml = '';
  if (document.current_version_id) {
    const vRow = db
      .prepare(
        `SELECT v.*,
                au.full_name AS author_name,
                ru.full_name AS reviewer_name,
                pu.full_name AS approver_name
         FROM lab_document_versions v
         LEFT JOIN users au ON au.id = v.author_id
         LEFT JOIN users ru ON ru.id = v.reviewed_by
         LEFT JOIN users pu ON pu.id = v.approved_by
         WHERE v.id = ?`,
      )
      .get(document.current_version_id) as LabDocumentDetailView['currentVersion'] | undefined;
    currentVersion = vRow ?? null;
    if (currentVersion) {
      contentHtml = currentVersion.content_html_sanitized ?? renderDocumentContent(currentVersion.content_md);
    }
  }

  const equipmentLinks = db
    .prepare(
      `SELECT e.id, e.name, e.code
       FROM lab_document_links l
       JOIN lab_equipment e ON e.id = l.entity_id
       WHERE l.document_id = ? AND l.entity_type = 'EQUIPMENT'
       ORDER BY e.name COLLATE NOCASE ASC`,
    )
    .all(id) as Array<{ id: number; name: string; code: string }>;

  const auditTimeline = db
    .prepare(
      `SELECT a.id, a.action, a.actor_id, u.full_name AS actor_name,
              a.old_value, a.new_value, a.note, a.created_at
       FROM qc_audit_log a
       LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'LAB_DOCUMENT' AND a.entity_id = ?
       ORDER BY a.created_at ASC, a.id ASC`,
    )
    .all(id) as LabDocumentDetailView['auditTimeline'];

  return {
    document,
    currentVersion: currentVersion ?? null,
    contentHtml,
    equipmentLinks,
    auditTimeline,
  };
}

// ─────────────────────────────── POST handlers ───────────────────────────────

/**
 * Shared POST body for create + edit (middleware short-circuit — same pattern
 * as handleLabProductPost). The document id comes from the matched path
 * segment, never the body. Re-checks the permission (create supervisor+ /
 * record-level edit), CSRF-validates, then flashes + redirects.
 */
async function handleLabDocumentPost(context: APIContext, documentId: number | null): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const backUrl = documentId === null ? '/lab/documents/new' : `/lab/documents/${documentId}/edit`;
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  if (documentId === null) {
    if (!canCreateLabDocument(user.role)) {
      setFlash(context, 'error', 'You do not have permission to create controlled documents.');
      return context.redirect('/lab/documents');
    }
  } else {
    const editor = getLabDocumentEditor(documentId);
    if (!editor) {
      setFlash(context, 'error', 'Document not found.');
      return context.redirect('/lab/documents');
    }
    if (!canEditLabDocumentRecord(user, editor.document)) {
      setFlash(context, 'error', 'You do not have permission to edit this document.');
      return context.redirect('/lab/documents');
    }
  }

  // Dynamic import keeps this module loadable in the bundler-less unit tests.
  const { parseFormData, labDocumentSchema } = await import('../validation');
  const form = await context.request.formData();
  const parsed = parseFormData(labDocumentSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }

  // The form serializes the "Related Equipment" checkboxes as duplicate
  // `equipment_ids` entries; collect them before schema-level typing.
  const equipmentIds = [...form.getAll('equipment_ids')].map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
  const data: LabDocumentFormData = {
    ...(parsed.data as Omit<LabDocumentFormData, 'equipment_ids'>),
    equipment_ids: equipmentIds,
  };

  try {
    if (documentId === null) {
      const id = createLabDocument(data, { id: user.id, role: user.role });
      setFlash(context, 'success', `Document ${data.code} created as a draft.`);
      return context.redirect(`/lab/documents/${id}`);
    }
    updateLabDocument(documentId, data, { id: user.id, role: user.role });
    setFlash(context, 'success', `Document ${data.code} saved.`);
    return context.redirect(`/lab/documents/${documentId}`);
  } catch (err) {
    if (err instanceof LabDocumentCodeConflictError) {
      setFlash(context, 'error', err.message);
    } else {
      console.error('[lab] document form save failure', err);
      setFlash(context, 'error', err instanceof Error ? err.message : 'Could not save the document.');
    }
    return context.redirect(backUrl);
  }
}

/** POST /lab/documents/new */
export async function handleLabDocumentCreatePost(context: APIContext): Promise<Response> {
  return handleLabDocumentPost(context, null);
}

/** POST /lab/documents/[id]/edit — the id is extracted by the middleware from the path. */
export async function handleLabDocumentEditPost(context: APIContext, documentId: number): Promise<Response> {
  return handleLabDocumentPost(context, documentId);
}

/** POST /lab/documents/[id] — workflow transitions (submit / request_changes / approve / archive). */
export async function handleLabDocumentWorkflowPost(context: APIContext, documentId: number): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  const form = await context.request.formData();
  const formAction = String(form.get('form_action') || '').trim();

  try {
    if (formAction === 'submit') {
      const changeSummary = form.get('change_summary') ? String(form.get('change_summary')).trim() : null;
      submitLabDocument(documentId, { id: user.id, role: user.role }, changeSummary);
      setFlash(context, 'success', 'Document submitted for review.');
      return context.redirect(`/lab/documents/${documentId}`);
    }
    if (formAction === 'request_changes') {
      const reason = String(form.get('reason') || '').trim();
      requestChangesLabDocument(documentId, { id: user.id, role: user.role }, reason);
      setFlash(context, 'success', 'Document returned for changes.');
      return context.redirect(`/lab/documents/${documentId}`);
    }
    if (formAction === 'approve') {
      // E-signature step: document APPROVE is a highest-authority action and
      // requires re-verifying the current user's password server-side (no
      // session reissue; failures rate-limited per user + audited without
      // storing the password anywhere).
      const outcome = requireEsignature(user.id, form.get(ESIGN_FIELD_NAME)?.toString() ?? null);
      if (outcome === 'rate_limited') {
        setFlash(context, 'error', ESIGN_RATE_LIMITED_MESSAGE_AR);
        return context.redirect(`/lab/documents/${documentId}`);
      }
      if (outcome === 'invalid') {
        setFlash(context, 'error', ESIGN_FAILURE_MESSAGE_AR);
        return context.redirect(`/lab/documents/${documentId}`);
      }
      const note = form.get('note') ? String(form.get('note')).trim() : null;
      approveLabDocument(documentId, { id: user.id, role: user.role }, esignAuditNote(note));
      setFlash(context, 'success', 'Document version approved.');
      return context.redirect(`/lab/documents/${documentId}`);
    }
    if (formAction === 'archive') {
      const reason = form.get('reason') ? String(form.get('reason')).trim() : null;
      archiveLabDocument(documentId, { id: user.id, role: user.role }, reason);
      setFlash(context, 'success', 'Document archived.');
      return context.redirect(`/lab/documents/${documentId}`);
    }
    setFlash(context, 'error', 'Invalid workflow action.');
    return context.redirect(`/lab/documents/${documentId}`);
  } catch (err) {
    console.error('[lab] document workflow action failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not process workflow action.');
    return context.redirect(`/lab/documents/${documentId}`);
  }
}
