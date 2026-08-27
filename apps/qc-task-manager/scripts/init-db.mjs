// Initialize the QC Task Manager SQLite database.
// Run: `pnpm db:init` (or `pnpm db:reset` to wipe first).
//
// Applies the same sequential migrations and seeds one account per role. The
// bootstrap also happens automatically on application startup; this script is
// the explicit/CI entry point.

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { runMigrations } from '../src/lib/migrations.ts';
import { configuredBackupDirectory } from '../src/lib/backup.ts';
import { seedLabEquipmentIfEmpty } from '../src/lib/lab/seed.ts';
import { importWICatalog } from '../src/lib/lab/wiCatalog.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = resolve(__dirname, '../db');
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH ?? resolve(DB_DIR, 'qc_tasks.db');

const RESET = process.argv.includes('--reset');
const SEED_DEMO = process.env.SEED_DEMO === '1';
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
const IS_DEFAULT_PASSWORD = DEFAULT_PASSWORD === 'admin123';

function assertSafeSeedPassword() {
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_DEFAULT_PASSWORD) {
    throw new Error('ADMIN_DEFAULT_PASSWORD must be set before seeding a production database.');
  }
}

// One account per role (mirrors src/lib/seed.ts). Every account uses the same
// ADMIN_DEFAULT_PASSWORD so the role router is testable on a fresh database.
const SEED_USERS = [
  { username: 'admin', full_name: 'Administrator', role: 'admin', can_create_tasks: 1 },
  { username: 'manager', full_name: 'Department Manager', role: 'manager', can_create_tasks: 1 },
  { username: 'supervisor', full_name: 'Team Supervisor', role: 'supervisor', can_create_tasks: 1 },
  { username: 'employee', full_name: 'QC Employee', role: 'employee', can_create_tasks: 0 },
];

function ensureDir() {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
}

function seedUsersIfEmpty(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (n > 0) {
    console.log(`[init-db] users table already has ${n} row(s) — skipping seed.`);
    return false;
  }
  assertSafeSeedPassword();
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const insert = db.prepare(
    `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
     VALUES (@username, @password_hash, @full_name, @role, @department, @can_create_tasks, @is_active)`,
  );
  const insertAll = db.transaction(() => {
    for (const u of SEED_USERS) {
      insert.run({
        username: u.username,
        password_hash: hash,
        full_name: u.full_name,
        role: u.role,
        department: 'QC',
        can_create_tasks: u.can_create_tasks,
        is_active: 1,
      });
    }
  });
  insertAll();
  console.warn(`[init-db] seeded ${SEED_USERS.length} accounts (admin, manager, supervisor, employee).`);
  if (IS_DEFAULT_PASSWORD) {
    console.warn(
      '[init-db] ⚠️  ADMIN_DEFAULT_PASSWORD is not set — every seeded account uses the default "admin123".',
    );
    console.warn('[init-db] ⚠️  Set ADMIN_DEFAULT_PASSWORD before exposing the app beyond localhost.');
  } else {
    console.warn('[init-db] seeded accounts use ADMIN_DEFAULT_PASSWORD.');
  }
  return true;
}

/** Local date YYYY-MM-DD offset by `days` from today (mirrors src/lib/seed.ts). */
function iso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 12 demo tasks in mixed statuses (mirrors src/lib/seed.ts DEMO_TASKS).
// Completed tasks carry completedBy + completedOffset + completion comment so
// the db:init path demos identically to the runtime seed (src/lib/seed.ts).
const DEMO_TASKS = [
  { title: 'Calibrate temperature gauges – Line A', status: 'in_progress', priority: 'high', progress: 45, createdBy: 'manager', assignedTo: 'emp_sara', due: 3, blocker: null },
  { title: 'Inspect incoming batch #8841', status: 'not_started', priority: 'medium', progress: 0, createdBy: 'supervisor', assignedTo: 'employee', due: -2, blocker: null },
  { title: 'Update QC checklist template', status: 'completed', priority: 'medium', progress: 100, createdBy: 'supervisor', assignedTo: 'emp_omar', due: -5, blocker: null, completedBy: 'emp_omar', completedOffset: '-6 days', comment: 'Checklist updated and versioned — ready for training.', evidence: { name: 'checklist_rev4.pdf', mime: 'application/pdf' } },
  { title: 'Audit calibration certificates', status: 'on_hold', priority: 'high', progress: 60, createdBy: 'manager', assignedTo: 'emp_sara', due: 5, blocker: 'Awaiting the vendor calibration certificate for the torque wrench.' },
  { title: 'Review supplier audit report', status: 'in_progress', priority: 'high', progress: 80, createdBy: 'supervisor', assignedTo: 'emp_omar', due: -1, blocker: null },
  { title: 'Verify batch #8839 results', status: 'completed', priority: 'low', progress: 100, createdBy: 'supervisor', assignedTo: 'employee', due: -12, blocker: null, completedBy: 'employee', completedOffset: '-14 days', comment: 'Batch results verified against retention samples — all within specification.', evidence: null },
  { title: 'Draft SOP for new packaging line', status: 'not_started', priority: 'low', progress: 0, createdBy: 'manager', assignedTo: 'employee', due: 10, blocker: null },
  { title: 'First-article inspection – connector #332', status: 'in_progress', priority: 'medium', progress: 25, createdBy: 'supervisor', assignedTo: null, due: 2, blocker: null },
  { title: 'Monthly QC metrics report', status: 'completed', priority: 'medium', progress: 100, createdBy: 'manager', assignedTo: 'emp_sara', due: -30, blocker: null, completedBy: 'emp_sara', completedOffset: '-28 days', comment: 'Report compiled and submitted to management review.', evidence: { name: 'qc_metrics_Q2.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } },
  { title: 'Environmental monitoring – cleanroom', status: 'not_started', priority: 'high', progress: 0, createdBy: 'manager', assignedTo: null, due: -3, blocker: null },
  { title: 'Supplier onboarding – new vendor', status: 'on_hold', priority: 'low', progress: 15, createdBy: 'manager', assignedTo: 'emp_omar', due: 14, blocker: 'Legal review of the quality agreement is pending.' },
  { title: 'Retest failed batch #8827', status: 'in_progress', priority: 'high', progress: 60, createdBy: 'supervisor', assignedTo: 'employee', due: -4, blocker: null },
];

function seedDemo(db) {
  if (!SEED_DEMO) return;
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM tasks').get();
  if (n > 0) {
    console.warn('[init-db] SEED_DEMO=1 but tasks already exist — skipping demo data.');
    return;
  }
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const insUser = db.prepare(
    `INSERT OR IGNORE INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
     VALUES (?, ?, ?, 'employee', 'QC', ?, 1)`,
  );
  insUser.run('emp_sara', hash, 'Sara Alharbi', 1);
  insUser.run('emp_omar', hash, 'Omar Alqahtani', 0);

  const uid = (username) => db.prepare('SELECT id FROM users WHERE username = ?').get(username).id;
  const insTask = db.prepare(
    `INSERT INTO tasks (title, description, status, priority, progress_percent, created_by, assigned_to, due_date, blocker_note, completed_at, completed_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IS NULL THEN NULL ELSE datetime('now', ?) END, ?, datetime('now', ?))`,
  );
  const insComment = db.prepare(
    `INSERT INTO task_comments (task_id, user_id, comment, created_at)
     VALUES (?, ?, ?, datetime('now', ?))`,
  );
  const insAct = db.prepare(
    `INSERT INTO task_activity_log (task_id, user_id, action, old_value, new_value, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now', ?))`,
  );
  const insAtt = db.prepare(
    `INSERT INTO task_attachments (task_id, uploaded_by, file_name, mime_type, file_data, file_size, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`,
  );
  const pdfBytes = Buffer.from('%PDF-1.4\n% QC demo evidence (placeholder)\n%%EOF\n', 'utf8');
  const xlsxBytes = Buffer.from('PK\x03\x04 QC demo evidence (placeholder)', 'utf8');

  const tx = db.transaction(() => {
    for (const t of DEMO_TASKS) {
      const info = insTask.run(
        t.title, 'Demo task for the QC department.', t.status, t.priority, t.progress,
        uid(t.createdBy), t.assignedTo ? uid(t.assignedTo) : null,
        t.due !== null ? iso(t.due) : null, t.blocker,
        t.completedOffset ?? null, t.completedOffset ?? null,
        t.completedBy ? uid(t.completedBy) : null, '-5 days',
      );
      const taskId = Number(info.lastInsertRowid);
      const creatorId = uid(t.createdBy);
      insAct.run(taskId, creatorId, 'task_created', null, t.title, '-5 days');

      if (t.status === 'in_progress' || t.status === 'on_hold') {
        const worker = t.assignedTo ? uid(t.assignedTo) : creatorId;
        insAct.run(taskId, worker, 'status_changed', 'Not started', 'In progress', '-3 days');
        if (t.progress > 0) insAct.run(taskId, worker, 'progress_changed', '0', String(t.progress), '-3 days');
      }
      if (t.status === 'on_hold' && t.blocker) {
        insAct.run(taskId, t.assignedTo ? uid(t.assignedTo) : creatorId, 'blocker_set', null, t.blocker, '-1 days');
      }
      if (t.status === 'completed' && t.completedBy && t.completedOffset) {
        const completerId = uid(t.completedBy);
        insComment.run(taskId, completerId, t.comment, t.completedOffset);
        insAct.run(taskId, completerId, 'task_completed', null, null, t.completedOffset);
        insAct.run(taskId, completerId, 'closure_comment_added', null, t.comment, t.completedOffset);
        if (t.evidence) {
          insAct.run(taskId, completerId, 'evidence_uploaded', null, t.evidence.name, t.completedOffset);
          const bytes = t.evidence.name.endsWith('.pdf') ? pdfBytes : xlsxBytes;
          insAtt.run(taskId, completerId, t.evidence.name, t.evidence.mime, bytes, bytes.length, t.completedOffset);
        } else {
          insAct.run(taskId, completerId, 'evidence_skipped', null, null, t.completedOffset);
        }
      }
    }
  });
  tx();
  console.warn(`[init-db] SEED_DEMO=1 → seeded demo team (emp_sara, emp_omar) + ${DEMO_TASKS.length} tasks.`);
}

function main() {
  ensureDir();

  if (RESET && existsSync(DB_PATH)) {
    rmSync(DB_PATH, { force: true });
    rmSync(DB_PATH + '-wal', { force: true });
    rmSync(DB_PATH + '-shm', { force: true });
    console.log(`[init-db] removed existing database: ${DB_PATH}`);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  // Match src/lib/db.ts: wait up to 5s for a busy lock (e.g. SQLTools holding
  // the file) and use WAL's recommended synchronous mode.
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

  // Use the same migration runner as application startup.
  // Same backup-directory resolution as the app runtime (QC_BACKUP_DIR wins).
  const migrationResult = runMigrations(db, { backup: true, backupDir: configuredBackupDirectory(DB_PATH) });
  console.log(`[init-db] schema version ${migrationResult.currentVersion}; applied ${migrationResult.applied.length} migration(s).`);
  seedUsersIfEmpty(db);
  importWICatalog(db);
  seedDemo(db);
  // Canonical 24-device lab equipment registry (PROMPT 11). Idempotent; gated
  // by QC_SEED_LAB_EQUIPMENT !== '0' so empty-DB fixtures can opt out.
  if (process.env.QC_SEED_LAB_EQUIPMENT !== '0') {
    seedLabEquipmentIfEmpty(db);
  }

  const { tableCount } = db
    .prepare(
      `SELECT COUNT(*) AS tableCount FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
    )
    .get();
  const { userCount } = db.prepare('SELECT COUNT(*) AS userCount FROM users').get();
  const { taskCount } = db.prepare('SELECT COUNT(*) AS taskCount FROM tasks').get();
  db.close();

  console.log(`[init-db] database ready at: ${DB_PATH}`);
  console.log(`[init-db] tables: ${tableCount}, users: ${userCount}, tasks: ${taskCount}`);
}

main();
