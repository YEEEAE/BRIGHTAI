// Initialize the QC Task Manager SQLite database.
// Run: `pnpm --filter qc-task-manager db:init` (or `db:reset` to wipe first).
//
// Applies db/schema.sql then seeds users with REAL bcrypt hashes (generated at
// runtime via bcryptjs) so the seeded accounts actually work for login.
// `db/seed.sql` is kept as a reference document but the authoritative seed
// lives here so passwords are never stored as stale literals.

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
const DEFAULT_PASSWORD = process.env.QC_SEED_PASSWORD || 'password123';

const SEED_USERS = [
  { username: 'admin',      full_name: 'Site Admin',       email: 'admin@qc.local',      role: 'admin',      can_create_tasks: 1 },
  { username: 'manager',    full_name: 'Task Manager',     email: 'manager@qc.local',    role: 'manager',    can_create_tasks: 1 },
  { username: 'supervisor', full_name: 'Team Supervisor',  email: 'supervisor@qc.local', role: 'supervisor', can_create_tasks: 1 },
  { username: 'employee',   full_name: 'Staff Employee',   email: 'employee@qc.local',   role: 'employee',   can_create_tasks: 0 },
  { username: 'emp_creator',full_name: 'Creator Employee', email: 'creator@qc.local',    role: 'employee',   can_create_tasks: 1 },
];

function ensureDir() {
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
}

function applySchema(db) {
  const sql = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(sql);
}

function seedUsers(db) {
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const stmt = db.prepare(`
    INSERT INTO users (username, full_name, email, password_hash, role, can_create_tasks, is_active)
    VALUES (@username, @full_name, @email, @password_hash, @role, @can_create_tasks, 1)
    ON CONFLICT(username) DO UPDATE SET
      full_name=excluded.full_name,
      email=excluded.email,
      password_hash=excluded.password_hash,
      role=excluded.role,
      can_create_tasks=excluded.can_create_tasks,
      updated_at=datetime('now')
  `);
  const tx = db.transaction((rows) => rows.forEach((r) => stmt.run({ ...r, password_hash: hash })));
  tx(SEED_USERS);
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
  seedUsers(db);

  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  db.close();

  console.log(`[init-db] database ready at: ${DB_PATH}`);
  console.log(`[init-db] seeded ${count.n} users (password: "${DEFAULT_PASSWORD}")`);
  console.log('[init-db] logins: admin, manager, supervisor, employee, emp_creator');
}

main();
