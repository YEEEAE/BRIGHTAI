/**
 * @brightai/dashboard — Feature Flags: Server-Side Engine
 *
 * Resolves per-organization feature flags in one DB read, cached
 * for 30 seconds per org via a module-level Map.
 *
 * Cache contract:
 *   - Key:   organizationId
 *   - Value: { flags: Record<FeatureFlagKey, boolean>; expiresAt: number }
 *   - TTL:   CACHE_TTL_MS = 30_000ms
 *
 * Rollback:
 *   - ENABLE_FEATURE_FLAGS=false → all flags return false, no DB hit.
 *
 * Resolution logic (per flag):
 *   1. Check OrgFeatureFlag for this org (explicit override).
 *   2. Fall back to FeatureFlag.defaultValue (global default).
 *   3. Fall back to false (fail-closed) if no row at all.
 *
 * Unknown DB keys (flag removed from code but still in DB):
 *   - Soft-warn via console.warn, skip silently. No break.
 *
 * Usage (server components / route handlers only):
 *   import { resolveFlags, getFlag, invalidateOrgCache } from '@/lib/feature-flags/client';
 */

import 'server-only';
import { dbServiceRole } from '@brightai/db';
import type { FeatureFlagKey } from '@brightai/config';
import { isKnownFlagKey, FEATURE_FLAGS } from '@brightai/config';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type FlagMap = Record<FeatureFlagKey, boolean>;

type CacheEntry = {
  flags: FlagMap;
  expiresAt: number; // Date.now() + TTL
};

// ─────────────────────────────────────────────────────────────────
// Module-level 30s in-memory cache (survives across requests in the
// same Node process, scoped per-org). This is intentional: it trades
// up to 30s of stale flag data for a massive reduction in DB reads.
// Toggle invalidates the cache immediately via invalidateOrgCache().
// ─────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30_000; // 30 seconds
const flagCache = new Map<string, CacheEntry>();

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Resolve all feature flags for an organization.
 *
 * Returns a stable Record<FeatureFlagKey, boolean> that is safe to
 * serialise into a React Context value.
 *
 * The result is cached per-org for 30 seconds. Toggle actions must
 * call invalidateOrgCache(orgId) to bust the cache immediately.
 */
export async function resolveFlags(orgId: string): Promise<FlagMap> {
  // Rollback kill-switch: ENABLE_FEATURE_FLAGS=false → all false, no DB
  if (process.env.ENABLE_FEATURE_FLAGS === 'false') {
    return buildAllFalseMap();
  }

  // Cache hit?
  const cached = flagCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.flags;
  }

  // Cache miss — fetch global catalog + org overrides in one query
  const flags = await fetchAndMerge(orgId);

  flagCache.set(orgId, { flags, expiresAt: Date.now() + CACHE_TTL_MS });
  return flags;
}

/**
 * Convenience: resolve a single flag for an organization.
 * Uses the same 30s cached resolveFlags() underneath.
 */
export async function getFlag(orgId: string, key: FeatureFlagKey): Promise<boolean> {
  const flags = await resolveFlags(orgId);
  return flags[key] ?? false;
}

/**
 * Bust the cache for a specific org.
 * Call this immediately after any toggle so the next request sees
 * the fresh value without waiting for TTL expiry.
 */
export function invalidateOrgCache(orgId: string): void {
  flagCache.delete(orgId);
}

// ─────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch FeatureFlag catalog + OrgFeatureFlag overrides, merge, and
 * return a complete FlagMap (all known keys, fail-closed defaults).
 *
 * Uses dbServiceRole (BYPASSRLS) to:
 *   - Read the global feature_flags catalog (non-tenant).
 *   - Read org_feature_flags for this specific org (tenant-scoped
 *     data accessed via service role — safe because we filter by orgId).
 */
async function fetchAndMerge(orgId: string): Promise<FlagMap> {
  // Start with all-false map so every known key has a value
  const result = buildAllFalseMap();

  // Load global catalog
  const globalFlags = await dbServiceRole.featureFlag.findMany();

  // Load org-specific overrides
  const orgOverrides = await dbServiceRole.orgFeatureFlag.findMany({
    where: { organizationId: orgId },
  });

  // Build override lookup
  const overrideMap = new Map<string, boolean>();
  for (const override of orgOverrides) {
    overrideMap.set(override.flagKey, override.enabled);
  }

  // Merge: for each global flag, apply override or fall back to defaultValue
  for (const flag of globalFlags) {
    if (!isKnownFlagKey(flag.key)) {
      // Flag exists in DB but not in code registry — soft-warn, skip
      console.warn(
        `[feature-flags] Unknown flag key "${flag.key}" in DB (removed from code?). Skipping.`,
      );
      continue;
    }
    const override = overrideMap.get(flag.key);
    result[flag.key] = override !== undefined ? override : flag.defaultValue;
  }

  return result;
}

/**
 * Build a FlagMap with all known flags set to false.
 * This is the fail-closed baseline.
 */
function buildAllFalseMap(): FlagMap {
  const map = {} as FlagMap;
  for (const key of Object.values(FEATURE_FLAGS)) {
    map[key] = false;
  }
  return map;
}
