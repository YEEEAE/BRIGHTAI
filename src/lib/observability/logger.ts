/**
 * src/lib/observability/logger.ts — Structured JSON logger (pino).
 *
 * P0-3 (2026-07-19): root-side mirror of apps/dashboard/lib/observability/logger.ts.
 * Used by the marketing site's SSR routes (/api/ai/chat, /api/lead, etc.).
 *
 * Output: single-line JSON per event to stdout (production) or stderr (dev).
 * The PII scrubber (apps/dashboard/lib/observability/pii-scrubber.ts) is
 * duplicated locally to keep the two surfaces independent — the marketing
 * site is a separate deployment and shouldn't import dashboard internals.
 */

import pino from 'pino';

const PII_KEYS = new Set([
  'password', 'passwd', 'token', 'access_token', 'refresh_token',
  'authorization', 'cookie', 'set-cookie', 'api_key', 'apikey',
  'secret', 'private_key', 'session', 'sessionid', 'ssn', 'national_id',
  'nationalid', 'saudi_id', 'creditcard', 'credit_card', 'cardnumber',
  'card_number', 'cvv', 'pin', 'email', 'phone', 'phonenumber',
  'phone_number', 'mobile', 'address', 'street', 'postcode', 'zipcode',
]);
const REDACTED = '[REDACTED]';
const PII_RE = [
  /\b[12]\d{9}\b/g,                                    // SAUDI_ID
  /\bSA\d{22}\b/g,                                     // IBAN_SA
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // email
  /(?:\+966|00966|0)?5\d{8}\b/g,                       // SA phone
  /\+\d{10,15}\b/g,                                    // intl phone
  /\b(?:\d[ -]?){12,18}\d\b/g,                        // card (no trailing separator)
  /Bearer\s+[A-Za-z0-9._-]{20,}/gi,                    // bearer
  /\b(sk_live_|sk_test_|rk_live_|rk_test_|whsec_|pk_live_|pk_test_|bk_live_|bk_test_)[A-Za-z0-9]{10,}\b/g, // API keys
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWT
];

function scrubValue(v: unknown, depth = 0): unknown {
  if (depth > 8) return '[DEEP]';
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') {
    let out = v;
    for (const re of PII_RE) out = out.replace(re, REDACTED);
    return out;
  }
  if (typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => scrubValue(x, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    result[k] = PII_KEYS.has(k.toLowerCase()) ? REDACTED : scrubValue(val, depth + 1);
  }
  return result;
}

const baseLogger = pino({
  name: 'brightai-marketing',
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'marketing', env: process.env.NODE_ENV ?? 'development' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
  hooks: {
    logMethod(inputArgs, method) {
      try {
        const [mergeObj, msg, ...rest] = inputArgs;
        const safe = scrubValue(mergeObj);
        // pino's overloaded signature — cast to any to bypass strict overloads.
        (method as (...a: unknown[]) => void).call(this, safe, msg, ...rest);
      } catch {
        // Last-resort fallback — never throw from the logger.
        (method as (...a: unknown[]) => void).call(this, { _logger_scrub_error: true }, inputArgs[1]);
      }
    },
  },
});

export const logger = {
  trace: baseLogger.trace.bind(baseLogger),
  debug: baseLogger.debug.bind(baseLogger),
  info: baseLogger.info.bind(baseLogger),
  warn: baseLogger.warn.bind(baseLogger),
  error: baseLogger.error.bind(baseLogger),
  fatal: baseLogger.fatal.bind(baseLogger),
  raw: baseLogger,
};
