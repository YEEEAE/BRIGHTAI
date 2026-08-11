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
import { existsSync, mkdtempSync, rmSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import { createBackup } from '../src/lib/backup.ts';
import { parseFormData, taskCreateInputSchema, commentSchema, userCreateSchema, loginInputSchema } from '../src/lib/validation.ts';
import {
  isTaskReadOnly,
  canTransitionStatus,
  isEmployeeEditableField,
  isEmployeeLockedField,
  MAX_UPLOAD_BYTES,
  TASK_STATUSES,
  isAllowedExtension,
} from '../src/lib/task-policy.ts';
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
ok(!r.ok && r.error === 'Invalid priority value.', 'task create: bad priority');

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
ok(isTaskReadOnly('in_progress') === false, 'in_progress is not read-only');
ok(canTransitionStatus('in_progress', 'on_hold') === true, 'active → active allowed');
ok(canTransitionStatus('completed', 'in_progress') === false, 'completed → active rejected');
ok(canTransitionStatus('not_started', 'completed') === false, 'completed only via closure flow');
ok(isEmployeeEditableField('status') && isEmployeeEditableField('progress_percent') && isEmployeeEditableField('blocker_note'), 'employee editable fields');
ok(isEmployeeLockedField('title') && isEmployeeLockedField('assigned_to'), 'locked fields');
ok(!isEmployeeEditableField('title'), 'title is not employee-editable');
ok(MAX_UPLOAD_BYTES === 10 * 1024 * 1024, 'upload limit 10 MB');
ok(TASK_STATUSES.length === 4, 'four statuses');
ok(isAllowedExtension('pdf') && !isAllowedExtension('exe'), 'extension allowlist');

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

// ── summary ──
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
