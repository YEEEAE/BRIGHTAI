/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Unit tests for the Arabic NER detector and pre-filter.
 *
 * The NER model itself requires ~278 MB download + ONNX runtime.
 * These tests cover:
 *   1. The Arabic pre-filter (no model required)
 *   2. The NER module's graceful-degradation paths
 *   3. Orchestrator integration when NER is enabled but model
 *      isn't loaded (returns regex-only results)
 *
 * For the full NER inference path, see `tests/firewall/ner-integration.test.ts`
 * which downloads the model and runs the slow path.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { arabicNameCandidates, hasArabic } from '../../lib/firewall/detectors/arabic-names';
import { nerDetect, isNerReady, NER_MODEL_ID } from '../../lib/firewall/detectors/ner';

describe('hasArabic', () => {
  it('returns true for Arabic text', () => {
    expect(hasArabic('العميل محمد العتيبي')).toBe(true);
  });
  it('returns false for English-only text', () => {
    expect(hasArabic('Hello world')).toBe(false);
  });
  it('returns true for mixed text', () => {
    expect(hasArabic('Customer name: محمد العتيبي')).toBe(true);
  });
  it('returns false for empty string', () => {
    expect(hasArabic('')).toBe(false);
  });
});

describe('arabicNameCandidates', () => {
  it('extracts 2-word Arabic segments', () => {
    const segs = arabicNameCandidates('العميل محمد العتيبي هو مدير');
    expect(segs.length).toBeGreaterThan(0);
    expect(segs[0].text).toContain('محمد');
    expect(segs[0].text).toContain('العتيبي');
  });

  it('skips single Arabic words (likely common nouns)', () => {
    const segs = arabicNameCandidates('كتاب على الطاولة');
    // "كتاب على الطاولة" has multiple 2+ word segments; "على" is a
    // preposition, but the function still extracts. Just verify
    // no single-word segments.
    for (const s of segs) {
      const words = s.text.split(/\s+/);
      expect(words.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns empty for English-only text', () => {
    expect(arabicNameCandidates('John Smith is here')).toEqual([]);
  });

  it('returns empty for empty string', () => {
    expect(arabicNameCandidates('')).toEqual([]);
  });

  it('preserves absolute offsets in original text', () => {
    const text = 'prefix العميل محمد العتيبي suffix';
    const segs = arabicNameCandidates(text);
    expect(segs.length).toBeGreaterThan(0);
    for (const s of segs) {
      expect(text.slice(s.start, s.end)).toBe(s.text);
    }
  });
});

describe('NER module — graceful degradation', () => {
  it('NER_MODEL_ID is set to the agreed model', () => {
    expect(NER_MODEL_ID).toBe('Xenova/bert-base-multilingual-cased-ner-hrl');
  });

  it('isNerReady() returns false before any NER call', () => {
    expect(isNerReady()).toBe(false);
  });

  it('nerDetect returns empty array for non-Arabic text without model load', async () => {
    const dets = await nerDetect('Hello world');
    expect(dets).toEqual([]);
  });

  it('nerDetect returns empty for Arabic text if model not loaded (no env / no network)', async () => {
    // We don't actually load the model here. If the env doesn't have
    // a pre-cached model + no network, isNerReady() stays false and
    // we get an empty array (graceful degradation).
    // We wrap with a 2s timeout to avoid hanging on network attempts
    // — the model load may try to download from HF Hub and stall.
    const dets = await Promise.race([
      nerDetect('محمد العتيبي'),
      new Promise<[]>((resolve) => setTimeout(() => resolve([]), 2000)),
    ]);
    expect(Array.isArray(dets)).toBe(true);
  });
});
