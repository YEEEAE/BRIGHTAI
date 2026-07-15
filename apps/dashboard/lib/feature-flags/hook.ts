'use client';

/**
 * @brightai/dashboard — Feature Flags: useFeatureFlag hook
 *
 * Client-side hook. Reads from the FeatureFlagContext injected by
 * the FeatureFlagProvider in the (app) layout.
 *
 * Returns false (fail-closed) if the context is not available
 * (e.g. used outside FeatureFlagProvider — should not happen in
 * normal usage, but is safe by default).
 *
 * Usage:
 *   import { useFeatureFlag } from '@/lib/feature-flags/hook';
 *   const isStreaming = useFeatureFlag('ai_streaming');
 */

import { useContext } from 'react';
import { FeatureFlagContext } from './provider';
import type { FeatureFlagKey } from '@brightai/config';

/**
 * Read a single feature flag value from the current org's resolved
 * flag map. Returns false (fail-closed) if the flag is not found.
 *
 * @param key - A FeatureFlagKey from @brightai/config FEATURE_FLAGS
 */
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) {
    // Missing provider — fail-closed, log warning in dev
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[useFeatureFlag] Called outside FeatureFlagProvider. ` +
          `Returning false for key "${key}". ` +
          `Ensure FeatureFlagProvider wraps the component tree.`,
      );
    }
    return false;
  }
  return ctx[key] ?? false;
}

/**
 * Read all resolved flags for the current org.
 * Use when you need to check multiple flags at once without
 * multiple hook calls.
 */
export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagContext);
  return ctx;
}
