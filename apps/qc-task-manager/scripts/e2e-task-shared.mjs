// E2E spec for SHARED TASK CREATION + EDITING (the full task model).
//
// Covers, against a LIVE server sharing the same SQLite database:
//   1. Manager creates a task with EVERY field (department, urgent priority,
//      recurrence + end date, checklist items, dependencies) — task row,
//      checklists, dependency edge, activity log entries, and the assignee
//      notification all land in the DB.
//   2. Supervisor may only assign to active QC employees (server-enforced).
//   3. Employees create only with can_create_tasks = 1; self-assign only.
//   4. Employee-created tasks keep business fields LOCKED after creation.
//   5. Dependency gate: cannot move to In Progress while a dependency is
//      incomplete; admin/manager may override only with a logged reason.
//   6. Notifications: assignment, due-date change, priority change.
//   7. Recurring: next occurrence created on completion (within the end date,
//      inclusive), checklist copied, NOT comments/evidence; series STOPS past
//      the end date; creation recorded in the activity log.
//   8. Urgent tasks are visually prominent (badge + row highlight).
//
// The database must already exist (run `pnpm db:init` on the temp path first)
// and the server must be running on the same database. The script logs in via
// real browser sessions (CSRF-safe) and uses API requests for JSON endpoints.

import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const BASE = process.env.BASE_URL ?? 'http://localhost:4390';
const DB_PATH = process.env.QC_DB_PATH;
if (!DB_PATH) {
  console.error('❌ QC_DB_PATH is required (must match the server database).');
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
function eq(actual, expected, label) {
  ok(JSON.stringify(actual) === JSON.stringify(expected), `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

// ── DB helpers ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const q = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const userByName = (name) => q('SELECT id, username, role, can_create_tasks FROM users WHERE username = ?', name);

// ── date helpers (local calendar days) ──
const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const now = new Date();
function isoDaysFromToday(n) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() + n);
  return localIso(d);
}

const browser = await chromium.launch({ headless: true });
const mgr = userByName('manager');
const sup = userByName('supervisor');
const emp = userByName('employee');
const adm = userByName('admin');
ok(!!mgr && !!sup && !!emp && !!adm, 'seeded roles exist');

// An employee WITH can_create_tasks (the base-seed employee has it OFF).
db.prepare(
  `INSERT OR IGNORE INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
   SELECT 'emp_create', password_hash, 'Create-Ready Employee', 'employee', 'QC', 1, 1
   FROM users WHERE username = 'employee' LIMIT 1`,
).run();
const empCreate = userByName('emp_create');
ok(!!empCreate && Number(empCreate.can_create_tasks) === 1, 'fixture: emp_create with can_create_tasks=1');

async function login(page, username) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', PASS);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

/**
 * URLSearchParams builder that repeats array values (checklist[],
 * dependencies[]) as real repeated form keys — Playwright's `form` option does
 * not serialize arrays reliably, so create-POSTs use this explicitly.
 */
function toParams(fields) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) {
      for (const item of v) p.append(k, String(item));
    } else if (v !== undefined && v !== null) {
      p.append(k, String(v));
    }
  }
  return p;
}

/** POST a form to a page path (the middleware handles it) and return the response. */
function postForm(ctx, url, fields) {
  return ctx.request.post(url, {
    data: toParams(fields).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE },
    maxRedirects: 0,
  });
}

console.log(`\n▶ E2E shared task creation/editing — ${BASE}\n`);

try {
  // ─────────────────── 1. Manager creates a full task ───────────────────
  console.log('── Scenario 1: manager creates a task with every field ──');
  const mgrCtx = await browser.newContext();
  const mgrPage = await mgrCtx.newPage();
  await login(mgrPage, 'manager');

  // Fixture: an existing task to depend on.
  const depFixture = db
    .prepare(
      `INSERT INTO tasks (title, description, status, priority, created_by, due_date) VALUES (?, ?, 'not_started', 'medium', ?, ?)`,
    )
    .run('E2E dependency fixture', 'fixture', mgr.id, isoDaysFromToday(3));
  const depFixtureId = Number(depFixture.lastInsertRowid);
  db.prepare(
    `INSERT INTO task_activity_log (task_id, user_id, action, new_value) VALUES (?, ?, 'task_created', ?)`,
  ).run(depFixtureId, mgr.id, 'E2E dependency fixture');

  const due = isoDaysFromToday(5);
  const end = isoDaysFromToday(40);
  const createRes = await postForm(mgrCtx, `${BASE}/manager/new`, {
    title: 'E2E Full Task',
    description: 'E2E description with every field set',
    department: 'Lab',
    priority: 'urgent',
    assigned_to: String(emp.id),
    due_date: due,
    recurrence: 'weekly',
    recurrence_end_date: end,
    checklist: ['Prep sample', 'Run analysis'],
    dependencies: [String(depFixtureId)],
  });
  ok(createRes.status() === 302, `1. POST /manager/new redirects (got ${createRes.status()})`);
  const full = q("SELECT * FROM tasks WHERE title = 'E2E Full Task'");
  ok(!!full, '1. task row exists');
  if (full) {
    eq(full.department, 'Lab', '1. department stored');
    eq(full.priority, 'urgent', '1. urgent priority stored');
    eq(full.recurrence, 'weekly', '1. recurrence stored');
    eq(full.recurrence_end_date, end, '1. recurrence end date stored');
    eq(full.assigned_to, emp.id, '1. assignee stored');
    eq(full.due_date, due, '1. due date stored');
    eq(full.created_by, mgr.id, '1. created_by stored');
    ok(!!full.created_at, '1. created_at stored');
    eq(full.status, 'not_started', '1. starts not_started');
  }
  const checks = all('SELECT title, is_completed FROM task_checklists WHERE task_id = ? ORDER BY sort_order', full.id);
  eq(checks.map((c) => [c.title, Number(c.is_completed)]), [['Prep sample', 0], ['Run analysis', 0]], '1. checklist template stored unchecked');
  const deps = all('SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?', full.id);
  eq(deps.map((d) => d.depends_on_task_id), [depFixtureId], '1. dependency edge stored');
  const acts = all('SELECT action, new_value FROM task_activity_log WHERE task_id = ? ORDER BY id', full.id);
  const actKinds = acts.map((a) => a.action);
  ok(actKinds.includes('task_created'), '1. task_created logged');
  ok(actKinds.filter((a) => a === 'checklist_item_added').length === 2, '1. checklist_item_added ×2 logged');
  ok(actKinds.includes('dependency_added'), '1. dependency_added logged');
  const notif = q("SELECT * FROM notifications WHERE user_id = ? AND type = 'assigned' AND task_id = ?", emp.id, full.id);
  ok(!!notif, '1. assignment notification created for the assignee');
  if (notif) ok(notif.title === 'New task assigned to you', '1. assignment notification title');

  // Urgent prominence: task page badge is the solid red pill + manager list highlights the row.
  const taskPage = await mgrPage.goto(`${BASE}/tasks/${full.id}`);
  ok(taskPage.status() === 200, '1. task page renders');
  const badge = mgrPage.locator('span:has-text("Urgent")').first();
  const badgeCls = (await badge.getAttribute('class')) ?? '';
  ok(badgeCls.includes('bg-red-600'), `1. urgent badge is solid red (${badgeCls})`);
  await mgrPage.goto(`${BASE}/manager`);
  const row = mgrPage.locator('tr', { hasText: 'E2E Full Task' });
  const rowCls = (await row.getAttribute('class')) ?? '';
  ok(rowCls.includes('bg-red-50'), `1. urgent row highlighted in the list (${rowCls})`);
  ok((await mgrPage.locator('tr:has-text("E2E Full Task") span[title="Recurring task"]').count()) === 1, '1. 🔁 recurrence marker in the list');
  ok((await mgrPage.locator('text=E2E Full Task').count()) >= 1, '1. task visible in manager list');

  // ─────────────────── 2. Supervisor assignment scope ───────────────────
  console.log('\n── Scenario 2: supervisor assigns only to active QC employees ──');
  const supCtx = await browser.newContext();
  const supPage = await supCtx.newPage();
  await login(supPage, 'supervisor');

  const bad = await postForm(supCtx, `${BASE}/supervisor/new`, {
    title: 'E2E Sup Bad',
    assigned_to: String(mgr.id),
    priority: 'medium',
  });
  ok(bad.status() === 302, '2. supervisor → non-employee assignee redirects');
  await supPage.goto(`${BASE}/supervisor`);
  ok((await supPage.locator('text=Supervisors can only assign tasks to QC employees').count()) === 1, '2. flash explains the QC-employee-only rule');
  ok(!q("SELECT 1 FROM tasks WHERE title = 'E2E Sup Bad'"), '2. rejected task was NOT created');

  const goodDue = isoDaysFromToday(7);
  const good = await postForm(supCtx, `${BASE}/supervisor/new`, {
    title: 'E2E Sup Good',
    assigned_to: String(emp.id),
    priority: 'high',
    department: 'QC',
    due_date: goodDue,
  });
  ok(good.status() === 302, '2. supervisor → employee assignee succeeds');
  const supTask = q("SELECT * FROM tasks WHERE title = 'E2E Sup Good'");
  ok(!!supTask && supTask.assigned_to === emp.id, '2. task created and assigned to the employee');

  // ─────────────────── 3. Employee creation gating ───────────────────
  console.log('\n── Scenario 3: employees create only with can_create_tasks = 1 ──');
  const empCtx = await browser.newContext();
  const empPage = await empCtx.newPage();
  await login(empPage, 'employee'); // can_create_tasks = 0
  const denied = await postForm(empCtx, `${BASE}/employee/new`, { title: 'E2E Emp Denied' });
  ok(denied.status() === 302, '3. employee without can_create_tasks is redirected');
  await empPage.goto(`${BASE}/employee`);
  ok((await empPage.locator('text=You do not have permission to create tasks').count()) === 1, '3. flash explains the permission gate');
  ok(!q("SELECT 1 FROM tasks WHERE title = 'E2E Emp Denied'"), '3. no task was created');

  const empCtx2 = await browser.newContext();
  const empPage2 = await empCtx2.newPage();
  await login(empPage2, 'emp_create'); // can_create_tasks = 1
  const selfOk = await postForm(empCtx2, `${BASE}/employee/new`, {
    title: 'E2E Emp Own Task',
    priority: 'medium',
    assigned_to: String(empCreate.id),
    due_date: isoDaysFromToday(4),
    recurrence: 'none',
    checklist: ['Step one'],
  });
  ok(selfOk.status() === 302, '3. employee with can_create_tasks creates a task');
  const empTask = q("SELECT * FROM tasks WHERE title = 'E2E Emp Own Task'");
  ok(!!empTask && empTask.assigned_to === empCreate.id && empTask.created_by === empCreate.id, '3. employee task assigned to self');
  const empChecks = all('SELECT id, title FROM task_checklists WHERE task_id = ?', empTask.id);
  eq(empChecks.map((c) => c.title), ['Step one'], '3. employee checklist stored');

  const selfWrong = await postForm(empCtx2, `${BASE}/employee/new`, {
    title: 'E2E Emp Wrong',
    assigned_to: String(emp.id),
  });
  await empPage2.goto(`${BASE}/employee`);
  ok(selfWrong.status() === 302 && (await empPage2.locator('text=Employees can only assign tasks to themselves').count()) === 1, '3. employee cannot assign to someone else');
  ok(!q("SELECT 1 FROM tasks WHERE title = 'E2E Emp Wrong'"), '3. cross-assignment rejected');

  // ─────────────────── 4. Employee-created tasks keep locked fields ───────────────────
  console.log('\n── Scenario 4: employee-created tasks keep business fields locked ──');
  const lockRes = await empCtx2.request.post(`${BASE}/api/tasks/${empTask.id}/update`, {
    form: { title: 'E2E Emp Hacked Title', status: empTask.status },
    headers: { Origin: BASE },
  });
  const lockJson = await lockRes.json();
  ok(lockRes.status() === 400 && /do not have permission to edit "title"/.test(lockJson.error ?? ''), `4. employee cannot edit title after creation (${lockJson.error})`);
  const unchanged = q('SELECT title FROM tasks WHERE id = ?', empTask.id);
  eq(unchanged.title, 'E2E Emp Own Task', '4. title unchanged in the DB');
  // ...but the employee CAN toggle their own checklist item.
  const empCheckId = empChecks[0].id;
  const toggle = await empCtx2.request.post(`${BASE}/api/tasks/${empTask.id}/update`, {
    form: { checklist_toggle: String(empCheckId) },
    headers: { Origin: BASE },
  });
  ok(toggle.status() === 200, '4. employee toggles their checklist item');
  const toggled = q('SELECT is_completed, completed_by FROM task_checklists WHERE id = ?', empCheckId);
  eq(Number(toggled.is_completed), 1, '4. checklist item marked done');
  eq(toggled.completed_by, empCreate.id, '4. checklist completion attributed');

  // ─────────────────── 5. Dependency gate + override ───────────────────
  console.log('\n── Scenario 5: dependency blocking + logged override ──');
  const depA = q("SELECT id FROM tasks WHERE title = 'E2E dependency fixture'");
  const depBRes = await postForm(mgrCtx, `${BASE}/manager/new`, {
    title: 'E2E Dep B',
    assigned_to: String(emp.id),
    dependencies: [String(depA.id)],
    priority: 'medium',
  });
  ok(depBRes.status() === 302, '5. task B created with a dependency');
  const depB = q("SELECT * FROM tasks WHERE title = 'E2E Dep B'");

  await empPage.goto(`${BASE}/tasks/${depB.id}`);
  ok((await empPage.locator('[data-blocking-dependencies]').count()) === 1, '5. blocking-dependencies callout shown on the page');
  ok((await empPage.locator('[data-blocking-dependencies] a:has-text("E2E dependency fixture")').count()) === 1, '5. callout links the blocking task');

  const empBlock = await empCtx.request.post(`${BASE}/api/tasks/${depB.id}/update`, {
    form: { status: 'in_progress', progress_percent: '10' },
    headers: { Origin: BASE },
  });
  const empBlockJson = await empBlock.json();
  ok(empBlock.status() === 400 && /blocked by incomplete dependencies/.test(empBlockJson.error ?? ''), `5. employee cannot start a blocked task (${empBlockJson.error})`);

  const mgrNoReason = await mgrCtx.request.post(`${BASE}/api/tasks/${depB.id}/update`, {
    form: { status: 'in_progress' },
    headers: { Origin: BASE },
  });
  const noReasonJson = await mgrNoReason.json();
  ok(mgrNoReason.status() === 400 && /explicit reason is required/.test(noReasonJson.error ?? ''), `5. manager override without a reason is rejected (${noReasonJson.error})`);

  const mgrOverride = await mgrCtx.request.post(`${BASE}/api/tasks/${depB.id}/update`, {
    form: { status: 'in_progress', dependency_override_reason: 'Customer deadline — risk accepted' },
    headers: { Origin: BASE },
  });
  ok(mgrOverride.status() === 200, '5. manager override with a reason succeeds');
  const depBAfter = q('SELECT status FROM tasks WHERE id = ?', depB.id);
  eq(depBAfter.status, 'in_progress', '5. task moved to in_progress after override');
  const ovr = q("SELECT old_value, new_value FROM task_activity_log WHERE task_id = ? AND action = 'dependency_override'", depB.id);
  ok(!!ovr && ovr.new_value === 'Customer deadline — risk accepted', '5. override logged with the reason');
  ok(!!ovr && ovr.old_value.includes('E2E dependency fixture'), '5. override log names the blocked dependencies');
  ok((await mgrCtx.request.post(`${BASE}/api/tasks/${depB.id}/update`, { form: { status: 'in_progress' }, headers: { Origin: BASE } })).status() === 200, '5. no new override needed for an already-started task');

  // Completing the dependency unblocks a SECOND task (positive path) — and a
  // supervisor (not admin/manager) cannot override the block on it either.
  const depCRes = await postForm(mgrCtx, `${BASE}/manager/new`, {
    title: 'E2E Dep C',
    assigned_to: String(emp.id),
    dependencies: [String(depA.id)],
    priority: 'low',
  });
  const depC = q("SELECT * FROM tasks WHERE title = 'E2E Dep C'");
  const supBlock = await supCtx.request.post(`${BASE}/api/tasks/${depC.id}/update`, {
    form: { status: 'in_progress' },
    headers: { Origin: BASE },
  });
  const supBlockJson = await supBlock.json();
  ok(supBlock.status() === 400 && /blocked by incomplete dependencies/.test(supBlockJson.error ?? ''), `5. supervisor cannot override a dependency block (${supBlockJson.error})`);
  const supAfter = q('SELECT status FROM tasks WHERE id = ?', depC.id);
  eq(supAfter.status, 'not_started', '5. supervisor attempt left the task untouched');

  const closeA = await mgrCtx.request.post(`${BASE}/api/tasks/${depA.id}/close`, {
    multipart: { completion_comment: 'Fixture done', skip_evidence: '1' },
    headers: { Origin: BASE },
  });
  ok(closeA.status() === 200, '5. dependency task completed');
  const empStartC = await empCtx.request.post(`${BASE}/api/tasks/${depC.id}/update`, {
    form: { status: 'in_progress', progress_percent: '20' },
    headers: { Origin: BASE },
  });
  ok(empStartC.status() === 200, '5. employee starts the task once its dependency is completed');
  const depCAfter = q('SELECT status FROM tasks WHERE id = ?', depC.id);
  eq(depCAfter.status, 'in_progress', '5. dependent task is in_progress');

  // ─────────────────── 6. Notifications on edit ───────────────────
  console.log('\n── Scenario 6: due-date / priority changes notify the assignee ──');
  const oldDue = supTask.due_date;
  ok(oldDue === goodDue, '6. supervisor task has a due date to change');
  const newDue = isoDaysFromToday(20);
  const editRes = await supCtx.request.post(`${BASE}/api/tasks/${supTask.id}/update`, {
    form: { due_date: newDue, priority: 'urgent', status: supTask.status },
    headers: { Origin: BASE },
  });
  ok(editRes.status() === 200, '6. supervisor edits due date + priority');
  const dueNotif = q("SELECT * FROM notifications WHERE user_id = ? AND task_id = ? AND type = 'due_date_changed'", emp.id, supTask.id);
  ok(!!dueNotif, '6. due-date-change notification created');
  // The app formats dates with en-GB (short month) — mirror that here.
  const fmtDate = (iso) =>
    new Date(`${iso}T00:00:00Z`).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  if (dueNotif) ok(dueNotif.message.includes(fmtDate(oldDue)) && dueNotif.message.includes(fmtDate(newDue)), '6. notification carries old → new due date');
  const priNotif = q("SELECT * FROM notifications WHERE user_id = ? AND task_id = ? AND type = 'priority_changed'", emp.id, supTask.id);
  ok(!!priNotif, '6. priority-change notification created');

  // Notifications page renders persisted + badge counts them.
  await empPage.goto(`${BASE}/notifications`);
  ok((await empPage.locator('text=New task assigned to you').count()) >= 1, '6. assignment notification visible to assignee');
  ok((await empPage.locator('text=Task due date changed').count()) >= 1, '6. due-date notification visible');
  const bell = empPage.locator('a[aria-label^="Notifications"] span');
  const bellCount = Number(await bell.innerText());
  ok(bellCount >= 1, `6. navbar badge counts notifications (${bellCount})`);
  const markRes = await empCtx.request.post(`${BASE}/api/notifications/read-all`, {
    headers: { Origin: BASE },
  });
  ok(markRes.status() === 200, '6. mark-all-read endpoint works');
  const unread = q('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0', emp.id);
  eq(Number(unread.n), 0, '6. all notifications marked read');
  // No notification when the task has no assignee.
  const unassignedId = Number(
    db.prepare("INSERT INTO tasks (title, status, priority, created_by, due_date) VALUES (?, 'not_started', 'medium', ?, ?)")
      .run('E2E Unassigned Edit', mgr.id, isoDaysFromToday(2)).lastInsertRowid,
  );
  const noAssign = await mgrCtx.request.post(`${BASE}/api/tasks/${unassignedId}/update`, {
    form: { due_date: isoDaysFromToday(9) },
    headers: { Origin: BASE },
  });
  ok(noAssign.status() === 200, '6. editing an unassigned task succeeds');
  const noAssignNotif = q('SELECT COUNT(*) AS n FROM notifications WHERE task_id = ? AND type = ?', unassignedId, 'due_date_changed');
  eq(Number(noAssignNotif.n), 0, '6. no notification when nobody is assigned');

  // ─────────────────── 7. Recurring series ───────────────────
  console.log('\n── Scenario 7: recurring tasks spawn on completion and STOP at the end date ──');
  const rDue = isoDaysFromToday(1);
  const rEnd = isoDaysFromToday(15); // inclusive → R1(+1), R2(+8), R3(+15) allowed; R4(+22) stops
  const r1Res = await postForm(mgrCtx, `${BASE}/manager/new`, {
    title: 'E2E Weekly Roundup',
    description: 'Weekly roundup description',
    department: 'QC',
    priority: 'high',
    assigned_to: String(emp.id),
    due_date: rDue,
    recurrence: 'weekly',
    recurrence_end_date: rEnd,
    checklist: ['Send summary', 'Log hours'],
  });
  ok(r1Res.status() === 302, '7. recurring task R1 created');
  const r1 = q("SELECT * FROM tasks WHERE title = 'E2E Weekly Roundup'");

  // Completing R1 spawns R2.
  const closeR1 = await empCtx.request.post(`${BASE}/api/tasks/${r1.id}/close`, {
    multipart: { completion_comment: 'R1 done', skip_evidence: '1' },
    headers: { Origin: BASE },
  });
  ok(closeR1.status() === 200, '7. R1 completed');
  const r2 = q('SELECT * FROM tasks WHERE parent_recurring_task_id = ?', r1.id);
  ok(!!r2, '7. R2 created with parent_recurring_task_id → R1');
  if (r2) {
    eq(r2.due_date, isoDaysFromToday(8), '7. R2 due date = R1 + 7 days');
    eq(r2.recurrence, 'weekly', '7. R2 keeps the recurrence');
    eq(r2.recurrence_end_date, rEnd, '7. R2 keeps the recurrence end date');
    eq(r2.priority, 'high', '7. R2 copies priority');
    eq(r2.department, 'QC', '7. R2 copies department');
    eq(r2.assigned_to, emp.id, '7. R2 copies assignee');
    eq(r2.description, 'Weekly roundup description', '7. R2 copies description');
    eq(r2.status, 'not_started', '7. R2 starts fresh');
    eq(r2.progress_percent, 0, '7. R2 progress reset');
    ok(r2.completed_at === null, '7. R2 carries no completion metadata');
  }
  const r2Checks = all('SELECT title, is_completed FROM task_checklists WHERE task_id = ? ORDER BY sort_order', r2.id);
  eq(r2Checks.map((c) => [c.title, Number(c.is_completed)]), [['Send summary', 0], ['Log hours', 0]], '7. R2 copies the checklist TEMPLATE unchecked');
  const r2Comments = q('SELECT COUNT(*) AS n FROM task_comments WHERE task_id = ?', r2.id);
  eq(Number(r2Comments.n), 0, '7. R2 does NOT copy comments');
  const r2Attachments = q('SELECT COUNT(*) AS n FROM task_attachments WHERE task_id = ?', r2.id);
  eq(Number(r2Attachments.n), 0, '7. R2 does NOT copy evidence/attachments');
  const r1Acts = all('SELECT action FROM task_activity_log WHERE task_id = ?', r1.id);
  ok(r1Acts.some((a) => a.action === 'recurring_task_created'), '7. recurring creation logged on the parent');
  const r2Acts = all('SELECT action FROM task_activity_log WHERE task_id = ?', r2.id);
  ok(r2Acts.some((a) => a.action === 'recurring_task_created'), '7. recurring creation logged on the child');
  ok(r2Acts.some((a) => a.action === 'task_created'), '7. child has its own task_created entry');
  const recNotif = q("SELECT * FROM notifications WHERE user_id = ? AND type = 'recurring_created' AND task_id = ?", emp.id, r2.id);
  ok(!!recNotif, '7. assignee notified about the next occurrence');

  // Completing R2 spawns R3 (end date is inclusive).
  const closeR2 = await empCtx.request.post(`${BASE}/api/tasks/${r2.id}/close`, {
    multipart: { completion_comment: 'R2 done', skip_evidence: '1' },
    headers: { Origin: BASE },
  });
  ok(closeR2.status() === 200, '7. R2 completed');
  const r3 = q('SELECT * FROM tasks WHERE parent_recurring_task_id = ?', r2.id);
  ok(!!r3, '7. R3 created (end date inclusive)');
  if (r3) eq(r3.due_date, isoDaysFromToday(15), '7. R3 due date = R2 + 7 days');

  // Completing R3 must NOT spawn R4 (next due would exceed the end date).
  const closeR3 = await empCtx.request.post(`${BASE}/api/tasks/${r3.id}/close`, {
    multipart: { completion_comment: 'R3 done', skip_evidence: '1' },
    headers: { Origin: BASE },
  });
  ok(closeR3.status() === 200, '7. R3 completed');
  const r4 = q('SELECT COUNT(*) AS n FROM tasks WHERE parent_recurring_task_id = ?', r3.id);
  eq(Number(r4.n), 0, '7. series STOPS past the end date (no endless tasks)');

  // An open-ended recurring task keeps going on completion.
  const openRes = await postForm(mgrCtx, `${BASE}/manager/new`, {
    title: 'E2E Open Recurring',
    assigned_to: String(emp.id),
    due_date: isoDaysFromToday(1),
    recurrence: 'daily',
    recurrence_end_date: '',
    priority: 'medium',
  });
  const openR = q("SELECT * FROM tasks WHERE title = 'E2E Open Recurring'");
  const closeOpen = await empCtx.request.post(`${BASE}/api/tasks/${openR.id}/close`, {
    multipart: { completion_comment: 'open done', skip_evidence: '1' },
    headers: { Origin: BASE },
  });
  ok(closeOpen.status() === 200, '7. open-ended recurring task completed');
  const openNext = q('SELECT * FROM tasks WHERE parent_recurring_task_id = ?', openR.id);
  ok(!!openNext && openNext.due_date === isoDaysFromToday(2), '7. open-ended series creates the next day');

  // ─────────────────── 8. Read-only completed + cross-checks ───────────────────
  console.log('\n── Scenario 8: completed tasks stay read-only ──');
  const roRes = await mgrCtx.request.post(`${BASE}/api/tasks/${r1.id}/update`, {
    form: { title: 'E2E Hacked' },
    headers: { Origin: BASE },
  });
  const roJson = await roRes.json();
  ok(roRes.status() === 400 && /read-only for everyone/.test(roJson.error ?? ''), `8. completed task rejects edits (${roJson.error})`);
} catch (err) {
  failed += 1;
  failures.push(`unhandled error: ${err.message}`);
  console.error('❌ E2E crashed:', err);
} finally {
  // ── cleanup: fixture rows (tasks cascade to their children), notifications, sessions ──
  const e2eTasks = all("SELECT id FROM tasks WHERE title LIKE 'E2E %'");
  const ids = e2eTasks.map((t) => t.id);
  if (ids.length > 0) {
    db.prepare(`DELETE FROM tasks WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
  }
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM sessions').run();
  db.prepare("DELETE FROM users WHERE username = 'emp_create'").run();
  await browser.close();
  db.close();
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('ALL PASS ✅');
