// E2E spec for the REPORTS surface (/reports + /lab/reports + /api/reports/* + task exports).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern as
// e2e-task-shared.mjs / e2e-dashboard.mjs). Covers:
//   A. /reports renders for every role with the correct scope chip and the
//      organization-wide checkbox only for manager/admin.
//   B. Each report type in the catalog renders (option selected, download
//      links carry the type).
//   C. Downloads: every report type exports CSV / XLSX / PDF with non-empty
//      payloads, correct magic bytes, content-types and attachment
//      content-disposition filenames.
//   D. Task-level exports: /api/export/tasks.csv (role-scoped) and
//      /api/export/tasks/pdf/[id] (200 + application/pdf + filename) — the
//      PDF surface used by the "Download PDF" button on /tasks/[id].
//   E. Role gating: anonymous → 302; employee cannot request an
//      organization-wide report (403) and task PDFs of foreign tasks (403);
//      employee exports are scoped to their own tasks; supervisor downloads
//      are department-scoped; manager downloads are organization-wide.
//   F. Every download is recorded in the report audit trail.
//   G. Every catalogued laboratory report supports all three formats, while
//      employees are denied and malformed route/filter inputs are rejected.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-reports.mjs

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4399';
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';

// ── tiny test harness ──
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

// ── DB helpers ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const q = (sql, ...p) => db.prepare(sql).get(...p);

// ── date helpers ──
const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localIso(d);
}
/** UTC timestamp n days ago at noon (stable calendar days). */
function utcDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(12, 0, 0, 0);
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

const browser = await chromium.launch({ headless: true });
const mgr = q("SELECT id, username, role FROM users WHERE username = 'manager'");
const sup = q("SELECT id, username, role FROM users WHERE username = 'supervisor'");
const emp = q("SELECT id, username, role FROM users WHERE username = 'employee'");
const adm = q("SELECT id, username, role FROM users WHERE username = 'admin'");
ok(!!mgr && !!sup && !!emp && !!adm, 'seeded roles exist');

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

// ─────────────────────────── Fixtures ───────────────────────────
// Task set: one overdue (employee), one completed with evidence (employee),
// one manager-only (invisible to employee exports), one on hold (employee).
// Fixture ids are hoisted so the finally-cleanup can reach them even when the
// try block fails partway through.
let tOverdue = null;
let tEvidence = null;
let tManagerOnly = null;
let tOnHold = null;
let findingId = null;
const insertTask = db.prepare(
  `INSERT INTO tasks (title, description, status, priority, progress_percent, department,
                      created_by, assigned_to, due_date, created_at, started_at, completed_at, completed_by)
   VALUES (?, ?, ?, ?, ?, 'QC', ?, ?, ?, ?, ?, ?, ?)`,
);
tOverdue = Number(
  insertTask.run('REP overdue task', 'Overdue fixture for the overdue report', 'in_progress', 'high', 40, mgr.id, emp.id, isoDaysAgo(5), utcDaysAgo(10), utcDaysAgo(8), null, null).lastInsertRowid,
);
tEvidence = Number(
  insertTask.run('REP completed evidence', 'Completed with evidence for evidence-compliance', 'completed', 'medium', 100, mgr.id, emp.id, isoDaysAgo(2), utcDaysAgo(15), utcDaysAgo(7), utcDaysAgo(2), emp.id).lastInsertRowid,
);
tManagerOnly = Number(
  insertTask.run('REP manager-only', 'Manager-owned fixture invisible to employees', 'not_started', 'low', 0, mgr.id, mgr.id, isoDaysAgo(-5), utcDaysAgo(3), null, null, null).lastInsertRowid,
);
tOnHold = Number(
  insertTask.run('REP on hold task', 'On-hold fixture for monthly-qc', 'on_hold', 'medium', 20, mgr.id, emp.id, isoDaysAgo(-3), utcDaysAgo(5), null, null, null).lastInsertRowid,
);
// Evidence attachment on the completed task.
db.prepare(
  `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_size, file_data, is_evidence)
   VALUES (?, ?, 'rep-evidence.pdf', 'application/pdf', ?, ?, 1)`,
).run(tEvidence, emp.id, Buffer.byteLength('%PDF-1.4 report fixture'), Buffer.from('%PDF-1.4 report fixture'));
// One critical OPEN finding + CAPA for the findings/capa reports.
findingId = Number(
  db.prepare(
    `INSERT INTO qc_findings (finding_number, task_id, inspection_type, classification, severity, risk_description, requirement_reference, owner, due_date, created_by, status)
     VALUES (?, ?, 'Internal audit', 'critical', 'critical', 'REP finding risk', 'ISO-9001-8.7', ?, ?, ?, 'OPEN')`,
  ).run('REP-E2E-FINDING-001', tOverdue, mgr.id, isoDaysAgo(-7), mgr.id).lastInsertRowid,
);
db.prepare(
  `INSERT INTO qc_capa (finding_id, problem_statement, root_cause, corrective_action, preventive_action, owner, due_date, created_by, status)
   VALUES (?, 'REP capa problem', 'REP root cause', 'REP corrective action', 'REP preventive action', ?, ?, ?, 'OPEN')`,
).run(findingId, mgr.id, isoDaysAgo(-7), mgr.id);
// A couple of audit events for the audit-trail report.
db.prepare(
  `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, created_at)
   VALUES ('FINDING', ?, ?, ?, 'CREATE', NULL, 'REP-E2E-FINDING-001', ?)`,
).run(findingId, tOverdue, mgr.id, utcDaysAgo(4));
db.prepare(
  `INSERT INTO qc_audit_log (entity_type, entity_id, task_id, actor_id, action, old_value, new_value, created_at)
   VALUES ('FINDING', ?, ?, ?, 'UPDATE', 'not_started', 'in_progress', ?)`,
).run(tOverdue, tOverdue, mgr.id, utcDaysAgo(8));

const REPORT_TYPES = ['monthly-qc', 'sla', 'findings', 'capa', 'employee-performance', 'audit-trail', 'evidence-compliance', 'overdue'];
const LAB_REPORT_TYPES = [
  'lab-test-register', 'lab-test-register-air', 'lab-test-register-vacuum',
  'lab-results', 'lab-retests', 'lab-product-history', 'lab-equipment-register',
  'lab-calibration', 'lab-maintenance', 'lab-sop-register', 'lab-wi-register',
  'lab-doc-review-due', 'lab-acknowledgements', 'lab-activity', 'lab-data-quality',
  'lab-retention-status',
];

console.log(`\n▶ E2E reports — ${BASE}\n`);

try {
  const mgrCtx = await browser.newContext();
  const mgrPage = await mgrCtx.newPage();
  await login(mgrPage, 'manager');
  const empCtx = await browser.newContext();
  const empPage = await empCtx.newPage();
  await login(empPage, 'employee');
  const supCtx = await browser.newContext();
  const supPage = await supCtx.newPage();
  await login(supPage, 'supervisor');

  // ─────────────────── A. /reports page ───────────────────
  console.log('── Scenario A: /reports renders per role ──');
  await mgrPage.goto(`${BASE}/reports`);
  ok((await mgrPage.locator('h1:has-text("Reports")').count()) === 1, 'A. /reports renders for manager');
  ok((await mgrPage.locator('select[name="report_type"] option').count()) === REPORT_TYPES.length, 'A. report type select lists all 8 types');
  ok((await mgrPage.locator('a[href^="/api/reports/"]').count()) >= 3, 'A. CSV / XLSX / PDF download links present');
  ok((await mgrPage.locator('input[name="scope"][value="organization"]').count()) === 1, 'A. manager sees the organization-wide scope checkbox');
  ok((await mgrPage.locator('a[href="/api/reports/audit"]').count()) === 1, 'A. audit trail link present');

  await supPage.goto(`${BASE}/reports`);
  ok((await supPage.locator('h1:has-text("Reports")').count()) === 1, 'A. /reports renders for supervisor');
  ok((await supPage.locator('input[name="scope"][value="organization"]').count()) === 0, 'A. supervisor has no organization-wide checkbox');

  await supPage.goto(`${BASE}/lab/reports`);
  ok((await supPage.locator('select[name="report_type"] option').count()) === LAB_REPORT_TYPES.length, 'A. lab catalog lists all 16 report types');
  ok((await supPage.locator('text=Generate the 16 laboratory reports').count()) === 1, 'A. lab report count matches the catalog');

  await empPage.goto(`${BASE}/reports`);
  ok((await empPage.locator('h1:has-text("Reports")').count()) === 1, 'A. /reports renders for employee');
  ok((await empPage.locator('input[name="scope"][value="organization"]').count()) === 0, 'A. employee has no organization-wide checkbox');
  ok((await empPage.locator('text=Your tasks only').count()) === 1, 'A. employee scope chip says "Your tasks only"');

  const anon = await browser.newPage();
  await anon.goto(`${BASE}/reports`);
  ok(anon.url().includes('/login'), 'A. anonymous /reports redirects to login');
  await anon.close();

  // ─────────────────── B. Each report type renders ───────────────────
  console.log('\n── Scenario B: every report type renders on /reports ──');
  for (const type of REPORT_TYPES) {
    await mgrPage.goto(`${BASE}/reports?report_type=${type}`);
    ok(
      (await mgrPage.locator(`select[name="report_type"] option[value="${type}"][selected]`).count()) === 1,
      `B. ${type} option selected`,
    );
    ok(
      (await mgrPage.locator(`a[href="/api/reports/${type}.csv"]`).count()) === 1 &&
        (await mgrPage.locator(`a[href="/api/reports/${type}.xlsx"]`).count()) === 1 &&
        (await mgrPage.locator(`a[href="/api/reports/${type}.pdf"]`).count()) === 1,
      `B. ${type} CSV/XLSX/PDF links carry the type`,
    );
  }

  // ─────────────────── C. Downloads (CSV / XLSX / PDF) ───────────────────
  console.log('\n── Scenario C: non-empty CSV / XLSX / PDF downloads for every type ──');
  for (const type of REPORT_TYPES) {
    const csv = await mgrCtx.request.get(`${BASE}/api/reports/${type}.csv`);
    ok(csv.status() === 200, `C. ${type} CSV 200`);
    ok((csv.headers()['content-type'] ?? '').includes('text/csv'), `C. ${type} CSV content-type`);
    ok((csv.headers()['content-disposition'] ?? '').includes(`filename="${type}.csv"`), `C. ${type} CSV attachment filename`);
    const csvBody = await csv.text();
    ok(csvBody.startsWith('\uFEFF'), `C. ${type} CSV has UTF-8 BOM`);
    ok(csvBody.includes('Report ID'), `C. ${type} CSV has the Report ID header`);
    ok(csvBody.trim().split('\n').length >= 2, `C. ${type} CSV is non-empty (header + rows)`);

    const xlsx = await mgrCtx.request.get(`${BASE}/api/reports/${type}.xlsx`);
    ok(xlsx.status() === 200, `C. ${type} XLSX 200`);
    ok((xlsx.headers()['content-type'] ?? '').includes('spreadsheetml.sheet'), `C. ${type} XLSX content-type`);
    const xlsxBuf = Buffer.from(await xlsx.body());
    ok(xlsxBuf.length > 1000 && xlsxBuf.toString('latin1', 0, 2) === 'PK', `C. ${type} XLSX is a non-empty ZIP (${xlsxBuf.length} bytes)`);

    const pdf = await mgrCtx.request.get(`${BASE}/api/reports/${type}.pdf`);
    ok(pdf.status() === 200, `C. ${type} PDF 200`);
    ok((pdf.headers()['content-type'] ?? '').includes('application/pdf'), `C. ${type} PDF content-type`);
    ok((pdf.headers()['content-disposition'] ?? '').includes(`filename="${type}.pdf"`), `C. ${type} PDF attachment filename`);
    const pdfText = Buffer.from(await pdf.body()).toString('latin1');
    ok(pdfText.startsWith('%PDF-1.4') && pdfText.includes('%%EOF'), `C. ${type} PDF is a real document (${pdfText.length} bytes)`);
  }

  // Content spot-checks: the seeded rows actually show up in the CSVs.
  const findingsCsv = await (await mgrCtx.request.get(`${BASE}/api/reports/findings.csv`)).text();
  ok(findingsCsv.includes('REP-E2E-FINDING-001'), 'C. findings CSV contains the seeded finding');
  const capaCsv = await (await mgrCtx.request.get(`${BASE}/api/reports/capa.csv`)).text();
  ok(capaCsv.includes(String(findingId)), 'C. capa CSV contains the seeded CAPA finding id');
  const overdueCsv = await (await mgrCtx.request.get(`${BASE}/api/reports/overdue.csv`)).text();
  ok(overdueCsv.includes('REP overdue task'), 'C. overdue CSV contains the overdue task');
  const evidenceCsv = await (await mgrCtx.request.get(`${BASE}/api/reports/evidence-compliance.csv`)).text();
  ok(evidenceCsv.includes('REP completed evidence'), 'C. evidence-compliance CSV contains the completed task');

  // ─────────────────── D. Task-level exports (CSV + PDF) ───────────────────
  console.log('\n── Scenario D: task-level CSV + PDF exports ──');
  const taskCsv = await mgrCtx.request.get(`${BASE}/api/export/tasks.csv`);
  ok(taskCsv.status() === 200, 'D. tasks CSV 200');
  ok((taskCsv.headers()['content-type'] ?? '').includes('text/csv'), 'D. tasks CSV content-type');
  const taskCsvBody = await taskCsv.text();
  ok(taskCsvBody.startsWith('\uFEFF') && taskCsvBody.includes('ID,Title,Description'), 'D. tasks CSV headers present');
  ok(taskCsvBody.includes('REP completed evidence') && taskCsvBody.includes('REP manager-only'), 'D. manager tasks CSV contains every task');

  const taskPdf = await mgrCtx.request.get(`${BASE}/api/export/tasks/pdf/${tEvidence}`);
  ok(taskPdf.status() === 200, 'D. task PDF 200');
  ok((taskPdf.headers()['content-type'] ?? '').includes('application/pdf'), 'D. task PDF content-type application/pdf');
  ok((taskPdf.headers()['content-disposition'] ?? '').includes(`filename="task-${tEvidence}.pdf"`), 'D. task PDF has a content-disposition filename');
  const taskPdfText = Buffer.from(await taskPdf.body()).toString('latin1');
  ok(taskPdfText.startsWith('%PDF-1.4') && taskPdfText.includes('REP completed evidence') && taskPdfText.includes('%%EOF'), 'D. task PDF contains the task title and is a valid document');

  // ─────────────────── E. Role gating ───────────────────
  console.log('\n── Scenario E: role gating on reports + exports ──');
  const anonRes = await browser.newContext().then((c) => c.request.get(`${BASE}/api/reports/sla.csv`, { maxRedirects: 0 }));
  ok(anonRes.status() === 302 && (anonRes.headers()['location'] ?? '').startsWith('/login'), 'E. anonymous report download → 302 to login');
  const anonPdf = await browser.newContext().then((c) => c.request.get(`${BASE}/api/export/tasks/pdf/${tEvidence}`, { maxRedirects: 0 }));
  ok(anonPdf.status() === 302 && (anonPdf.headers()['location'] ?? '').startsWith('/login'), 'E. anonymous task PDF → 302 to login');

  const empOrg = await empCtx.request.get(`${BASE}/api/reports/sla.csv?scope=organization`);
  ok(empOrg.status() === 403, 'E. employee organization-wide report → 403');
  const empCsv = await empCtx.request.get(`${BASE}/api/reports/sla.csv`);
  ok(empCsv.status() === 200, 'E. employee own-scope report → 200');
  const empCsvBody = await empCsv.text();
  ok(
    empCsvBody.includes('REP overdue task') &&
      empCsvBody.includes('REP completed evidence') &&
      !empCsvBody.includes('REP manager-only'),
    'E. employee report scoped to their tasks (manager-only excluded)',
  );

  const empTaskCsv = await empCtx.request.get(`${BASE}/api/export/tasks.csv`);
  const empTaskCsvBody = await empTaskCsv.text();
  ok(
    empTaskCsvBody.includes('REP overdue task') && !empTaskCsvBody.includes('REP manager-only'),
    'E. employee tasks CSV scoped (manager-only excluded)',
  );

  const empForeignPdf = await empCtx.request.get(`${BASE}/api/export/tasks/pdf/${tManagerOnly}`);
  ok(empForeignPdf.status() === 403, 'E. employee task PDF of a foreign task → 403');
  const empOwnPdf = await empCtx.request.get(`${BASE}/api/export/tasks/pdf/${tEvidence}`);
  ok(empOwnPdf.status() === 200, 'E. employee task PDF of their own task → 200');

  const supCsv = await supCtx.request.get(`${BASE}/api/reports/sla.csv`);
  ok(supCsv.status() === 200, 'E. supervisor report → 200 (department scope)');
  const supCsvBody = await supCsv.text();
  ok(supCsvBody.includes('REP manager-only'), 'E. supervisor department scope includes all QC tasks');

  // Laboratory reports use the same transport, writers, and audit pipeline;
  // employee access is denied by the reporting authorization service.
  console.log('\n── Scenario G: laboratory report transport and validation ──');
  for (const type of LAB_REPORT_TYPES) {
    for (const format of ['csv', 'xlsx', 'pdf']) {
      const response = await supCtx.request.get(`${BASE}/api/reports/${type}.${format}`);
      const body = Buffer.from(await response.body());
      const contentType = response.headers()['content-type'] ?? '';
      ok(response.status() === 200, `G. ${type} ${format} 200 for supervisor`);
      ok(body.length > 0, `G. ${type} ${format} non-empty`);
      ok(
        (format === 'csv' && contentType.includes('text/csv')) ||
          (format === 'xlsx' && contentType.includes('spreadsheetml.sheet')) ||
          (format === 'pdf' && contentType.includes('application/pdf')),
        `G. ${type} ${format} content-type`,
      );
      ok((response.headers()['content-disposition'] ?? '').includes(`filename="${type}.${format}"`), `G. ${type} ${format} safe filename`);
    }
    const employeeResponse = await empCtx.request.get(`${BASE}/api/reports/${type}.csv`);
    ok(employeeResponse.status() === 403, `G. employee denied ${type}`);
  }
  const invalidType = await supCtx.request.get(`${BASE}/api/reports/not-a-report.csv`);
  ok(invalidType.status() === 404, 'G. invalid report type rejected');
  const invalidFormat = await supCtx.request.get(`${BASE}/api/reports/sla.zip`);
  ok(invalidFormat.status() === 404, 'G. unsupported format rejected');
  const invalidFilter = await supCtx.request.get(`${BASE}/api/reports/sla.csv?from=2026-02-30`);
  ok(invalidFilter.status() === 400, 'G. invalid date filter rejected');
  const invalidPagination = await supCtx.request.get(`${BASE}/api/reports/sla.csv?page=2`);
  ok(invalidPagination.status() === 400, 'G. unsupported pagination input rejected');
  const employeeLabScope = await empCtx.request.get(`${BASE}/api/reports/lab-test-register.csv?scope=organization`);
  ok(employeeLabScope.status() === 403, 'G. employee cannot widen Lab report scope');

  // ─────────────────── F. Report audit trail ───────────────────
  console.log('\n── Scenario F: downloads recorded in the report audit trail ──');
  const audit = await mgrCtx.request.get(`${BASE}/api/reports/audit`);
  ok(audit.status() === 200, 'F. report audit endpoint 200');
  const auditJson = await audit.json();
  ok(Array.isArray(auditJson.rows) && auditJson.rows.length >= REPORT_TYPES.length * 2, 'F. every download was recorded');
  const completed = auditJson.rows.filter((r) => r.status === 'completed').length;
  ok(completed >= REPORT_TYPES.length * 2, `F. downloads completed successfully (${completed} completed rows)`);
  const pdfRows = auditJson.rows.filter((r) => r.format === 'pdf').length;
  ok(pdfRows >= REPORT_TYPES.length + 1, `F. PDF generations recorded (${pdfRows})`);
  ok(auditJson.rows.some((r) => r.report_type === 'lab-retention-status' && r.format === 'pdf'), 'F. Lab report generation recorded in report_audit_log');
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  // ── cleanup: remove fixture rows (children cascade) + sessions ──
  const taskIds = [tOverdue, tEvidence, tManagerOnly, tOnHold].filter((id) => id !== null);
  if (taskIds.length === 4) {
    db.prepare('DELETE FROM qc_audit_log WHERE task_id IN (?, ?, ?, ?)').run(tOverdue, tEvidence, tManagerOnly, tOnHold);
    db.prepare('DELETE FROM task_attachments WHERE task_id IN (?, ?, ?, ?)').run(tOverdue, tEvidence, tManagerOnly, tOnHold);
  } else {
    for (const id of taskIds) {
      db.prepare('DELETE FROM qc_audit_log WHERE task_id = ?').run(id);
      db.prepare('DELETE FROM task_attachments WHERE task_id = ?').run(id);
    }
  }
  if (findingId) {
    db.prepare('DELETE FROM qc_evidence WHERE finding_id = ?').run(findingId);
    db.prepare('DELETE FROM qc_capa WHERE finding_id = ?').run(findingId);
    db.prepare('DELETE FROM qc_findings WHERE id = ?').run(findingId);
  }
  if (taskIds.length === 4) {
    db.prepare('DELETE FROM tasks WHERE id IN (?, ?, ?, ?)').run(tOverdue, tEvidence, tManagerOnly, tOnHold);
  } else {
    for (const id of taskIds) db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }
  db.prepare('DELETE FROM sessions').run();
  db.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
