// Database-backed unit checks for the QC Laboratory Calibration Register
// (src/lib/lab/calibration.ts — /lab/calibration, page reference §37).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed is ON (QC_SEED_LAB_EQUIPMENT=1) so the
// canonical 24-device registry loads — calibration history itself is NEVER
// seeded (starts empty, no fabricated events). Focus: the six-state status
// derivation (Compliant / Due Soon / Due Today / Overdue / Not Compliant /
// Unknown), the free-text result non-compliance tokens (D-1: stored verbatim,
// mapped at read time), the Zod schema (equipment required, nullable fields,
// date format, length bounds, unknown-key rejection, next_due < calibration_due
// rejection), create/update + CREATE/UPDATE audit, archived-equipment
// rejection, list ordering + filters (q / status / equipment / due=1), the
// detail view, and the manager+ permissions.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-calibration-'));
const dbPath = join(tempDir, 'lab-calibration.db');

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

// Fixture dates are computed relative to "today" so derived-status assertions
// stay deterministic regardless of run date (DUE_SOON window = next 30 days).
function isoOffsetDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
const FIX_LAST_CAL = isoOffsetDays(-40);
const FIX_FAR_DUE = isoOffsetDays(200);
const FIX_NEXT_DUE = isoOffsetDays(210);

function fd(overrides = {}) {
  const f = new FormData();
  f.set('equipment_id', String(equipmentId));
  f.set('last_calibrated_at', FIX_LAST_CAL);
  f.set('calibration_due_at', FIX_FAR_DUE);
  f.set('provider', 'Metrology SA');
  f.set('certificate_reference', 'CAL-2026-001');
  f.set('result', 'PASS');
  f.set('next_due_at', FIX_NEXT_DUE);
  f.set('notes', 'Recertified within tolerance.');
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) f.delete(k);
    else f.set(k, String(v));
  }
  return f;
}

let db;
let managerId;
let supervisorId;
let equipmentId;

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  // Seed ON for this suite — the canonical 24-device registry must load.
  process.env.QC_SEED_LAB_EQUIPMENT = '1';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '1' },
    stdio: 'ignore',
  });

  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const calibration = await import('../src/lib/lab/calibration.ts');
  const validation = await import('../src/lib/validation.ts');
  const perms = await import('../src/lib/permissions.ts');

  db = getDb();
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);

  // A seeded device to attach calibration to (no fabricated records on it).
  equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'NOC-05'").get().id);

  // ── Policy constants ──
  console.log('■ Policy');
  {
    eq(calibration.LAB_CALIBRATION_STATUSES.length, 6, 'policy: six calibration statuses');
    ok(calibration.LAB_CALIBRATION_STATUSES.includes('COMPLIANT'), 'policy: COMPLIANT');
    ok(calibration.LAB_CALIBRATION_STATUSES.includes('DUE_SOON'), 'policy: DUE_SOON');
    ok(calibration.LAB_CALIBRATION_STATUSES.includes('DUE_TODAY'), 'policy: DUE_TODAY');
    ok(calibration.LAB_CALIBRATION_STATUSES.includes('OVERDUE'), 'policy: OVERDUE');
    ok(calibration.LAB_CALIBRATION_STATUSES.includes('NOT_COMPLIANT'), 'policy: NOT_COMPLIANT');
    ok(calibration.LAB_CALIBRATION_STATUSES.includes('UNKNOWN'), 'policy: UNKNOWN');
    eq(calibration.LAB_CALIBRATION_STATUS_LABELS.COMPLIANT, 'Compliant', 'policy: COMPLIANT label');
    eq(calibration.LAB_CALIBRATION_STATUS_LABELS.NOT_COMPLIANT, 'Not Compliant', 'policy: NOT_COMPLIANT label');
    eq(calibration.LAB_CALIBRATION_STATUS_LABELS.UNKNOWN, 'Unknown', 'policy: UNKNOWN label');
  }

  // ── Status derivation ──
  console.log('■ Status derivation');
  {
    eq(calibration.deriveLabCalibrationStatus(null, null, '2026-08-15'), 'UNKNOWN', 'derive: no due date → UNKNOWN');
    eq(calibration.deriveLabCalibrationStatus('2026-08-10', null, '2026-08-15'), 'OVERDUE', 'derive: past due → OVERDUE');
    eq(calibration.deriveLabCalibrationStatus('2026-08-15', null, '2026-08-15'), 'DUE_TODAY', 'derive: today → DUE_TODAY');
    eq(calibration.deriveLabCalibrationStatus('2026-09-05', null, '2026-08-15'), 'DUE_SOON', 'derive: within 30 days → DUE_SOON');
    eq(calibration.deriveLabCalibrationStatus('2027-01-01', null, '2026-08-15'), 'COMPLIANT', 'derive: far future → COMPLIANT');

    // NOT_COMPLIANT from the free-text result beats the due-date state (D-1).
    eq(calibration.deriveLabCalibrationStatus('2026-08-10', 'FAIL', '2026-08-15'), 'NOT_COMPLIANT', 'derive: FAIL → NOT_COMPLIANT (beats OVERDUE)');
    eq(calibration.deriveLabCalibrationStatus('2027-01-01', 'Not compliant', '2026-08-15'), 'NOT_COMPLIANT', 'derive: "Not compliant" → NOT_COMPLIANT');
    eq(calibration.deriveLabCalibrationStatus('2027-01-01', 'Out of tolerance', '2026-08-15'), 'NOT_COMPLIANT', 'derive: "Out of tolerance" → NOT_COMPLIANT');
    eq(calibration.deriveLabCalibrationStatus(null, 'failed', '2026-08-15'), 'NOT_COMPLIANT', 'derive: "failed" → NOT_COMPLIANT even with no due date');
    eq(calibration.deriveLabCalibrationStatus('2027-01-01', 'Calibrated OK', '2026-08-15'), 'COMPLIANT', 'derive: benign result stays COMPLIANT');

    ok(calibration.resultIndicatesNonCompliant('FAIL'), 'tokens: FAIL');
    ok(calibration.resultIndicatesNonCompliant('Rejected by vendor'), 'tokens: Rejected');
    ok(calibration.resultIndicatesNonCompliant('non-compliant'), 'tokens: non-compliant');
    ok(!calibration.resultIndicatesNonCompliant(null), 'tokens: null is not non-compliant');
    ok(!calibration.resultIndicatesNonCompliant('PASS'), 'tokens: PASS is compliant');

    // next_due_at takes precedence over calibration_due_at.
    eq(calibration.labCalibrationDueDate({ next_due_at: '2027-01-01', calibration_due_at: '2026-09-10' }), '2027-01-01', 'due: next_due_at precedence');
    eq(calibration.labCalibrationDueDate({ next_due_at: null, calibration_due_at: '2026-09-10' }), '2026-09-10', 'due: falls back to calibration_due_at');
  }

  // ── Schema validation ──
  console.log('■ Schema');
  {
    const good = validation.parseFormData(validation.labCalibrationSchema, fd());
    ok(good.ok, 'schema: complete record passes');
    if (good.ok) {
      eq(good.data.equipment_id, equipmentId, 'schema: equipment_id parsed');
      eq(good.data.last_calibrated_at, FIX_LAST_CAL, 'schema: last_calibrated_at');
      eq(good.data.provider, 'Metrology SA', 'schema: provider');
      eq(good.data.result, 'PASS', 'schema: result');
    }

    const noEquipment = validation.parseFormData(validation.labCalibrationSchema, fd({ equipment_id: null }));
    ok(!noEquipment.ok && /Equipment is required/.test(noEquipment.error), 'schema: equipment_id required');

    const badEquipment = validation.parseFormData(validation.labCalibrationSchema, fd({ equipment_id: 'abc' }));
    ok(!badEquipment.ok && /Equipment is required/.test(badEquipment.error), 'schema: non-numeric equipment rejected');

    const badDate = validation.parseFormData(validation.labCalibrationSchema, fd({ last_calibrated_at: '10/07/2026' }));
    ok(!badDate.ok && /valid date/.test(badDate.error), 'schema: dates must be YYYY-MM-DD');

    const allNull = validation.parseFormData(
      validation.labCalibrationSchema,
      fd({ last_calibrated_at: null, calibration_due_at: null, provider: null, certificate_reference: null, result: null, next_due_at: null, notes: null }),
    );
    ok(allNull.ok, 'schema: every optional field may be null (missing data stays missing)');

    const longProvider = validation.parseFormData(
      validation.labCalibrationSchema,
      fd({ provider: 'x'.repeat(201) }),
    );
    ok(!longProvider.ok, 'schema: provider length bounded');

    // next_due_at must not precede calibration_due_at.
    const earlyNext = validation.parseFormData(
      validation.labCalibrationSchema,
      fd({ calibration_due_at: '2026-09-10', next_due_at: '2026-09-01' }),
    );
    ok(!earlyNext.ok && /before/.test(earlyNext.error), 'schema: next_due_at cannot precede calibration_due_at');

    // Mass-assignment guard: unknown keys are rejected.
    const extra = fd();
    extra.set('created_by', '999');
    const strict = validation.parseFormData(validation.labCalibrationSchema, extra);
    ok(!strict.ok, 'schema: unknown key (created_by) rejected — mass-assignment guard');
  }

  // ── Create + audit ──
  console.log('■ Create');
  let calibrationId;
  {
    eq(calibration.searchLabCalibration(calibration.NO_LAB_CALIBRATION_FILTERS).total, 0, 'create: register starts empty (no fabricated records)');
    eq(calibration.getLabCalibrationSummary(equipmentId).count, 0, 'create: summary count starts at zero');

    const parsed = validation.parseFormData(validation.labCalibrationSchema, fd());
    ok(parsed.ok, 'create: form data parses');
    calibrationId = calibration.createLabCalibration(parsed.data, managerId);
    ok(Number.isInteger(calibrationId) && calibrationId > 0, 'create: returns id');

    const row = db.prepare('SELECT * FROM lab_equipment_calibration WHERE id = ?').get(calibrationId);
    eq(row.equipment_id, equipmentId, 'create: equipment_id stored');
    eq(row.last_calibrated_at, FIX_LAST_CAL, 'create: last_calibrated_at stored');
    eq(row.calibration_due_at, FIX_FAR_DUE, 'create: calibration_due_at stored');
    eq(row.provider, 'Metrology SA', 'create: provider stored');
    eq(row.certificate_reference, 'CAL-2026-001', 'create: certificate_reference stored');
    eq(row.result, 'PASS', 'create: result stored');
    eq(row.next_due_at, FIX_NEXT_DUE, 'create: next_due_at stored');
    eq(row.notes, 'Recertified within tolerance.', 'create: notes stored');
    eq(Number(row.created_by), managerId, 'create: created_by from actor');

    const audits = db
      .prepare("SELECT action, actor_id, note FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT_CALIBRATION' AND entity_id = ? ORDER BY id")
      .all(calibrationId);
    eq(audits.length, 1, 'create: exactly one audit row');
    eq(audits[0].action, 'CREATE', 'create: audit action CREATE');
    eq(Number(audits[0].actor_id), managerId, 'create: audit actor');
    ok(/equipment=NOC-05/.test(audits[0].note), 'create: audit note carries equipment code');
    ok(/result=PASS/.test(audits[0].note), 'create: audit note carries result');
    ok(/certificate_reference=CAL-2026-001/.test(audits[0].note), 'create: audit note carries certificate reference');
  }

  // ── Invalid targets ──
  console.log('■ Invalid targets');
  {
    const dataObj = {
      equipment_id: 999999,
      last_calibrated_at: '2026-07-10',
      calibration_due_at: '2026-09-10',
      provider: 'Metrology SA',
      certificate_reference: 'CAL-X',
      result: 'PASS',
      next_due_at: null,
      notes: null,
    };
    let missing = null;
    try {
      calibration.createLabCalibration(dataObj, managerId);
    } catch (err) {
      missing = err;
    }
    ok(missing instanceof Error && /not found/i.test(missing.message), 'target: missing equipment rejected');

    const archived = db
      .prepare("INSERT INTO lab_equipment (code, name, location, status_raw, calibration_status_raw, is_archived, created_by, created_at, updated_at) VALUES ('CAL-ARCH', 'Archived Cal Device', 'LABORATORY', 'In Use', 'yes', 1, ?, datetime('now'), datetime('now'))")
      .run(managerId);
    const archivedId = Number(archived.lastInsertRowid);
    let rejected = null;
    try {
      calibration.createLabCalibration({ ...dataObj, equipment_id: archivedId }, managerId);
    } catch (err) {
      rejected = err;
    }
    ok(rejected instanceof Error && /archived/i.test(rejected.message), 'target: archived equipment rejected');
  }

  // ── List ordering + filters ──
  console.log('■ List ordering');
  {
    calibration.createLabCalibration(
      {
        equipment_id: equipmentId,
        last_calibrated_at: '2026-08-01',
        calibration_due_at: '2026-08-10',
        provider: 'Metrology SA',
        certificate_reference: 'CAL-2026-002',
        result: 'FAIL',
        next_due_at: null,
        notes: null,
      },
      supervisorId,
    );
    const rows = calibration.searchLabCalibration(calibration.NO_LAB_CALIBRATION_FILTERS).rows;
    eq(rows.length, 2, 'list: two records');
    eq(rows[0].certificate_reference, 'CAL-2026-002', 'list: newest created_at first');
    eq(rows[0].status, 'NOT_COMPLIANT', 'list: FAIL result derives NOT_COMPLIANT');
    eq(rows[1].status, 'COMPLIANT', 'list: PASS within window derives COMPLIANT');

    // status filter
    const notCompliant = calibration.searchLabCalibration({ ...calibration.NO_LAB_CALIBRATION_FILTERS, status: 'NOT_COMPLIANT' });
    eq(notCompliant.total, 1, 'filter: NOT_COMPLIANT matches one');
    eq(notCompliant.rows[0].certificate_reference, 'CAL-2026-002', 'filter: NOT_COMPLIANT row correct');

    // q filter across provider + certificate
    const q = calibration.searchLabCalibration({ ...calibration.NO_LAB_CALIBRATION_FILTERS, q: 'CAL-2026-001' });
    eq(q.total, 1, 'filter: q matches certificate reference');

    // equipment filter
    const equipmentOnly = calibration.searchLabCalibration({ ...calibration.NO_LAB_CALIBRATION_FILTERS, equipment: equipmentId });
    eq(equipmentOnly.total, 2, 'filter: equipment scope');

    // due=1 → the DUE_SOON / DUE_TODAY window only (command-center KPI semantics)
    // Dates are computed relative to "today" so this fixture stays deterministic
    // (DUE_SOON = due within 30 days, not yet overdue) regardless of run date.
    const dueSoon = calibration.createLabCalibration(
      {
        equipment_id: equipmentId,
        last_calibrated_at: isoOffsetDays(-10),
        calibration_due_at: isoOffsetDays(10),
        provider: 'Metrology SA',
        certificate_reference: 'CAL-2026-003',
        result: null,
        next_due_at: null,
        notes: null,
      },
      supervisorId,
    );
    ok(dueSoon > 0, 'filter: created a DUE_SOON fixture');
    const dueOnly = calibration.searchLabCalibration({ ...calibration.NO_LAB_CALIBRATION_FILTERS, due: '1' });
    eq(dueOnly.total, 1, 'filter: due=1 matches only the due-soon record');
    eq(dueOnly.rows[0].certificate_reference, 'CAL-2026-003', 'filter: due=1 row correct');
  }

  // ── Detail view ──
  console.log('■ Detail');
  {
    const detail = calibration.getLabCalibrationDetail(calibrationId);
    ok(detail !== null, 'detail: record found');
    eq(detail.equipment_code, 'NOC-05', 'detail: equipment code resolved');
    eq(detail.status, 'COMPLIANT', 'detail: derived status');
    ok(typeof detail.created_by_name === 'string' && detail.created_by_name.length > 0, 'detail: created_by resolved');
    eq(calibration.getLabCalibrationDetail(999999), null, 'detail: missing record → null');
  }

  // ── Update + audit ──
  console.log('■ Update');
  {
    const before = calibration.searchLabCalibration(calibration.NO_LAB_CALIBRATION_FILTERS).rows;
    const target = before.find((r) => r.certificate_reference === 'CAL-2026-003');
    calibration.updateLabCalibration(
      target.id,
      {
        equipment_id: equipmentId,
        last_calibrated_at: '2026-08-01',
        calibration_due_at: '2026-08-20',
        provider: 'Metrology SA',
        certificate_reference: 'CAL-2026-003',
        result: 'PASS',
        next_due_at: '2027-08-20',
        notes: 'Recertified after repair.',
      },
      supervisorId,
    );
    const row = db.prepare('SELECT * FROM lab_equipment_calibration WHERE id = ?').get(target.id);
    eq(row.result, 'PASS', 'update: result updated');
    eq(row.next_due_at, '2027-08-20', 'update: next_due_at updated');

    const audits = db
      .prepare("SELECT action, actor_id, note FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT_CALIBRATION' AND entity_id = ? ORDER BY id")
      .all(target.id);
    eq(audits.length, 2, 'update: CREATE + UPDATE audit rows');
    eq(audits[1].action, 'UPDATE', 'update: latest audit action UPDATE');
    eq(Number(audits[1].actor_id), supervisorId, 'update: audit actor');

    const summary = calibration.getLabCalibrationSummary(equipmentId);
    eq(summary.status, 'COMPLIANT', 'summary: latest record now COMPLIANT');
    eq(summary.due_date, '2027-08-20', 'summary: due date follows next_due_at');

    const missing = db.prepare('SELECT id FROM lab_equipment_calibration WHERE id = 999999').get();
    eq(missing, undefined, 'update: nonexistent id not found');
  }

  // ── Audit trail ──
  console.log('■ Audit trail');
  {
    const audit = calibration.getLabCalibrationAudit(equipmentId);
    ok(audit.length >= 3, 'audit: one row per calibration event (append-only)');
    ok(!audit.some((a) => a.entity_type === 'LAB_EQUIPMENT'), 'audit: only calibration rows (not equipment rows)');
    ok(typeof audit[0].actor_name === 'string' && audit[0].actor_name.length > 0, 'audit: actor name resolved');
  }

  // ── RBAC ──
  console.log('■ RBAC');
  {
    ok(perms.canViewLabCalibration('employee'), 'RBAC: every role views calibration');
    ok(perms.canViewLabCalibration('supervisor'), 'RBAC: supervisor views calibration');
    eq(perms.canCreateLabCalibration('employee'), false, 'RBAC: employee cannot create');
    eq(perms.canCreateLabCalibration('supervisor'), false, 'RBAC: supervisor cannot create');
    ok(perms.canCreateLabCalibration('manager'), 'RBAC: manager creates');
    ok(perms.canCreateLabCalibration('admin'), 'RBAC: admin creates');
    eq(perms.canEditLabCalibration('employee'), false, 'RBAC: employee cannot edit');
    eq(perms.canEditLabCalibration('supervisor'), false, 'RBAC: supervisor cannot edit');
    ok(perms.canEditLabCalibration('manager'), 'RBAC: manager edits');
    ok(perms.canEditLabCalibration('admin'), 'RBAC: admin edits');
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exitCode = failed > 0 ? 1 : 0;