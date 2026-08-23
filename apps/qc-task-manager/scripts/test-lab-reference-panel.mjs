// Unit checks for the deterministic (non-AI) approved reference panel on the
// lab test form (src/lib/lab/reference-panel.ts + the listLabTemplateReferences
// fields it consumes — QC-LAB-APPROVED-REF-001).
//
// Contract under test:
//   1. Linked case: the panel resolves EXACTLY the approved template version's
//      stored parameter values (standard parameter / acceptance criteria /
//      holding time) — a missing or malformed key renders as '—', never a
//      fallback to the static printed-form constants.
//   2. Approved SOP/WI linkage: only document versions whose current version
//      is APPROVED are surfaced; anything else renders as not linked (—).
//   3. Unlinked cases: no selected version, an id that is not in the approved
//      ACTIVE list (e.g. superseded / never approved / wrong test type) → the
//      explicit empty state text, never a guess.
//   4. Display-only: the resolver output is plain data; and the panel markup
//      (LabTestForm.tsx) carries no inline style attributes (CSP).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-lab-templates.mjs).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-refpanel-'));
const dbPath = join(tempDir, 'lab-refpanel.db');

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

  const { getDb } = await import('../src/lib/db.ts');
  const { listLabTemplateReferences } = await import('../src/lib/lab/templates.ts');
  const { resolveLabTemplateVersion } = await import('../src/lib/lab/tests.ts');
  const { resolveApprovedReferencePanel, LAB_REFERENCE_EMPTY_STATE_TEXT } = await import(
    '../src/lib/lab/reference-panel.ts'
  );

  const db = getDb();
  const managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);

  // ── Seed: an APPROVED SOP document (v2 current) and a WI whose current
  //    version is still DRAFT (never approved).
  function seedDocument(code, title, type, versionStatus, version) {
    db.prepare(
      `INSERT INTO lab_documents (code, title, type, status, current_version_id, created_by)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    ).run(code, title, type, versionStatus === 'APPROVED' ? 'APPROVED' : 'IN_REVIEW', managerId);
    const docId = Number(db.prepare('SELECT id FROM lab_documents WHERE code = ?').get(code).id);
    db.prepare(
      `INSERT INTO lab_document_versions (document_id, version, content_md, author_id, status, approved_by, approved_at)
       VALUES (?, ?, 'x', ?, ?, ?, ?)`,
    ).run(
      docId,
      version,
      managerId,
      versionStatus,
      versionStatus === 'APPROVED' ? managerId : null,
      versionStatus === 'APPROVED' ? '2026-01-01 00:00:00' : null,
    );
    const versionId = Number(
      db.prepare('SELECT id FROM lab_document_versions WHERE document_id = ? AND version = ?').get(docId, version).id,
    );
    db.prepare('UPDATE lab_documents SET current_version_id = ? WHERE id = ?').run(versionId, docId);
    return docId;
  }
  const sopId = seedDocument('SOP-REF-01', 'AIR Leak SOP', 'SOP', 'APPROVED', 2);
  const wiId = seedDocument('WI-REF-01', 'AIR Leak WI', 'WI', 'DRAFT', 1);

  // ── Seed: an ACTIVE template whose current version is approved and carries
  //    exact stored parameter values.
  const parametersJson = JSON.stringify({
    standard_parameter: '85.0 kPa',
    acceptance_criteria: 'No bubble observed',
    holding_time: '30',
  });
  db.prepare("INSERT INTO lab_test_templates (name, code, test_type, status, created_by) VALUES (?, ?, 'air', 'ACTIVE', ?)")
    .run('AIR Reference Template', 'TPL-REF-AIR', managerId);
  const templateId = Number(db.prepare("SELECT id FROM lab_test_templates WHERE code = 'TPL-REF-AIR'").get().id);
  db.prepare(
    `INSERT INTO lab_test_template_versions
       (template_id, version, parameters_json, sop_id, wi_id, created_by, approved_by)
     VALUES (?, 1, ?, ?, ?, ?, ?)`,
  ).run(templateId, parametersJson, sopId, wiId, managerId, managerId);
  const approvedVersionId = Number(
    db.prepare('SELECT id FROM lab_test_template_versions WHERE template_id = ? AND version = 1').get(templateId).id,
  );
  db.prepare('UPDATE lab_test_templates SET current_version_id = ? WHERE id = ?').run(approvedVersionId, templateId);

  // ── Reference list now carries the approved SOP version + statuses.
  const refs = listLabTemplateReferences();
  const ref = refs.find((r) => r.code === 'TPL-REF-AIR');
  ok(ref !== undefined, 'listLabTemplateReferences returns the ACTIVE approved template');
  eq(ref?.sop_version, 2, 'linked SOP current version number is exposed');
  eq(ref?.sop_status, 'APPROVED', 'linked SOP version status is exposed');
  eq(ref?.wi_status, 'DRAFT', 'unapproved WI version status is exposed (no guessing)');
  eq(ref?.parameters_json, parametersJson, 'stored parameters_json is passed through verbatim');
  ok('effective_date' in (ref ?? {}), 'reference provenance: effective date is exposed');

  // ── Version-locked resolution (server side) still accepts the same version.
  const resolved = resolveLabTemplateVersion(approvedVersionId, 'air');
  eq(resolved?.template_version_id, approvedVersionId, 'resolveLabTemplateVersion accepts the approved current version');

  // ── Linked panel: exact stored values, no fallback.
  const linked = resolveApprovedReferencePanel(refs, approvedVersionId, 'air');
  eq(linked.state, 'linked', 'panel resolves as linked for the approved version');
  eq(linked.state === 'linked' ? linked.parameters.find((p) => p.key === 'standard_parameter')?.value : '', '85.0 kPa',
    'standard parameter shows exactly the stored value');
  eq(linked.state === 'linked' ? linked.parameters.find((p) => p.key === 'acceptance_criteria')?.value : '', 'No bubble observed',
    'acceptance criteria shows exactly the stored value');
  eq(linked.state === 'linked' ? linked.parameters.find((p) => p.key === 'holding_time')?.value : '', '30',
    'holding time shows exactly the stored value');
  ok(linked.state === 'linked' && linked.sourceReference === 'SOP-REF-01 — AIR Leak SOP (v2)',
    'reference provenance: source document reference is displayed');
  ok(
    linked.state === 'linked' && linked.sop !== null && linked.sop.code === 'SOP-REF-01' && linked.sop.version === 2,
    'approved SOP is surfaced with its approved version number',
  );
  eq(linked.state === 'linked' ? linked.wi : undefined, null, 'unapproved WI is NOT surfaced (never guessed)');

  // ── Missing parameter key → '—', never the static printed-form constants.
  const sparseRefs = [
    { ...ref, parameters_json: JSON.stringify({ standard_parameter: '60.0 kPa' }) },
  ];
  const sparse = resolveApprovedReferencePanel(sparseRefs, approvedVersionId, 'air');
  eq(sparse.state === 'linked' ? sparse.parameters.find((p) => p.key === 'acceptance_criteria')?.value : '', 'No approved reference available.',
    'missing key renders explicit empty state — no fallback');
  // Broken JSON → all parameters '—'.
  const brokenRefs = [{ ...ref, parameters_json: '{not json' }];
  const broken = resolveApprovedReferencePanel(brokenRefs, approvedVersionId, 'air');
  ok(
    broken.state === 'linked' && broken.parameters.every((p) => p.value === 'No approved reference available.'),
    'malformed parameters_json renders every parameter as empty state (no guessing)',
  );

  // ── Unlinked cases → the explicit empty state.
  eq(resolveApprovedReferencePanel(refs, null, 'air').state, 'unlinked', 'no selected version → unlinked');
  eq(
    resolveApprovedReferencePanel(refs, 999999, 'air').emptyStateText,
    LAB_REFERENCE_EMPTY_STATE_TEXT,
    'unknown version id → explicit empty state text',
  );
  eq(
    resolveApprovedReferencePanel(refs, approvedVersionId, 'vacuum').state,
    'unlinked',
    'wrong test type → unlinked (no cross-type guessing)',
  );

  // ── The resolver output is display-only data — it never carries values into
  //    measured fields. Structural check: the panel markup uses no inline
  //    style attributes anywhere (CSP — style-src has no 'unsafe-inline').
  const formSource = readFileSync(join(appDir, 'src/components/lab/LabTestForm.tsx'), 'utf8');
  ok(!/style\s*=\s*["'{]/.test(formSource), 'LabTestForm.tsx contains no inline style attributes (CSP)');
  const panelSource = readFileSync(join(appDir, 'src/lib/lab/reference-panel.ts'), 'utf8');
  ok(!/style\s*=\s*["'{]/.test(panelSource), 'reference-panel.ts contains no inline style attributes (CSP)');

  console.log(`\nlab reference panel: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('FAILURES:\n' + failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('lab reference panel test crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}
