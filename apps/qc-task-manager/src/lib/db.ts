// SQLite connection layer for QC Task Manager.
//
// Responsibilities:
//   1. Open db/qc_tasks.db with better-sqlite3 (override path via QC_DB_PATH).
//   2. Enable WAL mode + PRAGMA foreign_keys = ON (per spec).
//   3. Apply db/schema.sql on every boot (idempotent — CREATE TABLE IF NOT EXISTS).
//   4. Seed the admin account when the users table is empty.
//   5. Expose a small typed query helper (`query`) so callers don't import the
//      raw driver everywhere.
//
// Schema application + seeding happen once per process (guarded by a flag),
// so repeated getDb() calls are cheap.

import Database from 'better-sqlite3';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { seedDemoData, seedUsersIfEmpty } from './seed';
// Bundle the schema into the build so it resolves from BOTH the dev server
// (src/) and the standalone production entry (dist/server/chunks). A runtime
// readFileSync of '../../db/schema.sql' only works in dev — the built bundle
// lives two levels deeper and would look in dist/db/.
import schemaSql from '../../db/schema.sql?raw';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to <app>/db/qc_tasks.db. From src/lib/ that's ../../db/qc_tasks.db.
const DB_DIR = resolve(__dirname, '..', '..', 'db');
const DB_PATH = process.env.QC_DB_PATH || resolve(DB_DIR, 'qc_tasks.db');

let _db: BetterSqliteDatabase | null = null;
let _initialized = false;

/** Ensure the db directory exists (the file itself is created on first open). */
function ensureDir(): void {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
}

/**
 * Upgrade pre-spec databases to the 12-table production schema.
 *
 * schema.sql uses `CREATE TABLE IF NOT EXISTS`, so existing databases keep
 * their old shapes forever unless we migrate them here. This runs BEFORE
 * schema.sql on boot: new columns must exist before the new indexes are
 * created, and on a fresh database every table is missing so it is a no-op
 * (schema.sql then builds the full shape from scratch).
 */
const COLUMN_MIGRATIONS: { table: string; column: string; ddl: string }[] = [
  // users
  { table: 'users', column: 'failed_login_attempts', ddl: 'ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0' },
  { table: 'users', column: 'locked_until', ddl: 'ALTER TABLE users ADD COLUMN locked_until TEXT' },
  { table: 'users', column: 'last_login_at', ddl: 'ALTER TABLE users ADD COLUMN last_login_at TEXT' },
  { table: 'users', column: 'created_by', ddl: 'ALTER TABLE users ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL' },
  // ALTER ADD COLUMN forbids expression defaults, so updated_at is added
  // nullable then backfilled from created_at (schema.sql keeps the NOT NULL
  // DEFAULT datetime('now') shape for fresh databases).
  { table: 'users', column: 'updated_at', ddl: 'ALTER TABLE users ADD COLUMN updated_at TEXT' },
  // tasks
  { table: 'tasks', column: 'department', ddl: "ALTER TABLE tasks ADD COLUMN department TEXT NOT NULL DEFAULT 'QC'" },
  { table: 'tasks', column: 'recurrence', ddl: "ALTER TABLE tasks ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'none'" },
  { table: 'tasks', column: 'recurrence_end_date', ddl: 'ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT' },
  { table: 'tasks', column: 'parent_recurring_task_id', ddl: 'ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL' },
  { table: 'tasks', column: 'started_at', ddl: 'ALTER TABLE tasks ADD COLUMN started_at TEXT' },
  { table: 'tasks', column: 'cancelled_at', ddl: 'ALTER TABLE tasks ADD COLUMN cancelled_at TEXT' },
  { table: 'tasks', column: 'cancelled_by', ddl: 'ALTER TABLE tasks ADD COLUMN cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL' },
  { table: 'tasks', column: 'completion_comment_id', ddl: 'ALTER TABLE tasks ADD COLUMN completion_comment_id INTEGER' },
  // task_comments
  { table: 'task_comments', column: 'is_completion_comment', ddl: 'ALTER TABLE task_comments ADD COLUMN is_completion_comment INTEGER NOT NULL DEFAULT 0' },
  // task_attachments
  { table: 'task_attachments', column: 'file_hash', ddl: 'ALTER TABLE task_attachments ADD COLUMN file_hash TEXT' },
  { table: 'task_attachments', column: 'is_evidence', ddl: 'ALTER TABLE task_attachments ADD COLUMN is_evidence INTEGER NOT NULL DEFAULT 0' },
  // task_activity_log
  { table: 'task_activity_log', column: 'field', ddl: 'ALTER TABLE task_activity_log ADD COLUMN field TEXT' },
  { table: 'task_activity_log', column: 'note', ddl: 'ALTER TABLE task_activity_log ADD COLUMN note TEXT' },
  { table: 'task_activity_log', column: 'ip_address', ddl: 'ALTER TABLE task_activity_log ADD COLUMN ip_address TEXT' },
];

function migrateNewColumns(db: BetterSqliteDatabase): void {
  const byTable = new Map<string, typeof COLUMN_MIGRATIONS>();
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
    const existing = new Set(
      (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name),
    );
    for (const m of columns) {
      if (existing.has(m.column)) continue;
      db.exec(m.ddl);
      added += 1;
    }
  }
  // updated_at (added nullable above) mirrors created_at for existing rows.
  const userCols = new Set(
    (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name),
  );
  if (userCols.has('updated_at') && userCols.has('created_at')) {
    db.prepare(
      'UPDATE users SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL',
    ).run();
  }
  if (added > 0) console.warn(`[db] migrated ${added} new column(s) onto existing tables.`);
}

/**
 * Rebuild task_delete_requests when it predates the spec's CASCADE shape.
 *
 * The legacy shape (from the delete-request workflow era) uses a plain
 * INTEGER task_id + a task_title snapshot and deliberately has NO cascade.
 * The production spec makes the request a child of its task: task_id
 * REFERENCES tasks(id) ON DELETE CASCADE and no snapshot column. Because
 * schema.sql uses `CREATE TABLE IF NOT EXISTS`, existing databases keep the
 * old shape — this migration rebuilds the table into the spec shape.
 * Approved requests whose task was already deleted cannot satisfy the new
 * FK (task_id NOT NULL, target gone) — they are dropped with the legacy
 * shape; live pending/rejected rows keep their ids intact.
 */
function migrateDeleteRequests(db: BetterSqliteDatabase): void {
  const cols = db.prepare('PRAGMA table_info(task_delete_requests)').all() as {
    name: string;
  }[];
  if (cols.length === 0) return; // table not created yet (fresh boot applies schema after)
  if (!cols.some((c) => c.name === 'task_title')) return; // already the spec shape

  db.transaction(() => {
    // Rows pointing at already-deleted tasks cannot survive the new FK.
    db.prepare(
      'DELETE FROM task_delete_requests WHERE task_id NOT IN (SELECT id FROM tasks)',
    ).run();
    db.exec(`
      CREATE TABLE task_delete_requests_new (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        requested_by INTEGER NOT NULL REFERENCES users(id),
        reason       TEXT,
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
    // The partial unique index died with the old table — recreate it.
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_delreq_one_pending
        ON task_delete_requests(task_id) WHERE status = 'pending';
    `);
  })();
  console.warn('[db] migrated task_delete_requests (spec shape: CASCADE, no task_title snapshot).');
}

/** Apply schema.sql (idempotent) and seed the admin account if needed. */
function initialize(db: BetterSqliteDatabase): void {
  if (_initialized) return;
  // Migrations first: existing databases need the new columns/tables before
  // schema.sql's CREATE INDEX statements reference them. On a fresh database
  // every table is missing, so both migrations are no-ops.
  migrateNewColumns(db);
  migrateDeleteRequests(db);
  db.exec(schemaSql);
  seedUsersIfEmpty(db);
  // SEED_DEMO=1 → demo team + 12 mixed-status tasks (only on an empty DB).
  seedDemoData(db);
  // Periodic session cleanup: purge expired rows at process start (per spec).
  // Sessions live in SQLite, so this runs naturally once per server boot.
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  _initialized = true;
}

/**
 * Purge expired session rows. Called on every login (per spec) so the sessions
 * table never accumulates stale tokens. Returns the number of rows removed.
 */
export function cleanupExpiredSessions(): number {
  const db = getDb();
  const info = db
    .prepare('DELETE FROM sessions WHERE expires_at < ?')
    .run(new Date().toISOString());
  return info.changes;
}

/**
 * Open (or reuse) the SQLite connection. WAL mode + foreign keys are applied
 * once per connection; schema + seed run once per process. Safe to call
 * repeatedly — returns the same instance.
 */
export function getDb(): BetterSqliteDatabase {
  if (_db) return _db;

  ensureDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initialize(db);

  _db = db;
  return db;
}

/** Convert a 0/1 SQLite integer into a boolean. */
export function toBool(value: number | null | undefined): boolean {
  return Number(value) === 1;
}

// ─────────────────────────── Typed query helper ────────────────────────────
// A thin wrapper so call sites read as `query.all(...)` / `query.one(...)` /
// `query.run(...)` with a single typed return type instead of importing the
// raw better-sqlite3 Statement API everywhere.

export interface QueryHelper {
  /** Return all matching rows. Each row is a plain object keyed by column. */
  all<T = Record<string, unknown>>(...params: unknown[]): T[];
  /** Return the first matching row, or undefined. */
  one<T = Record<string, unknown>>(...params: unknown[]): T | undefined;
  /** Run an INSERT/UPDATE/DELETE and return the better-sqlite3 RunResult. */
  run(...params: unknown[]): Database.RunResult;
}

/** Prepare a SQL string into a typed helper (memoised by better-sqlite3). */
export function query(sql: string): QueryHelper {
  const db = getDb();
  const stmt = db.prepare(sql);
  return {
    all: <T = Record<string, unknown>>(...params: unknown[]) => stmt.all(...params) as T[],
    one: <T = Record<string, unknown>>(...params: unknown[]) => stmt.get(...params) as T | undefined,
    run: (...params: unknown[]) => stmt.run(...params),
  };
}

export { DB_PATH };
