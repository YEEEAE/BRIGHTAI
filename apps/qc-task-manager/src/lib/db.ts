// SQLite connection layer for QC Task Manager.
//
// Responsibilities (per the database-layer spec):
//   1. Open db/qc_tasks.db with better-sqlite3. The path comes from
//      `QC_DATABASE_PATH` (spec name), falling back to the legacy `QC_DB_PATH`
//      alias (kept so existing scripts/README/e2e flows keep working), then to
//      <app>/db/qc_tasks.db.
//   2. Enable WAL mode, `foreign_keys = ON`, `busy_timeout = 5000` and
//      `synchronous = NORMAL` on every connection.
//   3. Apply db/schema.sql on every boot (idempotent — CREATE TABLE IF NOT
//      EXISTS), then validate that every required table and index exists.
//   4. Seed accounts when the users table is empty (see src/lib/seed.ts).
//   5. Expose `db` (lazy singleton), a typed `query` helper, a `transaction`
//      helper and a `closeDatabase` helper for tests.
//
// Every SQL statement in this app goes through prepared statements
// (`db.prepare(...)` with `?`/named params) — user input is NEVER concatenated
// into SQL. The only raw `db.exec` calls here run static DDL (schema.sql and
// fixed migration statements), never data.
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
// Spec env var first; QC_DB_PATH stays as a legacy alias (documented in the
// README, used by scripts/init-db.mjs, scripts/backup-db.mjs and the e2e runs).
const DB_PATH =
  process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH ?? resolve(DB_DIR, 'qc_tasks.db');

let _db: BetterSqliteDatabase | null = null;
let _initialized = false;

/**
 * Ensure the parent directory of the resolved DB path exists (the file itself
 * is created on first open). This honors custom `QC_DATABASE_PATH` values
 * pointing at nested directories that don't exist yet — not just <app>/db.
 */
function ensureDir(): void {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
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
  // task_delete_requests
  { table: 'task_delete_requests', column: 'review_note', ddl: 'ALTER TABLE task_delete_requests ADD COLUMN review_note TEXT' },
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
    // The partial unique index died with the old table — recreate it.
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_delreq_one_pending
        ON task_delete_requests(task_id) WHERE status = 'pending';
    `);
  })();
  console.warn('[db] migrated task_delete_requests (spec shape: CASCADE, no task_title snapshot).');
}

// ─────────────────────── Startup schema validation ───────────────────────
// After schema.sql runs, the boot fails fast (with a precise message) if any
// required table or index is missing — a broken schema must never be served.

/** Every table the app relies on (must exist after schema.sql). */
const REQUIRED_TABLES = [
  'users',
  'tasks',
  'task_comments',
  'task_attachments',
  'task_activity_log',
  'task_delete_requests',
  'task_checklists',
  'task_dependencies',
  'notifications',
  'sessions',
  'login_attempts',
  'saved_filters',
] as const;

/** Every index schema.sql creates (FK lookups + dashboard filters). */
const REQUIRED_INDEXES = [
  'idx_tasks_status',
  'idx_tasks_priority',
  'idx_tasks_assigned_to',
  'idx_tasks_created_by',
  'idx_tasks_due_date',
  'idx_tasks_completed_at',
  'idx_tasks_recurrence',
  'idx_comments_task_id',
  'idx_comments_user_id',
  'idx_attachments_task_id',
  'idx_attachments_uploaded_by',
  'idx_activity_task_created',
  'idx_activity_user_id',
  'idx_delreq_task_id',
  'idx_delreq_requested_by',
  'idx_delreq_reviewed_by',
  'idx_delreq_one_pending',
  'idx_checklists_task_id',
  'idx_checklists_completed_by',
  'idx_dependencies_depends_on',
  'idx_notifications_user',
  'idx_notifications_task',
  'idx_sessions_expires',
  'idx_login_attempts_user',
  'idx_saved_filters_user',
  'idx_users_created_by',
] as const;

/**
 * Verify every required table and index exists. Throws with the full list of
 * missing objects so a corrupted/partial database fails early instead of with
 * confusing query errors later.
 *
 * Runs on the FIRST connection (lazy getDb() — importing this module has no
 * side effects), which in practice is the first real request of the server
 * (any session-bearing request touches the DB).
 */
function validateSchema(db: BetterSqliteDatabase): void {
  const tables = new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
      (r) => r.name,
    ),
  );
  const indexes = new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as { name: string }[]).map(
      (r) => r.name,
    ),
  );

  const missingTables = REQUIRED_TABLES.filter((t) => !tables.has(t));
  const missingIndexes = REQUIRED_INDEXES.filter((i) => !indexes.has(i));

  if (missingTables.length === 0 && missingIndexes.length === 0) return;

  const details: string[] = [];
  if (missingTables.length > 0) details.push(`missing tables: ${missingTables.join(', ')}`);
  if (missingIndexes.length > 0) details.push(`missing indexes: ${missingIndexes.join(', ')}`);
  throw new Error(
    `[db] startup validation failed — ${details.join('; ')}. ` +
      'The schema at apps/qc-task-manager/db/schema.sql is out of sync with ' +
      'src/lib/db.ts (REQUIRED_TABLES / REQUIRED_INDEXES).',
  );
}

/** Apply schema.sql (idempotent), validate the result, then seed if needed. */
function initialize(db: BetterSqliteDatabase): void {
  if (_initialized) return;
  // Migrations first: existing databases need the new columns/tables before
  // schema.sql's CREATE INDEX statements reference them. On a fresh database
  // every table is missing, so both migrations are no-ops.
  migrateNewColumns(db);
  migrateDeleteRequests(db);
  db.exec(schemaSql);
  validateSchema(db);
  seedUsersIfEmpty(db);
  // SEED_DEMO=1 → demo team + 12 mixed-status tasks (only on an empty DB).
  seedDemoData(db);
  // Periodic session cleanup: purge expired rows at process start (per spec).
  // Sessions live in SQLite, so this runs naturally once per server boot.
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  // Audit retention: login_attempts rows older than 90 days are pruned so the
  // audit table cannot grow without bound in a long-lived database.
  db.prepare('DELETE FROM login_attempts WHERE created_at < ?').run(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  );
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
 * Open (or reuse) the SQLite connection. WAL + foreign_keys + busy_timeout +
 * synchronous are applied once per connection; schema + seed run once per
 * process. Safe to call repeatedly — returns the same instance.
 */
export function getDb(): BetterSqliteDatabase {
  if (_db) return _db;

  ensureDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  // Concurrent readers/writers wait up to 5s for the lock instead of failing
  // immediately with SQLITE_BUSY.
  db.pragma('busy_timeout = 5000');
  // WAL + synchronous=NORMAL: durability is "app might lose recent
  // transactions on power loss" — never corruption — at a fraction of the
  // FULL fsync cost. This is the recommended setting for WAL databases.
  db.pragma('synchronous = NORMAL');

  initialize(db);

  _db = db;
  return db;
}

/**
 * Close the database connection and reset the singleton. Designed for tests
 * (open a temp DB, run assertions, close, repeat). Safe to call repeatedly —
 * no-op when no connection is open.
 */
export function closeDatabase(): void {
  if (!_db) return;
  _db.close();
  _db = null;
  _initialized = false;
}

/**
 * The raw better-sqlite3 instance (per the spec export list). The connection
 * opens lazily on first property access via a Proxy, so merely importing this
 * module never touches disk — `getDb()` is equivalent and preferred inside the
 * app; `db` exists for the spec/tests.
 *
 * Bundler note: in the PRODUCTION bundle, Rollup replaces this export with a
 * static module-namespace object (this module gets merged into a shared chunk
 * that also carries a namespace facade, and nothing in the app references the
 * proxy directly). The live Proxy is what you get from SOURCE — the dev
 * server and tests (e.g. via Vite's ssrLoadModule). `getDb()` behaves the same
 * in every environment, so app code should use it.
 */
export const db = new Proxy({} as BetterSqliteDatabase, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    // Bind methods so `db.prepare(...)`/`db.transaction(...)` keep `this` on
    // the live instance (a plain property copy would lose it).
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/**
 * Run a function inside a database transaction (per the spec export list).
 * The function receives nothing and returns its result; the transaction
 * commits on success and rolls back on throw.
 *
 * @example
 * const ids = transaction(() => {
 *   const a = query('INSERT INTO ...').run(1);
 *   const b = query('INSERT INTO ...').run(2);
 *   return [Number(a.lastInsertRowid), Number(b.lastInsertRowid)];
 * });
 */
export function transaction<T>(fn: () => T): T {
  return getDb().transaction(fn)();
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
