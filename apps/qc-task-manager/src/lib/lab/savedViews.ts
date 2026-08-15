// QC Laboratory saved views — user-scoped saved filters (PROMPT 24).
//
// Users save the current filter state of any lab list page as a named view.
// Views are stored as structured JSON ({ path, params }) — never raw SQL or
// arbitrary query strings. On apply, the stored path+params are validated
// against a per-page allowlist and rebuilt into a safe URL.
//
// Scoping: every row carries user_id; list/save/delete are all owner-only.
// The table (lab_saved_views, migration 014) mirrors saved_filters exactly.

import { getDb } from '../db';

/** Maximum length for a saved view name. */
export const LAB_SAVED_VIEW_NAME_MAX = 100;

/** Pages that support saved views, with their allowed filter param keys. */
const VIEW_TARGETS: Record<string, readonly string[]> = {
  '/lab/tests': ['q', 'type', 'status', 'result', 'tester', 'equipment', 'product', 'template', 'lot', 'created', 'from', 'to', 'sort', 'dir', 'per'],
  '/lab/tests/review': ['type', 'tester', 'product', 'lot', 'from', 'to', 'result', 'age', 'status', 'sort', 'dir', 'per'],
  '/lab/equipment': ['q', 'status', 'calibration', 'archived', 'sort', 'dir', 'per'],
  '/lab/calibration': ['q', 'status', 'equipment', 'due', 'sort', 'dir', 'per'],
  '/lab/documents': ['q', 'type', 'status', 'owner', 'equipment', 'product', 'review', 'sort', 'dir', 'per'],
  '/lab/retests': ['q', 'reason', 'status', 'sort', 'dir', 'per'],
  '/lab/acknowledgements': ['q', 'status', 'document', 'employee', 'version', 'sort', 'dir', 'per'],
};

/** All allowed target paths for saved views. */
export const LAB_VIEW_TARGET_PATHS = Object.keys(VIEW_TARGETS) as string[];

/** Human-readable labels for each saved-view target (display only). */
export const LAB_VIEW_TARGET_LABELS: Record<string, string> = {
  '/lab/tests': 'Test Register',
  '/lab/tests/review': 'Review Queue',
  '/lab/equipment': 'Equipment',
  '/lab/calibration': 'Calibration',
  '/lab/documents': 'SOP / WI Documents',
  '/lab/retests': 'Retests',
  '/lab/acknowledgements': 'Acknowledgements',
};

/** The stored shape of a lab saved view row. */
export interface LabSavedView {
  id: number;
  user_id: number;
  name: string;
  filter_json: string;
  created_at: string;
}

/** The structured filter payload inside filter_json. */
export interface LabViewFilter {
  path: string;
  params: Record<string, string>;
}

/**
 * Validate a raw filter_json string. Returns the parsed filter if valid,
 * or null if the path is unknown, params contain disallowed keys, or the
 * JSON is malformed. This is the security boundary: only structured,
 * allowlisted params are ever stored or applied.
 */
export function validateLabViewFilter(json: string): LabViewFilter | null {
  try {
    const raw = JSON.parse(json);
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;
    const path = obj.path;
    const params = obj.params;
    if (typeof path !== 'string' || !VIEW_TARGETS[path]) return null;
    if (typeof params !== 'object' || params === null || Array.isArray(params)) return null;
    const allowed = VIEW_TARGETS[path];
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (!allowed.includes(key)) continue; // drop unknown keys silently
      if (typeof value === 'string' && value.length <= 500) {
        cleaned[key] = value;
      }
    }
    return { path, params: cleaned };
  } catch {
    return null;
  }
}

/** Rebuild a safe URL from a stored filter_json. Falls back to /lab. */
export function labViewHref(filterJson: string): string {
  const filter = validateLabViewFilter(filterJson);
  if (!filter) return '/lab';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filter.params)) {
    if (v !== '') sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${filter.path}?${qs}` : filter.path;
}

/**
 * Build a structured filter_json for a saved view from the current page URL.
 * Only allowlisted params for the target path are kept — everything else
 * (including `page`) is dropped server-side, so the stored payload is always
 * safe to apply later. Returns null for unknown target paths.
 */
export function buildLabViewFilterJson(path: string, url: URL): string | null {
  const allowed = VIEW_TARGETS[path];
  if (!allowed) return null;
  const params: Record<string, string> = {};
  for (const key of allowed) {
    const value = url.searchParams.get(key);
    if (value !== null && value !== '' && value.length <= 500) params[key] = value;
  }
  return JSON.stringify({ path, params });
}

/** List all saved views for a user, newest first. */
export function listLabSavedViews(userId: number): LabSavedView[] {
  return getDb()
    .prepare(
      `SELECT id, user_id, name, filter_json, created_at
       FROM lab_saved_views WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(userId) as LabSavedView[];
}

/** Save a new view for the user. Returns the new row id. */
export function saveLabView(userId: number, name: string, filterJson: string): number {
  const res = getDb()
    .prepare('INSERT INTO lab_saved_views (user_id, name, filter_json) VALUES (?, ?, ?)')
    .run(userId, name, filterJson);
  return Number(res.lastInsertRowid);
}

/** Delete a saved view — owner only. Returns false when not owned. */
export function deleteLabView(userId: number, id: number): boolean {
  const res = getDb()
    .prepare('DELETE FROM lab_saved_views WHERE id = ? AND user_id = ?')
    .run(id, userId);
  return res.changes > 0;
}
