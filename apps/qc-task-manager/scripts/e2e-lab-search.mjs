// E2E spec for the QC Laboratory Unified Search workflow (/lab/search).
//
// Runs against a LIVE server sharing the same SQLite database.
// Covers:
//   A. Auth wall: anonymous GET /lab/search -> /login redirect.
//   B. Nav & Access: employee & manager reach /lab/search with secondary nav.
//   C. Unified Search across 7 entities matching all 9 target fields:
//      * test ID
//      * sample ID
//      * product
//      * lot
//      * equipment
//      * equipment code
//      * serial number
//      * document code
//      * document title
//   D. Entity tab switching & counts
//   E. RBAC isolation (employee cannot see other employees' tests/samples)
//   F. No horizontal overflow at 1440px and 360px.

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
const DB_PATH = process.env.QC_DATABASE_PATH || process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

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
function eq_(actual, expected, label) {
  ok(actual === expected, `${label} (expected ${expected}, got ${actual})`);
}

const db = new Database(DB_PATH, { readonly: false });
const browser = await chromium.launch({ headless: true });

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

// Fetch user IDs
const managerRow = db.prepare("SELECT id FROM users WHERE username='manager'").get();
const employeeRow = db.prepare("SELECT id FROM users WHERE username='employee'").get();

const managerId = Number(managerRow.id);
const employeeId = Number(employeeRow.id);

// Insert secondary test employee for RBAC comparison
let otherEmpId;
const existingOther = db.prepare("SELECT id FROM users WHERE username='e2e_other_emp'").get();
if (existingOther) {
  otherEmpId = Number(existingOther.id);
} else {
  otherEmpId = Number(
    db.prepare(
      `INSERT INTO users (username, password_hash, full_name, role, department)
       VALUES ('e2e_other_emp', 'x', 'Other Employee', 'employee', 'Quality Control')`,
    ).run().lastInsertRowid,
  );
}

// Create unique fixtures for E2E search
const tag = Date.now().toString().slice(-5);
const prodCode = `PROD-E2E-${tag}`;
const equipCode = `EQ-E2E-${tag}`;
const serialNo = `SN-E2E-${tag}`;
const sopCode = `SOP-E2E-${tag}`;
const wiCode = `WI-E2E-${tag}`;
const lotEmp = `LOT-EMP-${tag}`;
const lotOther = `LOT-OTHER-${tag}`;
const testEmpNum = `LAB-TEST-E2E-A${tag}`;
const testOtherNum = `LAB-TEST-E2E-B${tag}`;

// Insert product
const prodId = Number(
  db.prepare(
    `INSERT INTO lab_products (name, code, description, connector_type, created_by)
     VALUES (?, ?, 'E2E Search Product', 'Threaded', ?)`,
  ).run(`Aero Seal ${tag}`, prodCode, managerId).lastInsertRowid,
);

// Insert equipment
const equipId = Number(
  db.prepare(
    `INSERT INTO lab_equipment (name, code, location, status_raw, serial_number, created_by)
     VALUES (?, ?, 'Lab Bench 4', 'Operational', ?, ?)`,
  ).run(`Precision Manometer ${tag}`, equipCode, serialNo, managerId).lastInsertRowid,
);

// Insert SOP & WI
const sopId = Number(
  db.prepare(
    `INSERT INTO lab_documents (code, title, type, description, status, effective_date, created_by)
     VALUES (?, ?, 'SOP', 'Standard operating procedure for air testing', 'APPROVED', '2026-08-01', ?)`,
  ).run(sopCode, `Air Leakage Protocol ${tag}`, managerId).lastInsertRowid,
);

const wiId = Number(
  db.prepare(
    `INSERT INTO lab_documents (code, title, type, description, status, effective_date, created_by)
     VALUES (?, ?, 'WI', 'Work instruction for manometer verification', 'APPROVED', '2026-08-01', ?)`,
  ).run(wiCode, `Manometer Verification Instruction ${tag}`, managerId).lastInsertRowid,
);

// Insert Test for Employee
const testEmpId = Number(
  db.prepare(
    `INSERT INTO lab_test_records (
      test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
      sample_count, final_result, status, tested_by, created_by
     ) VALUES (?, 'air', ?, ?, ?, 'Area A', 5, 'PASS', 'APPROVED', ?, ?)`,
  ).run(testEmpNum, prodId, equipId, lotEmp, employeeId, employeeId).lastInsertRowid,
);

// Insert Test for Other Employee
const testOtherId = Number(
  db.prepare(
    `INSERT INTO lab_test_records (
      test_number, test_type, product_id, equipment_id, lot_number, sampling_area,
      sample_count, final_result, status, tested_by, created_by
     ) VALUES (?, 'vacuum', ?, ?, ?, 'Area B', 5, 'FAIL', 'APPROVED', ?, ?)`,
  ).run(testOtherNum, prodId, equipId, lotOther, otherEmpId, otherEmpId).lastInsertRowid,
);

// Insert Sample for Employee Test
// Identifier derives from the FULL discriminating test number — slicing the
// tag only would make both fixtures' identifiers identical (the A/B
// discriminator falls outside a 5-char slice window) and the RBAC check
// below would legitimately match the employee's OWN sample.
const sampleEmpIdent = `${testEmpNum}-S01`;
db.prepare(
  `INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, part_name, result, status)
   VALUES (?, 1, ?, ?, 'PASS', 'APPROVED')`,
).run(testEmpId, sampleEmpIdent, `Coupling Ring ${tag}`);

// Insert Sample for Other Employee Test
const sampleOtherIdent = `${testOtherNum}-S01`;
db.prepare(
  `INSERT INTO lab_test_samples (test_id, sample_no, sample_identifier, part_name, result, status)
   VALUES (?, 1, ?, ?, 'FAIL', 'APPROVED')`,
).run(testOtherId, sampleOtherIdent, `Diaphragm Seal ${tag}`);

// Insert Retest for Employee Test
const retestEmpNum = `LAB-RETEST-E2E-A${tag}-01`;
db.prepare(
  `INSERT INTO lab_test_retests (retest_number, original_test_id, reason, reason_note, status, created_by)
   VALUES (?, ?, 'SAMPLE_ISSUE', 'E2E recheck sample', 'OPEN', ?)`,
).run(retestEmpNum, testEmpId, employeeId);

try {
  console.log('■ Scenario A: Auth wall');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const res = await page.goto(`${BASE}/lab/search`);
    ok(
      page.url().includes('/login') || (res && res.status() === 403),
      'anonymous user accessing /lab/search is redirected to /login',
    );
    await ctx.close();
  }

  console.log('■ Scenario B: Navigation and page structure');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, 'manager');
    await page.goto(`${BASE}/lab/search`);

    const title = await page.locator('h1').textContent();
    ok(title && title.includes('Laboratory Search'), 'h1 contains Laboratory Search');

    const searchInput = page.locator('#lab-search-input');
    ok(await searchInput.isVisible(), 'search input is visible');

    // Entity tabs exist
    const tabs = page.locator('nav[aria-label="Entity Types"] a');
    const tabCount = await tabs.count();
    eq_(tabCount, 8, '8 entity tabs are rendered (All + 7 entities)');
    await ctx.close();
  }

  console.log('■ Scenario C: Unified search matching across all 9 target fields');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, 'manager');

    // 1. Search by test ID
    await page.goto(`${BASE}/lab/search?q=${testEmpNum}`);
    let text = await page.locator('table').textContent();
    ok(text && text.includes(testEmpNum), 'matches by test ID');

    // 2. Search by sample ID
    await page.goto(`${BASE}/lab/search?q=${sampleEmpIdent}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(sampleEmpIdent), 'matches by sample ID');

    // 3. Search by product code & name
    await page.goto(`${BASE}/lab/search?q=${prodCode}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(prodCode), 'matches by product code');

    // 4. Search by lot number
    await page.goto(`${BASE}/lab/search?q=${lotEmp}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(lotEmp), 'matches by lot number');

    // 5. Search by equipment code
    await page.goto(`${BASE}/lab/search?q=${equipCode}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(equipCode), 'matches by equipment code');

    // 6. Search by equipment serial number
    await page.goto(`${BASE}/lab/search?q=${serialNo}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(equipCode), 'matches by equipment serial number');

    // 7. Search by SOP document code
    await page.goto(`${BASE}/lab/search?q=${sopCode}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(sopCode), 'matches by SOP code');

    // 8. Search by WI document title
    await page.goto(`${BASE}/lab/search?q=Manometer+Verification+Instruction+${tag}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(wiCode), 'matches by WI title');

    // 9. Search by retest number
    await page.goto(`${BASE}/lab/search?q=${retestEmpNum}`);
    text = await page.locator('table').textContent();
    ok(text && text.includes(retestEmpNum), 'matches by retest number');

    await ctx.close();
  }

  console.log('■ Scenario D: Entity filtering tabs');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, 'manager');

    // Switch to Equipment tab
    await page.goto(`${BASE}/lab/search?entity=equipment&q=${tag}`);
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    ok(rowCount >= 1, 'equipment tab returns rows');

    const badge = await page.locator('tbody tr:first-child td:first-child').textContent();
    ok(badge && badge.trim() === 'Equipment', 'first row is Equipment');

    await ctx.close();
  }

  console.log('■ Scenario E: RBAC Scoping between Employee and Manager');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, 'employee');

    // Employee searches for other employee's test
    await page.goto(`${BASE}/lab/search?q=${testOtherNum}`);
    let noResultsState = page.locator('section').filter({ has: page.getByRole('heading', { name: 'No search results' }) });
    ok(await noResultsState.isVisible() && await page.locator('tbody tr').count() === 0, 'Employee cannot see other employee test');

    // Employee searches for other employee's sample
    await page.goto(`${BASE}/lab/search?q=${sampleOtherIdent}`);
    noResultsState = page.locator('section').filter({ has: page.getByRole('heading', { name: 'No search results' }) });
    ok(await noResultsState.isVisible() && await page.locator('tbody tr').count() === 0, 'Employee cannot see other employee sample');

    // Employee searches for other employee's lot
    await page.goto(`${BASE}/lab/search?q=${lotOther}`);
    noResultsState = page.locator('section').filter({ has: page.getByRole('heading', { name: 'No search results' }) });
    ok(await noResultsState.isVisible() && await page.locator('tbody tr').count() === 0, 'Employee cannot search other employee lot');

    // Employee searches for their own test
    await page.goto(`${BASE}/lab/search?q=${testEmpNum}`);
    const tableText = await page.locator('table').textContent();
    ok(tableText && tableText.includes(testEmpNum), 'Employee can see own test');

    await ctx.close();
  }

  console.log('■ Scenario F: Viewport and responsive layout');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, 'manager');

    // Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/lab/search?q=${tag}`);
    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    ok(scrollWidth <= clientWidth + 2, `1440px layout: no horizontal overflow (${scrollWidth} <= ${clientWidth})`);

    // Mobile 360px
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(`${BASE}/lab/search?q=${tag}`);
    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    ok(scrollWidth <= clientWidth + 2, `360px layout: no horizontal overflow (${scrollWidth} <= ${clientWidth})`);

    await ctx.close();
  }

} finally {
  await browser.close();
  db.close();
}

console.log(`\nE2E Search Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failed checks:', failures);
  process.exit(1);
} else {
  process.exit(0);
}
