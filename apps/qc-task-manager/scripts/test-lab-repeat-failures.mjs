// Database-backed unit checks for the repeated-test-failures detector
// (PROMPT 20 follow-up): same product with ≥2 FAIL final results in a
// rolling 7-day window (non-VOID), surfaced through the EXISTING daily
// scheduled-notifications job (ONE detector — src/lib/lab/
// scheduledNotifications.ts) and the /lab/products/[id] flag
// (getProductRepeatFailure).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed OFF — no fabricated data.
//
// Covered:
//   1. Two FAILs within 7 days on one product → exactly ONE notification,
//      idempotent on re-run (dedupe_key), correct kind/recipient/href.
//   2. Older / dispersed FAILs (> 7 days apart or outside the window) → silent.
//   3. VOID records are excluded; PASS never counts.
//   4. No finding is created automatically (qc_findings/lab_test_findings
//      stay empty); the notification carries a pre-filled Open Finding URL.
//   5. The read-time flag (getProductRepeatFailure) agrees with the job.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-repeat-failures-'));
const dbPath = join(tempDir, 'repeat-failures.db');

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
  ok(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

let db;
let employeeId;
let managerId;
let productSeq = 0;

function insertProduct(overrides = {}) {
  productSeq += 1;
  const code = overrides.code ?? `PRD-${String(productSeq).padStart(3, '0')}`;
  return Number(
    db
      .prepare('INSERT INTO lab_products (name, code, created_by) VALUES (?, ?, ?)')
      .run(`Product ${code}`, code, overrides.created_by ?? managerId).lastInsertRowid,
  );
}

function insertTest(productId, { result = 'FAIL', status = 'APPROVED', daysAgo = 0 } = {}) {
  return Number(
    db
      .prepare(
        `INSERT INTO lab_test_records (
           test_number, test_type, product_id, final_result, status,
           sample_count, submitted_at, approved_at, created_by
         ) VALUES (?, 'air', ?, ?, ?, 5, datetime('now', ?), datetime('now', ?), ?)`,
      )
      .run(
        `TN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        productId,
        result,
        status,
        `-${daysAgo} days`,
        `-${daysAgo} days`,
        managerId,
      ).lastInsertRowid,
  );
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '0';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '0' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(join(backupDir, 'status.json'), JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }));

  const { getDb } = await import('../src/lib/db.ts');
  const { runScheduledNotifications, getProductRepeatFailure } = await import('../src/lib/lab/scheduledNotifications.ts');
  const notifications = await import('../src/lib/notifications.ts');

  db = getDb();
  employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);

  const repeatRows = () =>
    db.prepare("SELECT * FROM notifications WHERE type = 'lab_repeat_failures' ORDER BY id").all();
  const clear = () => {
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM lab_test_records').run();
    db.prepare('DELETE FROM lab_products').run();
  };

  console.log('\n→ Two FAILs within 7 days trigger exactly once');
  {
    clear();
    const p1 = insertProduct({ created_by: managerId });
    const t1 = insertTest(p1, { daysAgo: 2 });
    const t2 = insertTest(p1, { daysAgo: 1 });

    const first = runScheduledNotifications(new Date().toISOString().slice(0, 10));
    eq(first.lab_repeat_failures, 1, 'first run inserts one notification');
    let rows = repeatRows();
    eq(rows.length, 1, 'exactly one row');
    eq(rows[0].user_id, managerId, 'recipient is the product owner (created_by)');
    eq(rows[0].entity_href, `/lab/tests?product=${p1}&result=FAIL`, 'href opens the FAIL-filtered register');
    ok(rows[0].message.includes(`#${t1}`) && rows[0].message.includes(`#${t2}`), 'message lists the failing test ids');
    ok(rows[0].message.includes('/findings?') && rows[0].message.includes('#new-finding'), 'Open Finding deep-link present');
    ok(
      rows[0].message.includes(`lab_test_records%3A%20${t1}%2C%20${t2}`),
      'finding link pre-fills the affected test ids',
    );
    eq(rows[0].task_id, null, 'scheduled rows are task-less');

    const second = runScheduledNotifications(new Date().toISOString().slice(0, 10));
    eq(second.lab_repeat_failures, 0, 'second run same day inserts nothing (idempotent)');
    eq(repeatRows().length, 1, 'still exactly one row');

    // Read-time flag mirrors the job.
    const flag = getProductRepeatFailure(p1);
    eq(flag.fail_count, 2, 'flag reports 2 fails');
    eq(JSON.stringify(flag.test_ids), JSON.stringify([t1, t2]), 'flag lists both test ids ASC');

    // No automatic finding anywhere.
    eq(db.prepare('SELECT COUNT(*) AS c FROM qc_findings').get().c, 0, 'no qc_findings row created');
    eq(db.prepare('SELECT COUNT(*) AS c FROM lab_test_findings').get().c, 0, 'no lab_test_findings row created');

    // Surfaces through the EXISTING lab notification list.
    const labView = notifications.listLabNotifications(managerId);
    ok(labView.notifications.some((n) => n.kind === 'lab_repeat_failures'), 'appears in /lab/notifications');
  }

  console.log('\n→ Older / dispersed FAILs do not trigger');
  {
    clear();
    const p2 = insertProduct();
    insertTest(p2, { daysAgo: 10 });
    insertTest(p2, { daysAgo: 9 }); // both outside the window
    const p3 = insertProduct();
    insertTest(p3, { daysAgo: 30 });
    insertTest(p3, { daysAgo: 3 }); // dispersed across windows

    const summary = runScheduledNotifications(new Date().toISOString().slice(0, 10));
    eq(summary.lab_repeat_failures, 0, 'no notification');
    eq(repeatRows().length, 0, 'no rows');
    eq(getProductRepeatFailure(p2), null, 'flag null for out-of-window product');
  }

  console.log('\n→ VOID excluded, single FAIL and PASS never count');
  {
    clear();
    const pVoid = insertProduct();
    insertTest(pVoid, { status: 'VOID', daysAgo: 1 });
    insertTest(pVoid, { status: 'VOID', daysAgo: 2 });
    const pSingle = insertProduct();
    insertTest(pSingle, { daysAgo: 1 });
    const pPass = insertProduct();
    insertTest(pPass, { result: 'PASS', daysAgo: 1 });
    insertTest(pPass, { result: 'PASS', daysAgo: 2 });

    const summary = runScheduledNotifications(new Date().toISOString().slice(0, 10));
    eq(summary.lab_repeat_failures, 0, 'no notification');
    eq(repeatRows().length, 0, 'no rows');
    eq(db.prepare('SELECT COUNT(*) AS c FROM qc_findings').get().c, 0, 'still no findings created');
  }

  console.log('\n→ Inactive recipient skipped');
  {
    clear();
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(managerId);
    const pInact = insertProduct();
    insertTest(pInact, { daysAgo: 1 });
    insertTest(pInact, { daysAgo: 2 });
    const summary = runScheduledNotifications(new Date().toISOString().slice(0, 10));
    eq(summary.lab_repeat_failures, 0, 'no notification for inactive owner');
    eq(summary.skipped_inactive, 1, 'inactive skip counted');
    db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(managerId);
  }

  console.log('\n→ Recipient is per-product (owner of THAT product)');
  {
    clear();
    const pEmp = insertProduct({ created_by: employeeId });
    insertTest(pEmp, { daysAgo: 1 });
    insertTest(pEmp, { daysAgo: 2 });
    runScheduledNotifications(new Date().toISOString().slice(0, 10));
    const rows = repeatRows();
    eq(rows.length, 1, 'one row');
    eq(rows[0].user_id, employeeId, 'notification went to the product owner, not a global manager');
  }

  console.log(`\n■ lab-repeat-failures: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  ❌ ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('[test-lab-repeat-failures] crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    const { closeDatabase } = await import('../src/lib/db.ts');
    closeDatabase();
  } catch {}
  rmSync(tempDir, { recursive: true, force: true });
}
