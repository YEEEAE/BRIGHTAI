/**
 * @brightai/dashboard — Session + membership helpers
 *
 * Server-only. Use in server components and route handlers to:
 *   - Get the current user (from Clerk)
 *   - Resolve the user's membership in the current tenant
 *   - Enforce role / permission gates
 *
 * The chain:
 *   Clerk auth → current user (id, email)
 *   DB lookup → Membership for (userId, currentOrgId)
 *   RBAC → role + permissions
 */

import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { dbServiceRole, withTenant } from '@brightai/db';
import type { Membership, User, Role } from '@brightai/db';
import { ForbiddenError, requirePermission, requireRoleAtLeast, hasPermission } from '@brightai/config';
import type { Permission } from '@brightai/config';
import { requireTenant } from './tenant';

export type SessionContext = {
  clerkUserId: string;
  user: Pick<User, 'id' | 'email' | 'fullName' | 'fullNameAr' | 'primaryLocale' | 'emailVerified' | 'twoFactorEnabled'>;
  tenant: { id: string; slug: string; name: string; nameAr: string };
  membership: Pick<Membership, 'id' | 'role' | 'status' | 'joinedAt'>;
};

/**
 * Resolve the full session context for the current request.
 *
 * - Throws if the user is not authenticated.
 * - Throws if the request is not on a tenant subdomain.
 * - Throws if the user has no ACTIVE membership in the tenant.
 * - Auto-syncs the Clerk user to the local User table (first login).
 */
export async function getSessionContext(): Promise<SessionContext> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    const err = new Error('Not authenticated.');
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }

  const tenantCtx = await requireTenant();
  const tenant = tenantCtx.organization;

  // Resolve (and create-on-first-login) the local User row.
  const user = await dbServiceRole.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email: '', // backfilled below
      fullName: '',
    },
    update: {},
  });

  // Backfill email + name from Clerk on first login.
  const clerkUser = await currentUser();
  if (clerkUser && (user.email === '' || user.fullName === '')) {
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? user.email;
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || user.fullName;
    const fullNameAr = clerkUser.publicMetadata?.fullNameAr as string | undefined;
    const primaryLocale = (clerkUser.publicMetadata?.locale as 'ar' | 'en' | undefined) ?? user.primaryLocale;
    await dbServiceRole.user.update({
      where: { id: user.id },
      data: { email, fullName, fullNameAr, primaryLocale },
    });
    user.email = email;
    user.fullName = fullName;
    user.fullNameAr = fullNameAr;
    user.primaryLocale = primaryLocale;
  }

  // Resolve membership. Auto-create on first visit (the user is an OWNER
  // if they're the first one, otherwise MEMBER).
  let membership = await dbServiceRole.membership.findUnique({
    where: { organizationId_userId: { organizationId: tenant.id, userId: user.id } },
  });

  if (!membership) {
    const existingCount = await dbServiceRole.membership.count({ where: { organizationId: tenant.id } });
    const role: Role = existingCount === 0 ? 'OWNER' : 'MEMBER';
    membership = await dbServiceRole.membership.create({
      data: {
        organizationId: tenant.id,
        userId: user.id,
        role,
        status: 'ACTIVE',
        acceptedAt: new Date(),
        joinedAt: new Date(),
      },
    });
    // Audit
    await dbServiceRole.auditLog.create({
      data: {
        organizationId: tenant.id,
        actorType: 'USER',
        actorId: user.id,
        action: 'MEMBERSHIP_CREATED',
        metadata: { role, firstUser: existingCount === 0 },
      },
    });
  }

  if (membership.status !== 'ACTIVE') {
    const err = new Error(`Membership is ${membership.status.toLowerCase()}.`);
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  return {
    clerkUserId,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      fullNameAr: user.fullNameAr,
      primaryLocale: user.primaryLocale,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    tenant,
    membership: {
      id: membership.id,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
    },
  };
}

/**
 * Convenience for server components: require a specific permission.
 * Throws ForbiddenError if not granted.
 */
export async function requireSessionPermission(permission: Permission): Promise<SessionContext> {
  const ctx = await getSessionContext();
  requirePermission(ctx.membership.role, permission);
  return ctx;
}

/**
 * Convenience for server components: require a minimum role tier.
 */
export async function requireSessionRoleAtLeast(minimum: Role): Promise<SessionContext> {
  const ctx = await getSessionContext();
  requireRoleAtLeast(ctx.membership.role, minimum);
  return ctx;
}

/**
 * Boolean variant of requireSessionPermission — does NOT throw.
 * Use in conditional UI rendering.
 */
export async function hasSessionPermission(permission: Permission): Promise<boolean> {
  try {
    const ctx = await getSessionContext();
    return hasPermission(ctx.membership.role, permission);
  } catch {
    return false;
  }
}

/**
 * Run a callback inside a tenant-scoped transaction.
 * Use for any tenant-scoped read/write — the withTenant helper sets
 * the RLS context so the DB enforces isolation.
 */
export async function runInTenantContext<T>(
  ctx: SessionContext,
  fn: (tx: typeof dbServiceRole) => Promise<T>,
): Promise<T> {
  return withTenant(ctx.tenant.id, ctx.user.id, fn) as Promise<T>;
}
