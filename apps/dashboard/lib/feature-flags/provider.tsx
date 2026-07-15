'use client';

/**
 * @brightai/dashboard — Feature Flags: React Context Provider
 *
 * A thin 'use client' wrapper that holds the resolved FlagMap
 * (fetched server-side in layout.tsx) and makes it available to
 * any child client component via the FeatureFlagContext.
 *
 * Usage:
 *   // In a server component (layout):
 *   const flags = await resolveFlags(ctx.tenant.id);
 *   return <FeatureFlagProvider value={flags}>{children}</FeatureFlagProvider>;
 *
 *   // In a client component:
 *   const isEnabled = useFeatureFlag('ai_streaming');
 */

import { createContext, useContext } from 'react';
import type { FlagMap } from './client';

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────

export const FeatureFlagContext = createContext<FlagMap | null>(null);

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export function FeatureFlagProvider({
  value,
  children,
}: {
  value: FlagMap;
  children: React.ReactNode;
}) {
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}
