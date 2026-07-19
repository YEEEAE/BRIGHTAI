/**
 * src/lib/observability/sentry.ts — Sentry init for Astro SSR.
 *
 * P0-3 (2026-07-19). Uses @sentry/node (no @sentry/astro because the
 * init is manual + the Astro integration doesn't add value for our
 * 3 SSR routes).
 *
 * Init is idempotent and no-op when SENTRY_DSN is unset.
 */

import * as Sentry from '@sentry/node';
// Inline scrubber (kept local — root logger.ts has the same logic as a
// private function, by design, to keep the two surfaces decoupled).
const PII_KEYS = new Set([
  'password','passwd','token','access_token','refresh_token','authorization',
  'cookie','set-cookie','api_key','apikey','secret','private_key','session',
  'sessionid','ssn','national_id','nationalid','saudi_id','creditcard',
  'credit_card','cardnumber','card_number','cvv','pin','email','phone',
  'phonenumber','phone_number','mobile','address','street','postcode','zipcode',
]);
const REDACTED = '[REDACTED]';
const PII_RE = [
  /\b[12]\d{9}\b/g, /\bSA\d{22}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /(?:\+966|00966|0)?5\d{8}\b/g, /\+\d{10,15}\b/g,
  /\b(?:\d[ -]?){13,19}\b/g, /Bearer\s+[A-Za-z0-9._-]{20,}/gi,
  /\b(sk_live_|sk_test_|rk_live_|rk_test_|whsec_|pk_live_|pk_test_|bk_live_|bk_test_)[A-Za-z0-9]{10,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
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

let initialized = false;

/** Initialize Sentry for the Astro Node server. Safe to call twice. */
export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE ?? undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      try {
        if (event.exception?.values) {
          event.exception.values = event.exception.values.map((e) => {
            e.value = scrubValue(e.value ?? '') as string;
            return e;
          });
        }
        if (event.message) event.message = scrubValue(event.message) as string;
        if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
        if (event.contexts) {
          const scrubbed = scrubValue(event.contexts) as Record<string, unknown>;
          // Sentry's Contexts type expects each value to be a Context.
          // Merge into `extra` which accepts free-form Record<string, unknown>.
          event.extra = { ...(event.extra ?? {}), ...scrubbed };
          delete event.contexts;
        }
        return event;
      } catch {
        return null;
      }
    },
  });
  initialized = true;
}

/** Capture an exception. No-op when Sentry is not initialized. */
export function captureException(err: unknown, extra?: Record<string, unknown>): void {
  Sentry.captureException(err, { extra: scrubValue(extra) as Record<string, unknown> });
}

/** Capture a critical alert (fatal level). */
export function captureCriticalAlert(
  event: string,
  fields: Record<string, unknown> = {},
): void {
  Sentry.captureMessage(`critical: ${event}`, {
    level: 'fatal',
    extra: scrubValue(fields) as Record<string, unknown>,
  });
}
