// Initialize the QC Task Manager SQLite database.
// Run: `pnpm db:init` (or `pnpm db:reset` to wipe first).
//
// Applies db/schema.sql then seeds one account per role (admin, manager,
// supervisor, employee) with REAL bcrypt hashes generated at runtime (so
// passwords are never stored as stale literals). The same bootstrap also
// happens automatically on dev-server startup via src/lib/db.ts + src/lib/seed.ts;
// this script exists for explicit / CI use.

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = resolve(__dirname, '../db');
const DB_PATH = process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH ?? resolve(DB_DIR, 'qc_tasks.db');
const SCHEMA_PATH = resolve(DB_DIR, 'schema.sql');

const RESET = process.argv.includes('--reset');
const SEED_DEMO = process.env.SEED_DEMO === '1';
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
const IS_DEFAULT_PASSWORD = DEFAULT_PASSWORD === 'admin123';

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

// ── Existing-database migrations ─────────────────────────────────────────
// schema.sql uses CREATE TABLE IF NOT EXISTS, so a database created by an
// OLDER schema keeps its old shape forever — including missing columns that
// the new indexes reference (e.g. tasks.recurrence → idx_tasks_recurrence,
// which fails with "no such column" when schema.sql runs on an un-migrated
// DB). The app migrates existing databases on every boot (src/lib/db.ts);
// this CLI mirrors that logic so `pnpm db:init` upgrades existing databases
// instead of erroring out. Keep this list in sync with src/lib/db.ts
// (COLUMN_MIGRATIONS).

const COLUMN_MIGRATIONS = [
  { table: 'users', column: 'failed_login_attempts', ddl: 'ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0' },
  { table: 'users', column: 'locked_until', ddl: 'ALTER TABLE users ADD COLUMN locked_until TEXT' },
  { table: 'users', column: 'last_login_at', ddl: 'ALTER TABLE users ADD COLUMN last_login_at TEXT' },
  { table: 'users', column: 'created_by', ddl: 'ALTER TABLE users ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL' },
  { table: 'users', column: 'updated_at', ddl: 'ALTER TABLE users ADD COLUMN updated_at TEXT' },
  { table: 'tasks', column: 'department', ddl: "ALTER TABLE tasks ADD COLUMN department TEXT NOT NULL DEFAULT 'QC'" },
  { table: 'tasks', column: 'recurrence', ddl: "ALTER TABLE tasks ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'none'" },
  { table: 'tasks', column: 'recurrence_end_date', ddl: 'ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT' },
  { table: 'tasks', column: 'parent_recurring_task_id', ddl: 'ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL' },
  { table: 'tasks', column: 'started_at', ddl: 'ALTER TABLE tasks ADD COLUMN started_at TEXT' },
  { table: 'tasks', column: 'cancelled_at', ddl: 'ALTER TABLE tasks ADD COLUMN cancelled_at TEXT' },
  { table: 'tasks', column: 'cancelled_by', ddl: 'ALTER TABLE tasks ADD COLUMN cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL' },
  { table: 'tasks', column: 'completion_comment_id', ddl: 'ALTER TABLE tasks ADD COLUMN completion_comment_id INTEGER' },
  { table: 'task_comments', column: 'is_completion_comment', ddl: 'ALTER TABLE task_comments ADD COLUMN is_completion_comment INTEGER NOT NULL DEFAULT 0' },
  { table: 'task_attachments', column: 'file_hash', ddl: 'ALTER TABLE task_attachments ADD COLUMN file_hash TEXT' },
  { table: 'task_attachments', column: 'is_evidence', ddl: 'ALTER TABLE task_attachments ADD COLUMN is_evidence INTEGER NOT NULL DEFAULT 0' },
  { table: 'task_activity_log', column: 'field', ddl: 'ALTER TABLE task_activity_log ADD COLUMN field TEXT' },
  { table: 'task_activity_log', column: 'note', ddl: 'ALTER TABLE task_activity_log ADD COLUMN note TEXT' },
  { table: 'task_activity_log', column: 'ip_address', ddl: 'ALTER TABLE task_activity_log ADD COLUMN ip_address TEXT' },
  { table: 'task_delete_requests', column: 'review_note', ddl: 'ALTER TABLE task_delete_requests ADD COLUMN review_note TEXT' },
];

/**
 * Upgrade a pre-spec database before applying schema.sql: add missing columns
 * (ALTER ADD COLUMN), backfill users.updated_at, and rebuild the legacy
 * task_delete_requests shape into the spec CASCADE shape. Fresh databases have
 * no tables yet — everything is a no-op and schema.sql builds the full shape.
 */
function migrateExistingDb(db) {
  const byTable = new Map();
  for (const m of COLUMN_MIGRATIONS) {
    const list = byTable.get(m.table) ?? [];
    list.push(m);
    byTable.set(m.table, list);
  }

  let added = 0;
  for (const [table, columns] of byTable) {
    const exists = db
      .prepare("SELECT 1 AS one FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table);
    if (!exists) continue; // fresh database — schema.sql creates the full shape
    const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const m of columns) {
      if (existing.has(m.column)) continue;
      db.exec(m.ddl);
      added += 1;
    }
  }

  // updated_at (added nullable above) mirrors created_at for existing rows.
  const userCols = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
  if (userCols.has('updated_at') && userCols.has('created_at')) {
    db.prepare(
      'UPDATE users SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL',
    ).run();
  }

  // Legacy task_delete_requests (task_title snapshot, no cascade) → spec shape.
  const delReqCols = db.prepare('PRAGMA table_info(task_delete_requests)').all().map((c) => c.name);
  if (delReqCols.length > 0 && delReqCols.includes('task_title')) {
    db.transaction(() => {
      db.prepare(
        'DELETE FROM task_delete_requests WHERE task_id NOT IN (SELECT id FROM tasks)',
      ).run();
      db.exec(`
        CREATE TABLE task_delete_requests_new (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          requested_by INTEGER NOT NULL REFERENCES users(id),
          reason       TEXT,
          review_note  TEXT,
          status       TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected')),
          reviewed_by  INTEGER REFERENCES users(id),
          reviewed_at  TEXT,
          created_at   TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO task_delete_requests_new
          (id, task_id, requested_by, reason, status, reviewed_by, reviewed_at, created_at)
          SELECT id, task_id, requested_by, reason, status, reviewed_by, reviewed_at, created_at
          FROM task_delete_requests;
        DROP TABLE task_delete_requests;
        ALTER TABLE task_delete_requests_new RENAME TO task_delete_requests;
      `);
      db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_delreq_one_pending
          ON task_delete_requests(task_id) WHERE status = 'pending';
      `);
    })();
    console.warn('[init-db] migrated task_delete_requests (spec shape: CASCADE, no task_title snapshot).');
  }

  if (added > 0) console.warn(`[init-db] migrated ${added} new column(s) onto existing tables.`);
}

function applySchema(db) {
  const sql = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(sql);
}

function seedUsersIfEmpty(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (n > 0) {
    console.log(`[init-db] users table already has ${n} row(s) — skipping seed.`);
    return false;
  }
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

  // Upgrade existing databases FIRST — schema.sql's CREATE INDEX statements
  // reference columns that old databases don't have yet (e.g. recurrence).
  migrateExistingDb(db);
  applySchema(db);
  seedUsersIfEmpty(db);
  seedDemo(db);

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
