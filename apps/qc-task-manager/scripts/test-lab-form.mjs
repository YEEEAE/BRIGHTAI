// Database-backed unit checks for the shared AIR/VACUUM test form layer
// (src/lib/lab/tests.ts + labTestFormSchema in src/lib/validation.ts —
// PROMPT 05).
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path (same pattern as test-lab-overview.mjs).
// Focus: the form contract — query-only test_type, product master
// resolution, Zod draft/submit matrix, bounded sample grid, numbering,
// snapshots, and audit events. No invented scientific values are asserted;
// PASS/FAIL/HOLD here are just enum values.
//
// Covered:
//   1. resolveLabTestType: query param only; anything else → null.
//   2. resolveLabProductId: exact case-insensitive match on active products.
//   3. labTestFormSchema via parseFormData: drafts accept sparse input;
//      submits enforce required fields + a complete bounded grid; bounds,
//      enums and JSON shape are enforced; a forged test_type in the body is
//      ignored by the schema (it lives in the query).
//   4. createLabTest: draft vs submit statuses, LAB-TEST-%05d numbering,
//      LAB-TEST-%05d-SNN sample identifiers, parameters snapshot only on
//      submit, CREATE/SUBMIT audit events, samples ordered by sample_no.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-form-'));
const dbPath = join(tempDir, 'lab-form.db');

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

function formData(entries) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (value == null) continue;
    form.append(key, value);
  }
  return form;
}

/** A complete, valid body (all printed Required fields + judged grid). */
function completeBody(overrides = {}) {
  const sampleCount = 5;
  const samples = Array.from({ length: sampleCount }, (_, i) => ({
    sample_no: i + 1,
    part_name: 'Fixture Part',
    set_pressure: '30',
    actual_pressure: '30.5',
    volume_sec: '1.2',
    pressure_difference: '0.5',
    holding_time_sec: '20',
    leakage_rate: '0.01',
    result: 'PASS',
  }));
  return {
    form_action: 'submit',
    product_description: 'Fixture Product',
    connector_type: 'Non-locking (Lipid connector)',
    sample_count: String(sampleCount),
    lot_number: 'LOT-FIX-1',
    sampling_area: 'Sampling Area A',
    equipment_id: '1',
    medium_used: 'Water',
    actual_pressure: '30.5',
    torque_in_lb: '12',
    time_sec: '20',
    angle: '90',
    temperature_measured: '22',
    samples_json: JSON.stringify(samples),
    remarks: 'Fixture remarks',
    final_result: 'PASS',
    ...overrides,
  };
}

try {
  process.env.QC_DATABASE_PATH = dbPath;
  process.env.QC_DB_PATH = '';

  execFileSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: appDir,
    env: { ...process.env, QC_DATABASE_PATH: dbPath, QC_DB_PATH: '' },
    stdio: 'ignore',
  });

  // Avoid starting the production catch-up backup during this focused test.
  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, 'status.json'),
    JSON.stringify({ state: 'success', lastSuccessAt: new Date().toISOString() }),
  );

  const { getDb } = await import('../src/lib/db.ts');
  const tests = await import('../src/lib/lab/tests.ts');
  const { parseFormData, labTestFormSchema } = await import('../src/lib/validation.ts');

  const db = getDb();
  const employee = db.prepare("SELECT id FROM users WHERE username = 'employee'").get();
  const operator = employee;

  // ── 1. resolveLabTestType: query param only ──
  console.log('\n■ resolveLabTestType');
  eq(tests.resolveLabTestType('air'), 'air', 'type: "air" accepted');
  eq(tests.resolveLabTestType('vacuum'), 'vacuum', 'type: "vacuum" accepted');
  eq(tests.resolveLabTestType('AIR'), null, 'type: case-sensitive (AIR rejected)');
  eq(tests.resolveLabTestType('helium'), null, 'type: unknown value rejected');
  eq(tests.resolveLabTestType(null), null, 'type: missing rejected');
  eq(tests.resolveLabTestType(undefined), null, 'type: undefined rejected');

  // ── 2. resolveLabProductId ──
  console.log('\n■ resolveLabProductId');
  db.prepare(
    'INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
  ).run('Fixture Product', 'PRD-1', 'air', 1, employee.id);
  db.prepare(
    'INSERT INTO lab_products (name, code, default_test_type, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
  ).run('Inactive Product', 'PRD-2', 'air', 0, employee.id);
  const productId = Number(db.prepare("SELECT id FROM lab_products WHERE code = 'PRD-1'").get().id);
  eq(tests.resolveLabProductId('Fixture Product'), productId, 'product: exact match resolves');
  eq(tests.resolveLabProductId('fixture product'), productId, 'product: case-insensitive resolves');
  eq(tests.resolveLabProductId('Inactive Product'), null, 'product: inactive product → null');
  eq(tests.resolveLabProductId('Unknown Product'), null, 'product: unknown name → null');
  eq(tests.resolveLabProductId(''), null, 'product: empty → null');
  eq(tests.resolveLabProductId(null), null, 'product: null → null');

  // ── 3. labTestFormSchema via parseFormData ──
  console.log('\n■ labTestFormSchema (draft/submit matrix)');
  {
    const draft = parseFormData(labTestFormSchema, formData({ form_action: 'draft' }));
    ok(draft.ok, 'draft: completely empty body accepted');
    if (draft.ok) {
      eq(draft.data.sample_count, 5, 'draft: default sample count 5');
      eq(draft.data.equipment_id, null, 'draft: equipment null');
      eq(draft.data.final_result, null, 'draft: final result null');
      eq(draft.data.connector_type, null, 'draft: connector type null');
    }

    // UI drafts send a full sample grid whose rows are unjudged (result: '').
    // Empty-string results must normalize to null (a judged submit still
    // requires PASS/FAIL/HOLD) — regression for the Save Draft flow.
    const draftWithRows = parseFormData(
      labTestFormSchema,
      formData({
        form_action: 'draft',
        product_description: 'Fixture Product',
        sample_count: '3',
        samples_json: JSON.stringify(
          Array.from({ length: 3 }, (_, i) => ({
            sample_no: i + 1,
            part_name: 'Fixture Part',
            result: '',
          })),
        ),
      }),
    );
    ok(draftWithRows.ok, 'draft: unjudged rows (empty result) accepted');

    const submitValid = parseFormData(labTestFormSchema, formData(completeBody()));
    ok(submitValid.ok, 'submit: complete valid body accepted');

    const submitMissing = parseFormData(
      labTestFormSchema,
      formData(completeBody({ product_description: '', lot_number: '', final_result: '' })),
    );
    ok(!submitMissing.ok, 'submit: missing required fields rejected');

    const submitGridMismatch = parseFormData(
      labTestFormSchema,
      formData(completeBody({ sample_count: '8' })),
    );
    ok(!submitGridMismatch.ok, 'submit: sample grid must match sample_count');

    const submitMissingRowResult = parseFormData(
      labTestFormSchema,
      formData(
        completeBody({
          samples_json: JSON.stringify(
            Array.from({ length: 5 }, (_, i) => ({
              sample_no: i + 1,
              part_name: 'Fixture Part',
              result: i === 0 ? 'PASS' : null,
            })),
          ),
        }),
      ),
    );
    ok(!submitMissingRowResult.ok, 'submit: every sample needs a human result');

    const submitForgedType = parseFormData(
      labTestFormSchema,
      formData(completeBody({ test_type: 'helium', tested_by: '999', reviewed_by: '999', approved_by: '999' })),
    );
    ok(submitForgedType.ok, 'submit: forged body test_type/authorization ignored (query owns them)');

    // Bounds + enums + JSON shape.
    const countZero = parseFormData(labTestFormSchema, formData(completeBody({ sample_count: '0' })));
    ok(!countZero.ok, 'bounds: sample_count 0 rejected');
    const countTooBig = parseFormData(labTestFormSchema, formData(completeBody({ sample_count: '21' })));
    ok(!countTooBig.ok, 'bounds: sample_count 21 rejected');
    const badConnector = parseFormData(
      labTestFormSchema,
      formData(completeBody({ connector_type: 'Mystery connector' })),
    );
    ok(!badConnector.ok, 'enum: unknown connector type rejected');
    const badResult = parseFormData(
      labTestFormSchema,
      formData(completeBody({ final_result: 'MAYBE' })),
    );
    ok(!badResult.ok, 'enum: invalid final result rejected');
    const badSamplesJson = parseFormData(
      labTestFormSchema,
      formData(completeBody({ samples_json: 'not-json{[' })),
    );
    ok(!badSamplesJson.ok, 'samples: malformed JSON rejected');
    const badRowResult = parseFormData(
      labTestFormSchema,
      formData(
        completeBody({
          samples_json: JSON.stringify([{ sample_no: 1, result: 'MAYBE' }]),
        }),
      ),
    );
    ok(!badRowResult.ok, 'samples: invalid row result rejected');
  }

  // ── 4. createLabTest ──
  console.log('\n■ createLabTest (draft then submit, numbering, audit)');
  const equipment = db.prepare('INSERT INTO lab_equipment (name, code, status_raw, created_by) VALUES (?, ?, ?, ?)')
    .run('Fixture Rig', 'EQ-FIX', 'NEW', employee.id);
  const equipmentId = Number(equipment.lastInsertRowid);

  function parse(body) {
    const r = parseFormData(labTestFormSchema, formData(body));
    if (!r.ok) throw new Error(`fixture body rejected: ${r.error}`);
    return r.data;
  }

  const draftData = {
    ...parse(completeBody({ form_action: 'draft', lot_number: '', sampling_area: '' })),
    product_id: null,
  };
  const draft = tests.createLabTest(draftData, operator.id, 'air');
  eq(draft.test_number, 'LAB-TEST-00001', 'create: draft number LAB-TEST-00001');
  const draftRow = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(draft.id);
  eq(draftRow.status, 'DRAFT', 'create: draft status DRAFT');
  eq(draftRow.final_result, null, 'create: draft final_result NULL');
  eq(draftRow.test_type, 'air', 'create: draft test_type air');
  eq(draftRow.parameters_snapshot_json, null, 'create: draft has no parameters snapshot');
  eq(draftRow.submitted_at, null, 'create: draft submitted_at NULL');
  eq(draftRow.tested_by, operator.id, 'create: tested_by = actor (never from body)');
  eq(draftRow.product_id, null, 'create: unresolved product stored as NULL');
  const draftSamples = tests.listLabTestSamples(draft.id);
  eq(draftSamples.length, 5, 'create: draft rows = sample_count');
  eq(draftSamples[0].sample_identifier, 'LAB-TEST-00001-S01', 'create: sample identifier format');
  eq(draftSamples[4].sample_identifier, 'LAB-TEST-00001-S05', 'create: last sample identifier');
  eq(draftSamples[0].result, 'PASS', 'create: sample result stored verbatim');

  const submitData = {
    ...parse(completeBody()),
    product_id: productId,
  };
  const submitted = tests.createLabTest(submitData, operator.id, 'vacuum');
  eq(submitted.test_number, 'LAB-TEST-00002', 'create: submit number continues LAB-TEST-00002');
  const submitRow = db.prepare('SELECT * FROM lab_test_records WHERE id = ?').get(submitted.id);
  eq(submitRow.status, 'SUBMITTED', 'create: submit status SUBMITTED');
  eq(submitRow.final_result, 'PASS', 'create: submit final_result stored');
  eq(submitRow.test_type, 'vacuum', 'create: submit test_type vacuum');
  eq(submitRow.product_id, productId, 'create: resolved product_id stored');
  ok(submitRow.parameters_snapshot_json != null && submitRow.parameters_snapshot_json.includes('acceptance_criteria'),
    'create: submit has parameters snapshot');
  ok(submitRow.submitted_at != null, 'create: submit submitted_at set');
  const submitSamples = tests.listLabTestSamples(submitted.id);
  eq(submitSamples.length, 5, 'create: submit rows = sample_count');
  eq(submitSamples[0].sample_identifier, 'LAB-TEST-00002-S01', 'create: submit identifier format');

  const audit = db.prepare(
    "SELECT action FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? ORDER BY id ASC",
  ).all(draft.id);
  eq(audit.length, 1, 'audit: draft emits CREATE only');
  eq(audit[0].action, 'CREATE', 'audit: draft action CREATE');
  const submitAudit = db.prepare(
    "SELECT action FROM qc_audit_log WHERE entity_type = 'LAB_TEST' AND entity_id = ? ORDER BY id ASC",
  ).all(submitted.id);
  eq(submitAudit.length, 2, 'audit: submit emits CREATE + SUBMIT');
  eq(submitAudit[0].action, 'CREATE', 'audit: submit first CREATE');
  eq(submitAudit[1].action, 'SUBMIT', 'audit: submit second SUBMIT');

  // Product master + equipment form listers.
  console.log('\n■ listers');
  const products = tests.listLabProductsForForm();
  eq(products.length, 1, 'lister: only active products');
  eq(products[0].code, 'PRD-1', 'lister: active product listed');
  const equipmentList = tests.listLabEquipmentForForm();
  eq(equipmentList.length, 1, 'lister: non-archived equipment listed');
  eq(equipmentList[0].calibration_state, 'UNKNOWN', 'lister: no calibration → UNKNOWN');

  // FK integrity: an unknown equipment_id must not be writable.
  console.log('\n■ referential integrity');
  let fkRejected = false;
  try {
    tests.createLabTest({ ...parse(completeBody({ form_action: 'draft' })), product_id: null, equipment_id: 999999 }, operator.id, 'air');
  } catch {
    fkRejected = true;
  }
  ok(fkRejected, 'fk: unknown equipment_id rejected by DB');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-form crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}