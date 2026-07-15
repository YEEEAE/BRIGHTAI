/**
 * BrightAI AI Firewall — regex detector re-export shim.
 *
 * Implementation moved to @brightai/firewall-detectors in Phase 1 (BAI-001).
 * This file preserves the existing import path used by
 * `app/api/firewall/health/route.ts` and the streaming-redaction tests.
 *
 * New code should import from `@brightai/firewall-detectors` directly
 * or from `@/lib/firewall` (the dashboard barrel).
 */

export {
  regexDetect,
  REGEX_VERSION,
  REGEX_SUPPORTED_TYPES,
} from '@brightai/firewall-detectors/regex';
