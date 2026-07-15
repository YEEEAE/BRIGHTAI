/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Detector orchestrator. Pure regex in this package; NER is
 * injectable via setNerDetector() so consumers (dashboard vs
 * marketing site) choose whether to pay the model-load cost.
 *
 * Flow:
 *   1. Run regexDetect (always).
 *   2. If policy.nerEnabled AND a NER detector is registered,
 *      run it and merge with regex hits.
 *   3. Dedupe overlapping detections.
 *   4. Return sorted, non-overlapping detections.
 *
 * NER injection pattern:
 *   - Dashboard: `import { setNerDetector } from '@brightai/firewall-detectors';
 *                 import { nerDetect } from './detectors/ner';
 *                 setNerDetector(nerDetect);` (called once at module load
 *                 in apps/dashboard/lib/firewall/index.ts)
 *   - Marketing site: imports the package, never calls setNerDetector
 *     → NER is never loaded, zero ONNX overhead, zero model download.
 *
 * Performance: regexDetect on a 1 KB prompt is ~1-2 ms on a modern
 * Macbook. NER adds ~50-150 ms on first call (cold start) and
 * ~20-50 ms per subsequent call.
 */

import type { Detection, FirewallContext } from './types';
import { regexDetect } from './regex';
import { applyActions } from './redaction';
import type { RedactionResult } from './types';

/**
 * Optional NER detector. Receives the full text, returns an array
 * of detections (likely with detector='ner'). Set via
 * setNerDetector — the package itself does not import any NER model.
 */
type NerDetector = (text: string) => Promise<Detection[]>;

let nerDetector: NerDetector | null = null;

/**
 * Register the NER detector. Subsequent calls to detect() will use
 * it when policy.nerEnabled is true. Calling with null clears the
 * detector (regex-only mode).
 *
 * Idempotent: re-calling replaces the previous detector. Safe to
 * call multiple times at module load (e.g. hot reload).
 */
export function setNerDetector(fn: NerDetector | null): void {
  nerDetector = fn;
}

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
  // Optional NER — only runs if a detector has been registered
  // via setNerDetector() AND policy.nerEnabled is true. Marketing
  // site never registers → NER is never invoked → zero overhead.
  let nerHits: Detection[] = [];
  if (ctx.policy.nerEnabled && nerDetector) {
    try {
      nerHits = await nerDetector(text);
    } catch (err) {
      // If the model fails (no network, missing dep, etc.) we fall
      // back to regex-only. The failure is logged but the request
      // continues.
      // eslint-disable-next-line no-console
      console.warn('[firewall] NER disabled (call failed):', err instanceof Error ? err.message : err);
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
