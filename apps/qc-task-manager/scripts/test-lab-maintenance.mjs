// Database-backed unit checks for the QC Laboratory maintenance log
// (src/lib/lab/equipment.ts maintenance + timeline + audit — /lab/equipment/
// [id]/maintenance, page reference §36).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed is ON (QC_SEED_LAB_EQUIPMENT=1) so the
// canonical 24-device registry loads — maintenance history itself is NEVER
// seeded (starts empty, no fabricated events). Focus: the Zod schema (required
// fields, controlled status enum, completed_date rules, length bounds,
// unknown-key rejection), append-only create + CREATE audit, archived-equipment
// rejection, list ordering, the combined timeline (usage / maintenance /
// calibration / returned-to-service derived from COMPLETED events), the
// maintenance audit trail, and the supervisor+ permission.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-maintenance-'));
const dbPath = join(tempDir, 'lab-maintenance.db');

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

function fd(overrides = {}) {
  const f = new FormData();
  f.set('maintenance_date', '2026-08-15');
  f.set('issue', 'Pressure leak on sealing ring');
  f.set('maintenance_type', 'Corrective');
  f.set('description', 'Replaced the sealing ring and re-tested the chamber.');
  f.set('technician_vendor', 'ACME Maintenance Co.');
  f.set('status', 'COMPLETED');
  f.set('completed_date', '2026-08-16');
  f.set('notes', 'Part replaced under warranty.');
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) f.delete(k);
    else f.set(k, String(v));
  }
  return f;
}

let db;
let managerId;
let supervisorId;

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
  const equipment = await import('../src/lib/lab/equipment.ts');
  const validation = await import('../src/lib/validation.ts');
  const policy = await import('../src/lib/lab/policy.ts');
  const perms = await import('../src/lib/permissions.ts');

  db = getDb();
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);

  // A seeded device to attach maintenance to (no fabricated events on it).
  const equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'NOC-05'").get().id);

  // ── Policy constants ──
  console.log('■ Policy');
  {
    eq(policy.LAB_MAINTENANCE_STATUSES.length, 4, 'policy: four maintenance statuses');
    ok(policy.LAB_MAINTENANCE_STATUSES.includes('PLANNED'), 'policy: PLANNED');
    ok(policy.LAB_MAINTENANCE_STATUSES.includes('IN_PROGRESS'), 'policy: IN_PROGRESS');
    ok(policy.LAB_MAINTENANCE_STATUSES.includes('COMPLETED'), 'policy: COMPLETED');
    ok(policy.LAB_MAINTENANCE_STATUSES.includes('CANCELLED'), 'policy: CANCELLED');
    eq(policy.LAB_MAINTENANCE_STATUS_LABELS.COMPLETED, 'Completed', 'policy: COMPLETED label');
    eq(policy.LAB_MAINTENANCE_STATUS_LABELS.IN_PROGRESS, 'In Progress', 'policy: IN_PROGRESS label');
  }

  // ── Schema validation ──
  console.log('■ Schema');
  {
    const good = validation.parseFormData(validation.labMaintenanceSchema, fd());
    ok(good.ok, 'schema: complete COMPLETED event passes');
    if (good.ok) {
      eq(good.data.maintenance_date, '2026-08-15', 'schema: maintenance_date');
      eq(good.data.issue, 'Pressure leak on sealing ring', 'schema: issue');
      eq(good.data.status, 'COMPLETED', 'schema: status');
      eq(good.data.completed_date, '2026-08-16', 'schema: completed_date');
      eq(good.data.description, 'Replaced the sealing ring and re-tested the chamber.', 'schema: description');
    }

    const noDate = validation.parseFormData(validation.labMaintenanceSchema, fd({ maintenance_date: '' }));
    ok(!noDate.ok && /Maintenance Date is required/.test(noDate.error), 'schema: maintenance_date required');

    const badDate = validation.parseFormData(validation.labMaintenanceSchema, fd({ maintenance_date: '15/08/2026' }));
    ok(!badDate.ok && /valid date/.test(badDate.error), 'schema: maintenance_date must be YYYY-MM-DD');

    const noIssue = validation.parseFormData(validation.labMaintenanceSchema, fd({ issue: '' }));
    ok(!noIssue.ok && /Issue is required/.test(noIssue.error), 'schema: issue required');

    const noType = validation.parseFormData(validation.labMaintenanceSchema, fd({ maintenance_type: '   ' }));
    ok(!noType.ok && /Maintenance Type is required/.test(noType.error), 'schema: maintenance_type required (trimmed)');

    const noTech = validation.parseFormData(validation.labMaintenanceSchema, fd({ technician_vendor: '' }));
    ok(!noTech.ok && /Technician \/ Vendor is required/.test(noTech.error), 'schema: technician_vendor required');

    const badStatus = validation.parseFormData(validation.labMaintenanceSchema, fd({ status: 'FIXED' }));
    ok(!badStatus.ok && /Invalid maintenance status/.test(badStatus.error), 'schema: unknown status rejected');

    const completedNoDate = validation.parseFormData(
      validation.labMaintenanceSchema,
      fd({ status: 'COMPLETED', completed_date: null }),
    );
    ok(!completedNoDate.ok && /Completed Date is required/.test(completedNoDate.error), 'schema: COMPLETED requires completed_date');

    const dateBefore = validation.parseFormData(
      validation.labMaintenanceSchema,
      fd({ maintenance_date: '2026-08-20', completed_date: '2026-08-10' }),
    );
    ok(!dateBefore.ok && /cannot be before/.test(dateBefore.error), 'schema: completed_date cannot precede maintenance_date');

    const longIssue = validation.parseFormData(
      validation.labMaintenanceSchema,
      fd({ issue: 'x'.repeat(policy.LAB_SHORT_TEXT_MAX + 1) }),
    );
    ok(!longIssue.ok, 'schema: issue length bounded');

    const plannedOk = validation.parseFormData(
      validation.labMaintenanceSchema,
      fd({ status: 'PLANNED', completed_date: null }),
    );
    ok(plannedOk.ok, 'schema: PLANNED with no completed_date passes');

    // Mass-assignment guard: unknown keys are rejected.
    const extra = new FormData();
    extra.set('maintenance_date', '2026-08-15');
    extra.set('issue', 'Leak');
    extra.set('maintenance_type', 'Corrective');
    extra.set('technician_vendor', 'Vendor');
    extra.set('status', 'PLANNED');
    extra.set('created_by', '999');
    const strict = validation.parseFormData(validation.labMaintenanceSchema, extra);
    ok(!strict.ok, 'schema: unknown key (created_by) rejected — mass-assignment guard');
  }

  // ── Create + audit ──
  console.log('■ Create');
  let maintenanceId;
  {
    // Empty by default — no fabricated history.
    eq(equipment.listLabEquipmentMaintenance(equipmentId).length, 0, 'create: history starts empty (no fabricated events)');
    eq(equipment.getLabEquipmentTimeline(equipmentId).length, 0, 'create: timeline starts empty');

    const parsed = validation.parseFormData(validation.labMaintenanceSchema, fd());
    ok(parsed.ok, 'create: form data parses');
    maintenanceId = equipment.createLabEquipmentMaintenance(equipmentId, parsed.data, managerId);
    ok(Number.isInteger(maintenanceId) && maintenanceId > 0, 'create: returns id');

    const row = db.prepare('SELECT * FROM lab_equipment_maintenance WHERE id = ?').get(maintenanceId);
    eq(row.equipment_id, equipmentId, 'create: equipment_id stored');
    eq(row.maintenance_date, '2026-08-15', 'create: maintenance_date stored');
    eq(row.issue, 'Pressure leak on sealing ring', 'create: issue stored');
    eq(row.maintenance_type, 'Corrective', 'create: maintenance_type stored');
    eq(row.technician_vendor, 'ACME Maintenance Co.', 'create: technician_vendor stored');
    eq(row.status, 'COMPLETED', 'create: status stored');
    eq(row.completed_date, '2026-08-16', 'create: completed_date stored');
    eq(Number(row.created_by), managerId, 'create: created_by from actor');

    const audits = db
      .prepare("SELECT action, actor_id, note FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT_MAINTENANCE' AND entity_id = ? ORDER BY id")
      .all(maintenanceId);
    eq(audits.length, 1, 'create: exactly one audit row');
    eq(audits[0].action, 'CREATE', 'create: audit action CREATE');
    eq(Number(audits[0].actor_id), managerId, 'create: audit actor');
    ok(/equipment=NOC-05/.test(audits[0].note), 'create: audit note carries equipment code');
    ok(/maintenance_date=2026-08-15/.test(audits[0].note), 'create: audit note carries maintenance date');
    ok(/status=COMPLETED/.test(audits[0].note), 'create: audit note carries status');
  }

  // ── Invalid targets ──
  console.log('■ Invalid targets');
  {
    const dataObj = {
      maintenance_date: '2026-08-15',
      issue: 'Leak',
      maintenance_type: 'Corrective',
      description: null,
      technician_vendor: 'Vendor',
      status: 'PLANNED',
      completed_date: null,
      notes: null,
    };
    let missing = null;
    try {
      equipment.createLabEquipmentMaintenance(999999, dataObj, managerId);
    } catch (err) {
      missing = err;
    }
    ok(missing instanceof Error && /not found/i.test(missing.message), 'target: missing equipment rejected');

    const archivedId = equipment.createLabEquipment(formDataNOC(), managerId);
    equipment.archiveLabEquipment(archivedId, managerId);
    let archived = null;
    try {
      equipment.createLabEquipmentMaintenance(archivedId, dataObj, managerId);
    } catch (err) {
      archived = err;
    }
    ok(archived instanceof Error && /archived/i.test(archived.message), 'target: archived equipment rejected');
  }

  // ── List ordering ──
  console.log('■ List ordering');
  {
    // A second, newer event (different date) — newest first.
    equipment.createLabEquipmentMaintenance(
      equipmentId,
      {
        maintenance_date: '2026-09-01',
        issue: 'Scheduled preventive check',
        maintenance_type: 'Preventive',
        description: null,
        technician_vendor: 'ACME Maintenance Co.',
        status: 'PLANNED',
        completed_date: null,
        notes: null,
      },
      supervisorId,
    );
    const rows = equipment.listLabEquipmentMaintenance(equipmentId);
    eq(rows.length, 2, 'list: two events');
    eq(rows[0].maintenance_date, '2026-09-01', 'list: newest maintenance_date first');
    eq(rows[0].issue, 'Scheduled preventive check', 'list: newest issue first');
    eq(rows[0].status, 'PLANNED', 'list: PLANNED event stored');
  }

  // ── Timeline: usage + maintenance + calibration + returned to service ──
  console.log('■ Timeline');
  {
    // Usage — a real test record referencing the device.
    db.prepare(
      `INSERT INTO lab_test_records (test_number, test_type, status, final_result, equipment_id, created_by)
       VALUES ('LAB-TEST-00999', 'air', 'APPROVED', 'PASS', ?, ?)`,
    ).run(equipmentId, managerId);

    // Calibration — a real calibration record.
    db.prepare(
      `INSERT INTO lab_equipment_calibration (equipment_id, last_calibrated_at, provider, certificate_reference, result, created_by)
       VALUES (?, '2026-07-10', 'Metrology SA', 'CAL-2026-001', 'PASS', ?)`,
    ).run(equipmentId, managerId);

    const timeline = equipment.getLabEquipmentTimeline(equipmentId);
    eq(timeline.length, 5, 'timeline: 5 entries (1 usage + 2 maintenance + 1 calibration + 1 returned-to-service)');

    const kinds = timeline.map((e) => e.kind);
    ok(kinds.includes('USAGE'), 'timeline: usage present');
    ok(kinds.includes('MAINTENANCE'), 'timeline: maintenance present');
    ok(kinds.includes('CALIBRATION'), 'timeline: calibration present');
    ok(kinds.includes('RETURNED_TO_SERVICE'), 'timeline: returned-to-service present');

    const returned = timeline.find((e) => e.kind === 'RETURNED_TO_SERVICE');
    eq(returned.at, '2026-08-16', 'timeline: returned-to-service at the completed date');
    ok(/Returned to service/i.test(returned.title), 'timeline: returned-to-service title');

    const usage = timeline.find((e) => e.kind === 'USAGE');
    eq(usage.title, 'LAB-TEST-00999 · APPROVED', 'timeline: usage title carries test number + status');
    ok(usage.href === '/lab/tests/' + usage.ref_id, 'timeline: usage drills into the test');
    ok(/Final result: PASS/.test(usage.detail), 'timeline: usage carries final result');

    const calibration = timeline.find((e) => e.kind === 'CALIBRATION');
    eq(calibration.title, 'Calibration · CAL-2026-001', 'timeline: calibration title carries certificate reference');
    ok(/Metrology SA/.test(calibration.detail), 'timeline: calibration detail carries provider');

    // Sorted newest first by event date.
    const ats = timeline.map((e) => e.at);
    const sortedAts = [...ats].sort((a, b) => b.localeCompare(a));
    eq(ats.join('|'), sortedAts.join('|'), 'timeline: newest first by date');

    // A COMPLETED event without a completed date does NOT emit returned-to-service.
    const noReturn = equipment.createLabEquipmentMaintenance(
      equipmentId,
      {
        maintenance_date: '2026-08-01',
        issue: 'Completed but not dated',
        maintenance_type: 'Corrective',
        description: null,
        technician_vendor: 'Vendor X',
        status: 'COMPLETED',
        completed_date: null,
        notes: null,
      },
      managerId,
    );
    const after = equipment.getLabEquipmentTimeline(equipmentId);
    ok(after.filter((e) => e.kind === 'RETURNED_TO_SERVICE').length === 1, 'timeline: undated COMPLETED adds no returned-to-service');
  }

  // ── Maintenance audit trail ──
  console.log('■ Audit trail');
  {
    const audit = equipment.getLabEquipmentMaintenanceAudit(equipmentId);
    eq(audit.length, 3, 'audit: one row per maintenance event (append-only)');
    eq(audit[0].action, 'CREATE', 'audit: newest first, action CREATE');
    ok(typeof audit[0].actor_name === 'string' && audit[0].actor_name.length > 0, 'audit: actor name resolved');
    ok(!audit.some((a) => a.entity_type === 'LAB_EQUIPMENT'), 'audit: only maintenance rows (not equipment rows)');
  }

  // ── RBAC ──
  console.log('■ RBAC');
  {
    eq(perms.canRecordLabEquipmentMaintenance('employee'), false, 'RBAC: employee cannot record maintenance');
    ok(perms.canRecordLabEquipmentMaintenance('supervisor'), 'RBAC: supervisor can record maintenance');
    ok(perms.canRecordLabEquipmentMaintenance('manager'), 'RBAC: manager can record maintenance');
    ok(perms.canRecordLabEquipmentMaintenance('admin'), 'RBAC: admin can record maintenance');
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

function formDataNOC() {
  return {
    name: 'Breathing Filter Pressure (copy)',
    code: 'MAINT-SPARE-01',
    location: 'LABORATORY',
    status_raw: 'In Use',
    calibration_status_raw: 'yes',
    serial_number: 'SN-MAINT-1',
    notes: null,
  };
}