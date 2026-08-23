// Database-backed unit checks for the QC Laboratory Retest workflow
// (src/lib/lab/retests.ts + the approval completion hook in review.ts —
// /lab/retests, /lab/retests/[id], page reference §46–§47).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed is OFF (empty registry — no fabricated
// retests). Focus: creation preserves the original (id, reason, original
// result, original final state, new test id, relationship) WITHOUT touching
// the original row; sequential numbering -01/-02; eligibility (DRAFT /
// SUBMITTED originals refused); the retest execution record carries the
// controlled context but never measurements/results; completion on approval
// (OPEN → COMPLETED + LAB_RETEST/APPROVAL audit, same transaction); audit of
// every creation (LAB_RETEST/CREATE + LAB_TEST/LINK); register search /
// filters / sorting / pagination; the detail view; the Zod schema; and the
// supervisor+ permission (D-5).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-retests-'));
const dbPath = join(tempDir, 'lab-retests.db');

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

function fd(overrides = {}) {
  const f = new FormData();
  f.set('reason', 'FAIL');
  f.set('reason_note', 'Sample 3 out of tolerance.');
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) f.delete(k);
    else f.set(k, String(v));
  }
  return f;
}

let db;
let supervisorId;
let managerId;
let employeeId;
let productId;

function insertTestRow(overrides = {}) {
  const cols = {
    test_number: `LAB-TEST-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    test_type: 'air',
    product_id: productId,
    equipment_id: null,
    lot_number: 'LOT-2026-08',
    sampling_area: 'Area 2',
    medium_used: 'Air',
    connector_type: 'Locking connector with fixed threads',
    sample_count: 5,
    final_result: 'FAIL',
    status: 'APPROVED',
    tested_by: employeeId,
    created_by: employeeId,
    approved_by: managerId,
    approved_at: '2026-08-10 09:00:00',
    ...overrides,
  };
  const keys = Object.keys(cols);
  const info = db
    .prepare(`INSERT INTO lab_test_records (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
    .run(...keys.map((k) => cols[k]));
  const id = Number(info.lastInsertRowid);
  const number = `LAB-TEST-${String(id).padStart(5, '0')}`;
  db.prepare('UPDATE lab_test_records SET test_number = ? WHERE id = ?').run(number, id);
  return { id, number };
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // Seed OFF — the retest register itself must start empty (no fabricated data).
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '0' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const retests = await import('../src/lib/lab/retests.ts');
  const review = await import('../src/lib/lab/review.ts');
  const validation = await import('../src/lib/validation.ts');
  const perms = await import('../src/lib/permissions.ts');

  db = getDb();
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  productId = Number(
    db
      .prepare("INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES ('Catheter 24G', 'PRD-24G', 'air', 1, ?)")
      .run(managerId).lastInsertRowid,
  );
  // A second employee who owns none of the fixture tests — for RBAC scope checks.
  const outsiderId = Number(
    db
      .prepare("INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active) VALUES ('outsider_emp', 'unused', 'Outsider Employee', 'employee', 'QC', 0, 1)")
      .run().lastInsertRowid,
  );

  console.log('\n→ Retest schema (migration 019)');
  {
    const cols = db.prepare('PRAGMA table_info(lab_test_retests)').all().map((c) => c.name);
    ok(cols.includes('original_result'), 'lab_test_retests has original_result column');
    ok(cols.includes('original_status'), 'lab_test_retests has original_status column');
    const version = db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get().v;
    ok(version >= 19, 'schema version includes migration 019');
  }

  console.log('\n→ Permissions (D-5: supervisor+ create, all view)');
  {
    ok(perms.canCreateLabRetest('supervisor'), 'supervisor can create retests');
    ok(perms.canCreateLabRetest('manager'), 'manager can create retests');
    ok(perms.canCreateLabRetest('admin'), 'admin can create retests');
    ok(!perms.canCreateLabRetest('employee'), 'employee cannot create retests');
    ok(perms.canViewLabRetests('employee'), 'every role can view the retest register');
  }

  console.log('\n→ Zod schema (labRetestSchema)');
  {
    const good = validation.parseFormData(validation.labRetestSchema, fd());
    ok(good.ok, 'valid payload parses');
    const bad = validation.parseFormData(validation.labRetestSchema, fd({ reason: 'NOT_A_REASON' }));
    ok(!bad.ok, 'invalid reason is rejected');
    const missing = validation.parseFormData(validation.labRetestSchema, fd({ reason: null }));
    ok(!missing.ok, 'missing reason is rejected');
    const unknown = fd();
    unknown.set('original_test_id', '999');
    ok(!validation.parseFormData(validation.labRetestSchema, unknown).ok, 'unknown keys rejected (mass-assignment guard)');
    const note = validation.parseFormData(validation.labRetestSchema, fd({ reason_note: 'x'.repeat(201) }));
    ok(!note.ok, 'reason note longer than 200 chars is rejected');
    const none = validation.parseFormData(validation.labRetestSchema, fd({ reason_note: null }));
    ok(none.ok && none.data.reason_note === null, 'empty note becomes null');
  }

  console.log('\n→ Retest creation preserves the original + never modifies it');
  let original1;
  let created1;
  {
    original1 = insertTestRow();
    const before = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(original1.id);
    created1 = retests.createLabRetest({ id: supervisorId }, original1.id, {
      reason: 'FAIL',
      reason_note: 'Sample 3 out of tolerance.',
    });
    eq(created1.retest_number, `LAB-RETEST-${String(original1.id).padStart(5, '0')}-01`, 'first retest number is -01');
    const after = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(original1.id);
    ok(JSON.stringify(before) === JSON.stringify(after), 'original test row is untouched by retest creation');

    const row = db.prepare('SELECT * FROM lab_test_retests WHERE id = ?').get(created1.retest_id);
    eq(Number(row.original_test_id), original1.id, 'original test id preserved');
    eq(row.reason, 'FAIL', 'reason preserved');
    eq(row.reason_note, 'Sample 3 out of tolerance.', 'reason note preserved');
    eq(row.original_result, 'FAIL', 'original result frozen');
    eq(row.original_status, 'APPROVED', 'original final state frozen');
    eq(row.status, 'OPEN', 'retest starts OPEN');
    eq(Number(row.new_test_id), created1.new_test_id, 'new test id preserved (relationship)');

    const nt = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(created1.new_test_id);
    eq(nt.status, 'DRAFT', 'new execution test starts DRAFT');
    eq(nt.final_result, null, 'measurements/result never copied');
    eq(nt.test_type, 'air', 'test type copied from original');
    eq(nt.lot_number, 'LOT-2026-08', 'lot copied (controlled context)');
    eq(nt.sampling_area, 'Area 2', 'sampling area copied');
    eq(nt.connector_type, 'Locking connector with fixed threads', 'connector type copied');
    eq(Number(nt.sample_count), 5, 'sample count copied');
    eq(Number(nt.created_by), supervisorId, 'new test created_by is the retest creator');

    const audit = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_RETEST' AND entity_id = ? ORDER BY id")
      .all(created1.retest_id);
    eq(audit.length, 1, 'exactly one LAB_RETEST audit row at creation');
    eq(audit[0].action, 'CREATE', 'creation audited as CREATE');
    ok(String(audit[0].note).includes(`original=${original1.number}`), 'audit note names the original test');
    ok(String(audit[0].note).includes('original_result=FAIL'), 'audit note records the original result');
    const link = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND action = 'LINK' AND entity_id = ?")
      .get(original1.id);
    ok(!!link, 'original test gets a LINK audit row for traceability');
  }

  console.log('\n→ Sequential numbering (-01, -02) per original');
  {
    const second = retests.createLabRetest({ id: supervisorId }, original1.id, {
      reason: 'HOLD',
      reason_note: null,
    });
    eq(second.retest_number, `LAB-RETEST-${String(original1.id).padStart(5, '0')}-02`, 'second retest number is -02');
    const concurrent = await Promise.all([
      Promise.resolve().then(() => retests.createLabRetest({ id: supervisorId }, original1.id, { reason: 'OTHER', reason_note: 'concurrent A' })),
      Promise.resolve().then(() => retests.createLabRetest({ id: supervisorId }, original1.id, { reason: 'OTHER', reason_note: 'concurrent B' })),
    ]);
    ok(JSON.stringify(concurrent.map((row) => row.retest_number).sort()) === JSON.stringify([
      `LAB-RETEST-${String(original1.id).padStart(5, '0')}-03`,
      `LAB-RETEST-${String(original1.id).padStart(5, '0')}-04`,
    ]), 'concurrent sequence allocation remains unique and ordered');
    const other = insertTestRow({ final_result: 'HOLD' });
    const otherRetest = retests.createLabRetest({ id: managerId }, other.id, { reason: 'HOLD', reason_note: null });
    ok(otherRetest.retest_number.endsWith('-01'), 'a different original restarts at -01');
  }

  console.log('\n→ Eligibility: only dispositioned originals');
  {
    const draft = insertTestRow({ status: 'DRAFT', final_result: null });
    let threw = false;
    try {
      retests.createLabRetest({ id: supervisorId }, draft.id, { reason: 'FAIL', reason_note: null });
    } catch {
      threw = true;
    }
    ok(threw, 'DRAFT original is refused');
    const submitted = insertTestRow({ status: 'SUBMITTED', final_result: null });
    threw = false;
    try {
      retests.createLabRetest({ id: supervisorId }, submitted.id, { reason: 'FAIL', reason_note: null });
    } catch {
      threw = true;
    }
    ok(threw, 'SUBMITTED original is refused');
    const rejected = insertTestRow({ status: 'REJECTED', final_result: null, rejected_reason: 'Incomplete samples' });
    const okRejected = retests.createLabRetest({ id: supervisorId }, rejected.id, { reason: 'PROCEDURAL_ISSUE', reason_note: null });
    ok(okRejected.retest_id > 0, 'REJECTED original is eligible');
    const voided = insertTestRow({ status: 'VOID', final_result: 'PASS', void_reason: 'Wrong product' });
    const okVoided = retests.createLabRetest({ id: supervisorId }, voided.id, { reason: 'OTHER', reason_note: 'Voided record — repeat' });
    ok(okVoided.retest_id > 0, 'VOID original is eligible');
    threw = false;
    try {
      retests.createLabRetest({ id: supervisorId }, 999999, { reason: 'FAIL', reason_note: null });
    } catch {
      threw = true;
    }
    ok(threw, 'missing original is refused');
  }

  console.log('\n→ Completion on approval (OPEN → COMPLETED + audit)');
  {
    db.prepare("UPDATE lab_test_records SET status = 'SUBMITTED' WHERE id = ?").run(created1.new_test_id);
    review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', created1.new_test_id, null);
    const row = db.prepare('SELECT * FROM lab_test_retests WHERE id = ?').get(created1.retest_id);
    eq(row.status, 'COMPLETED', 'retest completes when its new test is approved');
    const audit = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_RETEST' AND entity_id = ? ORDER BY id")
      .all(created1.retest_id);
    eq(audit.length, 2, 'creation + completion audit rows');
    eq(audit[1].action, 'APPROVAL', 'completion audited as APPROVAL');
    ok(String(audit[1].note).includes(created1.new_test_number), 'completion audit names the new test');
    // Approving again must be refused (immutable) and write nothing new.
    let threw = false;
    try {
      review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', created1.new_test_id, null);
    } catch {
      threw = true;
    }
    ok(threw, 'approving an already-approved test is refused');
    eq(
      db.prepare("SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type = 'LAB_RETEST' AND entity_id = ?").get(created1.retest_id).n,
      2,
      'no extra audit rows after the immutable refusal',
    );
  }

  console.log('\n→ Register: search / filters / sorting / pagination');
  {
    const managerScope = { role: 'manager', userId: managerId };
    const all = retests.searchLabRetests(retests.NO_LAB_RETEST_FILTERS, managerScope);
    eq(all.total, 7, 'all retests visible without filters');
    const byStatus = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, status: 'OPEN' }, managerScope);
    eq(byStatus.total, 6, 'status=OPEN filter');
    const byReason = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, reason: 'FAIL' }, managerScope);
    eq(byReason.total, 1, 'reason=FAIL filter');
    const byQ = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, q: original1.number }, managerScope);
    eq(byQ.total, 4, 'q matches the original test number');
    const byProduct = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, q: 'PRD-24G' }, managerScope);
    eq(byProduct.total, 7, 'q matches the product code');
    const likeEscape = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, q: '%' }, managerScope);
    eq(likeEscape.total, 0, 'LIKE wildcards are escaped literally');
    const paged = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, per_page: 2, page: 2 }, managerScope);
    eq(paged.rows.length, 2, 'pagination returns bounded rows');
    eq(paged.total_pages, 4, 'total_pages computed');
    const clamped = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, per_page: 2, page: 99 }, managerScope);
    eq(clamped.page, 4, 'page is clamped to the last page');
    const sorted = retests.searchLabRetests({ ...retests.NO_LAB_RETEST_FILTERS, sort: 'retest_number', dir: 'asc' }, managerScope);
    ok(sorted.rows[0].retest_number < sorted.rows[sorted.rows.length - 1].retest_number, 'sortable by retest_number');
    const url = new URL('https://qc.test/lab/retests?q=x&reason=FAIL&status=OPEN&sort=reason&dir=asc&page=2&per=50&status=Bogus&reason=Bogus');
    const parsed = retests.parseLabRetestSearchFilters(url);
    ok(parsed.q === 'x' && parsed.reason === 'FAIL' && parsed.status === 'OPEN', 'valid filter params parse');
    eq(parsed.sort, 'reason', 'sortable field parses');
    eq(parsed.dir, 'asc', 'dir parses');
    eq(parsed.per_page, 50, 'per parses');
    ok(retests.hasLabRetestFilters(parsed), 'hasLabRetestFilters true');
    ok(!retests.hasLabRetestFilters(retests.NO_LAB_RETEST_FILTERS), 'hasLabRetestFilters false on defaults');
    const invalid = retests.parseLabRetestSearchFilters(new URL('https://qc.test/lab/retests?sort=;DROP&dir=up&page=-1&per=7'));
    eq(invalid.sort, retests.DEFAULT_LAB_RETEST_SORT, 'invalid sort drops to default');
    eq(invalid.per_page, retests.DEFAULT_LAB_RETEST_PER_PAGE, 'invalid per drops to default');
    eq(invalid.page, 1, 'invalid page drops to 1');

    console.log('\n→ Register: RBAC scope (employees see only retests of own tests)');
    const employeeScope = { role: 'employee', userId: employeeId };
    const outsiderScope = { role: 'employee', userId: outsiderId };
    eq(retests.searchLabRetests(retests.NO_LAB_RETEST_FILTERS, employeeScope).total, 7,
      'employee owning every fixture test sees all retests');
    eq(retests.searchLabRetests(retests.NO_LAB_RETEST_FILTERS, outsiderScope).total, 0,
      'employee with no tests sees no retests');
    const otherTest = insertTestRow({ tested_by: outsiderId, created_by: outsiderId });
    const otherRetest = retests.createLabRetest({ id: supervisorId }, otherTest.id, { reason: 'FAIL', reason_note: null });
    eq(retests.searchLabRetests(retests.NO_LAB_RETEST_FILTERS, employeeScope).total, 7,
      'retest of another employee\'s test is hidden from this employee');
    eq(retests.getLabRetestDetail(otherRetest.retest_id, employeeScope), null,
      'detail of another employee\'s retest is hidden from this employee (404-equivalent)');
    eq(retests.getLabRetestDetail(otherRetest.retest_id, outsiderScope)?.retest.id, otherRetest.retest_id,
      'the owning employee can open their own retest detail');
    eq(retests.getLabRetestDetail(otherRetest.retest_id, managerScope)?.retest.id, otherRetest.retest_id,
      'manager can still open any retest detail');
  }

  console.log('\n→ Detail + audit trail');
  {
    const managerScope = { role: 'manager', userId: managerId };
    const detail = retests.getLabRetestDetail(created1.retest_id, managerScope);
    ok(!!detail, 'detail loads');
    eq(detail.retest.retest_number, created1.retest_number, 'detail carries the retest number');
    eq(detail.retest.original_result, 'FAIL', 'detail shows the frozen original result');
    eq(detail.retest.new_test_number, created1.new_test_number, 'detail joins the new test');
    eq(detail.original_type, 'AIR', 'detail carries the original type');
    eq(detail.audit.length, 2, 'detail audit trail has creation + completion');
    ok(retests.getLabRetestDetail(0, managerScope) === null, 'invalid id → null');
    ok(retests.getLabRetestDetail(999999, managerScope) === null, 'missing id → null');
  }

  console.log('\n→ Create context (form pre-flight)');
  {
    const ctx = retests.getLabRetestCreateContext(original1.id);
    ok(ctx.eligible, 'APPROVED original is eligible in the create context');
    eq(ctx.existing.length, 4, 'existing retests listed');
    const draft = insertTestRow({ status: 'DRAFT', final_result: null });
    ok(!retests.getLabRetestCreateContext(draft.id).eligible, 'DRAFT original not eligible in the create context');
    ok(retests.getLabRetestCreateContext(0).test === null, 'invalid id → empty context');
  }

  console.log(`\n${passed} passed, ${failed} failed${failed ? ':' : ''}`);
  for (const f of failures) console.log(`  ❌ ${f}`);
} catch (err) {
  failed += 1;
  console.error('\n💥 suite crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

if (failed > 0) process.exit(1);
