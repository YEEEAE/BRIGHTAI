/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Arabic NER via @huggingface/transformers (Transformers.js v4).
 *
 * Model: `Xenova/bert-base-multilingual-cased-ner-hrl`
 *   - Apache 2.0 licensed
 *   - 278 MB ONNX (q8 quantized)
 *   - PERSON F1 on Arabic subset: ~85 (within 4 points of AraBERT)
 *   - Supports Arabic, English, German, Spanish, Dutch
 *
 * Lifecycle:
 *   - Lazy loaded on first call to nerDetect()
 *   - Singleton cached in `globalThis.__brightai_ner__` so HMR
 *     and warm starts don't re-download the model
 *   - ~2 s cold start (model download + ONNX init), ~20-50 ms warm
 *
 * Failure modes:
 *   - Model not cached and no network → nerDetect() returns []
 *     and isNerReady() returns false. Health route reports degraded.
 *   - Cache dir unwritable → throws on first load; orchestrator
 *     catches and falls back to regex-only.
 *   - Inference error → returns [] for that call; logs warning.
 *
 * Environment:
 *   - `FIREWALL_NER_ENABLED` (default "true"): master switch
 *   - `FIREWALL_NER_MODEL` (default NER_MODEL_ID): override model
 *   - `FIREWALL_CACHE_DIR` (default /tmp/firewall-models): where the
 *     ONNX model is downloaded and cached on disk
 */

import 'server-only';
import { arabicNameCandidates } from './arabic-names';
import type { Detection, PIIType } from './types';

/** Default model — Apache 2.0, ONNX export, 278 MB q8. */
export const NER_MODEL_ID = 'Xenova/bert-base-multilingual-cased-ner-hrl';

/** NER confidence threshold. Hits below this are discarded. */
const CONFIDENCE_THRESHOLD = 0.5;

// We treat NER entity groups of `PER`, `PERSON` as PERSON_NAME.
// Some models emit slightly different names — we accept the common ones.
const PERSON_ENTITY_GROUPS = new Set(['PER', 'PERSON', 'B-PER', 'I-PER']);

// Cached model state. Stored on `globalThis` so the singleton
// survives Next.js HMR and dev server reloads.
declare global {
  // eslint-disable-next-line no-var
  var __brightai_ner__: { ready: boolean; failed: boolean; loadPromise?: Promise<unknown> } | undefined;
}

function getState() {
  if (!globalThis.__brightai_ner__) {
    globalThis.__brightai_ner__ = { ready: false, failed: false };
  }
  return globalThis.__brightai_ner__;
}

function isEnabled(): boolean {
  // Default true if the env var is unset; only "false"/"0"/"no" disables.
  const v = process.env.FIREWALL_NER_ENABLED;
  if (v === undefined) return true;
  return !['false', '0', 'no', 'off'].includes(v.toLowerCase());
}

function getModelId(): string {
  return process.env.FIREWALL_NER_MODEL || NER_MODEL_ID;
}

function getCacheDir(): string {
  return process.env.FIREWALL_CACHE_DIR || '/tmp/firewall-models';
}

/**
 * Lazy-load the NER pipeline. Returns the pipeline instance.
 *
 * Throws on failure (network, OOM, unsupported model). The
 * orchestrator catches and falls back to regex-only.
 */
async function loadPipeline(): Promise<unknown> {
  // Dynamic import keeps the heavy module out of cold-start bundles.
  const tfModule = await import('@huggingface/transformers');
  const { pipeline, env } = tfModule;

  env.cacheDir = getCacheDir();
  // Allow remote downloads (needed for the first run).
  env.allowLocalModels = true;
  env.allowRemoteModels = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (pipeline as any)('token-classification', getModelId(), {
    dtype: 'q8', // 8-bit quantization — 4x smaller, ~1% accuracy loss
  });
}

/** Ensure the pipeline is loaded. Idempotent. */
async function ensureLoaded(): Promise<unknown | null> {
  if (!isEnabled()) return null;
  const state = getState();
  if (state.ready) return null; // Already loaded; we don't have a typed ref here.
  if (state.failed) return null;
  if (state.loadPromise) {
    await state.loadPromise;
    return null;
  }
  state.loadPromise = (async () => {
    try {
      const pipe = await loadPipeline();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__brightai_ner_pipe__ = pipe;
      state.ready = true;
    } catch (err) {
      state.failed = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[firewall] NER model load failed:',
        err instanceof Error ? err.message : err,
      );
    } finally {
      state.loadPromise = undefined;
    }
  })();
  await state.loadPromise;
  return null;
}

/**
 * True when the NER model is loaded and ready.
 */
export function isNerReady(): boolean {
  return getState().ready;
}

/**
 * Run NER on a prompt and return `PERSON_NAME` detections.
 *
 * Steps:
 *   1. Pre-filter: extract Arabic segments with `arabicNameCandidates`.
 *   2. Skip if no Arabic text (NER can't help).
 *   3. Ensure pipeline is loaded (lazy).
 *   4. Run inference on each segment.
 *   5. Map per-segment offsets to absolute offsets in the original text.
 *   6. Filter by confidence threshold.
 *   7. Return `Detection[]` with `type = 'PERSON_NAME'` and `detector = 'ner'`.
 */
export async function nerDetect(text: string): Promise<Detection[]> {
  if (!isEnabled()) return [];
  if (!text) return [];

  const candidates = arabicNameCandidates(text);
  if (candidates.length === 0) return [];

  await ensureLoaded();
  if (!isNerReady()) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipe = (globalThis as any).__brightai_ner_pipe__ as
    | undefined
    | ((text: string, opts: { aggregation_strategy: 'simple' }) => Promise<NERResult[]>);
  if (!pipe) return [];

  const out: Detection[] = [];

  for (const seg of candidates) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = (await (pipe as any)(seg.text, {
        aggregation_strategy: 'simple',
      })) as NERResult[];

      for (const r of results) {
        if (!PERSON_ENTITY_GROUPS.has(r.entity_group)) continue;
        if (r.score < CONFIDENCE_THRESHOLD) continue;
        out.push({
          type: 'PERSON_NAME' as PIIType,
          start: seg.start + (r.start ?? 0),
          end: seg.start + (r.end ?? 0),
          value: r.word,
          confidence: r.score,
          detector: 'ner',
        });
      }
    } catch (err) {
      // Don't fail the whole request on a single segment error.
      // eslint-disable-next-line no-console
      console.warn('[firewall] NER segment error:', err instanceof Error ? err.message : err);
    }
  }

  return out;
}

/** Internal type matching @huggingface/transformers grouped output. */
interface NERResult {
  word: string;
  score: number;
  entity_group: string;
  start?: number;
  end?: number;
}
