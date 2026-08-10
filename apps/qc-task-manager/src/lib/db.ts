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

/** Apply schema.sql (idempotent) and seed the admin account if needed. */
function initialize(db: BetterSqliteDatabase): void {
  if (_initialized) return;
  db.exec(schemaSql);
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
