// Database-backed unit checks for the QC Laboratory Product Master
// (src/lib/lab/products.ts — PROMPT 08, /lab/products).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Focus: the fully-parameterized list search
// (no user text in SQL, whitelisted sort, LIKE escaping), create/update
// transactions covering the lab_product_equipment link table, code-conflict
// detection, reference-existence validation, audit rows on the shared
// qc_audit_log, and the read surface (detail + product references for the
// test form).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-products-'));
const dbPath = join(tempDir, 'lab-products.db');

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

function fakeUrl(qs = '') {
  return new URL(`https://qc.local/lab/products${qs}`);
}

let db;
let managerId;

function formData(overrides = {}) {
  return {
    name: 'Luer Lock Syringe',
    code: 'PRD-001',
    description: '10 mL luer lock syringe',
    connector_type: 'Locking connector with fixed threads',
    default_test_type: 'air',
    default_template_id: null,
    applicable_sop_id: null,
    applicable_wi_id: null,
    equipment_ids: [],
    is_active: true,
    notes: null,
    ...overrides,
  };
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
  const products = await import('../src/lib/lab/products.ts');

  db = getDb();
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);

  // ── Filter parsing / querystring round-trip ──
  console.log('■ Filter parsing');
  {
    const f = products.parseLabProductSearchFilters(fakeUrl('?q=seal&type=air&active=1&sort=code&dir=asc&page=2&per=50'));
    eq(f.q, 'seal', 'parse: q');
    eq(f.default_test_type, 'air', 'parse: type');
    eq(f.active, '1', 'parse: active');
    eq(f.sort, 'code', 'parse: sort');
    eq(f.dir, 'asc', 'parse: dir');
    eq(f.page, 2, 'parse: page');
    eq(f.per_page, 50, 'parse: per_page');
    const bad = products.parseLabProductSearchFilters(fakeUrl('?type=bogus&active=x&sort=;DROP&dir=up&page=-1&per=7'));
    eq(bad.default_test_type, null, 'parse: bogus type dropped');
    eq(bad.active, null, 'parse: bogus active dropped');
    eq(bad.sort, products.DEFAULT_LAB_PRODUCT_SORT, 'parse: bogus sort falls back to default');
    eq(bad.dir, products.DEFAULT_LAB_PRODUCT_DIR, 'parse: bogus dir falls back to default');
    eq(bad.page, 1, 'parse: negative page dropped');
    eq(bad.per_page, products.DEFAULT_LAB_PRODUCT_PER_PAGE, 'parse: non-allowlisted per dropped');
    ok(products.hasLabProductFilters(f), 'hasFilters: true with q');
    ok(!products.hasLabProductFilters(products.NO_LAB_PRODUCT_FILTERS), 'hasFilters: false with none');
    const qs = products.labProductFiltersToQuery(f);
    ok(qs.includes('q=seal') && qs.includes('type=air') && qs.includes('sort=code'), 'querystring: rebuilt');
    ok(products.labProductFiltersToQuery(products.NO_LAB_PRODUCT_FILTERS) === '', 'querystring: empty for defaults');
  }

  // ── WHERE builder is fully parameterized ──
  console.log('■ WHERE builder');
  {
    const f = { ...products.NO_LAB_PRODUCT_FILTERS, q: "50%; DROP TABLE lab_products --_x" };
    const { sql, params } = products.buildLabProductWhere(f);
    ok(!sql.includes('50%'), 'WHERE: user text never appears in SQL');
    ok(params.length === 3 && params.every((p) => typeof p === 'string'), 'WHERE: three LIKE params bound');
    ok(products.buildLabProductWhere(products.NO_LAB_PRODUCT_FILTERS).sql === '', 'WHERE: empty for no filters');
    const esc = products.escapeProductLike('a\\b%c_d');
    eq(esc, 'a\\\\b\\%c\\_d', 'escapeLike: wildcards escaped');
  }

  // ── Create ──
  console.log('■ Create');
  let productId;
  {
    const r1 = db.prepare("INSERT INTO lab_equipment (name, code, status_raw, created_by) VALUES ('Rig A', 'EQ-A', 'IN_USE', ?)").run(managerId);
    const r2 = db.prepare("INSERT INTO lab_equipment (name, code, status_raw, created_by) VALUES ('Rig B', 'EQ-B', 'IN_USE', ?)").run(managerId);
    const eqA = Number(r1.lastInsertRowid);
    const eqB = Number(r2.lastInsertRowid);

    productId = products.createLabProduct(formData({ equipment_ids: [eqA, eqB, eqA] }), managerId);
    ok(Number.isInteger(productId) && productId > 0, 'create: returns id');

    const row = db.prepare('SELECT * FROM lab_products WHERE id = ?').get(productId);
    eq(row.name, 'Luer Lock Syringe', 'create: name stored');
    eq(row.is_active, 1, 'create: active by default');
    const links = db.prepare('SELECT equipment_id FROM lab_product_equipment WHERE product_id = ? ORDER BY equipment_id').all(productId);
    eq(links.length, 2, 'create: duplicate equipment ids deduplicated');
    eq(Number(links[0].equipment_id), eqA, 'create: link A');
    eq(Number(links[1].equipment_id), eqB, 'create: link B');

    const audits = db.prepare("SELECT action, actor_id FROM qc_audit_log WHERE entity_type='LAB_PRODUCT' AND entity_id = ? ORDER BY id").all(productId);
    eq(audits.length, 1, 'create: exactly one audit row');
    eq(audits[0].action, 'CREATE', 'create: audit action CREATE');
    eq(Number(audits[0].actor_id), managerId, 'create: audit actor');
  }

  // ── Code conflicts ──
  console.log('■ Code conflicts');
  {
    let threw = null;
    try {
      products.createLabProduct(formData({ name: 'Other', code: 'prd-001' }), managerId);
    } catch (err) {
      threw = err;
    }
    ok(threw instanceof products.LabProductCodeConflictError, 'create: case-insensitive code conflict rejected');
    let threwSame = null;
    try {
      products.updateLabProduct(productId, formData({ code: 'PRD-999' }), managerId);
      products.updateLabProduct(productId, formData({ code: 'prd-999' }), managerId);
    } catch (err) {
      threwSame = err;
    }
    ok(threwSame === null, 'update: same product may keep/rename its own code case-insensitively');
    let dup = null;
    db.prepare("INSERT INTO lab_products (name, code, is_active, created_by) VALUES ('Second', 'PRD-002', 1, ?)").run(managerId);
    try {
      products.updateLabProduct(productId, formData({ code: 'PRD-002' }), managerId);
    } catch (err) {
      dup = err;
    }
    ok(dup instanceof products.LabProductCodeConflictError, 'update: renaming onto another code rejected');
  }

  // ── Reference existence ──
  console.log('■ Reference validation');
  {
    let threw = null;
    try {
      products.createLabProduct(formData({ code: 'PRD-003', default_template_id: 999999 }), managerId);
    } catch (err) {
      threw = err;
    }
    ok(threw instanceof Error && !(threw instanceof products.LabProductCodeConflictError) && /template/i.test(threw.message), 'create: nonexistent template rejected');
    let threwEq = null;
    try {
      products.createLabProduct(formData({ code: 'PRD-004', equipment_ids: [424242] }), managerId);
    } catch (err) {
      threwEq = err;
    }
    ok(threwEq instanceof Error && /equipment/i.test(threwEq.message), 'create: nonexistent equipment rejected');
    eq(
      db.prepare('SELECT COUNT(*) AS n FROM lab_products WHERE code IN (?,?)').get('PRD-003', 'PRD-004').n,
      0,
      'validation: failed creates leave no rows (transaction rolled back)',
    );
  }

  // ── Update (fields + links + audit) ──
  console.log('■ Update');
  {
    const eqB = Number(db.prepare("SELECT id FROM lab_equipment WHERE code='EQ-B'").get().id);
    products.updateLabProduct(productId, formData({ code: 'PRD-001', name: 'Luer Lock Syringe v2', connector_type: null, equipment_ids: [eqB], is_active: false, notes: 'retired packaging' }), managerId);
    const row = db.prepare('SELECT * FROM lab_products WHERE id = ?').get(productId);
    eq(row.name, 'Luer Lock Syringe v2', 'update: name changed');
    eq(row.connector_type, null, 'update: connector cleared');
    eq(row.is_active, 0, 'update: deactivated');
    const links = db.prepare('SELECT equipment_id FROM lab_product_equipment WHERE product_id = ?').all(productId);
    eq(links.length, 1, 'update: links replaced (full swap)');
    eq(Number(links[0].equipment_id), eqB, 'update: only EQ-B remains');
    const audits = db.prepare("SELECT action FROM qc_audit_log WHERE entity_type='LAB_PRODUCT' AND entity_id = ? ORDER BY id").all(productId);
    eq(audits.map((a) => a.action).join(','), 'CREATE,UPDATE,UPDATE,UPDATE', 'update: audit trail (CREATE + prior renames + this UPDATE)');
  }

  // ── Detail + equipment ids ──
  console.log('■ Detail');
  {
    const detail = products.getLabProductDetail(productId);
    ok(detail !== null, 'detail: found');
    eq(detail.product.code, 'PRD-001', 'detail: code');
    eq(detail.equipment.length, 1, 'detail: one related equipment');
    eq(detail.test_count, 0, 'detail: zero usage');
    eq(products.getLabProductDetail(999999), null, 'detail: missing id → null');
    eq(products.getLabProductDetail(-1), null, 'detail: invalid id → null');
    eq(products.getLabProductEquipmentIds(productId).length, 1, 'detail: equipment id list');
  }

  // ── Search ──
  console.log('■ Search');
  {
    db.prepare("INSERT INTO lab_products (name, code, description, connector_type, default_test_type, is_active, created_by) VALUES ('Seal Gasket', 'PRD-010', '100% silicone gasket', 'Non-locking (Lipid connector)', 'vacuum', 1, ?)").run(managerId);
    const all = products.searchLabProducts(products.NO_LAB_PRODUCT_FILTERS);
    eq(all.total, 3, 'search: total counts every product');
    ok(all.total_pages >= 1 && all.page === 1, 'search: pagination defaults');

    const byName = products.searchLabProducts({ ...products.NO_LAB_PRODUCT_FILTERS, q: 'gasket' });
    eq(byName.total, 1, 'search: q matches name');
    eq(byName.rows[0].code, 'PRD-010', 'search: correct row');

    // 100% in the description is a LIKE wildcard — must match literally.
    const byWildcard = products.searchLabProducts({ ...products.NO_LAB_PRODUCT_FILTERS, q: '100% silicone' });
    eq(byWildcard.total, 1, 'search: LIKE wildcards in input escaped');

    const inactive = products.searchLabProducts({ ...products.NO_LAB_PRODUCT_FILTERS, active: '0' });
    eq(inactive.total, 1, 'search: active=0 filter');
    eq(inactive.rows[0].code, 'PRD-001', 'search: inactive row listed');
    const vac = products.searchLabProducts({ ...products.NO_LAB_PRODUCT_FILTERS, default_test_type: 'vacuum' });
    eq(vac.total, 1, 'search: type filter');
    const sorted = products.searchLabProducts({ ...products.NO_LAB_PRODUCT_FILTERS, sort: 'code', dir: 'asc' });
    eq(sorted.rows[0].code, 'PRD-001', 'search: whitelisted sort by code');

    // Sort injection attempt: a non-allowlisted field falls back at parse time.
    const forged = products.parseLabProductSearchFilters(fakeUrl('?sort=code; DROP TABLE lab_products'));
    eq(forged.sort, products.DEFAULT_LAB_PRODUCT_SORT, 'search: injected sort dropped to the default at parse');
  }

  // ── Test-form references (populate suggestions) ──
  console.log('■ Product references');
  {
    const refs = products.listLabProductReferences();
    eq(refs.length, 2, 'references: only active products listed');
    ok(refs.every((r) => r.code !== 'PRD-001'), 'references: inactive product excluded');
    ok(refs.some((r) => r.code === 'PRD-010' && r.connector_type === 'Non-locking (Lipid connector)'), 'references: defaults carried');
  }

  // ── Form dropdown data ──
  console.log('■ Dropdown data');
  {
    const eqList = products.listLabEquipmentForProductForm();
    eq(eqList.length, 2, 'dropdowns: equipment listed');
    eq(products.listLabDocumentsForProductForm('SOP').length, 0, 'dropdowns: no fabricated SOP documents');
    eq(products.listLabDocumentsForProductForm('WI').length, 0, 'dropdowns: no fabricated WI documents');
  }

  // ── History timeline ──
  console.log('■ History');
  {
    const timeline = products.getLabProductAuditTimeline(productId);
    eq(timeline.length, 4, 'history: CREATE + all UPDATE rows');
    ok(String(timeline[0].action) === 'UPDATE', 'history: newest first');
    ok(typeof timeline[0].actor_name === 'string', 'history: actor name joined');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('\nFailures:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-products crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    const { closeDatabase } = await import('../src/lib/db.ts');
    closeDatabase();
  } catch {
    /* already closed */
  }
  rmSync(tempDir, { recursive: true, force: true });
}
