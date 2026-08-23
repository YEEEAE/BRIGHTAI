// E2E spec for the QC FINDINGS workflow (/findings + /api/findings/*).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern as
// e2e-task-shared.mjs / e2e-task-search.mjs). Covers:
//   A. Manager creates a CRITICAL finding via the API (201 + persisted row +
//      FINDING CREATE audit event).
//   B. Employee authorization wall: cannot create a foreign-owned finding,
//      cannot manage/close/review a finding they do not own, and the detail
//      page renders 403. (Employees may only create/access ASSIGNED findings.)
//   C. RCA: save 5-Whys analysis (303 + persisted row + audit).
//   D. CAPA: create the corrective action (303 + DRAFT row) INCLUDING the
//      evidence + effectiveness fields that feed the critical closure gate.
//   E. CAPA lifecycle DRAFT → OPEN → IMPLEMENTATION → VERIFICATION → EFFECTIVE
//      with manager-only approval, invalid backward transitions rejected, and
//      employee approval denied (403).
//   F. Evidence: add finding evidence (303 + qc_evidence row).
//   G. Approval lane: employee cannot approve (403); approve → VERIFICATION;
//      close without closure evidence is rejected; closing before approval is
//      rejected (critical gate).
//   H. Closure: critical finding closes only after CAPA effective + approval +
//      closure evidence (200 + CLOSED row + CLOSURE audit).
//   I. Pages: anonymous /findings → 302 to login; manager sees the finding;
//      employee gets a 403 page for the foreign finding.
//
// Usage (from the app directory, via e2e-acceptance.mjs):
//   QC_DATABASE_PATH=<db> PORT=<port> BASE_URL=http://127.0.0.1:<port> \
//     ADMIN_DEFAULT_PASSWORD=... node scripts/e2e-findings.mjs

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4398';
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
function isoDaysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localIso(d);
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

function toParams(fields) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) for (const item of v) p.append(k, String(item));
    else if (v !== undefined && v !== null) p.append(k, String(v));
  }
  return p;
}

/** POST a form via the context's session and return the raw response. */
function postForm(ctx, url, fields) {
  return ctx.request.post(url, {
    data: toParams(fields).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE },
    maxRedirects: 0,
  });
}

/**
 * PATCH a form via the context's session. The finding ACTION endpoint
 * (/api/findings/[id]) exports PATCH for approve/reject/close/status, while
 * the RCA/CAPA/evidence sub-routes are POST — so actions go through here.
 */
function patchForm(ctx, url, fields) {
  return ctx.request.patch(url, {
    data: toParams(fields).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE },
    maxRedirects: 0,
  });
}

// ─────────────────────────── Fixtures ───────────────────────────
// One QC task (manager-created, employee-assigned) to attach findings to.
// Fixture ids are hoisted so the finally-cleanup can reach them even when the
// try block fails partway through.
let taskId = null;
let findingId = null;
const taskRes = db
  .prepare(
    `INSERT INTO tasks (title, description, status, priority, department, created_by, assigned_to, due_date, created_at)
     VALUES (?, ?, 'not_started', 'high', 'QC', ?, ?, ?, datetime('now', '-1 day'))`,
  )
  .run('FIND Critical fixture task', 'Fixture task for the e2e findings walk', mgr.id, emp.id, isoDaysFromToday(10));
taskId = Number(taskRes.lastInsertRowid);

console.log(`\n▶ E2E QC findings workflow — ${BASE}\n`);

try {
  // Login contexts: manager drives the walk, employee attacks it.
  const mgrCtx = await browser.newContext();
  const mgrPage = await mgrCtx.newPage();
  await login(mgrPage, 'manager');
  const empCtx = await browser.newContext();
  const empPage = await empCtx.newPage();
  await login(empPage, 'employee');

  // ─────────────────── A. Create a critical finding ───────────────────
  console.log('── Scenario A: manager creates a critical finding ──');
  const createRes = await postForm(mgrCtx, `${BASE}/api/findings`, {
    finding_number: 'E2E-CRIT-001',
    task_id: String(taskId),
    inspection_type: 'Internal audit',
    classification: 'critical',
    severity: 'critical',
    risk_description: 'E2E critical risk description',
    requirement_reference: 'ISO-9001-8.7',
    owner: String(mgr.id),
    due_date: isoDaysFromToday(7),
  });
  ok(createRes.status() === 201, 'A. manager creates the finding (201)');
  findingId = Number((await createRes.json()).id);
  ok(Number.isInteger(findingId) && findingId > 0, 'A. creation returns a numeric id');
  const fRow = q('SELECT * FROM qc_findings WHERE id = ?', findingId);
  ok(
    fRow && fRow.classification === 'critical' && fRow.severity === 'critical' && fRow.status === 'OPEN',
    'A. finding persisted as OPEN / critical',
  );
  ok(fRow && Number(fRow.owner) === mgr.id && Number(fRow.task_id) === taskId, 'A. finding linked to the task + owner');
  ok(
    q(`SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type='FINDING' AND entity_id=? AND action='CREATE'`, findingId).n === 1,
    'A. FINDING CREATE audit event recorded',
  );

  // ─────────────────── B. Employee authorization wall ───────────────────
  console.log('\n── Scenario B: employee cannot create/manage/review foreign findings ──');
  const empCreate = await postForm(empCtx, `${BASE}/api/findings`, {
    finding_number: 'E2E-STEAL-001',
    task_id: String(taskId),
    inspection_type: 'Internal audit',
    classification: 'minor',
    severity: 'low',
    risk_description: 'Steal attempt',
    owner: String(mgr.id),
  });
  ok(empCreate.status() === 403, 'B. employee cannot create a finding owned by someone else (403)');
  ok(q('SELECT 1 FROM qc_findings WHERE finding_number = ?', 'E2E-STEAL-001') === undefined, 'B. steal attempt persisted nothing');

  const empClose = await patchForm(empCtx, `${BASE}/api/findings/${findingId}`, { action: 'close', closure_evidence: 'hax' });
  ok(empClose.status() === 403, 'B. employee cannot close a foreign finding (403)');
  const empApprove = await patchForm(empCtx, `${BASE}/api/findings/${findingId}`, { action: 'approve' });
  ok(empApprove.status() === 403, 'B. employee cannot approve a foreign finding (403)');
  const empRca = await postForm(empCtx, `${BASE}/api/findings/${findingId}/rca`, { method: '5_WHYS', free_form: 'no' });
  ok(empRca.status() === 403, 'B. employee cannot post RCA on a foreign finding (403)');
  const empCapa = await postForm(empCtx, `${BASE}/api/findings/${findingId}/capa`, { problem_statement: 'no', root_cause: 'no', corrective_action: 'no', preventive_action: 'no', owner: String(emp.id) });
  ok(empCapa.status() === 403, 'B. employee cannot create CAPA on a foreign finding (403)');
  const empEvidence = await postForm(empCtx, `${BASE}/api/findings/${findingId}/evidence`, { description: 'no' });
  ok(empEvidence.status() === 403, 'B. employee cannot add evidence to a foreign finding (403)');
  const empPageRes = await empCtx.request.get(`${BASE}/findings/${findingId}`);
  ok(empPageRes.status() === 403, 'B. employee /findings/[id] page → 403');
  ok((await empPageRes.text()).includes('Forbidden'), 'B. employee 403 page explains the boundary');
  ok(q('SELECT status FROM qc_findings WHERE id = ?', findingId).status === 'OPEN', 'B. finding state untouched by employee attempts');

  // ─────────────────── C. RCA ───────────────────
  console.log('\n── Scenario C: RCA (5 Whys) ──');
  const rcaRes = await postForm(mgrCtx, `${BASE}/api/findings/${findingId}/rca`, {
    method: '5_WHYS',
    free_form: 'E2E root cause narrative',
    why_1: 'Gauge drifted',
    why_2: 'Not calibrated',
    why_3: 'Calibration skipped',
    why_4: 'Schedule overloaded',
    why_5: 'No planner',
  });
  ok(rcaRes.status() === 303, 'C. RCA POST redirects (303)');
  const rcaRow = q('SELECT * FROM qc_rca WHERE finding_id = ?', findingId);
  ok(rcaRow && rcaRow.method === '5_WHYS' && rcaRow.why_1 === 'Gauge drifted' && rcaRow.why_5 === 'No planner', 'C. RCA persisted with the five whys');
  ok(
    q(`SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type='RCA' AND entity_id=? AND action='CREATE'`, rcaRow.id).n === 1,
    'C. RCA CREATE audit event recorded',
  );

  // ─────────────────── D. CAPA content (incl. evidence) ───────────────────
  console.log('\n── Scenario D: CAPA content with evidence + effectiveness ──');
  const capaRes = await postForm(mgrCtx, `${BASE}/api/findings/${findingId}/capa`, {
    problem_statement: 'E2E CAPA problem statement',
    root_cause: 'E2E CAPA root cause',
    corrective_action: 'Recalibrate gauges and add a planner gate',
    preventive_action: 'Automate calibration scheduling',
    owner: String(mgr.id),
    due_date: isoDaysFromToday(7),
    evidence: 'E2E CAPA evidence attachment',
    effectiveness_check: 'E2E effectiveness check',
  });
  ok(capaRes.status() === 303, 'D. CAPA POST redirects (303)');
  const capaRow = q('SELECT * FROM qc_capa WHERE finding_id = ?', findingId);
  ok(capaRow && capaRow.status === 'DRAFT' && capaRow.corrective_action === 'Recalibrate gauges and add a planner gate', 'D. CAPA persisted as DRAFT with the corrective action');
  ok(capaRow.evidence === 'E2E CAPA evidence attachment' && capaRow.effectiveness_check === 'E2E effectiveness check', 'D. CAPA evidence + effectiveness persist (feeds the critical gate)');
  ok(
    q(`SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type='CAPA' AND entity_id=? AND action='CREATE'`, capaRow.id).n === 1,
    'D. CAPA CREATE audit event recorded',
  );

  // ─────────────────── E. CAPA lifecycle + approvals ───────────────────
  console.log('\n── Scenario E: CAPA lifecycle DRAFT → OPEN → IMPLEMENTATION → VERIFICATION → EFFECTIVE ──');
  const empEffective = await postForm(empCtx, `${BASE}/api/findings/${findingId}/capa`, { status: 'EFFECTIVE', decision: 'Approved' });
  ok(empEffective.status() === 403, 'E. employee cannot approve CAPA (403)');
  const walk = [
    ['OPEN', ''],
    ['IMPLEMENTATION', ''],
    ['VERIFICATION', 'E2E effectiveness decision'],
    ['EFFECTIVE', 'Approved'],
  ];
  for (const [status, decision] of walk) {
    const r = await postForm(mgrCtx, `${BASE}/api/findings/${findingId}/capa`, { status, decision });
    ok(r.status() === 303, `E. CAPA transition to ${status} (303)`);
  }
  const capaFinal = q('SELECT * FROM qc_capa WHERE finding_id = ?', findingId);
  ok(capaFinal.status === 'EFFECTIVE', 'E. CAPA reached EFFECTIVE');
  ok(capaFinal.effectiveness_check === 'E2E effectiveness decision', 'E. VERIFICATION stored the effectiveness review');
  ok(capaFinal.approval === 'Approved' && Number(capaFinal.reviewer) === mgr.id, 'E. EFFECTIVE stored the manager approval');
  const badBack = await postForm(mgrCtx, `${BASE}/api/findings/${findingId}/capa`, { status: 'IMPLEMENTATION' });
  ok(badBack.status() === 400, 'E. backward CAPA transition rejected (400)');

  // ─────────────────── F. Finding evidence ───────────────────
  console.log('\n── Scenario F: finding evidence ──');
  const evRes = await postForm(mgrCtx, `${BASE}/api/findings/${findingId}/evidence`, { description: 'E2E finding evidence', reference: 'E2E-REF-1' });
  ok(evRes.status() === 303, 'F. evidence POST redirects (303)');
  ok(
    q(`SELECT COUNT(*) AS n FROM qc_evidence WHERE finding_id=? AND description='E2E finding evidence' AND reference='E2E-REF-1'`, findingId).n === 1,
    'F. evidence row persisted',
  );

  // ─────────────────── G. Approval lane + closure gates ───────────────────
  console.log('\n── Scenario G: approval + critical closure gates ──');
  // Close attempt while still OPEN must fail — OPEN cannot jump straight to
  // CLOSED, and the approval lane is mandatory. (No closure_evidence is sent
  // here: a rejected close still persists closure_evidence via updateFinding
  // before the transition check throws, so sending one would poison the later
  // no-evidence assertion.)
  const earlyClose = await patchForm(mgrCtx, `${BASE}/api/findings/${findingId}`, { action: 'close' });
  ok(earlyClose.status() === 400, 'G. finding cannot close before approval (400)');
  // The approval lane: OPEN → UNDER_REVIEW (status lane) → VERIFICATION (approve).
  const reviewRes = await patchForm(mgrCtx, `${BASE}/api/findings/${findingId}`, { action: 'status', status: 'UNDER_REVIEW' });
  ok(reviewRes.status() === 200, 'G. finding moves to UNDER_REVIEW (200)');
  ok(q('SELECT status FROM qc_findings WHERE id = ?', findingId).status === 'UNDER_REVIEW', 'G. finding status UNDER_REVIEW');
  const approveRes = await patchForm(mgrCtx, `${BASE}/api/findings/${findingId}`, { action: 'approve' });
  ok(approveRes.status() === 200, 'G. manager approves the finding (200)');
  ok(q('SELECT status FROM qc_findings WHERE id = ?', findingId).status === 'VERIFICATION', 'G. finding moved to VERIFICATION');
  ok(
    q(`SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type='FINDING' AND entity_id=? AND action='APPROVAL'`, findingId).n === 1,
    'G. APPROVAL audit event recorded',
  );
  const empApprove2 = await patchForm(empCtx, `${BASE}/api/findings/${findingId}`, { action: 'approve' });
  ok(empApprove2.status() === 403, 'G. employee still cannot approve (403)');
  // In VERIFICATION with all CAPA gates met, closure still requires evidence.
  const noEvidenceClose = await patchForm(mgrCtx, `${BASE}/api/findings/${findingId}`, { action: 'close' });
  ok(noEvidenceClose.status() === 400, 'G. closure without closure evidence rejected (400)');
  ok(q('SELECT status FROM qc_findings WHERE id = ?', findingId).status === 'VERIFICATION', 'G. failed close leaves the finding in VERIFICATION');

  // ─────────────────── H. Closure ───────────────────
  console.log('\n── Scenario H: closure with all gates met ──');
  const closeRes = await patchForm(mgrCtx, `${BASE}/api/findings/${findingId}`, { action: 'close', closure_evidence: 'E2E closure evidence' });
  ok(closeRes.status() === 200, 'H. critical finding closes after CAPA effective + approval (200)');
  const closed = q('SELECT * FROM qc_findings WHERE id = ?', findingId);
  ok(closed.status === 'CLOSED' && Number(closed.closed_by) === mgr.id, 'H. finding persisted CLOSED by the manager');
  ok(closed.closure_evidence === 'E2E closure evidence', 'H. closure evidence persisted');
  ok(
    q(`SELECT COUNT(*) AS n FROM qc_audit_log WHERE entity_type='FINDING' AND entity_id=? AND action='CLOSURE'`, findingId).n === 1,
    'H. CLOSURE audit event recorded',
  );
  // The full audit trail for the finding walk is present.
  const auditActions = q(
    `SELECT group_concat(action, ',') AS acts FROM (
       SELECT action FROM qc_audit_log
       WHERE entity_type='FINDING' AND entity_id=?
       ORDER BY id ASC
     )`,
    findingId,
  ).acts;
  const expectedActs = ['CREATE', 'APPROVAL', 'CLOSURE'];
  ok(
    expectedActs.every((a) => String(auditActions).split(',').includes(a)),
    `H. finding audit trail contains ${expectedActs.join(', ')} (got ${auditActions})`,
  );

  // ─────────────────── I. Page surfaces ───────────────────
  console.log('\n── Scenario I: pages — anonymous redirect, manager view, employee 403 ──');
  const anon = await browser.newPage();
  await anon.goto(`${BASE}/findings`);
  ok(anon.url().includes('/login'), 'I. anonymous /findings redirects to login');
  await anon.close();
  await mgrPage.goto(`${BASE}/findings/${findingId}`);
  ok((await mgrPage.locator('h1:has-text("E2E-CRIT-001")').count()) === 1, 'I. manager sees the finding detail page');
  ok((await mgrPage.locator('text=Critical closure gate').count()) === 1, 'I. critical closure gate panel rendered');
  ok((await mgrPage.locator('text=CLOSURE').count()) >= 1, 'I. manager sees the CLOSURE event in the audit trail');
  const empPageView = await empCtx.request.get(`${BASE}/findings/${findingId}`);
  ok(empPageView.status() === 403, 'I. employee page for the foreign finding → 403');
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  // ── cleanup: cascade-safe explicit deletes for the fixture chain ──
  if (findingId) {
    db.prepare('DELETE FROM qc_evidence WHERE finding_id = ?').run(findingId);
    db.prepare('DELETE FROM qc_rca WHERE finding_id = ?').run(findingId);
    db.prepare('DELETE FROM qc_capa WHERE finding_id = ?').run(findingId);
    db.prepare('DELETE FROM qc_findings WHERE id = ?').run(findingId);
  }
  if (taskId) {
    db.prepare('DELETE FROM qc_audit_log WHERE task_id = ?').run(taskId);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  }
  db.prepare('DELETE FROM sessions').run();
  for (const context of browser.contexts()) {
    for (const page of context.pages()) await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
  await browser.close().catch(() => {});
  db.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
