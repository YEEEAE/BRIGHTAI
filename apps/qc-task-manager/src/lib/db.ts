// SQLite connection singleton for QC Task Manager.
// WAL mode enabled per spec. The DB file lives at db/qc_tasks.db (override via QC_DB_PATH).

import Database from 'better-sqlite3';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to <app>/db/qc_tasks.db. From src/lib/ that's ../../db/qc_tasks.db.
const DB_DIR = resolve(__dirname, '..', '..', 'db');
const DB_PATH = process.env.QC_DB_PATH || resolve(DB_DIR, 'qc_tasks.db');

let _db: BetterSqliteDatabase | null = null;

/** Ensure the db directory exists (db file is created on first open). */
function ensureDir() {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
}

/**
 * Open (or reuse) the SQLite connection. WAL mode + foreign keys are applied
 * once per connection. Safe to call repeatedly — returns the same instance.
 */
export function getDb(): BetterSqliteDatabase {
  if (_db) return _db;

  ensureDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  _db = db;
  return db;
}

/** Convert a 0/1 SQLite integer into a boolean. */
export function toBool(value: number | null | undefined): boolean {
  return Number(value) === 1;
}

export { DB_PATH };
