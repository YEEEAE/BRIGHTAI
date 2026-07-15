/**
 * BrightAI AI Firewall — types re-export shim.
 *
 * Types moved to @brightai/firewall-detectors in Phase 1 (BAI-001).
 * This file preserves the existing import path for any consumer
 * that imports from `lib/firewall/detectors/types` directly.
 *
 * New code should import from `@brightai/firewall-detectors` directly
 * or from `@/lib/firewall` (the dashboard barrel).
 */

export * from '@brightai/firewall-detectors/types';
