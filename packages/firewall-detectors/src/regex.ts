/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Saudi-specific regex patterns, ported from the kernel demo store
 * (kernel/assets/js/kernel-demo-store.js L877-889) and extended to
 * cover the full PIIType enum.
 *
 * Patterns are compiled once at module load. The `regexDetect`
 * function returns structured `Detection` objects with char offsets.
 *
 * False-positive guards:
 *   - Lookbehind/lookahead `(?<!\d)` / `(?!\d)` prevent mid-number
 *     matches (so a phone area code doesn't trigger SAUDI_ID).
 *   - National Address and CR use `\b` word boundaries.
 *   - SAUDI_IBAN is anchored on the SA prefix to avoid matching
 *     generic 24-char alphanumeric strings.
 *   - DATE patterns are conservative (require explicit separators).
 *
 * Confidence is per-pattern based on the prior false-positive rate.
 * Tune as the regression corpus grows.
 */

import type { Detection, PIIType } from './types';

interface PatternEntry {
  type: PIIType;
  pattern: RegExp;
  confidence: number;
}

const PATTERNS: PatternEntry[] = [
  // ── Saudi National ID ─────────────────────────────────────────
  // 10 digits, leading 1 or 2 (citizens). Lookarounds prevent
  // matching inside longer numbers (e.g. 13-digit card numbers).
  { type: 'SAUDI_ID', pattern: /(?<!\d)[12]\d{9}(?!\d)/g, confidence: 0.92 },

  // ── Iqama (resident permit) ───────────────────────────────────
  // 10 digits starting with 2-8 (excluding 1 reserved for citizens
  // above, but the field allows 2 also for residents in practice).
  // We exclude 9 to avoid matching phone-like 10-digit numbers.
  { type: 'IQAMA', pattern: /(?<!\d)[2-8]\d{9}(?!\d)/g, confidence: 0.75 },

  // ── Saudi IBAN ────────────────────────────────────────────────
  // SA + 2 check digits + 20 alphanumeric = 24 chars total.
  { type: 'SAUDI_IBAN', pattern: /\bSA\d{2}[A-Z0-9]{20}\b/gi, confidence: 0.99 },

  // ── Saudi phone ───────────────────────────────────────────────
  // Two branches joined with `|`. The first handles the
  // international format with optional internal separators
  // (e.g. `+966-50-123-4567`, `+966 50 123 4567`). The second
  // handles the local 10- or 9-digit form (`05XXXXXXXX`, `5XXXXXXXX`).
  { type: 'SAUDI_PHONE', pattern: /(?:\+966[\s-]?5\d[\s-]?\d{3}[\s-]?\d{4})|(?:0?5\d{8})\b/g, confidence: 0.93 },

  // ── Email (RFC 5322 simplified) ───────────────────────────────
  { type: 'EMAIL', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, confidence: 0.98 },

  // ── Saudi car plate ───────────────────────────────────────────
  // Format: 1-3 Arabic letters + 1-4 digits + 1-3 Arabic letters
  // Example: أ ب ج 1234 هـ. The Arabic Unicode block is 0600-06FF.
  // Conservative — confidence 0.65 because plates vary.
  { type: 'SAUDI_PLATE', pattern: /[؀-ۿ]{1,3}\s?\d{1,4}\s?[؀-ۿ]{1,3}/g, confidence: 0.65 },

  // ── National address (short: 8 digits) ───────────────────────
  // The full short code is 8 digits (DDDD DDDD), optionally with
  // building number (4 digits) appended.
  { type: 'NATIONAL_ADDRESS', pattern: /\b\d{4}[\s-]?\d{4}\b/g, confidence: 0.80 },

  // ── Commercial Registration ───────────────────────────────────
  // 10 digits prefixed by "CR" or "cr" (Arabic uses "س.ت" but we
  // match the Latin form which is more common in digital systems).
  { type: 'COMMERCIAL_REGISTRATION', pattern: /\b(?:CR|cr)[\s:#-]?\d{10}\b/g, confidence: 0.92 },

  // ── Gregorian birth date ──────────────────────────────────────
  // dd/mm/yyyy or dd-mm-yyyy. Years 1900-2099.
  { type: 'BIRTH_DATE_GREGORIAN', pattern: /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](19|20)\d{2}\b/g, confidence: 0.75 },

  // ── Hijri birth date ──────────────────────────────────────────
  // Years 1300-1499 AH. Conservative — many false positives possible
  // for any dd/mm/yyyy in that range.
  { type: 'BIRTH_DATE_HIJRI', pattern: /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-]1[3-4]\d{2}\b/g, confidence: 0.60 },

  // ── Credit card / long account number ─────────────────────────
  // 13-19 digits with optional spaces or dashes. Anchored to avoid
  // matching shorter numbers.
  { type: 'CARD_OR_ACCOUNT', pattern: /(?<!\d)\d[\d -]{11,18}\d(?!\d)/g, confidence: 0.78 },

  // ── Patient ID (MRN) ──────────────────────────────────────────
  { type: 'PATIENT_ID', pattern: /\bMRN[-_ ]?\d{4,10}\b/gi, confidence: 0.95 },

  // ── Credential leak ───────────────────────────────────────────
  // Matches `password=...`, `db_password=...`, `api_key=...`,
  // `secret=...`, `token=...`. Captures the value too.
  { type: 'CREDENTIAL', pattern: /\b(db_password|api[_-]?key|secret|access[_-]?token|auth[_-]?token|password)\b\s*[:=]\s*\S+/gi, confidence: 0.99 },
];

/**
 * Run all regex patterns against the input text and return
 * structured detections. Detections are sorted by `start` offset.
 */
export function regexDetect(text: string): Detection[] {
  if (!text) return [];
  const out: Detection[] = [];

  for (const { type, pattern, confidence } of PATTERNS) {
    // Reset lastIndex because we're reusing a global regex.
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      const value = match[0];
      out.push({
        type,
        start,
        end: start + value.length,
        value,
        confidence,
        detector: 'regex',
      });
      // Guard against zero-width matches (shouldn't happen with our
      // patterns but defensive).
      if (match.index === pattern.lastIndex) pattern.lastIndex++;
    }
  }

  // Sort by start position so downstream merging is deterministic.
  out.sort((a, b) => a.start - b.start || a.end - b.end);
  return out;
}

/** Expose the list of types we have regex coverage for. */
export const REGEX_SUPPORTED_TYPES: PIIType[] = PATTERNS.map((p) => p.type);

/** Regex detector version — bump when patterns change (for cache invalidation). */
export const REGEX_VERSION = '2026.07.08-1';
