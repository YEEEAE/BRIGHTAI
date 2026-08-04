/**
 * pii-detector — Shared client-side PII detection library.
 *
 * Single source of truth for PII regex patterns used by the kernel
 * playground and any client-side surface that needs deterministic
 * PII detection without pulling in the full @brightai/firewall-detectors
 * package (which depends on nanoid and is designed for server-side use).
 *
 * The patterns here are kept IDENTICAL to packages/firewall-detectors/src/regex.ts
 * so that client-side detection (playground) and server-side detection
 * (chat API via @brightai/firewall-detectors) produce consistent results.
 * If you update a pattern here, update it there too (and vice versa).
 *
 * Public API:
 *   - detectPII(text): PIIFinding[]   — deterministic detection
 *   - redactPII(text, findings): string — replace PII with [TYPE] tokens
 *   - dedupeFindings(findings): PIIFinding[] — remove overlaps
 *
 * Determinism: same input → same output, always. No randomness, no
 * environment-dependent behavior. Safe to run in Web Workers.
 *
 * Performance: ~1-2ms per 1KB of text on a modern device.
 */

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

/**
 * PII types detected by this library. Subset of the full
 * firewall-detectors PIIType enum — covers the types that matter
 * for client-side surface (playground, demo, UI highlighting).
 *
 * For the full 14-type enum (IQAMA, SAUDI_PLATE, NATIONAL_ADDRESS,
 * COMMERCIAL_REGISTRATION, BIRTH_DATE_*, CARD_OR_ACCOUNT, PATIENT_ID,
 * CREDENTIAL, PERSON_NAME), use @brightai/firewall-detectors directly.
 */
export type PIIType =
  | 'SAUDI_ID'
  | 'SAUDI_PHONE'
  | 'SAUDI_IBAN'
  | 'EMAIL'
  | 'CREDIT_CARD';

/**
 * A single PII detection result.
 *
 * Offsets are UTF-16 code unit indices (standard JS string indexing),
 * matching the server-side Detection interface in firewall-detectors.
 */
export interface PIIFinding {
  type: PIIType;
  /** UTF-16 start offset (inclusive). */
  start: number;
  /** UTF-16 end offset (exclusive). */
  end: number;
  /** Raw substring that was detected. */
  value: string;
  /** Confidence 0..1. Regex hits are 0.7-1.0. */
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Patterns — MUST stay in sync with packages/firewall-detectors/src/regex.ts
// ─────────────────────────────────────────────────────────────────────────

interface PatternEntry {
  type: PIIType;
  pattern: RegExp;
  confidence: number;
}

const PATTERNS: readonly PatternEntry[] = [
  // ── Saudi National ID ─────────────────────────────────────────
  // 10 digits, leading 1 or 2 (citizens). Lookarounds prevent
  // matching inside longer numbers (e.g. 13-digit card numbers).
  { type: 'SAUDI_ID', pattern: /(?<!\d)[12]\d{9}(?!\d)/g, confidence: 0.92 },

  // ── Saudi IBAN ────────────────────────────────────────────────
  // SA + 2 check digits + 20 alphanumeric = 24 chars total.
  { type: 'SAUDI_IBAN', pattern: /\bSA\d{2}[A-Z0-9]{20}\b/gi, confidence: 0.99 },

  // ── Saudi phone ───────────────────────────────────────────────
  // International format (+966 5X XXX XXXX) or local (05XXXXXXXX, 5XXXXXXXX).
  { type: 'SAUDI_PHONE', pattern: /(?:\+966[\s-]?5\d[\s-]?\d{3}[\s-]?\d{4})|(?:0?5\d{8})\b/g, confidence: 0.93 },

  // ── Email (RFC 5322 simplified) ───────────────────────────────
  { type: 'EMAIL', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, confidence: 0.98 },

  // ── Credit card / long account number ─────────────────────────
  // 13-19 digits with optional spaces or dashes. Anchored to avoid
  // matching shorter numbers. Luhn check is applied as a post-filter
  // to reduce false positives.
  { type: 'CREDIT_CARD', pattern: /(?<!\d)\d[\d -]{11,18}\d(?!\d)/g, confidence: 0.78 },
];

// ─────────────────────────────────────────────────────────────────────────
// Luhn checksum — validates credit card numbers (reduces false positives)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Luhn algorithm checksum. Returns true if the digit sequence passes
 * the Luhn check (used by all major credit card networks).
 *
 * Ported from src/client/playground.ts (the original inline copy) to
 * keep behavior identical for the playground surface.
 */
function luhnCheck(input: string): boolean {
  const digits = input.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// ─────────────────────────────────────────────────────────────────────────
// Detection
// ─────────────────────────────────────────────────────────────────────────

/**
 * Run all PII patterns against the input text and return structured
 * findings. Findings are sorted by `start` offset and deduped for
 * overlaps (highest confidence wins).
 *
 * Deterministic: same input always produces same output.
 *
 * @param text  The text to scan. Arabic + English mix supported.
 * @returns     Sorted, non-overlapping PIIFinding[].
 */
export function detectPII(text: string): PIIFinding[] {
  if (!text) return [];

  const raw: PIIFinding[] = [];

  for (const { type, pattern, confidence } of PATTERNS) {
    // Reset lastIndex because we reuse a global regex.
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      // Credit card post-filter: Luhn check to reduce false positives.
      if (type === 'CREDIT_CARD' && !luhnCheck(value)) {
        // Not a valid card number — skip.
        if (match.index === pattern.lastIndex) pattern.lastIndex++;
        continue;
      }

      raw.push({ type, start, end, value, confidence });

      // Guard against zero-width matches (defensive).
      if (match.index === pattern.lastIndex) pattern.lastIndex++;
    }
  }

  return dedupeFindings(raw);
}

// ─────────────────────────────────────────────────────────────────────────
// Deduplication
// ─────────────────────────────────────────────────────────────────────────

/**
 * Remove overlapping findings. When two findings cover the same span,
 * keep the higher-confidence one. When they partially overlap, drop
 * the lower-confidence one.
 *
 * Mirrors dedupeOverlap() in packages/firewall-detectors/src/piidetector.ts.
 */
export function dedupeFindings(findings: PIIFinding[]): PIIFinding[] {
  if (findings.length <= 1) return findings;

  // Sort by confidence desc, then by span length desc (prefer longer).
  const sorted = [...findings].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    return lenB - lenA;
  });

  const kept: PIIFinding[] = [];
  for (const f of sorted) {
    const overlaps = kept.some((k) => !(f.end <= k.start || f.start >= k.end));
    if (!overlaps) kept.push(f);
  }

  // Re-sort by start so callers can iterate in order.
  kept.sort((a, b) => a.start - b.start);
  return kept;
}

// ─────────────────────────────────────────────────────────────────────────
// Redaction
// ─────────────────────────────────────────────────────────────────────────

/**
 * Replace each PII finding in the text with a `[TYPE]` placeholder.
 *
 * Findings are applied from the end of the string toward the start
 * so offsets don't drift.
 *
 * @param text      Original text.
 * @param findings  Findings from detectPII() (will be sorted internally).
 * @returns         Text with PII replaced by `[TYPE]` tokens.
 *
 * @example
 *   redactPII('Call 0501234567', detectPII('Call 0501234567'))
 *   // → 'Call [SAUDI_PHONE]'
 */
export function redactPII(text: string, findings: PIIFinding[]): string {
  if (!findings.length) return text;

  // Sort DESC by start so we splice from the end first — no offset drift.
  const sorted = [...findings].sort((a, b) => b.start - a.start);

  let result = text;
  for (const f of sorted) {
    result = result.slice(0, f.start) + `[${f.type}]` + result.slice(f.end);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────
// Convenience helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * True if the text contains any PII. Cheaper than detectPII() when
 * you only need a boolean (short-circuits on the first match).
 */
export function hasPII(text: string): boolean {
  if (!text) return false;
  for (const { pattern } of PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * Count PII findings by type. Useful for risk scoring and UI badges.
 *
 * @example
 *   countByType(detectPII(text))
 *   // → { SAUDI_ID: 1, SAUDI_PHONE: 2, EMAIL: 0, ... }
 */
export function countByType(findings: PIIFinding[]): Record<PIIType, number> {
  const counts: Record<PIIType, number> = {
    SAUDI_ID: 0,
    SAUDI_PHONE: 0,
    SAUDI_IBAN: 0,
    EMAIL: 0,
    CREDIT_CARD: 0,
  };
  for (const f of findings) counts[f.type]++;
  return counts;
}

/**
 * Library version — bump when patterns change (for cache invalidation
 * and to keep in sync with firewall-detectors REGEX_VERSION).
 */
export const PII_DETECTOR_VERSION = '2026.08.04-1';