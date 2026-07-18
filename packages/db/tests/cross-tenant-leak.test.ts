/**
 * @brightai/db — Cross-tenant leak test (P0-1 / 2026-07-18)
 *
 * Covers the 4 tables added to RLS in P0-1:
 *   - org_feature_flags   (per-org overrides)
 *   - ai_usage_entries    (per-org + anon)
 *   - saml_connections    (per-org SSO config)
 *   - feature_flags       (global catalog)
 *
 * Each test creates two tenants (GAMMA + DELTA), inserts per-org rows
 * via the service role (BYPASSRLS), then connects as brightai_app with
 * each tenant context and asserts cross-tenant visibility.
 *
 * Run:  pnpm --filter @brightai/db db:rls:test
 *
 * Requires: docker compose up -d && setup-local-db.mjs && prisma migrate dev
 *           AND the rls.sql policies applied.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';

const APP_URL =
  process.env.DATABASE_URL_APP ??
  'postgresql://brightai_app:brightai_app@localhost:5432/brightai_dev';

const SERVICE_URL =
  process.env.DATABASE_URL_SERVICE ??
  process.env.DATABASE_URL ??
  'postgresql://brightai_admin:brightai_admin@localhost:5432/brightai_dev';

const admin = new PrismaClient({ datasources: { db: { url: SERVICE_URL } } });
const app = new PrismaClient({ datasources: { db: { url: APP_URL } } });

// Random IDs to avoid collision with rls-isolation.test.ts.
const GAMMA = `gamma_${randomBytes(3).toString('hex')}`;
const DELTA = `delta_${randomBytes(3).toString('hex')}`;
const GAMMA_USER = `usr_gamma_${randomBytes(3).toString('hex')}`;
const DELTA_USER = `usr_delta_${randomBytes(3).toString('hex')}`;
const GAMMA_ORG_ID = `org_${randomBytes(6).toString('hex')}`;
const DELTA_ORG_ID = `org_${randomBytes(6).toString('hex')}`;

const GLOBAL_FLAG_KEY = `test_global_${randomBytes(3).toString('hex')}`;
const GAMMA_FLAG_KEY = `test_gamma_${randomBytes(3).toString('hex')}`;
const DELTA_FLAG_KEY = `test_delta_${randomBytes(3).toString('hex')}`;

let gammaUserId: string;
let deltaUserId: string;

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
  // The admin client uses brightai_admin which is the table owner.
  // FORCE ROW LEVEL SECURITY means RLS is enforced even for owners.
  // Set `app.is_service = 'true'` so the is_service_role() UDF returns true.
  await admin.$executeRawUnsafe(`SELECT set_config('app.is_service', 'true', false)`);

  // ────────────────────────────────────────────────────────────
  // 1. Users (BYPASSRLS via admin)
  // ────────────────────────────────────────────────────────────
  const gammaUser = await admin.user.create({
    data: {
      id: GAMMA_USER,
      clerkUserId: `clerk_${GAMMA_USER}`,
      email: `${GAMMA}@test.local`,
      fullName: 'Gamma User',
    },
  });
  const deltaUser = await admin.user.create({
    data: {
      id: DELTA_USER,
      clerkUserId: `clerk_${DELTA_USER}`,
      email: `${DELTA}@test.local`,
      fullName: 'Delta User',
    },
  });
  gammaUserId = gammaUser.id;
  deltaUserId = deltaUser.id;

  // ────────────────────────────────────────────────────────────
  // 2. Organizations
  // ────────────────────────────────────────────────────────────
  await admin.organization.create({
    data: {
      id: GAMMA_ORG_ID,
      slug: GAMMA,
      name: 'Gamma',
      nameAr: 'جاما',
      industry: 'OTHER',
      size: 'SIZE_1_10',
      deployment: 'CLOUD',
    },
  });
  await admin.organization.create({
    data: {
      id: DELTA_ORG_ID,
      slug: DELTA,
      name: 'Delta',
      nameAr: 'دلتا',
      industry: 'OTHER',
      size: 'SIZE_1_10',
      deployment: 'CLOUD',
    },
  });

  await admin.membership.create({
    data: {
      organizationId: GAMMA_ORG_ID,
      userId: gammaUserId,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });
  await admin.membership.create({
    data: {
      organizationId: DELTA_ORG_ID,
      userId: deltaUserId,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  // ────────────────────────────────────────────────────────────
  // 3. feature_flag (global catalog — must exist BEFORE the org
  // overrides because OrgFeatureFlag.flagKey → FeatureFlag.key FK)
  // ────────────────────────────────────────────────────────────
  await admin.featureFlag.create({
    data: {
      key: GAMMA_FLAG_KEY,
      description: 'Test global flag for gamma org override',
      defaultValue: false,
    },
  });
  await admin.featureFlag.create({
    data: {
      key: DELTA_FLAG_KEY,
      description: 'Test global flag for delta org override',
      defaultValue: false,
    },
  });
  await admin.featureFlag.create({
    data: {
      key: GLOBAL_FLAG_KEY,
      description: 'Test global flag — should be visible to all tenants',
      defaultValue: false,
    },
  });

  // ────────────────────────────────────────────────────────────
  // 4. org_feature_flag (per-org overrides)
  // ────────────────────────────────────────────────────────────
  await admin.orgFeatureFlag.create({
    data: {
      organizationId: GAMMA_ORG_ID,
      flagKey: GAMMA_FLAG_KEY,
      enabled: true,
    },
  });
  await admin.orgFeatureFlag.create({
    data: {
      organizationId: DELTA_ORG_ID,
      flagKey: DELTA_FLAG_KEY,
      enabled: true,
    },
  });

  // ────────────────────────────────────────────────────────────
  // 5. ai_usage_entry (per-org + 1 anon)
  // ────────────────────────────────────────────────────────────
  await admin.aiUsageEntry.create({
    data: {
      organizationId: GAMMA_ORG_ID,
      userId: gammaUserId,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      latencyMs: 200,
      cost: 0.0001,
    },
  });
  await admin.aiUsageEntry.create({
    data: {
      organizationId: DELTA_ORG_ID,
      userId: deltaUserId,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      promptTokens: 200,
      completionTokens: 100,
      totalTokens: 300,
      latencyMs: 300,
      cost: 0.0002,
    },
  });
  // Anon entry (marketing site) — should ONLY be visible to service role
  await admin.aiUsageEntry.create({
    data: {
      organizationId: null,
      userId: null,
      sessionId: 'anon_test_session',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      promptTokens: 50,
      completionTokens: 25,
      totalTokens: 75,
      latencyMs: 100,
      cost: 0.00005,
    },
  });

  // ────────────────────────────────────────────────────────────
  // 6. saml_connection (per-org SSO config)
  // ────────────────────────────────────────────────────────────
  await admin.samlConnection.create({
    data: {
      organizationId: GAMMA_ORG_ID,
      provider: 'azure_ad',
      emailDomains: ['gamma.test'],
      enabled: true,
    },
  });
  await admin.samlConnection.create({
    data: {
      organizationId: DELTA_ORG_ID,
      provider: 'okta',
      emailDomains: ['delta.test'],
      enabled: true,
    },
  });
});

afterAll(async () => {
  // Cleanup (admin has BYPASSRLS so it can delete across tenants)
  await admin.samlConnection.deleteMany({
    where: { organizationId: { in: [GAMMA_ORG_ID, DELTA_ORG_ID] } },
  });
  await admin.aiUsageEntry.deleteMany({
    where: { organizationId: { in: [GAMMA_ORG_ID, DELTA_ORG_ID] } },
  });
  await admin.aiUsageEntry.deleteMany({ where: { sessionId: 'anon_test_session' } });
  await admin.orgFeatureFlag.deleteMany({
    where: { organizationId: { in: [GAMMA_ORG_ID, DELTA_ORG_ID] } },
  });
  await admin.featureFlag.deleteMany({ where: { key: GLOBAL_FLAG_KEY } });
  await admin.membership.deleteMany({
    where: { organizationId: { in: [GAMMA_ORG_ID, DELTA_ORG_ID] } },
  });
  await admin.organization.deleteMany({
    where: { id: { in: [GAMMA_ORG_ID, DELTA_ORG_ID] } },
  });
  await admin.user.deleteMany({
    where: { id: { in: [GAMMA_USER, DELTA_USER] } },
  });
  await admin.$disconnect();
  await app.$disconnect();
});

// ────────────────────────────────────────────────────────────
// 1. org_feature_flag — per-org, RLS must isolate
// ────────────────────────────────────────────────────────────
describe('RLS — org_feature_flag (P0-1)', () => {
  it('gamma sees only its own override', async () => {
    const rows = (await withTenant(GAMMA_ORG_ID, gammaUserId, (tx) =>
      tx.orgFeatureFlag.findMany(),
    )) as { organizationId: string; flagKey: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.organizationId === GAMMA_ORG_ID)).toBe(true);
    expect(rows.find((r) => r.flagKey === GAMMA_FLAG_KEY)).toBeDefined();
    expect(rows.find((r) => r.flagKey === DELTA_FLAG_KEY)).toBeUndefined();
  });

  it('delta sees only its own override', async () => {
    const rows = (await withTenant(DELTA_ORG_ID, deltaUserId, (tx) =>
      tx.orgFeatureFlag.findMany(),
    )) as { organizationId: string; flagKey: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.organizationId === DELTA_ORG_ID)).toBe(true);
    expect(rows.find((r) => r.flagKey === DELTA_FLAG_KEY)).toBeDefined();
    expect(rows.find((r) => r.flagKey === GAMMA_FLAG_KEY)).toBeUndefined();
  });

  it('gamma cannot upsert into delta org (WITH CHECK)', async () => {
    await expect(
      withTenant(GAMMA_ORG_ID, gammaUserId, (tx) =>
        tx.orgFeatureFlag.create({
          data: {
            organizationId: DELTA_ORG_ID, // ← try to leak
            flagKey: 'leak_attempt',
            enabled: true,
          },
        }),
      ),
    ).rejects.toThrow();
  });
});

// ────────────────────────────────────────────────────────────
// 2. ai_usage_entry — per-org, anon excluded
// ────────────────────────────────────────────────────────────
describe('RLS — ai_usage_entry (P0-1)', () => {
  it('gamma sees only its own entries (not delta, not anon)', async () => {
    const rows = (await withTenant(GAMMA_ORG_ID, gammaUserId, (tx) =>
      tx.aiUsageEntry.findMany(),
    )) as { organizationId: string | null; sessionId: string | null }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.organizationId === GAMMA_ORG_ID)).toBe(true);
    // Anon session must NOT leak
    expect(rows.find((r) => r.sessionId === 'anon_test_session')).toBeUndefined();
  });

  it('delta sees only its own entries (not gamma, not anon)', async () => {
    const rows = (await withTenant(DELTA_ORG_ID, deltaUserId, (tx) =>
      tx.aiUsageEntry.findMany(),
    )) as { organizationId: string | null; sessionId: string | null }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.organizationId === DELTA_ORG_ID)).toBe(true);
    expect(rows.find((r) => r.sessionId === 'anon_test_session')).toBeUndefined();
  });

  it('service role sees anon entries too', async () => {
    const all = await admin.aiUsageEntry.findMany({ where: { sessionId: 'anon_test_session' } });
    expect(all.length).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────
// 3. saml_connection — per-org SSO config
// ────────────────────────────────────────────────────────────
describe('RLS — saml_connection (P0-1)', () => {
  it('gamma sees only its own SSO config', async () => {
    const conn = (await withTenant(GAMMA_ORG_ID, gammaUserId, (tx) =>
      tx.samlConnection.findFirst(),
    )) as { organizationId: string; provider: string } | null;
    expect(conn).not.toBeNull();
    expect(conn!.organizationId).toBe(GAMMA_ORG_ID);
    expect(conn!.provider).toBe('azure_ad');
  });

  it('delta sees only its own SSO config', async () => {
    const conn = (await withTenant(DELTA_ORG_ID, deltaUserId, (tx) =>
      tx.samlConnection.findFirst(),
    )) as { organizationId: string; provider: string } | null;
    expect(conn).not.toBeNull();
    expect(conn!.organizationId).toBe(DELTA_ORG_ID);
    expect(conn!.provider).toBe('okta');
  });

  it('gamma cannot upsert into delta org (WITH CHECK)', async () => {
    await expect(
      withTenant(GAMMA_ORG_ID, gammaUserId, (tx) =>
        tx.samlConnection.upsert({
          where: { organizationId: DELTA_ORG_ID },
          create: {
            organizationId: DELTA_ORG_ID,
            provider: 'google_workspace',
            emailDomains: ['leak.test'],
            enabled: true,
          },
          update: { provider: 'google_workspace' },
        }),
      ),
    ).rejects.toThrow();
  });
});

// ────────────────────────────────────────────────────────────
// 4. feature_flag — global catalog, everyone reads
// ────────────────────────────────────────────────────────────
describe('RLS — feature_flag (P0-1, global catalog)', () => {
  it('gamma can read the global catalog', async () => {
    const rows = (await withTenant(GAMMA_ORG_ID, gammaUserId, (tx) =>
      tx.featureFlag.findMany({ where: { key: GLOBAL_FLAG_KEY } }),
    )) as { key: string }[];
    expect(rows.length).toBe(1);
    expect(rows[0].key).toBe(GLOBAL_FLAG_KEY);
  });

  it('delta can read the global catalog', async () => {
    const rows = (await withTenant(DELTA_ORG_ID, deltaUserId, (tx) =>
      tx.featureFlag.findMany({ where: { key: GLOBAL_FLAG_KEY } }),
    )) as { key: string }[];
    expect(rows.length).toBe(1);
    expect(rows[0].key).toBe(GLOBAL_FLAG_KEY);
  });

  it('app role cannot insert into feature_flag (service-only writes)', async () => {
    await expect(
      withTenant(GAMMA_ORG_ID, gammaUserId, (tx) =>
        tx.featureFlag.create({
          data: {
            key: `attempt_${randomBytes(3).toString('hex')}`,
            description: 'should fail',
            defaultValue: false,
          },
        }),
      ),
    ).rejects.toThrow();
  });
});
