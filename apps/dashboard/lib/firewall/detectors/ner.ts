/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Arabic NER stub. Phase 1a returns an empty detection list.
 * Phase 1b will lazy-load @huggingface/transformers and run the
 * Xenova/bert-base-multilingual-cased-ner-hrl model.
 *
 * The stub is intentionally present so the orchestrator
 * (piidetector.ts) can dynamic-import this file even when NER is
 * disabled.
 */

import type { Detection } from './types';

/**
 * Arabic NER for person names.
 *
 * Phase 1a: returns []. Phase 1b will lazy-load the model and
 * filter to PER/PERSON entities.
 */
export async function nerDetect(_text: string): Promise<Detection[]> {
  return [];
}

/**
 * True when the underlying model is loaded. Phase 1a always false.
 * Used by /api/firewall/health to report capability.
 */
export function isNerReady(): boolean {
  return false;
}

/** Model identifier — exposed for health check and config. */
export const NER_MODEL_ID = 'Xenova/bert-base-multilingual-cased-ner-hrl';
