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
import { seedUsersIfEmpty } from './seed';
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
 * Rebuild task_delete_requests when it predates the delete-request workflow.
 *
 * The original table had `task_id ... ON DELETE CASCADE`, which destroyed the
 * request row (the audit record) the moment an approval deleted its task. The
 * workflow needs the approved/rejected request to survive, so the live table
 * uses a plain INTEGER task_id + a task_title snapshot. Because schema.sql uses
 * `CREATE TABLE IF NOT EXISTS`, existing databases keep the old shape — this
 * migration detects it (missing task_title column) and rebuilds the table,
 * backfilling task_title from the still-live tasks table.
 */
function migrateDeleteRequests(db: BetterSqliteDatabase): void {
  const cols = db.prepare('PRAGMA table_info(task_delete_requests)').all() as {
    name: string;
  }[];
  if (cols.length === 0) return; // table not created yet (fresh boot applies schema first)
  if (cols.some((c) => c.name === 'task_title')) return; // already migrated

  db.exec(`
    CREATE TABLE task_delete_requests_new (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id      INTEGER NOT NULL,
      task_title   TEXT NOT NULL DEFAULT '',
      requested_by INTEGER NOT NULL REFERENCES users(id),
      reason       TEXT,
      status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
      reviewed_by  INTEGER REFERENCES users(id),
      reviewed_at  TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO task_delete_requests_new
      (id, task_id, task_title, requested_by, reason, status, reviewed_by, reviewed_at, created_at)
      SELECT r.id, r.task_id, COALESCE(t.title, 'Deleted task'), r.requested_by, r.reason,
             r.status, r.reviewed_by, r.reviewed_at, r.created_at
      FROM task_delete_requests r
      LEFT JOIN tasks t ON t.id = r.task_id;
    DROP TABLE task_delete_requests;
    ALTER TABLE task_delete_requests_new RENAME TO task_delete_requests;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_delreq_one_pending
      ON task_delete_requests(task_id) WHERE status = 'pending';
  `);
  console.warn('[db] migrated task_delete_requests (task_title snapshot, no delete cascade).');
}

/** Apply schema.sql (idempotent) and seed the admin account if needed. */
function initialize(db: BetterSqliteDatabase): void {
  if (_initialized) return;
  db.exec(schemaSql);
  migrateDeleteRequests(db);
  seedUsersIfEmpty(db);
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
