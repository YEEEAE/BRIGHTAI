/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Streaming redaction across chunk boundaries.
 *
 * The naïve approach (flush + reset buffer) loses PII that straddles
 * the flush boundary — e.g. a 10-digit Saudi ID split as "10294" in
 * chunk N and "82103" in chunk N+1 neither matches the regex.
 *
 * This module fixes that with a trailing-overlap buffer:
 *   - The buffer keeps the last `overlapChars` (default 64) characters
 *     uncommitted, so any PII spanning the boundary forms on the next
 *     flush.
 *   - If a detection crosses the proposed `safeRawEnd`, the boundary
 *     is extended to include the full detection (never emit partial PII).
 *   - Raw assistant text is NEVER stored — only the redacted delta is
 *     accumulated for the persisted AIRequest row.
 *   - If detection throws on any round, the stream closes (the consumer
 *     is notified via `isLast` + a sentinel delta).
 *
 * UTF-16 boundary safety: surrogate pairs (e.g. emoji) are not split —
 * the boundary is trimmed back if it lands in the middle of a pair.
 *
 * Force-commit safety: if the buffer grows past `maxBuffer` (default
 * 4096 chars) without finding a safe commit point, we force-commit
 * to avoid indefinite stalls (rare edge case — extremely long PII).
 */

import type { Detection, FirewallContext, PolicyConfig, PIIType } from '../detectors/types';
import { applyActions } from './redaction';

export interface StreamRedactionOptions {
  policy: PolicyConfig;
  ctx: FirewallContext;
  /**
   * Run PII detection on a text fragment. The streaming-redaction
   * module calls this repeatedly (per flush) on progressively larger
   * buffers. Implementations MUST be idempotent — same input yields
   * same detections.
   */
  detect: (text: string, ctx: FirewallContext) => Promise<Detection[]>;
  /** Flush threshold in chars. Default 256. */
  flushThreshold?: number;
  /** Trailing overlap in chars. Default 64 (covers the longest PII regex). */
  overlapChars?: number;
  /** Force-commit when buffer exceeds this. Default 4096. Safety valve. */
  maxBuffer?: number;
}

export interface StreamRedactionResult {
  /** Final redacted output — concatenation of all emitted deltas. */
  redacted: string;
  /** Total detections across all rounds (may include duplicates across rounds). */
  detections: number;
  /** Unique PII types detected across the stream (sorted). */
  types: PIIType[];
  /** Number of times a detection crossed the proposed boundary and forced an extension. */
  holds: number;
  /** True if detection failed mid-stream (closed failure). */
  failed: boolean;
  /** Error message if failed. */
  error?: string;
}

/**
 * Trim a position back to a safe UTF-16 boundary if it lands in the
 * middle of a surrogate pair (e.g. emoji). Walks back at most one
 * code unit. Surrogate pairs occupy positions [high, low]; we never
 * want to leave an unpaired low surrogate.
 */
function trimToUtf16Boundary(text: string, pos: number): number {
  if (pos <= 0 || pos > text.length) return pos;
  // If pos-1 is a low surrogate, walking back keeps the high surrogate.
  const prev = text.charCodeAt(pos - 1);
  if (prev >= 0xdc00 && prev <= 0xdfff) return pos - 1;
  // If pos is a high surrogate, walk forward to include the low surrogate.
  const curr = text.charCodeAt(pos);
  if (curr >= 0xd800 && curr <= 0xdbff) return pos + 1;
  return pos;
}

/**
 * Redact PII across streaming chunk boundaries. Consumes an iterable
 * of text chunks (strings) and returns the reconstructed redacted
 * text plus detection metadata. Pure function — no side effects,
 * no I/O beyond the provided `detect` callback.
 *
 * Behavior:
 *   - NEVER stores raw assistant content. Only the redacted output
 *     is accumulated.
 *   - Cross-chunk PII is detected via trailing overlap (default 64 chars).
 *   - Detections crossing the proposed commit boundary force the
 *     boundary to extend to include the full detection.
 *   - UTF-16 surrogate pairs are never split at the boundary.
 *   - If `detect` throws, the stream closes with `failed: true` and
 *     any partial redacted output is returned.
 *   - The buffer cannot grow past `maxBuffer` (default 4096) without
 *     a force-commit (prevents indefinite stalls on pathological PII).
 */
export async function redactStream(
  chunks: Iterable<string> | AsyncIterable<string>,
  options: StreamRedactionOptions,
): Promise<StreamRedactionResult> {
  const flushThreshold = options.flushThreshold ?? 256;
  const overlapChars = options.overlapChars ?? 64;
  const maxBuffer = options.maxBuffer ?? 4096;

  let buffer = '';
  let committedRawEnd = 0;
  let redactedOut = '';
  let totalDetections = 0;
  let holds = 0;
  const typesSet = new Set<PIIType>();
  let failed = false;
  let errorMsg: string | undefined;

  const isAsync = typeof (chunks as AsyncIterable<string>)[Symbol.asyncIterator] === 'function';
  const iter = isAsync
    ? (chunks as AsyncIterable<string>)[Symbol.asyncIterator]()
    : (chunks as Iterable<string>)[Symbol.iterator]();

  async function flush(isLast: boolean): Promise<boolean> {
    if (committedRawEnd >= buffer.length) return true;

    // 1. Detect PII on the full buffer (including overlap).
    let detections: Detection[];
    try {
      detections = await options.detect(buffer, options.ctx);
    } catch (err) {
      failed = true;
      errorMsg = err instanceof Error ? err.message : String(err);
      return false;
    }
    totalDetections += detections.length;
    for (const d of detections) typesSet.add(d.type);

    // 2. Find safeRawEnd — the largest position we can commit to.
    //    Default: buffer.length - overlapChars (keep overlap uncommitted),
    //    or buffer.length itself if too small for full overlap.
    let safeRawEnd: number;
    if (isLast) {
      safeRawEnd = buffer.length;
    } else if (buffer.length < committedRawEnd + overlapChars) {
      // Buffer hasn't grown past committed + overlap yet. We can't
      // safely commit anything because the next chunk might complete
      // a PII that starts here.
      safeRawEnd = buffer.length; // can't really commit; force-emit on flush
    } else {
      safeRawEnd = Math.max(committedRawEnd, buffer.length - overlapChars);
    }

    // 3. If buffer is dangerously large, force-commit everything.
    if (buffer.length >= maxBuffer) {
      safeRawEnd = buffer.length;
    }

    // 4. Extend safeRawEnd for any detection crossing the boundary.
    //    "Crossing" means the detection starts before safeRawEnd and
    //    ends after safeRawEnd. We extend to det.end to avoid emitting
    //    partial PII (and to avoid emitting already-committed text that
    //    is now known to be PII — which we filter out in step 5).
    let changed = true;
    while (changed) {
      changed = false;
      for (const det of detections) {
        if (det.start < safeRawEnd && det.end > safeRawEnd) {
          safeRawEnd = det.end;
          holds++;
          changed = true;
        }
      }
    }

    // 5. Trim to a UTF-16 safe boundary (no surrogate splits).
    safeRawEnd = trimToUtf16Boundary(buffer, safeRawEnd);

    // 6. Apply redaction to the committed slice ONLY.
    //    Detections entirely within [committedRawEnd..safeRawEnd] are
    //    included; anything straddling has already been handled by
    //    extending safeRawEnd. Detections starting in the already-
    //    committed region are filtered out (their PII was either
    //    redacted or not present in earlier rounds — there's no
    //    safe way to retroactively redact text already emitted).
    const committedSlice = buffer.slice(committedRawEnd, safeRawEnd);
    const sliceDets = detections
      .filter((d) => d.start >= committedRawEnd && d.end <= safeRawEnd)
      .map((d) => ({
        ...d,
        start: d.start - committedRawEnd,
        end: d.end - committedRawEnd,
      }));
    const result = applyActions(committedSlice, sliceDets, options.policy);
    redactedOut += result.redactedText;
    committedRawEnd = safeRawEnd;
    return true;
  }

  try {
    while (true) {
      const next = await iter.next();
      if (next.done) break;
      const chunk = next.value;

      buffer += chunk;

      // Flush when buffer has accumulated enough, but only if we can
      // safely commit (i.e., buffer >= committedRawEnd + overlapChars).
      // Otherwise wait for more chunks to land the overlap safely.
      const hasOverlapRoom = buffer.length >= committedRawEnd + overlapChars;
      const reachedThreshold = buffer.length - committedRawEnd >= flushThreshold;
      if (hasOverlapRoom && reachedThreshold) {
        const ok = await flush(false);
        if (!ok) break;
      }
    }
    // End of stream: always flush whatever's left.
    if (!failed) {
      await flush(true);
    }
  } catch (err) {
    failed = true;
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const result: StreamRedactionResult = {
    redacted: redactedOut,
    detections: totalDetections,
    types: Array.from(typesSet).sort() as PIIType[],
    holds,
    failed,
  };
  if (failed && errorMsg !== undefined) result.error = errorMsg;
  return result;
}

/**
 * Streaming variant: yields a delta + `isLast` flag for each flush.
 * Useful for SSE-style delivery where the consumer emits deltas as
 * they arrive.
 *
 * On detection failure, yields one final delta containing a sentinel
 * error message and closes (`isLast: true`, `failed: true`).
 */
export async function* redactStreamGenerator(
  chunks: AsyncIterable<string>,
  options: StreamRedactionOptions,
): AsyncGenerator<{
  delta: string;
  isLast: boolean;
  failed: boolean;
}> {
  const flushThreshold = options.flushThreshold ?? 256;
  const overlapChars = options.overlapChars ?? 64;
  const maxBuffer = options.maxBuffer ?? 4096;

  let buffer = '';
  let committedRawEnd = 0;
  let totalDetections = 0;
  const typesSet = new Set<PIIType>();

  async function flushOnce(isLast: boolean): Promise<{
    delta: string;
    failed: boolean;
  }> {
    if (committedRawEnd >= buffer.length) return { delta: '', failed: false };

    let detections: Detection[];
    try {
      detections = await options.detect(buffer, options.ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Closed failure: emit sentinel + stop.
      return { delta: `\n\n[firewall_error:${msg}]`, failed: true };
    }
    totalDetections += detections.length;
    for (const d of detections) typesSet.add(d.type);

    let safeRawEnd: number;
    if (isLast) {
      safeRawEnd = buffer.length;
    } else if (buffer.length < committedRawEnd + overlapChars) {
      safeRawEnd = buffer.length;
    } else {
      safeRawEnd = Math.max(committedRawEnd, buffer.length - overlapChars);
    }
    if (buffer.length >= maxBuffer) safeRawEnd = buffer.length;

    let changed = true;
    while (changed) {
      changed = false;
      for (const det of detections) {
        if (det.start < safeRawEnd && det.end > safeRawEnd) {
          safeRawEnd = det.end;
          changed = true;
        }
      }
    }
    safeRawEnd = trimToUtf16Boundary(buffer, safeRawEnd);

    const committedSlice = buffer.slice(committedRawEnd, safeRawEnd);
    const sliceDets = detections
      .filter((d) => d.start >= committedRawEnd && d.end <= safeRawEnd)
      .map((d) => ({ ...d, start: d.start - committedRawEnd, end: d.end - committedRawEnd }));
    const result = applyActions(committedSlice, sliceDets, options.policy);
    committedRawEnd = safeRawEnd;
    return { delta: result.redactedText, failed: false };
  }

  try {
    for await (const chunk of chunks) {
      buffer += chunk;
      const hasOverlapRoom = buffer.length >= committedRawEnd + overlapChars;
      const reachedThreshold = buffer.length - committedRawEnd >= flushThreshold;
      if (hasOverlapRoom && reachedThreshold) {
        const { delta, failed } = await flushOnce(false);
        if (delta) yield { delta, isLast: false, failed };
        if (failed) return;
      }
    }
    // Final flush.
    const { delta, failed } = await flushOnce(true);
    if (delta) yield { delta, isLast: true, failed };
    if (failed) return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    yield { delta: `\n\n[firewall_error:${msg}]`, isLast: true, failed: true };
  }
}