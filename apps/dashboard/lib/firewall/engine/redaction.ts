/**
 * BrightAI AI Firewall — redaction engine re-export shim.
 *
 * Implementation moved to @brightai/firewall-detectors in Phase 1 (BAI-001).
 * This file preserves the existing import path used by
 * `app/api/firewall/transcribe/route.ts` (for applyActionsWithVault) and
 * `tests/firewall/streaming-redaction.test.ts` (for applyActions).
 *
 * New code should import from `@brightai/firewall-detectors` directly
 * or from `@/lib/firewall` (the dashboard barrel).
 */

export {
  applyActions,
  applyActionsWithVault,
  isIdempotent,
  type ApplyOptions,
  type TokenVaultCallback,
} from '@brightai/firewall-detectors/redaction';
