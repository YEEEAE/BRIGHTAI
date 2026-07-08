/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Arabic pre-filter for the NER pipeline.
 *
 * The NER model (`Xenova/bert-base-multilingual-cased-ner-hrl`) is
 * expensive — ~50-150 ms per call. Sending the whole prompt through
 * the model would be wasteful when only Arabic segments carry
 * person-name PII.
 *
 * This module extracts candidate text segments (consecutive Arabic
 * words) and returns them with their byte offsets. The detector
 * orchestrator passes each segment through NER individually and
 * then translates the per-segment offsets back to absolute offsets
 * in the original text.
 *
 * Performance: for a 1 KB prompt, typically 10-20% of the text is
 * Arabic. NER runs only on those segments, cutting inference time
 * by ~70-80%.
 *
 * Arabic Unicode blocks covered:
 *   ؀-ۿ    Arabic
 *   ݐ-ݿ    Arabic Supplement
 *   ࢠ-ࣿ    Arabic Extended-A
 *   ﭐ-﷿    Arabic Presentation Forms-A
 *   ﹰ-﻿    Arabic Presentation Forms-B
 */

// Combined Arabic Unicode regex — matches Arabic chars.
const ARABIC_CHAR = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

// One Arabic word: 2+ Arabic letters
const ARABIC_WORD = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]{2,}/;

// 1-4 consecutive Arabic words, separated by whitespace
const ARABIC_SEGMENT = new RegExp(
  `${ARABIC_WORD.source}(?:\\s+${ARABIC_WORD.source}){0,4}`,
  'g',
);

export interface ArabicSegment {
  /** Absolute start offset in the original text. */
  start: number;
  /** Absolute end offset in the original text. */
  end: number;
  /** The Arabic substring. */
  text: string;
}

/**
 * Extract Arabic text segments from a larger prompt. Returns
 * segments with their absolute offsets so NER results can be
 * translated back to the original text positions.
 *
 * Skips segments shorter than 2 words (e.g. single-word names that
 * might be common nouns). The NER model is more reliable on
 * multi-word contexts.
 */
export function arabicNameCandidates(text: string): ArabicSegment[] {
  if (!text || !ARABIC_CHAR.test(text)) return [];

  const out: ArabicSegment[] = [];
  const re = new RegExp(ARABIC_SEGMENT.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const matched = m[0];
    // Require at least 2 Arabic words for a name candidate. A
    // single Arabic word is more likely a common noun.
    const wordCount = matched.split(/\s+/).filter((w) => ARABIC_CHAR.test(w)).length;
    if (wordCount < 2) continue;
    out.push({ start: m.index, end: m.index + matched.length, text: matched });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

/** Quick check: does this text contain any Arabic characters? */
export function hasArabic(text: string): boolean {
  return ARABIC_CHAR.test(text);
}
