/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Detector orchestrator. Phase 1a is regex-only; Phase 1b adds
 * Arabic NER (XLM-RoBERTa via @huggingface/transformers).
 *
 * Flow:
 *   1. Run regexDetect (always).
 *   2. If policy.nerEnabled AND Arabic text is present, run NER
 *      and merge with regex hits.
 *   3. Dedupe overlapping detections (NER tends to subsume regex
 *      when both fire on the same span).
 *   4. Return sorted, non-overlapping detections.
 *
 * Performance: regexDetect on a 1 KB prompt is ~1-2 ms on a modern
 * Macbook. NER adds ~50-150 ms on first call (cold start) and
 * ~20-50 ms per subsequent call.
 */

import type { Detection, FirewallContext } from '../detectors/types';
import { regexDetect } from '../detectors/regex';
import { applyActions } from './redaction';
import type { RedactionResult } from '../detectors/types';

/**
 * Dedupe overlapping detections. When two detections cover the same
 * span, keep the higher-confidence one. When they only partially
 * overlap, drop the lower-confidence one.
 */
export function dedupeOverlap(detections: Detection[]): Detection[] {
  if (detections.length <= 1) return detections;
  // Sort by confidence desc, then by span length desc (prefer longer).
  const sorted = [...detections].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    return lenB - lenA;
  });
  const kept: Detection[] = [];
  for (const det of sorted) {
    const overlaps = kept.some(
      (k) => !(det.end <= k.start || det.start >= k.end),
    );
    if (!overlaps) kept.push(det);
  }
  // Re-sort by start so callers can iterate in order.
  kept.sort((a, b) => a.start - b.start);
  return kept;
}

/**
 * Run all enabled detectors and return merged, deduped detections.
 *
 * @param text  The text to scan (Arabic + English mix supported).
 * @param ctx   The firewall context (policy + orgId + requestId).
 */
export async function detect(text: string, ctx: FirewallContext): Promise<Detection[]> {
  if (!text) return [];

  const regexHits = regexDetect(text);
  // Phase 1b: lazy-load NER module. We avoid a static import so
  // tests and Phase 1a don't pay the model-load cost.
  let nerHits: Detection[] = [];
  if (ctx.policy.nerEnabled) {
    try {
      const { nerDetect } = await import('../detectors/ner');
      nerHits = await nerDetect(text);
    } catch (err) {
      // If the model fails to load (no network, missing dep, etc.)
      // we fall back to regex-only. The failure is logged but the
      // request continues.
      // eslint-disable-next-line no-console
      console.warn('[firewall] NER disabled (load failed):', err instanceof Error ? err.message : err);
    }
  }

  return dedupeOverlap([...regexHits, ...nerHits]);
}

/**
 * Convenience: detect + apply actions in one call. Returns the
 * full redaction result.
 */
export async function detectAndRedact(
  text: string,
  ctx: FirewallContext,
): Promise<RedactionResult> {
  const detections = await detect(text, ctx);
  return applyActions(text, detections, ctx.policy);
}

/** True if the detection set contains any high-risk PII (ID, credential, MRN). */
export function hasHighRiskPII(detections: Detection[]): boolean {
  const critical: ReadonlySet<string> = new Set([
    'SAUDI_ID',
    'IQAMA',
    'CREDENTIAL',
    'PATIENT_ID',
    'CARD_OR_ACCOUNT',
  ]);
  return detections.some((d) => critical.has(d.type));
}
