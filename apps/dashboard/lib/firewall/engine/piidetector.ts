/**
 * BrightAI AI Firewall — detector orchestrator re-export shim.
 *
 * Implementation moved to @brightai/firewall-detectors in Phase 1 (BAI-001).
 * The new orchestrator makes NER injectable via setNerDetector() — the
 * dashboard barrel (lib/firewall/index.ts) calls this once with nerDetect
 * at module load. Marketing site never registers NER, so the package
 * runs in pure regex mode.
 *
 * New code should import from `@brightai/firewall-detectors` directly
 * or from `@/lib/firewall` (the dashboard barrel).
 */

export {
  detect,
  detectAndRedact,
  dedupeOverlap,
  hasHighRiskPII,
} from '@brightai/firewall-detectors/piidetector';
