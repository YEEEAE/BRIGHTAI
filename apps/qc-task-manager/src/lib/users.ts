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
import { getDb, toBool } from './db';
import { passwordResetSchema, userCreateSchema, userEditSchema } from './validation';
import type { Role } from './types';

export interface CreateUserInput {
  username: string;
  fullName: string;
  password: string;
  role: Role;
  /** Free-text department; empty/missing falls back to 'QC' (per spec). */
  department?: string;
  canCreateTasks: boolean;
}

/** Fields an admin may edit on an existing user (username is immutable). */
export interface EditUserInput {
  fullName?: string;
  role?: Role;
  department?: string;
  canCreateTasks?: boolean;
  isActive?: boolean;
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
 *
 * The admin-chosen password is a TEMPORARY credential: the account is flagged
 * must_change_password = 1 so the first login is forced through the
 * password-change flow before the app becomes usable.
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
      `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
    )
    .run(
      username,
      hash,
      input.fullName.trim(),
      input.role,
      input.department?.trim() || 'QC',
      input.canCreateTasks ? 1 : 0,
    );

  const userId = Number(info.lastInsertRowid);
  log(actor, `created user id=${userId} username="${username}" role=${input.role} department=${input.department?.trim() || 'QC'} can_create_tasks=${input.canCreateTasks ? 1 : 0} must_change_password=1`);
  return { ok: true, userId };
}

/** Look up a user row for guard checks and edit-merge (never selects the hash). */
function findUser(targetUserId: number): {
  id: number;
  username: string;
  role: Role;
  full_name: string;
  department: string;
  can_create_tasks: number;
  is_active: number;
} | undefined {
  return getDb()
    .prepare(
      `SELECT id, username, role, full_name, department, can_create_tasks, is_active
       FROM users WHERE id = ?`,
    )
    .get(targetUserId) as {
    id: number;
    username: string;
    role: Role;
    full_name: string;
    department: string;
    can_create_tasks: number;
    is_active: number;
  } | undefined;
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
  // Reactivation also clears any brute-force lock so the account is usable
  // immediately (deactivation leaves the lock untouched until re-enabled).
  if (active) {
    getDb()
      .prepare(
        'UPDATE users SET is_active = 1, failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      )
      .run(targetUserId);
  } else {
    getDb().prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(targetUserId);
  }
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

/**
 * Edit a user (full name, role, department, can_create_tasks, is_active).
 *
 * Server-side safety rules (enforced here so no endpoint can bypass them):
 *   - An admin may never change their own role (no self-demotion).
 *   - An admin may never deactivate their own account.
 *   - Username is not part of the payload — it is immutable after creation.
 *
 * Missing fields merge onto the current row, then the FULL merged payload is
 * validated through the Zod schema — all forms are server-side validated.
 */
export function updateUser(
  actor: { id: number; username: string },
  targetUserId: number,
  input: EditUserInput,
): UserActionResult {
  const target = findUser(targetUserId);
  if (!target) return { ok: false, error: 'User not found.' };

  const merged = {
    fullName: input.fullName ?? target.full_name,
    role: input.role ?? target.role,
    department: input.department ?? target.department,
    canCreateTasks: input.canCreateTasks ?? toBool(target.can_create_tasks),
    isActive: input.isActive ?? toBool(target.is_active),
  };
  const validation = userEditSchema.safeParse(merged);
  if (!validation.success) {
    return { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const next = validation.data;

  // Self-account guards (spec safety rule #6).
  if (targetUserId === actor.id) {
    if (next.role !== target.role) {
      return { ok: false, error: 'You cannot change your own role.' };
    }
    if (!next.isActive) {
      return { ok: false, error: 'You cannot deactivate your own account.' };
    }
  }

  const now = new Date().toISOString();
  const db = getDb();
  // Reactivation via the edit form must behave exactly like the toggle button:
  // clearing any brute-force lock so the account is usable immediately
  // (otherwise a re-enabled user could stay locked out from old failures).
  const reactivating = !toBool(target.is_active) && next.isActive;
  if (reactivating) {
    db.prepare(
      `UPDATE users SET full_name = ?, role = ?, department = ?, can_create_tasks = ?, is_active = ?, updated_at = ?,
              failed_login_attempts = 0, locked_until = NULL
       WHERE id = ?`,
    ).run(
      next.fullName,
      next.role,
      next.department,
      next.canCreateTasks ? 1 : 0,
      next.isActive ? 1 : 0,
      now,
      targetUserId,
    );
  } else {
    db.prepare(
      `UPDATE users SET full_name = ?, role = ?, department = ?, can_create_tasks = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      next.fullName,
      next.role,
      next.department,
      next.canCreateTasks ? 1 : 0,
      next.isActive ? 1 : 0,
      now,
      targetUserId,
    );
  }

  // Audit: list ONLY the fields that actually changed (never the hash).
  const changes: string[] = [];
  if (next.fullName !== target.full_name) changes.push(`full_name: "${target.full_name}" → "${next.fullName}"`);
  if (next.role !== target.role) changes.push(`role: ${target.role} → ${next.role}`);
  if (next.department !== target.department) changes.push(`department: "${target.department}" → "${next.department}"`);
  if (next.canCreateTasks !== toBool(target.can_create_tasks)) {
    changes.push(`can_create_tasks: ${toBool(target.can_create_tasks) ? 1 : 0} → ${next.canCreateTasks ? 1 : 0}`);
  }
  if (next.isActive !== toBool(target.is_active)) {
    changes.push(`is_active: ${toBool(target.is_active) ? 1 : 0} → ${next.isActive ? 1 : 0}`);
  }
  log(
    actor,
    `edited user id=${targetUserId} username="${target.username}"${changes.length > 0 ? ` (${changes.join(', ')})` : ' (no changes)'}${reactivating ? ' (lock cleared)' : ''}`,
  );
  return { ok: true };
}

/**
 * Set a new password for a user (admin-provided, min 8 chars, bcrypt-hashed).
 *
 * The admin-chosen password is treated as a TEMPORARY credential: the account
 * is flagged must_change_password = 1 again so the target user is forced
 * through the password-change flow on their next login. Existing sessions of
 * the target stay alive but the middleware immediately confines them to the
 * password-change flow (the flag is re-read from the users row per request).
 */
export function resetPassword(
  actor: { id: number; username: string },
  targetUserId: number,
  newPassword: string,
): UserActionResult {
  // Server-side Zod validation (spec rule #10).
  const validation = passwordResetSchema.safeParse({ newPassword });
  if (!validation.success) {
    return { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const target = findUser(targetUserId);
  if (!target) return { ok: false, error: 'User not found.' };

  const hash = bcrypt.hashSync(newPassword, 10);
  // A fresh password also clears any brute-force lock: the admin reset is the
  // sanctioned way to unblock an account.
  getDb()
    .prepare(
      `UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL,
              must_change_password = 1, password_changed_at = NULL
       WHERE id = ?`,
    )
    .run(hash, targetUserId);
  log(actor, `reset password for username="${target.username}"(id=${targetUserId}) must_change_password=1`);
  return { ok: true };
}
