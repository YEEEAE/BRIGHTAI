// Database-backed unit checks for the QC Laboratory Test Templates
// (src/lib/lab/templates.ts — PROMPT 10, /lab/templates).
//
// Covers the PROMPT 36 Templates group against an isolated temporary database:
//   - create: template starts DRAFT with version 1, download audit, current
//     version set.
//   - version: an unapproved version edits in place; editing after approval
//     creates version N+1 (approved versions are IMMUTABLE).
//   - approve: freezes the version (approved_by), sets ACTIVE + current.
//   - relation to test: a test snapshots template_id + template_version_id and
//     keeps that reference even when a later version or an archive supersedes
//     the template (version-locked historical integrity).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. Uses a throwaway temp DB deleted on exit.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-templates-'));
const dbPath = join(tempDir, 'lab-templates.db');

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
  const tpl = await import('../src/lib/lab/templates.ts');
  const tests = await import('../src/lib/lab/tests.ts');
  const perms = await import('../src/lib/permissions.ts');

  const db = getDb();
  const managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);
  const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  const adminId = Number(db.prepare("SELECT id FROM users WHERE username = 'admin'").get().id);
  const employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);

  // A product + a device so a template/test can reference real master data.
  db.prepare("INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, 'air', 1, ?)").run('Seal', 'PRD-T', managerId);
  const productId = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'PRD-T'").get().id);
  db.prepare('INSERT INTO lab_equipment (name, code, status_raw, created_by) VALUES (?, ?, ?, ?)').run('Rig', 'EQ-T', 'NEW', managerId);
  const equipmentId = Number(db.prepare("SELECT id FROM lab_equipment WHERE code = 'EQ-T'").get().id);

  function templateData(overrides = {}) {
    return {
      name: 'AIR Leak Test',
      code: 'TPL-AIR-001',
      test_type: 'air',
      default_sample_count: 5,
      standard_parameter: null,
      acceptance_criteria: null,
      holding_time: null,
      actual_pressure_reference: null,
      connector_choices: [],
      applicable_product_id: productId,
      applicable_equipment_id: equipmentId,
      sop_id: null,
      wi_id: null,
      equipment_ids: [],
      ...overrides,
    };
  }

  // ── Create ──
  console.log('\n■ Create');
  let templateId;
  {
    templateId = tpl.createLabTemplate(templateData(), managerId);
    const row = db.prepare('SELECT * FROM lab_test_templates WHERE id = ?').get(templateId);
    eq(row.status, 'DRAFT', 'create: new template starts DRAFT');
    eq(row.test_type, 'air', 'create: test_type stored');
    ok(row.current_version_id !== null, 'create: current_version_id set on creation');

    const versions = db.prepare('SELECT * FROM lab_test_template_versions WHERE template_id = ? ORDER BY version ASC').all(templateId);
    eq(versions.length, 1, 'create: exactly one version');
    eq(versions[0].version, 1, 'create: version 1');
    eq(versions[0].default_sample_count, 5, 'create: default_sample_count 5');
    eq(versions[0].applicable_product_id, productId, 'create: product reference stored');
    eq(versions[0].applicable_equipment_id, equipmentId, 'create: equipment reference stored');

    const audit = tpl.getLabTemplateAuditTimeline(templateId);
    ok(audit.some((a) => a.action === 'CREATE'), 'create: LAB_TEMPLATE/CREATE audit recorded');
  }

  // ── Container versioning — unapproved edits in place ──
  console.log('\n■ Versioning (unapproved → in place)');
  let v1Id;
  {
    tpl.updateLabTemplate(templateId, templateData({ name: 'AIR Leak Test v2 label' }), managerId);
    const versions = db.prepare('SELECT id, version, approved_by FROM lab_test_template_versions WHERE template_id = ? ORDER BY version ASC').all(templateId);
    eq(versions.length, 1, 'unapproved: still one version (edited in place)');
    eq(versions[0].version, 1, 'unapproved: version stayed 1');
    const audit = tpl.getLabTemplateAuditTimeline(templateId);
    ok(audit.some((a) => a.action === 'UPDATE'), 'unapproved: LAB_TEMPLATE/UPDATE audit recorded (not VERSION)');
    v1Id = versions[0].id;
  }

  // ── Approve freezes the current version and activates the template ──
  console.log('\n■ Approve');
  let approvedVersionId;
  {
    tpl.submitLabTemplate(templateId, { id: managerId, role: 'manager' });
    eq(db.prepare('SELECT status FROM lab_test_template_versions WHERE template_id = ?').get(templateId).status, 'IN_REVIEW', 'submit: version enters IN_REVIEW');
    tpl.reviewLabTemplate(templateId, { id: supervisorId, role: 'supervisor' });
    const reviewed = db.prepare('SELECT reviewed_by, reviewed_at FROM lab_test_template_versions WHERE template_id = ?').get(templateId);
    eq(reviewed.reviewed_by, supervisorId, 'review: version records reviewer');
    ok(reviewed.reviewed_at, 'review: version records review timestamp');
    const reviewAudit = tpl.getLabTemplateAuditTimeline(templateId);
    ok(reviewAudit.some((a) => a.action === 'STATUS_TRANSITION' && String(a.note).includes('reviewed')), 'review: audit recorded');
    tpl.approveLabTemplate(templateId, { id: adminId, role: 'admin' }, null, 'Verified by QC');
    const r = db.prepare('SELECT status, current_version_id FROM lab_test_templates WHERE id = ?').get(templateId);
    eq(r.status, 'ACTIVE', 'approve: template ACTIVE');
    approvedVersionId = r.current_version_id;

    const v = db.prepare('SELECT approved_by, status FROM lab_test_template_versions WHERE id = ?').get(approvedVersionId);
    eq(v.approved_by, adminId, 'approve: version frozen with approver');
    eq(v.status, 'APPROVED', 'approve: version status APPROVED');
    const audit = tpl.getLabTemplateAuditTimeline(templateId);
    ok(audit.some((a) => a.action === 'APPROVAL'), 'approve: LAB_TEMPLATE/APPROVAL audit recorded');
  }

  // ── Editing an approved template creates version N+1 (never mutates v1) ──
  console.log('\n■ Versioning (approved → new version, immutable)');
  let v2Id;
  {
    tpl.updateLabTemplate(templateId, templateData({ default_sample_count: 8 }), managerId);
    const versions = db.prepare('SELECT id, version, approved_by, default_sample_count FROM lab_test_template_versions WHERE template_id = ? ORDER BY version ASC').all(templateId);
    eq(versions.length, 2, 'versioned: approved edit created version 2');
    v2Id = versions[1].id;
    eq(versions[1].version, 2, 'versioned: second version is 2');
    eq(versions[1].default_sample_count, 8, 'versioned: v2 carries the new content');
    eq(versions[0].id, approvedVersionId, 'versioned: v1 is untouched (same row)');
    eq(versions[0].approved_by, adminId, 'versioned: v1 approver immutable');
    const audit = tpl.getLabTemplateAuditTimeline(templateId);
    ok(audit.some((a) => a.action === 'VERSION'), 'versioned: LAB_TEMPLATE/VERSION audit recorded');
  }

  // ── References: only the active current version resolves ──
  console.log('\n■ List + resolve (relation to current version)');
  {
    const refs = tpl.listLabTemplateReferences();
    eq(refs.length, 1, 'refs: exactly one active template surfaced');
    eq(refs[0].id, templateId, 'refs: template identity');
    eq(refs[0].version, 1, 'refs: current approved version still v1 (v2 is a draft)');
    eq(refs[0].default_sample_count, 5, 'refs: v1 sample count');

    const resolvedV1 = tests.resolveLabTemplateVersion(v1Id, 'air');
    ok(resolvedV1 && resolvedV1.template_id === templateId && resolvedV1.template_version_id === v1Id, 'resolve: v1 resolves while current');
    eq(tests.resolveLabTemplateVersion(v1Id, 'vacuum'), null, 'resolve: mismatched test_type does not resolve');
    eq(tests.resolveLabTemplateVersion(999999, 'air'), null, 'resolve: unknown version → null');
  }

  // ── Relation to test: version-locked snapshot survives promotion + archive ──
  console.log('\n■ Relation to test (version-locked historical integrity)');
  {
    const samples = Array.from({ length: 5 }, (_, i) => ({ sample_no: i + 1, part_name: `Row ${i + 1}`, result: 'PASS' }));
    const created = tests.createLabTest(
      {
        form_action: 'submit',
        product_description: 'Seal',
        connector_type: 'Non-locking (rigid) connector',
        sample_count: 5,
        lot_number: 'LOT-T',
        sampling_area: 'Bay 1',
        equipment_id: equipmentId,
        medium_used: null,
        actual_pressure: null,
        torque_in_lb: null,
        time_sec: null,
        angle: null,
        temperature_measured: null,
        remarks: null,
        final_result: 'PASS',
        samples_json: samples,
        product_id: productId,
        template_id: templateId,
        template_version_id: approvedVersionId,
      },
      employeeId,
      'air',
    );
    let t = db.prepare('SELECT template_id, template_version_id FROM lab_test_records WHERE id = ?').get(created.id);
    eq(Number(t.template_id), templateId, 'rel: test links its template');
    eq(Number(t.template_version_id), approvedVersionId, 'rel: test links the exact version');

    // Promote v2 and confirm a NEW resolution moves to v2 while the existing
    // test keeps its v1 snapshot.
    tpl.submitLabTemplate(templateId, { id: managerId, role: 'manager' });
    tpl.reviewLabTemplate(templateId, { id: supervisorId, role: 'supervisor' });
    tpl.approveLabTemplate(templateId, { id: adminId, role: 'admin' });
    const resolvedV2 = tests.resolveLabTemplateVersion(v2Id, 'air');
    ok(resolvedV2 && resolvedV2.template_version_id === v2Id, 'versioned: after v2 approval, v2 is current');
    eq(tests.resolveLabTemplateVersion(v1Id, 'air'), null, 'versioned: v1 no longer current');
    t = db.prepare('SELECT template_id, template_version_id FROM lab_test_records WHERE id = ?').get(created.id);
    eq(Number(t.template_id), templateId, 'historical: existing test keeps template_id');
    eq(Number(t.template_version_id), approvedVersionId, 'historical: existing test keeps v1 (v2 does not rewrite history)');

    // Archive the template: dropdowns stop listing it, but the test keeps its snapshot.
    tpl.archiveLabTemplate(templateId, managerId);
    eq(tpl.listLabTemplateReferences().length, 0, 'archive: no longer a selectable template reference');
    eq(db.prepare('SELECT status FROM lab_test_templates WHERE id = ?').get(templateId).status, 'ARCHIVED', 'archive: template status ARCHIVED');
    t = db.prepare('SELECT template_id, template_version_id FROM lab_test_records WHERE id = ?').get(created.id);
    eq(Number(t.template_id), templateId, 'archive: historical test still references archived template');
    eq(Number(t.template_version_id), approvedVersionId, 'archive: historical test keeps its version');
    let archiveBlocked = false;
    try {
      tpl.updateLabTemplate(templateId, templateData(), managerId);
    } catch {
      archiveBlocked = true;
    }
    ok(archiveBlocked, 'archive: archived template is read-only');
  }

  // ── RBAC, immutability, and optimistic concurrency ──
  console.log('\n■ RBAC + immutability + concurrency');
  {
    ok(['employee', 'supervisor', 'manager', 'admin'].every((role) => perms.canCreateLabTemplate(role)), 'rbac: all four roles can create own drafts');
    ok(perms.canReviewLabTemplate('supervisor') && perms.canReviewLabTemplate('manager') && perms.canReviewLabTemplate('admin'), 'rbac: supervisor+ can review');
    ok(!perms.canReviewLabTemplate('employee'), 'rbac: employee cannot review');
    ok(perms.canApproveLabTemplate('manager') && perms.canApproveLabTemplate('admin') && !perms.canApproveLabTemplate('supervisor'), 'rbac: manager/admin can approve');
    ok(!perms.canApproveLabTemplateVersionRecord({ id: managerId, role: 'manager' }, { status: 'IN_REVIEW', created_by: managerId }), 'rbac: author cannot self-approve');
    const secondId = tpl.createLabTemplate(templateData({ code: 'TPL-SECOND' }), managerId);
    tpl.submitLabTemplate(secondId, { id: managerId, role: 'manager' });
    tpl.reviewLabTemplate(secondId, { id: supervisorId, role: 'supervisor' });
    tpl.approveLabTemplate(secondId, { id: adminId, role: 'admin' });
    const secondToken = db.prepare('SELECT updated_at FROM lab_test_templates WHERE id = ?').get(secondId).updated_at;
    let conflict = false;
    try { tpl.updateLabTemplate(secondId, templateData({ code: 'TPL-SECOND' }), managerId, 'stale-token'); } catch (err) { conflict = err instanceof tpl.LabTemplateConcurrencyError; }
    ok(conflict, 'concurrency: stale updated_at token rejects overwrite');
    let identityBlocked = false;
    try { tpl.updateLabTemplate(secondId, templateData({ code: 'TPL-CHANGED' }), managerId, secondToken); } catch { identityBlocked = true; }
    ok(identityBlocked, 'identity: code cannot change after first approval');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-templates crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}
