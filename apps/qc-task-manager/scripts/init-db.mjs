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
const DB_PATH = process.env.QC_DB_PATH || resolve(DB_DIR, 'qc_tasks.db');
const SCHEMA_PATH = resolve(DB_DIR, 'schema.sql');

const RESET = process.argv.includes('--reset');
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

  applySchema(db);
  seedUsersIfEmpty(db);

  const { tableCount } = db
    .prepare(
      `SELECT COUNT(*) AS tableCount FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
    )
    .get();
  const { userCount } = db.prepare('SELECT COUNT(*) AS userCount FROM users').get();
  db.close();

  console.log(`[init-db] database ready at: ${DB_PATH}`);
  console.log(`[init-db] tables: ${tableCount}, users: ${userCount}`);
}

main();
