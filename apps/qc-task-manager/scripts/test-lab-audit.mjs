// Database-backed unit checks for the QC Laboratory Audit Timeline
// (src/lib/lab/auditTimeline.ts).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-lab-data-quality.mjs).
// The audit rows are inserted directly with SQL — the service modules that
// write them are already covered by their own suites; this suite verifies the
// READ layer only: who/what/when/before/after/reason rendering data, filters,
// pagination, hrefs, and the read-only guarantee (qc_audit_log is never
// mutated by the timeline).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-audit-'));
const dbPath = join(tempDir, 'lab-audit.db');

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

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
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
  const audit = await import('../src/lib/lab/auditTimeline.ts');

  const db = getDb();
  const employee = db.prepare("SELECT id, role FROM users WHERE username = 'employee'").get();
  const supervisor = db.prepare("SELECT id, role FROM users WHERE username = 'supervisor'").get();
  const manager = db.prepare("SELECT id, role FROM users WHERE username = 'manager'").get();

  // ── 1. Empty database ──
  console.log('\n■ Empty database');
  {
    const result = audit.searchLabAuditTimeline(audit.NO_LAB_AUDIT_FILTERS);
    eq(result.total, 0, 'empty: total 0');
    eq(result.rows.length, 0, 'empty: no rows');
    eq(result.total_pages, 1, 'empty: one page slot');
    eq(audit.listLabAuditActors().length, 0, 'empty: no actors');
    ok(!audit.hasLabAuditFilters(audit.NO_LAB_AUDIT_FILTERS), 'empty: default filters read as "no filters"');
  }

  // ── 2. Fixture ──
  // One test lifecycle mirroring the canonical example:
  //   created (Employee) → submitted (Employee) → review started (Reviewer,
  //   SUBMITTED→UNDER_REVIEW) → changes requested (Reviewer, reason) →
  //   resubmitted… approved (QC Manager, →APPROVED)
  // Plus one equipment CREATE and one legacy non-lab FINDING row that must
  // NEVER appear in the lab timeline.
  const insertProduct = db.prepare(
    "INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES ('Audit Product', 'AUD-P1', 'air', 1, ?)",
  );
  insertProduct.run(employee.id);
  const productId = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'AUD-P1'").get().id);

  const insertEquipment = db.prepare(
    "INSERT INTO lab_equipment (name, code, status_raw, is_archived, created_by) VALUES ('Audit Rig', 'AUD-EQ1', 'NEW', 0, ?)",
  );
  insertEquipment.run(employee.id);
  const equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'AUD-EQ1'").get().id);

  const insertTest = db.prepare(`INSERT INTO lab_test_records
    (test_type, test_number, status, final_result, product_id, lot_number, sampling_area, sample_count, created_by, created_at, updated_at)
    VALUES ('air', 'AUD-T1', 'APPROVED', 'PASS', ?, 'LOT-1', 'Line 1', 5, ?, '2026-08-14 09:41:00', '2026-08-14 14:02:00')`);
  insertTest.run(productId, employee.id);
  const testId = Number(db.prepare("SELECT id FROM lab_test_records WHERE test_number = 'AUD-T1'").get().id);

  const insertAudit = db.prepare(
    'INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)',
  );
  insertAudit.run('LAB_TEST', testId, employee.id, 'CREATE', null, null, 'test_type=air; status=DRAFT; samples=5', '2026-08-14 09:41:00');
  insertAudit.run('LAB_TEST', testId, employee.id, 'SUBMIT', null, null, 'test_number=AUD-T1; final_result=PASS', '2026-08-14 10:03:00');
  insertAudit.run('LAB_TEST', testId, supervisor.id, 'STATUS_TRANSITION', 'SUBMITTED', 'UNDER_REVIEW', null, '2026-08-14 11:20:00');
  insertAudit.run('LAB_TEST', testId, supervisor.id, 'REQUEST_CHANGES', 'UNDER_REVIEW', 'REJECTED', 'Sample 2 reading outside reference — recheck', '2026-08-14 11:41:00');
  insertAudit.run('LAB_TEST', testId, employee.id, 'SUBMIT', 'REJECTED', 'SUBMITTED', null, '2026-08-14 13:10:00');
  insertAudit.run('LAB_TEST', testId, manager.id, 'APPROVAL', 'SUBMITTED', 'APPROVED', 'All samples within reference', '2026-08-14 14:02:00');
  insertAudit.run('LAB_EQUIPMENT', equipmentId, employee.id, 'CREATE', null, null, 'equipment=AUD-EQ1', '2026-08-14 08:00:00');
  insertAudit.run('LAB_PRODUCT', productId, employee.id, 'CREATE', null, null, 'code=AUD-P1', '2026-08-14 07:00:00');
  // Legacy non-lab row — must never surface.
  insertAudit.run('FINDING', 1, employee.id, 'CREATE', null, null, 'legacy row', '2026-08-14 06:00:00');

  console.log('\n■ Fixture rendering (who / what / when / before / after / reason)');
  {
    const result = audit.searchLabAuditTimeline(audit.NO_LAB_AUDIT_FILTERS);
    eq(result.total, 8, 'fixture: exactly the 8 lab rows (legacy FINDING excluded)');
    eq(result.rows.length, 8, 'fixture: page carries all rows');

    // Newest first.
    eq(result.rows[0].created_at, '2026-08-14 14:02:00', 'order: newest first');

    const approval = result.rows[0];
    eq(approval.action, 'APPROVAL', 'approval: action');
    eq(approval.actor_name, db.prepare('SELECT full_name FROM users WHERE id = ?').get(manager.id).full_name, 'approval: actor name');
    eq(approval.actor_role, 'manager', 'approval: actor role');
    eq(audit.labAuditRoleLabel(approval.actor_role), 'QC Manager', 'approval: role label');
    eq(approval.old_value, 'SUBMITTED', 'approval: before value');
    eq(approval.new_value, 'APPROVED', 'approval: after value');
    eq(approval.note, 'All samples within reference', 'approval: reason');
    eq(approval.record_label, 'AUD-T1', 'approval: record label resolved');
    eq(approval.href, `/lab/tests/${testId}`, 'approval: href into the test detail');
    eq(
      audit.labAuditSentence(approval),
      'approved test AUD-T1',
      'approval: readable sentence',
    );

    const request = result.rows.find((r) => r.action === 'REQUEST_CHANGES');
    eq(request.old_value, 'UNDER_REVIEW', 'request-changes: before value');
    eq(request.new_value, 'REJECTED', 'request-changes: after value');
    eq(request.note, 'Sample 2 reading outside reference — recheck', 'request-changes: reason carried');
    eq(audit.labAuditRoleLabel(request.actor_role), 'Reviewer', 'request-changes: reviewer role label');

    const employeeCreate = result.rows.find((r) => r.action === 'CREATE' && r.entity_type === 'LAB_TEST');
    eq(audit.labAuditRoleLabel(employeeCreate.actor_role), 'Employee', 'create: employee role label');
    ok(employeeCreate.old_value === null && employeeCreate.new_value === null, 'create: no before/after values');

    const equipmentRow = result.rows.find((r) => r.entity_type === 'LAB_EQUIPMENT');
    eq(equipmentRow.record_label, 'AUD-EQ1', 'equipment: record label from code');
    eq(equipmentRow.href, `/lab/equipment/${equipmentId}`, 'equipment: href');

    const productRow = result.rows.find((r) => r.entity_type === 'LAB_PRODUCT');
    eq(productRow.record_label, 'Audit Product', 'product: record label from name');
    eq(productRow.href, `/lab/products/${productId}`, 'product: href');
  }

  console.log('\n■ Filters');
  {
    const byEntity = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, entity: 'LAB_EQUIPMENT' });
    eq(byEntity.total, 1, 'filter entity: equipment only');
    eq(byEntity.rows[0].entity_type, 'LAB_EQUIPMENT', 'filter entity: row type');

    const byAction = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, action: 'APPROVAL' });
    eq(byAction.total, 1, 'filter action: approval only');

    const byActor = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, actor: Number(employee.id) });
    eq(byActor.total, 5, 'filter actor: employee rows (2 test SUBMIT + CREATE + equipment + product)');

    const byQ = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, q: 'AUD-T1' });
    eq(byQ.total, 6, 'filter q: record label matches the whole test lifecycle (incl. note hit)');
    const byQPercent = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, q: '%' });
    eq(byQPercent.total, 0, 'filter q: % is escaped, no wildcard leak');
    const byQValues = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, q: 'UNDER_REVIEW' });
    eq(byQValues.total, 2, 'filter q: matches old/new values too');

    const byFrom = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, from: '2026-08-14 11:00:00'.slice(0, 10), to: '2026-08-14' });
    eq(byFrom.total, 8, 'filter dates: same-day range keeps all');
    const byTo = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, to: '2026-08-13' });
    eq(byTo.total, 0, 'filter dates: cutoff before fixture drops all');
  }

  console.log('\n■ Parsing & URL round-trip');
  {
    const sp = new URLSearchParams('q=APPROVED&entity=LAB_TEST&action=APPROVAL&actor=3&from=2026-08-01&to=2026-08-31&page=2&per=10');
    const f = audit.parseLabAuditFilters(sp);
    eq(f.q, 'APPROVED', 'parse: q');
    eq(f.entity, 'LAB_TEST', 'parse: entity');
    eq(f.action, 'APPROVAL', 'parse: action');
    eq(f.actor, 3, 'parse: actor');
    eq(f.from, '2026-08-01', 'parse: from');
    eq(f.to, '2026-08-31', 'parse: to');
    eq(f.page, 2, 'parse: page');
    eq(f.per, 10, 'parse: per');

    const bad = audit.parseLabAuditFilters(new URLSearchParams('entity=FINDING&action=HACK&page=-3&per=7&from=not-a-date'));
    eq(bad.entity, null, 'parse: invalid entity dropped (non-lab never selectable)');
    eq(bad.action, null, 'parse: invalid action dropped');
    eq(bad.page, 1, 'parse: negative page falls back to 1');
    eq(bad.per, 25, 'parse: per outside options falls back to default');
    eq(bad.from, null, 'parse: malformed date dropped');

    ok(audit.labAuditFiltersToQuery(f).includes('entity=LAB_TEST'), 'query: entity carried');
    ok(audit.labAuditFiltersToQuery(audit.NO_LAB_AUDIT_FILTERS) === '', 'query: default filters produce empty query');
    ok(audit.hasLabAuditFilters(f), 'query: filters detected');
  }

  console.log('\n■ Pagination');
  {
    const per1 = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, per: 10, page: 1 });
    const page3 = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, per: 3, page: 3 });
    eq(per1.per_page, 10, 'pagination: per respected');
    eq(page3.total_pages, 3, 'pagination: total pages');
    eq(page3.rows.length, 2, 'pagination: last page carries the remainder');
    const clamped = audit.searchLabAuditTimeline({ ...audit.NO_LAB_AUDIT_FILTERS, per: 3, page: 99 });
    eq(clamped.page, 3, 'pagination: page clamped to last');
  }

  console.log('\n■ Actor dropdown');
  {
    const actors = audit.listLabAuditActors();
    eq(actors.length, 3, 'actors: employee + supervisor + manager from lab rows only');
    ok(actors.every((a) => a.full_name), 'actors: names resolved');
  }

  console.log('\n■ Read-only guarantee');
  {
    const before = db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(id),0) AS ids FROM qc_audit_log').get();
    audit.searchLabAuditTimeline(audit.NO_LAB_AUDIT_FILTERS);
    audit.listLabAuditActors();
    const after = db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(id),0) AS ids FROM qc_audit_log').get();
    ok(before.n === after.n && before.ids === after.ids, 'read-only: audit log untouched by the timeline');
  }

  console.log(`\n${passed} passed / ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  ❌ ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Suite crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    /* temp cleanup is best-effort */
  }
}
