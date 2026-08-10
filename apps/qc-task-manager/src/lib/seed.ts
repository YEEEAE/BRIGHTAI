// Startup seeder for QC Task Manager.
//
// Seeds ONE admin account when the `users` table is empty:
//   username           'admin'
//   role               'admin'
//   department         'QC'
//   can_create_tasks   1
//   password           env ADMIN_DEFAULT_PASSWORD, fallback 'admin123' (bcrypt-hashed).
//
// A console warning is printed if the default password is still in use so the
// operator knows to change it on first boot.

import bcrypt from 'bcryptjs';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD ?? 'admin123';
const IS_DEFAULT_PASSWORD = DEFAULT_PASSWORD === 'admin123';

/** True if the users table has zero rows (i.e. fresh database). */
export function isUsersEmpty(db: BetterSqliteDatabase): boolean {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  return n === 0;
}

/** True if the admin account already exists (by username). */
export function adminExists(db: BetterSqliteDatabase): boolean {
  const { n } = db
    .prepare("SELECT COUNT(*) AS n FROM users WHERE username = 'admin'")
    .get() as { n: number };
  return n > 0;
}

/**
 * Seed the admin account if no users exist. Idempotent: no-op once any user is present.
 * Returns true if a row was actually inserted.
 */
export function seedAdminIfEmpty(db: BetterSqliteDatabase): boolean {
  if (!isUsersEmpty(db)) return false;

  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  db.prepare(
    `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
     VALUES (@username, @password_hash, @full_name, @role, @department, @can_create_tasks, @is_active)`,
  ).run({
    username: 'admin',
    password_hash: hash,
    full_name: 'Administrator',
    role: 'admin',
    department: 'QC',
    can_create_tasks: 1,
    is_active: 1,
  });

  console.warn('[seed] admin account created (username: "admin").');
  if (IS_DEFAULT_PASSWORD) {
    console.warn(
      '[seed] ⚠️  ADMIN_DEFAULT_PASSWORD is not set — the admin password is the default "admin123".',
    );
    console.warn('[seed] ⚠️  Set ADMIN_DEFAULT_PASSWORD before exposing the app beyond localhost.');
  } else {
    console.warn('[seed] admin password sourced from ADMIN_DEFAULT_PASSWORD.');
  }
  return true;
}
