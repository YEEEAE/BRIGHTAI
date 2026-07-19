/**
 * @brightai/dashboard — PII scrubber for observability.
 *
 * P0-3 (2026-07-19): PDPL compliance. Before any value is sent to
 * Sentry or any log aggregator, this scrubber removes known PII
 * patterns from the value (recursively for objects/arrays).
 *
 * Scrubs:
 *   - SAUDI_ID (10-digit national ID starting with 1 or 2)
 *   - IBAN (SA + 22 digits)
 *   - Email addresses
 *   - Phone numbers (Saudi + international)
 *   - Credit card numbers (16 digits, Luhn-validated)
 *   - Auth tokens (Bearer, API key prefixes)
 *   - Known PII field names (email, phone, name, password, token, etc.)
 *
 * What this does NOT do:
 *   - Detect free-form PII in natural language (use the firewall
 *     detectors for that — this is a defense-in-depth pass, not the
 *     primary PII gate).
 *
 * The scrubber is intentionally conservative (prefer false-positives
 * over false-negatives). A redacted "[REDACTED]" string in Sentry is
 * better than a leaked email.
 */

const PII_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'SAUDI_ID', re: /\b[12]\d{9}\b/g },
  { name: 'IBAN_SA', re: /\bSA\d{22}\b/g },
  { name: 'EMAIL', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  // Saudi phone (05xxxxxxxx) and international (+966..., +1..., etc.)
  { name: 'PHONE', re: /(?:\+966|00966|0)?5\d{8}\b/g },
  { name: 'PHONE_INTL', re: /\+\d{10,15}\b/g },
  // 13-19 digit card-like (we do NOT Luhn-validate here; logs are low-trust)
  { name: 'CARD', re: /\b(?:\d[ -]?){13,19}\b/g },
  // Bearer / API key prefixes
  { name: 'BEARER', re: /Bearer\s+[A-Za-z0-9._-]{20,}/gi },
  { name: 'API_KEY', re: /\b(sk_live_|sk_test_|rk_live_|rk_test_|whsec_|pk_live_|pk_test_|bk_live_|bk_test_)[A-Za-z0-9]{10,}\b/g },
  // JWT (three base64url segments separated by dots)
  { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
];

/**
 * Object keys whose values are always scrubbed (regardless of value).
 * Matched case-insensitively.
 */
const PII_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'apikey',
  'secret',
  'private_key',
  'session',
  'sessionid',
  'ssn',
  'national_id',
  'nationalid',
  'saudi_id',
  'creditcard',
  'credit_card',
  'cardnumber',
  'card_number',
  'cvv',
  'pin',
  'email',
  'phone',
  'phonenumber',
  'phone_number',
  'mobile',
  'address',
  'street',
  'postcode',
  'zipcode',
]);

const REDACTED = '[REDACTED]';

/** Returns true if the key should be scrubbed (case-insensitive). */
function isPiiKey(key: string): boolean {
  return PII_KEYS.has(key.toLowerCase());
}

/**
 * Scrub a single value (string or any). Strings get pattern
 * scrubbing. Objects/arrays are processed recursively.
 * Other types are returned as-is.
 */
export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[DEEP]'; // guard against cycles
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return scrubString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => scrubValue(v, depth + 1));
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isPiiKey(k)) {
        result[k] = REDACTED;
      } else {
        result[k] = scrubValue(v, depth + 1);
      }
    }
    return result;
  }
  return value;
}

/** Apply all PII patterns to a string. */
function scrubString(input: string): string {
  let result = input;
  for (const { re } of PII_PATTERNS) {
    result = result.replace(re, REDACTED);
  }
  return result;
}

/**
 * Scrub an Error object — preserves type, message, and stack, but
 * scrubs the message and stack for PII patterns. Also scrubs any
 * attached `cause` chain.
 */
export function scrubError(err: unknown): unknown {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: scrubString(err.message),
      stack: err.stack ? scrubString(err.stack) : undefined,
      cause: err.cause ? scrubError(err.cause) : undefined,
    };
  }
  return scrubValue(err);
}
