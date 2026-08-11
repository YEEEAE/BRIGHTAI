// SQLite connection layer for QC Task Manager.
//
// Responsibilities (per the database-layer spec):
//   1. Open db/qc_tasks.db with better-sqlite3. The path comes from
//      `QC_DATABASE_PATH` (spec name), falling back to the legacy `QC_DB_PATH`
//      alias (kept so existing scripts/README/e2e flows keep working), then to
//      <app>/db/qc_tasks.db.
//   2. Enable WAL mode, `foreign_keys = ON`, `busy_timeout = 5000` and
//      `synchronous = NORMAL` on every connection.
//   3. Apply db/migrations/ sequentially on startup, then validate the final
//      schema, migration version, and foreign-key integrity.
//   4. Seed accounts when the users table is empty (see src/lib/seed.ts).
//   5. Expose `db` (lazy singleton), a typed `query` helper, a `transaction`
//      helper and a `closeDatabase` helper for tests.
//
// Every SQL statement in this app goes through prepared statements
// (`db.prepare(...)` with `?`/named params) — user input is NEVER concatenated
// into SQL. Migration DDL is isolated in the migration runner and is never
// built from user input.
//
// Schema application + seeding happen once per process (guarded by a flag),
// so repeated getDb() calls are cheap.

import Database from 'better-sqlite3';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { seedDemoData, seedUsersIfEmpty } from './seed';
import { startBackupScheduler } from './backup-scheduler';
import { backupDirectoryForDatabase } from './backup';
import { runMigrations } from './migrations';
import initialMigrationSql from '../../db/migrations/001_initial.sql?raw';
import legacyMigrationSql from '../../db/migrations/002_legacy_schema_reconciliation.sql?raw';
import slaMigrationSql from '../../db/migrations/003_sla_engine.sql?raw';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to <app>/db/qc_tasks.db. From src/lib/ that's ../../db/qc_tasks.db.
const DB_DIR = resolve(__dirname, '..', '..', 'db');
// Spec env var first; QC_DB_PATH stays as a legacy alias (documented in the
// README, used by scripts/init-db.mjs, scripts/backup-db.mjs and the e2e runs).
const DB_PATH =
  process.env.QC_DATABASE_PATH ?? process.env.QC_DB_PATH ?? resolve(DB_DIR, 'qc_tasks.db');
const BACKUP_DIR = backupDirectoryForDatabase(DB_PATH);

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

// ─────────────────────── Startup schema validation ───────────────────────
// After migrations run, the boot fails fast (with a precise message) if any
// required table, index, or migration version is missing — a broken schema
// must never be served.

/** Every table the app relies on (must exist after migrations). */
const REQUIRED_TABLES = [
  'schema_migrations',
  'schema_migration_failures',
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
  'sla_policies',
  'escalation_policies',
  'escalation_events',
] as const;

/** Every index required by the application (FK lookups + dashboard filters). */
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
  'idx_tasks_sla_status',
  'idx_tasks_sla_due',
  'idx_sla_policies_match',
  'idx_escalation_events_task',
  'idx_escalation_events_retry',
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
function validateSchema(db: BetterSqliteDatabase, expectedVersion: number): void {
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
  const currentVersion = Number(
    (db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get() as { version: number }).version,
  );

  if (missingTables.length === 0 && missingIndexes.length === 0 && currentVersion === expectedVersion) return;

  const details: string[] = [];
  if (missingTables.length > 0) details.push(`missing tables: ${missingTables.join(', ')}`);
  if (missingIndexes.length > 0) details.push(`missing indexes: ${missingIndexes.join(', ')}`);
  if (currentVersion !== expectedVersion) details.push(`schema version ${currentVersion} does not match expected ${expectedVersion}`);
  throw new Error(
    `[db] startup validation failed — ${details.join('; ')}. ` +
      'The migration history and runtime schema are out of sync.',
  );
}

/** Apply the ordered migration history, validate the result, then seed. */
function initialize(db: BetterSqliteDatabase): void {
  if (_initialized) return;
  const migrationResult = runMigrations(db, {
    backup: true,
    backupDir: BACKUP_DIR,
    embeddedMigrations: [
      { file: '001_initial.sql', source: initialMigrationSql },
      { file: '002_legacy_schema_reconciliation.sql', source: legacyMigrationSql },
      { file: '003_sla_engine.sql', source: slaMigrationSql },
    ],
  });
  validateSchema(db, migrationResult.currentVersion);
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
  startBackupScheduler({ dbPath: DB_PATH, backupDir: BACKUP_DIR });
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

export { DB_PATH, BACKUP_DIR };
