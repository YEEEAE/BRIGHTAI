// QC Laboratory test ↔ QC Finding traceability links (PROMPT 20 —
// Investigation / NCR / CAPA hooks).
//
// This module lets a laboratory test reference an EXISTING QC Finding — the
// NCR-like entity owned by the QC Operations domain. It deliberately does NOT
// create a second quality-management workflow: findings, RCA, CAPA and their
// state machines all stay owned by src/lib/qc-operations.ts + the
// findings/capa domain rules. The relation is Test → Finding (→ CAPA via the
// finding's own 1:1 qc_capa row). There is no investigation entity in the
// system, so only finding links are modelled.
//
// The link row itself lives in lab_test_findings (migration 021, RESTRICT on
// both sides so traceability survives deletion attempts). Every link/unlink
// also writes a LAB_TEST/LINK or LAB_TEST/UNLINK row in the shared
// qc_audit_log — the same surface the pre-existing read hook
// (getLabTestRelatedQualityEntities) consumes, never a second audit system.

import type { APIContext } from 'astro';
import type BetterSqliteDatabase from 'better-sqlite3';
import { transaction, getDb } from '../db';
import { setFlash } from '../flash';
import { getCurrentUser } from '../session';
import { requireCsrf } from '../api-security';
import { canLinkLabTestToFinding } from '../permissions';
import { appendQcAudit } from '../audit/qcChain';
import { labTestFindingLinkSchema, parseFormData } from '../validation';

export interface LabTestFindingLink {
  test_id: number;
  finding_id: number;
  finding_number: string;
  classification: string;
  severity: string;
  status: string;
  task_title: string | null;
  note: string | null;
  linked_by_name: string;
  created_at: string;
  href: string;
}

export interface LabTestFindingLinkOption {
  id: number;
  finding_number: string;
  classification: string;
  severity: string;
  status: string;
}

/** Cap on the finding picker so the select never renders an unbounded list. */
export const LAB_TEST_FINDING_OPTIONS_LIMIT = 500;

function auditFindingLink(
  db: BetterSqliteDatabase.Database,
  testId: number,
  findingId: number,
  findingNumber: string,
  actorId: number,
  action: 'LINK' | 'UNLINK',
): void {
  appendQcAudit(db, { entityType: 'LAB_TEST', entityId: testId, actorId, action, note: `finding=${findingNumber} (id=${findingId})` });
}

/**
 * Resolve the findings currently linked to a test — finding number,
 * classification, severity, status, the owning task title, who linked it and
 * when, plus the existing /findings/[id] route. Empty when none.
 */
export function getLabTestFindingLinks(testId: number): LabTestFindingLink[] {
  const rows = getDb()
    .prepare(
      `SELECT ltf.test_id, ltf.finding_id, ltf.note, ltf.created_at,
              f.finding_number, f.classification, f.severity, f.status,
              t.title AS task_title, u.full_name AS linked_by_name
       FROM lab_test_findings ltf
       JOIN qc_findings f ON f.id = ltf.finding_id
       LEFT JOIN tasks t ON t.id = f.task_id
       LEFT JOIN users u ON u.id = ltf.created_by
       WHERE ltf.test_id = ?
       ORDER BY ltf.created_at DESC, ltf.id DESC`,
    )
    .all(testId) as Array<Omit<LabTestFindingLink, 'href'>>;
  return rows.map((row) => ({ ...row, href: `/findings/${row.finding_id}` }));
}

/**
 * Findings available to link to this test — every finding NOT already linked
 * to it, newest first, capped so the picker stays bounded. Closed findings
 * stay selectable: associating an approved record with a closed finding is a
 * legitimate traceability operation.
 */
export function getLabTestFindingLinkOptions(testId: number): LabTestFindingLinkOption[] {
  return getDb()
    .prepare(
      `SELECT f.id, f.finding_number, f.classification, f.severity, f.status
       FROM qc_findings f
       WHERE NOT EXISTS (
         SELECT 1 FROM lab_test_findings ltf
         WHERE ltf.test_id = ? AND ltf.finding_id = f.id
       )
       ORDER BY f.id DESC
       LIMIT ?`,
    )
    .all(testId, LAB_TEST_FINDING_OPTIONS_LIMIT) as LabTestFindingLinkOption[];
}

export interface LabTestFindingLinkInput {
  actorId: number;
  testId: number;
  findingId: number;
  note: string | null;
}

/**
 * Link a test to a finding (one transaction): verifies both rows exist,
 * refuses duplicate links, inserts the link row and writes the
 * LAB_TEST/LINK audit row. Throws a descriptive Error on any invalid input.
 */
export function linkLabTestToFinding({ actorId, testId, findingId, note }: LabTestFindingLinkInput): void {
  if (!Number.isInteger(testId) || testId <= 0 || !Number.isInteger(findingId) || findingId <= 0) {
    throw new Error('A valid test and finding are required to create a link.');
  }
  transaction(() => {
    const db = getDb();
    const test = db.prepare('SELECT id FROM lab_test_records WHERE id = ?').get(testId) as { id: number } | undefined;
    if (!test) throw new Error('The laboratory test record was not found.');
    const finding = db
      .prepare('SELECT id, finding_number FROM qc_findings WHERE id = ?')
      .get(findingId) as { id: number; finding_number: string } | undefined;
    if (!finding) throw new Error('The finding was not found.');
    const existing = db
      .prepare('SELECT id FROM lab_test_findings WHERE test_id = ? AND finding_id = ?')
      .get(testId, findingId);
    if (existing) throw new Error('This test is already linked to that finding.');
    db.prepare(
      `INSERT INTO lab_test_findings (test_id, finding_id, note, created_by)
       VALUES (?, ?, ?, ?)`,
    ).run(testId, findingId, note, actorId);
    auditFindingLink(db, testId, findingId, finding.finding_number, actorId, 'LINK');
  });
}

export interface LabTestFindingUnlinkInput {
  actorId: number;
  testId: number;
  findingId: number;
}

/**
 * Remove a test ↔ finding link (one transaction): verifies the link exists,
 * deletes it and writes the LAB_TEST/UNLINK audit row. Throws on unknown
 * link or invalid ids.
 */
export function unlinkLabTestFromFinding({ actorId, testId, findingId }: LabTestFindingUnlinkInput): void {
  if (!Number.isInteger(testId) || testId <= 0 || !Number.isInteger(findingId) || findingId <= 0) {
    throw new Error('A valid test and finding are required to remove a link.');
  }
  transaction(() => {
    const db = getDb();
    const row = db
      .prepare('SELECT id FROM lab_test_findings WHERE test_id = ? AND finding_id = ?')
      .get(testId, findingId);
    if (!row) throw new Error('This test is not linked to that finding.');
    const finding = db
      .prepare('SELECT finding_number FROM qc_findings WHERE id = ?')
      .get(findingId) as { finding_number: string } | undefined;
    db.prepare('DELETE FROM lab_test_findings WHERE id = ?').run(Number((row as { id: number }).id));
    auditFindingLink(db, testId, findingId, finding?.finding_number ?? String(findingId), actorId, 'UNLINK');
  });
}

/**
 * POST /lab/tests/[id]/links — create a test ↔ finding link. The test id
 * comes from the URL segment only (never the body); the finding id + an
 * optional bounded note come from the form. Re-checks supervisor+ (same
 * bar as retest creation), CSRF and the shared Zod validation.
 */
export async function handleLabTestFindingLinkPost(context: APIContext, testId: number): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const backUrl = Number.isInteger(testId) && testId > 0 ? `/lab/tests/${testId}` : '/lab/tests';

  if (!canLinkLabTestToFinding(user.role)) {
    setFlash(context, 'error', 'You do not have permission to link tests to findings.');
    return context.redirect(backUrl);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labTestFindingLinkSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }

  const { finding_id, note } = parsed.data as { finding_id: number; note: string | null };
  try {
    linkLabTestToFinding({ actorId: user.id, testId, findingId: finding_id, note });
    setFlash(context, 'success', 'Finding linked to this test.');
  } catch (err) {
    console.error('[lab] test finding link failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not link the finding.');
  }
  return context.redirect(backUrl);
}

/**
 * POST /lab/tests/[id]/links/unlink — remove a test ↔ finding link. The test
 * id comes from the URL segment only; the finding id from the form. Same
 * supervisor+ bar, CSRF and shared Zod validation as linking.
 */
export async function handleLabTestFindingUnlinkPost(context: APIContext, testId: number): Promise<Response> {
  const user = getCurrentUser(context);
  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(context.url.pathname)}`);
  }
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const backUrl = Number.isInteger(testId) && testId > 0 ? `/lab/tests/${testId}` : '/lab/tests';

  if (!canLinkLabTestToFinding(user.role)) {
    setFlash(context, 'error', 'You do not have permission to manage test-to-finding links.');
    return context.redirect(backUrl);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labTestFindingLinkSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }

  const { finding_id } = parsed.data as { finding_id: number };
  try {
    unlinkLabTestFromFinding({ actorId: user.id, testId, findingId: finding_id });
    setFlash(context, 'success', 'Finding unlinked from this test.');
  } catch (err) {
    console.error('[lab] test finding unlink failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not unlink the finding.');
  }
  return context.redirect(backUrl);
}
