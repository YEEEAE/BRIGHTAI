/**
 * @brightai/config — RBAC guards.
 *
 * Use these on the server (Route Handlers, Server Components, server actions)
 * BEFORE any mutation or sensitive read. Client-side UI gates are
 * cosmetic only — the server is the source of truth.
 *
 * Throw `ForbiddenError` from a guard if the user lacks the permission.
 * Catch it in the route handler to return 403.
 */

import {
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from './constants';

export class ForbiddenError extends Error {
  override readonly name = 'ForbiddenError';
  readonly httpStatus = 403;
  readonly permission: Permission;
  readonly role: Role | null;
  constructor(permission: Permission, role: Role | null) {
    super(
      role
        ? `Role "${role}" lacks permission "${permission}".`
        : `Permission "${permission}" requires an authenticated user.`,
    );
    this.permission = permission;
    this.role = role;
  }
}

/** Does this role have this permission? */
export function hasPermission(role: Role | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Throw `ForbiddenError` if the role lacks the permission. Use as a guard:
 *
 *   requirePermission(membership.role, 'member:invite');
 *   // proceed with invitation
 */
export function requirePermission(
  role: Role | null,
  permission: Permission,
): asserts role is Role {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(permission, role);
  }
}

/**
 * Throw if the role is below `minimum` in the rank table.
 * Useful for tiered checks like "ADMIN or higher".
 */
export function requireRoleAtLeast(
  role: Role | null,
  minimum: Role,
): asserts role is Role {
  if (!role) {
    throw new ForbiddenError('org:read', null);
  }
  // Resolve ranks locally to avoid a circular import.
  const RANK: Record<Role, number> = {
    OWNER: 100,
    ADMIN: 80,
    COMPLIANCE_OFFICER: 60,
    REVIEWER: 40,
    MEMBER: 20,
  };
  if (RANK[role] < RANK[minimum]) {
    throw new ForbiddenError('org:read', role);
  }
}

/**
 * Get every permission granted to a role. Useful for prefetching
 * a UI permissions map for the client (still validate server-side!).
 */
export function getRolePermissions(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}