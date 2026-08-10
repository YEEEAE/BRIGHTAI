// Startup seeder for QC Task Manager.
//
// Seeds ONE account per role when the `users` table is empty, so the role-based
// home router can be exercised end-to-end on a fresh database:
//   username     role        full name        can_create_tasks
//   admin        admin       Administrator    1
//   manager      manager     Department Manager   1
//   supervisor   supervisor  Team Supervisor  1
//   employee     employee    QC Employee      0
//
// Every account uses ADMIN_DEFAULT_PASSWORD (fallback 'admin123'),
// bcrypt-hashed at runtime. The password is only used on the first boot (seed
// runs when the users table is empty).

import bcrypt from 'bcryptjs';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import type { Role } from './types';

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
const IS_DEFAULT_PASSWORD = DEFAULT_PASSWORD === 'admin123';

interface SeedUser {
  username: string;
  full_name: string;
  role: Role;
  can_create_tasks: number;
}

const SEED_USERS: SeedUser[] = [
  { username: 'admin', full_name: 'Administrator', role: 'admin', can_create_tasks: 1 },
  { username: 'manager', full_name: 'Department Manager', role: 'manager', can_create_tasks: 1 },
  { username: 'supervisor', full_name: 'Team Supervisor', role: 'supervisor', can_create_tasks: 1 },
  // Employees create tasks ONLY when can_create_tasks = 1 (CORE BUSINESS RULE #1).
  { username: 'employee', full_name: 'QC Employee', role: 'employee', can_create_tasks: 0 },
];

/** True if the users table has zero rows (i.e. fresh database). */
export function isUsersEmpty(db: BetterSqliteDatabase): boolean {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  return n === 0;
}

/**
 * Seed one account per role if no users exist. Idempotent: no-op once any user
 * is present. Returns the number of rows actually inserted.
 */
export function seedUsersIfEmpty(db: BetterSqliteDatabase): number {
  if (!isUsersEmpty(db)) return 0;

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

  console.warn(`[seed] seeded ${SEED_USERS.length} accounts (admin, manager, supervisor, employee).`);
  if (IS_DEFAULT_PASSWORD) {
    console.warn(
      '[seed] ⚠️  ADMIN_DEFAULT_PASSWORD is not set — every seeded account uses the default "admin123".',
    );
    console.warn('[seed] ⚠️  Set ADMIN_DEFAULT_PASSWORD before exposing the app beyond localhost.');
  } else {
    console.warn('[seed] seeded accounts use ADMIN_DEFAULT_PASSWORD.');
  }
  return SEED_USERS.length;
}
