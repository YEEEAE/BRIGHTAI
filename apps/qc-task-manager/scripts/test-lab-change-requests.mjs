import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { runMigrations } from '../src/lib/migrations.ts';
import {
  canSubmitLabChangeRequest,
  canReviewLabChangeRequests,
  canApproveLabChangeRequest,
  canProposeLabEquipmentCreate,
  canProposeLabEquipmentEdit,
  canApplyLabEquipmentChange,
  canArchiveLabEquipment,
  canProposeLabProductCreate,
  canProposeLabProductEdit,
  canProposeLabCalibrationCreate,
  canProposeLabCalibrationEdit,
  canRecordLabEquipmentMaintenance,
  canCreateLabDocument,
  canEditLabDocument,
  canCreateLabTemplate,
  canEditLabTemplate,
  canApproveLabTemplateRecord,
} from '../src/lib/permissions.ts';
import { labChangeRequestReviewSchema } from '../src/lib/validation.ts';

const appDir = new URL('../', import.meta.url).pathname;
const migrationDir = join(appDir, 'db/migrations');
const tempRoot = mkdtempSync(join(tmpdir(), 'brightai-qc-change-requests-'));

try {
  assert.equal(canSubmitLabChangeRequest('employee'), true);
  assert.equal(canSubmitLabChangeRequest('supervisor'), true);
  assert.equal(canReviewLabChangeRequests('employee'), false);
  assert.equal(canReviewLabChangeRequests('supervisor'), false);
  assert.equal(canReviewLabChangeRequests('manager'), true);
  assert.equal(canApproveLabChangeRequest({ id: 7, role: 'manager' }, { requested_by: 8 }), true);
  assert.equal(canApproveLabChangeRequest({ id: 7, role: 'manager' }, { requested_by: 7 }), false);
  assert.equal(labChangeRequestReviewSchema.safeParse({ action: 'reject', review_note: '' }).success, false);

  for (const role of ['employee', 'supervisor']) {
    assert.equal(canProposeLabEquipmentCreate(role), true, `${role} may propose equipment create`);
    assert.equal(canProposeLabEquipmentEdit(role), true, `${role} may propose equipment edit`);
    assert.equal(canProposeLabProductCreate(role), true, `${role} may propose product create`);
    assert.equal(canProposeLabProductEdit(role), true, `${role} may propose product edit`);
    assert.equal(canProposeLabCalibrationCreate(role), true, `${role} may propose calibration create`);
    assert.equal(canProposeLabCalibrationEdit(role), true, `${role} may propose calibration edit`);
    assert.equal(canRecordLabEquipmentMaintenance(role), true, `${role} may append maintenance`);
    assert.equal(canCreateLabDocument(role), true, `${role} may create a document draft`);
    assert.equal(canEditLabDocument(role), true, `${role} may edit a document draft`);
    assert.equal(canCreateLabTemplate(role), true, `${role} may create a template draft`);
    assert.equal(canEditLabTemplate(role), true, `${role} may edit a template draft`);
  }
  assert.equal(canApplyLabEquipmentChange('employee'), false);
  assert.equal(canApplyLabEquipmentChange('supervisor'), false);
  assert.equal(canApplyLabEquipmentChange('manager'), true);
  assert.equal(canArchiveLabEquipment('employee'), false);
  assert.equal(canArchiveLabEquipment('manager'), true);
  assert.equal(canApproveLabTemplateRecord({ id: 7, role: 'manager' }, { status: 'DRAFT', created_by: 7, author_id: 7 }), false);
  assert.equal(canApproveLabTemplateRecord({ id: 8, role: 'manager' }, { status: 'DRAFT', created_by: 7, author_id: 7 }), true);

  const db = new Database(join(tempRoot, 'fresh.db'));
  const result = runMigrations(db, { migrationsDir: migrationDir, backup: false });
  assert.equal(result.currentVersion, 27);
  assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='lab_change_requests'").get());
  assert.equal(db.pragma('integrity_check', { simple: true }), 'ok');
  assert.deepEqual(db.pragma('foreign_key_check'), []);
  db.close();

  process.env.QC_DATABASE_PATH = join(tempRoot, 'runtime.db');
  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const { submitChangeRequest, approveChangeRequest, rejectChangeRequest, CHANGE_REQUEST_CONFLICT } = await import('../src/lib/lab/changeRequests.ts');
  const runtime = getDb();
  const users = runtime.prepare("SELECT id, role FROM users WHERE role IN ('employee','supervisor','manager','admin') ORDER BY id").all();
  const employee = users.find((u) => u.role === 'employee');
  const supervisor = users.find((u) => u.role === 'supervisor');
  const manager = users.find((u) => u.role === 'manager');
  const admin = users.find((u) => u.role === 'admin');
  assert.ok(employee && supervisor && manager && admin);
  const equipmentData = { name: 'Proposed Equipment', code: 'CR-EQ-1', location: 'Lab A', status_raw: 'New', calibration_status_raw: 'yes', serial_number: 'S-1', notes: null };
  const created = submitChangeRequest({ actor: employee, entity_type: 'EQUIPMENT', operation: 'CREATE', payload: { entity_type: 'EQUIPMENT', data: equipmentData } });
  assert.equal(runtime.prepare('SELECT COUNT(*) AS n FROM lab_equipment WHERE code = ?').get('CR-EQ-1').n, 0);
  assert.throws(() => approveChangeRequest(created.id, supervisor), /cannot approve/);
  const approved = approveChangeRequest(created.id, manager);
  assert.equal(approved.status, 'APPROVED');
  const canonical = runtime.prepare('SELECT id, name FROM lab_equipment WHERE code = ?').get('CR-EQ-1');
  assert.ok(canonical);
  assert.equal(runtime.prepare("SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type='LAB_CHANGE_REQUEST' AND entity_id=?").get(created.id).n, 2);
  assert.equal(runtime.prepare("SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type='LAB_EQUIPMENT' AND entity_id=? AND action='CREATE'").get(canonical.id).n, 1);
  assert.throws(() => approveChangeRequest(created.id, admin), /already been reviewed/);
  assert.throws(() => submitChangeRequest({ actor: employee, entity_type: 'EQUIPMENT', operation: 'UPDATE', entity_id: 999999, payload: { entity_type: 'EQUIPMENT', data: equipmentData } }), /does not exist/);
  assert.throws(() => submitChangeRequest({ actor: employee, entity_type: 'EQUIPMENT', operation: 'CREATE', payload: { entity_type: 'EQUIPMENT', data: { ...equipmentData, name: '' } } }), /required/);

  const update = submitChangeRequest({ actor: supervisor, entity_type: 'EQUIPMENT', operation: 'UPDATE', entity_id: canonical.id, payload: { entity_type: 'EQUIPMENT', data: { ...equipmentData, name: 'Updated proposal' } } });
  runtime.prepare("UPDATE lab_equipment SET updated_at='2099-01-01 00:00:00' WHERE id=?").run(canonical.id);
  assert.throws(() => approveChangeRequest(update.id, manager), new RegExp(CHANGE_REQUEST_CONFLICT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const rejected = submitChangeRequest({ actor: employee, entity_type: 'EQUIPMENT', operation: 'CREATE', payload: { entity_type: 'EQUIPMENT', data: { ...equipmentData, code: 'CR-EQ-2' } } });
  assert.throws(() => rejectChangeRequest(rejected.id, manager, ''), /meaningful/);
  rejectChangeRequest(rejected.id, admin, 'Not needed now');
  assert.equal(runtime.prepare('SELECT COUNT(*) AS n FROM lab_equipment WHERE code = ?').get('CR-EQ-2').n, 0);
  runtime.prepare('UPDATE users SET is_active=0 WHERE id=?').run(admin.id);
  const inactiveBefore = runtime.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND type='lab_change_request_submitted'").get(admin.id).n;
  submitChangeRequest({ actor: employee, entity_type: 'EQUIPMENT', operation: 'CREATE', payload: { entity_type: 'EQUIPMENT', data: { ...equipmentData, code: 'CR-EQ-3' } } });
  assert.equal(runtime.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND type='lab_change_request_submitted'").get(admin.id).n, inactiveBefore);
  const archivedEquipment = runtime.prepare('SELECT id FROM lab_equipment WHERE is_archived = 1 LIMIT 1').get();
  if (archivedEquipment) {
    const calibrationData = { equipment_id: archivedEquipment.id, last_calibrated_at: null, calibration_due_at: null, provider: null, certificate_reference: null, result: null, next_due_at: null, notes: null };
    const calibration = submitChangeRequest({ actor: employee, entity_type: 'CALIBRATION', operation: 'CREATE', payload: { entity_type: 'CALIBRATION', data: calibrationData } });
    assert.throws(() => approveChangeRequest(calibration.id, manager), /Archived equipment/);
    assert.equal(runtime.prepare('SELECT COUNT(*) AS n FROM lab_equipment_calibration WHERE equipment_id=?').get(archivedEquipment.id).n, 0);
  }

  const invalidProduct = submitChangeRequest({ actor: employee, entity_type: 'PRODUCT', operation: 'CREATE', payload: {
    entity_type: 'PRODUCT',
    data: { name: 'Invalid FK product', code: 'CR-PROD-FK', description: null, connector_type: null, default_test_type: null, default_template_id: 999999, applicable_sop_id: null, applicable_wi_id: null, equipment_ids: [], is_active: true, notes: null },
  } });
  assert.throws(() => approveChangeRequest(invalidProduct.id, manager), /template does not exist/);
  assert.equal(runtime.prepare('SELECT COUNT(*) AS n FROM lab_products WHERE code=?').get('CR-PROD-FK').n, 0);

  const privateRequest = submitChangeRequest({ actor: employee, entity_type: 'EQUIPMENT', operation: 'CREATE', payload: { entity_type: 'EQUIPMENT', data: { ...equipmentData, code: 'CR-EQ-PRIVATE' } } });
  const { getChangeRequestForViewer } = await import('../src/lib/lab/changeRequests.ts');
  assert.equal(getChangeRequestForViewer(privateRequest.id, supervisor), null);
  assert.ok(getChangeRequestForViewer(privateRequest.id, employee));
  assert.ok(getChangeRequestForViewer(privateRequest.id, manager));

  const equipmentForm = readFileSync(new URL('../src/components/lab/LabEquipmentForm.astro', import.meta.url), 'utf8');
  const productForm = readFileSync(new URL('../src/components/lab/LabProductForm.astro', import.meta.url), 'utf8');
  const calibrationForm = readFileSync(new URL('../src/components/lab/LabCalibrationForm.astro', import.meta.url), 'utf8');
  for (const source of [equipmentForm, productForm, calibrationForm]) {
    assert.match(source, /Submit for Review/);
    assert.match(source, /Your change will be reviewed by laboratory management before it becomes active\./);
  }

  closeDatabase();
  console.log('lab change request tests passed');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
