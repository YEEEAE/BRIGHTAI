// E2E spec for ADVANCED TASK SEARCH (the /search feature).
//
// Runs against a LIVE server sharing the same SQLite database (same pattern as
// e2e-task-shared.mjs). Covers:
//   A. Page renders + every export/reset affordance is present.
//   B. Free-text search across title / description / blocker_note / comments
//      (including literal-% escaping).
//   C. Every filter: status, priority, department, assigned, creator, due /
//      created / completed ranges, overdue, has_evidence, evidence_skipped,
//      recurrence, deletion requested + combined filters.
//   D. Pagination + sorting (state preserved in the URL).
//   E. Saved filters per user: save, apply link, delete (ownership).
//   F. Exports: CSV (no BLOB content), XLSX (exceljs), PDF report for one task
//      (+ employee 403 on a foreign task).
//   G. Employee role scoping on the page + CSV export.
//
// Usage (from the app directory):
//   QC_DATABASE_PATH=$(pwd)/db/e2e_search.db node scripts/init-db.mjs
//   QC_DATABASE_PATH=$(pwd)/db/e2e_search.db PORT=4397 node dist/server/entry.mjs &
//   QC_DATABASE_PATH=$(pwd)/db/e2e_search.db BASE_URL=http://localhost:4397 node scripts/e2e-task-search.mjs

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4397';
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DATABASE_PATH is required (must match the server database).');
  process.exit(1);
}
const PASS = 'admin123';

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
const all = (sql, ...p) => db.prepare(sql).all(...p);

// ── date helpers ──
const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function isoDaysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localIso(d);
}
/** UTC timestamp n days ago at noon (TZ-shift safe for date-range filters). */
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

function toParams(fields) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) for (const item of v) p.append(k, String(item));
    else if (v !== undefined && v !== null) p.append(k, String(v));
  }
  return p;
}

/** POST a form and return the raw response (no redirect following). */
function postForm(ctx, url, fields) {
  return ctx.request.post(url, {
    data: toParams(fields).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE },
    maxRedirects: 0,
  });
}

// ─────────────────────────── Fixtures ───────────────────────────
// 8 tasks covering every filter + text-search surface.
function insertTask({ title, description = null, blocker = null, status = 'not_started', priority = 'medium', dept = 'QC', assigned = null, createdBy, due = null, createdDaysAgo = 5, completedAt = null, completedBy = null, recurrence = 'none' }) {
  const res = db
    .prepare(
      `INSERT INTO tasks (title, description, blocker_note, status, priority, department,
                          created_by, assigned_to, due_date, created_at, completed_at,
                          completed_by, recurrence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      title,
      description,
      blocker,
      status,
      priority,
      dept,
      createdBy,
      assigned,
      due,
      utcDaysAgo(createdDaysAgo),
      completedAt,
      completedBy,
      recurrence,
    );
  return Number(res.lastInsertRowid);
}

const fixtures = {};

fixtures.T1 = insertTask({
  title: 'Search Alpha calibration',
  description: 'ZATCA gauge calibration for the Lab',
  status: 'in_progress',
  priority: 'urgent',
  dept: 'Lab',
  assigned: emp.id,
  createdBy: mgr.id,
  due: isoDaysFromToday(5),
  createdDaysAgo: 30,
});
fixtures.T2 = insertTask({
  title: 'Search Bravo report',
  description: 'Weekly QC summary',
  blocker: 'Waiting for client approval',
  status: 'on_hold',
  priority: 'high',
  dept: 'QC',
  assigned: emp.id,
  createdBy: sup.id,
  due: isoDaysFromToday(-2),
  createdDaysAgo: 25,
  recurrence: 'weekly',
});
fixtures.T3 = insertTask({
  title: 'Search Charlie deploy',
  description: 'Deploy QC dashboard to production',
  status: 'completed',
  priority: 'medium',
  dept: 'Lab',
  assigned: emp.id,
  createdBy: mgr.id,
  due: isoDaysFromToday(-10),
  createdDaysAgo: 20,
  completedAt: utcDaysAgo(10),
  completedBy: emp.id,
});
fixtures.T4 = insertTask({
  title: 'Search Delta install',
  description: 'Install lab instruments',
  status: 'completed',
  priority: 'low',
  dept: 'QC',
  assigned: emp.id,
  createdBy: mgr.id,
  due: isoDaysFromToday(-8),
  createdDaysAgo: 15,
  completedAt: utcDaysAgo(5),
  completedBy: emp.id,
});
fixtures.T5 = insertTask({
  title: 'Search Echo audit',
  description: 'Monthly compliance audit',
  status: 'not_started',
  priority: 'medium',
  dept: 'Lab',
  createdBy: mgr.id,
  due: isoDaysFromToday(3),
  createdDaysAgo: 10,
  recurrence: 'monthly',
});
fixtures.T6 = insertTask({
  title: 'Search Foxtrot review',
  description: 'Review the Foxtrot integration',
  status: 'in_progress',
  priority: 'medium',
  dept: 'QC',
  assigned: emp.id,
  createdBy: mgr.id,
  due: isoDaysFromToday(1),
  createdDaysAgo: 8,
});
fixtures.T7 = insertTask({
  title: 'Search Golf cleanup',
  description: 'Cleanup temp files',
  status: 'not_started',
  priority: 'high',
  dept: 'Lab',
  assigned: emp.id,
  createdBy: mgr.id,
  due: isoDaysFromToday(7),
  createdDaysAgo: 5,
});
fixtures.T8 = insertTask({
  title: 'Search Hotel legacy',
  description: 'Legacy task by admin',
  status: 'cancelled',
  priority: 'medium',
  dept: 'QC',
  createdBy: adm.id,
  due: isoDaysFromToday(-4),
  createdDaysAgo: 2,
});

// Five unassigned filler tasks (manager-created, future due) so the fixture
// set has 13 tasks total — enough to exercise real pagination at per=10 while
// staying OUTSIDE every filtered assertion above (unassigned → invisible to
// the employee; future due / recent created → outside all date ranges).
for (let i = 1; i <= 5; i += 1) {
  insertTask({
    title: `Search India filler ${i}`,
    description: 'Bulk filler for pagination',
    status: 'not_started',
    priority: 'medium',
    dept: 'QC',
    createdBy: mgr.id,
    due: isoDaysFromToday(30),
    createdDaysAgo: 1,
  });
}

// Supporting rows: completion comment + evidence (T3), comment (T6),
// evidence_skipped (T4), pending delete request (T7).
db.prepare(
  `INSERT INTO task_comments (task_id, user_id, comment, is_completion_comment, created_at)
   VALUES (?, ?, ?, 1, ?)`,
).run(fixtures.T3, emp.id, 'Deploy verified and signed off', utcDaysAgo(10));
const pdfBuf = Buffer.from('%PDF-1.4 minimal fake evidence body');
db.prepare(
  `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_size, file_data, is_evidence)
   VALUES (?, ?, 'evidence-report.pdf', 'application/pdf', ?, ?, 1)`,
).run(fixtures.T3, emp.id, pdfBuf.length, pdfBuf);
db.prepare(
  `INSERT INTO task_activity_log (task_id, user_id, action, new_value, created_at)
   VALUES (?, ?, 'evidence_uploaded', 'evidence-report.pdf', ?)`,
).run(fixtures.T3, emp.id, utcDaysAgo(10));

db.prepare(
  `INSERT INTO task_comments (task_id, user_id, comment, is_completion_comment, created_at)
   VALUES (?, ?, ?, 0, ?)`,
).run(fixtures.T6, mgr.id, 'Please review the Foxtrot draft before Friday', utcDaysAgo(7));

db.prepare(
  `INSERT INTO task_activity_log (task_id, user_id, action, new_value, created_at)
   VALUES (?, ?, 'evidence_skipped', NULL, ?)`,
).run(fixtures.T4, emp.id, utcDaysAgo(5));

db.prepare(
  `INSERT INTO task_delete_requests (task_id, requested_by, reason, status, created_at)
   VALUES (?, ?, 'No longer needed', 'pending', ?)`,
).run(fixtures.T7, emp.id, utcDaysAgo(4));

ok(q('SELECT COUNT(*) AS n FROM tasks').n === 13, 'fixtures: 13 tasks created (8 themed + 5 pagination fillers)');

console.log(`\n▶ E2E advanced task search — ${BASE}\n`);

try {
  // ─────────────────── A. Page surface ───────────────────
  console.log('── Scenario A: /search page renders with all affordances ──');
  const anon = await browser.newPage();
  await anon.goto(`${BASE}/search`);
  ok(anon.url().includes('/login'), 'A. anonymous /search redirects to login');
  await anon.close();

  const mgrCtx = await browser.newContext();
  const mgrPage = await mgrCtx.newPage();
  await login(mgrPage, 'manager');
  await mgrPage.goto(`${BASE}/search`);
  ok((await mgrPage.locator('h1:has-text("Search tasks")').count()) === 1, 'A. search page renders');
  ok((await mgrPage.locator('text=13 tasks found').count()) === 1, 'A. unfiltered search counts all 13 tasks');
  ok((await mgrPage.locator('a[href^="/api/export/search.csv"]').count()) === 1, 'A. CSV export link present');
  ok((await mgrPage.locator('a[href^="/api/export/search.xlsx"]').count()) === 1, 'A. XLSX export link present');
  ok((await mgrPage.locator('a[href="/search"]:has-text("Reset filters")').count()) === 1, 'A. reset-filters button present');
  ok((await mgrPage.locator('nav a[href="/search"]').count()) === 1, 'A. navbar has the Search link');
  ok((await mgrPage.locator('tbody tr').count()) === 13, 'A. all 13 rows rendered');

  // ─────────────────── B. Free-text search ───────────────────
  console.log('\n── Scenario B: text search across title/description/blocker/comments ──');
  const titlesFor = async (qs) => {
    await mgrPage.goto(`${BASE}/search?${qs}`);
    return mgrPage.locator('tbody tr td:nth-child(2) a').allInnerTexts();
  };
  ok((await titlesFor('q=ZATCA')).join() === 'Search Alpha calibration', 'B. description match (ZATCA)');
  ok((await titlesFor('q=approval')).join() === 'Search Bravo report', 'B. blocker_note match (approval)');
  ok((await titlesFor('q=Foxtrot')).join() === 'Search Foxtrot review', 'B. comments match (Foxtrot)');
  ok((await titlesFor('q=Alpha')).join() === 'Search Alpha calibration', 'B. title match');
  ok((await titlesFor('q=draft')).join() === 'Search Foxtrot review', 'B. comment match (draft)');
  ok((await titlesFor('q=5%25')).length === 0, 'B. literal % is escaped (no false positives)');
  ok((await titlesFor('q=zzzz-nonexistent')).length === 0, 'B. no match → empty state');

  // ─────────────────── C. Every filter ───────────────────
  console.log('\n── Scenario C: each filter narrows correctly ──');
  ok((await titlesFor('status=on_hold')).join() === 'Search Bravo report', 'C. status filter (on_hold)');
  ok((await titlesFor('status=cancelled')).join() === 'Search Hotel legacy', 'C. status filter (cancelled)');
  ok((await titlesFor('priority=urgent')).join() === 'Search Alpha calibration', 'C. priority filter (urgent)');
  const labTitles = (await titlesFor('department=Lab')).sort();
  ok(
    labTitles.join('|') === 'Search Alpha calibration|Search Charlie deploy|Search Echo audit|Search Golf cleanup',
    'C. department filter (Lab)',
  );
  const empAssigned = (await titlesFor(`assigned=${emp.id}`)).sort();
  ok(
    empAssigned.length === 6 && !empAssigned.includes('Search Echo audit') && !empAssigned.includes('Search Hotel legacy'),
    'C. assigned filter → only employee-assigned tasks',
  );
  ok((await titlesFor(`creator=${sup.id}`)).join() === 'Search Bravo report', 'C. creator filter (supervisor)');
  ok((await titlesFor(`creator=${adm.id}`)).join() === 'Search Hotel legacy', 'C. creator filter (admin)');
  ok((await titlesFor('due_from=' + isoDaysFromToday(-11) + '&due_to=' + isoDaysFromToday(-9))).join() === 'Search Charlie deploy', 'C. due-date range');
  ok((await titlesFor('created_from=' + isoDaysFromToday(-29) + '&created_to=' + isoDaysFromToday(-21))).join() === 'Search Bravo report', 'C. created-date range');
  ok((await titlesFor('completed_from=' + isoDaysFromToday(-11) + '&completed_to=' + isoDaysFromToday(-9))).join() === 'Search Charlie deploy', 'C. completed-date range');
  ok((await titlesFor('completed_from=' + isoDaysFromToday(-6) + '&completed_to=' + isoDaysFromToday(-4))).join() === 'Search Delta install', 'C. completed-date range (T4)');
  ok((await titlesFor('overdue=1')).join() === 'Search Bravo report', 'C. overdue only (excludes completed/cancelled)');
  ok((await titlesFor('has_evidence=1')).join() === 'Search Charlie deploy', 'C. has evidence');
  ok((await titlesFor('evidence_skipped=1')).join() === 'Search Delta install', 'C. evidence skipped');
  ok((await titlesFor('recurrence=weekly')).join() === 'Search Bravo report', 'C. recurrence weekly');
  ok((await titlesFor('recurrence=monthly')).join() === 'Search Echo audit', 'C. recurrence monthly');
  ok((await titlesFor('deletion=1')).join() === 'Search Golf cleanup', 'C. deletion requested (pending)');
  ok(
    (await titlesFor('status=completed&has_evidence=1')).join() === 'Search Charlie deploy',
    'C. combined status+has_evidence',
  );
  ok(
    (await titlesFor('status=completed&evidence_skipped=1')).join() === 'Search Delta install',
    'C. combined status+evidence_skipped',
  );

  // ─────────────────── D. Pagination + sorting ───────────────────
  console.log('\n── Scenario D: pagination + sorting preserve state in the URL ──');
  await mgrPage.goto(`${BASE}/search?per=10`);
  ok((await mgrPage.locator('tbody tr').count()) === 10, 'D. per=10 → 10 rows on page 1');
  ok((await mgrPage.locator('text=Page 1 of 2').count()) === 1, 'D. pagination footer shows 1 of 2');
  await mgrPage.click('a:has-text("Next")');
  ok(mgrPage.url().includes('page=2'), 'D. Next link preserves filters + bumps page in URL');
  ok((await mgrPage.locator('tbody tr').count()) === 3, 'D. page 2 shows the remaining 3 rows');
  await mgrPage.goto(`${BASE}/search?per=10&sort=id&dir=asc`);
  const firstIdAsc = await mgrPage.locator('tbody tr td:first-child').first().innerText();
  ok(Number(firstIdAsc) === Math.min(...Object.values(fixtures)), 'D. sort=id asc → smallest id first');
  await mgrPage.goto(`${BASE}/search?sort=due_date&dir=asc`);
  const firstDueAsc = await mgrPage.locator('tbody tr td:nth-child(2) a').first().innerText();
  ok(firstDueAsc === 'Search Charlie deploy', 'D. sort=due_date asc → earliest due first');
  // Assignee sorting must render (regression: the sort SQL once referenced a
  // non-existent alias and 500'd). desc → assigned rows first, id DESC tiebreak.
  await mgrPage.goto(`${BASE}/search?sort=assignee&dir=desc`);
  ok((await mgrPage.locator('tbody tr').count()) === 13, 'D. sort=assignee renders all rows (no 500)');
  const firstAssigned = await mgrPage.locator('tbody tr td:nth-child(2) a').first().innerText();
  ok(firstAssigned === 'Search Golf cleanup', 'D. sort=assignee desc → assigned rows first (id tiebreak)');

  // ─────────────────── E. Saved filters ───────────────────
  console.log('\n── Scenario E: saved filters per user (save / apply / delete) ──');
  const saveRes = await postForm(mgrCtx, `${BASE}/api/filters`, {
    action: 'save',
    name: 'Completed only',
    filter_json: '{"status":"completed"}',
    next: '/search?status=completed',
  });
  ok(saveRes.status() === 302, 'E. save-filter POST redirects');
  const saved = q("SELECT id, name, filter_json FROM saved_filters WHERE user_id = ? AND name = 'Completed only'", mgr.id);
  ok(!!saved && saved.filter_json === '{"status":"completed"}', 'E. filter row persisted with the JSON');
  await mgrPage.goto(`${BASE}/search`);
  // Scoped locator: the save-redirect flash ALSO says "Completed only", so
  // scope to the saved-filters panel to count exactly one card.
  ok(
    (await mgrPage.locator('section[aria-label="Saved filters"] a:has-text("Completed only")').count()) === 1,
    'E. saved filter listed on the page',
  );
  const applyHref = await mgrPage.locator('section[aria-label="Saved filters"] a[href="/search?status=completed"]').getAttribute('href');
  ok(applyHref === '/search?status=completed', 'E. Apply link rebuilds the exact search URL');
  await mgrPage.goto(`${BASE}/search?status=completed`);
  ok((await mgrPage.locator('a[href*="export/search.csv?status=completed"]').count()) === 1, 'E. export links carry the current filter state');
  // Ownership: another user cannot delete it even with a valid id.
  const empCtx = await browser.newContext();
  const empPage = await empCtx.newPage();
  await login(empPage, 'employee');
  const steal = await postForm(empCtx, `${BASE}/api/filters`, { action: 'delete', filter_id: String(saved.id), next: '/search' });
  ok(steal.status() === 302 && !!q('SELECT 1 FROM saved_filters WHERE id = ?', saved.id), 'E. foreign delete is a harmless no-op');

  const delRes = await postForm(mgrCtx, `${BASE}/api/filters`, {
    action: 'delete',
    filter_id: String(saved.id),
    next: '/search',
  });
  ok(delRes.status() === 302, 'E. delete-filter POST redirects');
  ok(!q('SELECT 1 FROM saved_filters WHERE id = ?', saved.id), 'E. owner can delete the filter row');

  // ─────────────────── F. Exports ───────────────────
  console.log('\n── Scenario F: CSV / XLSX / PDF exports ──');
  const csvRes = await mgrCtx.request.get(`${BASE}/api/export/search.csv?status=completed`);
  ok(csvRes.status() === 200, 'F. CSV export 200');
  const csvBody = await csvRes.text();
  ok(csvBody.startsWith('\uFEFF'), 'F. CSV has UTF-8 BOM');
  ok(csvBody.includes('ID,Title,Description,Status,Priority'), 'F. CSV headers present');
  ok(csvBody.includes('Search Charlie deploy') && csvBody.includes('Search Delta install'), 'F. CSV contains both completed tasks');
  ok(!csvBody.includes('Search Alpha calibration'), 'F. CSV scoped to the filters (no in_progress row)');
  ok(csvBody.includes('evidence-report.pdf'), 'F. CSV carries evidence file NAMES');
  ok(!csvBody.includes('file_data'), 'F. CSV never exposes BLOB content');
  ok(csvBody.trim().split('\n').length === 3, 'F. CSV has exactly header + 2 rows');

  const xlsxRes = await mgrCtx.request.get(`${BASE}/api/export/search.xlsx?status=completed`);
  ok(xlsxRes.status() === 200, 'F. XLSX export 200');
  ok((xlsxRes.headers()['content-type'] ?? '').includes('spreadsheetml.sheet'), 'F. XLSX content-type is the OOXML sheet');
  const xlsxBuf = Buffer.from(await xlsxRes.body());
  ok(xlsxBuf.length > 1000, 'F. XLSX payload is a real file');
  ok(xlsxBuf.toString('latin1', 0, 2) === 'PK', 'F. XLSX is a ZIP container (PK magic)');
  ok(!xlsxBuf.toString('latin1').includes('file_data'), 'F. XLSX never exposes BLOB content');
  // The sheet XML is DEFLATE-compressed inside the zip, so the honest content
  // check is a round-trip through exceljs itself (also proves a real XLSX
  // parser can load the file).
  const xlsxMod = await import('exceljs');
  const XLSX = xlsxMod.default ?? xlsxMod;
  const wb = new XLSX.Workbook();
  await wb.xlsx.load(xlsxBuf);
  const ws = wb.getWorksheet('Tasks');
  ok(ws && ws.rowCount === 3, 'F. XLSX round-trip: header + 2 data rows');
  const cellValues = [];
  ws.eachRow((row) => row.eachCell((cell) => cellValues.push(cell.value)));
  ok(
    cellValues.includes('Search Charlie deploy') &&
      cellValues.includes('Search Delta install') &&
      cellValues.includes('evidence-report.pdf'),
    'F. XLSX round-trip contains the filtered rows + evidence names',
  );
  ok(!cellValues.includes('Search Alpha calibration'), 'F. XLSX round-trip respects the filters');

  const pdfRes = await mgrCtx.request.get(`${BASE}/api/export/tasks/pdf/${fixtures.T3}`);
  ok(pdfRes.status() === 200, 'F. task PDF export 200');
  ok((pdfRes.headers()['content-type'] ?? '').includes('application/pdf'), 'F. PDF content-type');
  const pdfText = Buffer.from(await pdfRes.body()).toString('latin1');
  ok(pdfText.startsWith('%PDF-1.4'), 'F. PDF header');
  ok(pdfText.includes('Search Charlie deploy'), 'F. PDF has the task title');
  ok(pdfText.includes('Completed') && pdfText.includes('Deploy verified and signed off'), 'F. PDF has completion details + comment');
  ok(pdfText.includes('evidence-report.pdf'), 'F. PDF lists evidence file names');
  ok(pdfText.includes('Generated:'), 'F. PDF has the generated date');
  ok(pdfText.trimEnd().endsWith('%%EOF'), 'F. PDF EOF marker');

  // Employee PDF of a foreign task (T8: created by admin, unassigned) → 403.
  const foreignPdf = await empCtx.request.get(`${BASE}/api/export/tasks/pdf/${fixtures.T8}`);
  ok(foreignPdf.status() === 403, 'F. employee gets 403 for a foreign task PDF');

  // ─────────────────── G. Employee role scoping ───────────────────
  console.log('\n── Scenario G: employees only see/export their own tasks ──');
  await empPage.goto(`${BASE}/search`);
  ok((await empPage.locator('text=6 tasks found').count()) === 1, 'G. employee sees only their 6 tasks');
  ok((await empPage.locator('tbody tr').count()) === 6, 'G. employee table has 6 rows');
  ok((await empPage.locator('text=Search Echo audit').count()) === 0, 'G. unassigned task hidden from employee');
  ok((await empPage.locator('text=Search Hotel legacy').count()) === 0, 'G. admin-created task hidden from employee');
  await empPage.goto(`${BASE}/search?q=ZATCA`);
  ok((await empPage.locator('tbody tr').count()) === 1, 'G. employee text search still scoped');
  const empCsv = await empCtx.request.get(`${BASE}/api/export/search.csv`);
  const empCsvBody = await empCsv.text();
  ok(
    empCsvBody.trim().split('\n').length === 7 &&
      !empCsvBody.includes('Search Echo audit') &&
      !empCsvBody.includes('Search Hotel legacy'),
    'G. employee CSV export scoped to their tasks',
  );
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  // ── cleanup: fixture rows (children cascade), saved filters, notifications, sessions ──
  const ids = all("SELECT id FROM tasks WHERE title LIKE 'Search %'").map((t) => t.id);
  if (ids.length > 0) {
    db.prepare(`DELETE FROM tasks WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
  }
  db.prepare('DELETE FROM saved_filters').run();
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM sessions').run();
  db.prepare('DELETE FROM login_attempts').run();
  db.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
