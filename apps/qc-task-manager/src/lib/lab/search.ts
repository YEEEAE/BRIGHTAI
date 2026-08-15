// QC Laboratory Unified Search layer (/lab/search).
//
// Provides cross-entity server-side search across:
//   - tests (lab_test_records)
//   - samples (lab_test_samples)
//   - products (lab_products)
//   - equipment (lab_equipment)
//   - SOPs (lab_documents where type = 'SOP')
//   - WIs (lab_documents where type = 'WI')
//   - retests (lab_test_retests)
//
// Matches across search fields:
//   - test ID (test_number, id)
//   - sample ID (sample_identifier, sample_no)
//   - product (name, code)
//   - lot (lot_number)
//   - equipment (name)
//   - equipment code (code)
//   - serial number (serial_number)
//   - document code (code)
//   - document title (title)
//
// RBAC Security Invariant:
//   - Access to /lab/search requires canViewLab (all authenticated lab roles).
//   - Employees (role === 'employee') see ONLY tests and samples they tested or created.
//   - Unauthorized records are NEVER leaked in rows or aggregate counts.
//   - All SQL statements are strictly parameterized using '?' placeholders.

import type { Role } from '../types';
import { getDb } from '../db';

export type LabSearchEntityType =
  | 'all'
  | 'tests'
  | 'samples'
  | 'products'
  | 'equipment'
  | 'sops'
  | 'wis'
  | 'retests';

export const LAB_SEARCH_ENTITY_TYPES: readonly LabSearchEntityType[] = [
  'all',
  'tests',
  'samples',
  'products',
  'equipment',
  'sops',
  'wis',
  'retests',
] as const;

export const LAB_SEARCH_ENTITY_LABELS: Record<LabSearchEntityType, string> = {
  all: 'All Entities',
  tests: 'Tests',
  samples: 'Samples',
  products: 'Products',
  equipment: 'Equipment',
  sops: 'SOPs',
  wis: 'Work Instructions',
  retests: 'Retests',
};

export const LAB_SEARCH_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_SEARCH_PER_PAGE = 25;
export const DEFAULT_LAB_SEARCH_ENTITY: LabSearchEntityType = 'all';

export interface LabSearchFilters {
  q: string | null;
  entity: LabSearchEntityType;
  page: number;
  per_page: number;
}

export const NO_LAB_SEARCH_FILTERS: LabSearchFilters = {
  q: null,
  entity: DEFAULT_LAB_SEARCH_ENTITY,
  page: 1,
  per_page: DEFAULT_LAB_SEARCH_PER_PAGE,
};

export interface LabSearchResultItem {
  entity_type: 'test' | 'sample' | 'product' | 'equipment' | 'sop' | 'wi' | 'retest';
  entity_id: number;
  identifier: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  result: string | null;
  detail_meta: string | null;
  href: string;
  created_at: string;
  updated_at: string;
}

export interface LabSearchResult {
  items: LabSearchResultItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  counts: Record<LabSearchEntityType, number>;
}

export interface LabSearchUserContext {
  role: Role;
  userId: number;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function positiveInt(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Parse query parameters from URL into validated search filters. */
export function parseLabSearchFilters(url: URL): LabSearchFilters {
  const f: LabSearchFilters = { ...NO_LAB_SEARCH_FILTERS };
  const sp = url.searchParams;

  const q = sp.get('q');
  if (q && q.trim() !== '') {
    f.q = q.trim().slice(0, 300);
  }

  const entity = sp.get('entity');
  if (entity && (LAB_SEARCH_ENTITY_TYPES as readonly string[]).includes(entity)) {
    f.entity = entity as LabSearchEntityType;
  }

  const page = positiveInt(sp.get('page'));
  if (page !== null) f.page = page;

  const per = positiveInt(sp.get('per'));
  if (per !== null && (LAB_SEARCH_PER_PAGE_OPTIONS as readonly number[]).includes(per)) {
    f.per_page = per;
  }

  return f;
}

export function hasLabSearchFilters(f: LabSearchFilters): boolean {
  return Boolean(f.q || f.entity !== 'all');
}

export function labSearchFiltersToQuery(f: LabSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.entity !== 'all') sp.set('entity', f.entity);
  if (f.page > 1) sp.set('page', String(f.page));
  if (f.per_page !== DEFAULT_LAB_SEARCH_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// ──────────────────────── Entity Query Definitions ────────────────────────

interface EntitySubquery {
  sql: string;
  params: unknown[];
}

function buildTestsSubquery(like: string | null, user: LabSearchUserContext): EntitySubquery {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (like !== null) {
    conds.push(`(
      t.test_number LIKE ? ESCAPE '\\' OR
      CAST(t.id AS TEXT) LIKE ? ESCAPE '\\' OR
      t.lot_number LIKE ? ESCAPE '\\' OR
      p.name LIKE ? ESCAPE '\\' OR
      p.code LIKE ? ESCAPE '\\' OR
      e.name LIKE ? ESCAPE '\\' OR
      e.code LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like, like, like, like, like);
  }

  if (user.role === 'employee') {
    conds.push('(t.tested_by = ? OR t.created_by = ?)');
    params.push(user.userId, user.userId);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const sql = `
    SELECT
      'test' AS entity_type,
      t.id AS entity_id,
      t.test_number AS identifier,
      COALESCE(p.name, 'Test ' || t.test_number) AS title,
      ('Type: ' || upper(t.test_type) || ' · Lot: ' || COALESCE(t.lot_number, '—') || ' · Eq: ' || COALESCE(e.code, '—')) AS subtitle,
      t.status AS status,
      t.final_result AS result,
      ('Tested by ' || COALESCE(u.full_name, 'Unassigned')) AS detail_meta,
      ('/lab/tests/' || t.id) AS href,
      t.created_at AS created_at,
      t.updated_at AS updated_at
    FROM lab_test_records t
    LEFT JOIN lab_products p ON p.id = t.product_id
    LEFT JOIN lab_equipment e ON e.id = t.equipment_id
    LEFT JOIN users u ON u.id = t.tested_by
    ${where}
  `;

  return { sql, params };
}

function buildSamplesSubquery(like: string | null, user: LabSearchUserContext): EntitySubquery {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (like !== null) {
    conds.push(`(
      s.sample_identifier LIKE ? ESCAPE '\\' OR
      CAST(s.sample_no AS TEXT) LIKE ? ESCAPE '\\' OR
      s.part_name LIKE ? ESCAPE '\\' OR
      t.test_number LIKE ? ESCAPE '\\' OR
      t.lot_number LIKE ? ESCAPE '\\' OR
      p.name LIKE ? ESCAPE '\\' OR
      p.code LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like, like, like, like, like);
  }

  if (user.role === 'employee') {
    conds.push('(t.tested_by = ? OR t.created_by = ?)');
    params.push(user.userId, user.userId);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const sql = `
    SELECT
      'sample' AS entity_type,
      s.id AS entity_id,
      COALESCE(s.sample_identifier, ('LAB-TEST-' || substr('00000' || t.id, -5) || '-S' || substr('00' || s.sample_no, -2))) AS identifier,
      ('Sample #' || s.sample_no || ' (' || COALESCE(s.part_name, 'Standard') || ')') AS title,
      ('Test: ' || t.test_number || ' · Product: ' || COALESCE(p.name, '—') || ' · Lot: ' || COALESCE(t.lot_number, '—')) AS subtitle,
      s.status AS status,
      s.result AS result,
      ('Sample #' || s.sample_no || ' of ' || t.sample_count) AS detail_meta,
      ('/lab/tests/' || t.id) AS href,
      s.created_at AS created_at,
      s.updated_at AS updated_at
    FROM lab_test_samples s
    JOIN lab_test_records t ON t.id = s.test_id
    LEFT JOIN lab_products p ON p.id = t.product_id
    ${where}
  `;

  return { sql, params };
}

function buildProductsSubquery(like: string | null): EntitySubquery {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (like !== null) {
    conds.push(`(
      p.name LIKE ? ESCAPE '\\' OR
      p.code LIKE ? ESCAPE '\\' OR
      p.description LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const sql = `
    SELECT
      'product' AS entity_type,
      p.id AS entity_id,
      p.code AS identifier,
      p.name AS title,
      COALESCE(p.description, 'Product Master') AS subtitle,
      (CASE WHEN p.is_active = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END) AS status,
      NULL AS result,
      ('Connector: ' || COALESCE(p.connector_type, 'Standard')) AS detail_meta,
      ('/lab/products/' || p.id) AS href,
      p.created_at AS created_at,
      p.updated_at AS updated_at
    FROM lab_products p
    ${where}
  `;

  return { sql, params };
}

function buildEquipmentSubquery(like: string | null): EntitySubquery {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (like !== null) {
    conds.push(`(
      e.name LIKE ? ESCAPE '\\' OR
      e.code LIKE ? ESCAPE '\\' OR
      e.serial_number LIKE ? ESCAPE '\\' OR
      e.location LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like, like);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const sql = `
    SELECT
      'equipment' AS entity_type,
      e.id AS entity_id,
      e.code AS identifier,
      e.name AS title,
      ('S/N: ' || COALESCE(e.serial_number, 'N/A') || ' · Loc: ' || COALESCE(e.location, '—')) AS subtitle,
      (CASE WHEN e.is_archived = 1 THEN 'ARCHIVED' ELSE e.status_raw END) AS status,
      NULL AS result,
      ('Location: ' || COALESCE(e.location, 'Main Lab')) AS detail_meta,
      ('/lab/equipment/' || e.id) AS href,
      e.created_at AS created_at,
      e.updated_at AS updated_at
    FROM lab_equipment e
    ${where}
  `;

  return { sql, params };
}

function buildDocumentsSubquery(
  type: 'SOP' | 'WI',
  like: string | null,
): EntitySubquery {
  const conds: string[] = [`d.type = '${type}'`];
  const params: unknown[] = [];

  if (like !== null) {
    conds.push(`(
      d.code LIKE ? ESCAPE '\\' OR
      d.title LIKE ? ESCAPE '\\' OR
      d.description LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like);
  }

  const where = `WHERE ${conds.join(' AND ')}`;

  const entityType = type === 'SOP' ? 'sop' : 'wi';
  const entityLabel = type === 'SOP' ? 'Standard Operating Procedure' : 'Work Instruction';

  const sql = `
    SELECT
      '${entityType}' AS entity_type,
      d.id AS entity_id,
      d.code AS identifier,
      d.title AS title,
      ('${type} · ' || COALESCE(d.description, '${entityLabel}')) AS subtitle,
      d.status AS status,
      NULL AS result,
      ('Effective: ' || COALESCE(d.effective_date, '—')) AS detail_meta,
      ('/lab/documents/' || d.id || '/versions') AS href,
      d.created_at AS created_at,
      d.updated_at AS updated_at
    FROM lab_documents d
    ${where}
  `;

  return { sql, params };
}

function buildRetestsSubquery(like: string | null, user: LabSearchUserContext): EntitySubquery {
  const conds: string[] = [];
  const params: unknown[] = [];

  if (like !== null) {
    conds.push(`(
      r.retest_number LIKE ? ESCAPE '\\' OR
      ot.test_number LIKE ? ESCAPE '\\' OR
      r.reason LIKE ? ESCAPE '\\' OR
      r.reason_note LIKE ? ESCAPE '\\' OR
      p.name LIKE ? ESCAPE '\\' OR
      p.code LIKE ? ESCAPE '\\'
    )`);
    params.push(like, like, like, like, like, like);
  }

  if (user.role === 'employee') {
    conds.push('(ot.tested_by = ? OR ot.created_by = ? OR r.created_by = ?)');
    params.push(user.userId, user.userId, user.userId);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const sql = `
    SELECT
      'retest' AS entity_type,
      r.id AS entity_id,
      r.retest_number AS identifier,
      ('Retest: ' || r.retest_number || ' (' || r.reason || ')') AS title,
      ('Original: ' || ot.test_number || ' · Product: ' || COALESCE(p.name, '—')) AS subtitle,
      r.status AS status,
      r.original_result AS result,
      ('Reason: ' || r.reason || COALESCE(' — ' || r.reason_note, '')) AS detail_meta,
      ('/lab/retests/' || r.id) AS href,
      r.created_at AS created_at,
      r.updated_at AS updated_at
    FROM lab_test_retests r
    JOIN lab_test_records ot ON ot.id = r.original_test_id
    LEFT JOIN lab_products p ON p.id = ot.product_id
    ${where}
  `;

  return { sql, params };
}

/** Pure query builder for unit test verification. */
export function buildLabSearchQueries(
  filters: LabSearchFilters,
  user: LabSearchUserContext,
): {
  subqueries: Record<Exclude<LabSearchEntityType, 'all'>, EntitySubquery>;
  combinedSql: string;
  combinedParams: unknown[];
  countSql: string;
  countParams: unknown[];
} {
  const like = filters.q ? `%${escapeLike(filters.q)}%` : null;

  const subqueries: Record<Exclude<LabSearchEntityType, 'all'>, EntitySubquery> = {
    tests: buildTestsSubquery(like, user),
    samples: buildSamplesSubquery(like, user),
    products: buildProductsSubquery(like),
    equipment: buildEquipmentSubquery(like),
    sops: buildDocumentsSubquery('SOP', like),
    wis: buildDocumentsSubquery('WI', like),
    retests: buildRetestsSubquery(like, user),
  };

  let activeSubqueries: EntitySubquery[];
  if (filters.entity === 'all') {
    activeSubqueries = Object.values(subqueries);
  } else {
    activeSubqueries = [subqueries[filters.entity]];
  }

  const unionSql = activeSubqueries.map((s) => s.sql.trim()).join('\nUNION ALL\n');
  const allParams = activeSubqueries.flatMap((s) => s.params);

  const countSql = `SELECT COUNT(*) AS total FROM (${unionSql}) AS u`;
  const countParams = [...allParams];

  const limit = filters.per_page;
  const offset = (filters.page - 1) * filters.per_page;

  const combinedSql = `
    SELECT * FROM (${unionSql}) AS u
    ORDER BY updated_at DESC, created_at DESC, entity_id DESC
    LIMIT ? OFFSET ?
  `;
  const combinedParams = [...allParams, limit, offset];

  return {
    subqueries,
    combinedSql,
    combinedParams,
    countSql,
    countParams,
  };
}

/**
 * Execute server-side search across laboratory entities with strict RBAC filtering.
 */
export function searchLab(
  filters: LabSearchFilters,
  user: LabSearchUserContext,
): LabSearchResult {
  const db = getDb();
  const built = buildLabSearchQueries(filters, user);

  // 1. Calculate counts for each entity category
  const counts: Record<LabSearchEntityType, number> = {
    all: 0,
    tests: 0,
    samples: 0,
    products: 0,
    equipment: 0,
    sops: 0,
    wis: 0,
    retests: 0,
  };

  let allCount = 0;
  for (const [entityKey, subq] of Object.entries(built.subqueries)) {
    const cSql = `SELECT COUNT(*) AS total FROM (${subq.sql.trim()}) AS e`;
    const row = db.prepare(cSql).get(...subq.params) as { total: number } | undefined;
    const cnt = row?.total ?? 0;
    counts[entityKey as Exclude<LabSearchEntityType, 'all'>] = cnt;
    allCount += cnt;
  }
  counts.all = allCount;

  // 2. Query matching rows with pagination
  const total = counts[filters.entity];
  const totalPages = Math.max(1, Math.ceil(total / filters.per_page));
  const clampedPage = Math.min(Math.max(1, filters.page), totalPages);

  // If page was clamped, re-calculate offset
  const offset = (clampedPage - 1) * filters.per_page;
  const pageParams = [...built.countParams, filters.per_page, offset];

  const rows = db.prepare(built.combinedSql).all(...pageParams) as LabSearchResultItem[];

  return {
    items: rows,
    total,
    page: clampedPage,
    per_page: filters.per_page,
    total_pages: totalPages,
    counts,
  };
}
