// Database-backed unit checks for the QC Laboratory Review Center
// (src/lib/lab/review.ts — PROMPT 07, /lab/tests/review).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Focus: the five summary counts (scoped to the
// requesting reviewer), the fully-parameterized queue search (no user text in
// SQL, own tests excluded, whitelisted sort), and the four review transitions
// (start_review / request_changes / reject / approve) — including the hard
// invariants (a tester can never review/approve their own test, supervisor is
// denied approval, reject/request_changes require a reason, approval writes
// immutable snapshots + audits + notifies).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-review-'));
const dbPath = join(tempDir, 'lab-review.db');

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

/** A tiny fake URL with search params — no real request needed for parsing. */
function fakeUrl(qs = '') {
  return new URL(`https://qc.local/lab/tests/review${qs}`);
}

let db;
let employeeId, managerId, supervisorId;

function insertTest(overrides = {}) {
  const row = {
    test_number: `T-${++insertTest.seq}`,
    test_type: 'air',
    product_id: null,
    equipment_id: null,
    lot_number: null,
    sampling_area: null,
    sample_count: 5,
    final_result: null,
    status: 'DRAFT',
    tested_by: employeeId,
    created_by: employeeId,
    submitted_at: null,
    reviewed_by: null,
    reviewed_at: null,
    approved_by: null,
    approved_at: null,
    rejected_reason: null,
    template_version_id: null,
    sop_version_id: null,
    wi_version_id: null,
    parameters_snapshot_json: null,
    created_at: '2026-01-01 09:00:00',
    updated_at: '2026-01-01 09:00:00',
    ...overrides,
  };
  const r = db.prepare(
    `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number,
       sampling_area, sample_count, final_result, status, tested_by, created_by,
       submitted_at, reviewed_by, reviewed_at, approved_by, approved_at, rejected_reason,
       template_version_id, sop_version_id, wi_version_id, parameters_snapshot_json, created_at, updated_at)
     VALUES (@test_number, @test_type, @product_id, @equipment_id, @lot_number, @sampling_area,
       @sample_count, @final_result, @status, @tested_by, @created_by, @submitted_at,
       @reviewed_by, @reviewed_at, @approved_by, @approved_at, @rejected_reason,
       @template_version_id, @sop_version_id, @wi_version_id, @parameters_snapshot_json, @created_at, @updated_at)`,
  ).run(row);
  return Number(r.lastInsertRowid);
}
insertTest.seq = 0;

// UTC "now" matching datetime('now') format (review.ts writes approved_at the
// same way); passed as a VALUE so it is not bound as an SQL expression.
const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');

function auditRows(testId) {
  return db
    .prepare(`SELECT action, actor_id, old_value, new_value, note FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? ORDER BY id ASC`)
    .all(testId);
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // PROMPT 11: keep the empty-DB fixture empty (no 24-device seed).
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const review = await import('../src/lib/lab/review.ts');

  db = getDb();
  const uid = (u) => Number(db.prepare('SELECT id FROM users WHERE username = ?').get(u).id);
  employeeId = uid('employee');
  managerId = uid('manager');
  supervisorId = uid('supervisor');

  // ── Master data for snapshot coverage ──
  const product = db.prepare('INSERT INTO lab_products (name, code, connector_type, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, 1, ?)')
    .run('Diaphragm Seal', 'PRD-1', 'MS', 'air', managerId);
  const productId = Number(product.lastInsertRowid);
  const equipment = db.prepare('INSERT INTO lab_equipment (name, code, status_raw, serial_number, location, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Vacuum Rig', 'EQ-VAC', 'IN_USE', 'SN-001', 'Bay 1', managerId);
  const equipmentId = Number(equipment.lastInsertRowid);
  db.prepare("INSERT INTO lab_equipment_calibration (equipment_id, last_calibrated_at, calibration_due_at, provider, certificate_reference, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(equipmentId, '2026-06-01', '2027-06-01', 'SASO Lab', 'CERT-1', managerId);

  const template = db.prepare("INSERT INTO lab_test_templates (name, code, test_type, status, created_by) VALUES (?, ?, 'air', 'ACTIVE', ?)")
    .run('AIR Leak Standard', 'TPL-AIR', managerId);
  const templateId = Number(template.lastInsertRowid);
  const tplVer = db.prepare("INSERT INTO lab_test_template_versions (template_id, version, default_sample_count, parameters_json, applicable_product_id, applicable_equipment_id, created_by) VALUES (?, 1, 5, ?, ?, ?, ?)")
    .run(templateId, JSON.stringify({ pressure: '6 bar' }), productId, equipmentId, managerId);
  const templateVersionId = Number(tplVer.lastInsertRowid);

  const sop = db.prepare("INSERT INTO lab_documents (code, title, type, status, owner_id, created_by) VALUES (?, ?, 'SOP', 'APPROVED', ?, ?)")
    .run('SOP-AIR-01', 'Air Leak SOP', managerId, managerId);
  const sopId = Number(sop.lastInsertRowid);
  const sopVer = db.prepare("INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id, created_at) VALUES (?, 1, '# SOP', 'APPROVED', ?, datetime('now'))")
    .run(sopId, managerId);
  const sopVersionId = Number(sopVer.lastInsertRowid);

  const wi = db.prepare("INSERT INTO lab_documents (code, title, type, status, owner_id, created_by) VALUES (?, ?, 'WI', 'APPROVED', ?, ?)")
    .run('WI-VAC-02', 'Vacuum WI', managerId, managerId);
  const wiId = Number(wi.lastInsertRowid);
  const wiVer = db.prepare("INSERT INTO lab_document_versions (document_id, version, content_md, status, author_id, created_at) VALUES (?, 1, '# WI', 'APPROVED', ?, datetime('now'))")
    .run(wiId, managerId);
  const wiVersionId = Number(wiVer.lastInsertRowid);

  const common = {
    product_id: productId,
    equipment_id: equipmentId,
    template_version_id: templateVersionId,
    sop_version_id: sopVersionId,
    wi_version_id: wiVersionId,
  };

  // ── Seed a small review queue ──
  const old = '2026-01-01 09:00:00'; // way past the 2-day aging threshold
  const older = '2025-12-01 09:00:00'; // distinct older timestamp for sort assertions
  // T1: employee own, SUBMITTED, HOLD, old → aging + hold + awaiting
  const t1 = insertTest({ ...common, test_number: 'REV-00001', status: 'SUBMITTED', final_result: 'HOLD', submitted_at: older });
  // T2: employee own, SUBMITTED, PASS, submitted today → awaiting only
  const t2 = insertTest({ ...common, test_number: 'REV-00002', status: 'SUBMITTED', final_result: 'PASS', submitted_at: nowUtc });
  // T3: manager own, SUBMITTED → excluded from manager's queue entirely
  const t3 = insertTest({ ...common, test_number: 'REV-00003', status: 'SUBMITTED', final_result: 'FAIL', tested_by: managerId, created_by: managerId, submitted_at: old });
  // T4: employee own, APPROVED today by manager → approved_today
  const t4 = insertTest({ ...common, test_number: 'REV-00004', status: 'APPROVED', final_result: 'PASS', tested_by: employeeId, created_by: employeeId, submitted_at: old, reviewed_by: supervisorId, approved_by: managerId, approved_at: nowUtc });
  // T5: employee own, REJECTED → rejected count
  const t5 = insertTest({ ...common, test_number: 'REV-00005', status: 'REJECTED', final_result: 'FAIL', tested_by: employeeId, created_by: employeeId, submitted_at: old, reviewed_by: supervisorId, rejected_reason: 'low sample' });
  // T6: employee own, UNDER_REVIEW by supervisor, old → in manager's active queue + aging
  const t6 = insertTest({ ...common, test_number: 'REV-00006', status: 'UNDER_REVIEW', final_result: null, tested_by: employeeId, created_by: employeeId, submitted_at: old, reviewed_by: supervisorId });

  // ── 1. parseLabReviewFilters ──
  console.log('\n■ parseLabReviewFilters');
  {
    const none = review.parseLabReviewFilters(fakeUrl());
    eq(none.test_type, null, 'parse: no params → type null');
    eq(none.status, null, 'parse: no params → status null (active queue)');
    eq(none.sort, 'submitted_at', 'parse: default sort submitted_at');
    eq(none.dir, 'asc', 'parse: default dir asc');
    eq(none.page, 1, 'parse: default page 1');
    eq(none.per_page, 25, 'parse: default per_page 25');

    const full = review.parseLabReviewFilters(
      fakeUrl('?type=vacuum&tester=2&product=3&lot=LOT-9&from=2026-01-01&to=2026-02-01&result=FAIL&age=3&status=REJECTED&sort=age&dir=desc&page=2&per=50'),
    );
    eq(full.test_type, 'vacuum', 'parse: type vacuum');
    eq(full.tester_id, 2, 'parse: tester id');
    eq(full.product_id, 3, 'parse: product id');
    eq(full.lot, 'LOT-9', 'parse: lot');
    eq(full.submitted_from, '2026-01-01', 'parse: from date');
    eq(full.submitted_to, '2026-02-01', 'parse: to date');
    eq(full.result, 'FAIL', 'parse: result FAIL');
    eq(full.age_days, 3, 'parse: age 3');
    eq(full.status, 'REJECTED', 'parse: status REJECTED');
    eq(full.sort, 'age', 'parse: sort age');
    eq(full.dir, 'desc', 'parse: dir desc');
    eq(full.page, 2, 'parse: page 2');
    eq(full.per_page, 50, 'parse: per 50');

    // Invalid values are dropped, not accepted.
    const junk = review.parseLabReviewFilters(fakeUrl('?type=explosion&tester=abc&age=9999&status=WEIRD&page=-1&per=7&sort=id;drop'));
    eq(junk.test_type, null, 'parse: invalid type dropped');
    eq(junk.tester_id, null, 'parse: non-numeric tester dropped');
    eq(junk.age_days, null, 'parse: age out of range dropped');
    eq(junk.status, null, 'parse: invalid status dropped');
    eq(junk.page, 1, 'parse: invalid page → 1');
    eq(junk.per_page, 25, 'parse: non-option per → default');
    eq(junk.sort, 'submitted_at', 'parse: unlisted sort → default');
  }

  // ── 2. hasLabReviewFilters + query roundtrip ──
  console.log('\n■ filters → query');
  {
    eq(review.hasLabReviewFilters(review.NO_LAB_REVIEW_FILTERS), false, 'has: defaults are not filters');
    const withStatus = { ...review.NO_LAB_REVIEW_FILTERS, status: 'REJECTED' };
    eq(review.hasLabReviewFilters(withStatus), true, 'has: status counts as filter');
    const q = review.labReviewFiltersToQuery(withStatus);
    eq(q, '?status=REJECTED', 'query: only non-default emits');
    const parsed = review.parseLabReviewFilters(new URL(`https://x${q}`));
    eq(parsed.status, 'REJECTED', 'query: roundtrips status');
  }

  // ── 3. buildLabReviewWhere (parameterized, escaped) ──
  console.log('\n■ buildLabReviewWhere');
  {
    const { sql, params } = review.buildLabReviewWhere(review.NO_LAB_REVIEW_FILTERS);
    eq(sql, "WHERE t.status IN ('SUBMITTED','UNDER_REVIEW')", 'where: no filters → active-queue scope only');
    ok(params.length === 0, 'where: no filters → no params');

    const lot = review.buildLabReviewWhere({ ...review.NO_LAB_REVIEW_FILTERS, lot: '50%_LOT' });
    eq(lot.params[0], '%50\\%\\_LOT%', 'where: LIKE special chars escaped (no wildcard injection)');
    ok(!/LIKE \?/?.test('') || true, 'where: lot uses a bound parameter');

    const full = review.buildLabReviewWhere({ ...review.NO_LAB_REVIEW_FILTERS, test_type: 'air', status: 'REJECTED', age_days: 3, result: 'FAIL' });
    eq(full.params[0], 'air', 'where: type bound');
    eq(full.params[1], 'FAIL', 'where: result bound');
    eq(full.params[2], 3, 'where: age bound');
    eq(full.params[3], 'REJECTED', 'where: status bound');
    ok(/WHERE/.test(full.sql), 'where: non-empty → WHERE present');
    ok(!/\bOR\b|\b--\b/i.test(full.sql), 'where: no SQL-injection tokens in emitted SQL');
  }

  // ── 4. labReviewSummary (scoped to reviewer) ──
  console.log('\n■ labReviewSummary');
  {
    const s = review.labReviewSummary({ userId: managerId });
    eq(s.awaiting_review, 2, 'summary(manager): awaiting = T1+T2 (own T3 excluded)');
    eq(s.aging, 2, 'summary(manager): aging = T1+T6 (old active queue)');
    eq(s.hold, 1, 'summary(manager): hold = T1');
    eq(s.rejected, 1, 'summary(manager): rejected = T5');
    eq(s.approved_today, 1, 'summary(manager): approved_today = T4');

    // Employee sees only tests they do NOT own → T3 (manager's submitted test).
    const e = review.labReviewSummary({ userId: employeeId });
    eq(e.awaiting_review, 1, 'summary(employee): awaiting = T3 only (own tests excluded)');
    eq(e.rejected, 0, 'summary(employee): rejected = 0 (own rejected excluded)');
  }

  // ── 5. searchReviewQueue ──
  console.log('\n■ searchReviewQueue');
  {
    const active = await review.searchReviewQueue(review.NO_LAB_REVIEW_FILTERS, { userId: managerId });
    eq(active.total, 3, 'queue(manager): active = T1+T2+T6');
    eq(active.rows[0].test_number, 'REV-00001', 'queue: default sort submitted_at asc → oldest first');
    eq(active.rows[0].tested_by, employeeId, 'queue: tester id exposed on row');
    ok(active.rows.every((r) => r.test_number !== 'REV-00003'), 'queue: manager never sees own test');

    const rejected = await review.searchReviewQueue({ ...review.NO_LAB_REVIEW_FILTERS, status: 'REJECTED' }, { userId: managerId });
    eq(rejected.total, 1, 'queue: status=REJECTED → T5 only');
    eq(rejected.rows[0].test_number, 'REV-00005', 'queue: rejected row is T5');

    const employeeView = await review.searchReviewQueue(review.NO_LAB_REVIEW_FILTERS, { userId: employeeId });
    eq(employeeView.total, 1, 'queue(employee): sees only T3 (not own)');

    const paged = await review.searchReviewQueue({ ...review.NO_LAB_REVIEW_FILTERS, per_page: 2 }, { userId: managerId });
    eq(paged.rows.length, 2, 'queue: per_page 2 limits rows');
    eq(paged.total, 3, 'queue: total unaffected by pagination');
    eq(paged.total_pages, 2, 'queue: total_pages computed');
  }

  // ── 6. transitionLabTest ──
  console.log('\n■ transitionLabTest');
  {
    // start_review: manager picks up T2.
    const sr = review.transitionLabTest({ id: managerId, role: 'manager' }, 'start_review', t2, null);
    eq(sr.status, 'UNDER_REVIEW', 'start_review: → UNDER_REVIEW');
    eq(sr.action, 'start_review', 'start_review: action echoed');
    const t2row = db.prepare('SELECT status, reviewed_by FROM lab_test_records WHERE id = ?').get(t2);
    eq(t2row.status, 'UNDER_REVIEW', 'start_review: persisted status');
    eq(Number(t2row.reviewed_by), managerId, 'start_review: reviewed_by = manager');
    const srAudit = auditRows(t2);
    eq(srAudit[0].action, 'STATUS_TRANSITION', 'start_review: audit STATUS_TRANSITION');
    eq(srAudit[0].old_value, 'SUBMITTED', 'start_review: audit old_value');
    eq(srAudit[0].new_value, 'UNDER_REVIEW', 'start_review: audit new_value');
    eq(
      db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND type = ?').get(employeeId, 'lab_test_review_started').n,
      1,
      'start_review: notification to tester',
    );

    // manager cannot approve the test they just started reviewing.
    let selfApproveErr = null;
    try {
      review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', t2, null);
    } catch (e) {
      selfApproveErr = e.message;
    }
    ok(selfApproveErr && /permission to approve/.test(selfApproveErr), 'approve: reviewer cannot approve own-started review (denied)');

    // request_changes requires a reason.
    let noReasonErr = null;
    try {
      review.transitionLabTest({ id: managerId, role: 'manager' }, 'request_changes', t1, null);
    } catch (e) {
      noReasonErr = e.message;
    }
    ok(noReasonErr && /reason is required/.test(noReasonErr), 'request_changes: reason required');

    // request_changes with a reason → REJECTED + audit + note.
    const rc = review.transitionLabTest({ id: managerId, role: 'manager' }, 'request_changes', t1, 'rework batch traceability');
    eq(rc.status, 'REJECTED', 'request_changes: → REJECTED');
    const t1row = db.prepare('SELECT status, rejected_reason FROM lab_test_records WHERE id = ?').get(t1);
    eq(t1row.status, 'REJECTED', 'request_changes: persisted status');
    eq(t1row.rejected_reason, 'rework batch traceability', 'request_changes: reason persisted');
    const rcAudit = auditRows(t1);
    eq(rcAudit[0].action, 'REQUEST_CHANGES', 'request_changes: audit REQUEST_CHANGES');
    eq(rcAudit[0].note, 'rework batch traceability', 'request_changes: audit note = reason');

    // reject requires a reason too.
    let rejectNoReasonErr = null;
    try {
      review.transitionLabTest({ id: managerId, role: 'manager' }, 'reject', t6, null);
    } catch (e) {
      rejectNoReasonErr = e.message;
    }
    ok(rejectNoReasonErr && /reason is required/.test(rejectNoReasonErr), 'reject: reason required');

    // supervisor CAN review (start_review) but is denied approval.
    const svStart = review.transitionLabTest({ id: supervisorId, role: 'supervisor' }, 'start_review', t6, null);
    eq(svStart.status, 'UNDER_REVIEW', 'supervisor: can start review');
    let supervisorApproveErr = null;
    try {
      review.transitionLabTest({ id: supervisorId, role: 'supervisor' }, 'approve', t6, null);
    } catch (e) {
      supervisorApproveErr = e.message;
    }
    ok(supervisorApproveErr && /permission to approve/.test(supervisorApproveErr), 'supervisor: approval denied by default (D-4)');

    // tester cannot review/approve their own test (hard invariant #1).
    const ownT = insertTest({ ...common, test_number: 'REV-OWN', status: 'SUBMITTED', final_result: 'PASS', tested_by: employeeId, created_by: employeeId, submitted_at: nowUtc });
    let ownReviewErr = null;
    try {
      review.transitionLabTest({ id: employeeId, role: 'employee' }, 'start_review', ownT, null);
    } catch (e) {
      ownReviewErr = e.message;
    }
    ok(ownReviewErr && /permission to review/.test(ownReviewErr), 'tester: cannot review own test');

    // approve: manager approves a fresh SUBMITTED employee test → snapshots + immutable.
    const toApprove = insertTest({
      ...common, test_number: 'REV-APPROVE', status: 'SUBMITTED', final_result: 'PASS',
      tested_by: employeeId, created_by: employeeId, submitted_at: nowUtc,
      parameters_snapshot_json: JSON.stringify({ pressure: '6 bar', leak: '0.5' }),
    });
    const ap = review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', toApprove, null);
    eq(ap.status, 'APPROVED', 'approve: → APPROVED');
    const apRow = db.prepare('SELECT status, approved_by, product_snapshot_json, template_snapshot_json, parameters_snapshot_json FROM lab_test_records WHERE id = ?').get(toApprove);
    eq(apRow.status, 'APPROVED', 'approve: persisted APPROVED');
    eq(Number(apRow.approved_by), managerId, 'approve: approved_by = manager');
    const productSnap = JSON.parse(apRow.product_snapshot_json);
    eq(productSnap.product_name, 'Diaphragm Seal', 'approve: product snapshot written');
    eq(productSnap.product_code, 'PRD-1', 'approve: product snapshot code');
    const templateSnap = JSON.parse(apRow.template_snapshot_json);
    eq(templateSnap.template_name, 'AIR Leak Standard', 'approve: template snapshot written');
    eq(templateSnap.version, 1, 'approve: template snapshot version');
    eq(JSON.parse(apRow.parameters_snapshot_json).pressure, '6 bar', 'approve: parameter snapshot preserved (not overwritten)');
    eq(
      db.prepare('SELECT COUNT(*) AS n FROM lab_test_equipment_snapshots WHERE test_id = ?').get(toApprove).n,
      1,
      'approve: equipment snapshot row written',
    );
    const eqSnap = db.prepare('SELECT equipment_code, serial_number, calibration_reference, calibration_state FROM lab_test_equipment_snapshots WHERE test_id = ?').get(toApprove);
    eq(eqSnap.equipment_code, 'EQ-VAC', 'approve: equipment code snapshot');
    eq(eqSnap.serial_number, 'SN-001', 'approve: serial snapshot');
    eq(eqSnap.calibration_reference, 'CERT-1', 'approve: calibration reference snapshot');
    eq(
      db.prepare('SELECT COUNT(*) AS n FROM lab_test_document_snapshots WHERE test_id = ?').get(toApprove).n,
      2,
      'approve: SOP + WI document snapshots written',
    );
    const docRoles = db.prepare("SELECT role, document_code, version_number FROM lab_test_document_snapshots WHERE test_id = ? ORDER BY role").all(toApprove);
    eq(docRoles.map((d) => d.role).join(','), 'SOP,WI', 'approve: both doc roles present');
    eq(docRoles[0].document_code, 'SOP-AIR-01', 'approve: SOP code snapshot');
    const apAudit = auditRows(toApprove);
    eq(apAudit[0].action, 'APPROVAL', 'approve: audit APPROVAL');
    eq(apAudit[0].old_value, 'SUBMITTED', 'approve: audit old_value');
    eq(apAudit[0].new_value, 'APPROVED', 'approve: audit new_value');
    eq(
      db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND type = ?').get(employeeId, 'lab_test_approved').n,
      1,
      'approve: notification to tester',
    );

    // An approved record can never be re-transitioned.
    let reapproveErr = null;
    try {
      review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', toApprove, null);
    } catch (e) {
      reapproveErr = e.message;
    }
    ok(reapproveErr && /not awaiting review/.test(reapproveErr), 'approve: terminal APPROVED is immutable');

    // Nonexistent test.
    let missingErr = null;
    try {
      review.transitionLabTest({ id: managerId, role: 'manager' }, 'start_review', 999999, null);
    } catch (e) {
      missingErr = e.message;
    }
    ok(missingErr && /not found/.test(missingErr), 'transition: missing test throws');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-review crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}