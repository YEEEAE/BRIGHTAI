// `pnpm test` — fast, server-less checks for QC Task Manager.
//
// Two layers:
//   1. Structure compliance — every file/folder the spec requires exists.
//   2. Unit smoke — Zod validation behavior, task-policy rules, CSV escaping,
//      and a real backup round-trip on a temp database.
//
// Run via the loader so the TypeScript libs import cleanly:
//   node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test.mjs
//
// The heavy regression suites are the E2E scripts (e2e-dashboard.mjs,
// e2e-delete-request.mjs) which need a live server — see the README.

import Database from 'better-sqlite3';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import { createBackup } from '../src/lib/backup.ts';
import { parseFormData, taskCreateInputSchema, commentSchema, userCreateSchema, loginInputSchema } from '../src/lib/validation.ts';
import {
  isTaskReadOnly,
  canTransitionStatus,
  requiresBlockerNote,
  isEmployeeEditableField,
  isEmployeeLockedField,
  MAX_UPLOAD_BYTES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  isAllowedExtension,
  isEvidenceExtension,
  isRecurrence,
  EVIDENCE_EXTENSIONS,
  EVIDENCE_EXT_MIME,
  EVIDENCE_SIGNATURES,
  EVIDENCE_EXTENSIONS_HINT,
} from '../src/lib/task-policy.ts';
import { nextDueDate, shouldCreateNextOccurrence } from '../src/lib/recurrence.ts';
import { csvField, tasksToCsv } from '../src/lib/export.ts';

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── tiny harness ──
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
function section(title) {
  console.log(`\n■ ${title}`);
}

// ── 1. Structure compliance (spec tree) ──
section('Structure compliance');
const requiredPaths = [
  'db/schema.sql',
  'db/seed.sql',
  'db/backups/.gitkeep',
  'docs',
  'public',
  'src/middleware.ts',
  'src/layouts',
  'src/components',
  'src/types',
  'src/pages/login.astro',
  'src/pages/index.astro',
  'src/pages/dashboard.astro',
  'src/pages/manager',
  'src/pages/supervisor',
  'src/pages/employee',
  'src/pages/admin',
  'src/pages/tasks',
  'src/pages/notifications.astro',
  'src/pages/api',
  'src/lib/db.ts',
  'src/lib/auth.ts',
  'src/lib/permissions.ts',
  'src/lib/activity.ts',
  'src/lib/notifications.ts',
  'src/lib/task-policy.ts',
  'src/lib/validation.ts',
  'src/lib/backup.ts',
  'src/lib/export.ts',
  'astro.config.mjs',
  'package.json',
  'tsconfig.json',
  'README.md',
];
for (const p of requiredPaths) {
  ok(existsSync(resolve(APP_DIR, p)), `exists: ${p}`);
}

// ── 2. Validation (Zod) ──
section('Validation (src/lib/validation.ts)');

function form(entries) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) f.append(k, String(v));
  }
  return f;
}

// task create
let r = parseFormData(taskCreateInputSchema, form({ title: '  Calibrate gauges  ', priority: 'high', assigned_to: '', due_date: '' }));
ok(r.ok && r.data.title === 'Calibrate gauges', 'task create: trims title');
ok(r.ok && r.data.priority === 'high', 'task create: parses priority');
ok(r.ok && r.data.assigned_to === null && r.data.due_date === null, 'task create: empty optional → null');

r = parseFormData(taskCreateInputSchema, form({ title: '   ' }));
ok(!r.ok && r.error === 'Title is required.', `task create: empty title → "${r.error}"`);

r = parseFormData(taskCreateInputSchema, form({ title: 'x'.repeat(201) }));
ok(!r.ok && r.error === 'Title must be 200 characters or fewer.', 'task create: title max 200');

r = parseFormData(taskCreateInputSchema, form({ title: 't', priority: 'urgent' }));
ok(r.ok && r.data.priority === 'urgent', 'task create: urgent priority accepted');
r = parseFormData(taskCreateInputSchema, form({ title: 't', priority: 'critical' }));
ok(!r.ok && r.error === 'Invalid priority value.', 'task create: bad priority');

// department / recurrence / recurrence end date
r = parseFormData(taskCreateInputSchema, form({ title: 't' }));
ok(r.ok && r.data.department === 'QC', 'task create: missing department defaults to QC');
ok(r.ok && r.data.recurrence === 'none', 'task create: missing recurrence defaults to none');
ok(r.ok && r.data.recurrence_end_date === null, 'task create: missing recurrence end date → null');

r = parseFormData(taskCreateInputSchema, form({ title: 't', department: '  Lab  ', recurrence: 'weekly', recurrence_end_date: '2026-12-31' }));
ok(r.ok && r.data.department === 'Lab', 'task create: trims department');
ok(r.ok && r.data.recurrence === 'weekly', 'task create: weekly recurrence accepted');
ok(r.ok && r.data.recurrence_end_date === '2026-12-31', 'task create: recurrence end date accepted');

r = parseFormData(taskCreateInputSchema, form({ title: 't', recurrence: 'yearly' }));
ok(!r.ok && r.error === 'Invalid recurrence value.', 'task create: bad recurrence rejected');

r = parseFormData(taskCreateInputSchema, form({ title: 't', recurrence_end_date: '31/12/2026' }));
ok(!r.ok && r.error === 'Recurrence end date must be a valid date (YYYY-MM-DD).', 'task create: bad recurrence end date');

r = parseFormData(taskCreateInputSchema, form({ title: 't', department: 'X'.repeat(51) }));
ok(!r.ok && r.error === 'Department must be 50 characters or fewer.', 'task create: department max 50');

// checklist + dependencies (repeated form keys → arrays)
const multiForm = new FormData();
multiForm.append('title', 't');
multiForm.append('checklist', ' Prep sample  ');
multiForm.append('checklist', '  Run analysis');
multiForm.append('checklist', '   ');
multiForm.append('dependencies', '7');
multiForm.append('dependencies', '9');
r = parseFormData(taskCreateInputSchema, multiForm);
ok(r.ok && r.data.checklist.length === 2, 'task create: checklist trims + drops empty rows');
ok(r.ok && r.data.checklist[0] === 'Prep sample' && r.data.checklist[1] === 'Run analysis', 'task create: checklist order kept');
ok(r.ok && r.data.dependencies.length === 2 && r.data.dependencies[0] === 7, 'task create: dependencies parsed to numbers');

const tooManyForm = new FormData();
tooManyForm.append('title', 't');
for (let i = 0; i < 31; i += 1) tooManyForm.append('checklist', `item ${i}`);
r = parseFormData(taskCreateInputSchema, tooManyForm);
ok(!r.ok && /at most 30 checklist items/.test(r.error), 'task create: checklist capped at 30');

// Regression: a SINGLE checklist/dependency item must stay an array (a scalar
// would be dropped by the preprocess and the item would silently vanish).
const singleItemForm = new FormData();
singleItemForm.append('title', 't');
singleItemForm.append('checklist', 'Only item');
singleItemForm.append('dependencies', '5');
r = parseFormData(taskCreateInputSchema, singleItemForm);
ok(
  r.ok && r.data.checklist.length === 1 && r.data.checklist[0] === 'Only item',
  'task create: single checklist item stays an array',
);
ok(r.ok && r.data.dependencies.length === 1 && r.data.dependencies[0] === 5, 'task create: single dependency stays an array');

r = parseFormData(taskCreateInputSchema, form({ title: 't', due_date: '11/08/2026' }));
ok(!r.ok && r.error === 'Due date must be a valid date (YYYY-MM-DD).', 'task create: bad due date');

r = parseFormData(taskCreateInputSchema, form({ title: 't', assigned_to: 'not-a-number' }));
ok(!r.ok && r.error === 'Invalid assignee.', `task create: non-numeric assignee (got "${r.error}")`);

// default priority is medium
r = parseFormData(taskCreateInputSchema, form({ title: 't' }));
ok(r.ok && r.data.priority === 'medium', 'task create: missing priority defaults to medium');

// comment
r = parseFormData(commentSchema, form({ comment: '  Looks good  ' }));
ok(r.ok && r.data.comment === 'Looks good', 'comment: trims');
r = parseFormData(commentSchema, form({ comment: '' }));
ok(!r.ok && r.error === 'Comment cannot be empty.', 'comment: empty rejected');
r = parseFormData(commentSchema, form({ comment: 'x'.repeat(2001) }));
ok(!r.ok && r.error === 'Comment must be 2000 characters or fewer.', 'comment: max 2000');

// user create
r = userCreateSchema.safeParse({
  username: 'bad username!',
  fullName: 'Sara',
  password: 'longenough1',
  role: 'employee',
  canCreateTasks: true,
});
ok(!r.success && r.error.issues[0].message === 'Username may only contain letters, numbers, _ . and -.', 'user create: username charset');
r = userCreateSchema.safeParse({
  username: 'sara',
  fullName: 'Sara',
  password: 'short',
  role: 'employee',
  canCreateTasks: false,
});
ok(!r.success && r.error.issues[0].message === 'Password must be at least 8 characters.', 'user create: password min 8');
r = userCreateSchema.safeParse({
  username: 'sara',
  fullName: 'Sara',
  password: 'longenough1',
  role: 'employee',
  canCreateTasks: false,
});
ok(r.success, 'user create: valid input passes');

// login
r = parseFormData(loginInputSchema, form({ username: '', password: '' }));
ok(!r.ok && r.error === 'Username is required.', 'login: empty username');

// ── 3. Task policy ──
section('Task policy (src/lib/task-policy.ts)');
ok(isTaskReadOnly('completed') === true, 'completed is read-only');
ok(isTaskReadOnly('cancelled') === true, 'cancelled is read-only (terminal)');
ok(isTaskReadOnly('in_progress') === false, 'in_progress is not read-only');

// Status transitions (spec):
//   not_started → in_progress / on_hold(with blocker) / in_progress ↔ on_hold
ok(canTransitionStatus('not_started', 'in_progress') === true, 'not_started → in_progress allowed');
ok(canTransitionStatus('not_started', 'on_hold') === true, 'not_started → on_hold allowed (blocker required)');
ok(canTransitionStatus('in_progress', 'on_hold') === true, 'in_progress → on_hold allowed (blocker required)');
ok(canTransitionStatus('on_hold', 'in_progress') === true, 'on_hold → in_progress allowed (work resumes)');
ok(canTransitionStatus('in_progress', 'not_started') === false, 'in_progress → not_started rejected (no going back)');
ok(canTransitionStatus('on_hold', 'not_started') === false, 'on_hold → not_started rejected (no going back)');
ok(canTransitionStatus('completed', 'in_progress') === false, 'completed → active rejected (reopen is admin/manager-only)');
ok(canTransitionStatus('cancelled', 'in_progress') === false, 'cancelled → active rejected');
ok(canTransitionStatus('not_started', 'completed') === false, 'completed only via closure flow');
ok(canTransitionStatus('in_progress', 'cancelled') === false, 'cancelled only via the manager/admin cancel flow');
ok(canTransitionStatus('on_hold', 'on_hold') === true, 'same-status no-op allowed');

// Blocker-note requirement for on_hold (spec).
ok(requiresBlockerNote('not_started', 'on_hold') === true, 'not_started → on_hold requires a blocker note');
ok(requiresBlockerNote('in_progress', 'on_hold') === true, 'in_progress → on_hold requires a blocker note');
ok(requiresBlockerNote('on_hold', 'in_progress') === false, 'on_hold → in_progress does not require a blocker note');
ok(requiresBlockerNote('not_started', 'in_progress') === false, 'not_started → in_progress does not require a blocker note');
ok(requiresBlockerNote('on_hold', 'on_hold') === false, 'same-status on_hold no-op needs no blocker');

ok(isEmployeeEditableField('status') && isEmployeeEditableField('progress_percent') && isEmployeeEditableField('blocker_note'), 'employee editable fields');
ok(isEmployeeLockedField('title') && isEmployeeLockedField('assigned_to'), 'locked fields');
ok(!isEmployeeEditableField('title'), 'title is not employee-editable');
ok(MAX_UPLOAD_BYTES === 10 * 1024 * 1024, 'upload limit 10 MB');
ok(TASK_STATUSES.length === 5 && TASK_STATUSES.includes('cancelled'), 'five statuses incl. cancelled');
ok(TASK_PRIORITIES.includes('urgent'), 'urgent is a valid priority');
ok(TASK_RECURRENCES.length === 4 && isRecurrence('daily') && isRecurrence('monthly') && !isRecurrence('yearly'), 'recurrence enum');
ok(isAllowedExtension('pdf') && !isAllowedExtension('exe'), 'extension allowlist');

// Completion-evidence allowlist (spec: PDF, PNG, JPG, JPEG, XLSX, DOCX only).
section('Evidence policy (completion wizard allowlist)');
ok(
  JSON.stringify(EVIDENCE_EXTENSIONS) === JSON.stringify(['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'docx']),
  'evidence: exactly pdf/png/jpg/jpeg/xlsx/docx',
);
ok(EVIDENCE_EXTENSIONS_HINT === 'pdf, png, jpg, jpeg, xlsx, docx', 'evidence: hint lists the six types');
ok(
  EVIDENCE_EXTENSIONS.every((e) => isEvidenceExtension(e)) && !isEvidenceExtension('txt') && !isEvidenceExtension('exe'),
  'evidence: isEvidenceExtension matches the allowlist',
);
ok(
  EVIDENCE_EXT_MIME.pdf.join() === 'application/pdf' &&
    EVIDENCE_EXT_MIME.png.join() === 'image/png' &&
    EVIDENCE_EXT_MIME.jpg.join() === 'image/jpeg' &&
    EVIDENCE_EXT_MIME.jpeg.join() === 'image/jpeg' &&
    EVIDENCE_EXT_MIME.xlsx.join() === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
    EVIDENCE_EXT_MIME.docx.join() === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'evidence: MIME map matches the six types',
);
ok(
  JSON.stringify(EVIDENCE_SIGNATURES.pdf) === JSON.stringify([0x25, 0x50, 0x44, 0x46, 0x2d]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.png) === JSON.stringify([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.jpg) === JSON.stringify([0xff, 0xd8, 0xff]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.jpeg) === JSON.stringify([0xff, 0xd8, 0xff]),
  'evidence: magic bytes for pdf/png/jpg/jpeg',
);
ok(
  JSON.stringify(EVIDENCE_SIGNATURES.xlsx) === JSON.stringify([0x50, 0x4b, 0x03, 0x04]) &&
    JSON.stringify(EVIDENCE_SIGNATURES.docx) === JSON.stringify([0x50, 0x4b, 0x03, 0x04]),
  'evidence: xlsx/docx are ZIP containers (PK.. magic)',
);

// ── 4b. Recurrence scheduling (pure) ──
section('Recurrence (src/lib/recurrence.ts)');
ok(nextDueDate('none', '2026-08-11') === null, 'recurrence: none → no next date');
ok(nextDueDate('daily', '2026-08-11') === '2026-08-12', 'recurrence: daily +1 day');
ok(nextDueDate('weekly', '2026-08-11') === '2026-08-18', 'recurrence: weekly +7 days');
ok(nextDueDate('monthly', '2026-08-11') === '2026-09-11', 'recurrence: monthly +1 month');
ok(nextDueDate('monthly', '2026-01-31') === '2026-02-28', 'recurrence: monthly clamps Jan 31 → Feb 28');
ok(nextDueDate('monthly', '2024-01-31') === '2024-02-29', 'recurrence: monthly leap year Feb 29');
ok(nextDueDate('monthly', '2026-12-31') === '2027-01-31', 'recurrence: monthly year rollover');
ok(nextDueDate('weekly', null) === null, 'recurrence: missing due date → null');
ok(nextDueDate('weekly', 'not-a-date') === null, 'recurrence: invalid due date → null');

ok(shouldCreateNextOccurrence({ recurrence: 'none', dueDate: '2026-08-11', recurrenceEndDate: null }) === false, 'recurrence: none never creates next');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: null }) === true, 'recurrence: open-ended series allowed');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: '2026-08-18' }) === true, 'recurrence: next date within end date');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: '2026-08-17' }) === false, 'recurrence: next date past end date → stop');
ok(shouldCreateNextOccurrence({ recurrence: 'weekly', dueDate: '2026-08-11', recurrenceEndDate: '2026-08-18' }) === true, 'recurrence: end date is inclusive');

// ── 4. CSV export (pure) ──
section('CSV export (src/lib/export.ts)');
ok(csvField('plain') === 'plain', 'csv: plain value unquoted');
ok(csvField('a,b') === '"a,b"', 'csv: comma quoted');
ok(csvField('say "hi"') === '"say ""hi"""', 'csv: quotes doubled');
ok(csvField(null) === '', 'csv: null → empty');
ok(csvField(42) === '42', 'csv: number');

const csv = tasksToCsv([
  { id: 1, title: 'Calibrate, gauges', description: null, status: 'in_progress', priority: 'high', progress_percent: 40, assignee: 'Sara', created_by_name: 'Manager', due_date: null, created_at: '2026-08-01 10:00:00', completed_at: null, blocker_note: null },
]);
ok(csv.startsWith('\uFEFF'), 'csv: UTF-8 BOM');
ok(csv.includes('ID,Title,Description,Status,Priority,Progress (%),Assignee,Created by,Due date,Created at,Completed at,Blocker note'), 'csv: headers');
ok(csv.includes('"Calibrate, gauges"'), 'csv: title escaped');
ok(csv.endsWith('\r\n'), 'csv: CRLF line ending');

// ── 5. Backup round-trip (real files) ──
section('Backup (src/lib/backup.ts)');
const tmpDir = mkdtempSync(join(tmpdir(), 'qc-backup-'));
try {
  const srcDb = join(tmpDir, 'source.db');
  const db = new Database(srcDb);
  db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
  db.prepare('INSERT INTO t (v) VALUES (?)').run('hello');
  db.close();

  const backupDir = join(tmpDir, 'backups');
  const first = await createBackup({ dbPath: srcDb, backupDir, keep: 1 });
  ok(existsSync(first.file) && statSync(first.file).size > 0, 'backup: file created with data');

  const check = new Database(first.file, { readonly: true });
  const row = check.prepare('SELECT v FROM t WHERE id = 1').get();
  check.close();
  ok(row.v === 'hello', 'backup: content intact');

  const second = await createBackup({ dbPath: srcDb, backupDir, keep: 1 });
  const remaining = readdirSync(backupDir).filter((f) => f.endsWith('.db'));
  ok(remaining.length === 1, 'backup: retention keeps only the newest');
  ok(second.pruned === 1, `backup: pruned 1 old backup (got ${second.pruned})`);
  ok(statSync(second.file).size > 0, 'backup: second backup valid');
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

// ── 6. init-db migrates a legacy (pre-spec) database ──
// Regression for the "SQLITE_ERROR: no such column: recurrence" bug: a
// database created by an OLD schema keeps its old table shapes (schema.sql's
// CREATE TABLE IF NOT EXISTS never touches them), so `pnpm db:init` must run
// the same column migrations as the app boot BEFORE applying schema.sql.
// This runs the REAL CLI as a subprocess against a legacy-shaped DB.
section('init-db migration (legacy DB → spec shape)');
const migDir = mkdtempSync(join(tmpdir(), 'qc-mig-'));
try {
  const legacyPath = join(migDir, 'legacy.db');
  const legacy = new Database(legacyPath);
  legacy.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'QC',
      can_create_tasks INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'not_started',
      priority TEXT NOT NULL DEFAULT 'medium',
      progress_percent INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL,
      assigned_to INTEGER,
      due_date TEXT,
      blocker_note TEXT,
      completed_at TEXT,
      completed_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE task_delete_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      task_title TEXT NOT NULL,
      requested_by INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
      VALUES ('admin', 'legacy-hash', 'Legacy Admin', 'admin', 'QC', 1, 1);
    INSERT INTO tasks (title, status, created_by, due_date)
      VALUES ('Legacy task', 'in_progress', 1, '2026-08-01');
    INSERT INTO task_delete_requests (task_id, task_title, requested_by, status)
      VALUES (1, 'Legacy task', 1, 'pending');
  `);
  legacy.close();

  const run = spawnSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: APP_DIR,
    env: { ...process.env, QC_DATABASE_PATH: legacyPath },
    encoding: 'utf8',
  });
  ok(run.status === 0, 'init-db: exits successfully');
  // Migration warnings go to stderr (console.warn); logs to stdout.
  const combined = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  ok(/migrated .* column\(s\)/.test(combined), 'init-db: reports migrated columns');
  ok(/task_delete_requests \(spec shape/.test(combined), 'init-db: rebuilds legacy task_delete_requests');
  ok(/users table already has 1 row/.test(combined), 'init-db: keeps existing rows (seed skipped)');

  const check = new Database(legacyPath, { readonly: true });
  const tasksCols = check.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  for (const col of ['recurrence', 'recurrence_end_date', 'parent_recurring_task_id', 'department']) {
    ok(tasksCols.includes(col), `init-db: tasks gains '${col}'`);
  }
  const delReqCols = check.prepare('PRAGMA table_info(task_delete_requests)').all().map((c) => c.name);
  ok(!delReqCols.includes('task_title'), 'init-db: task_delete_requests loses legacy task_title');
  const pending = check.prepare("SELECT task_id, status FROM task_delete_requests WHERE status = 'pending'").get();
  ok(pending && pending.task_id === 1, 'init-db: pending delete request survives the rebuild');
  const idx = check.prepare("SELECT 1 AS one FROM sqlite_master WHERE type = 'index' AND name = 'idx_tasks_recurrence'").get();
  ok(!!idx, 'init-db: idx_tasks_recurrence index created');
  const users = check.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  ok(users === 1, 'init-db: user data preserved (1 row)');
  const tables = check.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name);
  ok(tables.length === 12, `init-db: full 12-table schema applied (got ${tables.length})`);
  const fk = check.prepare('PRAGMA foreign_key_check').all();
  ok(fk.length === 0, 'init-db: no foreign-key violations after migration');
  check.close();

  // Idempotency: a second run must be a no-op (columns already exist).
  const run2 = spawnSync(process.execPath, ['scripts/init-db.mjs'], {
    cwd: APP_DIR,
    env: { ...process.env, QC_DATABASE_PATH: legacyPath },
    encoding: 'utf8',
  });
  const combined2 = `${run2.stdout ?? ''}${run2.stderr ?? ''}`;
  ok(run2.status === 0, 'init-db: second run exits successfully');
  ok(!/migrated .* column\(s\)/.test(combined2), 'init-db: second run is a no-op (idempotent)');
} finally {
  rmSync(migDir, { recursive: true, force: true });
}

// ── summary ──
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
