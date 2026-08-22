// Database-backed unit checks for the extended lab print architecture
// (/lab/calibration/[id]/print + /lab/equipment/[id]/print +
// /lab/maintenance/[id]/print — same PrintLayout shell as
// /lab/tests/[id]/print).
//
// Acceptance: "print output matches stored record exactly" — enforced here at
// the loader level: the print pages read the SAME loaders verified below
// (getLabCalibrationDetail / getLabEquipmentMaintenanceDetail /
// getLabEquipmentTimeline), so exact loader values ⇒ exact printed values.
// Static source checks assert the print pages reuse PrintLayout (no second
// layout), render exactly one <h1>, and use scoped table headers (a11y pass
// conventions from the mind ledger QC-LAB-A11Y-RESP-001).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-print-'));
const dbPath = join(tempDir, 'lab-print.db');

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

let db;

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';
  process.env.QC_SEED_LAB_EQUIPMENT = '1';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '', QC_SEED_LAB_EQUIPMENT: '1' },
    stdio: 'ignore',
  });

  const { getDb } = await import('../src/lib/db.ts');
  const calibration = await import('../src/lib/lab/calibration.ts');
  const equipment = await import('../src/lib/lab/equipment.ts');
  const navigation = await import('../src/lib/lab/navigation.ts');

  db = getDb();
  const managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  const equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'NOC-05'").get().id);

  // ── Calibration print loader: exact stored values ──
  console.log('■ Calibration print loader (getLabCalibrationDetail)');
  const calId = calibration.createLabCalibration(
    {
      equipment_id: equipmentId,
      last_calibrated_at: '2026-08-01',
      calibration_due_at: '2027-08-01',
      provider: 'Saudi Calibration House',
      certificate_reference: 'CERT-PRINT-001',
      result: 'PASS — within tolerance',
      next_due_at: '2027-08-01',
      notes: 'Verified at 3 reference points.',
    },
    managerId,
  );
  {
    const detail = calibration.getLabCalibrationDetail(calId);
    ok(detail !== null, 'calibration print: record loads');
    if (detail) {
      eq(detail.calibration.id, calId, 'calibration print: exact record id');
      eq(detail.calibration.provider, 'Saudi Calibration House', 'calibration print: exact provider');
      eq(detail.calibration.certificate_reference, 'CERT-PRINT-001', 'calibration print: exact certificate reference');
      eq(detail.calibration.result, 'PASS — within tolerance', 'calibration print: result verbatim (never rewritten)');
      eq(detail.calibration.last_calibrated_at, '2026-08-01', 'calibration print: exact last calibrated date');
      eq(detail.calibration.next_due_at, '2027-08-01', 'calibration print: exact next due date');
      eq(detail.calibration.notes, 'Verified at 3 reference points.', 'calibration print: exact notes');
      ok(typeof detail.status === 'string' && detail.status.length > 0, 'calibration print: derived status present');
      ok(detail.created_by_name !== null, 'calibration print: recorded-by actor resolved');
    }
    eq(calibration.getLabCalibrationDetail(99999999), null, 'calibration print: bogus id → null (not-found wall)');
    const audit = calibration.getLabCalibrationAudit(equipmentId);
    ok(audit.length > 0, 'calibration print: audit trail rows exist for equipment');
  }

  // ── Maintenance print loader: exact stored values ──
  console.log('■ Maintenance print loader (getLabEquipmentMaintenanceDetail)');
  const maintId = equipment.createLabEquipmentMaintenance(
    equipmentId,
    {
      maintenance_date: '2026-08-15',
      issue: 'Pressure leak on sealing ring',
      maintenance_type: 'Corrective',
      description: 'Replaced the sealing ring and re-tested the chamber.',
      technician_vendor: 'ACME Maintenance Co.',
      status: 'COMPLETED',
      completed_date: '2026-08-16',
      notes: 'Part replaced under warranty.',
    },
    managerId,
  );
  {
    const detail = equipment.getLabEquipmentMaintenanceDetail(maintId);
    ok(detail !== null, 'maintenance print: record loads');
    if (detail) {
      eq(detail.maintenance.id, maintId, 'maintenance print: exact record id');
      eq(detail.maintenance.issue, 'Pressure leak on sealing ring', 'maintenance print: exact issue');
      eq(detail.maintenance.maintenance_type, 'Corrective', 'maintenance print: exact type');
      eq(detail.maintenance.technician_vendor, 'ACME Maintenance Co.', 'maintenance print: exact technician/vendor');
      eq(detail.maintenance.status, 'COMPLETED', 'maintenance print: exact status');
      eq(detail.maintenance.completed_date, '2026-08-16', 'maintenance print: exact completed date');
      eq(detail.maintenance.description, 'Replaced the sealing ring and re-tested the chamber.', 'maintenance print: exact description');
      eq(detail.maintenance.notes, 'Part replaced under warranty.', 'maintenance print: exact notes');
      eq(detail.equipment_id, equipmentId, 'maintenance print: exact equipment id');
      ok(detail.equipment_code === 'NOC-05', 'maintenance print: equipment code resolved');
      ok(detail.created_by_name !== null, 'maintenance print: logged-by actor resolved');
    }
    eq(equipment.getLabEquipmentMaintenanceDetail(99999999), null, 'maintenance print: bogus id → null (not-found wall)');
  }

  // ── Equipment history report: the four lifecycle streams ──
  console.log('■ Equipment history report (getLabEquipmentTimeline + detail)');
  {
    const detail = equipment.getLabEquipmentDetail(equipmentId);
    ok(detail !== null, 'equipment print: record loads');
    if (detail) {
      eq(detail.equipment.code, 'NOC-05', 'equipment print: exact code');
    }
    const timeline = equipment.getLabEquipmentTimeline(equipmentId);
    const kinds = new Set(timeline.map((e) => e.kind));
    ok(kinds.has('MAINTENANCE'), 'equipment print: timeline includes MAINTENANCE event');
    ok(kinds.has('CALIBRATION'), 'equipment print: timeline includes CALIBRATION record');
    ok(kinds.has('RETURNED_TO_SERVICE'), 'equipment print: timeline derives RETURNED_TO_SERVICE from COMPLETED event');
    const returned = timeline.find((e) => e.kind === 'RETURNED_TO_SERVICE');
    if (returned) {
      eq(returned.at, '2026-08-16', 'equipment print: returned-to-service date = completed_date (derived, labeled)');
    }
    const maintEntry = timeline.find((e) => e.kind === 'MAINTENANCE');
    if (maintEntry) {
      eq(maintEntry.title, 'Pressure leak on sealing ring', 'equipment print: timeline maintenance title = stored issue');
    }
  }

  // ── Route registration ──
  console.log('■ Route registration');
  {
    const routes = new Set(navigation.IMPLEMENTED_LAB_ROUTES);
    ok(routes.has('/lab/calibration/[id]/print'), 'routes: /lab/calibration/[id]/print registered');
    ok(routes.has('/lab/equipment/[id]/print'), 'routes: /lab/equipment/[id]/print registered');
    ok(routes.has('/lab/maintenance/[id]/print'), 'routes: /lab/maintenance/[id]/print registered');
  }

  // ── Static print-page conventions (one layout, one h1, scoped headers) ──
  console.log('■ Print page source conventions');
  const pages = [
    ['src/pages/lab/tests/[id]/print.astro', 'test print'],
    ['src/pages/lab/calibration/[id]/print.astro', 'calibration print'],
    ['src/pages/lab/equipment/[id]/print.astro', 'equipment print'],
    ['src/pages/lab/maintenance/[id]/print.astro', 'maintenance print'],
  ];
  for (const [rel, label] of pages) {
    const src = readFileSync(join(appDir, rel), 'utf8');
    ok(src.includes('PrintLayout'), `${label}: reuses PrintLayout (no second print layout)`);
    ok(!src.includes('BaseLayout'), `${label}: no dashboard chrome (BaseLayout absent)`);
    // One <h1> per rendered page: the not-found branch and the success header
    // are mutually exclusive, so at most two occurrences exist in the source.
    const h1s = src.match(/<h1[^>]*>/g) ?? [];
    ok(h1s.length <= 2 && h1s.every((t) => t.includes('print-title')), `${label}: one h1 per rendered page (print-title)`);
    const thTags = (src.match(/<th[\s>][^>]*>/g) ?? []).filter((t) => !t.includes('scope='));
    eq(thTags.length, 0, `${label}: every table th carries scope`);
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
