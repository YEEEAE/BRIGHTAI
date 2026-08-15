// Database-backed unit checks for the QC Laboratory SOP/WI document library
// (src/lib/lab/documents.ts — /lab/documents, page reference §39).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed is ON (QC_SEED_LAB_EQUIPMENT=1) so the
// canonical 24-device registry loads — documents/products themselves are NEVER
// seeded (they start empty, no fabricated records). Focus: the five stored
// statuses (DRAFT / IN_REVIEW / APPROVED / SUPERSEDED / ARCHIVED), the current
// version resolution via current_version_id, the filters (q / type / status /
// owner / equipment / product / review=due), whitelisted sorting, server-side
// pagination, the dropdown helpers, and the supervisor+ create permission.
//
// Since PROMPT 41 the editor is also covered: the sanitized content renderer,
// create (v1 DRAFT), duplicate-code conflict, in-place update of DRAFT/IN_REVIEW
// versions, the approved→new-draft versioning contract (change summary required,
// approved v1 immutable, VERSION audit), SUPERSEDED/ARCHIVED immutability, and
// the record-level edit permission.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-documents-'));
const dbPath = join(tempDir, 'lab-documents.db');

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

function isoDay(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let db;
let managerId;
let supervisorId;
let employeeId;

/** Insert a document + an optional numbered version; returns the document id. */
function insertDoc({ code, title, type = 'SOP', status = 'DRAFT', ownerId, reviewerId = null, approverId = null, productId = null, effectiveDate = null, reviewDue = null, version = null, versionStatus = 'DRAFT', updatedAt = null }) {
  const result = db
    .prepare(
      `INSERT INTO lab_documents (code, title, type, owner_id, reviewer_id, approver_id, product_id, status, effective_date, review_due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(code, title, type, ownerId, reviewerId, approverId, productId, status, effectiveDate, reviewDue, managerId);
  const docId = Number(result.lastInsertRowid);
  if (version !== null) {
    const v = db
      .prepare(
        `INSERT INTO lab_document_versions (document_id, version, content_md, change_summary, author_id, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(docId, version, '# content', 'Initial version.', ownerId, versionStatus);
    const versionId = Number(v.lastInsertRowid);
    db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, docId);
  }
  if (updatedAt !== null) {
    db.prepare('UPDATE lab_documents SET updated_at = ? WHERE id = ?').run(updatedAt, docId);
  }
  return docId;
}

/** Insert a typed link between a document and equipment/product/template. */
function insertLink(docId, entityType, entityId, actorId) {
  db.prepare(
    'INSERT INTO lab_document_links (document_id, entity_type, entity_id, created_by) VALUES (?, ?, ?, ?)',
  ).run(docId, entityType, entityId, actorId);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // Seed ON for this suite — the canonical 24-device registry must load.
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
  const docs = await import('../src/lib/lab/documents.ts');
  const perms = await import('../src/lib/permissions.ts');

  db = getDb();
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);

  // ── Policy constants ──
  console.log('■ Policy');
  {
    eq(docs.LAB_DOCUMENT_TYPES.length, 2, 'policy: two document types');
    ok(docs.LAB_DOCUMENT_TYPES.includes('SOP'), 'policy: SOP');
    ok(docs.LAB_DOCUMENT_TYPES.includes('WI'), 'policy: WI');
    eq(docs.LAB_DOCUMENT_STATUSES.length, 5, 'policy: five stored statuses');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('DRAFT'), 'policy: DRAFT');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('IN_REVIEW'), 'policy: IN_REVIEW');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('APPROVED'), 'policy: APPROVED');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('SUPERSEDED'), 'policy: SUPERSEDED');
    ok(docs.LAB_DOCUMENT_STATUSES.includes('ARCHIVED'), 'policy: ARCHIVED');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.DRAFT, 'Draft', 'policy: DRAFT label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.IN_REVIEW, 'In Review', 'policy: IN_REVIEW label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.APPROVED, 'Approved', 'policy: APPROVED label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.SUPERSEDED, 'Superseded', 'policy: SUPERSEDED label');
    eq(docs.LAB_DOCUMENT_STATUS_LABELS.ARCHIVED, 'Archived', 'policy: ARCHIVED label');
  }

  // ── Register starts empty (no fabricated documents) ──
  console.log('■ Empty register');
  {
    eq(docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).total, 0, 'register: starts empty');
    eq(docs.listLabDocumentOwners().length, 0, 'dropdown: no owners yet');
  }

  // ── Fixtures ──
  console.log('■ Fixtures');
  let productId;
  let equipmentId;
  let sopApprovedId;
  let wiDraftId;
  {
    const p = db
      .prepare('INSERT INTO lab_products (name, code, is_active, created_by) VALUES (?, ?, 1, ?)')
      .run('Fixture Connector', 'FIX-CONN', managerId);
    productId = Number(p.lastInsertRowid);

    equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'NOC-05'").get().id);

    // Approved SOP v3, effective long ago, review due yesterday → review=due.
    sopApprovedId = insertDoc({
      code: 'SOP-QC-001',
      title: 'Subatmospheric Air Testing Procedure',
      type: 'SOP',
      status: 'APPROVED',
      ownerId: managerId,
      reviewerId: supervisorId,
      approverId: managerId,
      productId,
      effectiveDate: isoDay(-30),
      reviewDue: isoDay(-1),
      version: 3,
      versionStatus: 'APPROVED',
      updatedAt: '2026-01-05 10:00:00',
    });
    // Same document's product/equipment link via the typed links table.
    insertLink(sopApprovedId, 'PRODUCT', productId, managerId);
    insertLink(sopApprovedId, 'EQUIPMENT', equipmentId, managerId);

    // WI draft with a version, no dates yet.
    wiDraftId = insertDoc({
      code: 'WI-QC-002',
      title: 'Vacuum Leak Tester Setup',
      type: 'WI',
      status: 'DRAFT',
      ownerId: supervisorId,
      version: 1,
      versionStatus: 'DRAFT',
      updatedAt: '2026-01-04 10:00:00',
    });

    // IN_REVIEW SOP owned by employee, effective date null.
    insertDoc({
      code: 'SOP-QC-003',
      title: 'Sample Handling Checklist',
      type: 'SOP',
      status: 'IN_REVIEW',
      ownerId: employeeId,
      reviewerId: supervisorId,
      effectiveDate: null,
      reviewDue: null,
      version: 1,
      versionStatus: 'IN_REVIEW',
      updatedAt: '2026-01-03 10:00:00',
    });

    // ARCHIVED document with review date in the past — must NOT match review=due.
    insertDoc({
      code: 'WI-QC-OLD',
      title: 'Retired Packaging Inspection',
      type: 'WI',
      status: 'ARCHIVED',
      ownerId: managerId,
      effectiveDate: isoDay(-200),
      reviewDue: isoDay(-50),
      version: 2,
      versionStatus: 'ARCHIVED',
      updatedAt: '2026-01-02 10:00:00',
    });

    // SUPERSEDED document with a review date — must NOT match review=due either.
    insertDoc({
      code: 'SOP-QC-000',
      title: 'Legacy Air Test',
      type: 'SOP',
      status: 'SUPERSEDED',
      ownerId: supervisorId,
      reviewDue: isoDay(-5),
      version: 1,
      versionStatus: 'SUPERSEDED',
      updatedAt: '2026-01-01 10:00:00',
    });

    eq(docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).total, 5, 'fixtures: five documents');
  }

  // ── List: version, owner, type resolution ──
  console.log('■ List');
  {
    const rows = docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).rows;
    eq(rows.length, 5, 'list: all five rows');
    eq(rows[0].code, 'SOP-QC-001', 'list: default sort updated_at desc, newest first');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.version === 3), 'list: current version resolved via current_version_id');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.product_name === 'Fixture Connector'), 'list: product name joined');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.owner_name === 'Department Manager'), 'list: owner name joined');
    ok(rows.some((r) => r.code === 'SOP-QC-001' && r.status === 'APPROVED'), 'list: stored status');

    // Sort by code asc
    const byCode = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, sort: 'code', dir: 'asc' }).rows;
    eq(byCode[0].code, 'SOP-QC-000', 'sort: code asc (legacy first)');
    eq(byCode[byCode.length - 1].code, 'WI-QC-OLD', 'sort: code asc (WI-QC-OLD last)');

    // Sort by version desc
    const byVersion = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, sort: 'version', dir: 'desc' }).rows;
    eq(byVersion[0].version, 3, 'sort: version desc → v3 first');
    ok(byVersion[0].code === 'SOP-QC-001', 'sort: version desc row correct');

    // Pagination: per_page 2 → 3 pages
    const paged = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, per_page: 2 });
    eq(paged.total, 5, 'pagination: total 5');
    eq(paged.total_pages, 3, 'pagination: 3 pages');
    eq(paged.rows.length, 2, 'pagination: first page has 2');
    const page2 = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, per_page: 2, page: 2 });
    eq(page2.page, 2, 'pagination: page 2 kept');
    const page99 = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, per_page: 2, page: 99 });
    eq(page99.page, 3, 'pagination: page 99 clamps to last');
  }

  // ── Filters ──
  console.log('■ Filters');
  {
    const typeSop = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, type: 'SOP' });
    eq(typeSop.total, 3, 'filter: type SOP → 3');
    const typeWi = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, type: 'WI' });
    eq(typeWi.total, 2, 'filter: type WI → 2');

    const statusApproved = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, status: 'APPROVED' });
    eq(statusApproved.total, 1, 'filter: status APPROVED → 1');
    const statusDraft = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, status: 'DRAFT' });
    eq(statusDraft.total, 1, 'filter: status DRAFT → 1');

    const ownerManager = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, owner: managerId });
    eq(ownerManager.total, 2, 'filter: owner manager → 2 (SOP-QC-001 + WI-QC-OLD)');
    const ownerEmployee = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, owner: employeeId });
    eq(ownerEmployee.total, 1, 'filter: owner employee → 1');

    // review=due → active + review date reached (overview.ts KPI semantics).
    const reviewDue = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'due' });
    eq(reviewDue.total, 1, 'filter: review=due → only active reached date');
    eq(reviewDue.rows[0].code, 'SOP-QC-001', 'filter: review=due row correct (ARCHIVED/SUPERSEDED excluded)');
  }

  // ── Review state: derived windows (30 / 15 / 7 / today / overdue) ──
  console.log('■ Review state');
  {
    const today = isoDay(0);
    eq(docs.deriveDocumentReviewState(null, today), null, 'review state: no date → null');
    eq(docs.deriveDocumentReviewState(isoDay(-30), today), 'OVERDUE', 'review state: past → OVERDUE');
    eq(docs.deriveDocumentReviewState(isoDay(-1), today), 'OVERDUE', 'review state: yesterday → OVERDUE');
    eq(docs.deriveDocumentReviewState(isoDay(0), today), 'DUE_TODAY', 'review state: today → DUE_TODAY');
    eq(docs.deriveDocumentReviewState(isoDay(1), today), 'DUE_7', 'review state: +1 → DUE_7');
    eq(docs.deriveDocumentReviewState(isoDay(7), today), 'DUE_7', 'review state: +7 → DUE_7');
    eq(docs.deriveDocumentReviewState(isoDay(8), today), 'DUE_15', 'review state: +8 → DUE_15');
    eq(docs.deriveDocumentReviewState(isoDay(15), today), 'DUE_15', 'review state: +15 → DUE_15');
    eq(docs.deriveDocumentReviewState(isoDay(16), today), 'DUE_30', 'review state: +16 → DUE_30');
    eq(docs.deriveDocumentReviewState(isoDay(30), today), 'DUE_30', 'review state: +30 → DUE_30');
    eq(docs.deriveDocumentReviewState(isoDay(31), today), 'OK', 'review state: +31 → OK');
    eq(docs.deriveDocumentReviewState(isoDay(180), today), 'OK', 'review state: +180 → OK');
  }

  // ── Review windows: per-bucket filters + summary counts ──
  console.log('■ Review windows');
  {
    // Existing active fixture SOP-QC-001 is overdue (review -1). Add one doc per
    // remaining window — DRAFT WI owned by the supervisor so the earlier
    // combined-filter expectations (type SOP + status APPROVED + owner manager)
    // stay untouched.
    insertDoc({ code: 'WI-REV-TODAY', title: 'Review Due Today', type: 'WI', status: 'DRAFT', ownerId: supervisorId, reviewDue: isoDay(0), version: 1 });
    insertDoc({ code: 'WI-REV-7D', title: 'Review Due 7 Days', type: 'WI', status: 'DRAFT', ownerId: supervisorId, reviewDue: isoDay(5), version: 1 });
    insertDoc({ code: 'WI-REV-15D', title: 'Review Due 15 Days', type: 'WI', status: 'DRAFT', ownerId: supervisorId, reviewDue: isoDay(10), version: 1 });
    insertDoc({ code: 'WI-REV-30D', title: 'Review Due 30 Days', type: 'WI', status: 'DRAFT', ownerId: supervisorId, reviewDue: isoDay(25), version: 1 });

    const byOverdue = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'overdue' });
    eq(byOverdue.total, 1, 'review filter: overdue → SOP-QC-001 only');
    eq(byOverdue.rows[0].review_state, 'OVERDUE', 'review filter: overdue row exposes review_state');

    const byToday = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'today' });
    eq(byToday.total, 1, 'review filter: today → WI-REV-TODAY');
    eq(byToday.rows[0].review_state, 'DUE_TODAY', 'review filter: today row state');

    const by7 = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: '7' });
    eq(by7.total, 1, 'review filter: 7 days → WI-REV-7D');
    eq(by7.rows[0].review_state, 'DUE_7', 'review filter: 7-day row state');

    const by15 = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: '15' });
    eq(by15.total, 1, 'review filter: 15 days → WI-REV-15D');
    eq(by15.rows[0].review_state, 'DUE_15', 'review filter: 15-day row state');

    const by30 = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: '30' });
    eq(by30.total, 1, 'review filter: 30 days → WI-REV-30D');
    eq(by30.rows[0].review_state, 'DUE_30', 'review filter: 30-day row state');

    // review=due (KPI) = overdue + today after the new fixtures.
    const due = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'due' });
    eq(due.total, 2, 'review filter: due = overdue + today (KPI semantics)');

    // Archived/superseded never match any window.
    const archivedWindow = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'overdue', status: 'ARCHIVED' });
    eq(archivedWindow.total, 0, 'review filter: archived never matches a window');

    // Rows expose the derived state (and null without a date).
    const allRows = docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).rows;
    ok(allRows.some((r) => r.code === 'WI-REV-30D' && r.review_state === 'DUE_30'), 'review state: row exposes DUE_30');
    ok(allRows.some((r) => r.code === 'SOP-QC-001' && r.review_state === 'OVERDUE'), 'review state: row exposes OVERDUE');
    ok(allRows.some((r) => r.code === 'WI-QC-002' && r.review_state === null), 'review state: row without date → null');

    // Summary counts the five windows (active only — archives excluded).
    const summary = docs.getLabDocumentReviewSummary();
    eq(summary.overdue, 1, 'summary: overdue count');
    eq(summary.due_today, 1, 'summary: due today count');
    eq(summary.due_7, 1, 'summary: 7-day count');
    eq(summary.due_15, 1, 'summary: 15-day count');
    eq(summary.due_30, 1, 'summary: 30-day count');
  }

  // ── Review scheduling notifications (reuse createNotification — no cron) ──
  console.log('■ Review notifications');
  {
    // Near window (+10 days → DUE_15) → owner is notified.
    docs.createLabDocument(
      { type: 'WI', code: 'WI-REV-010', title: 'Review Due 10 Days', description: null, product_id: null, owner_id: employeeId, effective_date: null, review_due_date: isoDay(10), change_summary: 'Initial.', content: 'x', equipment_ids: [] },
      supervisorId,
    );
    const nearNote = db
      .prepare("SELECT * FROM notifications WHERE type = 'lab_document_review_due' AND user_id = ? AND title LIKE ?")
      .get(employeeId, '%WI-REV-010%');
    ok(nearNote, 'notification: near-window create notifies the owner');
    ok(String(nearNote.message).includes('due within 15 days'), 'notification: message carries the 15-day bucket');

    // Far-out date (+120 days → OK) → no notification.
    const farId = docs.createLabDocument(
      { type: 'WI', code: 'WI-REV-100', title: 'Review Far Out', description: null, product_id: null, owner_id: employeeId, effective_date: null, review_due_date: isoDay(120), change_summary: 'Initial.', content: 'x', equipment_ids: [] },
      supervisorId,
    );
    ok(
      !db.prepare("SELECT * FROM notifications WHERE type = 'lab_document_review_due' AND user_id = ? AND title LIKE ?").get(employeeId, '%WI-REV-100%'),
      'notification: far-out date (OK) → no notification',
    );

    // No review date → no notification.
    docs.createLabDocument(
      { type: 'WI', code: 'WI-REV-000', title: 'Review No Date', description: null, product_id: null, owner_id: employeeId, effective_date: null, review_due_date: null, change_summary: 'Initial.', content: 'x', equipment_ids: [] },
      supervisorId,
    );
    ok(
      !db.prepare("SELECT * FROM notifications WHERE type = 'lab_document_review_due' AND user_id = ? AND title LIKE ?").get(employeeId, '%WI-REV-000%'),
      'notification: no review date → no notification',
    );

    // Update into the overdue window (request-triggered re-evaluation) notifies.
    docs.updateLabDocument(
      farId,
      { type: 'WI', code: 'WI-REV-100', title: 'Review Far Out', description: null, product_id: null, owner_id: employeeId, effective_date: null, review_due_date: isoDay(-3), change_summary: 'Moved overdue.', content: 'x', equipment_ids: [] },
      supervisorId,
    );
    const overdueNote = db
      .prepare("SELECT * FROM notifications WHERE type = 'lab_document_review_due' AND user_id = ? AND title LIKE ?")
      .get(employeeId, '%overdue%');
    ok(overdueNote, 'notification: update into overdue window notifies the owner');
  }

  // ── Search (q) ──
  console.log('■ Search');
  {
    const byTitle = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'Subatmospheric' });
    eq(byTitle.total, 1, 'search: title match');
    const byCode = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'SOP-QC-003' });
    eq(byCode.total, 1, 'search: code match');
    const byProduct = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'Fixture Connector' });
    eq(byProduct.total, 1, 'search: product name match');
    const byEquipmentCode = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'NOC-05' });
    eq(byEquipmentCode.total, 1, 'search: equipment code match');
    const none = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'zzz-no-such' });
    eq(none.total, 0, 'search: no match');

    // LIKE escaping: % must match literally.
    const percent = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: '%' });
    eq(percent.total, 0, 'search: % wildcard escaped (literal match)');
  }

  // ── Equipment / product filters via links ──
  console.log('■ Links');
  {
    const byEquipment = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, equipment: equipmentId });
    eq(byEquipment.total, 1, 'link filter: equipment NOC-05 → 1');
    eq(byEquipment.rows[0].code, 'SOP-QC-001', 'link filter: equipment row correct');
    const byProduct = docs.searchLabDocuments({ ...docs.NO_LAB_DOCUMENT_FILTERS, product: productId });
    eq(byProduct.total, 1, 'link filter: product → 1 (product_id or PRODUCT link)');

    const eqOptions = docs.listLabDocumentEquipmentOptions();
    ok(eqOptions.some((e) => e.id === equipmentId && e.code === 'NOC-05'), 'dropdown: equipment option present');
    const prodOptions = docs.listLabDocumentProductOptions();
    ok(prodOptions.some((p) => p.id === productId && p.code === 'FIX-CONN'), 'dropdown: product option present');
  }

  // ── Combined filters + has/filtersToQuery ──
  console.log('■ Combined');
  {
    const combined = docs.searchLabDocuments({
      ...docs.NO_LAB_DOCUMENT_FILTERS,
      type: 'SOP',
      status: 'APPROVED',
      owner: managerId,
      review: 'due',
    });
    eq(combined.total, 1, 'combined: type+status+owner+review → 1');

    ok(docs.hasLabDocumentFilters({ ...docs.NO_LAB_DOCUMENT_FILTERS, q: 'x' }), 'has: q active');
    ok(docs.hasLabDocumentFilters({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: 'due' }), 'has: review active');
    ok(docs.hasLabDocumentFilters({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: '30' }), 'has: review window active');
    ok(!docs.hasLabDocumentFilters(docs.NO_LAB_DOCUMENT_FILTERS), 'has: defaults inactive');

    const qs = docs.labDocumentFiltersToQuery({ ...docs.NO_LAB_DOCUMENT_FILTERS, type: 'SOP', review: 'due', sort: 'code', dir: 'asc' });
    ok(qs.includes('type=SOP'), 'query: type encoded');
    ok(qs.includes('review=due'), 'query: review encoded');
    ok(qs.includes('sort=code'), 'query: sort encoded');
    ok(qs.includes('dir=asc'), 'query: dir encoded');
    ok(docs.labDocumentFiltersToQuery({ ...docs.NO_LAB_DOCUMENT_FILTERS, review: '7' }).includes('review=7'), 'query: review window encoded');
    eq(docs.labDocumentFiltersToQuery(docs.NO_LAB_DOCUMENT_FILTERS), '', 'query: defaults → empty');
  }

  // ── Parse (invalid values drop silently) ──
  console.log('■ Parse');
  {
    const url = new URL('http://x/lab/documents?type=BAD&status=APPROVED&owner=7&equipment=abc&review=no&sort=hack&dir=sideways&page=3&per=17');
    const f = docs.parseLabDocumentSearchFilters(url);
    eq(f.type, null, 'parse: invalid type dropped');
    eq(f.status, 'APPROVED', 'parse: valid status kept');
    eq(f.owner, 7, 'parse: numeric owner kept');
    eq(f.equipment, null, 'parse: non-numeric equipment dropped');
    eq(f.review, null, 'parse: review != due dropped');
    eq(f.sort, 'updated_at', 'parse: invalid sort → default');
    eq(f.dir, 'desc', 'parse: invalid dir → default');
    eq(f.page, 3, 'parse: page kept');
    eq(f.per_page, 25, 'parse: invalid per_page → default');

    const url2 = new URL('http://x/lab/documents?type=WI&review=due&per=50&q=%20%20');
    const f2 = docs.parseLabDocumentSearchFilters(url2);
    eq(f2.type, 'WI', 'parse: WI type kept');
    eq(f2.review, 'due', 'parse: review=due kept');
    eq(f2.per_page, 50, 'parse: per=50 kept');
    eq(f2.q, null, 'parse: blank q dropped');

    eq(docs.parseLabDocumentSearchFilters(new URL('http://x/lab/documents?review=overdue')).review, 'overdue', 'parse: review=overdue kept');
    eq(docs.parseLabDocumentSearchFilters(new URL('http://x/lab/documents?review=today')).review, 'today', 'parse: review=today kept');
    eq(docs.parseLabDocumentSearchFilters(new URL('http://x/lab/documents?review=7')).review, '7', 'parse: review=7 kept');
    eq(docs.parseLabDocumentSearchFilters(new URL('http://x/lab/documents?review=15')).review, '15', 'parse: review=15 kept');
    eq(docs.parseLabDocumentSearchFilters(new URL('http://x/lab/documents?review=30')).review, '30', 'parse: review=30 kept');
    eq(docs.parseLabDocumentSearchFilters(new URL('http://x/lab/documents?review=bogus')).review, null, 'parse: review=bogus dropped');
  }

  // ── RBAC ──
  console.log('■ RBAC');
  {
    ok(perms.canViewLabDocuments('employee'), 'RBAC: every role views documents');
    ok(perms.canViewLabDocuments('supervisor'), 'RBAC: supervisor views documents');
    ok(perms.canViewLabDocuments('manager'), 'RBAC: manager views documents');
    eq(perms.canCreateLabDocument('employee'), false, 'RBAC: employee cannot create');
    ok(perms.canCreateLabDocument('supervisor'), 'RBAC: supervisor creates');
    ok(perms.canCreateLabDocument('manager'), 'RBAC: manager creates');
    ok(perms.canCreateLabDocument('admin'), 'RBAC: admin creates');
    eq(perms.canEditLabDocument('employee'), false, 'RBAC: employee cannot edit');
    ok(perms.canEditLabDocument('supervisor'), 'RBAC: supervisor edits');
    eq(perms.canApproveLabDocument('supervisor'), false, 'RBAC: supervisor cannot approve');
    ok(perms.canApproveLabDocument('manager'), 'RBAC: manager approves');
  }

  // ── Editor (PROMPT 41): renderer ──
  console.log('■ Renderer');
  const { renderDocumentContent, isSafeLinkUrl } = await import('../src/lib/lab/documentContent.ts');
  {
    const md = `# Step 1 — Setup\n\n1. Switch on the unit.\n2. Press START.\n\n- Bullet A\n- Bullet B\n\n| Column A | Column B |\n| --- | --- |\n| x | y |\n\n> [!WARNING]\n> Keep hands clear.\n\n> [!NOTE]\n> Tester must be certified.\n\n- [x] Done item\n- [ ] Pending item\n\nSee [manual](https://example.com/manual).\n\n<script>alert(1)</script>`;
    const html = renderDocumentContent(md);
    ok(html.includes('<h2>'), 'renderer: heading h2');
    ok(html.includes('<ol>'), 'renderer: numbered steps');
    ok(html.includes('<ul>'), 'renderer: bullet list');
    ok(html.includes('<table>'), 'renderer: table');
    ok(html.includes('doc-callout-warning'), 'renderer: warning callout');
    ok(html.includes('doc-callout-note'), 'renderer: note callout');
    ok(html.includes('doc-checklist'), 'renderer: checklist');
    ok(html.includes('<a href="https://example.com/manual"'), 'renderer: safe link');
    ok(!html.includes('<script>'), 'renderer: script tags escaped, never emitted');
    ok(!html.includes('onerror'), 'renderer: no event handlers');
    ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'renderer: raw HTML shown as escaped text');

    const bare = renderDocumentContent('<img src=x onerror=alert(1)>');
    ok(!bare.includes('<img'), 'renderer: img never emitted');
    ok(bare.includes('&lt;img'), 'renderer: img escaped as text');

    ok(isSafeLinkUrl('https://example.com'), 'link: https allowed');
    ok(isSafeLinkUrl('/relative/path'), 'link: relative allowed');
    ok(isSafeLinkUrl('#anchor'), 'link: anchor allowed');
    ok(isSafeLinkUrl('mailto:lab@example.com'), 'link: mailto allowed');
    ok(!isSafeLinkUrl('javascript:alert(1)'), 'link: javascript: rejected');
    ok(!isSafeLinkUrl('data:text/html,<b>'), 'link: data: rejected');
  }

  // ── Editor: create ──
  console.log('■ Editor create');
  let createdId;
  {
    const formData = {
      type: 'SOP',
      code: 'SOP-QC-100',
      title: 'Editor Created Procedure',
      description: 'Created via the editor.',
      product_id: productId,
      owner_id: supervisorId,
      effective_date: isoDay(0),
      review_due_date: isoDay(180),
      change_summary: 'Initial version.',
      content: '# Title\n\nStep content here.',
      equipment_ids: [equipmentId],
    };
    createdId = docs.createLabDocument(formData, supervisorId);
    ok(Number.isInteger(createdId) && createdId > 0, 'create: returns document id');

    const editor = docs.getLabDocumentEditor(createdId);
    ok(editor, 'create: editor view loads');
    eq(editor.document.status, 'DRAFT', 'create: status DRAFT');
    eq(editor.version.version, 1, 'create: version 1');
    ok(editor.version.content_md.includes('Step content here'), 'create: content stored verbatim');
    ok(editor.version.content_html_sanitized.includes('<h2>'), 'create: sanitized html cache rendered');
    ok(editor.equipment_ids.includes(equipmentId), 'create: equipment link written');

    const audit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT' AND entity_id = ? AND action = 'CREATE'").get(createdId);
    ok(audit, 'create: CREATE audit row written');
    eq(Number(audit.actor_id), supervisorId, 'create: audit actor');

    const listRow = docs.searchLabDocuments(docs.NO_LAB_DOCUMENT_FILTERS).rows.find((r) => r.id === createdId);
    eq(listRow.version, 1, 'create: register shows v1');
    eq(listRow.created_by, supervisorId, 'create: register exposes created_by');
  }

  // ── Editor: duplicate code ──
  console.log('■ Editor duplicate code');
  {
    let threw = false;
    try {
      docs.createLabDocument(
        { type: 'SOP', code: 'SOP-QC-100', title: 'Duplicate', description: null, product_id: null, owner_id: null, effective_date: null, review_due_date: null, change_summary: null, content: 'x', equipment_ids: [] },
        supervisorId,
      );
    } catch (err) {
      threw = err instanceof docs.LabDocumentCodeConflictError;
    }
    ok(threw, 'duplicate: code conflict throws LabDocumentCodeConflictError');
  }

  // ── Editor: in-place update of DRAFT (same version, UPDATE audit) ──
  console.log('■ Editor update (in-place)');
  {
    const before = docs.getLabDocumentEditor(createdId);
    docs.updateLabDocument(
      createdId,
      {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'Editor Created Procedure (revised)',
        description: 'Updated in place.',
        product_id: productId,
        owner_id: managerId,
        effective_date: isoDay(1),
        review_due_date: isoDay(181),
        change_summary: null,
        content: '# Title\n\nRevised content.',
        equipment_ids: [],
      },
      supervisorId,
    );
    const after = docs.getLabDocumentEditor(createdId);
    eq(after.version.version, 1, 'update: DRAFT stays version 1');
    ok(after.version.content_md.includes('Revised content'), 'update: content replaced in place');
    eq(after.document.title, 'Editor Created Procedure (revised)', 'update: identity updated');
    eq(after.equipment_ids.length, 0, 'update: equipment links replaced (empty)');
    ok(before.version.content_html_sanitized !== after.version.content_html_sanitized, 'update: html cache refreshed');

    const audit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT' AND entity_id = ? AND action = 'UPDATE'").get(createdId);
    ok(audit, 'update: UPDATE audit row written');
  }

  // ── Editor: approved → new DRAFT version (immutability contract) ──
  console.log('■ Editor versioning (approved → new draft)');
  {
    // Manually approve the created document's current version.
    db.prepare("UPDATE lab_documents SET status = 'APPROVED' WHERE id = ?").run(createdId);
    db.prepare("UPDATE lab_document_versions SET status = 'APPROVED' WHERE document_id = ?").run(createdId);

    // Revising without a change summary must be rejected.
    let threw = false;
    try {
      docs.updateLabDocument(createdId, {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'Approved Doc Revise',
        description: null,
        product_id: null,
        owner_id: null,
        effective_date: null,
        review_due_date: null,
        change_summary: '',
        content: 'New approved content.',
        equipment_ids: [],
      }, supervisorId);
    } catch (err) {
      threw = /change summary is required/i.test(err.message);
    }
    ok(threw, 'versioning: change summary required when revising approved');

    const approvedVersionId = docs.getLabDocumentEditor(createdId).version.id;
    docs.updateLabDocument(createdId, {
      type: 'SOP',
      code: 'SOP-QC-100',
      title: 'Approved Doc Revise',
      description: null,
      product_id: null,
      owner_id: null,
      effective_date: null,
      review_due_date: null,
      change_summary: 'Revised per audit finding.',
      content: 'New approved content.',
      equipment_ids: [],
    }, supervisorId);

    const editor = docs.getLabDocumentEditor(createdId);
    eq(editor.document.status, 'DRAFT', 'versioning: document returns to DRAFT');
    eq(editor.version.version, 2, 'versioning: new version 2');
    ok(editor.version.content_md.includes('New approved content'), 'versioning: draft holds revised content');

    // The approved v1 must be untouched.
    const v1 = db.prepare('SELECT * FROM lab_document_versions WHERE id = ?').get(approvedVersionId);
    eq(Number(v1.version), 1, 'versioning: approved v1 version number immutable');
    eq(v1.status, 'APPROVED', 'versioning: approved v1 status immutable');
    ok(!String(v1.content_md).includes('New approved content'), 'versioning: approved v1 content immutable');

    const versionAudit = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_DOCUMENT' AND entity_id = ? AND action = 'VERSION'")
      .get(createdId);
    ok(versionAudit, 'versioning: VERSION audit row written');
  }

  // ── Editor: SUPERSEDED / ARCHIVED are not editable ──
  console.log('■ Editor immutability (superseded/archived)');
  {
    db.prepare("UPDATE lab_documents SET status = 'SUPERSEDED' WHERE id = ?").run(createdId);
    let threw = false;
    try {
      docs.updateLabDocument(createdId, {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'x',
        description: null,
        product_id: null,
        owner_id: null,
        effective_date: null,
        review_due_date: null,
        change_summary: 'x',
        content: 'x',
        equipment_ids: [],
      }, supervisorId);
    } catch (err) {
      threw = /cannot be edited/i.test(err.message);
    }
    ok(threw, 'immutability: SUPERSEDED cannot be edited');
    db.prepare("UPDATE lab_documents SET status = 'ARCHIVED' WHERE id = ?").run(createdId);
    threw = false;
    try {
      docs.updateLabDocument(createdId, {
        type: 'SOP',
        code: 'SOP-QC-100',
        title: 'x',
        description: null,
        product_id: null,
        owner_id: null,
        effective_date: null,
        review_due_date: null,
        change_summary: 'x',
        content: 'x',
        equipment_ids: [],
      }, supervisorId);
    } catch (err) {
      threw = /cannot be edited/i.test(err.message);
    }
    ok(threw, 'immutability: ARCHIVED cannot be edited');
  }

  // ── Editor: record-level permission ──
  console.log('■ Editor RBAC (record-level)');
  {
    // Re-create a fresh doc owned by the supervisor (created by supervisor too).
    const ownedId = docs.createLabDocument(
      { type: 'WI', code: 'WI-QC-300', title: 'Supervisor Owned', description: null, product_id: null, owner_id: supervisorId, effective_date: null, review_due_date: null, change_summary: 'Initial.', content: 'Body.', equipment_ids: [] },
      supervisorId,
    );
    const otherDoc = docs.getLabDocumentEditor(ownedId).document;
    ok(perms.canEditLabDocumentRecord({ id: supervisorId, role: 'supervisor' }, otherDoc), 'RBAC: supervisor edits own doc (DRAFT)');
    eq(perms.canEditLabDocumentRecord({ id: managerId, role: 'manager' }, otherDoc), true, 'RBAC: manager edits any doc');

    // Employee can never edit.
    eq(perms.canEditLabDocumentRecord({ id: employeeId, role: 'employee' }, otherDoc), false, 'RBAC: employee never edits docs');
  }

  // ── Version history (/lab/documents/[id]/versions) ──
  console.log('■ Version history');
  {
    const managerName = String(db.prepare("SELECT full_name FROM users WHERE username='manager'").get().full_name);
    const supervisorName = String(db.prepare("SELECT full_name FROM users WHERE username='supervisor'").get().full_name);

    // Build a document with three versions: v1 APPROVED (reviewed + approved
    // with timestamps), v2 SUPERSEDED (no review metadata), v3 APPROVED.
    const vh = db
      .prepare(
        `INSERT INTO lab_documents (code, title, type, owner_id, status, created_by)
         VALUES (?, ?, 'SOP', ?, 'APPROVED', ?)`,
      )
      .run('SOP-VH-001', 'Version History Fixture', managerId, managerId);
    const vhDocId = Number(vh.lastInsertRowid);
    const insertVersion = (version, status, opts = {}) => {
      const r = db
        .prepare(
          `INSERT INTO lab_document_versions
             (document_id, version, content_md, content_html_sanitized, change_summary, author_id,
              reviewed_by, reviewed_at, approved_by, approved_at, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          vhDocId,
          version,
          opts.content ?? `# v${version} content`,
          opts.html ?? null,
          opts.summary ?? `Change summary for v${version}.`,
          opts.authorId ?? managerId,
          opts.reviewedBy ?? null,
          opts.reviewedAt ?? null,
          opts.approvedBy ?? null,
          opts.approvedAt ?? null,
          status,
        );
      return Number(r.lastInsertRowid);
    };
    const v1Id = insertVersion(1, 'APPROVED', {
      content: '# v1 content',
      html: '<h2>v1 cached html</h2>',
      summary: 'Initial approved release.',
      reviewedBy: supervisorId,
      reviewedAt: '2026-01-10 09:00:00',
      approvedBy: managerId,
      approvedAt: '2026-01-12 09:00:00',
    });
    const v2Id = insertVersion(2, 'SUPERSEDED', {
      content: '# v2 content',
      summary: 'Superseded by v3.',
      authorId: supervisorId,
    });
    const v3Id = insertVersion(3, 'APPROVED', {
      content: '# v3 content',
      html: '<h2>v3 cached html</h2>',
      summary: 'Approved after review.',
      reviewedBy: supervisorId,
      reviewedAt: '2026-01-18 09:00:00',
      approvedBy: managerId,
      approvedAt: '2026-01-20 09:00:00',
    });
    db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(v3Id, vhDocId);

    const view = docs.getLabDocumentVersions(vhDocId);
    ok(view !== null, 'versions: document loads');
    eq(view.document.code, 'SOP-VH-001', 'versions: document identity joined');
    eq(view.versions.length, 3, 'versions: three rows');

    eq(view.versions[0].id, v3Id, 'versions: ordered version DESC (v3 first)');
    eq(view.versions[1].id, v2Id, 'versions: v2 second');
    eq(view.versions[2].id, v1Id, 'versions: v1 last');

    const v3 = view.versions[0];
    eq(v3.status, 'APPROVED', 'versions: status exposed');
    eq(v3.author_name, managerName, 'versions: author name joined');
    eq(v3.reviewer_name, supervisorName, 'versions: reviewer name joined');
    eq(v3.approver_name, managerName, 'versions: approver name joined');
    eq(String(v3.approved_at).slice(0, 10), '2026-01-20', 'versions: approval date exposed');
    ok(Boolean(v3.created_at), 'versions: created date exposed');
    eq(v3.change_summary, 'Approved after review.', 'versions: change summary exposed');

    const v2 = view.versions[1];
    eq(v2.author_name, supervisorName, 'versions: v2 author is the supervisor');
    eq(v2.reviewer_name, null, 'versions: unreviewed version → reviewer null');
    eq(v2.approver_name, null, 'versions: unreviewed version → approver null');
    eq(v2.approved_at, null, 'versions: unreviewed version → approval date null');

    eq(docs.getLabDocumentVersions(0), null, 'versions: id 0 rejected');
    eq(docs.getLabDocumentVersions(-3), null, 'versions: negative id rejected');
    eq(docs.getLabDocumentVersions(999999), null, 'versions: missing doc → null');

    const v3Content = docs.getLabDocumentVersionContent(vhDocId, v3Id);
    ok(v3Content !== null, 'versions: content loads for cached version');
    eq(v3Content.version.id, v3Id, 'versions: content version identity');
    eq(v3Content.html, '<h2>v3 cached html</h2>', 'versions: sanitized cache preferred');

    const v2Content = docs.getLabDocumentVersionContent(vhDocId, v2Id);
    ok(v2Content !== null, 'versions: content loads for uncached version');
    ok(v2Content.html.includes('<h2>v2 content</h2>'), 'versions: markdown fallback renders sanitized html');

    eq(docs.getLabDocumentVersionContent(vhDocId, 999999), null, 'versions: foreign version id rejected');
    eq(docs.getLabDocumentVersionContent(vhDocId, 0), null, 'versions: version id 0 rejected');
    const otherId = docs.createLabDocument(
      { type: 'WI', code: 'WI-VH-500', title: 'Other', description: null, product_id: null, owner_id: null, effective_date: null, review_due_date: null, change_summary: 'Initial.', content: 'x', equipment_ids: [] },
      managerId,
    );
    eq(docs.getLabDocumentVersionContent(otherId, v1Id), null, 'versions: cross-document access rejected');
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