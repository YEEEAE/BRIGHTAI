/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Public barrel for the lightweight detectors package.
 *
 * Intentionally DB-free and NER-free by default. Consumers that
 * need those (the dashboard) wire them in via setNerDetector()
 * and external audit log writers. The marketing site imports this
 * package directly and never triggers NER loading.
 *
 * Consumers should import from here rather than reaching into
 * subfolders.
 */

export * from './types';
export { regexDetect, REGEX_VERSION, REGEX_SUPPORTED_TYPES } from './regex';
export {
  applyActions,
  applyActionsWithVault,
  isIdempotent,
  type ApplyOptions,
  type TokenVaultCallback,
} from './redaction';
export {
  detect,
  detectAndRedact,
  dedupeOverlap,
  hasHighRiskPII,
  setNerDetector,
} from './piidetector';
