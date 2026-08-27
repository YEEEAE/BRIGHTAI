// User management layer for the admin area (/admin/users). Admin only.
//
// Rules enforced here (per spec):
//   - Username cannot be changed after creation — there is no update path for it.
//   - An admin cannot deactivate their own account (both the UI and this layer
//     enforce the rule).
//   - Passwords are bcrypt-hashed; hashes are never returned or logged, and the
//     reset endpoint never logs the new password.
//   - User-management actions are appended transactionally to qc_audit_log,
//     the existing durable and hash-chained application audit system.

import bcrypt from 'bcryptjs';
import { getDb, toBool } from './db';
import { appendQcAudit } from './audit/qcChain';
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

type UserAuditSnapshot = {
  username: string;
  fullName: string;
  role: Role;
  department: string;
  canCreateTasks: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
};

function userAuditSnapshot(user: {
  username: string;
  full_name: string;
  role: Role;
  department: string;
  can_create_tasks: number;
  is_active: number;
  must_change_password?: number;
}): UserAuditSnapshot {
  return {
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    department: user.department,
    canCreateTasks: toBool(user.can_create_tasks),
    isActive: toBool(user.is_active),
    mustChangePassword: toBool(user.must_change_password ?? 0),
  };
}

function appendUserAudit(
  db: ReturnType<typeof getDb>,
  actor: { id: number },
  targetUserId: number,
  action: 'USER_CREATE' | 'USER_UPDATE' | 'USER_ROLE_CHANGE' | 'USER_ACTIVATE' | 'USER_DEACTIVATE' | 'USER_PASSWORD_RESET',
  before: UserAuditSnapshot | null,
  after: UserAuditSnapshot,
  note: string,
): void {
  appendQcAudit(db, {
    entityType: 'USER',
    entityId: targetUserId,
    actorId: actor.id,
    action,
    oldValue: before ? JSON.stringify(before) : null,
    newValue: JSON.stringify(after),
    note,
  });
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
  const fullName = input.fullName.trim();
  const department = input.department?.trim() || 'QC';
  const userId = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active, must_change_password)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
      )
      .run(username, hash, fullName, input.role, department, input.canCreateTasks ? 1 : 0);
    const id = Number(info.lastInsertRowid);
    appendUserAudit(db, actor, id, 'USER_CREATE', null, {
      username,
      fullName,
      role: input.role,
      department,
      canCreateTasks: input.canCreateTasks,
      isActive: true,
      mustChangePassword: true,
    }, `target_username=${username}`);
    return id;
  })();
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
  must_change_password: number;
} | undefined {
  return getDb()
    .prepare(
      `SELECT id, username, role, full_name, department, can_create_tasks, is_active, must_change_password
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
    must_change_password: number;
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
  const db = getDb();
  const before = userAuditSnapshot(target);
  db.transaction(() => {
    if (active) {
      db
      .prepare(
        'UPDATE users SET is_active = 1, failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      )
      .run(targetUserId);
    } else {
      db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(targetUserId);
    }
    appendUserAudit(db, actor, targetUserId, active ? 'USER_ACTIVATE' : 'USER_DEACTIVATE', before, {
      ...before,
      isActive: active,
    }, `target_username=${target.username}`);
  })();
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
  const db = getDb();
  const before = userAuditSnapshot(target);
  db.transaction(() => {
    db.prepare('UPDATE users SET can_create_tasks = ? WHERE id = ?').run(value ? 1 : 0, targetUserId);
    appendUserAudit(db, actor, targetUserId, 'USER_UPDATE', before, {
      ...before,
      canCreateTasks: value,
    }, `target_username=${target.username}; fields=canCreateTasks`);
  })();
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
  const before = userAuditSnapshot(target);
  db.transaction(() => {
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
    const after: UserAuditSnapshot = {
      ...before,
      fullName: next.fullName,
      role: next.role,
      department: next.department,
      canCreateTasks: next.canCreateTasks,
      isActive: next.isActive,
    };
    const action = next.role !== target.role
      ? 'USER_ROLE_CHANGE'
      : next.isActive !== toBool(target.is_active)
        ? (next.isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE')
        : 'USER_UPDATE';
    appendUserAudit(db, actor, targetUserId, action, before, after, `target_username=${target.username}`);
  })();
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
  const db = getDb();
  const before = userAuditSnapshot(target);
  db.transaction(() => {
    db
      .prepare(
      `UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL,
              must_change_password = 1, password_changed_at = NULL
       WHERE id = ?`,
      )
      .run(hash, targetUserId);
    appendUserAudit(db, actor, targetUserId, 'USER_PASSWORD_RESET', before, {
      ...before,
      mustChangePassword: true,
    }, `target_username=${target.username}; password_reset=admin`);
  })();
  return { ok: true };
}
