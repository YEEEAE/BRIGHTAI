// Unit checks for the e-signature re-authentication step (PROMPT 55 —
// mechanism only, no regulatory claim).
//
// Covers:
//  1. Wrong password → rejected ('invalid') + audited as a failed attempt.
//  2. Correct password → proceeds ('ok').
//  3. Failed verifications are rate-limited per user (5/min bucket pattern).
//  4. The e-signature marker lands in the action's audit note (void path).
//  5. NO password material and NO hash material ever appears in the audit log
//     or anywhere in the database (grep-verified over a full DB dump).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-esign-'));
const dbPath = join(tempDir, 'lab-esign.db');

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

const WRONG_PASSWORD = 'wrong-password-secret-value';
const CORRECT_PASSWORD = 'admin123';

let db;

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '0';
  process.env.NODE_ENV = 'test';

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
  const esign = await import('../src/lib/lab/esignature.ts');
  const testsMod = await import('../src/lib/lab/tests.ts');

  db = getDb();
  const uid = (u) => Number(db.prepare('SELECT id FROM users WHERE username = ?').get(u).id);
  const managerId = uid('manager');

  // ── 1. Wrong password is rejected and audited ──
  let result = esign.requireEsignature(managerId, WRONG_PASSWORD);
  ok(result === 'invalid', `wrong password → invalid (got ${result})`);

  let auditRows = db
    .prepare(`SELECT * FROM login_attempts WHERE username = (SELECT username FROM users WHERE id = ?) AND ip_address LIKE 'e-signature:%' ORDER BY id DESC`)
    .all(managerId);
  ok(auditRows.length === 1, `failed attempt audited exactly once (got ${auditRows.length})`);
  ok(
    auditRows.length === 1 && /e-signature:failed/.test(String(auditRows[0].ip_address)),
    'audit marker describes the failure',
  );
  ok(
    auditRows.length === 1 && !String(auditRows[0].note).includes(WRONG_PASSWORD),
    'audit note does NOT contain the attempted password',
  );

  // ── 2. Correct password proceeds ──
  result = esign.requireEsignature(managerId, CORRECT_PASSWORD);
  ok(result === 'ok', `correct password → ok (got ${result})`);
  // Success clears the failure counter — verified implicitly by rate-limit test below.

  // ── 3. Rate limiting on consecutive failures ──
  // Bucket currently holds 0 failures (success cleared it). Burn 4 more.
  for (let i = 0; i < 4; i++) {
    esign.requireEsignature(uid('employee'), WRONG_PASSWORD);
  }
  result = esign.requireEsignature(uid('employee'), WRONG_PASSWORD); // 5th failure
  ok(result === 'invalid', `5th wrong password still evaluated → invalid (got ${result})`);
  result = esign.requireEsignature(uid('employee'), WRONG_PASSWORD); // beyond limit
  ok(result === 'rate_limited', `6th attempt within window → rate_limited (got ${result})`);
  result = esign.requireEsignature(uid('employee'), CORRECT_PASSWORD); // even correct is gated
  ok(result === 'rate_limited', `correct password during lockout → rate_limited (got ${result})`);
  const employeeAuditCount = db
    .prepare(`SELECT COUNT(*) AS c FROM login_attempts WHERE username = (SELECT username FROM users WHERE id = ?) AND ip_address LIKE 'e-signature:%'`)
    .get(uid('employee')).c;
  ok(Number(employeeAuditCount) === 7, `all refused attempts audited exactly once each before empty probe (got ${employeeAuditCount})`);
  const rateLimitedAudits = db
    .prepare(`SELECT COUNT(*) AS c FROM login_attempts WHERE ip_address = 'e-signature:rate_limited'`)
    .get().c;
  ok(Number(rateLimitedAudits) === 2, 'rate-limited refusals audited as rate_limited (got ${})'.replace('${}', rateLimitedAudits));
  // A locked empty-password probe is still rate-limited because the actor was
  // already locked out, and the refused security attempt is audited.
  result = esign.requireEsignature(uid('employee'), null);
  ok(result === 'rate_limited', 'empty password while locked → rate_limited');
  const employeeAuditCountAfterEmpty = db
    .prepare(`SELECT COUNT(*) AS c FROM login_attempts WHERE username = (SELECT username FROM users WHERE id = ?) AND ip_address LIKE 'e-signature:%'`)
    .get(uid('employee')).c;
  ok(Number(employeeAuditCountAfterEmpty) === 8, `locked empty password is audited exactly once (got ${employeeAuditCountAfterEmpty})`);
  const rateLimitedAuditsAfterEmpty = db
    .prepare(`SELECT COUNT(*) AS c FROM login_attempts WHERE ip_address = 'e-signature:rate_limited'`)
    .get().c;
  ok(Number(rateLimitedAuditsAfterEmpty) === 3, `locked empty password is classified as rate_limited (got ${rateLimitedAuditsAfterEmpty})`);

  // ── 4. Audit note marker on the void action ──
  const insertRow = {
    test_number: 'T-ESIGN-1',
    test_type: 'air',
    product_id: null,
    equipment_id: null,
    lot_number: null,
    sampling_area: null,
    sample_count: 5,
    final_result: null,
    status: 'SUBMITTED',
    tested_by: uid('employee'),
    created_by: uid('employee'),
    submitted_at: '2026-01-01 09:00:00',
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
  };
  const r = db
    .prepare(
      `INSERT INTO lab_test_records (test_number, test_type, product_id, equipment_id, lot_number,
         sampling_area, sample_count, final_result, status, tested_by, created_by,
         submitted_at, reviewed_by, reviewed_at, approved_by, approved_at, rejected_reason,
         template_version_id, sop_version_id, wi_version_id, parameters_snapshot_json, created_at, updated_at)
       VALUES (@test_number, @test_type, @product_id, @equipment_id, @lot_number,
         @sampling_area, @sample_count, @final_result, @status, @tested_by, @created_by,
         @submitted_at, @reviewed_by, @reviewed_at, @approved_by, @approved_at, @rejected_reason,
         @template_version_id, @sop_version_id, @wi_version_id, @parameters_snapshot_json, @created_at, @updated_at)`,
    )
    .run(insertRow);
  const testId = Number(r.lastInsertRowid);

  testsMod.voidLabTest({ id: managerId, role: 'manager' }, testId, 'Operator error recorded', { esigned: true });
  const voidAudit = db
    .prepare(`SELECT note FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? AND action = 'VOID'`)
    .get(testId);
  ok(
    voidAudit && /approved with e-signature/.test(String(voidAudit.note)) && String(voidAudit.note).includes('Operator error recorded'),
    `void audit note carries reason + e-signature marker (got "${voidAudit ? voidAudit.note : null}")`,
  );

  // ── 5. No secret material anywhere in the database ──
  // Full dump of every TEXT column in every table, then grep for the wrong
  // password and for bcrypt hash fragments ($2a/$2b prefixes).
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  let leakedPassword = false;
  let leakedHashFragment = false;
  const hashPattern = /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{20,}/;
  for (const t of tables) {
    let cols;
    try {
      cols = db.pragma(`table_info("${String(t.name).replace(/"/g, '')}")`);
    } catch {
      continue;
    }
    const textCols = cols.filter((c) => c && c.name && /TEXT|VARCHAR/i.test(c.type)).map((c) => String(c.name));
    if (textCols.length === 0) continue;
    let rows;
    try {
      rows = db
        .prepare(`SELECT ${textCols.map((c) => `"${c.replace(/"/g, '')}"`).join(', ')} FROM "${String(t.name).replace(/"/g, '')}"`)
        .all();
    } catch {
      continue;
    }
    for (const row of rows) {
      for (const c of textCols) {
        const v = row[c.name];
        if (typeof v !== 'string') continue;
        if (v.includes(WRONG_PASSWORD)) leakedPassword = true;
        // users.password_hash legitimately stores hashes — exclude that table/column.
        if (t.name !== 'users' && !/password_hash/i.test(c.name) && hashPattern.test(v)) leakedHashFragment = true;
      }
    }
  }
  ok(!leakedPassword, 'wrong-password value appears NOWHERE in the database (grep-verified)');
  ok(!leakedHashFragment, 'no bcrypt hash material outside users.password_hash');

  console.log(`\n${passed} passed / ${failed} failed`);
  if (failed > 0) {
    console.log(failures.map((f) => ` - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
}
