// QC Laboratory controlled-document acknowledgement (/lab/acknowledgements).
//
// A controlled document version must be read and acknowledged by the employees
// it applies to. Each acknowledgement row (lab_document_acknowledgements,
// migration 013) tracks exactly one (document_version, user) pair — so an
// acknowledgement is VERSION-SPECIFIC: acknowledging SOP-QC-001 v3 creates a
// distinct PENDING row from v4, and acknowledging v3 never touches v4. The six
// tracked fields are document (via the version join), version, employee,
// assigned date (assigned_at), acknowledged date (acknowledged_at) and status
// (PENDING / ACKNOWLEDGED) — every column is a stored value, nothing derived.
//
// Writes go through one transaction and reuse the shared qc_audit_log with
// entity_type='LAB_DOCUMENT_VERSION': assignment writes a CREATE row listing
// the assigned employees, and acknowledgement writes an ACKNOWLEDGE row. The
// existing notification engine is reused unchanged — assignment notifies each
// assigned employee and acknowledgement notifies the document owner — with
// taskId null so the bell link resolves to /notifications (same known
// limitation as the lab calibration/test notifications; persisted kinds fall
// back to the 'assigned' section on read).
//
// Assignment is restricted to APPROVED versions (a draft is never something an
// employee acknowledges) and requires supervisor+ (canAssignLabDocument-
// Acknowledgement, the same bar as document creation). Acknowledgement itself
// is open to every role but is self-scoped: a user can only acknowledge their
// OWN pending row.

import type { APIContext } from 'astro';
import { getDb, transaction } from '../db';
import { appendQcAudit } from '../audit/qcChain';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { createNotification } from '../notifications';
import { canAcknowledgeLabDocument, canAssignLabDocumentAcknowledgement } from '../permissions';
import type { LabAcknowledgementStatus, LabDocumentStatus, LabDocumentType } from '../types';

// ─────────────────────────────── Policy ───────────────────────────────

/** Acknowledgement statuses (lab_document_acknowledgements.status CHECK, migration 013). */
export const LAB_ACKNOWLEDGEMENT_STATUSES: readonly LabAcknowledgementStatus[] = ['PENDING', 'ACKNOWLEDGED'];

export const LAB_ACKNOWLEDGEMENT_STATUS_LABELS: Record<LabAcknowledgementStatus, string> = {
  PENDING: 'Pending',
  ACKNOWLEDGED: 'Acknowledged',
};

// ─────────────────────────────── List / search ───────────────────────────────

export type LabAcknowledgementSortField =
  | 'document'
  | 'version'
  | 'employee'
  | 'assigned_at'
  | 'acknowledged_at'
  | 'status';

export const LAB_ACKNOWLEDGEMENT_SORT_FIELDS: readonly LabAcknowledgementSortField[] = [
  'document',
  'version',
  'employee',
  'assigned_at',
  'acknowledged_at',
  'status',
];

export const LAB_ACKNOWLEDGEMENT_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_LAB_ACKNOWLEDGEMENT_PER_PAGE = 25;
export const DEFAULT_LAB_ACKNOWLEDGEMENT_SORT: LabAcknowledgementSortField = 'assigned_at';
export const DEFAULT_LAB_ACKNOWLEDGEMENT_DIR: 'asc' | 'desc' = 'desc';

export interface LabAcknowledgementSearchFilters {
  /** Free text — document code/title or employee name (LIKE). */
  q: string | null;
  /** Stored status filter — PENDING or ACKNOWLEDGED. */
  status: LabAcknowledgementStatus | null;
  /** Restrict to one document (lab_documents.id). */
  document: number | null;
  /** Restrict to one employee (users.id). */
  employee: number | null;
  /** Restrict to one version (lab_document_versions.id) — version drill-down. */
  version: number | null;
  sort: LabAcknowledgementSortField;
  dir: 'asc' | 'desc';
  page: number;
  per_page: number;
}

export const NO_LAB_ACKNOWLEDGEMENT_FILTERS: LabAcknowledgementSearchFilters = {
  q: null,
  status: null,
  document: null,
  employee: null,
  version: null,
  sort: DEFAULT_LAB_ACKNOWLEDGEMENT_SORT,
  dir: DEFAULT_LAB_ACKNOWLEDGEMENT_DIR,
  page: 1,
  per_page: DEFAULT_LAB_ACKNOWLEDGEMENT_PER_PAGE,
};

function positiveInt(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeAcknowledgementLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Parse + validate the /lab/acknowledgements query params. Invalid values drop silently. */
export function parseLabAcknowledgementFilters(url: URL): LabAcknowledgementSearchFilters {
  const f: LabAcknowledgementSearchFilters = { ...NO_LAB_ACKNOWLEDGEMENT_FILTERS };
  const sp = url.searchParams;
  const q = sp.get('q');
  if (q && q.trim() !== '') f.q = q.trim().slice(0, 300);
  const status = sp.get('status');
  if (status && (LAB_ACKNOWLEDGEMENT_STATUSES as readonly string[]).includes(status)) {
    f.status = status as LabAcknowledgementStatus;
  }
  const document = positiveInt(sp.get('document') ?? '');
  if (document !== null) f.document = document;
  const employee = positiveInt(sp.get('employee') ?? '');
  if (employee !== null) f.employee = employee;
  const version = positiveInt(sp.get('version') ?? '');
  if (version !== null) f.version = version;
  const sort = sp.get('sort');
  if (sort && (LAB_ACKNOWLEDGEMENT_SORT_FIELDS as readonly string[]).includes(sort)) {
    f.sort = sort as LabAcknowledgementSortField;
  }
  const dir = sp.get('dir');
  if (dir === 'asc' || dir === 'desc') f.dir = dir;
  const page = positiveInt(sp.get('page') ?? '');
  if (page !== null) f.page = page;
  const per = positiveInt(sp.get('per') ?? '');
  if (per !== null && (LAB_ACKNOWLEDGEMENT_PER_PAGE_OPTIONS as readonly number[]).includes(per)) f.per_page = per;
  return f;
}

/** True when any list filter is active (drives the "Reset" affordance). */
export function hasLabAcknowledgementFilters(f: LabAcknowledgementSearchFilters): boolean {
  return Boolean(
    f.q || f.status || f.document !== null || f.employee !== null || f.version !== null,
  );
}

/** Rebuild the querystring for the current filters (sort/pagination links). */
export function labAcknowledgementFiltersToQuery(f: LabAcknowledgementSearchFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.status) sp.set('status', f.status);
  if (f.document !== null) sp.set('document', String(f.document));
  if (f.employee !== null) sp.set('employee', String(f.employee));
  if (f.version !== null) sp.set('version', String(f.version));
  if (f.sort !== DEFAULT_LAB_ACKNOWLEDGEMENT_SORT) sp.set('sort', f.sort);
  if (f.dir !== DEFAULT_LAB_ACKNOWLEDGEMENT_DIR) sp.set('dir', f.dir);
  if (f.per_page !== DEFAULT_LAB_ACKNOWLEDGEMENT_PER_PAGE) sp.set('per', String(f.per_page));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export interface LabAcknowledgementRow {
  id: number;
  document_version_id: number;
  document_id: number;
  code: string;
  title: string;
  type: LabDocumentType;
  version: number;
  user_id: number;
  employee_name: string;
  assigned_at: string;
  acknowledged_at: string | null;
  status: LabAcknowledgementStatus;
}

export interface LabAcknowledgementSearchResult {
  rows: LabAcknowledgementRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Whitelisted sort expression per field — raw input is never used as SQL. */
const SORT_SQL: Record<LabAcknowledgementSortField, string> = {
  document: 'd.code COLLATE NOCASE',
  version: 'v.version',
  employee: 'u.full_name COLLATE NOCASE',
  assigned_at: 'a.assigned_at',
  acknowledged_at: 'a.acknowledged_at',
  status: 'a.status',
};

/**
 * Paged, sorted, filtered acknowledgement register. Every row resolves the six
 * tracked fields: document (code/title/type via the version join), version
 * number, employee name, assigned date, acknowledged date and stored status.
 * Every value rides in the params array — no user input in SQL text.
 */
export function searchLabAcknowledgements(f: LabAcknowledgementSearchFilters): LabAcknowledgementSearchResult {
  const db = getDb();
  const conds: string[] = [];
  const params: unknown[] = [];

  if (f.q) {
    const like = `%${escapeAcknowledgementLike(f.q)}%`;
    conds.push(
      "(d.code LIKE ? ESCAPE '\\' OR d.title LIKE ? ESCAPE '\\' OR u.full_name LIKE ? ESCAPE '\\')",
    );
    params.push(like, like, like);
  }
  if (f.status) {
    conds.push('a.status = ?');
    params.push(f.status);
  }
  if (f.document !== null) {
    conds.push('d.id = ?');
    params.push(f.document);
  }
  if (f.employee !== null) {
    conds.push('a.user_id = ?');
    params.push(f.employee);
  }
  if (f.version !== null) {
    conds.push('a.document_version_id = ?');
    params.push(f.version);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const FROM = `
    FROM lab_document_acknowledgements a
    JOIN lab_document_versions v ON v.id = a.document_version_id
    JOIN lab_documents d ON d.id = v.document_id
    JOIN users u ON u.id = a.user_id`;

  const totalRow = db.prepare(`SELECT COUNT(*) AS n ${FROM} ${where}`).get(...params) as { n: number };
  const total = Number(totalRow.n);
  const totalPages = Math.max(1, Math.ceil(total / f.per_page));
  const page = Math.min(f.page, totalPages);
  const offset = (page - 1) * f.per_page;
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const rows = db
    .prepare(
      `SELECT a.id, a.document_version_id, a.user_id, a.assigned_at, a.acknowledged_at, a.status,
              d.id AS document_id, d.code, d.title, d.type, v.version,
              u.full_name AS employee_name
       ${FROM} ${where}
       ORDER BY ${SORT_SQL[f.sort]} ${dir}, a.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, f.per_page, offset) as LabAcknowledgementRow[];
  return { rows, total, page, per_page: f.per_page, total_pages: totalPages };
}

// ─────────────────────────────── Dropdowns ───────────────────────────────

/** Documents that have at least one acknowledgement row (document filter). */
export function listLabAcknowledgementDocuments(): Array<{ id: number; code: string; title: string }> {
  return getDb()
    .prepare(
      `SELECT DISTINCT d.id, d.code, d.title
       FROM lab_document_acknowledgements a
       JOIN lab_document_versions v ON v.id = a.document_version_id
       JOIN lab_documents d ON d.id = v.document_id
       ORDER BY d.code COLLATE NOCASE ASC, d.id ASC`,
    )
    .all() as Array<{ id: number; code: string; title: string }>;
}

/** Employees that hold at least one acknowledgement row (employee filter). */
export function listLabAcknowledgementEmployees(): Array<{ id: number; full_name: string }> {
  return getDb()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name
       FROM lab_document_acknowledgements a
       JOIN users u ON u.id = a.user_id
       ORDER BY u.full_name COLLATE NOCASE ASC, u.id ASC`,
    )
    .all() as Array<{ id: number; full_name: string }>;
}

// ─────────────────────────────── Assignment view ───────────────────────────────

export interface LabAcknowledgementAssignView {
  version_id: number;
  version: number;
  version_status: LabDocumentStatus;
  document: { id: number; code: string; title: string; type: LabDocumentType };
  /** Only APPROVED versions may be assigned (controlled-document semantics). */
  is_assignable: boolean;
  /** Existing acknowledgement rows for this version (read-only on the form). */
  existing: Array<{
    id: number;
    user_id: number;
    full_name: string;
    status: LabAcknowledgementStatus;
    assigned_at: string;
    acknowledged_at: string | null;
  }>;
  /** Active users NOT yet assigned to this version (the assignable pool). */
  available_users: Array<{ id: number; full_name: string }>;
}

/**
 * Load the assignment form context for one document version. Returns null for
 * a missing/invalid version id. The version id always comes from the URL
 * query (retest-assignment pattern) — never from the form body.
 */
export function getLabAcknowledgementAssignView(versionId: number): LabAcknowledgementAssignView | null {
  if (!Number.isInteger(versionId) || versionId <= 0) return null;
  const db = getDb();
  const version = db
    .prepare(
      `SELECT v.id, v.version, v.status AS version_status, d.id AS document_id, d.code, d.title, d.type
       FROM lab_document_versions v
       JOIN lab_documents d ON d.id = v.document_id
       WHERE v.id = ?`,
    )
    .get(versionId) as
    | {
        id: number;
        version: number;
        version_status: LabDocumentStatus;
        document_id: number;
        code: string;
        title: string;
        type: LabDocumentType;
      }
    | undefined;
  if (!version) return null;

  const existing = db
    .prepare(
      `SELECT a.id, a.user_id, a.status, a.assigned_at, a.acknowledged_at, u.full_name
       FROM lab_document_acknowledgements a
       JOIN users u ON u.id = a.user_id
       WHERE a.document_version_id = ?
       ORDER BY a.assigned_at ASC, a.id ASC`,
    )
    .all(versionId) as Array<{
    id: number;
    user_id: number;
    status: LabAcknowledgementStatus;
    assigned_at: string;
    acknowledged_at: string | null;
    full_name: string;
  }>;

  const assignedIds = existing.map((r) => r.user_id);
  const availableUsers =
    assignedIds.length === 0
      ? (db
          .prepare('SELECT id, full_name FROM users WHERE is_active = 1 ORDER BY full_name COLLATE NOCASE ASC, id ASC')
          .all() as Array<{ id: number; full_name: string }>)
      : (db
          .prepare(
            `SELECT id, full_name FROM users
             WHERE is_active = 1 AND id NOT IN (${assignedIds.map(() => '?').join(', ')})
             ORDER BY full_name COLLATE NOCASE ASC, id ASC`,
          )
          .all(...assignedIds) as Array<{ id: number; full_name: string }>);

  return {
    version_id: version.id,
    version: version.version,
    version_status: version.version_status,
    document: {
      id: version.document_id,
      code: version.code,
      title: version.title,
      type: version.type,
    },
    is_assignable: version.version_status === 'APPROVED',
    existing,
    available_users: availableUsers,
  };
}

// ─────────────────────────────── Audit + notifications ───────────────────────────────

function auditAcknowledgement(
  versionId: number,
  actorId: number,
  action: 'CREATE' | 'ACKNOWLEDGE',
  note: string,
): void {
  appendQcAudit(getDb(), { entityType: 'LAB_DOCUMENT_VERSION', entityId: versionId, actorId, action, note });
}

function resolveDocumentForVersion(versionId: number): { code: string; title: string; version: number } | null {
  return getDb()
    .prepare(
      `SELECT d.code, d.title, v.version
       FROM lab_document_versions v JOIN lab_documents d ON d.id = v.document_id
       WHERE v.id = ?`,
    )
    .get(versionId) as { code: string; title: string; version: number } | undefined ?? null;
}

/**
 * Notify each newly assigned employee (reuses the existing notification
 * engine). entity_href opens the acknowledgements register pre-filtered to the
 * version so the employee lands on their pending row (migration 022).
 */
function notifyAssignedEmployee(userId: number, doc: { code: string; version: number; versionId: number }): void {
  createNotification({
    userId,
    taskId: null,
    type: 'lab_document_acknowledgement',
    title: `Acknowledgement required: ${doc.code} v${doc.version}`,
    message: `Please read and acknowledge ${doc.code} v${doc.version} in the controlled documents register.`,
    href: `/lab/acknowledgements?version=${doc.versionId}`,
  });
}

/** Notify the document owner when an employee acknowledges (completion tracking). */
function notifyOwnerOnAcknowledgement(ownerId: number, doc: { code: string; version: number; versionId: number; employeeName: string }): void {
  createNotification({
    userId: ownerId,
    taskId: null,
    type: 'lab_document_acknowledged',
    title: `${doc.code} v${doc.version} acknowledged by ${doc.employeeName}`,
    message: `${doc.employeeName} acknowledged ${doc.code} v${doc.version}.`,
    href: `/lab/acknowledgements?version=${doc.versionId}`,
  });
}

// ─────────────────────────────── Assignment ───────────────────────────────

/**
 * Assign a document version to employees for acknowledgement. One transaction:
 * verifies the version exists and is APPROVED, verifies every user is an
 * active employee, inserts a PENDING row per (version, user) — skipping users
 * already assigned (the UNIQUE(document_version_id, user_id) makes a second
 * assignment meaningless) — then audits CREATE and notifies each newly
 * assigned user. Returns the number of rows created; throws a descriptive
 * Error on any invalid input.
 */
export function assignLabDocumentAcknowledgements(
  versionId: number,
  userIds: number[],
  actorId: number,
): number {
  const uniqueUserIds = [...new Set(userIds)].filter((id) => Number.isInteger(id) && id > 0);
  if (uniqueUserIds.length === 0) {
    throw new Error('Select at least one employee to assign.');
  }
  return transaction(() => {
    const db = getDb();
    const version = db
      .prepare(
        `SELECT v.id, v.version, v.status, d.code, d.title, d.owner_id, d.created_by
         FROM lab_document_versions v JOIN lab_documents d ON d.id = v.document_id
         WHERE v.id = ?`,
      )
      .get(versionId) as
      | {
          id: number;
          version: number;
          status: LabDocumentStatus;
          code: string;
          title: string;
          owner_id: number | null;
          created_by: number;
        }
      | undefined;
    if (!version) throw new Error('The document version was not found.');
    if (version.status !== 'APPROVED') {
      throw new Error('Only approved versions can be assigned for acknowledgement.');
    }

    const active = db
      .prepare('SELECT id FROM users WHERE id IN (' + uniqueUserIds.map(() => '?').join(', ') + ') AND is_active = 1')
      .all(...uniqueUserIds) as Array<{ id: number }>;
    if (active.length !== uniqueUserIds.length) {
      throw new Error('One or more selected employees are not active users.');
    }

    const existing = new Set(
      (
        db
          .prepare('SELECT user_id FROM lab_document_acknowledgements WHERE document_version_id = ?')
          .all(versionId) as Array<{ user_id: number }>
      ).map((r) => r.user_id),
    );
    const newUsers = uniqueUserIds.filter((id) => !existing.has(id));
    if (newUsers.length === 0) {
      throw new Error('All selected employees are already assigned to this version.');
    }

    const insert = db.prepare(
      `INSERT INTO lab_document_acknowledgements (document_version_id, user_id, status)
       VALUES (?, ?, 'PENDING')`,
    );
    for (const id of newUsers) insert.run(versionId, id);

    const names = db
      .prepare('SELECT id, full_name FROM users WHERE id IN (' + newUsers.map(() => '?').join(', ') + ')')
      .all(...newUsers) as Array<{ id: number; full_name: string }>;
    const nameById = new Map(names.map((u) => [u.id, u.full_name]));
    auditAcknowledgement(
      versionId,
      actorId,
      'CREATE',
      `document=${version.code}; version=v${version.version}; assigned=${newUsers
        .map((id) => nameById.get(id) ?? `user#${id}`)
        .join(', ')}`,
    );
    for (const id of newUsers) notifyAssignedEmployee(id, { code: version.code, version: version.version, versionId });
    return newUsers.length;
  });
}

// ─────────────────────────────── Acknowledgement ───────────────────────────────

/**
 * Acknowledge one assigned row (one transaction): the row must exist, belong
 * to the acting user, and still be PENDING. Version-specific by construction —
 * the row is tied to one (document_version, user) pair, so acknowledging it
 * never affects any other version's rows. Writes acknowledged_at, audits
 * ACKNOWLEDGE and notifies the document owner.
 */
export function acknowledgeLabDocumentAcknowledgement(acknowledgementId: number, userId: number): void {
  if (!Number.isInteger(acknowledgementId) || acknowledgementId <= 0) {
    throw new Error('Invalid acknowledgement record.');
  }
  transaction(() => {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT a.id, a.document_version_id, a.user_id, a.status, a.assigned_at,
                v.version, d.code, d.title, d.owner_id, d.created_by,
                u.full_name AS employee_name
         FROM lab_document_acknowledgements a
         JOIN lab_document_versions v ON v.id = a.document_version_id
         JOIN lab_documents d ON d.id = v.document_id
         JOIN users u ON u.id = a.user_id
         WHERE a.id = ?`,
      )
      .get(acknowledgementId) as
      | {
          id: number;
          document_version_id: number;
          user_id: number;
          status: LabAcknowledgementStatus;
          assigned_at: string;
          version: number;
          code: string;
          title: string;
          owner_id: number | null;
          created_by: number;
          employee_name: string;
        }
      | undefined;
    if (!row) throw new Error('The acknowledgement record was not found.');
    if (row.user_id !== userId) {
      throw new Error('You can only acknowledge documents assigned to you.');
    }
    if (row.status === 'ACKNOWLEDGED') {
      throw new Error('This document version is already acknowledged.');
    }
    db.prepare(
      `UPDATE lab_document_acknowledgements
       SET status = 'ACKNOWLEDGED', acknowledged_at = datetime('now')
       WHERE id = ?`,
    ).run(acknowledgementId);
    auditAcknowledgement(
      row.document_version_id,
      userId,
      'ACKNOWLEDGE',
      `document=${row.code}; version=v${row.version}; acknowledged_by=${row.employee_name}`,
    );
    const ownerId = row.owner_id ?? row.created_by;
    if (ownerId && ownerId !== userId) {
      notifyOwnerOnAcknowledgement(ownerId, {
        code: row.code,
        version: row.version,
        versionId: row.document_version_id,
        employeeName: row.employee_name,
      });
    }
  });
}

// ─────────────────────────────── POST handlers ───────────────────────────────

/**
 * POST /lab/acknowledgements/assign?version=<id> — assign a document version
 * to employees. The version id comes from the URL query only (never the body);
 * the employee ids arrive as repeated `user_ids` FormData entries. Re-checks
 * the supervisor+ assign permission, CSRF, then flashes + redirects.
 */
export async function handleLabAcknowledgementAssignPost(
  context: APIContext,
  versionId: number | null,
): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const backUrl =
    Number.isInteger(versionId) && versionId !== null && versionId > 0
      ? `/lab/acknowledgements/assign?version=${versionId}`
      : '/lab/acknowledgements';

  if (!canAssignLabDocumentAcknowledgement(user.role)) {
    setFlash(context, 'error', 'You do not have permission to assign document acknowledgements.');
    return context.redirect('/lab/acknowledgements');
  }
  if (!Number.isInteger(versionId) || versionId === null || versionId <= 0) {
    setFlash(context, 'error', 'A valid document version is required.');
    return context.redirect('/lab/acknowledgements');
  }

  // Dynamic import keeps this module loadable in the bundler-less unit tests.
  const { parseFormData, labAcknowledgementAssignSchema } = await import('../validation');
  const form = await context.request.formData();
  const parsed = parseFormData(labAcknowledgementAssignSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }

  // The form serializes the employee checkboxes as duplicate `user_ids`
  // entries; collect them before validation (equipment_ids pattern).
  const userIds = [...form.getAll('user_ids')]
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  try {
    const count = assignLabDocumentAcknowledgements(versionId, userIds, user.id);
    const doc = resolveDocumentForVersion(versionId);
    const label = doc ? `${doc.code} v${doc.version}` : `version #${versionId}`;
    setFlash(
      context,
      'success',
      `Acknowledgement assigned to ${count} employee${count === 1 ? '' : 's'} for ${label}.`,
    );
    return context.redirect(`/lab/acknowledgements?version=${versionId}`);
  } catch (err) {
    console.error('[lab] acknowledgement assignment failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not assign the acknowledgement.');
    return context.redirect(backUrl);
  }
}

/**
 * POST /lab/acknowledgements/[id]/acknowledge — the assigned user acknowledges
 * their own pending row. The row id comes from the path segment only; the
 * handler re-checks the (all-role) acknowledge permission + CSRF, and the
 * service enforces self-scoping + PENDING status.
 */
export async function handleLabAcknowledgementPost(context: APIContext, acknowledgementId: number): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  if (!canAcknowledgeLabDocument(user.role)) {
    setFlash(context, 'error', 'You do not have permission to acknowledge documents.');
    return context.redirect('/lab/acknowledgements');
  }

  try {
    acknowledgeLabDocumentAcknowledgement(acknowledgementId, user.id);
    setFlash(context, 'success', 'Document version acknowledged.');
  } catch (err) {
    console.error('[lab] acknowledgement failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not acknowledge the document.');
  }
  return context.redirect('/lab/acknowledgements');
}
