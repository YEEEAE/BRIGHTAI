// Task Templates + Evidence Architecture tests.
//
// Two layers (mirrors test-sla.mjs):
//   1. Pure-policy asserts against src/lib/templates + src/lib/evidence (no DB).
//   2. DB-backed asserts: build a temp SQLite, run migrations, exercise
//      templatesStore mutations + the closeTask evidence gate.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ─────────────────────────── Layer 1: pure policy ───────────────────────────

const {
  TEMPLATE_LIFECYCLE,
  TEMPLATE_LIFECYCLE_LABELS,
  canTransitionTemplate,
  isInstantiable,
  isTemplateLifecycle,
  validateTemplateConfig,
  buildSnapshot,
  parseSnapshot,
  summarizeTemplateForForm,
  isValidTemplateCode,
  slugifyTemplateCode,
} = await import('../src/lib/templates/index.ts');

const {
  VERIFICATION_STATUSES,
  EVIDENCE_REQUIREMENT,
  isVerificationStatus,
  isEvidenceRequirement,
  normalizeEvidenceRequirements,
  requiredEvidenceTypes,
  computeMissingEvidence,
  effectiveExtensionsFor,
  isExtensionAllowedFor,
  findRequirement,
} = await import('../src/lib/evidence/index.ts');

// Lifecycle.
assert.deepEqual(TEMPLATE_LIFECYCLE, ['DRAFT', 'ACTIVE', 'ARCHIVED']);
assert.equal(isTemplateLifecycle('DRAFT'), true);
assert.equal(isTemplateLifecycle('live'), false);
assert.equal(canTransitionTemplate('DRAFT', 'ACTIVE'), true);
assert.equal(canTransitionTemplate('ACTIVE', 'ARCHIVED'), true);
assert.equal(canTransitionTemplate('ARCHIVED', 'DRAFT'), true); // un-archive
assert.equal(canTransitionTemplate('ARCHIVED', 'ACTIVE'), false); // must un-archive first
assert.equal(canTransitionTemplate('ACTIVE', 'DRAFT'), true);
assert.equal(canTransitionTemplate('DRAFT', 'DRAFT'), true); // same-state no-op
assert.equal(isInstantiable('ACTIVE'), true);
assert.equal(isInstantiable('DRAFT'), false);
assert.equal(isInstantiable('ARCHIVED'), false);
assert.equal(TEMPLATE_LIFECYCLE_LABELS.ACTIVE, 'Active');

// Verification statuses.
assert.deepEqual(VERIFICATION_STATUSES, ['UNVERIFIED', 'VALID', 'REJECTED', 'AI_REVIEWED', 'AI_PENDING', 'HUMAN_VERIFIED']);
assert.equal(isVerificationStatus('UNVERIFIED'), true);
assert.equal(isVerificationStatus('AI_PENDING'), true);
assert.equal(isVerificationStatus('pending'), false);
assert.deepEqual(EVIDENCE_REQUIREMENT, ['REQUIRED', 'OPTIONAL']);
assert.equal(isEvidenceRequirement('REQUIRED'), true);
assert.equal(isEvidenceRequirement('mandatory'), false);

// Code (slug).
assert.equal(isValidTemplateCode('daily-inspection'), true);
assert.equal(isValidTemplateCode('Daily_Inspection'), false);
assert.equal(isValidTemplateCode(''), false);
assert.equal(slugifyTemplateCode('Daily Inspection Report'), 'daily-inspection-report');
assert.equal(slugifyTemplateCode('  QC (Weekly)!!  '), 'qc-weekly');

// Evidence requirement normalization.
const reqs = normalizeEvidenceRequirements([
  { type: 'inspection_report', label: 'Inspection Report', requirement: 'REQUIRED' },
  { type: 'photo', label: 'Photo', requirement: 'REQUIRED', allowedExtensions: ['png', 'jpg'] },
  { type: 'measurement', label: 'Measurement XLSX', requirement: 'OPTIONAL', allowedExtensions: ['xlsx'], maxFiles: 1, description: 'Optional raw readings' },
]);
assert.equal(reqs.length, 3);
assert.equal(reqs[0].type, 'inspection_report');
assert.equal(reqs[0].requirement, 'REQUIRED');
assert.deepEqual(reqs[1].allowedExtensions, ['png', 'jpg']);
assert.equal(reqs[2].maxFiles, 1);
assert.equal(reqs[2].description, 'Optional raw readings');

// Duplicate type rejected.
assert.throws(
  () => normalizeEvidenceRequirements([
    { type: 'photo', label: 'A', requirement: 'REQUIRED' },
    { type: 'photo', label: 'B', requirement: 'OPTIONAL' },
  ]),
  /duplicate/i,
);

// Invalid extension rejected.
assert.throws(
  () => normalizeEvidenceRequirements([{ type: 'x', label: 'X', requirement: 'REQUIRED', allowedExtensions: ['exe'] }]),
  /unsupported extension/i,
);

// Bad requirement value rejected.
assert.throws(
  () => normalizeEvidenceRequirements([{ type: 'x', label: 'X', requirement: 'MANDATORY' }]),
  /REQUIRED or OPTIONAL/i,
);

// Bad type slug rejected.
assert.throws(
  () => normalizeEvidenceRequirements([{ type: 'Bad Type', label: 'X', requirement: 'REQUIRED' }]),
  /lowercase/i,
);

// Required/optional split + completion gate arithmetic.
assert.deepEqual(requiredEvidenceTypes(reqs), ['inspection_report', 'photo']);
assert.deepEqual(computeMissingEvidence(reqs, ['inspection_report', 'photo']), []);
assert.deepEqual(computeMissingEvidence(reqs, ['inspection_report']), [reqs[1]]);
assert.deepEqual(computeMissingEvidence(reqs, []), [reqs[0], reqs[1]]);
assert.equal(computeMissingEvidence(reqs, ['photo', 'measurement']).length, 1); // inspection_report still missing

// Per-requirement extension narrowing.
assert.equal(isExtensionAllowedFor(findRequirement(reqs, 'photo'), 'pdf'), false);
assert.equal(isExtensionAllowedFor(findRequirement(reqs, 'photo'), 'png'), true);
assert.equal(isExtensionAllowedFor(findRequirement(reqs, 'inspection_report'), 'pdf'), true); // no narrowing → global
assert.equal(isExtensionAllowedFor(undefined, 'pdf'), true);

// validateTemplateConfig — valid.
const validConfig = validateTemplateConfig({
  title: 'Daily Inspection',
  department: 'QC',
  priority: 'high',
  recurrence: 'daily',
  checklist: [{ title: 'Check gauges' }, { title: 'Sign report' }],
  evidenceRequirements: [
    { type: 'report', label: 'Inspection Report', requirement: 'REQUIRED' },
    { type: 'photo', label: 'Photo Evidence', requirement: 'REQUIRED', allowedExtensions: ['png', 'jpg'] },
  ],
  findingDefaults: { inspectionType: 'daily_walkdown', severity: 'low' },
});
assert.equal(validConfig.ok, true, `expected valid config, got: ${validConfig.errors.join('; ')}`);
assert.equal(validConfig.config.checklist.length, 2);
assert.equal(validConfig.config.evidenceRequirements.length, 2);

// validateTemplateConfig — missing title.
const noTitle = validateTemplateConfig({ department: 'QC', priority: 'medium', recurrence: 'none' });
assert.equal(noTitle.ok, false);
assert.ok(noTitle.errors.some((e) => /title/i.test(e)));

// validateTemplateConfig — bad priority.
const badPriority = validateTemplateConfig({ title: 'X', priority: 'urgent-x', recurrence: 'none' });
assert.equal(badPriority.ok, false);
assert.ok(badPriority.errors.some((e) => /priority/i.test(e)));

// Snapshot building + immutability.
const snapshot = buildSnapshot({
  templateId: 42,
  templateCode: 'daily-inspection',
  templateTitle: 'Daily Inspection',
  version: 3,
  now: '2026-08-11T00:00:00.000Z',
  config: validConfig.config,
});
assert.equal(snapshot.templateId, 42);
assert.equal(snapshot.snapshotVersion, 3);
assert.equal(snapshot.priority, 'high');
assert.equal(snapshot.evidenceRequirements.length, 2);
assert.equal(snapshot.checklist.length, 2);

// parseSnapshot round-trips.
const reparsed = parseSnapshot(JSON.stringify(snapshot));
assert.equal(reparsed.templateId, 42);
assert.equal(reparsed.evidenceRequirements.length, 2);
assert.equal(parseSnapshot(null), null);
assert.equal(parseSnapshot('not json'), null);

// summarizeTemplateForForm projects form-friendly values.
const summary = summarizeTemplateForForm(snapshot);
assert.equal(summary.code, 'daily-inspection');
assert.equal(summary.priority, 'high');
assert.equal(summary.checklist.length, 2);

console.log('Templates + Evidence pure-policy tests passed.');

// ─────────────────────────── Layer 2: DB-backed ───────────────────────────

const tempDir = mkdtempSync(join(tmpdir(), 'brightai-templates-'));
const dbPath = join(tempDir, 'templates.db');
try {
  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';

  const { getDb, closeDatabase } = await import('../src/lib/db.ts');
  const {
    createTemplate,
    updateTemplate,
    transitionTemplate,
    instantiateTemplate,
    getTemplate,
    getTemplateByCode,
    listTemplates,
    getTaskTemplateSnapshot,
  } = await import('../src/lib/templatesStore.ts');

  const db = getDb();
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  const manager = db.prepare("SELECT id FROM users WHERE role = 'manager' LIMIT 1").get();
  const employee = db.prepare("SELECT id FROM users WHERE role = 'employee' LIMIT 1").get();

  // Schema is present (migration 005 applied).
  const tmplCols = db.prepare('PRAGMA table_info(task_templates)').all().map((c) => c.name);
  assert.ok(tmplCols.includes('evidence_requirements_json'), 'task_templates.evidence_requirements_json exists');
  assert.ok(tmplCols.includes('lifecycle_status'), 'task_templates.lifecycle_status exists');
  const attCols = db.prepare('PRAGMA table_info(task_attachments)').all().map((c) => c.name);
  assert.ok(attCols.includes('evidence_type'), 'task_attachments.evidence_type exists');
  assert.ok(attCols.includes('verification_status'), 'task_attachments.verification_status exists');
  assert.ok(attCols.includes('collected_by'), 'task_attachments.collected_by exists');
  assert.ok(attCols.includes('source'), 'task_attachments.source exists');
  const taskCols = db.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  assert.ok(taskCols.includes('template_id'), 'tasks.template_id exists');
  assert.ok(taskCols.includes('template_snapshot'), 'tasks.template_snapshot exists');

  // ── createTemplate → DRAFT ──
  const id = createTemplate({
    title: 'Daily Inspection',
    code: 'daily-inspection',
    department: 'QC',
    priority: 'high',
    recurrence: 'daily',
    checklist: [{ title: 'Gauge check' }, { title: 'Sign-off' }],
    evidenceRequirements: [
      { type: 'report', label: 'Inspection Report', requirement: 'REQUIRED' },
      { type: 'photo', label: 'Photo', requirement: 'REQUIRED', allowedExtensions: ['png', 'jpg'] },
      { type: 'measurement', label: 'Measurement XLSX', requirement: 'OPTIONAL', allowedExtensions: ['xlsx'] },
    ],
  }, admin.id);
  const tmpl = getTemplate(id);
  assert.equal(tmpl.lifecycle_status, 'DRAFT');
  assert.equal(tmpl.version, 1);
  assert.equal(tmpl.checklist.length, 2);
  assert.equal(tmpl.requiredEvidenceCount, 2);

  // Duplicate code rejected.
  assert.throws(
    () => createTemplate({ title: 'Dup', code: 'daily-inspection', department: 'QC', priority: 'medium', recurrence: 'none' }, admin.id),
    /already exists/i,
  );

  // ── transitionTemplate: DRAFT → ACTIVE ──
  transitionTemplate(id, 'ACTIVE', admin.id);
  assert.equal(getTemplate(id).lifecycle_status, 'ACTIVE');

  // Invalid transition surfaced by the store: ARCHIVED cannot jump straight to
  // ACTIVE (must go through DRAFT). Probed on a separate template so the main
  // fixture stays ACTIVE for the instantiation tests below.
  const archiveProbe = createTemplate({ title: 'Probe', code: 'probe-template', department: 'QC', priority: 'medium', recurrence: 'none' }, admin.id);
  transitionTemplate(archiveProbe, 'ARCHIVED', admin.id);
  assert.throws(
    () => transitionTemplate(archiveProbe, 'ACTIVE', admin.id),
    /Invalid template lifecycle/i,
  );

  // ── instantiateTemplate → task + snapshot + checklist ──
  const taskId = instantiateTemplate(id, { dueDate: '2026-09-01' }, manager.id);
  const taskRow = db.prepare('SELECT template_id, template_snapshot, title, department, priority, status, due_date FROM tasks WHERE id = ?').get(taskId);
  assert.equal(taskRow.template_id, id);
  assert.ok(taskRow.template_snapshot, 'task carries a snapshot');
  assert.equal(taskRow.title, 'Daily Inspection');
  assert.equal(taskRow.department, 'QC');
  assert.equal(taskRow.priority, 'high');
  assert.equal(taskRow.status, 'not_started');
  assert.equal(taskRow.due_date, '2026-09-01');

  // Checklist copied.
  const items = db.prepare('SELECT title FROM task_checklists WHERE task_id = ? ORDER BY sort_order ASC').all(taskId);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Gauge check');

  // Snapshot on the task matches the template version at instantiation time.
  const taskSnapshot = getTaskTemplateSnapshot(taskId);
  assert.equal(taskSnapshot.templateCode, 'daily-inspection');
  assert.equal(taskSnapshot.evidenceRequirements.length, 3);
  assert.equal(taskSnapshot.snapshotVersion, 1);

  // ── Snapshot immutability: edit the template → task snapshot unchanged ──
  updateTemplate(id, {
    title: 'Daily Inspection v2',
    priority: 'urgent',
    checklist: [{ title: 'New step' }],
    evidenceRequirements: [
      { type: 'report', label: 'Inspection Report', requirement: 'REQUIRED' },
      { type: 'photo', label: 'Photo', requirement: 'REQUIRED' },
      { type: 'measurement', label: 'Measurement', requirement: 'REQUIRED' }, // was OPTIONAL
      { type: 'signoff', label: 'Sign-off', requirement: 'REQUIRED' }, // newly added
    ],
  }, admin.id);
  const afterEdit = getTemplate(id);
  assert.equal(afterEdit.version, 2);
  assert.equal(afterEdit.title, 'Daily Inspection v2');
  assert.equal(afterEdit.priority, 'urgent');
  assert.equal(afterEdit.evidenceRequirements.length, 4);

  // The task's snapshot is FROZEN — still v1, still 3 requirements, still 'high'.
  const taskSnapshot2 = getTaskTemplateSnapshot(taskId);
  assert.equal(taskSnapshot2.snapshotVersion, 1, 'snapshot version frozen');
  assert.equal(taskSnapshot2.evidenceRequirements.length, 3, 'snapshot evidence frozen');
  assert.equal(taskSnapshot2.priority, 'high', 'snapshot priority frozen');
  assert.equal(taskSnapshot2.title, 'Daily Inspection', 'snapshot title frozen');

  // ── Archive + read-only enforcement ──
  transitionTemplate(id, 'ARCHIVED', admin.id);
  assert.equal(getTemplate(id).lifecycle_status, 'ARCHIVED');
  assert.throws(
    () => updateTemplate(id, { title: 'Cannot edit archived' }, admin.id),
    /read-only/i,
  );
  // Instantiation from ARCHIVED rejected.
  assert.throws(
    () => instantiateTemplate(id, {}, admin.id),
    /ACTIVE/i,
  );
  // Un-archive back to DRAFT, then can edit again.
  transitionTemplate(id, 'DRAFT', admin.id);
  updateTemplate(id, { title: 'Daily Inspection reopened' }, admin.id);
  assert.equal(getTemplate(id).title, 'Daily Inspection reopened');

  // ── listTemplates filter ──
  const activeOnly = listTemplates({ status: 'ACTIVE' });
  assert.equal(activeOnly.length, 0); // we archived then moved to DRAFT

  // ── Task with no template → null snapshot ──
  const plainTask = db.prepare("INSERT INTO tasks (title, department, status, priority, created_by) VALUES (?, 'QC', 'not_started', 'medium', ?)").run('Plain', manager.id);
  assert.equal(getTaskTemplateSnapshot(Number(plainTask.lastInsertRowid)), null);

  // ── closeTask evidence gate (server-side enforcement) ──
  // Build a second ACTIVE template with two REQUIRED evidence slots.
  const gatedId = createTemplate({
    title: 'Material Inspection',
    code: 'material-inspection',
    department: 'QC',
    priority: 'high',
    recurrence: 'none',
    checklist: [],
    evidenceRequirements: [
      { type: 'lab_report', label: 'Lab Report', requirement: 'REQUIRED', allowedExtensions: ['pdf'] },
      { type: 'photo', label: 'Sample Photo', requirement: 'REQUIRED', allowedExtensions: ['png', 'jpg'], description: 'Photo of the inspected sample' },
    ],
  }, admin.id);
  transitionTemplate(gatedId, 'ACTIVE', admin.id);
  const gatedTaskId = instantiateTemplate(gatedId, { assignedTo: employee.id }, manager.id);
  // Move to in_progress so close is reachable.
  db.prepare("UPDATE tasks SET status = 'in_progress', started_at = datetime('now') WHERE id = ?").run(gatedTaskId);

  const { closeTask } = await import('../src/lib/taskUpdates/index.ts');

  const pdfBytes = Buffer.from('%PDF-1.7\n% material lab report\n%%EOF\n');
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]);
  const fakePdfBytes = Buffer.from('not really a pdf');

  function makeForm({ files, types, skip, override }) {
    const form = new FormData();
    form.set('completion_comment', 'closing');
    if (skip) form.set('skip_evidence', '1');
    if (override) form.set('evidence_override_reason', override);
    for (let i = 0; i < (files ?? []).length; i += 1) {
      form.append('evidence', files[i]);
      if (types) form.append('evidence_type', types[i] ?? '');
    }
    return form;
  }
  const pdfFile = (name = 'report.pdf') => new File([pdfBytes], name, { type: 'application/pdf' });
  const pngFile = (name = 'sample.png') => new File([pngBytes], name, { type: 'image/png' });
  const fakePdf = (name = 'fake.pdf') => new File([fakePdfBytes], name, { type: 'application/pdf' });

  // 1. Close with NO evidence → employee blocked (required missing).
  let res = await closeTask({ taskId: gatedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ skip: true }) });
  assert.equal(res.ok, false);
  assert.match(res.error, /required evidence is missing/i);

  // 2. Close with only ONE required evidence → still blocked.
  res = await closeTask({ taskId: gatedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile()], types: ['lab_report'] }) });
  assert.equal(res.ok, false);
  assert.match(res.error, /required evidence is missing/i);

  // 3. Close with BOTH required evidence → success.
  res = await closeTask({ taskId: gatedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile(), pngFile()], types: ['lab_report', 'photo'] }) });
  assert.equal(res.ok, true, `expected close to succeed, got: ${res.ok === false ? res.error : ''}`);
  const evidenceRows = db.prepare('SELECT evidence_type, evidence_label, description, mime_type, file_size, file_hash, collected_at, verification_status, collected_by, source FROM task_attachments WHERE task_id = ? AND is_evidence = 1 ORDER BY evidence_type').all(gatedTaskId);
  assert.equal(evidenceRows.length, 2);
  assert.equal(evidenceRows[0].evidence_type, 'lab_report');
  assert.equal(evidenceRows[0].verification_status, 'UNVERIFIED');
  assert.equal(evidenceRows[0].source, 'manual_upload');
  assert.equal(evidenceRows[0].collected_by, employee.id);
  assert.equal(evidenceRows[1].evidence_type, 'photo');
  assert.equal(evidenceRows[1].description, 'Photo of the inspected sample');
  assert.equal(evidenceRows[1].mime_type, 'image/png');
  assert.equal(evidenceRows[1].file_size, pngBytes.length);
  assert.match(evidenceRows[1].file_hash, /^[a-f0-9]{64}$/);
  assert.ok(evidenceRows[1].collected_at, 'collected_at is persisted');

  // 4. Wrong magic bytes rejected (fake PDF).
  db.prepare("UPDATE tasks SET status = 'in_progress' WHERE id = ?").run(gatedTaskId);
  db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(gatedTaskId);
  res = await closeTask({ taskId: gatedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [fakePdf(), pngFile()], types: ['lab_report', 'photo'] }) });
  assert.equal(res.ok, false);
  assert.match(res.error, /does not match|magic/i);

  // Wrong declared MIME is rejected even when the bytes and extension look valid.
  db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(gatedTaskId);
  res = await closeTask({
    taskId: gatedTaskId,
    actor: { id: employee.id, role: 'employee' },
    form: makeForm({ files: [new File([pdfBytes], 'mime-mismatch.pdf', { type: 'image/png' }), pngFile()], types: ['lab_report', 'photo'] }),
  });
  assert.equal(res.ok, false);
  assert.match(res.error, /MIME type/i);

  // Oversized evidence is rejected before the BLOB is read or persisted.
  const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'oversized.pdf', { type: 'application/pdf' });
  res = await closeTask({
    taskId: gatedTaskId,
    actor: { id: employee.id, role: 'employee' },
    form: makeForm({ files: [oversized, pngFile()], types: ['lab_report', 'photo'] }),
  });
  assert.equal(res.ok, false);
  assert.match(res.error, /10 MB upload limit/i);

  // 5. Per-requirement extension narrowing: PDF into the photo slot rejected.
  db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(gatedTaskId);
  res = await closeTask({ taskId: gatedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile('lab1.pdf'), pdfFile('photo.pdf')], types: ['lab_report', 'photo'] }) });
  assert.equal(res.ok, false);
  assert.match(res.error, /not allowed for "Sample Photo"/i);

  // 6. Duplicate hash guard: upload the same PDF twice → second is rejected.
  db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(gatedTaskId);
  // First close succeeds (both slots filled with valid files).
  res = await closeTask({ taskId: gatedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile('dup.pdf'), pngFile('s.png')], types: ['lab_report', 'photo'] }) });
  assert.equal(res.ok, true);
  // Reopen via manager and try to re-close uploading the SAME pdf bytes under a new name → duplicate.
  db.prepare("UPDATE tasks SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(gatedTaskId);
  const { reopenTask } = await import('../src/lib/taskUpdates/index.ts');
  const reopened = reopenTask({ taskId: gatedTaskId, actor: { id: manager.id, role: 'manager' } });
  assert.equal(reopened.ok, true);
  // Now attempt a second close with the same pdf bytes (duplicate hash) → rejected.
  res = await closeTask({ taskId: gatedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile('dup-again.pdf'), pngFile('s2.png')], types: ['lab_report', 'photo'] }) });
  assert.equal(res.ok, false);
  assert.match(res.error, /already uploaded/i);

  // 7. Replacement: re-upload the SAME evidence_type replaces the prior row.
  // Use a fresh task (different hashes) so the duplicate guard does not trip.
  const gatedTaskId2 = instantiateTemplate(gatedId, { assignedTo: employee.id }, manager.id);
  db.prepare("UPDATE tasks SET status = 'in_progress', started_at = datetime('now') WHERE id = ?").run(gatedTaskId2);
  // Provide both required types, but the photo slot uploads two PDFs of different content for the same type is capped by maxFiles(1) default.
  const pdfA = Buffer.from('%PDF-1.7 A\n%%EOF\n');
  const pdfB = Buffer.from('%PDF-1.7 B\n%%EOF\n');
  res = await closeTask({
    taskId: gatedTaskId2,
    actor: { id: employee.id, role: 'employee' },
    form: makeForm({
      files: [new File([pdfA], 'a.pdf', { type: 'application/pdf' }), new File([pdfB], 'b.pdf', { type: 'application/pdf' })],
      types: ['lab_report', 'lab_report'],
    }),
  });
  assert.equal(res.ok, false, 'maxFiles=1 default should reject two files of the same type');
  assert.match(res.error, /at most 1/i);

  // 8. Manager override path: required missing but manager supplies a reason.
  const gatedTaskId3 = instantiateTemplate(gatedId, { assignedTo: employee.id }, manager.id);
  db.prepare("UPDATE tasks SET status = 'in_progress', started_at = datetime('now') WHERE id = ?").run(gatedTaskId3);
  // Employee without override reason → blocked.
  res = await closeTask({ taskId: gatedTaskId3, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile()], types: ['lab_report'] }) });
  assert.equal(res.ok, false);
  // Manager with override reason → allowed.
  res = await closeTask({ taskId: gatedTaskId3, actor: { id: manager.id, role: 'manager' }, form: makeForm({ files: [pdfFile()], types: ['lab_report'], override: 'Photo delayed; lab report attached.' }) });
  assert.equal(res.ok, true, `manager override should succeed: ${res.ok === false ? res.error : ''}`);
  // Override is logged.
  const overrideAct = db.prepare("SELECT COUNT(*) AS n FROM task_activity_log WHERE task_id = ? AND action = 'evidence_gate_override'").get(gatedTaskId3);
  assert.equal(overrideAct.n, 1);
  // Manager override WITHOUT reason → still blocked.
  const gatedTaskId4 = instantiateTemplate(gatedId, { assignedTo: employee.id }, manager.id);
  db.prepare("UPDATE tasks SET status = 'in_progress', started_at = datetime('now') WHERE id = ?").run(gatedTaskId4);
  res = await closeTask({ taskId: gatedTaskId4, actor: { id: manager.id, role: 'manager' }, form: makeForm({ files: [pdfFile()], types: ['lab_report'] }) });
  assert.equal(res.ok, false);

  // Existing evidence remains part of the frozen task record after reopen and
  // can satisfy the gate; an unauthorized employee still cannot replace it.
  const persistedTaskId = instantiateTemplate(gatedId, { assignedTo: employee.id }, manager.id);
  db.prepare("UPDATE tasks SET status = 'in_progress', started_at = datetime('now') WHERE id = ?").run(persistedTaskId);
  res = await closeTask({ taskId: persistedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile('persisted.pdf'), pngFile('persisted.png')], types: ['lab_report', 'photo'] }) });
  assert.equal(res.ok, true);
  const reopenedPersisted = reopenTask({ taskId: persistedTaskId, actor: { id: manager.id, role: 'manager' } });
  assert.equal(reopenedPersisted.ok, true);
  res = await closeTask({ taskId: persistedTaskId, actor: { id: employee.id, role: 'employee' }, form: makeForm({ skip: true }) });
  assert.equal(res.ok, true, 'persisted non-rejected evidence should satisfy the gate after reopen');

  const unauthorizedReplacementTask = instantiateTemplate(gatedId, { assignedTo: manager.id }, manager.id);
  db.prepare("UPDATE tasks SET status = 'in_progress', started_at = datetime('now') WHERE id = ?").run(unauthorizedReplacementTask);
  res = await closeTask({ taskId: unauthorizedReplacementTask, actor: { id: employee.id, role: 'employee' }, form: makeForm({ files: [pdfFile('unauthorized.pdf'), pngFile('unauthorized.png')], types: ['lab_report', 'photo'] }) });
  assert.equal(res.ok, false);
  assert.match(res.error, /permission/i);

  // 9. Task without a template → gate inert (legacy behavior preserved).
  const legacyId = Number(db.prepare("INSERT INTO tasks (title, department, status, priority, created_by, started_at) VALUES ('Legacy', 'QC', 'in_progress', 'medium', ?, datetime('now'))").run(manager.id).lastInsertRowid);
  res = await closeTask({ taskId: legacyId, actor: { id: manager.id, role: 'manager' }, form: makeForm({ skip: true }) });
  assert.equal(res.ok, true, 'legacy task (no template) should close without evidence');

  // 10. Unauthorized: employee who cannot edit the task cannot close it.
  const someoneElseTask = Number(db.prepare("INSERT INTO tasks (title, department, status, priority, created_by, assigned_to, started_at) VALUES ('Other', 'QC', 'in_progress', 'medium', ?, ?, datetime('now'))").run(manager.id, manager.id).lastInsertRowid);
  res = await closeTask({ taskId: someoneElseTask, actor: { id: employee.id, role: 'employee' }, form: makeForm({ skip: true }) });
  assert.equal(res.ok, false);
  assert.match(res.error, /permission/i);

  closeDatabase();
  console.log('Templates + Evidence DB-backed tests passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log('All templates + evidence tests passed.');
