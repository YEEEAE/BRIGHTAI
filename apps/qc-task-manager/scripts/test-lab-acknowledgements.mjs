// Database-backed unit checks for the QC Laboratory controlled-document
// acknowledgement module (src/lib/lab/acknowledgements.ts — /lab/acknowledgements,
// contract §5.2 LAB_DOCUMENT_ACKNOWLEDGE use case).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed is ON (QC_SEED_LAB_EQUIPMENT=1) so the
// canonical 24-device registry loads — documents/acknowledgements themselves
// are NEVER seeded (they start empty, no fabricated records). Focus: the six
// tracked fields (document / version / employee / assigned date / acknowledged
// date / status), VERSION-SPECIFIC acknowledgement (v3 ≠ v4 — one row per
// (version, user), acknowledging one never touches the other), the filters
// (q / status / document / employee / version), whitelisted sorting, server-
// side pagination, the supervisor+ assignment gate (APPROVED versions only),
// self-scoped acknowledgement, the shared audit log (LAB_DOCUMENT_VERSION
// CREATE / ACKNOWLEDGE) and the reused notification engine.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-acknowledgements-'));
const dbPath = join(tempDir, 'lab-acknowledgements.db');

let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ❌ ${label}`);
  }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

let db;
let managerId;
let supervisorId;
let employeeId;
let secondEmployeeId;

/** Insert a document + an optional numbered version; returns the document id. */
function insertDoc({ code, title, type = 'SOP', status = 'APPROVED', ownerId, version = 1, versionStatus = 'APPROVED' }) {
  const result = db
    .prepare(
      `INSERT INTO lab_documents (code, title, type, owner_id, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(code, title, type, ownerId, status, managerId);
  const docId = Number(result.lastInsertRowid);
  if (version !== null) {
    const v = db
      .prepare(
        `INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(docId, version, '# content', 'Initial version.', managerId, versionStatus);
    const versionId = Number(v.lastInsertRowid);
    db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, docId);
  }
  return docId;
}

/** Insert one acknowledgement row directly; returns the row id. */
function insertAck({ versionId, userId, status = 'PENDING', assignedAt = null, acknowledgedAt = null }) {
  const r = db
    .prepare(
      `INSERT INTO lab_document_acknowledgements (document_version_id, user_id, assigned_at, acknowledged_at, status)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(versionId, userId, assignedAt ?? '2026-01-10 09:00:00', acknowledgedAt, status);
  return Number(r.lastInsertRowid);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '1';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '1' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const acks = await import('../src/lib/lab/acknowledgements.ts');
  const perms = await import('../src/lib/permissions.ts');

  db = getDb();
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  // A second active employee for multi-assign / version-specific scenarios.
  const second = db
    .prepare(
      `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
       VALUES ('employee2', 'unused', 'Second Employee', 'employee', 'QC', 1, 1)`,
    )
    .run();
  secondEmployeeId = Number(second.lastInsertRowid);

  // ── Policy constants ──
  console.log('■ Policy');
  {
    eq(acks.LAB_ACKNOWLEDGEMENT_STATUSES.length, 2, 'policy: two statuses');
    ok(acks.LAB_ACKNOWLEDGEMENT_STATUSES.includes('PENDING'), 'policy: PENDING');
    ok(acks.LAB_ACKNOWLEDGEMENT_STATUSES.includes('ACKNOWLEDGED'), 'policy: ACKNOWLEDGED');
    eq(acks.LAB_ACKNOWLEDGEMENT_STATUS_LABELS.PENDING, 'Pending', 'policy: PENDING label');
    eq(acks.LAB_ACKNOWLEDGEMENT_STATUS_LABELS.ACKNOWLEDGED, 'Acknowledged', 'policy: ACKNOWLEDGED label');
  }

  // ── Register starts empty ──
  console.log('■ Empty register');
  {
    eq(acks.searchLabAcknowledgements(acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS).total, 0, 'register: starts empty');
    eq(acks.listLabAcknowledgementDocuments().length, 0, 'dropdown: no documents yet');
    eq(acks.listLabAcknowledgementEmployees().length, 0, 'dropdown: no employees yet');
  }

  // ── Fixtures ──
  console.log('■ Fixtures');
  let sopV3Id;
  let sopV4Id;
  let wiV1Id;
  let draftVersionId;
  let docAckV3Emp;
  let docAckV4Emp;
  let docAckV3Emp2;
  {
    // SOP-QC-001: v3 (approved, acknowledged by employee) + v4 (approved, pending).
    const sop = insertDoc({ code: 'SOP-QC-001', title: 'Subatmospheric Air Testing Procedure', ownerId: managerId, version: null });
    const v3 = db.prepare('INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status) VALUES (?, 3, ?, ?, ?, ?)').run(sop, '# v3', 'v3 release.', managerId, 'APPROVED');
    sopV3Id = Number(v3.lastInsertRowid);
    const v4 = db.prepare('INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status) VALUES (?, 4, ?, ?, ?, ?)').run(sop, '# v4', 'v4 release.', supervisorId, 'APPROVED');
    sopV4Id = Number(v4.lastInsertRowid);
    db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(sopV4Id, sop);

    // WI-QC-002: v1 approved, acknowledged by both employees (one ACKNOWLEDGED).
    const wi = insertDoc({ code: 'WI-QC-002', title: 'Vacuum Leak Tester Setup', type: 'WI', ownerId: supervisorId, version: null });
    const w = db.prepare('INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status) VALUES (?, 1, ?, ?, ?, ?)').run(wi, '# wi v1', 'wi release.', managerId, 'APPROVED');
    wiV1Id = Number(w.lastInsertRowid);

    // A DRAFT version — must never be assignable.
    const draft = insertDoc({ code: 'SOP-QC-090', title: 'Draft In Progress', ownerId: supervisorId, version: null });
    const dv = db.prepare('INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status) VALUES (?, 1, ?, ?, ?, ?)').run(draft, '# draft', 'draft.', managerId, 'DRAFT');
    draftVersionId = Number(dv.lastInsertRowid);

    docAckV3Emp = insertAck({ versionId: sopV3Id, userId: employeeId, status: 'ACKNOWLEDGED', acknowledgedAt: '2026-01-12 10:00:00' });
    docAckV4Emp = insertAck({ versionId: sopV4Id, userId: employeeId, status: 'PENDING' });
    docAckV3Emp2 = insertAck({ versionId: sopV3Id, userId: secondEmployeeId, status: 'PENDING' });

    eq(acks.searchLabAcknowledgements(acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS).total, 3, 'fixtures: three acknowledgement rows');
  }

  // ── List: joins + stored fields ──
  console.log('■ List');
  {
    const rows = acks.searchLabAcknowledgements(acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS).rows;
    eq(rows.length, 3, 'list: all three rows');
    const v4Row = rows.find((r) => r.id === docAckV4Emp);
    eq(v4Row.code, 'SOP-QC-001', 'list: document code joined');
    eq(v4Row.title, 'Subatmospheric Air Testing Procedure', 'list: document title joined');
    eq(v4Row.version, 4, 'list: version number joined');
    eq(v4Row.employee_name, 'QC Employee', 'list: employee name joined');
    eq(v4Row.status, 'PENDING', 'list: stored status PENDING');
    ok(Boolean(v4Row.assigned_at), 'list: assigned date present');
    eq(v4Row.acknowledged_at, null, 'list: acknowledged date null while PENDING');

    const ackRow = rows.find((r) => r.id === docAckV3Emp);
    eq(ackRow.status, 'ACKNOWLEDGED', 'list: stored status ACKNOWLEDGED');
    eq(String(ackRow.acknowledged_at).slice(0, 10), '2026-01-12', 'list: acknowledged date present');

    // Default sort: assigned_at desc → newest assigned_at first (v3 emp2 was
    // inserted last with the default assigned_at now — it sorts first).
    eq(rows[0].id, docAckV3Emp2, 'list: default sort assigned_at desc, newest first');

    // Sort by document code asc / version / employee / status.
    const byDoc = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, sort: 'document', dir: 'asc' }).rows;
    eq(byDoc[0].code, 'SOP-QC-001', 'sort: document code asc');
    const byVersion = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, sort: 'version', dir: 'asc' }).rows;
    eq(byVersion[0].version, 3, 'sort: version asc → v3 first');
    const byEmployee = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, sort: 'employee', dir: 'asc' }).rows;
    eq(byEmployee[0].employee_name, 'QC Employee', 'sort: employee name asc');
    const byStatus = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, sort: 'status', dir: 'asc' }).rows;
    eq(byStatus[0].status, 'ACKNOWLEDGED', 'sort: status asc → ACKNOWLEDGED first');

    // Pagination: per_page 2 → 2 pages.
    const paged = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, per_page: 2 });
    eq(paged.total, 3, 'pagination: total 3');
    eq(paged.total_pages, 2, 'pagination: 2 pages');
    eq(paged.rows.length, 2, 'pagination: first page has 2');
    const page99 = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, per_page: 2, page: 99 });
    eq(page99.page, 2, 'pagination: page 99 clamps to last');
  }

  // ── Filters ──
  console.log('■ Filters');
  {
    const pending = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, status: 'PENDING' });
    eq(pending.total, 2, 'filter: status PENDING → 2');
    const acknowledged = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, status: 'ACKNOWLEDGED' });
    eq(acknowledged.total, 1, 'filter: status ACKNOWLEDGED → 1');

    const byEmployee = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, employee: employeeId });
    eq(byEmployee.total, 2, 'filter: employee → 2 (v3 ack + v4 pending)');
    const bySecond = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, employee: secondEmployeeId });
    eq(bySecond.total, 1, 'filter: second employee → 1');

    // version drill-down: the v3 rows only (both employees), never v4.
    const v3 = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, version: sopV3Id });
    eq(v3.total, 2, 'filter: version=v3 → 2 rows');
    ok(v3.rows.every((r) => r.version === 3), 'filter: version=v3 rows are all v3');

    // document filter.
    const wiAcks = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, document: Number(db.prepare("SELECT id FROM lab_documents WHERE code='WI-QC-002'").get().id) });
    eq(wiAcks.total, 0, 'filter: WI document has no rows yet');
  }

  // ── Search (q) ──
  console.log('■ Search');
  {
    const byCode = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, q: 'SOP-QC-001' });
    eq(byCode.total, 3, 'search: document code match (v3×2 + v4×1)');
    const byTitle = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, q: 'Vacuum Leak' });
    eq(byTitle.total, 0, 'search: WI title has no rows');
    const byEmployee = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, q: 'Second Employee' });
    eq(byEmployee.total, 1, 'search: employee name match');
    const none = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, q: 'zzz-no-such' });
    eq(none.total, 0, 'search: no match');
    const percent = acks.searchLabAcknowledgements({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, q: '%' });
    eq(percent.total, 0, 'search: % wildcard escaped');
  }

  // ── Parse (invalid values drop silently) ──
  console.log('■ Parse');
  {
    const url = new URL('http://x/lab/acknowledgements?status=BAD&document=7&employee=abc&version=0&sort=hack&dir=sideways&page=3&per=17');
    const f = acks.parseLabAcknowledgementFilters(url);
    eq(f.status, null, 'parse: invalid status dropped');
    eq(f.document, 7, 'parse: numeric document kept');
    eq(f.employee, null, 'parse: non-numeric employee dropped');
    eq(f.version, null, 'parse: version 0 dropped');
    eq(f.sort, 'assigned_at', 'parse: invalid sort → default');
    eq(f.dir, 'desc', 'parse: invalid dir → default');
    eq(f.page, 3, 'parse: page kept');
    eq(f.per_page, 25, 'parse: invalid per_page → default');

    const url2 = new URL('http://x/lab/acknowledgements?status=PENDING&version=12&q=%20%20');
    const f2 = acks.parseLabAcknowledgementFilters(url2);
    eq(f2.status, 'PENDING', 'parse: valid status kept');
    eq(f2.version, 12, 'parse: version kept');
    eq(f2.q, null, 'parse: blank q dropped');

    ok(acks.hasLabAcknowledgementFilters({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, status: 'PENDING' }), 'has: status active');
    ok(acks.hasLabAcknowledgementFilters({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, version: 3 }), 'has: version active');
    ok(!acks.hasLabAcknowledgementFilters(acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS), 'has: defaults inactive');
    const qs = acks.labAcknowledgementFiltersToQuery({ ...acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS, status: 'PENDING', version: 12, sort: 'employee', dir: 'asc' });
    ok(qs.includes('status=PENDING'), 'query: status encoded');
    ok(qs.includes('version=12'), 'query: version encoded');
    ok(qs.includes('sort=employee'), 'query: sort encoded');
    ok(qs.includes('dir=asc'), 'query: dir encoded');
    eq(acks.labAcknowledgementFiltersToQuery(acks.NO_LAB_ACKNOWLEDGEMENT_FILTERS), '', 'query: defaults → empty');
  }

  // ── Assign: happy path ──
  console.log('■ Assign (happy path)');
  let assignCount;
  {
    const before = db.prepare('SELECT COUNT(*) AS n FROM lab_document_acknowledgements WHERE document_version_id = ?').get(wiV1Id).n;
    eq(Number(before), 0, 'assign: WI v1 has no rows yet');
    assignCount = acks.assignLabDocumentAcknowledgements(wiV1Id, [employeeId, secondEmployeeId], supervisorId);
    eq(assignCount, 2, 'assign: two rows created');

    const rows = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE document_version_id = ?').all(wiV1Id);
    eq(rows.length, 2, 'assign: both rows present');
    ok(rows.every((r) => r.status === 'PENDING'), 'assign: all rows PENDING');
    ok(rows.every((r) => Boolean(r.assigned_at)), 'assign: assigned date stamped');
    ok(rows.every((r) => r.acknowledged_at === null), 'assign: acknowledged date null');

    const audit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT_VERSION' AND entity_id = ? AND action = 'CREATE'").get(wiV1Id);
    ok(audit, 'assign: CREATE audit row written');
    eq(Number(audit.actor_id), supervisorId, 'assign: audit actor');
    ok(String(audit.note).includes('document=WI-QC-002'), 'assign: audit note carries document code');
    ok(String(audit.note).includes('version=v1'), 'assign: audit note carries version');

    const n1 = db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE type = 'lab_document_acknowledgement'").get().n;
    eq(Number(n1), 2, 'assign: both employees notified');
    const nEmp = db.prepare("SELECT * FROM notifications WHERE type = 'lab_document_acknowledgement' AND user_id = ?").get(employeeId);
    ok(nEmp, 'assign: employee notified');
    ok(String(nEmp.title).includes('WI-QC-002 v1'), 'assign: notification title carries document version');
  }

  // ── Assign: duplicate skips / all-assigned throws ──
  console.log('■ Assign (guards)');
  {
    // Re-assigning a version to only already-assigned employees is rejected.
    let dupThrew = false;
    try {
      acks.assignLabDocumentAcknowledgements(wiV1Id, [employeeId], supervisorId);
    } catch (err) {
      dupThrew = /already assigned/i.test(err.message);
    }
    ok(dupThrew, 'assign: re-assigning an already-assigned employee throws');
    let threw = false;
    try {
      acks.assignLabDocumentAcknowledgements(wiV1Id, [employeeId, secondEmployeeId], supervisorId);
    } catch (err) {
      threw = /already assigned/i.test(err.message);
    }
    ok(threw, 'assign: all-selected-already-assigned throws');

    threw = false;
    try {
      acks.assignLabDocumentAcknowledgements(wiV1Id, [], supervisorId);
    } catch (err) {
      threw = /at least one employee/i.test(err.message);
    }
    ok(threw, 'assign: empty selection throws');

    threw = false;
    try {
      acks.assignLabDocumentAcknowledgements(999999, [employeeId], supervisorId);
    } catch (err) {
      threw = /version was not found/i.test(err.message);
    }
    ok(threw, 'assign: unknown version throws');

    // DRAFT versions are never assignable.
    threw = false;
    try {
      acks.assignLabDocumentAcknowledgements(draftVersionId, [employeeId], supervisorId);
    } catch (err) {
      threw = /approved versions/i.test(err.message);
    }
    ok(threw, 'assign: non-APPROVED version rejected');

    // Inactive users are rejected.
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(secondEmployeeId);
    threw = false;
    try {
      acks.assignLabDocumentAcknowledgements(sopV4Id, [secondEmployeeId], supervisorId);
    } catch (err) {
      threw = /not active users/i.test(err.message);
    }
    ok(threw, 'assign: inactive employee rejected');
    db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(secondEmployeeId);

    // duplicate ids in the selection are deduped → one fresh row on a new version.
    const dedupDoc = insertDoc({ code: 'SOP-QC-077', title: 'Dedupe Fixture', ownerId: managerId, version: null });
    const dedupV = db.prepare('INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status) VALUES (?, 1, ?, ?, ?, ?)').run(dedupDoc, '# v1', 'dedupe.', managerId, 'APPROVED');
    const dedupVersionId = Number(dedupV.lastInsertRowid);
    const dedup = acks.assignLabDocumentAcknowledgements(dedupVersionId, [employeeId, employeeId], supervisorId);
    eq(dedup, 1, 'assign: duplicate ids deduped → one row');
  }

  // ── Assign view ──
  console.log('■ Assign view');
  {
    const view = acks.getLabAcknowledgementAssignView(wiV1Id);
    ok(view !== null, 'view: version loads');
    eq(view.document.code, 'WI-QC-002', 'view: document identity');
    eq(view.version, 1, 'view: version number');
    ok(view.is_assignable, 'view: APPROVED version assignable');
    eq(view.existing.length, 2, 'view: existing rows listed');
    ok(!view.available_users.some((u) => u.id === employeeId || u.id === secondEmployeeId), 'view: assigned employees excluded from pool');
    ok(view.available_users.some((u) => u.id === supervisorId), 'view: unassigned active users available');

    const draftView = acks.getLabAcknowledgementAssignView(draftVersionId);
    ok(draftView !== null, 'view: draft version loads');
    eq(draftView.is_assignable, false, 'view: DRAFT version not assignable');

    eq(acks.getLabAcknowledgementAssignView(0), null, 'view: id 0 rejected');
    eq(acks.getLabAcknowledgementAssignView(999999), null, 'view: missing version → null');
  }

  // ── Acknowledge: happy path ──
  console.log('■ Acknowledge (happy path)');
  {
    const pendingId = db.prepare('SELECT id FROM lab_document_acknowledgements WHERE document_version_id = ? AND user_id = ?').get(wiV1Id, employeeId).id;
    acks.acknowledgeLabDocumentAcknowledgement(Number(pendingId), employeeId);

    const row = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE id = ?').get(pendingId);
    eq(row.status, 'ACKNOWLEDGED', 'acknowledge: status flips to ACKNOWLEDGED');
    ok(Boolean(row.acknowledged_at), 'acknowledge: acknowledged date stamped');

    const audit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT_VERSION' AND entity_id = ? AND action = 'ACKNOWLEDGE'").get(wiV1Id);
    ok(audit, 'acknowledge: ACKNOWLEDGE audit row written');
    eq(Number(audit.actor_id), employeeId, 'acknowledge: audit actor is the employee');
    ok(String(audit.note).includes('acknowledged_by=QC Employee'), 'acknowledge: audit note carries the employee name');

    // Document owner (supervisorId for WI-QC-002) is notified on completion.
    const ownerNote = db.prepare("SELECT * FROM notifications WHERE type = 'lab_document_acknowledged' AND user_id = ?").get(supervisorId);
    ok(ownerNote, 'acknowledge: document owner notified');
  }

  // ── Acknowledge: guards ──
  console.log('■ Acknowledge (guards)');
  {
    // Not your own row.
    let threw = false;
    try {
      acks.acknowledgeLabDocumentAcknowledgement(docAckV4Emp, supervisorId);
    } catch (err) {
      threw = /assigned to you/i.test(err.message);
    }
    ok(threw, 'acknowledge: another user\u2019s row rejected');

    // Already acknowledged.
    threw = false;
    try {
      acks.acknowledgeLabDocumentAcknowledgement(docAckV3Emp, employeeId);
    } catch (err) {
      threw = /already acknowledged/i.test(err.message);
    }
    ok(threw, 'acknowledge: already-acknowledged row rejected');

    // Unknown id.
    threw = false;
    try {
      acks.acknowledgeLabDocumentAcknowledgement(999999, employeeId);
    } catch (err) {
      threw = /not found/i.test(err.message);
    }
    ok(threw, 'acknowledge: unknown row rejected');

    threw = false;
    try {
      acks.acknowledgeLabDocumentAcknowledgement(0, employeeId);
    } catch (err) {
      threw = /invalid/i.test(err.message);
    }
    ok(threw, 'acknowledge: id 0 rejected');
  }

  // ── Version-specific acknowledgement ──
  console.log('■ Version-specific');
  {
    // employee already holds a PENDING row on SOP v4 (docAckV4Emp). Assigning
    // v3 again is impossible (already assigned), but the two rows exist
    // independently. Acknowledging v4 must leave v3 untouched and vice versa.
    eq(docAckV3Emp !== docAckV4Emp, true, 'version-specific: v3 and v4 are distinct rows');
    const v3Row = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE id = ?').get(docAckV3Emp);
    const v4Row = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE id = ?').get(docAckV4Emp);
    eq(v3Row.status, 'ACKNOWLEDGED', 'version-specific: v3 acknowledged');
    eq(v4Row.status, 'PENDING', 'version-specific: v4 still PENDING');

    acks.acknowledgeLabDocumentAcknowledgement(docAckV4Emp, employeeId);
    eq(db.prepare('SELECT status FROM lab_document_acknowledgements WHERE id = ?').get(docAckV4Emp).status, 'ACKNOWLEDGED', 'version-specific: v4 now acknowledged');
    eq(db.prepare('SELECT status FROM lab_document_acknowledgements WHERE id = ?').get(docAckV3Emp).status, 'ACKNOWLEDGED', 'version-specific: v3 unaffected by v4 acknowledge');
    eq(db.prepare('SELECT status FROM lab_document_acknowledgements WHERE id = ?').get(docAckV3Emp2).status, 'PENDING', 'version-specific: other employee\u2019s v3 row untouched');

    // A new version creates a NEW row — acknowledging v4 ≠ acknowledging v5.
    const v5 = db.prepare('INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      Number(db.prepare("SELECT id FROM lab_documents WHERE code='SOP-QC-001'").get().id),
      5,
      '# v5',
      'v5 release.',
      managerId,
      'APPROVED',
    );
    const v5Id = Number(v5.lastInsertRowid);
    const assigned5 = acks.assignLabDocumentAcknowledgements(v5Id, [employeeId], supervisorId);
    eq(assigned5, 1, 'version-specific: v5 gets its own fresh PENDING row');
    const v5Row = db.prepare('SELECT * FROM lab_document_acknowledgements WHERE document_version_id = ?').get(v5Id);
    eq(v5Row.status, 'PENDING', 'version-specific: v5 PENDING despite v4 being acknowledged');
  }

  // ── RBAC ──
  console.log('■ RBAC');
  {
    ok(perms.canAcknowledgeLabDocument('employee'), 'RBAC: employee acknowledges');
    ok(perms.canAcknowledgeLabDocument('supervisor'), 'RBAC: supervisor acknowledges');
    ok(perms.canAcknowledgeLabDocument('manager'), 'RBAC: manager acknowledges');
    ok(perms.canAcknowledgeLabDocument('admin'), 'RBAC: admin acknowledges');
    eq(perms.canAssignLabDocumentAcknowledgement('employee'), false, 'RBAC: employee cannot assign');
    eq(perms.canAssignLabDocumentAcknowledgement('supervisor'), true, 'RBAC: supervisor assigns');
    eq(perms.canAssignLabDocumentAcknowledgement('manager'), true, 'RBAC: manager assigns');
    eq(perms.canAssignLabDocumentAcknowledgement('admin'), true, 'RBAC: admin assigns');
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exitCode = failed > 0 ? 1 : 0;
