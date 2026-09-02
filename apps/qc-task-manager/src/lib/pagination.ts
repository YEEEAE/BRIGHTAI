// Shared pagination primitives for every searchable register (tasks, lab tests,
// and the lab master-data registries). Previously each module re-declared the
// per-page options array, the default, the isPerPage guard, an ORDER BY builder
// and a WHERE-fragment merger — 24+ copies of the same policy. One edit here
// now changes every register consistently.
//
// SQL produced here is always parameterized; sort columns must come from each
// caller's whitelisted SORT_SQL map (never user input).

/** Allowed page sizes for every register. */
// Registers that predate the search UX still accept 10 internally, but the
// public search/data-grid controls intentionally expose only these sizes.
export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export type PerPageOption = (typeof PER_PAGE_OPTIONS)[number];

/** Default page size when the request does not ask for one. */
export const DEFAULT_PER_PAGE = 25;

export const SEARCH_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type SearchPageSize = (typeof SEARCH_PAGE_SIZE_OPTIONS)[number];

export function parsePositivePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function parsePageSize(value: string | null): SearchPageSize {
  const pageSize = Number(value);
  return (SEARCH_PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
    ? (pageSize as SearchPageSize)
    : DEFAULT_PER_PAGE;
}

export function pageRange(page: number, pageSize: number, total: number): { start: number; end: number } {
  if (total <= 0) return { start: 0, end: 0 };
  return { start: (page - 1) * pageSize + 1, end: Math.min(page * pageSize, total) };
}

export function isPerPage(v: number): v is PerPageOption {
  return (PER_PAGE_OPTIONS as readonly number[]).includes(v);
}

/** Type guard for the shared sort direction. */
export function isSortDir(v: string): v is 'asc' | 'desc' {
  return v === 'asc' || v === 'desc';
}

/**
 * ORDER BY builder with the stable tiebreaker: `id DESC` always breaks ties so
 * pagination never duplicates or skips rows when two rows share the sort value.
 */
export function buildOrderClause(sortSql: string, dir: 'asc' | 'desc'): string {
  return `ORDER BY ${sortSql} ${dir === 'asc' ? 'ASC' : 'DESC'}, t.id DESC`;
}

export interface WhereFragment {
  sql: string;
  params: unknown[];
}

/** Merge WHERE fragments into one with their params in text order. */
export function mergeWheres(...parts: WhereFragment[]): WhereFragment {
  const conds: string[] = [];
  const params: unknown[] = [];
  for (const part of parts) {
    if (!part.sql) continue;
    conds.push(part.sql.replace(/^WHERE /, ''));
    params.push(...part.params);
  }
  return { sql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}
