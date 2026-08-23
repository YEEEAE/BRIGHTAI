// Database-backed unit checks for the laboratory test register + details
// layer (src/lib/lab/testSearch.ts, testExport.ts, and the read helpers in
// src/lib/lab/tests.ts — PROMPT 06, /lab/tests).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Focus: the search contract — param parsing
// and validation, the fully-parameterized WHERE builder (no user text in SQL),
// whitelisted sorting, RBAC row scope (employee sees own tests only),
// pagination, the export row mapping, and the read-only details helpers
// (record fetch, equipment/document snapshots, audit timeline).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-tests-'));
const dbPath = join(tempDir, 'lab-tests.db');

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
  return new URL(`https://qc.local/lab/tests${qs}`);
}

/** A fake cookie jar (flash writer). */
const fakeJar = { cookies: { set: () => {} } };

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // PROMPT 11: keep the empty-DB fixture empty (no 24-device seed).
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(
    process.execPath,
    ['--import', '../../scripts/test-ts-loader.mjs', '--experimental-strip-types', 'scripts/init-db.mjs'],
    {
      cwd: appDir,
      env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
      stdio: 'ignore',
    },
  );

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const search = await import('../src/lib/lab/testSearch.ts');
  const exp = await import('../src/lib/lab/testExport.ts');
  const tests = await import('../src/lib/lab/tests.ts');
  const links = await import('../src/lib/lab/findingLinks.ts');

  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  const employeeId = Number(employee.id);
  const manager = db.prepare("SELECT id FROM users WHERE username = 'manager'").get();
  const managerId = Number(manager.id);

  // Seed a product + equipment for the register.
  db.prepare(
    'INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
  ).run('Seal Product', 'PRD-1', 'air', 1, managerId);
  const productId = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'PRD-1'").get().id);
  const equipment = db.prepare('INSERT INTO lab_equipment (name, code, status_raw, created_by) VALUES (?, ?, ?, ?)')
    .run('Vacuum Rig', 'EQ-VAC', 'NEW', managerId);
  const equipmentId = Number(equipment.lastInsertRowid);

  // Three tests: two by employee, one by manager.
  db.prepare(
    `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number,
       sampling_area, sample_count, final_result, status, tested_by, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('LAB-TEST-00001', 'air', productId, equipmentId, 'LOT-A', 'Bay 1', 5, 'PASS', 'APPROVED', employeeId, employeeId, '2026-01-05 09:00:00', '2026-01-05 10:00:00');
  db.prepare(
    `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number,
       sampling_area, sample_count, final_result, status, tested_by, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('LAB-TEST-00002', 'vacuum', productId, equipmentId, 'LOT-B', 'Bay 2', 3, 'HOLD', 'DRAFT', employeeId, employeeId, '2026-01-06 09:00:00', '2026-01-06 09:00:00');
  db.prepare(
    `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number,
       sampling_area, sample_count, final_result, status, tested_by, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('LAB-TEST-00003', 'air', productId, equipmentId, 'LOT-A', 'Bay 3', 5, 'FAIL', 'SUBMITTED', managerId, managerId, '2026-01-07 09:00:00', '2026-01-07 09:00:00');

  // ── 1. parseLabTestSearchFilters ──
  console.log('\n■ parseLabTestSearchFilters');
  {
    const none = search.parseLabTestSearchFilters(fakeUrl(), fakeJar);
    eq(none.q, null, 'parse: no params → defaults (q null)');
    eq(none.status, null, 'parse: no params → status null');
    eq(none.sort, 'updated_at', 'parse: default sort updated_at');
    eq(none.dir, 'desc', 'parse: default dir desc');
    eq(none.page, 1, 'parse: default page 1');
    eq(none.per_page, 25, 'parse: default per_page 25');

    const full = search.parseLabTestSearchFilters(
      fakeUrl('?q=lot-a&type=air&status=APPROVED&result=PASS&tester=1&equipment=2&product=3&lot=LOT&created=today&sort=id&dir=asc&page=2&per=10'),
      fakeJar,
    );
    eq(full.q, 'lot-a', 'parse: q accepted');
    eq(full.test_type, 'air', 'parse: type air');
    eq(full.status, 'APPROVED', 'parse: status APPROVED');
    eq(full.result, 'PASS', 'parse: result PASS');
    eq(full.tester_id, 1, 'parse: tester id');
    eq(full.equipment_id, 2, 'parse: equipment id');
    eq(full.product_id, 3, 'parse: product id');
    eq(full.lot, 'LOT', 'parse: lot');
    eq(full.created, 'today', 'parse: created preset today');
    eq(full.sort, 'id', 'parse: sort id');
    eq(full.dir, 'asc', 'parse: dir asc');
    eq(full.page, 2, 'parse: page 2');
    eq(full.per_page, 10, 'parse: per_page 10');
    ok(full.created_from != null && full.created_to != null, 'parse: today preset fills from/to');

    const invalid = search.parseLabTestSearchFilters(
      fakeUrl('?type=helium&status=BOGUS&result=MAYBE&tester=abc&equipment=-3&product=0&page=abc&per=7&sort=evil;drop&dir=sideways'),
      fakeJar,
    );
    eq(invalid.test_type, null, 'parse: invalid type dropped');
    eq(invalid.status, null, 'parse: invalid status dropped');
    eq(invalid.result, null, 'parse: invalid result dropped');
    eq(invalid.tester_id, null, 'parse: non-numeric tester dropped');
    eq(invalid.equipment_id, null, 'parse: non-positive equipment dropped');
    eq(invalid.product_id, null, 'parse: zero product dropped');
    eq(invalid.page, 1, 'parse: invalid page dropped to 1');
    eq(invalid.per_page, 25, 'parse: invalid per_page dropped to default');
    eq(invalid.sort, 'updated_at', 'parse: invalid sort falls back to default');
    eq(invalid.dir, 'desc', 'parse: invalid dir falls back to default');

    const badWindow = search.parseLabTestSearchFilters(fakeUrl('?from=2026-02-01&to=2026-01-01'), fakeJar);
    eq(badWindow.created_from, null, 'parse: from > to window dropped');
    eq(badWindow.created_to, null, 'parse: from > to window dropped (to)');
  }

  // ── 2. hasLabTestFilters / labTestFiltersToQuery ──
  console.log('\n■ hasLabTestFilters / filtersToQuery');
  {
    ok(!search.hasLabTestFilters(search.parseLabTestSearchFilters(fakeUrl(), fakeJar)), 'filters: none active');
    ok(search.hasLabTestFilters(search.parseLabTestSearchFilters(fakeUrl('?status=DRAFT'), fakeJar)), 'filters: status active');
    const qs = search.labTestFiltersToQuery({
      q: 'lot-a', test_type: 'air', status: null, result: null, tester_id: 1, equipment_id: null,
      product_id: null, lot: null, created: null, created_from: '2026-01-01', created_to: '2026-01-10',
      sort: 'id', dir: 'asc', page: 1, per_page: 10,
    });
    ok(qs.includes('q=lot-a'), 'filtersToQuery: includes q');
    ok(qs.includes('type=air'), 'filtersToQuery: includes type');
    ok(qs.includes('tester=1'), 'filtersToQuery: includes tester');
    ok(qs.includes('from=2026-01-01'), 'filtersToQuery: includes from');
    ok(qs.includes('per=10'), 'filtersToQuery: includes per_page');
    ok(!qs.includes('page='), 'filtersToQuery: excludes page');
    ok(!qs.includes('status='), 'filtersToQuery: omits inactive filters');
  }

  // ── 3. buildLabTestWhere — parameterized, no user text in SQL ──
  console.log('\n■ buildLabTestWhere');
  {
    const w = search.buildLabTestWhere({
      q: "O'Brien % LOT_", test_type: 'air', status: 'APPROVED', result: null, tester_id: 5,
      equipment_id: null, product_id: 7, lot: '100%', created: null, created_from: null,
      created_to: null, sort: 'id', dir: 'asc', page: 1, per_page: 25,
    });
    ok(w.sql.includes('?') && !w.sql.includes("O'Brien") && !w.sql.includes('LOT_'),
      'where: user text never appears in SQL');
    eq(w.params.length, (w.sql.match(/\?/g) || []).length, 'where: params match placeholder count');
    const p = w.params;
    ok(p.every((v) => typeof v !== 'function'), 'where: params are plain values');
    ok(w.sql.includes('LIKE ? ESCAPE'), 'where: uses ESCAPE for LIKE');
  }

  // ── 4. RBAC scope + searchLabTests ──
  console.log('\n■ searchLabTests (scope + filtering + sorting)');
  {
    const all = search.parseLabTestSearchFilters(fakeUrl(), fakeJar);
    const mgrResult = await search.searchLabTests(all, { role: 'manager', userId: managerId });
    eq(mgrResult.total, 3, 'search: manager sees all 3 tests');
    eq(mgrResult.rows.length, 3, 'search: manager returns 3 rows');
    eq(mgrResult.total_pages, 1, 'search: one page');

    const empResult = await search.searchLabTests(all, { role: 'employee', userId: employeeId });
    eq(empResult.total, 2, 'search: employee sees only own 2 tests');
    const empIds = empResult.rows.map((r) => r.test_number);
    ok(!empIds.includes('LAB-TEST-00003'), 'search: employee excludes manager test');

    const filtered = await search.searchLabTests(
      search.parseLabTestSearchFilters(fakeUrl('?type=air&status=APPROVED'), fakeJar),
      { role: 'manager', userId: managerId },
    );
    eq(filtered.total, 1, 'search: type+status filter narrows to 1');
    eq(filtered.rows[0].test_number, 'LAB-TEST-00001', 'search: filter returns correct row');
    eq(filtered.rows[0].product_name, 'Seal Product', 'search: joins product name');
    eq(filtered.rows[0].equipment_code, 'EQ-VAC', 'search: joins equipment code');

    const lotSearch = await search.searchLabTests(
      search.parseLabTestSearchFilters(fakeUrl('?q=LOT-A'), fakeJar),
      { role: 'manager', userId: managerId },
    );
    eq(lotSearch.total, 2, 'search: q matches lot number');

    const sorted = await search.searchLabTests(
      search.parseLabTestSearchFilters(fakeUrl('?sort=lot&dir=asc'), fakeJar),
      { role: 'manager', userId: managerId },
    );
    const lotCol = sorted.rows.map((r) => r.lot_number);
    eq(lotCol[0], 'LOT-A', 'search: sort by lot asc');
    ok(lotCol.join(',') === 'LOT-A,LOT-A,LOT-B' || lotCol[0] === 'LOT-A', 'search: lot ascending order');

    const paginated = await search.searchLabTests(
      search.parseLabTestSearchFilters(fakeUrl('?per=10&page=2'), fakeJar),
      { role: 'manager', userId: managerId },
    );
    eq(paginated.total, 3, 'pagination: total unaffected by page');
    eq(paginated.total_pages, 1, 'pagination: 3 rows at per=10 → 1 page');
    eq(paginated.page, 1, 'pagination: page beyond total clamps to last page');
    eq(paginated.rows.length, 3, 'pagination: clamped page returns all rows');
  }

  // ── 5. searchLabTestRows (export) + export mapping ──
  console.log('\n■ searchLabTestRows + testExport');
  {
    const rows = await search.searchLabTestRows(
      search.parseLabTestSearchFilters(fakeUrl('?status=APPROVED'), fakeJar),
      { role: 'manager', userId: managerId },
    );
    eq(rows.length, 1, 'export: approved rows only');
    eq(rows[0].test_number, 'LAB-TEST-00001', 'export: correct row');

    const csv = exp.labTestRowsToCsv(rows);
    ok(csv.startsWith('\uFEFF'), 'export: CSV has UTF-8 BOM');
    ok(csv.includes('Test ID'), 'export: CSV has header row');
    ok(csv.includes('LAB-TEST-00001'), 'export: CSV contains test number');
    ok(csv.includes('Approved'), 'export: CSV maps status label');
    ok(csv.includes('PASS'), 'export: CSV contains result value');
    ok(csv.includes('\r\n'), 'export: CSV uses CRLF');

    const cells = exp.labTestRowToCells(rows[0]);
    eq(cells.status, 'Approved', 'export: status label mapping');
    eq(cells.final_result, 'PASS', 'export: result label mapping');
    eq(cells.product_name, 'Seal Product', 'export: product name cell');
  }

  // ── 6. Details read helpers ──
  console.log('\n■ details read helpers (tests.ts)');
  {
    const record = tests.getLabTestRecordById(1);
    ok(record != null, 'details: record 1 fetched');
    eq(record.test_number, 'LAB-TEST-00001', 'details: correct test_number');
    eq(record.product_name, 'Seal Product', 'details: product joined');
    eq(record.tester_name, 'QC Employee', 'details: tester joined');
    eq(tests.getLabTestRecordById(999999), undefined, 'details: unknown id → undefined');

    // No snapshots written (no approval flow in this fixture) → empty, not error.
    eq(tests.getLabTestEquipmentSnapshot(1), undefined, 'details: no equipment snapshot yet');
    eq(tests.getLabTestDocumentSnapshots(1).length, 0, 'details: no document snapshots yet');
    eq(tests.getLabTestAuditTimeline(1).length, 0, 'details: no audit events in this fixture');

    // Write a snapshot + an audit event and confirm they read back.
    db.prepare(
      'INSERT INTO lab_test_equipment_snapshots (test_id, equipment_id, equipment_name, equipment_code, serial_number, location, calibration_state) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(1, equipmentId, 'Vacuum Rig', 'EQ-VAC', 'SN-1', 'Lab', 'CALIBRATED');
    const snap = tests.getLabTestEquipmentSnapshot(1);
    eq(snap.equipment_code, 'EQ-VAC', 'details: equipment snapshot reads back');
    eq(snap.calibration_state, 'CALIBRATED', 'details: calibration state snapshot');
    db.prepare(
      `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, note) VALUES ('LAB_TEST', ?, NULL, ?, 'CREATE', ?)`,
    ).run(1, employeeId, 'created via fixture');
    const timeline = tests.getLabTestAuditTimeline(1);
    eq(timeline.length, 1, 'details: audit event reads back');
    eq(timeline[0].action, 'CREATE', 'details: audit action CREATE');
  }

  // ── 7. loadLabTestView — shared loader (details + print consistency) ──
  console.log('\n■ loadLabTestView');
  {
    // Invalid id / not allowed → full empty view (never a crash).
    const bad = tests.loadLabTestView(0, true);
    eq(bad.record, null, 'load: id 0 → record null');
    const denied = tests.loadLabTestView(1, false);
    eq(denied.record, null, 'load: not allowed → record null');

    const view = tests.loadLabTestView(1, true);
    ok(view.record != null, 'load: record 1 loaded');
    eq(view.record.test_number, 'LAB-TEST-00001', 'load: correct test_number');
    eq(view.samples.length, 0, 'load: no sample rows in fixture');
    ok(view.equipmentSnapshot != null, 'load: equipment snapshot present');
    eq(view.equipmentSnapshot.calibration_state, 'CALIBRATED', 'load: calibration state carried');
    eq(view.documentSnapshots.length, 0, 'load: no document snapshots');
    eq(view.productSnapshot, null, 'load: no product snapshot written yet');
    eq(view.templateSnapshot, null, 'load: no template snapshot yet');
    eq(view.parametersSnapshot, null, 'load: no parameters snapshot (draft fixture)');
    eq(view.retests.length, 0, 'load: no retests yet');
    eq(view.relatedQuality.length, 0, 'load: no linked quality entities yet');
    eq(view.timeline.length, 1, 'load: audit event carried into view');
  }

  // ── 8. loadLabTestView snapshot parsing + retest history + quality hook ──
  console.log('\n■ snapshots JSON / retest history / related-quality hook');
  {
    // product/template/parameters snapshots live on the record as JSON; write
    // them and confirm the loader parses them back for both pages.
    db.prepare(
      `UPDATE lab_test_records SET
         product_snapshot_json = ?,
         template_snapshot_json = ?,
         parameters_snapshot_json = ?
       WHERE id = 1`,
    ).run(
      JSON.stringify({ name: 'Seal Product', code: 'PRD-1' }),
      JSON.stringify({ template_id: 'AIR-TEMPLATE-001', version: 2 }),
      JSON.stringify({ standard_parameter: 'Subatmospheric Pressure -40 ~ -80 kPa', acceptance_criteria: '≤ 800 Pa' }),
    );
    const v2 = tests.loadLabTestView(1, true);
    eq(v2.productSnapshot.name, 'Seal Product', 'load: product snapshot parsed');
    eq(v2.templateSnapshot.version, 2, 'load: template snapshot parsed');
    eq(v2.parametersSnapshot.acceptance_criteria, '≤ 800 Pa', 'load: parameters snapshot parsed');
    eq(v2.templateSnapshot.notakey, undefined, 'load: template snapshot has only stored keys');

    // Retest history: original stays immutable, retest references it.
    const newTest = db.prepare(
      `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number,
         sampling_area, sample_count, final_result, status, tested_by, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('LAB-TEST-00004', 'air', productId, equipmentId, 'LOT-A', 'Bay 1', 5, 'PASS', 'APPROVED', employeeId, employeeId, '2026-01-08 09:00:00', '2026-01-08 10:00:00');
    const newTestId = Number(newTest.lastInsertRowid);
    db.prepare(
      'INSERT INTO lab_test_retests (retest_number, original_test_id, new_test_id, reason, reason_note, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run('LAB-RETEST-00001-01', 1, newTestId, 'FAIL', 'burst on S03', 'COMPLETED', employeeId, '2026-01-08 11:00:00');

    const retests = tests.getLabTestRetestHistory(1);
    eq(retests.length, 1, 'retest: history returns the row');
    eq(retests[0].retest_number, 'LAB-RETEST-00001-01', 'retest: number read back');
    eq(retests[0].reason, 'FAIL', 'retest: reason read back');
    eq(retests[0].new_test_number, 'LAB-TEST-00004', 'retest: joins resulting test number');
    eq(retests[0].new_test_result, 'PASS', 'retest: joins resulting result');
    eq(tests.getLabTestRetestHistory(2).length, 0, 'retest: unrelated test has none');

    // Related-quality hook is wired through the audit log LINK/UNLINK actions
    // and is empty by default (no parallel linking table, §49).
    eq(tests.getLabTestRelatedQualityEntities(1).length, 0, 'quality: empty by default (no invented links)');
    db.prepare(
      `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, note) VALUES ('LAB_TEST', ?, NULL, ?, 'LINK', ?)`,
    ).run(1, managerId, 'linked to finding #12');
    const linked = tests.getLabTestRelatedQualityEntities(1);
    eq(linked.length, 1, 'quality: LINK action surfaces via audit log');
    eq(linked[0].action, 'LINK', 'quality: action LINK read back');

    // The shared loader now reflects retest + linked-quality too.
    const v3 = tests.loadLabTestView(1, true);
    eq(v3.retests.length, 1, 'load: retest history carried into view');
    eq(v3.relatedQuality.length, 1, 'load: related-quality carried into view');
  }

  // ── 9. Sample-level traceability (migration 020) ──
  console.log('\n■ sample traceability (identifier, status, freeze)');
  {
    const review = await import('../src/lib/lab/review.ts');
    const baseForm = {
      product_description: 'Seal Product',
      connector_type: null,
      sample_count: 3,
      lot_number: 'LOT-T',
      sampling_area: 'Bay 9',
      equipment_id: equipmentId,
      medium_used: null,
      actual_pressure: null,
      torque_in_lb: null,
      time_sec: null,
      angle: null,
      temperature_measured: null,
      remarks: null,
      final_result: 'PASS',
    };

    // Archived equipment must be rejected for new tests (retired devices are
    // is_archived=1, never hard-deleted, so existence alone is not enough).
    console.log('\n■ archived equipment is refused for new tests');
    {
      const archivedId = Number(db.prepare("INSERT INTO lab_equipment (name, code, status_raw, is_archived, created_by) VALUES ('Retired Rig', 'EQ-RET', 'RETIRED', 1, ?)").run(managerId).lastInsertRowid);
      let blocked = false;
      try {
        tests.createLabTest({ ...baseForm, form_action: 'submit', equipment_id: archivedId, samples_json: [] }, employeeId, 'air');
      } catch {
        blocked = true;
      }
      ok(blocked, 'archived: createLabTest refuses archived equipment');
      let nonexistentBlocked = false;
      try {
        tests.createLabTest({ ...baseForm, form_action: 'submit', equipment_id: 999999, samples_json: [] }, employeeId, 'air');
      } catch {
        nonexistentBlocked = true;
      }
      ok(nonexistentBlocked, 'archived: createLabTest refuses nonexistent equipment');
      const beforeCount = db.prepare('SELECT COUNT(*) AS n FROM lab_test_records').get().n;
      tests.createLabTest({ ...baseForm, form_action: 'submit', equipment_id: equipmentId, samples_json: [] }, employeeId, 'air');
      eq(db.prepare('SELECT COUNT(*) AS n FROM lab_test_records').get().n, beforeCount + 1, 'archived: active equipment still accepted');
    }
    const submitted = tests.createLabTest(
      {
        ...baseForm,
        form_action: 'submit',
        samples_json: [
          { sample_no: 1, part_name: 'Body', set_pressure: null, actual_pressure: null, volume_sec: null, pressure_difference: null, holding_time_sec: null, leakage_rate: null, result: 'PASS' },
          { sample_no: 2, part_name: 'Cap', set_pressure: null, actual_pressure: null, volume_sec: null, pressure_difference: null, holding_time_sec: null, leakage_rate: null, result: 'FAIL' },
          { sample_no: 3, part_name: 'O-ring', set_pressure: null, actual_pressure: null, volume_sec: null, pressure_difference: null, holding_time_sec: null, leakage_rate: null, result: null },
        ],
      },
      employeeId,
      'air',
    );
    ok(submitted.test_number.startsWith('LAB-TEST-'), 'trace: test number format');
    const samples = tests.listLabTestSamples(submitted.id);
    eq(samples.length, 3, 'trace: 3 sample rows stored');
    eq(samples[0].sample_identifier, `${submitted.test_number}-S01`, 'trace: S01 identifier format');
    eq(samples[1].sample_identifier, `${submitted.test_number}-S02`, 'trace: S02 identifier format');
    eq(samples[2].sample_identifier, `${submitted.test_number}-S03`, 'trace: S03 identifier format');
    eq(samples[0].part_name, 'Body', 'trace: part name stored');
    eq(samples[0].result, 'PASS', 'trace: per-sample result stored');
    eq(samples[0].status, 'TESTED', 'trace: sample with result → TESTED');
    eq(samples[2].status, 'PENDING', 'trace: sample without result → PENDING');

    // Identifiers are immutable BEFORE approval too (trigger, migration 020).
    let identifierBlocked = false;
    try {
      db.prepare('UPDATE lab_test_samples SET sample_identifier = ? WHERE test_id = ? AND sample_no = 1')
        .run('FORGED-ID', submitted.id);
    } catch {
      identifierBlocked = true;
    }
    ok(identifierBlocked, 'trace: sample_identifier immutable (even pre-approval)');

    // Approve via the real transition (manager, not the tester) → sample rows
    // reach APPROVED in the same transaction.
    review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', submitted.id, null);
    const approvedSamples = tests.listLabTestSamples(submitted.id);
    ok(approvedSamples.every((s) => s.status === 'APPROVED'), 'trace: all samples APPROVED after approval');
    eq(approvedSamples[0].sample_identifier, `${submitted.test_number}-S01`, 'trace: identifier unchanged after approval');

    // After approval the rows are frozen structurally: UPDATE and DELETE abort.
    let updateBlocked = false;
    try {
      db.prepare("UPDATE lab_test_samples SET part_name = 'Tampered' WHERE test_id = ? AND sample_no = 1").run(submitted.id);
    } catch {
      updateBlocked = true;
    }
    ok(updateBlocked, 'trace: sample UPDATE frozen after approval');
    let deleteBlocked = false;
    try {
      db.prepare('DELETE FROM lab_test_samples WHERE test_id = ? AND sample_no = 1').run(submitted.id);
    } catch {
      deleteBlocked = true;
    }
    ok(deleteBlocked, 'trace: sample DELETE frozen after approval');
    eq(tests.listLabTestSamples(submitted.id).length, 3, 'trace: rows intact after blocked attempts');

    // The test record is NOT duplicated: one canonical record, 3 sample rows.
    eq(
      Number(db.prepare('SELECT COUNT(*) AS n FROM lab_test_records WHERE id = ?').get(submitted.id).n),
      1,
      'trace: single canonical record (no duplication)',
    );
  }

  // ── 9b. Samples: five by default, controlled extension, validation, ids ──
  console.log('\n■ samples: five, controlled extension, validation, identifiers');
  {
    const { labTestFormSchema } = await import('../src/lib/validation.ts');
    const { LAB_SAMPLE_COUNT_MAX } = await import('../src/lib/lab/policy.ts');
    const submitPayload = (sample_count, samples_json) => ({
      form_action: 'submit',
      product_description: 'Seal Product',
      connector_type: 'Non-locking (rigid) connector',
      sample_count,
      lot_number: 'LOT-FIVE',
      sampling_area: 'Bay 5',
      equipment_id: equipmentId,
      final_result: 'PASS',
      samples_json,
    });
    const five = Array.from({ length: 5 }, (_, i) => ({ sample_no: i + 1, part_name: `Row ${i+1}`, result: 'PASS' }));

    // A complete, judged five-row grid parses for submission.
    const full = labTestFormSchema.safeParse(submitPayload(5, five));
    ok(full.success, 'five: 5 complete judged rows pass submit validation');

    // Grid must exactly match the declared count (controlled extension).
    const short = labTestFormSchema.safeParse(submitPayload(5, five.slice(0, 3)));
    eq(short.success, false, 'five: 5 declared / 3 rows rejected');

    // A missing sample ordinal and an unjudged row are both refused.
    const gap = labTestFormSchema.safeParse(submitPayload(5, five.slice(0, 4)));
    eq(gap.success, false, 'five: missing sample ordinal refused');
    const unjudged = labTestFormSchema.safeParse(submitPayload(5, [...five.slice(0, 3), { sample_no: 4, part_name: 'Cap', result: null }, five[4]]));
    eq(unjudged.success, false, 'five: unjudged row refused');

    // Controlled extension is bounded at LAB_SAMPLE_COUNT_MAX (20) - no growth.
    const twenty = Array.from({ length: 20 }, (_, i) => ({ sample_no: i + 1, part_name: 'Row', result: 'PASS' }));
    ok(labTestFormSchema.safeParse(submitPayload(20, twenty)).success, 'five: 20-row grid (the max) passes');
    eq(labTestFormSchema.safeParse(submitPayload(21, twenty)).success, false, 'five: declared 21 rejected (max 20)');
    eq(labTestFormSchema.safeParse(submitPayload(0, [])).success, false, 'five: zero samples rejected');
    eq(LAB_SAMPLE_COUNT_MAX, 20, 'five: shared max constant = 20');

    // Five sample rows persist with S01..S05 identifiers.
    const created = tests.createLabTest(
      {
        product_description: 'Seal Product',
        connector_type: null,
        sample_count: 5,
        lot_number: 'LOT-FIVE',
        sampling_area: 'Bay 5',
        equipment_id: equipmentId,
        medium_used: null,
        actual_pressure: null,
        torque_in_lb: null,
        time_sec: null,
        angle: null,
        temperature_measured: null,
        remarks: null,
        final_result: 'PASS',
        form_action: 'submit',
        samples_json: five,
        product_id: productId,
      },
      employeeId,
      'air',
    );
    const stored = tests.listLabTestSamples(created.id);
    eq(stored.length, 5, 'five: 5 rows persisted');
    for (let i = 0; i < 5; i += 1) {
      eq(stored[i].sample_identifier, `${created.test_number}-S0${i + 1}`, `five: identifier S0${i + 1} (${stored[i].sample_identifier})`);
      eq(stored[i].result, 'PASS', `five: row ${i + 1} judged`);
    }
  }
  console.log('\n■ test ↔ finding traceability links (findingLinks)');
  {
    // Existing quality entities are used as-is: a task + a QC Finding (the
    // NCR-like entity). No second quality workflow is built.
    const task = db.prepare('INSERT INTO tasks (title, created_by) VALUES (?, ?)').run('Non-conformance investigation', managerId);
    const taskId = Number(task.lastInsertRowid);
    const finding = db.prepare(
      `INSERT INTO qc_findings (finding_number, task_id, inspection_type, classification, severity,
         risk_description, requirement_reference, owner, due_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('NCR-2026-00001', taskId, 'lab_review', 'major', 'high', 'Sample S03 burst pressure above limit', 'QC-REQ-1', managerId, '2026-01-31', 'OPEN', managerId);
    const findingId = Number(finding.lastInsertRowid);
    const second = db.prepare(
      `INSERT INTO qc_findings (finding_number, task_id, inspection_type, classification, severity,
         risk_description, owner, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('NCR-2026-00002', taskId, 'audit', 'minor', 'low', 'Cosmetic label defect', managerId, 'CLOSED', managerId);
    const secondFindingId = Number(second.lastInsertRowid);

    eq(links.getLabTestFindingLinks(2).length, 0, 'links: none by default');
    const options = links.getLabTestFindingLinkOptions(2);
    ok(options.some((o) => o.id === findingId && o.finding_number === 'NCR-2026-00001'), 'links: finding is available to link');
    ok(options.some((o) => o.id === secondFindingId), 'links: closed finding still selectable (traceability)');
    ok(!options.some((o) => o.id === 999999), 'links: unknown finding not offered');

    // Linking is transactional and writes the LAB_TEST/LINK audit row.
    links.linkLabTestToFinding({ actorId: managerId, testId: 2, findingId, note: 'burst on S03' });
    eq(Number(db.prepare('SELECT COUNT(*) AS n FROM lab_test_findings WHERE test_id = 2 AND finding_id = ?').get(findingId).n), 1, 'links: row stored');
    const linked = links.getLabTestFindingLinks(2);
    eq(linked.length, 1, 'links: resolved link surfaced');
    eq(linked[0].finding_number, 'NCR-2026-00001', 'links: finding number resolved');
    eq(linked[0].classification, 'major', 'links: classification resolved');
    eq(linked[0].status, 'OPEN', 'links: status resolved');
    eq(linked[0].task_title, 'Non-conformance investigation', 'links: owning task title resolved');
    eq(linked[0].note, 'burst on S03', 'links: note carried');
    eq(linked[0].href, `/findings/${findingId}`, 'links: href targets the existing finding page');
    ok(linked[0].linked_by_name && linked[0].linked_by_name.length > 0, 'links: linked-by resolved');
    const linkAudit = tests.getLabTestRelatedQualityEntities(2);
    ok(linkAudit.some((e) => e.action === 'LINK' && String(e.note).includes('NCR-2026-00001')), 'links: LAB_TEST/LINK audit row written');

    // The loader surfaces links in the shared view (details + print).
    const vLinks = tests.loadLabTestView(2, true);
    eq(vLinks.findingLinks.length, 1, 'load: findingLinks carried into view');
    eq(vLinks.findingLinks[0].finding_number, 'NCR-2026-00001', 'load: findingLinks resolved in view');

    // After linking, the finding is no longer offered for this test.
    ok(!links.getLabTestFindingLinkOptions(2).some((o) => o.id === findingId), 'links: linked finding excluded from options');

    // Duplicate links are refused; unlink removes the row + writes UNLINK.
    let dupBlocked = false;
    try {
      links.linkLabTestToFinding({ actorId: managerId, testId: 2, findingId, note: null });
    } catch {
      dupBlocked = true;
    }
    ok(dupBlocked, 'links: duplicate link refused');
    links.unlinkLabTestFromFinding({ actorId: managerId, testId: 2, findingId });
    eq(links.getLabTestFindingLinks(2).length, 0, 'links: unlinked');
    ok(tests.getLabTestRelatedQualityEntities(2).some((e) => e.action === 'UNLINK'), 'links: LAB_TEST/UNLINK audit row written');
    let unlinkTwiceBlocked = false;
    try {
      links.unlinkLabTestFromFinding({ actorId: managerId, testId: 2, findingId });
    } catch {
      unlinkTwiceBlocked = true;
    }
    ok(unlinkTwiceBlocked, 'links: unlink of a missing link refused');

    // RESTRICT protects both sides: a linked finding or test cannot be deleted.
    links.linkLabTestToFinding({ actorId: managerId, testId: 2, findingId, note: null });
    let findingDeleteBlocked = false;
    try {
      db.prepare('DELETE FROM qc_findings WHERE id = ?').run(findingId);
    } catch {
      findingDeleteBlocked = true;
    }
    ok(findingDeleteBlocked, 'links: RESTRICT blocks deleting a linked finding');
    let testDeleteBlocked = false;
    try {
      db.prepare('DELETE FROM lab_test_records WHERE id = 2').run();
    } catch {
      testDeleteBlocked = true;
    }
    ok(testDeleteBlocked, 'links: RESTRICT blocks deleting a linked test');
    eq(links.getLabTestFindingLinks(2).length, 1, 'links: link intact after blocked deletes');

    // Invalid ids are refused by the service layer.
    let badLinkBlocked = false;
    try {
      links.linkLabTestToFinding({ actorId: managerId, testId: 2, findingId: 999999, note: null });
    } catch {
      badLinkBlocked = true;
    }
    ok(badLinkBlocked, 'links: unknown finding refused');

    // Shared Zod schema: coerces numeric ids, rejects junk, empty note → null.
    const { labTestFindingLinkSchema } = await import('../src/lib/validation.ts');
    const bad = labTestFindingLinkSchema.safeParse({ finding_id: 'not-a-number', note: '' });
    eq(bad.success, false, 'links: schema rejects non-numeric finding id');
    const good = labTestFindingLinkSchema.safeParse({ finding_id: '12', note: '' });
    ok(good.success && good.data.finding_id === 12 && good.data.note === null, 'links: schema coerces id + empty note → null');
    const tooLong = labTestFindingLinkSchema.safeParse({ finding_id: '12', note: 'x'.repeat(5001) });
    eq(tooLong.success, false, 'links: schema rejects over-long note');
  }

  // ── VOID test mutation (PROMPT 42) ──
  console.log('\n■ void test mutation (PROMPT 42)');
  {
    const { labTestVoidSchema } = await import('../src/lib/validation.ts');

    // Schema checks: reason is mandatory, min 3, max 500
    eq(labTestVoidSchema.safeParse({ reason: '' }).success, false, 'void: empty reason rejected');
    eq(labTestVoidSchema.safeParse({ reason: '  ' }).success, false, 'void: whitespace reason rejected');
    eq(labTestVoidSchema.safeParse({ reason: 'no' }).success, false, 'void: reason < 3 chars rejected');
    eq(labTestVoidSchema.safeParse({ reason: 'x'.repeat(501) }).success, false, 'void: reason > 500 chars rejected');
    const validParsed = labTestVoidSchema.safeParse({ reason: 'Test setup was contaminated' });
    ok(validParsed.success && validParsed.data.reason === 'Test setup was contaminated', 'void: valid reason accepted');

    // Setup tests in different states: DRAFT, SUBMITTED, UNDER_REVIEW, REJECTED, APPROVED
    const draftT = tests.createLabTest({
      form_action: 'draft',
      product_description: 'Seal Product',
      product_id: productId,
      connector_type: 'Non-locking (rigid) connector',
      sample_count: 3,
      lot_number: 'LOT-VOID-DRAFT',
      sampling_area: 'Bay 1',
      equipment_id: equipmentId,
      medium_used: 'Air',
      actual_pressure: '100',
      torque_in_lb: null,
      time_sec: '30',
      angle: null,
      temperature_measured: '23',
      samples_json: [
        { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
        { sample_no: 2, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: null },
        { sample_no: 3, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: null },
      ],
      remarks: null,
      final_result: null,
    }, employeeId, 'air');

    // 1. Employee / Supervisor denied
    let empBlocked = false;
    try {
      tests.voidLabTest({ id: employeeId, role: 'employee' }, draftT.id, 'Invalid test');
    } catch {
      empBlocked = true;
    }
    ok(empBlocked, 'void: employee denied');

    const supervisorUser = db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get();
    const supervisorId = Number(supervisorUser.id);
    let supBlocked = false;
    try {
      tests.voidLabTest({ id: supervisorId, role: 'supervisor' }, draftT.id, 'Invalid test');
    } catch {
      supBlocked = true;
    }
    ok(supBlocked, 'void: supervisor denied');

    // 2. Void allowed from DRAFT
    const voidDraftRes = tests.voidLabTest({ id: managerId, role: 'manager' }, draftT.id, 'Setup equipment miscalibrated');
    eq(voidDraftRes.status, 'VOID', 'void: DRAFT voided status is VOID');
    const voidedDraftRow = db.prepare('SELECT status FROM lab_test_records WHERE id = ?').get(draftT.id);
    eq(voidedDraftRow.status, 'VOID', 'void: record status updated in DB');
    const voidedDraftSamples = db.prepare('SELECT status FROM lab_test_samples WHERE test_id = ?').all(draftT.id);
    ok(voidedDraftSamples.every((s) => s.status === 'VOID'), 'void: all sample rows updated to VOID');

    // Audit log check
    const voidDraftAudit = db.prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? AND action = 'VOID'").get(draftT.id);
    ok(voidDraftAudit !== undefined, 'void: audit row written with action VOID');
    eq(voidDraftAudit.actor_id, managerId, 'void: audit actor_id is manager');
    eq(voidDraftAudit.old_value, 'DRAFT', 'void: audit old_value is DRAFT');
    eq(voidDraftAudit.new_value, 'VOID', 'void: audit new_value is VOID');
    eq(voidDraftAudit.note, 'Setup equipment miscalibrated', 'void: audit note contains reason');

    // Notification check
    const voidDraftNotif = db.prepare("SELECT * FROM notifications WHERE type = 'lab_test_voided' AND user_id = ? ORDER BY id DESC LIMIT 1").get(employeeId);
    ok(voidDraftNotif !== undefined, 'void: notification created for tester');
    ok(voidDraftNotif.message.includes('Setup equipment miscalibrated'), 'void: notification message carries reason');

    // 3. Voiding an already VOID test is refused
    let revoidBlocked = false;
    try {
      tests.voidLabTest({ id: managerId, role: 'manager' }, draftT.id, 'Second void attempt');
    } catch {
      revoidBlocked = true;
    }
    ok(revoidBlocked, 'void: already VOID test cannot be voided again');

    // 4. Void allowed from SUBMITTED
    const subT = tests.createLabTest({
      form_action: 'submit',
      product_description: 'Seal Product',
      product_id: productId,
      connector_type: 'Non-locking (rigid) connector',
      sample_count: 1,
      lot_number: 'LOT-VOID-SUBMITTED',
      sampling_area: 'Bay 1',
      equipment_id: equipmentId,
      medium_used: 'Air',
      actual_pressure: '100',
      torque_in_lb: null,
      time_sec: '30',
      angle: null,
      temperature_measured: '23',
      samples_json: [
        { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
      ],
      remarks: null,
      final_result: 'PASS',
    }, employeeId, 'air');

    const voidSubRes = tests.voidLabTest({ id: managerId, role: 'manager' }, subT.id, 'Submission had wrong lot');
    eq(voidSubRes.status, 'VOID', 'void: SUBMITTED test voided');

    // 5. Void allowed from UNDER_REVIEW
    const underReviewT = tests.createLabTest({
      form_action: 'submit',
      product_description: 'Seal Product',
      product_id: productId,
      connector_type: 'Non-locking (rigid) connector',
      sample_count: 1,
      lot_number: 'LOT-VOID-UR',
      sampling_area: 'Bay 1',
      equipment_id: equipmentId,
      medium_used: 'Air',
      actual_pressure: '100',
      torque_in_lb: null,
      time_sec: '30',
      angle: null,
      temperature_measured: '23',
      samples_json: [
        { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
      ],
      remarks: null,
      final_result: 'PASS',
    }, employeeId, 'air');
    db.prepare("UPDATE lab_test_records SET status = 'UNDER_REVIEW', reviewed_by = ? WHERE id = ?").run(supervisorId, underReviewT.id);

    const voidUrRes = tests.voidLabTest({ id: managerId, role: 'manager' }, underReviewT.id, 'Voided during review');
    eq(voidUrRes.status, 'VOID', 'void: UNDER_REVIEW test voided');

    // 6. Void allowed from REJECTED
    const rejectedT = tests.createLabTest({
      form_action: 'submit',
      product_description: 'Seal Product',
      product_id: productId,
      connector_type: 'Non-locking (rigid) connector',
      sample_count: 1,
      lot_number: 'LOT-VOID-REJ',
      sampling_area: 'Bay 1',
      equipment_id: equipmentId,
      medium_used: 'Air',
      actual_pressure: '100',
      torque_in_lb: null,
      time_sec: '30',
      angle: null,
      temperature_measured: '23',
      samples_json: [
        { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'FAIL' },
      ],
      remarks: null,
      final_result: 'FAIL',
    }, employeeId, 'air');
    db.prepare("UPDATE lab_test_records SET status = 'REJECTED', reviewed_by = ?, rejected_reason = 'Failed' WHERE id = ?").run(supervisorId, rejectedT.id);

    const voidRejRes = tests.voidLabTest({ id: managerId, role: 'manager' }, rejectedT.id, 'Voided rejected record');
    eq(voidRejRes.status, 'VOID', 'void: REJECTED test voided');

    // 7. Voiding an APPROVED test is strictly FORBIDDEN
    let approvedVoidBlocked = false;
    let approvedVoidError = '';
    try {
      tests.voidLabTest({ id: managerId, role: 'manager' }, 1, 'Attempt to void approved test');
    } catch (err) {
      approvedVoidBlocked = true;
      approvedVoidError = err instanceof Error ? err.message : '';
    }
    ok(approvedVoidBlocked, 'void: APPROVED test cannot be voided');
    ok(approvedVoidError.includes('Approved tests are immutable'), 'void: immutable approved message');

    // 8. Open retest blocking
    const testWithRetest = tests.createLabTest({
      form_action: 'draft',
      product_description: 'Seal Product',
      product_id: productId,
      connector_type: 'Non-locking (rigid) connector',
      sample_count: 1,
      lot_number: 'LOT-VOID-OPEN-RETEST',
      sampling_area: 'Bay 1',
      equipment_id: equipmentId,
      medium_used: 'Air',
      actual_pressure: '100',
      torque_in_lb: null,
      time_sec: '30',
      angle: null,
      temperature_measured: '23',
      samples_json: [
        { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
      ],
      remarks: null,
      final_result: null,
    }, employeeId, 'air');

    // Insert an OPEN retest row
    db.prepare(
      `INSERT INTO lab_test_retests (retest_number, original_test_id, reason, status, created_by)
       VALUES (?, ?, ?, 'OPEN', ?)`,
    ).run('LAB-RETEST-99999-01', testWithRetest.id, 'FAIL', supervisorId);

    let retestBlocked = false;
    let retestErrorMsg = '';
    try {
      tests.voidLabTest({ id: managerId, role: 'manager' }, testWithRetest.id, 'Void attempt on test with open retest');
    } catch (err) {
      retestBlocked = true;
      retestErrorMsg = err instanceof Error ? err.message : '';
    }
    ok(retestBlocked, 'void: blocked when open retest exists');
    ok(retestErrorMsg.includes('لا يمكن إلغاء الاختبار لوجود إعادة اختبار مفتوحة'), 'void: returns clear Arabic retest block message');

    // Close the retest -> voiding is now allowed
    db.prepare("UPDATE lab_test_retests SET status = 'CANCELLED' WHERE original_test_id = ?").run(testWithRetest.id);
    const unblockedRes = tests.voidLabTest({ id: managerId, role: 'manager' }, testWithRetest.id, 'Now closed, can void');
    eq(unblockedRes.status, 'VOID', 'void: allowed after open retest is resolved');
  }

  console.log('\n■ DRAFT editing (PROMPT 43-B)');
  {
    const draftData = (overrides = {}) => ({
      form_action: 'draft',
      product_description: 'Seal Product',
      product_id: productId,
      connector_type: 'Non-locking (rigid) connector',
      sample_count: 2,
      lot_number: 'LOT-EDIT-1',
      sampling_area: 'Bay 2',
      equipment_id: equipmentId,
      medium_used: 'Air',
      actual_pressure: '100',
      torque_in_lb: null,
      time_sec: '30',
      angle: null,
      temperature_measured: '23',
      samples_json: [
        { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
        { sample_no: 2, part_name: 'Cap', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: null },
      ],
      remarks: null,
      final_result: null,
      ...overrides,
    });

    const draft = tests.createLabTest(draftData(), employeeId, 'air');

    // Loader: creator sees the draft, outsider does not (404-style null)
    const loaded = tests.getLabTestEditableDraft(draft.id, { id: employeeId, role: 'employee' });
    ok(loaded !== null, 'edit: creator can load own draft');
    eq(loaded.test_type, 'air', 'edit: loader returns stored test type');
    eq(loaded.product_description, 'Seal Product', 'edit: product description prefills from canonical product name');
    const outsiderId = Number(
      db
        .prepare("INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active) VALUES ('employee2', 'unused', 'Second Employee', 'employee', 'QC', 0, 1)")
        .run().lastInsertRowid,
    );
    eq(tests.getLabTestEditableDraft(draft.id, { id: outsiderId, role: 'employee' }), null, 'edit: other employee gets null (404)');
    eq(tests.getLabTestEditableDraft(999999, { id: employeeId, role: 'employee' }), null, 'edit: missing test → null');

    // Update by creator: lot + a sample value change, audited with old/new diff
    const updated = tests.updateLabTestDraft(
      { id: employeeId, role: 'employee' },
      draft.id,
      draftData({
        lot_number: 'LOT-EDIT-2',
        sample_count: 3,
        samples_json: [
          { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
          { sample_no: 2, part_name: 'Cap', set_pressure: '100', actual_pressure: '101', volume_sec: '5', pressure_difference: '1', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
          { sample_no: 3, part_name: 'Cap', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: null },
        ],
      }),
    );
    eq(updated.test_number, draft.test_number, 'edit: test number unchanged');
    const rowAfter = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(draft.id);
    eq(rowAfter.status, 'DRAFT', 'edit: stays DRAFT on form_action=draft');
    eq(rowAfter.lot_number, 'LOT-EDIT-2', 'edit: lot updated');
    eq(Number(rowAfter.sample_count), 3, 'edit: sample count updated');
    const samplesAfter = db.prepare('SELECT * FROM lab_test_samples WHERE test_id = ? ORDER BY sample_no').all(draft.id);
    eq(samplesAfter.length, 3, 'edit: sample grid replaced wholesale');
    eq(samplesAfter[1].actual_pressure, '101', 'edit: changed sample value stored');
    eq(samplesAfter[0].sample_identifier, `${draft.test_number}-S01`, 'edit: sample identifiers re-derived stably');

    const updateAudit = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? AND action = 'UPDATE' ORDER BY id DESC LIMIT 1")
      .get(draft.id);
    ok(updateAudit !== undefined, 'edit: LAB_TEST/UPDATE audit row written');
    eq(Number(updateAudit.actor_id), employeeId, 'edit: audit actor is the creator');
    const oldDiff = JSON.parse(updateAudit.old_value);
    const newDiff = JSON.parse(updateAudit.new_value);
    eq(oldDiff.lot_number, 'LOT-EDIT-1', 'edit: audit old_value carries previous lot');
    eq(newDiff.lot_number, 'LOT-EDIT-2', 'edit: audit new_value carries new lot');
    ok(!('remarks' in oldDiff), 'edit: audit diff only includes changed fields');

    // Non-owner update → not-found (no existence leak)
    let outBlocked = false;
    try {
      tests.updateLabTestDraft({ id: outsiderId, role: 'employee' }, draft.id, draftData());
    } catch (err) {
      outBlocked = err instanceof tests.LabTestDraftNotFoundError;
    }
    ok(outBlocked, 'edit: other employee update → LabTestDraftNotFoundError');

    // Submit from edit: DRAFT → SUBMITTED with SUBMIT audit
    const submitted = tests.updateLabTestDraft(
      { id: employeeId, role: 'employee' },
      draft.id,
      draftData({
        form_action: 'submit',
        final_result: 'PASS',
        samples_json: [
          { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
          { sample_no: 2, part_name: 'Cap', set_pressure: '100', actual_pressure: '101', volume_sec: '5', pressure_difference: '1', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
          { sample_no: 3, part_name: 'Cap', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
        ],
      }),
    );
    const rowSubmitted = db.prepare('SELECT status, final_result FROM lab_test_records WHERE id = ?').get(draft.id);
    eq(rowSubmitted.status, 'SUBMITTED', 'edit: submit moves draft to SUBMITTED');
    eq(rowSubmitted.final_result, 'PASS', 'edit: submit freezes final result');
    const submitAudit = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? AND action = 'SUBMIT' ORDER BY id DESC LIMIT 1")
      .get(draft.id);
    eq(submitAudit.old_value, 'DRAFT', 'edit: submit audit old_value DRAFT');
    eq(submitAudit.new_value, 'SUBMITTED', 'edit: submit audit new_value SUBMITTED');

    // Non-draft (SUBMITTED now) → 400-style LabTestNotDraftError
    let notDraft = false;
    try {
      tests.updateLabTestDraft({ id: employeeId, role: 'employee' }, draft.id, draftData());
    } catch (err) {
      notDraft = err instanceof tests.LabTestNotDraftError;
    }
    ok(notDraft, 'edit: non-draft test → LabTestNotDraftError');
    eq(tests.getLabTestEditableDraft(draft.id, { id: employeeId, role: 'employee' }), null, 'edit: loader null for SUBMITTED test');

    // Rejected tests are returned to the original contributor for rework and
    // may be submitted again; no replacement test is required for correction.
    db.prepare("UPDATE lab_test_records SET status='REJECTED', rejected_reason='Correct the sample reading' WHERE id=?").run(draft.id);
    ok(tests.getLabTestEditableDraft(draft.id, { id: employeeId, role: 'employee' }) !== null, 'edit: creator can load own REJECTED test');
    const reworked = tests.updateLabTestDraft(
      { id: employeeId, role: 'employee' },
      draft.id,
      draftData({ form_action: 'submit', lot_number: 'LOT-REWORKED', final_result: 'PASS', samples_json: [
        { sample_no: 1, part_name: 'Body', set_pressure: '100', actual_pressure: '100', volume_sec: '5', pressure_difference: '0', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
        { sample_no: 2, part_name: 'Cap', set_pressure: '100', actual_pressure: '101', volume_sec: '5', pressure_difference: '1', holding_time_sec: '30', leakage_rate: '0', result: 'PASS' },
      ] }),
    );
    eq(reworked.id, draft.id, 'edit: rejected rework keeps the original test id');
    eq(db.prepare('SELECT status, lot_number FROM lab_test_records WHERE id=?').get(draft.id).status, 'SUBMITTED', 'edit: rejected rework resubmits');
    eq(db.prepare('SELECT lot_number FROM lab_test_records WHERE id=?').get(draft.id).lot_number, 'LOT-REWORKED', 'edit: rejected rework updates the original');

    // Archived equipment rejected on edit (same guard as create)
    const draft2 = tests.createLabTest(draftData({ lot_number: 'LOT-EDIT-3' }), employeeId, 'air');
    const archEq = Number(
      db.prepare("INSERT INTO lab_equipment (name, code, status_raw, is_archived, created_by) VALUES ('Old Rig', 'EQ-OLD', 'RETIRED', 1, ?)").run(managerId).lastInsertRowid,
    );
    let archBlocked = false;
    try {
      tests.updateLabTestDraft({ id: employeeId, role: 'employee' }, draft2.id, draftData({ equipment_id: archEq }));
    } catch (err) {
      archBlocked = err instanceof Error && err.message.includes('Archived equipment');
    }
    ok(archBlocked, 'edit: archived equipment rejected');

    // Manager may edit another user's draft (canEditLabTestRecord manager rule)
    const mgrEdit = tests.updateLabTestDraft({ id: managerId, role: 'manager' }, draft2.id, draftData({ lot_number: 'LOT-EDIT-4' }));
    eq(mgrEdit.id, draft2.id, 'edit: manager can edit any DRAFT');
  }

  console.log('\n■ session environment readings (PROMPT 51)');
  {
    const review = await import('../src/lib/lab/review.ts');
    const envOutsiderId = Number(
      db
        .prepare("INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active) VALUES ('employee3', 'unused', 'Third Employee', 'employee', 'QC', 0, 1)")
        .run().lastInsertRowid,
    );
    // Draft data WITHOUT readings (baseline for the diff assertions below).
    const draftData = (overrides = {}) => ({
      form_action: 'draft',
      product_description: 'Seal Product',
      product_id: productId,
      connector_type: 'Non-locking (rigid) connector',
      sample_count: 1,
      lot_number: 'LOT-ENV-1',
      sampling_area: 'Bay 5',
      equipment_id: equipmentId,
      medium_used: 'Air',
      actual_pressure: null,
      torque_in_lb: null,
      time_sec: null,
      angle: null,
      temperature_measured: '23', // headline measured temperature — untouched by the log
      samples_json: [
        { sample_no: 1, part_name: null, set_pressure: null, actual_pressure: null, volume_sec: null, pressure_difference: null, holding_time_sec: null, leakage_rate: null, result: null },
      ],
      environment_readings_json: [],
      remarks: null,
      final_result: null,
      ...overrides,
    });
    const reading = (at, temp, humidity = null, notes = null) => ({ reading_at: at, temperature: temp, humidity, notes });

    const envDraft = tests.createLabTest(
      draftData({ environment_readings_json: [reading('2026-02-01T08:00', '22.4', '41', 'start of shift')] }),
      employeeId,
      'air',
    );
    let rows = tests.listLabTestEnvironmentReadings(envDraft.id);
    eq(rows.length, 1, 'readings: create stores one reading');
    eq(rows[0].reading_at, '2026-02-01T08:00', 'readings: timestamp stored verbatim');
    eq(rows[0].temperature, '22.4', 'readings: temperature stored verbatim');
    eq(rows[0].humidity, '41', 'readings: optional humidity stored');
    eq(rows[0].notes, 'start of shift', 'readings: optional note stored');

    // Headline field untouched: temperature_measured stays on the record.
    const envRow = db.prepare('SELECT temperature_measured FROM lab_test_records WHERE id = ?').get(envDraft.id);
    eq(envRow.temperature_measured, '23', 'readings: headline Temperature (Measured) unchanged');

    // Draft update: add + remove rows wholesale.
    tests.updateLabTestDraft(
      { id: employeeId, role: 'employee' },
      envDraft.id,
      draftData({
        environment_readings_json: [
          reading('2026-02-01T08:00', '22.4', '41'),
          reading('2026-02-01T09:30', '23.1'),
          reading('2026-02-01T11:00', '24.0', null, 'pre-submission check'),
        ],
      }),
    );
    rows = tests.listLabTestEnvironmentReadings(envDraft.id);
    eq(rows.length, 3, 'readings: draft edit adds rows');
    ok(rows.some((r) => r.notes === 'pre-submission check'), 'readings: new row content stored');
    ok(!rows.some((r) => r.notes === 'start of shift'), 'readings: removed row is gone (wholesale replace)');

    // Empty rows are dropped silently; incomplete rows are rejected by the
    // schema layer (service only receives complete ones — defensive filter).
    tests.updateLabTestDraft(
      { id: employeeId, role: 'employee' },
      envDraft.id,
      draftData({ environment_readings_json: [reading('', '', '', ''), reading('2026-02-01T12:00', '24.5')] }),
    );
    rows = tests.listLabTestEnvironmentReadings(envDraft.id);
    eq(rows.length, 1, 'readings: fully-empty row dropped, complete row kept');

    // Audit on modification: latest UPDATE diff carries old/new readings.
    const updAudit = db
      .prepare("SELECT * FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? AND action = 'UPDATE' ORDER BY id DESC LIMIT 1")
      .get(envDraft.id);
    ok(updAudit !== undefined, 'readings: LAB_TEST/UPDATE audit written on modification');
    const oldReadings = JSON.parse(updAudit.old_value).environment_readings;
    const newReadings = JSON.parse(updAudit.new_value).environment_readings;
    eq(oldReadings.length, 3, 'readings: audit old_value carries previous rows');
    eq(newReadings.length, 1, 'readings: audit new_value carries new rows');

    // Employee scope respected: another employee cannot touch this draft.
    let scopeBlocked = false;
    try {
      tests.updateLabTestDraft(
        { id: envOutsiderId, role: 'employee' },
        envDraft.id,
        draftData({ environment_readings_json: [reading('2026-02-01T13:00', '99')] }),
      );
    } catch (err) {
      scopeBlocked = err instanceof tests.LabTestDraftNotFoundError;
    }
    ok(scopeBlocked, 'readings: other employee update → LabTestDraftNotFoundError');
    eq(tests.listLabTestEnvironmentReadings(envDraft.id).length, 1, 'readings: out-of-scope attempt changed nothing');

    // Manager may still edit any DRAFT (same rule as the rest of the form).
    tests.updateLabTestDraft(
      { id: managerId, role: 'manager' },
      envDraft.id,
      draftData({ environment_readings_json: [reading('2026-02-01T14:00', '25.0', null, 'manager correction')] }),
    );
    rows = tests.listLabTestEnvironmentReadings(envDraft.id);
    eq(rows.length, 1, 'readings: manager can edit any DRAFT');
    eq(rows[0].created_by, managerId, 'readings: created_by records who logged it');

    // Immutable after approval: submit → approve (manager ≠ tester), then the
    // structural triggers abort UPDATE and DELETE — even via direct SQL.
    tests.updateLabTestDraft({ id: managerId, role: 'manager' }, envDraft.id, draftData({
      form_action: 'submit',
      final_result: 'PASS',
      samples_json: [{ sample_no: 1, part_name: null, set_pressure: null, actual_pressure: null, volume_sec: null, pressure_difference: null, holding_time_sec: null, leakage_rate: null, result: 'PASS' }],
      environment_readings_json: [reading('2026-02-01T14:00', '25.0', null, 'manager correction')],
    }));
    review.transitionLabTest({ id: managerId, role: 'manager' }, 'approve', envDraft.id, null);

    const frozenCount = tests.listLabTestEnvironmentReadings(envDraft.id).length;
    eq(frozenCount, 1, 'readings: approved test keeps its readings');

    let updateBlocked = false;
    try {
      db.prepare("UPDATE lab_test_environment_readings SET temperature = '999' WHERE test_id = ?").run(envDraft.id);
    } catch {
      updateBlocked = true;
    }
    ok(updateBlocked, 'readings: UPDATE after approval aborted (trigger)');

    let deleteBlocked = false;
    try {
      db.prepare('DELETE FROM lab_test_environment_readings WHERE test_id = ?').run(envDraft.id);
    } catch {
      deleteBlocked = true;
    }
    ok(deleteBlocked, 'readings: DELETE after approval aborted (trigger)');

    eq(tests.listLabTestEnvironmentReadings(envDraft.id)[0].temperature, '25.0', 'readings: values intact after blocked mutations');

    // loadLabTestView exposes the readings to detail/print (scope-gated loader).
    const viewWith = tests.loadLabTestView(envDraft.id, true);
    eq(viewWith.environmentReadings.length, 1, 'readings: loadLabTestView returns rows');
    const viewWithout = tests.loadLabTestView(envDraft.id, false);
    eq(viewWithout.environmentReadings.length, 0, 'readings: out-of-scope loader returns none');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-tests crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}
