// Database-backed security unit checks for the QC Laboratory.
//
// Covers the PROMPT 36 Security group against an isolated temporary database:
//   - CSRF: the shared requireCsrf origin gate + requireRequestSecurity body/
//     content-type/size guards used by every lab POST handler.
//   - SQL injection: LIKE escaping + the fully parameterized lab test WHERE
//     builder (no user text in SQL), and a live search proves the underlying
//     tables survive user-controlled search input.
//   - XSS: the server-side Lab sample grid schema bounds/trims user text and
//     rejects malformed payloads.
//   - IDOR / permission bypass: role predicates AND the record-level guards
//     (canEditLabTestRecord / canReviewLabTestRecord / canApproveLabTestRecord)
//     that are the hard server-side invariants.
//
// Runs in its own process so QC_DATABASE_PATH is set before src/lib/db.ts
// evaluates its singleton path. The database is a throwaway temp file deleted
// on exit — nothing in the repo is ever touched.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const appDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), 'brightai-qc-lab-security-'));
const dbPath = join(tempDir, 'lab-security.db');

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
  // No equipment seed needed for this suite.
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
  const perms = await import('../src/lib/permissions.ts');
  const apiSec = await import('../src/lib/api-security.ts');
  const search = await import('../src/lib/lab/testSearch.ts');
  const { labTestFormSchema, labTestSampleRowSchema } = await import('../src/lib/validation.ts');
  const { LAB_SAMPLE_COUNT_MAX, LAB_PART_NAME_MAX, LAB_SAMPLE_COUNT_DEFAULT } = await import('../src/lib/lab/policy.ts');

  const db = getDb();
  const employeeId = Number(db.prepare("SELECT id FROM users WHERE username = 'employee'").get().id);
  const supervisorId = Number(db.prepare("SELECT id FROM users WHERE username = 'supervisor'").get().id);
  const managerId = Number(db.prepare("SELECT id FROM users WHERE username = 'manager'").get().id);

  // ── 1. CSRF + request security ──
  console.log('\n■ CSRF origin gate');
  {
    const sameOrigin = apiSec.requireCsrf({
      request: { headers: new Headers({ origin: 'https://qc.local' }) },
      url: new URL('https://qc.local/lab/tests/new'),
    });
    eq(sameOrigin, null, 'csrf: matching origin passes (null)');

    const forged = apiSec.requireCsrf({
      request: { headers: new Headers({ origin: 'https://evil.example' }) },
      url: new URL('https://qc.local/lab/tests/new'),
    });
    ok(forged instanceof Response && forged.status === 403, 'csrf: cross-origin forged submission => 403');
    const forgedBody = await forged.json();
    eq(forgedBody.ok, false, 'csrf: forged body is { ok:false }');

    // A request with NO Origin header is refused - a non-browser can't smuggle one.
    const noOrigin = apiSec.requireCsrf({
      request: { headers: new Headers() },
      url: new URL('https://qc.local/lab/tests/new'),
    });
    ok(noOrigin instanceof Response && noOrigin.status === 403, 'csrf: missing origin => 403');
  }

  console.log('\n■ Request body / content-type guards');
  {
    const get = new Request('https://qc.local/lab/tests', { method: 'GET' });
    eq(apiSec.requireRequestSecurity({ request: get, url: new URL('https://qc.local/lab/tests') }), null, 'reqsec: GET passes');

    const form = new Request('https://qc.local/lab/tests/new', {
      method: 'POST',
      body: 'a=1',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    eq(apiSec.requireRequestSecurity({ request: form, url: new URL('https://qc.local/lab/tests/new') }), null, 'reqsec: urlencoded POST passes');

    const weird = new Request('https://qc.local/lab/tests/new', {
      method: 'POST',
      body: 'x',
      headers: { 'content-type': 'text/plain' },
    });
    const weirdRes = apiSec.requireRequestSecurity({ request: weird, url: new URL('https://qc.local/lab/tests/new') });
    ok(weirdRes instanceof Response && weirdRes.status === 415, 'reqsec: unsupported content-type => 415');

    const huge = new Request('https://qc.local/lab/tests/new', {
      method: 'POST',
      headers: { 'content-length': '999999999', 'content-type': 'application/x-www-form-urlencoded' },
    });
    const hugeRes = apiSec.requireRequestSecurity({ request: huge, url: new URL('https://qc.local/lab/tests/new') });
    ok(hugeRes instanceof Response && hugeRes.status === 413, 'reqsec: oversized content-length => 413');
  }

  // ── 2. Permission bypass (role matrix + record-level guards) ──
  console.log('\n■ Permission matrix — lab tests');
  {
    ok(perms.canViewLab('employee') && perms.canViewLab('manager'), 'rbac: view lab for every role');
    ok(perms.canCreateLabTest('employee'), 'rbac: employee may create tests');
    ok(perms.canSubmitLabTest('employee'), 'rbac: employee may submit tests');

    // Review/approve/void are rank-gated (D-4): supervisor may review, not approve.
    eq(perms.canReviewLabTest('employee'), false, 'rbac: employee cannot review');
    ok(perms.canReviewLabTest('manager'), 'rbac: manager can review');
    ok(perms.canReviewLabTest('supervisor'), 'rbac: supervisor can review');
    eq(perms.canApproveLabTest('supervisor'), false, 'rbac: supervisor cannot approve (D-4)');
    eq(perms.canApproveLabTest('employee'), false, 'rbac: employee cannot approve');
    ok(perms.canApproveLabTest('manager'), 'rbac: manager can approve');
    ok(perms.canApproveLabTest('admin'), 'rbac: admin can approve');
    eq(perms.canVoidLabTest('supervisor'), false, 'rbac: supervisor cannot void');
    eq(perms.canVoidLabTest('employee'), false, 'rbac: employee cannot void');
    ok(perms.canVoidLabTest('manager'), 'rbac: manager can void');
  }

  console.log('\n■ Record-level guardrails (IDOR / self-approval)');
  {
    // LabTestAuth is structural; a plain object is sufficient at runtime.
    const foreignDraft = { status: 'DRAFT', tested_by: managerId, reviewed_by: null, created_by: managerId };
    eq(perms.canEditLabTestRecord({ id: employeeId, role: 'employee' }, foreignDraft), false, 'guard: employee cannot edit a foreign test');
    eq(perms.canEditLabTestRecord({ id: employeeId, role: 'employee' }, { status: 'APPROVED', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), false, 'guard: APPROVED immutable even for owner');
    eq(perms.canEditLabTestRecord({ id: employeeId, role: 'employee' }, { status: 'VOID', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), false, 'guard: VOID immutable even for owner');
    ok(perms.canEditLabTestRecord({ id: employeeId, role: 'employee' }, { status: 'DRAFT', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), 'guard: owner edits own DRAFT');

    // A tester can NEVER review or approve their own test (hard invariant #1).
    eq(perms.canReviewLabTestRecord({ id: managerId, role: 'manager' }, { status: 'SUBMITTED', tested_by: managerId, reviewed_by: null, created_by: employeeId }), false, 'guard: tester cannot review own test (even manager)');
    eq(perms.canApproveLabTestRecord({ id: managerId, role: 'manager' }, { status: 'SUBMITTED', tested_by: managerId, reviewed_by: null, created_by: employeeId }), false, 'guard: tester cannot approve own test');
    eq(perms.canApproveLabTestRecord({ id: managerId, role: 'manager' }, { status: 'SUBMITTED', tested_by: employeeId, reviewed_by: managerId, created_by: employeeId }), false, 'guard: reviewer cannot also approve');
    ok(perms.canApproveLabTestRecord({ id: managerId, role: 'manager' }, { status: 'SUBMITTED', tested_by: employeeId, reviewed_by: supervisorId, created_by: employeeId }), 'guard: unrelated manager can approve');
    ok(perms.canReviewLabTestRecord({ id: managerId, role: 'manager' }, { status: 'SUBMITTED', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), 'guard: manager can review someone elses test');
    eq(perms.canApproveLabTestRecord({ id: managerId, role: 'manager' }, { status: 'APPROVED', tested_by: employeeId, reviewed_by: supervisorId, created_by: employeeId }), false, 'guard: cannot approve an already-approved test');

    // VOID guardrails (PROMPT 42)
    eq(perms.canVoidLabTestRecord({ id: employeeId, role: 'employee' }, { status: 'DRAFT', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), false, 'guard: employee cannot void own draft');
    eq(perms.canVoidLabTestRecord({ id: supervisorId, role: 'supervisor' }, { status: 'SUBMITTED', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), false, 'guard: supervisor cannot void test');
    ok(perms.canVoidLabTestRecord({ id: managerId, role: 'manager' }, { status: 'DRAFT', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), 'guard: manager can void DRAFT');
    ok(perms.canVoidLabTestRecord({ id: managerId, role: 'manager' }, { status: 'SUBMITTED', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), 'guard: manager can void SUBMITTED');
    ok(perms.canVoidLabTestRecord({ id: managerId, role: 'manager' }, { status: 'UNDER_REVIEW', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), 'guard: manager can void UNDER_REVIEW');
    ok(perms.canVoidLabTestRecord({ id: managerId, role: 'manager' }, { status: 'REJECTED', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), 'guard: manager can void REJECTED');
    eq(perms.canVoidLabTestRecord({ id: managerId, role: 'manager' }, { status: 'APPROVED', tested_by: employeeId, reviewed_by: supervisorId, created_by: employeeId }), false, 'guard: manager cannot void APPROVED test');
    eq(perms.canVoidLabTestRecord({ id: managerId, role: 'manager' }, { status: 'VOID', tested_by: employeeId, reviewed_by: null, created_by: employeeId }), false, 'guard: manager cannot void already VOID test');
  }

  console.log('\n■ Permission matrix — products / templates / equipment / documents');
  {
    eq(perms.canCreateLabProduct('employee'), false, 'rbac: employee cannot create product');
    ok(perms.canCreateLabProduct('manager'), 'rbac: manager can create product');
    eq(perms.canApproveLabTemplate('supervisor'), false, 'rbac: supervisor cannot approve template');
    ok(perms.canApproveLabTemplate('manager'), 'rbac: manager can approve template');
    eq(perms.canArchiveLabEquipment('employee'), false, 'rbac: employee cannot archive equipment');
    eq(perms.canApproveLabDocument('supervisor'), false, 'rbac: supervisor cannot approve SOP/WI');
    ok(perms.canApproveLabDocument('manager'), 'rbac: manager can approve SOP/WI');
    eq(perms.canExportLabData('employee'), false, 'rbac: employee cannot export lab data');
    ok(perms.canExportLabData('supervisor'), 'rbac: supervisor can export');
    eq(perms.canViewLabManagementDashboard('employee'), false, 'rbac: employee cannot see mgmt dashboard');
  }

  // ── 3. XSS — server-side sample grid validation ──
  console.log('\n■ XSS — sample grid input validation');
  {
    // per-row cells are length-bounded and result is an enum.
    eq(labTestSampleRowSchema.safeParse({ sample_no: 1, part_name: 'x'.repeat(LAB_PART_NAME_MAX + 1) }).success, false, 'xss: over-long part_name rejected');
    eq(labTestSampleRowSchema.safeParse({ sample_no: 1, part_name: 'normal' }).success, true, 'xss: normal part_name accepted');
    eq(labTestSampleRowSchema.safeParse({ sample_no: 1, result: 'FAIL' }).success, true, 'xss: enum result accepted');
    eq(labTestSampleRowSchema.safeParse({ sample_no: 1, result: ';DROP TABLE lab_test_records--' }).success, false, 'xss: non-enum result rejected');
    eq(labTestSampleRowSchema.safeParse({ sample_no: 21, part_name: 'x' }).success, false, 'xss: sample_no above max rejected');
    eq(labTestSampleRowSchema.safeParse({ sample_no: 0, part_name: 'x' }).success, false, 'xss: sample_no below min rejected');
    eq(LAB_SAMPLE_COUNT_MAX, 20, 'policy: max samples 20');

    // A malicious text payload in samples_json (bad JSON) is rejected, and the
    // text is never interpreted.
    const badText = labTestFormSchema.safeParse({
      form_action: 'submit',
      sample_count: LAB_SAMPLE_COUNT_DEFAULT,
      samples_json: '{"__proto__":{"isAdmin":true},"constructor":"drop table"}',
    });
    eq(badText.success, false, 'xss: malformed samples_json string rejected');

    // The sample grid serves data, not markup: a <script> inside a sample cell
    // is stored as TEXT and length-bounded — it reaches the SQL layer only as
    // a bound parameter (rendering escapes it upstream).
    const scripty = labTestFormSchema.safeParse({
      form_action: 'submit',
      product_description: 'P',
      connector_type: 'Non-locking (Lipid connector)',
      lot_number: 'L',
      sampling_area: 'A',
      equipment_id: 1,
      sample_count: 1,
      final_result: 'PASS',
      samples_json: JSON.stringify([{ sample_no: 1, part_name: '<script>alert(1)</script>', result: 'PASS' }]),
    });
    ok(scripty.success, 'xss: script-shaped text stored as bounded data');
  }

  // ── 4. SQL injection — parameterized WHERE + LIKE escaping ──
  console.log('\n■ SQL injection');
  {
    eq(search.escapeLike('50%_done'), '50\\%\\_done', 'sqli: LIKE wildcards escaped');

    const evil = "'; DROP TABLE lab_test_records; --";
    const built = search.buildLabTestWhere({ q: evil });
    ok(!built.sql.toLowerCase().includes('drop table'), 'sqli: raw user text never appears in generated SQL');
    ok(built.params.some((p) => typeof p === 'string' && p.includes('\\')), 'sqli: params carry the LIKE-escaped literal');

    // Live search with hostile input must execute safely and leave schema intact.
    const before = Number(db.prepare('SELECT COUNT(*) AS n FROM lab_test_records').get().n);
    await search.searchLabTests({ q: evil, page: 1, per_page: 25, sort: 'updated_at', dir: 'asc' }, { role: 'employee', userId: employeeId });
    const after = Number(db.prepare('SELECT COUNT(*) AS n FROM lab_test_records').get().n);
    eq(after, before, 'sqli: live search does not change the table');
    ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lab_test_records'").get(), 'sqli: lab_test_records still exists');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
} catch (err) {
  console.error('❌ test-lab-security crashed:', err);
  process.exitCode = 1;
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }
}