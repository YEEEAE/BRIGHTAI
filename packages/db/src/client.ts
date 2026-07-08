/**
 * @brightai/db — Prisma client with RLS-aware transaction wrapper.
 *
 * Two flavors of client:
 *   - `db`             — application queries, subject to RLS
 *   - `dbServiceRole`  — admin / migrations / cross-tenant queries
 *
 * Usage (application):
 *
 *   import { db, withTenant } from '@brightai/db';
 *
 *   const policies = await withTenant(orgId, userId, async (tx) => {
 *     return tx.policy.findMany();
 *   });
 *
 * Usage (admin / migrations):
 *
 *   import { dbServiceRole } from '@brightai/db';
 *   await dbServiceRole.organization.delete({ where: { id } });
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __brightai_prisma__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __brightai_prisma_service__: PrismaClient | undefined;
}

const baseConfig = {
  log: (
    process.env.NODE_ENV === 'development'
      ? ['warn', 'error'] as const
      : ['error'] as const
  ),
};

/** Application client — subject to RLS. Use this 99% of the time. */
export const db: PrismaClient =
  global.__brightai_prisma__ ??
  new PrismaClient(baseConfig);

if (process.env.NODE_ENV !== 'production') {
  global.__brightai_prisma__ = db;
}

/** Service-role client — BYPASSRLS. Use sparingly: migrations, admin ops. */
export const dbServiceRole: PrismaClient =
  global.__brightai_prisma_service__ ??
  new PrismaClient({
    ...baseConfig,
    // Service role uses a separate DATABASE_URL (DATABASE_URL_SERVICE)
    // in production. In dev it falls back to the same URL — RLS is still
    // safe because dev never uses real data.
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL_SERVICE ??
          process.env.DATABASE_URL ??
          '',
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.__brightai_prisma_service__ = dbServiceRole;
}

/**
 * Run `fn` inside a transaction with `app.current_org_id` and
 * `app.current_user_id` set via `SET LOCAL`. The session-local config
 * only lives for this transaction, so leakage between requests is
 * impossible.
 *
 * Every tenant-scoped query MUST go through this helper.
 */
export async function withTenant<T>(
  orgId: string,
  userId: string | null,
  fn: (
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    // SET LOCAL configures the value only for the current transaction.
    // Two separate SETs because each parameter requires its own call.
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_org_id', $1, true)`,
      orgId,
    );
    if (userId) {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_user_id', $1, true)`,
        userId,
      );
    }
    return fn(tx as unknown as Parameters<typeof fn>[0]);
  });
}

/**
 * Like `withTenant`, but with `app.is_service = 'true'` set so the
 * `is_service_role()` UDF returns true. Used for trusted background
 * jobs (retention sweepers, billing sync, etc.) that need cross-tenant
 * access but want a clear audit trail.
 */
export async function withServiceRole<T>(
  fn: (
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) => Promise<T>,
): Promise<T> {
  return dbServiceRole.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.is_service', 'true', true)`,
    );
    return fn(tx as unknown as Parameters<typeof fn>[0]);
  });
}

/**
 * Resolves a tenant from a subdomain like `acme.brightai.site`.
 * Returns the organization id or null.
 *
 * Uses the service-role client because the request hasn't been
 * authenticated yet at this point in the request lifecycle.
 */
export async function resolveTenantFromSlug(
  slug: string,
): Promise<{ id: string; name: string; nameAr: string } | null> {
  const org = await dbServiceRole.organization.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, nameAr: true },
  });
  return org;
}