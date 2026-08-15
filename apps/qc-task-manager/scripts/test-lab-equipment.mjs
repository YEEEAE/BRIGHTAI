// Database-backed unit checks for the QC Laboratory Equipment Registry
// (src/lib/lab/equipment.ts + seed.ts + equipmentStatus.ts — PROMPT 11,
// /lab/equipment).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Seed is ON (QC_SEED_LAB_EQUIPMENT=1) so the
// canonical 24-device registry loads. Focus: verbatim seeding + idempotency,
// the fully-parameterized list search (no user text in SQL, whitelisted sort,
// LIKE escaping, status filter via the display mapping), create/update
// transactions, archive/restore (is_archived — never a hard delete), audit
// rows on the shared qc_audit_log, and the read surface (detail + timeline).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-equipment-'));
const dbPath = join(tempDir, 'lab-equipment.db');

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
  return new URL(`https://qc.local/lab/equipment${qs}`);
}

let db;
let managerId;

function formData(overrides = {}) {
  return {
    name: 'Vacuum Test Chamber',
    code: 'EQ-UNIT-001',
    location: 'LABORATORY',
    status_raw: 'In Use',
    calibration_status_raw: 'yes',
    serial_number: 'SN-9000',
    notes: 'Calibrated quarterly',
    ...overrides,
  };
}

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
  const seed = await import('../src/lib/lab/seed.ts');
  const status = await import('../src/lib/lab/equipmentStatus.ts');
  const perms = await import('../src/lib/permissions.ts');

  db = getDb();
  managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);

  // ── Seed: 24 rows verbatim ──
  console.log('■ Seed');
  {
    const count = db.prepare('SELECT COUNT(*) AS n FROM lab_equipment').get().n;
    eq(Number(count), 24, 'seed: exactly 24 registry rows');
    eq(seed.EQUIPMENT_SEED_ROWS.length, 24, 'seed: constant holds 24 rows');

    const row1 = db.prepare("SELECT * FROM lab_equipment WHERE code = 'NOC-05'").get();
    ok(!!row1, 'seed: NOC-05 present');
    eq(row1.name, 'Breathing Filter Pressure', 'seed: NOC-05 name verbatim');
    eq(row1.status_raw, 'تحت الصيانة / NEW', 'seed: NOC-05 status verbatim (Arabic/English compound)');
    eq(row1.calibration_status_raw, 'yes', 'seed: NOC-05 calibration');
    eq(row1.serial_number, '251206666', 'seed: NOC-05 serial');
    eq(row1.notes, 'تم التواصل مع المورد وتوفير دليل التشغيل والتعليمات', 'seed: NOC-05 notes verbatim (Arabic)');
    eq(row1.location, 'LABORATORY', 'seed: NOC-05 location');
    eq(row1.is_archived, 0, 'seed: active by default');

    const row6 = db.prepare("SELECT * FROM lab_equipment WHERE serial_number = '1-800-5556-3484'").get();
    ok(!!row6, 'seed: row 6 (phone-style serial) present');
    eq(row6.code, '-', 'seed: row 6 code "-" preserved');
    eq(row6.calibration_status_raw, 'no', 'seed: row 6 calibration no');

    const row13 = db.prepare("SELECT * FROM lab_equipment WHERE code = 'BSS-250N, 250N'").get();
    ok(!!row13, 'seed: comma-containing code present');
    eq(row13.status_raw, 'غير مستخدم / تحت الصيانة', 'seed: row 13 status verbatim');

    const row8 = db.prepare("SELECT * FROM lab_equipment WHERE code = 'HZ-60'").get();
    eq(row8.serial_number, 'DOA-P104-AA', 'seed: HZ-60 serial verbatim');
    eq(row8.calibration_status_raw, 'no', 'seed: HZ-60 calibration no');

    const row24 = db.prepare("SELECT * FROM lab_equipment WHERE code = 'DVT-01'").get();
    eq(row24.status_raw, 'NEW / تحت الصيانة', 'seed: DVT-01 status verbatim');
    eq(row24.serial_number, '240710362', 'seed: DVT-01 serial');

    const codes = db.prepare('SELECT COUNT(*) AS n FROM lab_equipment').get().n;
    const distinct = db.prepare('SELECT COUNT(DISTINCT code) AS n FROM lab_equipment').get().n;
    eq(Number(codes), Number(distinct), 'seed: codes unique');
  }

  // ── Seed idempotency + user-edit preservation ──
  console.log('■ Seed idempotency');
  {
    eq(seed.seedLabEquipmentIfEmpty(db), 0, 're-seed: no rows inserted (already present)');
    eq(db.prepare('SELECT COUNT(*) AS n FROM lab_equipment').get().n, 24, 're-seed: still 24 rows (no duplicates)');

    // User edits survive re-running the seed (name/notes change only — the
    // status stays verbatim so the pristine search counts below are intact).
    const editedId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'NOC-05'").get().id);
    equipment.updateLabEquipment(
      editedId,
      formData({ code: 'NOC-05', name: 'Breathing Filter Pressure (repaired)', status_raw: 'تحت الصيانة / NEW', notes: 'Edited by user' }),
      managerId,
    );
    eq(seed.seedLabEquipmentIfEmpty(db), 0, 're-seed after edit: no overwrite');
    const after = db.prepare('SELECT name, notes FROM lab_equipment WHERE id = ?').get(editedId);
    eq(after.name, 'Breathing Filter Pressure (repaired)', 're-seed: user name edit preserved');
    eq(after.notes, 'Edited by user', 're-seed: user notes edit preserved');
  }

  // ── Display mapping ──
  console.log('■ Status display mapping');
  {
    eq(status.statusLabels('مستخدم'), 'In Use', 'mapping: مستخدم → In Use');
    eq(status.statusLabels('تحت الصيانة'), 'Under Maintenance', 'mapping: تحت الصيانة → Under Maintenance');
    eq(status.statusLabels('غير مستخدم'), 'Not In Use', 'mapping: غير مستخدم → Not In Use');
    eq(status.statusLabels('NEW'), 'New', 'mapping: NEW → New');
    eq(status.statusLabels('غير مستخدم / DONE'), 'Not In Use / Done', 'mapping: compound keeps both parts');
    eq(status.statusLabels(null), '—', 'mapping: null → em dash');
    ok(status.statusMatchesLabel('غير مستخدم / DONE', 'Not In Use'), 'matches: compound matches part A');
    ok(status.statusMatchesLabel('غير مستخدم / DONE', 'Done'), 'matches: compound matches part B');
    ok(!status.statusMatchesLabel('مستخدم', 'Done'), 'matches: disjoint labels do not match');
    eq(status.calibrationLabel('yes'), 'Yes', 'calibration: yes → Yes');
    eq(status.calibrationLabel('no'), 'No', 'calibration: no → No');
    eq(status.calibrationLabel(null), 'Unknown', 'calibration: null → Unknown');
  }

  // ── Filter parsing / querystring round-trip ──
  console.log('■ Filter parsing');
  {
    const f = equipment.parseLabEquipmentSearchFilters(
      fakeUrl('?q=seal&status=In+Use&calibration=yes&archived=1&sort=code&dir=asc&page=2&per=50'),
    );
    eq(f.q, 'seal', 'parse: q');
    eq(f.status, 'In Use', 'parse: status');
    eq(f.calibration, 'yes', 'parse: calibration');
    eq(f.archived, '1', 'parse: archived');
    eq(f.sort, 'code', 'parse: sort');
    eq(f.dir, 'asc', 'parse: dir');
    eq(f.page, 2, 'parse: page');
    eq(f.per_page, 50, 'parse: per_page');
    const bad = equipment.parseLabEquipmentSearchFilters(fakeUrl('?status=x&calibration=maybe&archived=2&sort=;DROP&dir=up&page=-1&per=7'));
    eq(bad.status, 'x', 'parse: arbitrary status preserved (unmapped labels filter to empty)');
    eq(bad.calibration, null, 'parse: bogus calibration dropped');
    eq(bad.archived, '0', 'parse: bogus archived falls back to active-only');
    eq(bad.sort, equipment.DEFAULT_LAB_EQUIPMENT_SORT, 'parse: bogus sort falls back to default');
    eq(bad.dir, equipment.DEFAULT_LAB_EQUIPMENT_DIR, 'parse: bogus dir falls back to default');
    eq(bad.page, 1, 'parse: negative page dropped');
    eq(bad.per_page, equipment.DEFAULT_LAB_EQUIPMENT_PER_PAGE, 'parse: non-allowlisted per dropped');
    ok(equipment.hasLabEquipmentFilters(f), 'hasFilters: true with q');
    ok(!equipment.hasLabEquipmentFilters(equipment.NO_LAB_EQUIPMENT_FILTERS), 'hasFilters: false with none');
    const qs = equipment.labEquipmentFiltersToQuery(f);
    ok(qs.includes('q=seal') && qs.includes('status=In+Use') && qs.includes('calibration=yes') && qs.includes('archived=1'), 'querystring: rebuilt');
    ok(equipment.labEquipmentFiltersToQuery(equipment.NO_LAB_EQUIPMENT_FILTERS) === '', 'querystring: empty for defaults');
    const all = equipment.labEquipmentFiltersToQuery({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, archived: null });
    ok(all.includes('archived=all'), 'querystring: archived=all round-trips');
  }

  // ── WHERE builder is fully parameterized ──
  console.log('■ WHERE builder');
  {
    const f = { ...equipment.NO_LAB_EQUIPMENT_FILTERS, archived: null, q: "50%; DROP TABLE lab_equipment --_x" };
    const { sql, params } = equipment.buildLabEquipmentWhere(f);
    ok(!sql.includes('50%'), 'WHERE: user text never appears in SQL');
    ok(params.length === 6 && params.every((p) => typeof p === 'string'), 'WHERE: six LIKE params bound');
    ok(equipment.buildLabEquipmentWhere({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, archived: null }).sql === '', 'WHERE: empty for no filters');
    const esc = equipment.escapeEquipmentLike('a\\b%c_d');
    eq(esc, 'a\\\\b\\%c\\_d', 'escapeLike: wildcards escaped');

    // Status label filter maps to the raw values whose tokens match.
    const byStatus = equipment.buildLabEquipmentWhere({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, status: 'Under Maintenance' });
    ok(byStatus.sql.includes('status_raw IN'), 'WHERE: status filter uses IN clause');
    ok(byStatus.params.length > 0, 'WHERE: status filter binds raw values');
    ok(byStatus.params.some((p) => p === 'تحت الصيانة / NEW'), 'WHERE: compound raw value included');
    ok(byStatus.params.some((p) => p === 'غير مستخدم / تحت الصيانة'), 'WHERE: compound two-token raw included');
    ok(byStatus.params.some((p) => p === 'NEW / تحت الصيانة'), 'WHERE: reversed compound raw included');
  }

  // ── Search ──
  console.log('■ Search');
  {
    const all = equipment.searchLabEquipment(equipment.NO_LAB_EQUIPMENT_FILTERS);
    eq(all.total, 24, 'search: total counts every device (active default)');
    ok(all.total_pages === 1 && all.page === 1, 'search: pagination defaults');

    const inUse = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, status: 'In Use' });
    eq(inUse.total, 7, 'search: In Use → 7 devices');
    const underMaint = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, status: 'Under Maintenance' });
    eq(underMaint.total, 11, 'search: Under Maintenance → 11 devices (compound both-token raws included)');
    const notInUse = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, status: 'Not In Use' });
    eq(notInUse.total, 6, 'search: Not In Use → 6 devices');
    const newState = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, status: 'New' });
    eq(newState.total, 9, 'search: New → 9 devices');
    const done = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, status: 'Done' });
    eq(done.total, 1, 'search: Done → 1 device (غير مستخدم / DONE)');

    const calYes = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, calibration: 'yes' });
    eq(calYes.total, 20, 'search: calibration yes → 20 devices');
    const calNo = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, calibration: 'no' });
    eq(calNo.total, 4, 'search: calibration no → 4 devices');

    const q = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, q: 'DOA-P104-AA' });
    eq(q.total, 1, 'search: serial text matches');
    const qNotes = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, q: 'Need Clip' });
    eq(qNotes.total, 3, 'search: notes text matches');

    const noMatch = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, status: 'Bogus Status' });
    eq(noMatch.total, 0, 'search: unmapped status label → empty result');

    const sorted = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, sort: 'code', dir: 'asc' });
    eq(sorted.rows[0].code, '-', 'search: sort by code asc (code "-" collates first)');
    const desc = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, sort: 'updated_at', dir: 'desc' });
    ok(desc.rows[0].id !== sorted.rows[0].id, 'search: sort order differs by field');
  }

  // ── Create ──
  console.log('■ Create');
  let equipmentId;
  {
    equipmentId = equipment.createLabEquipment(formData(), managerId);
    ok(Number.isInteger(equipmentId) && equipmentId > 0, 'create: returns id');
    const row = db.prepare('SELECT * FROM lab_equipment WHERE id = ?').get(equipmentId);
    eq(row.name, 'Vacuum Test Chamber', 'create: name stored');
    eq(row.code, 'EQ-UNIT-001', 'create: code stored');
    eq(row.status_raw, 'In Use', 'create: status stored');
    eq(row.calibration_status_raw, 'yes', 'create: calibration stored');
    eq(row.is_archived, 0, 'create: active by default');
    const audits = db.prepare("SELECT action, actor_id FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT' AND entity_id = ? ORDER BY id").all(equipmentId);
    eq(audits.length, 1, 'create: exactly one audit row');
    eq(audits[0].action, 'CREATE', 'create: audit action CREATE');
    eq(Number(audits[0].actor_id), managerId, 'create: audit actor');
  }

  // ── Code conflicts ──
  console.log('■ Code conflicts');
  {
    let threw = null;
    try {
      equipment.createLabEquipment(formData({ name: 'Other', code: 'eq-unit-001' }), managerId);
    } catch (err) {
      threw = err;
    }
    ok(threw instanceof equipment.LabEquipmentCodeConflictError, 'create: case-insensitive code conflict rejected');
    let threwSame = null;
    try {
      equipment.updateLabEquipment(equipmentId, formData({ code: 'EQ-UNIT-999' }), managerId);
      equipment.updateLabEquipment(equipmentId, formData({ code: 'eq-unit-999' }), managerId);
    } catch (err) {
      threwSame = err;
    }
    ok(threwSame === null, 'update: same device may keep/rename its own code case-insensitively');
    let dup = null;
    try {
      equipment.updateLabEquipment(equipmentId, formData({ code: 'NOC-05' }), managerId);
    } catch (err) {
      dup = err;
    }
    ok(dup instanceof equipment.LabEquipmentCodeConflictError, 'update: renaming onto a seeded code rejected');
  }

  // ── Update (fields + audit) ──
  console.log('■ Update');
  {
    equipment.updateLabEquipment(
      equipmentId,
      formData({ code: 'EQ-UNIT-999', name: 'Vacuum Test Chamber v2', status_raw: 'تحت الصيانة', calibration_status_raw: 'no', notes: 'Sent for repair' }),
      managerId,
    );
    const row = db.prepare('SELECT * FROM lab_equipment WHERE id = ?').get(equipmentId);
    eq(row.name, 'Vacuum Test Chamber v2', 'update: name changed');
    eq(row.code, 'EQ-UNIT-999', 'update: code changed');
    eq(row.status_raw, 'تحت الصيانة', 'update: status changed');
    eq(row.calibration_status_raw, 'no', 'update: calibration changed');
    const audits = db.prepare("SELECT action, note FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT' AND entity_id = ? ORDER BY id").all(equipmentId);
    const lastAudit = audits[audits.length - 1];
    eq(lastAudit.action, 'UPDATE', 'update: audit action UPDATE');
    ok(/status_changed_from=In Use/.test(lastAudit.note), 'update: status change ALWAYS logged');
    ok(/calibration_changed_from=yes/.test(lastAudit.note), 'update: calibration change ALWAYS logged');
    ok(/code_changed_from=eq-unit-999/.test(lastAudit.note), 'update: code change logged');
  }

  // ── Archive / restore ──
  console.log('■ Archive / restore');
  {
    equipment.archiveLabEquipment(equipmentId, managerId);
    const archived = db.prepare('SELECT is_archived FROM lab_equipment WHERE id = ?').get(equipmentId);
    eq(archived.is_archived, 1, 'archive: is_archived=1 (row kept, no hard delete)');
    const audit = db.prepare("SELECT action, note FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT' AND entity_id = ? ORDER BY id DESC LIMIT 1").get(equipmentId);
    eq(audit.action, 'UPDATE', 'archive: audited as UPDATE');
    ok(/archived/.test(audit.note), 'archive: note marks archived');

    let doubleArchive = null;
    try {
      equipment.archiveLabEquipment(equipmentId, managerId);
    } catch (err) {
      doubleArchive = err;
    }
    ok(doubleArchive instanceof Error && /already archived/i.test(doubleArchive.message), 'archive: double-archive rejected');

    const activeOnly = equipment.searchLabEquipment(equipment.NO_LAB_EQUIPMENT_FILTERS);
    eq(activeOnly.total, 24, 'archive: archived device hidden from active-only list (24 active)');

    equipment.restoreLabEquipment(equipmentId, managerId);
    eq(db.prepare('SELECT is_archived FROM lab_equipment WHERE id = ?').get(equipmentId).is_archived, 0, 'restore: is_archived back to 0');
    const restoreAudit = db.prepare("SELECT action, note FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT' AND entity_id = ? ORDER BY id DESC LIMIT 1").get(equipmentId);
    ok(/restored/.test(restoreAudit.note), 'restore: note marks restored');

    equipment.archiveLabEquipment(equipmentId, managerId);
    const archivedList = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, archived: '1' });
    eq(archivedList.total, 1, 'search: archived filter shows the archived device');
    const allList = equipment.searchLabEquipment({ ...equipment.NO_LAB_EQUIPMENT_FILTERS, archived: null });
    eq(allList.total, 25, 'search: archived=all shows every device (24 + archived)');
  }

  // ── Detail ──
  console.log('■ Detail');
  {
    const detail = equipment.getLabEquipmentDetail(equipmentId);
    ok(detail !== null, 'detail: found');
    eq(detail.equipment.code, 'EQ-UNIT-999', 'detail: code');
    eq(detail.equipment.calibration_status_raw, 'no', 'detail: calibration field present');
    eq(detail.test_count, 0, 'detail: zero usage');
    ok(typeof detail.updated_by_name === 'string' && detail.updated_by_name.length > 0, 'detail: updated_by_name resolved from audit');
    eq(detail.documents.length, 0, 'detail: no linked documents');
    eq(equipment.getLabEquipmentDetail(999999), null, 'detail: missing id → null');
    eq(equipment.getLabEquipmentDetail(-1), null, 'detail: invalid id → null');

    const timeline = equipment.getLabEquipmentAuditTimeline(equipmentId);
    ok(timeline.length >= 5, 'detail: change history has CREATE + updates + archive/restore');
    eq(timeline[0].action, 'UPDATE', 'detail: newest audit first');
  }

  // ── RBAC ──
  console.log('■ RBAC');
  {
    ok(perms.canViewLabEquipment('employee'), 'RBAC: employee may view the registry');
    ok(perms.canViewLabEquipment('admin'), 'RBAC: admin may view');
    eq(perms.canCreateLabEquipment('employee'), false, 'RBAC: employee cannot create');
    eq(perms.canCreateLabEquipment('supervisor'), false, 'RBAC: supervisor cannot create');
    ok(perms.canCreateLabEquipment('manager'), 'RBAC: manager can create');
    ok(perms.canCreateLabEquipment('admin'), 'RBAC: admin can create');
    eq(perms.canEditLabEquipment('employee'), false, 'RBAC: employee cannot edit');
    ok(perms.canEditLabEquipment('manager'), 'RBAC: manager can edit');
    eq(perms.canArchiveLabEquipment('employee'), false, 'RBAC: employee cannot archive');
    ok(perms.canArchiveLabEquipment('manager'), 'RBAC: manager can archive');
    ok(perms.canRecordLabEquipmentMaintenance('supervisor'), 'RBAC: supervisor can record maintenance');
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