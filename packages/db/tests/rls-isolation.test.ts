/**
 * @brightai/db — RLS isolation test
 *
 * Verifies the database actually refuses to leak data between tenants,
 * even if the application code forgets to call `withTenant()`.
 *
 * Strategy:
 *   1. Create 2 organizations (alpha, beta) with one policy each.
 *   2. Connect as `brightai_app` (RLS subject) with each tenant context.
 *   3. Confirm alpha sees only alpha's policy, beta sees only beta's.
 *   4. Connect as `brightai_service` (BYPASSRLS) and confirm both.
 *
 * Run:  pnpm --filter @brightai/db db:rls:test
 *
 * Requires: docker compose up -d && setup-local-db.mjs && prisma migrate dev
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const APP_URL =
  process.env.DATABASE_URL_APP ??
  'postgresql://brightai_app:brightai_app@localhost:5432/brightai_dev';

const SERVICE_URL =
  process.env.DATABASE_URL_SERVICE ??
  process.env.DATABASE_URL ??
  'postgresql://brightai_admin:brightai_admin@localhost:5432/brightai_dev';

const admin = new PrismaClient({ datasources: { db: { url: SERVICE_URL } } });
const app = new PrismaClient({ datasources: { db: { url: APP_URL } } });

const ALPHA = `alpha_${randomBytes(3).toString('hex')}`;
const BETA = `beta_${randomBytes(3).toString('hex')}`;
const ALPHA_USER = `usr_alpha_${randomBytes(3).toString('hex')}`;
const BETA_USER = `usr_beta_${randomBytes(3).toString('hex')}`;
const ALPHA_ORG_ID = `org_${randomBytes(6).toString('hex')}`;
const BETA_ORG_ID = `org_${randomBytes(6).toString('hex')}`;

let alphaUserId: string;
let betaUserId: string;
let alphaPolicyId: string;
let betaPolicyId: string;

function hashToken(t: string) {
  return createHash('sha256').update(t).digest('hex');
}

async function withTenant(
  orgId: string,
  userId: string | null,
  fn: (tx: PrismaClient) => Promise<unknown>,
) {
  return app.$transaction(async (tx) => {
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
    return fn(tx as unknown as PrismaClient);
  });
}

beforeAll(async () => {
  // Provision two tenants with admin client wrapped in a transaction.
  // The transaction holds a single PG connection, and the SET LOCAL
  // config persists for the entire transaction. This is the only way
  // to make is_service_role() = true across multiple admin queries when
  // the admin role doesn't have BYPASSRLS by default.
  await admin.$transaction(async (setup) => {
    await setup.$executeRawUnsafe(`SELECT set_config('app.is_service', 'true', true)`);
  // Provision two tenants with admin client (BYPASSRLS)
  await admin.user.create({
    data: {
      id: ALPHA_USER,
      clerkUserId: `clerk_${ALPHA_USER}`,
      email: `${ALPHA}@test.local`,
      fullName: 'Alpha User',
    },
  });
  await admin.user.create({
    data: {
      id: BETA_USER,
      clerkUserId: `clerk_${BETA_USER}`,
      email: `${BETA}@test.local`,
      fullName: 'Beta User',
    },
  });
  await admin.organization.create({
    data: {
      id: ALPHA_ORG_ID,
      slug: ALPHA,
      name: 'Alpha',
      nameAr: 'ألفا',
      industry: 'OTHER',
      size: 'SIZE_1_10',
      deployment: 'CLOUD',
    },
  });
  await admin.organization.create({
    data: {
      id: BETA_ORG_ID,
      slug: BETA,
      name: 'Beta',
      nameAr: 'بيتا',
      industry: 'OTHER',
      size: 'SIZE_1_10',
      deployment: 'CLOUD',
    },
  });
  await admin.membership.create({
    data: {
      organizationId: ALPHA_ORG_ID,
      userId: ALPHA_USER,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });
  await admin.membership.create({
    data: {
      organizationId: BETA_ORG_ID,
      userId: BETA_USER,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });
  const a = await admin.policy.create({
    data: {
      organizationId: ALPHA_ORG_ID,
      name: 'Alpha policy',
      nameAr: 'سياسة ألفا',
      description: 'alpha-only',
      descriptionAr: 'لفا فقط',
      category: 'DATA_PRIVACY', // fixed: was DOMAIN_ALLOW (not a valid enum value)
      status: 'ACTIVE',
      priority: 100,
      createdById: ALPHA_USER,
      rules: {}, // Policy.rules is required (Json) — added 2026-07-18
    },
  });
  const b = await admin.policy.create({
    data: {
      organizationId: BETA_ORG_ID,
      name: 'Beta policy',
      nameAr: 'سياسة بيتا',
      description: 'beta-only',
      descriptionAr: 'بيتا فقط',
      category: 'DATA_PRIVACY', // fixed: was DOMAIN_ALLOW (not a valid enum value)
      status: 'ACTIVE',
      priority: 100,
      createdById: BETA_USER,
      rules: {}, // Policy.rules is required (Json) — added 2026-07-18
    },
  });
  alphaPolicyId = a.id;
  betaPolicyId = b.id;
  alphaUserId = ALPHA_USER;
  betaUserId = BETA_USER;
  }); // end setup transaction
});

afterAll(async () => {
  // Cleanup (admin has BYPASSRLS so it can delete across tenants)
  await admin.policy.deleteMany({
    where: { organizationId: { in: [ALPHA_ORG_ID, BETA_ORG_ID] } },
  });
  await admin.membership.deleteMany({
    where: { organizationId: { in: [ALPHA_ORG_ID, BETA_ORG_ID] } },
  });
  await admin.organization.deleteMany({
    where: { id: { in: [ALPHA_ORG_ID, BETA_ORG_ID] } },
  });
  await admin.user.deleteMany({
    where: { id: { in: [ALPHA_USER, BETA_USER] } },
  });
  await admin.$disconnect();
  await app.$disconnect();
});

describe('RLS — alpha tenant', () => {
  it('sees only its own policy', async () => {
    const policies = (await withTenant(
      ALPHA_ORG_ID,
      alphaUserId,
      (tx) => tx.policy.findMany(),
    )) as { id: string; organizationId: string }[];

    expect(policies.length).toBeGreaterThan(0);
    expect(policies.every((p) => p.organizationId === ALPHA_ORG_ID)).toBe(true);
    expect(policies.find((p) => p.id === alphaPolicyId)).toBeDefined();
    expect(policies.find((p) => p.id === betaPolicyId)).toBeUndefined();
  });

  it('cannot read beta org by id', async () => {
    const result = (await withTenant(ALPHA_ORG_ID, alphaUserId, (tx) =>
      tx.organization.findUnique({ where: { id: BETA_ORG_ID } }),
    )) as unknown;
    expect(result).toBeNull();
  });

  it('cannot insert into beta org (WITH CHECK)', async () => {
    await expect(
      withTenant(ALPHA_ORG_ID, alphaUserId, (tx) =>
        tx.policy.create({
          data: {
            organizationId: BETA_ORG_ID, // ← try to leak
            name: 'leak attempt',
            nameAr: 'محاولة تسريب',
            description: 'should fail',
            descriptionAr: 'لازم يفشل',
            category: 'DATA_PRIVACY', // fixed: was DOMAIN_ALLOW
            status: 'DRAFT',
            priority: 1,
            createdById: BETA_USER,
            rules: {},
          },
        }),
      ),
    ).rejects.toThrow();
  });
});

describe('RLS — beta tenant', () => {
  it('sees only its own policy', async () => {
    const policies = (await withTenant(BETA_ORG_ID, betaUserId, (tx) =>
      tx.policy.findMany(),
    )) as { id: string; organizationId: string }[];

    expect(policies.length).toBeGreaterThan(0);
    expect(policies.every((p) => p.organizationId === BETA_ORG_ID)).toBe(true);
    expect(policies.find((p) => p.id === betaPolicyId)).toBeDefined();
    expect(policies.find((p) => p.id === alphaPolicyId)).toBeUndefined();
  });
});

describe('Service role (BYPASSRLS)', () => {
  it('sees policies from both tenants', async () => {
    const all = await admin.policy.findMany({
      where: { organizationId: { in: [ALPHA_ORG_ID, BETA_ORG_ID] } },
    });
    const orgIds = new Set(all.map((p) => p.organizationId));
    expect(orgIds.has(ALPHA_ORG_ID)).toBe(true);
    expect(orgIds.has(BETA_ORG_ID)).toBe(true);
  });
});
