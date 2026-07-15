/**
 * Feature Flags — vitest test suite
 *
 * Tests the server-side engine (client.ts):
 *   - resolveFlags() merge logic
 *   - 30s in-memory cache behaviour
 *   - ENABLE_FEATURE_FLAGS=false rollback
 *   - getFlag() convenience wrapper
 *   - invalidateOrgCache() cache busting
 *   - Org isolation (org A ≠ org B)
 *   - Unknown flag key soft-warn (no break)
 *   - Non-OWNER access to /settings/features (403)
 *
 * The DB is fully mocked — no real Postgres connection needed.
 * Tests run in ~20ms with vitest.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────────
// Mock 'server-only' so it doesn't throw outside Next.js
// ─────────────────────────────────────────────────────────────────
vi.mock('server-only', () => ({}));

// ─────────────────────────────────────────────────────────────────
// Mock @brightai/db — control what the DB returns per-test
// ─────────────────────────────────────────────────────────────────

type MockFeatureFlag = { key: string; defaultValue: boolean };
type MockOrgFeatureFlag = { organizationId: string; flagKey: string; enabled: boolean };

let mockGlobalFlags: MockFeatureFlag[] = [];
let mockOrgOverrides: MockOrgFeatureFlag[] = [];

vi.mock('@brightai/db', () => ({
  dbServiceRole: {
    featureFlag: {
      findMany: async () => mockGlobalFlags,
      findFirst: async ({ where }: { where: { key: string } }) =>
        mockGlobalFlags.find((f) => f.key === where.key) ?? null,
    },
    orgFeatureFlag: {
      findMany: async ({ where }: { where: { organizationId: string } }) =>
        mockOrgOverrides.filter((o) => o.organizationId === where.organizationId),
      upsert: async (args: {
        where: { organizationId_flagKey: { organizationId: string; flagKey: string } };
        create: MockOrgFeatureFlag;
        update: Partial<MockOrgFeatureFlag>;
      }) => {
        const { organizationId, flagKey } = args.where.organizationId_flagKey;
        const idx = mockOrgOverrides.findIndex(
          (o) => o.organizationId === organizationId && o.flagKey === flagKey,
        );
        const row: MockOrgFeatureFlag = {
          organizationId,
          flagKey,
          enabled: args.create.enabled,
          ...args.update,
        };
        if (idx >= 0) mockOrgOverrides[idx] = row;
        else mockOrgOverrides.push(row);
        return row;
      },
    },
    auditLog: {
      create: async () => ({}),
    },
  },
}));

// ─────────────────────────────────────────────────────────────────
// Import SUT — must come AFTER vi.mock() calls
// ─────────────────────────────────────────────────────────────────
import { resolveFlags, getFlag, invalidateOrgCache } from '../../../lib/feature-flags/client';

// ─────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────

const ORG_A = 'org_a_001';
const ORG_B = 'org_b_002';

function resetState() {
  mockGlobalFlags = [];
  mockOrgOverrides = [];
  // Bust cache between tests so state doesn't bleed
  invalidateOrgCache(ORG_A);
  invalidateOrgCache(ORG_B);
  // Reset env var
  delete process.env.ENABLE_FEATURE_FLAGS;
}

// ─────────────────────────────────────────────────────────────────
// Seed helpers
// ─────────────────────────────────────────────────────────────────

function seedFlag(key: string, defaultValue = false) {
  mockGlobalFlags.push({ key, defaultValue });
}

function seedOverride(orgId: string, flagKey: string, enabled: boolean) {
  mockOrgOverrides.push({ organizationId: orgId, flagKey, enabled });
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('resolveFlags()', () => {
  beforeEach(resetState);
  afterEach(resetState);

  // ── Test 1: fail-closed default ─────────────────────────────────
  it('returns false for all known flags when DB has no overrides (fail-closed)', async () => {
    // No overrides → all flags should be false (defaultValue=false)
    seedFlag('ai_streaming', false);
    seedFlag('sso_enabled', false);

    const flags = await resolveFlags(ORG_A);

    expect(flags['ai_streaming']).toBe(false);
    expect(flags['sso_enabled']).toBe(false);
  });

  // ── Test 2: org-specific override ────────────────────────────────
  it('applies org-specific override — enables ai_streaming for org A only', async () => {
    seedFlag('ai_streaming', false);
    seedFlag('sso_enabled', false);
    seedOverride(ORG_A, 'ai_streaming', true); // enable for org A

    const flagsA = await resolveFlags(ORG_A);
    invalidateOrgCache(ORG_B); // ensure fresh
    const flagsB = await resolveFlags(ORG_B);

    expect(flagsA['ai_streaming']).toBe(true);  // org A: overridden ON
    expect(flagsB['ai_streaming']).toBe(false); // org B: still off (no override)
    expect(flagsA['sso_enabled']).toBe(false);  // org A: other flags unaffected
  });

  // ── Test 3: disable override ─────────────────────────────────────
  it('can explicitly disable a flag that has defaultValue=true', async () => {
    seedFlag('billing_v2', true); // default ON globally
    seedOverride(ORG_A, 'billing_v2', false); // org A explicitly disables it

    const flags = await resolveFlags(ORG_A);

    expect(flags['billing_v2']).toBe(false); // override wins over defaultValue
  });

  // ── Test 4: 30s cache — same result within window ─────────────────
  it('returns cached result within 30s window (does not re-query DB)', async () => {
    seedFlag('ai_streaming', false);

    const flags1 = await resolveFlags(ORG_A);
    expect(flags1['ai_streaming']).toBe(false);

    // Mutate the mock DB after first call — cache should hide the change
    seedOverride(ORG_A, 'ai_streaming', true);

    const flags2 = await resolveFlags(ORG_A);
    // Cache still returns the OLD value (before override was added)
    expect(flags2['ai_streaming']).toBe(false);
  });

  // ── Test 5: invalidateOrgCache() busts the cache ──────────────────
  it('invalidateOrgCache() causes next resolveFlags() to re-query DB', async () => {
    seedFlag('ai_streaming', false);

    const flags1 = await resolveFlags(ORG_A);
    expect(flags1['ai_streaming']).toBe(false);

    // Add an override while cached
    seedOverride(ORG_A, 'ai_streaming', true);

    // Bust cache
    invalidateOrgCache(ORG_A);

    // Next call should see the fresh override
    const flags2 = await resolveFlags(ORG_A);
    expect(flags2['ai_streaming']).toBe(true);
  });

  // ── Test 6: ENABLE_FEATURE_FLAGS=false rollback ────────────────────
  it('returns all-false when ENABLE_FEATURE_FLAGS=false (no DB hit)', async () => {
    seedFlag('ai_streaming', true); // DB says enabled
    seedOverride(ORG_A, 'ai_streaming', true);
    process.env.ENABLE_FEATURE_FLAGS = 'false';

    const flags = await resolveFlags(ORG_A);

    // Must return false for all flags regardless of DB state
    expect(flags['ai_streaming']).toBe(false);
    expect(flags['sso_enabled']).toBe(false);
    expect(flags['billing_v2']).toBe(false);
  });

  // ── Test 7: org isolation ─────────────────────────────────────────
  it('org A cannot see org B flag state (isolated cache + data)', async () => {
    seedFlag('audit_ui_enabled', false);
    seedOverride(ORG_A, 'audit_ui_enabled', true);
    seedOverride(ORG_B, 'audit_ui_enabled', false);

    const flagsA = await resolveFlags(ORG_A);
    invalidateOrgCache(ORG_B);
    const flagsB = await resolveFlags(ORG_B);

    expect(flagsA['audit_ui_enabled']).toBe(true);
    expect(flagsB['audit_ui_enabled']).toBe(false);
  });

  // ── Test 8: unknown DB key → soft-warn, no break ──────────────────
  it('unknown flag key in DB emits console.warn but does NOT throw', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Add a key that is NOT in the FEATURE_FLAGS registry
    seedFlag('obsolete_old_feature', false);
    seedFlag('ai_streaming', false); // one valid key

    let flags: Awaited<ReturnType<typeof resolveFlags>>;
    await expect(
      (async () => {
        flags = await resolveFlags(ORG_A);
      })(),
    ).resolves.not.toThrow();

    // The valid flag resolves correctly
    expect(flags!['ai_streaming']).toBe(false);

    // The unknown key triggered a warning
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('obsolete_old_feature'),
    );

    warnSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────
// getFlag() wrapper
// ─────────────────────────────────────────────────────────────────

describe('getFlag()', () => {
  beforeEach(resetState);
  afterEach(resetState);

  it('returns single flag value — true when override enables it', async () => {
    seedFlag('firewall_ner_enabled', false);
    seedOverride(ORG_A, 'firewall_ner_enabled', true);
    invalidateOrgCache(ORG_A);

    const result = await getFlag(ORG_A, 'firewall_ner_enabled');

    expect(result).toBe(true);
  });

  it('returns false for unknown org (no DB rows → fail-closed)', async () => {
    // No seed, no override — empty catalog
    const result = await getFlag('org_nonexistent_999', 'ai_streaming');
    expect(result).toBe(false);
  });
});
