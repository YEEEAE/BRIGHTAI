/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Public barrel for the firewall engine. Other modules should
 * import from here rather than reaching into subfolders.
 */

export * from './detectors/types';
export { regexDetect, REGEX_VERSION, REGEX_SUPPORTED_TYPES } from './detectors/regex';
export { nerDetect, isNerReady, NER_MODEL_ID } from './detectors/ner';
export { detect, detectAndRedact, dedupeOverlap, hasHighRiskPII } from './engine/piidetector';
export { applyActions, isIdempotent } from './engine/redaction';
