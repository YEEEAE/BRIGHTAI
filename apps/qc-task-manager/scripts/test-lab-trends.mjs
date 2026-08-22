// Database-backed unit checks for src/lib/lab/trends.ts (FAIL-rate trends).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-lab-overview.mjs).
// Controlled fixture of enum rows only — no invented scientific values.
//
// Covered:
//   1. Empty database → zero state everywhere (all buckets 0, no lots,
//      comparison insufficient).
//   2. Seeded fixture → exact bucket totals/rates, VOID exclusion,
//      per-lot breakdown, moving comparison vs the previous window,
//      per-product summary, empty product → empty state.
//   3. Static: chart component is CSP-safe (no inline style attributes);
//      drill-down links target the implemented test register only.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-trends-'));
const dbPath = join(tempDir, 'lab-trends.db');

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

// Same Monday-start week alignment as the module under test (local time).
function mondayOf(d) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - (copy.getDay() + 6) % 7);
  const p = (n) => String(n).padStart(2, '0');
  return `${copy.getFullYear()}-${p(copy.getMonth() + 1)}-${p(copy.getDate())}`;
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
  const trends = await import('../src/lib/lab/trends.ts');

  // ── 1. Empty database: zero state ──
  console.log('\n■ Empty database → zero state');
  {
    const t = trends.getLabFailRateTrends('week', 8);
    eq(t.points.length, 8, 'empty: 8 weekly buckets');
    ok(t.points.every((p) => p.total === 0 && p.fail === 0 && p.failRate === null), 'empty: all buckets zero/null');
    eq(t.lots.length, 0, 'empty: no lot rows');
    eq(t.comparison.direction, 'insufficient', 'empty: comparison insufficient');
    eq(t.comparison.currentFailRate, null, 'empty: current rate null');
    eq(t.comparison.previousFailRate, null, 'empty: previous rate null');
    eq(trends.getLabFailRateByProduct('week', 8).length, 0, 'empty: no product rows');
  }

  // ── 2. Seeded fixture ──
  console.log('\n■ Fixture: exact rates, VOID exclusion, lots, comparison');
  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();

  db.prepare('INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, 1, ?)')
    .run('Trend Product A', 'PRD-T1', 'air', employee.id);
  db.prepare('INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, 1, ?)')
    .run('Trend Product Empty', 'PRD-T2', 'air', employee.id);
  db.prepare('INSERT INTO lab_equipment (name, code, location, status_raw, created_by) VALUES (?, ?, ?, ?, ?)')
    .run('Trend Rig', 'EQ-T1', 'Lab 1', 'NEW', employee.id);
  const p1 = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'PRD-T1'").get().id);
  const p2 = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'PRD-T2'").get().id);
  const eq1 = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'EQ-T1'").get().id);

  const utcTs = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19).replace('T', ' ');
  const insertTest = db.prepare(`INSERT INTO lab_test_records
    (test_number, test_type, product_id, equipment_id, lot_number, sample_count, final_result, status,
     tested_by, submitted_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  let seq = 0;
  const add = (days, product, lot, result, status) =>
    insertTest.run(`LAB-TEST-${String(++seq).padStart(5, '0')}`, 'air', product, eq1, lot, 1, result, status,
      employee.id, utcTs(days), employee.id, utcTs(days), utcTs(days));

  // Current week (today): 2 FAIL + 2 PASS + 1 HOLD decided, plus a VOIDed FAIL
  // that must never enter any rate.
  add(0, p1, 'LOT-A', 'FAIL', 'APPROVED');
  add(0, p1, 'LOT-A', 'FAIL', 'APPROVED');
  add(0, p1, 'LOT-B', 'PASS', 'APPROVED');
  add(0, p1, 'LOT-B', 'PASS', 'APPROVED');
  add(0, p1, 'LOT-B', 'HOLD', 'APPROVED');
  add(0, p1, 'LOT-A', 'FAIL', 'VOID');
  // Two weeks ago (still inside the 8-week window): 1 PASS.
  add(-13, p1, 'LOT-A', 'PASS', 'APPROVED');
  // Ten weeks ago (previous window, outside the current 8): 1 FAIL + 1 PASS.
  add(-70, p1, 'LOT-C', 'FAIL', 'APPROVED');
  add(-70, p1, 'LOT-C', 'PASS', 'APPROVED');
  // Product 2 stays empty.

  const t1 = trends.getLabFailRateTrends('week', 8, p1);
  eq(t1.granularity, 'week', 'product: granularity week');
  eq(t1.points.length, 8, 'product: 8 buckets');

  const thisWeek = mondayOf(new Date());
  const weekPoint = t1.points.find((p) => p.bucket === thisWeek);
  ok(weekPoint !== undefined, 'product: current week bucket present');
  if (weekPoint) {
    eq(weekPoint.total, 5, 'product: this week decided = 5 (VOID excluded)');
    eq(weekPoint.fail, 2, 'product: this week FAIL = 2');
    eq(weekPoint.failRate, 40, 'product: this week FAIL rate = 40%');
  }

  const totals = t1.points.reduce((s, p) => s + p.total, 0);
  const fails = t1.points.reduce((s, p) => s + p.fail, 0);
  eq(totals, 6, 'product: window decided total = 6 (VOID + previous-window rows excluded)');
  eq(fails, 2, 'product: window FAIL total = 2');

  // Moving comparison: current 2/6 = 33.3% vs previous 1/2 = 50% → down 16.7pp.
  eq(t1.comparison.currentFailRate, 33.3, 'product: current window rate = 33.3%');
  eq(t1.comparison.previousFailRate, 50, 'product: previous window rate = 50%');
  eq(t1.comparison.deltaPercentagePoints, -16.7, 'product: delta = -16.7 percentage points');
  eq(t1.comparison.direction, 'down', 'product: direction down');

  // Per-lot breakdown (all time for the product, decided rows only).
  eq(t1.lots.length, 3, 'product: 3 lot rows');
  const lotA = t1.lots.find((l) => l.lotNumber === 'LOT-A');
  const lotB = t1.lots.find((l) => l.lotNumber === 'LOT-B');
  const lotC = t1.lots.find((l) => l.lotNumber === 'LOT-C');
  ok(lotA && lotA.total === 3 && lotA.fail === 2 && lotA.failRate === 66.7, 'product: LOT-A 2/3 = 66.7% (VOID excluded)');
  ok(lotB && lotB.total === 3 && lotB.fail === 0 && lotB.failRate === 0, 'product: LOT-B 0/3 (PASS + HOLD are decided) = 0%');
  ok(lotC && lotC.total === 2 && lotC.fail === 1 && lotC.failRate === 50, 'product: LOT-C 1/2 = 50%');

  // Monthly granularity still aggregates correctly (no crash, sane totals).
  const t1m = trends.getLabFailRateTrends('month', 6, p1);
  eq(t1m.points.length, 6, 'product: 6 monthly buckets');
  eq(t1m.points.reduce((s, p) => s + p.total, 0), 8, 'product: monthly decided total = 8 (6-month window spans the -70d rows too)');
  eq(t1m.points.reduce((s, p) => s + p.fail, 0), 3, 'product: monthly FAIL total = 3');

  // Whole-lab view: same numbers (product 2 is empty).
  const lab = trends.getLabFailRateTrends('week', 8);
  eq(lab.points.reduce((s, p) => s + p.total, 0), 6, 'lab: window decided total = 6');
  eq(lab.comparison.currentFailRate, 33.3, 'lab: current window rate = 33.3%');

  // Per-product summary: only products with decided rows appear.
  const byProduct = trends.getLabFailRateByProduct('week', 8);
  eq(byProduct.length, 1, 'summary: only PRD-T1 listed');
  ok(byProduct[0] && byProduct[0].productId === p1 && byProduct[0].total === 6 && byProduct[0].fail === 2 && byProduct[0].failRate === 33.3,
    'summary: PRD-T1 2/6 = 33.3%');
  ok(byProduct[0].code === 'PRD-T1' && byProduct[0].name === 'Trend Product A', 'summary: product name/code resolved');
  eq(trends.getLabFailRateByProduct('month', 6)[0]?.total, 8, 'summary: monthly window bound includes current month');

  // ── 3. Empty product → explicit empty state ──
  console.log('\n■ Empty product → empty state');
  {
    const t2 = trends.getLabFailRateTrends('week', 8, p2);
    eq(t2.points.length, 8, 'empty product: 8 buckets');
    ok(t2.points.every((p) => p.total === 0 && p.failRate === null), 'empty product: all buckets zero/null');
    eq(t2.lots.length, 0, 'empty product: no lot rows');
    eq(t2.comparison.direction, 'insufficient', 'empty product: comparison insufficient');
  }

  // ── 4. Read-only guarantee: no table mutated by the module ──
  console.log('\n■ Read-only guarantee');
  {
    const before = db.prepare('SELECT COUNT(*) AS n, SUM(id) AS s FROM lab_test_records').get();
    trends.getLabFailRateTrends('week', 8);
    trends.getLabFailRateTrends('month', 8, p1);
    trends.getLabFailRateByProduct('month', 8);
    const after = db.prepare('SELECT COUNT(*) AS n, SUM(id) AS s FROM lab_test_records').get();
    ok(before.n === after.n && before.s === after.s, 'read-only: lab_test_records untouched');
  }

  // ── 5. Drill-down links: register only ──
  console.log('\n■ Drill-down links');
  {
    eq(trends.labTrendDrilldown(), '/lab/tests', 'drilldown: bare → /lab/tests');
    eq(trends.labTrendDrilldown(p1, undefined, 'FAIL'), `/lab/tests?product=${p1}&result=FAIL`, 'drilldown: product+FAIL');
    eq(trends.labTrendDrilldown(p1, 'LOT A&?'), `/lab/tests?product=${p1}&lot=LOT+A%26%3F`, 'drilldown: lot value URL-encoded');
  }

  // ── 6. Static: CSP-safe chart (no inline style attributes) ──
  console.log('\n■ Static CSP checks');
  {
    const chartSrc = readFileSync(join(appDir, 'src/components/lab/LabFailRateChart.tsx'), 'utf8');
    ok(!/style\s*=\s*["'{]/.test(chartSrc), 'static: LabFailRateChart.tsx has no inline style attributes');
    ok(chartSrc.includes('role="img"'), 'static: chart svg carries role="img"');
    ok(chartSrc.includes('aria-label'), 'static: chart svg carries aria-label');
    ok(chartSrc.includes('<title>'), 'static: chart points carry native <title> fallback');
    const trendsSrc = readFileSync(join(appDir, 'src/lib/lab/trends.ts'), 'utf8');
    ok(trendsSrc.includes("status <> 'VOID'"), 'static: VOID exclusion present in the query layer');
  }

  console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? ` — ${failures.join(' | ')}` : ''}`);
  process.exitCode = failed > 0 ? 1 : 0;
} catch (err) {
  console.error('❌ test-lab-trends crashed:', err);
  process.exitCode = 1;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
