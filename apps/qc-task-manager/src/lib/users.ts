// User management layer for the admin area (/admin/users). Admin only.
//
// Rules enforced here (per spec):
//   - Username cannot be changed after creation — there is no update path for it.
//   - An admin cannot deactivate their own account (both the UI and this layer
//     enforce the rule).
//   - Passwords are bcrypt-hashed; hashes are never returned or logged, and the
//     reset endpoint never logs the new password.
//   - User-management actions are NOT task-related, so they are logged to the
//     console only. task_activity_log is reserved for task mutations
//     (CORE BUSINESS RULE #6).
//
// Every mutation logs the actor + target in a single line so the console forms
// an audit trail for who changed what and when.

import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { MIN_PASSWORD_LENGTH } from './task-policy';
import { userCreateSchema } from './validation';
import type { Role } from './types';

const ROLES: Role[] = ['admin', 'manager', 'supervisor', 'employee'];

export interface CreateUserInput {
  username: string;
  fullName: string;
  password: string;
  role: Role;
  canCreateTasks: boolean;
}

export type UserActionResult =
  | { ok: true; userId?: number }
  | { ok: false; error: string };

/** Structured console audit line (never includes password hashes or values). */
function log(actor: { id: number; username: string }, message: string): void {
  console.log(`[users] ${new Date().toISOString()} actor=${actor.username}(id=${actor.id}) ${message}`);
}

/**
 * Validate the create-user payload before touching the database.
 * Rules live in the Zod schema (src/lib/validation.ts); this wrapper keeps the
 * existing `{ ok, error }` contract so callers never change.
 */
export function validateCreateUser(input: CreateUserInput): { ok: true } | { ok: false; error: string } {
  const result = userCreateSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid input.' };
  }
  return { ok: true };
}

/**
 * Create a new user. Username must be unique; the account is created active so
 * it can be used immediately (acceptance: admin creates an employee and signs
 * in with it right away).
 */
export function createUser(actor: { id: number; username: string }, input: CreateUserInput): UserActionResult {
  const validation = validateCreateUser(input);
  if (!validation.ok) return validation;

  const db = getDb();
  const username = input.username.trim();
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return { ok: false, error: `Username "${username}" is already taken.` };

  const hash = bcrypt.hashSync(input.password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
       VALUES (?, ?, ?, ?, 'QC', ?, 1)`,
    )
    .run(username, hash, input.fullName.trim(), input.role, input.canCreateTasks ? 1 : 0);

  const userId = Number(info.lastInsertRowid);
  log(actor, `created user id=${userId} username="${username}" role=${input.role} can_create_tasks=${input.canCreateTasks ? 1 : 0}`);
  return { ok: true, userId };
}

/** Look up a minimal user row for guard checks. */
function findUser(targetUserId: number): { id: number; username: string; role: Role } | undefined {
  return getDb()
    .prepare('SELECT id, username, role FROM users WHERE id = ?')
    .get(targetUserId) as { id: number; username: string; role: Role } | undefined;
}

/**
 * Activate or deactivate a user. An admin may never deactivate their own
 * account (spec safety rule); the check lives here so no endpoint can bypass it.
 */
export function setUserActive(
  actor: { id: number; username: string },
  targetUserId: number,
  active: boolean,
): UserActionResult {
  const target = findUser(targetUserId);
  if (!target) return { ok: false, error: 'User not found.' };
  if (targetUserId === actor.id && !active) {
    return { ok: false, error: 'You cannot deactivate your own account.' };
  }
  getDb().prepare('UPDATE users SET is_active = ? WHERE id = ?').run(active ? 1 : 0, targetUserId);
  log(actor, `set active=${active ? 1 : 0} for username="${target.username}"(id=${targetUserId})`);
  return { ok: true };
}

/**
 * Toggle the can_create_tasks flag. Only meaningful for employees (other roles
 * always pass PERMISSIONS.canCreateTask regardless of this flag).
 */
export function setCanCreateTasks(
  actor: { id: number; username: string },
  targetUserId: number,
  value: boolean,
): UserActionResult {
  const target = findUser(targetUserId);
  if (!target) return { ok: false, error: 'User not found.' };
  getDb()
    .prepare('UPDATE users SET can_create_tasks = ? WHERE id = ?')
    .run(value ? 1 : 0, targetUserId);
  log(actor, `set can_create_tasks=${value ? 1 : 0} for username="${target.username}"(id=${targetUserId}, role=${target.role})`);
  return { ok: true };
}

/** Set a new password for a user (admin-provided, min 8 chars, bcrypt-hashed). */
export function resetPassword(
  actor: { id: number; username: string },
  targetUserId: number,
  newPassword: string,
): UserActionResult {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const target = findUser(targetUserId);
  if (!target) return { ok: false, error: 'User not found.' };

  const hash = bcrypt.hashSync(newPassword, 10);
  getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, targetUserId);
  log(actor, `reset password for username="${target.username}"(id=${targetUserId})`);
  return { ok: true };
}
