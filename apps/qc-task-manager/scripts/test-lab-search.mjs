// Database-backed unit checks for QC Laboratory Unified Search
// (/lab/search, src/lib/lab/search.ts).
//
// Verifies:
//   - Filter parsing & serialization
//   - Pure SQL builder parameterization (zero string interpolation)
//   - Cross-entity search across all 7 entities:
//     * tests (lab_test_records)
//     * samples (lab_test_samples)
//     * products (lab_products)
//     * equipment (lab_equipment)
//     * SOPs (lab_documents type='SOP')
//     * WIs (lab_documents type='WI')
//     * retests (lab_test_retests)
//   - Search matching across all 9 fields:
//     * test ID (test_number, id)
//     * sample ID (sample_identifier, sample_no)
//     * product (name, code)
//     * lot (lot_number)
//     * equipment (name)
//     * equipment code (code)
//     * serial number (serial_number)
//     * document code (code)
//     * document title (title)
//   - Strict RBAC scoping (employees only see their own tests/samples/retests,
//     zero data leakage in rows or total counts)
//   - Pagination & entity filter switching

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-search-'));
const dbPath = join(tempDir, 'lab-search.db');

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

process.env.QC_DATABASE_PATH = dbPath;

const { getDb } = await import('../src/lib/db.ts');
const {
  escapeLike,
  parseLabSearchFilters,
  hasLabSearchFilters,
  labSearchFiltersToQuery,
  buildLabSearchQueries,
  searchLab,
} = await import('../src/lib/lab/search.ts');

const db = getDb();

try {
  console.log('■ 1. Filter parser and query serializer');
  {
    const empty = parseLabSearchFilters(new URL('http://localhost/lab/search'));
    eq(empty.q, null, 'empty url -> q is null');
    eq(empty.entity, 'all', 'empty url -> entity is all');
    eq(empty.page, 1, 'empty url -> page 1');
    eq(empty.per_page, 25, 'empty url -> per_page 25');
    eq(hasLabSearchFilters(empty), false, 'empty url has no filters');
    eq(labSearchFiltersToQuery(empty), '', 'empty filters -> empty qs');

    const filled = parseLabSearchFilters(
      new URL('http://localhost/lab/search?q=ABC-123&entity=equipment&page=3&per=50'),
    );
    eq(filled.q, 'ABC-123', 'parses q');
    eq(filled.entity, 'equipment', 'parses entity');
    eq(filled.page, 3, 'parses page');
    eq(filled.per_page, 50, 'parses per_page');
    eq(hasLabSearchFilters(filled), true, 'has filters is true');

    const qs = labSearchFiltersToQuery(filled);
    ok(qs.includes('q=ABC-123'), 'qs contains q');
    ok(qs.includes('entity=equipment'), 'qs contains entity');
    ok(qs.includes('page=3'), 'qs contains page');
    ok(qs.includes('per=50'), 'qs contains per');

    // Invalid parameters fall back safely
    const invalid = parseLabSearchFilters(
      new URL('http://localhost/lab/search?entity=unknown_entity&page=-9&per=999'),
    );
    eq(invalid.entity, 'all', 'invalid entity drops to default all');
    eq(invalid.page, 1, 'negative page drops to default 1');
    eq(invalid.per_page, 25, 'unsupported per_page drops to default 25');
  }

  console.log('■ 2. LIKE escaping & Parameterized SQL Builder');
  {
    eq(escapeLike('test%_val\\ue'), 'test\\%\\_val\\\\ue', 'escapeLike escapes %, _, and \\');

    const queries = buildLabSearchQueries(
      { q: 'test%123', entity: 'all', page: 1, per_page: 25 },
      { role: 'manager', userId: 1 },
    );

    // Combined query parameter count matches ? placeholders
    const questionMarks = (queries.combinedSql.match(/\?/g) || []).length;
    eq(questionMarks, queries.combinedParams.length, 'combinedSql placeholder count matches params');

    // Count query placeholder count matches params
    const countMarks = (queries.countSql.match(/\?/g) || []).length;
    eq(countMarks, queries.countParams.length, 'countSql placeholder count matches params');

    // Raw user string is never in SQL text
    ok(!queries.combinedSql.includes('test%123'), 'raw query not in combinedSql text');
    ok(!queries.countSql.includes('test%123'), 'raw query not in countSql text');
  }

  console.log('■ 3. Seed data for cross-entity search testing');
  let managerId, empAId, empBId, prodAId, prodBId, equipAId, equipBId, sopId, wiId, testAId, testBId;

  {
    // Insert test users
    managerId = db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role, department)
       VALUES ('search_mgr', 'x', 'Search Manager', 'manager', 'Quality Control')`,
    ).run().lastInsertRowid;

    empAId = db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role, department)
       VALUES ('search_emp_a', 'x', 'Employee Alpha', 'employee', 'Quality Control')`,
    ).run().lastInsertRowid;

    empBId = db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role, department)
       VALUES ('search_emp_b', 'x', 'Employee Beta', 'employee', 'Quality Control')`,
    ).run().lastInsertRowid;

    // Insert products
    prodAId = db.prepare(
      `INSERT INTO lab_products (name, code, description, connector_type, created_by)
       VALUES ('Aero Valve Core', 'PROD-AERO-01', 'High pressure aviation valve', 'Locking threaded', ?)`,
    ).run(managerId).lastInsertRowid;

    prodBId = db.prepare(
      `INSERT INTO lab_products (name, code, description, connector_type, created_by)
       VALUES ('Hydro Seal Ring', 'PROD-HYDR-02', 'Hydraulic sealing component', 'Bayonet quick', ?)`,
    ).run(managerId).lastInsertRowid;

    // Insert equipment
    equipAId = db.prepare(
      `INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by)
       VALUES ('Digital Pressure Gauge', 'EQ-DPG-100', 'Bench 1A', 'Operational', 'SN-PG-889900', ?)`,
    ).run(managerId).lastInsertRowid;

    equipBId = db.prepare(
      `INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by)
       VALUES ('Vacuum Chamber Pro', 'EQ-VCP-200', 'Room 2B', 'Operational', 'SN-VC-112233', ?)`,
    ).run(managerId).lastInsertRowid;

    // Insert documents (SOP & WI)
    sopId = db.prepare(
      `INSERT INTO lab_documents (code, title, type, description, status, effective_date, created_by)
       VALUES ('SOP-AIR-001', 'Standard Air Leak Testing Method', 'SOP', 'Standard operating procedure for air testing', 'APPROVED', '2026-08-01', ?)`,
    ).run(managerId).lastInsertRowid;

    wiId = db.prepare(
      `INSERT INTO lab_documents (code, title, type, description, status, effective_date, created_by)
       VALUES ('WI-CAL-002', 'Gauge Calibration Verification Guide', 'WI', 'Work instruction for daily gauge calibration', 'APPROVED', '2026-08-01', ?)`,
    ).run(managerId).lastInsertRowid;

    // Insert test records (Test A by empA, Test B by empB)
    testAId = db.prepare(
      `INSERT INTO lab_test_records (
        test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
        sample_count, final_result, status, tested_by, created_by
       ) VALUES ('LAB-TEST-90001', 'air', ?, ?, 'LOT-AERO-X9', 'Area 1', 5, 'PASS', 'APPROVED', ?, ?)`,
    ).run(prodAId, equipAId, empAId, empAId).lastInsertRowid;

    testBId = db.prepare(
      `INSERT INTO lab_test_records (
        test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
        sample_count, final_result, status, tested_by, created_by
       ) VALUES ('LAB-TEST-90002', 'vacuum', ?, ?, 'LOT-HYDR-Y8', 'Area 2', 5, 'FAIL', 'APPROVED', ?, ?)`,
    ).run(prodBId, equipBId, empBId, empBId).lastInsertRowid;

    // Insert samples for tests
    db.prepare(
      `INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, part_name, result, status)
       VALUES (?, 1, 'LAB-TEST-90001-S01', 'Inlet Valve Stem', 'PASS', 'APPROVED')`,
    ).run(testAId);

    db.prepare(
      `INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, part_name, result, status)
       VALUES (?, 1, 'LAB-TEST-90002-S01', 'Gasket Ring B', 'FAIL', 'APPROVED')`,
    ).run(testBId);

    // Insert retests
    db.prepare(
      `INSERT INTO lab_test_retests (retest_number, original_test_id, reason, reason_note, status, created_by)
       VALUES ('LAB-RETEST-90001-01', ?, 'SAMPLE_ISSUE', 'Re-check inlet stem', 'OPEN', ?)`,
    ).run(testAId, empAId);

    db.prepare(
      `INSERT INTO lab_test_retests (retest_number, original_test_id, reason, reason_note, status, created_by)
       VALUES ('LAB-RETEST-90002-01', ?, 'FAIL', 'Verify gasket failure', 'OPEN', ?)`,
    ).run(testBId, empBId);

    ok(true, 'Seed data created successfully');
  }

  console.log('■ 4. Search matching across all 9 target fields');
  const mgrCtx = { role: 'manager', userId: managerId };

  // 1. test ID
  {
    const res = searchLab({ q: 'LAB-TEST-90001', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    const types = res.items.map((i) => i.entity_type);
    ok(types.includes('test'), 'test ID matches test entity');
    ok(types.includes('sample'), 'test ID matches sample entity');
    ok(types.includes('retest'), 'test ID matches retest entity');
  }

  // 2. sample ID
  {
    const res = searchLab({ q: 'LAB-TEST-90001-S01', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    eq(res.items.length, 1, 'sample ID uniquely matches sample');
    eq(res.items[0].entity_type, 'sample', 'entity is sample');
    eq(res.items[0].identifier, 'LAB-TEST-90001-S01', 'identifier matches');
  }

  // 3. product name & code
  {
    const resName = searchLab({ q: 'Aero Valve', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(resName.items.some((i) => i.entity_type === 'product'), 'product name matches product');
    ok(resName.items.some((i) => i.entity_type === 'test'), 'product name matches test');

    const resCode = searchLab({ q: 'PROD-HYDR-02', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(resCode.items.some((i) => i.entity_type === 'product'), 'product code matches product');
  }

  // 4. lot
  {
    const res = searchLab({ q: 'LOT-AERO-X9', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(res.items.some((i) => i.entity_type === 'test'), 'lot matches test');
    ok(res.items.some((i) => i.entity_type === 'sample'), 'lot matches sample');
  }

  // 5. equipment name
  {
    const res = searchLab({ q: 'Digital Pressure Gauge', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(res.items.some((i) => i.entity_type === 'equipment'), 'equipment name matches equipment');
    ok(res.items.some((i) => i.entity_type === 'test'), 'equipment name matches test');
  }

  // 6. equipment code
  {
    const res = searchLab({ q: 'EQ-VCP-200', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(res.items.some((i) => i.entity_type === 'equipment'), 'equipment code matches equipment');
  }

  // 7. serial number
  {
    const res = searchLab({ q: 'SN-PG-889900', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    eq(res.items.length, 1, 'serial number matches equipment');
    eq(res.items[0].entity_type, 'equipment', 'entity is equipment');
    eq(res.items[0].identifier, 'EQ-DPG-100', 'matches gauge');
  }

  // 8. document code (SOP and WI)
  {
    const resSop = searchLab({ q: 'SOP-AIR-001', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(resSop.items.some((i) => i.entity_type === 'sop'), 'document code matches SOP');

    const resWi = searchLab({ q: 'WI-CAL-002', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(resWi.items.some((i) => i.entity_type === 'wi'), 'document code matches WI');
  }

  // 9. document title
  {
    const resSopTitle = searchLab({ q: 'Air Leak Testing Method', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(resSopTitle.items.some((i) => i.entity_type === 'sop'), 'document title matches SOP');

    const resWiTitle = searchLab({ q: 'Gauge Calibration Verification', entity: 'all', page: 1, per_page: 25 }, mgrCtx);
    ok(resWiTitle.items.some((i) => i.entity_type === 'wi'), 'document title matches WI');
  }

  console.log('■ 5. Entity category filter switching');
  {
    const allTests = searchLab({ q: null, entity: 'tests', page: 1, per_page: 25 }, mgrCtx);
    ok(allTests.items.every((i) => i.entity_type === 'test'), 'entity: tests returns only tests');

    const allSamples = searchLab({ q: null, entity: 'samples', page: 1, per_page: 25 }, mgrCtx);
    ok(allSamples.items.every((i) => i.entity_type === 'sample'), 'entity: samples returns only samples');

    const allProducts = searchLab({ q: null, entity: 'products', page: 1, per_page: 25 }, mgrCtx);
    ok(allProducts.items.every((i) => i.entity_type === 'product'), 'entity: products returns only products');

    const allEquipment = searchLab({ q: null, entity: 'equipment', page: 1, per_page: 25 }, mgrCtx);
    ok(allEquipment.items.every((i) => i.entity_type === 'equipment'), 'entity: equipment returns only equipment');

    const allSops = searchLab({ q: null, entity: 'sops', page: 1, per_page: 25 }, mgrCtx);
    ok(allSops.items.every((i) => i.entity_type === 'sop'), 'entity: sops returns only sops');

    const allWis = searchLab({ q: null, entity: 'wis', page: 1, per_page: 25 }, mgrCtx);
    ok(allWis.items.every((i) => i.entity_type === 'wi'), 'entity: wis returns only wis');

    const allRetests = searchLab({ q: null, entity: 'retests', page: 1, per_page: 25 }, mgrCtx);
    ok(allRetests.items.every((i) => i.entity_type === 'retest'), 'entity: retests returns only retests');
  }

  console.log('■ 6. RBAC Filtering & Privacy Protection');
  {
    const empACtx = { role: 'employee', userId: empAId };
    const empBCtx = { role: 'employee', userId: empBId };

    // Employee A searches for Employee B's test
    const resAOnB = searchLab({ q: 'LAB-TEST-90002', entity: 'all', page: 1, per_page: 25 }, empACtx);
    eq(resAOnB.items.length, 0, 'Employee A cannot see Employee B test');
    eq(resAOnB.counts.tests, 0, 'Employee A test count for Employee B test query is 0');
    eq(resAOnB.counts.samples, 0, 'Employee A sample count for Employee B test query is 0');

    // Employee A searches for Employee B's sample
    const resAOnBSample = searchLab({ q: 'Gasket Ring B', entity: 'all', page: 1, per_page: 25 }, empACtx);
    eq(resAOnBSample.items.length, 0, 'Employee A cannot see Employee B sample');

    // Employee A searches for Employee B's lot
    const resAOnBLot = searchLab({ q: 'LOT-HYDR-Y8', entity: 'all', page: 1, per_page: 25 }, empACtx);
    eq(resAOnBLot.items.length, 0, 'Employee A cannot search by Employee B lot');

    // Employee A searches for their own test
    const resAOnOwn = searchLab({ q: 'LAB-TEST-90001', entity: 'all', page: 1, per_page: 25 }, empACtx);
    ok(resAOnOwn.items.some((i) => i.entity_type === 'test'), 'Employee A can see own test');
    ok(resAOnOwn.items.some((i) => i.entity_type === 'sample'), 'Employee A can see own sample');

    // Employee A can still search products, equipment, SOPs, WIs (all roles allowed)
    const resDocs = searchLab({ q: 'Air Leak Testing', entity: 'sops', page: 1, per_page: 25 }, empACtx);
    eq(resDocs.items.length, 1, 'Employee A can view approved SOP');

    // Manager can see both tests
    const mgrTests = searchLab({ q: 'LAB-TEST-9000', entity: 'tests', page: 1, per_page: 25 }, mgrCtx);
    eq(mgrTests.items.length, 2, 'Manager sees all test records');
  }

  console.log('■ 7. Pagination and Bounds');
  {
    const page1 = searchLab({ q: null, entity: 'all', page: 1, per_page: 2 }, mgrCtx);
    eq(page1.items.length, 2, 'returns exact per_page count');
    eq(page1.page, 1, 'page is 1');
    ok(page1.total_pages >= 4, 'total_pages computed correctly');

    const page2 = searchLab({ q: null, entity: 'all', page: 2, per_page: 2 }, mgrCtx);
    eq(page2.items.length, 2, 'page 2 returns next 2 items');
    ok(page1.items[0].identifier !== page2.items[0].identifier, 'pages return different items');

    // Clamping on out-of-range page
    const clamped = searchLab({ q: null, entity: 'all', page: 9999, per_page: 25 }, mgrCtx);
    ok(clamped.page <= clamped.total_pages, 'page clamped to max total_pages');
  }

} finally {
  try {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failed checks:', failures);
  process.exit(1);
} else {
  process.exit(0);
}
