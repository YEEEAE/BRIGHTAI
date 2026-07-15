/**
 * @brightai/lead-queue — Idempotency key helpers.
 *
 * Rules (per HIGH-04 / 2026-07-15):
 *   - Client MAY send `Idempotency-Key` header. When present, use as-is.
 *   - When absent, derive a SHA-256 fingerprint of
 *       ip + userAgent + contact + bucket,
 *     where `bucket` = floor(nowMs / SYNTHETIC_KEY_WINDOW_SECONDS_000).
 *     The bucket keeps the synthetic key stable for
 *     SYNTHETIC_KEY_WINDOW_SECONDS, so retries within that window dedup
 *     while older retries count as fresh.
 *
 * Casing + whitespace on `Idempotency-Key`:
 *   - Trim surrounding whitespace; refuse keys longer than 200 chars.
 *   - Keep original casing for client-provided keys (some receivers are
 *     case-sensitive). Synthetic keys are lowercase hex.
 */

import { createHash } from 'node:crypto';
import { SYNTHETIC_KEY_WINDOW_SECONDS } from './types';

/** Length cap on client-provided Idempotency-Key. */
export const MAX_IDEMPOTENCY_KEY_LEN = 200;

/** Regex: client-provided keys are kept case-sensitive. Empty = bad. */
const CLIENT_KEY_PATTERN = /^[\x21-\x7E]+$/u;

/**
 * Normalise a client-provided idempotency key, returning `null` when
 * the input is unusable. The caller decides whether to fall back to a
 * synthetic key.
 */
export function normaliseClientKey(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length < 1) return null;
  if (trimmed.length > MAX_IDEMPOTENCY_KEY_LEN) return null;
  // Allow printable ASCII + non-ASCII for international clients.
  if (!CLIENT_KEY_PATTERN.test(trimmed)) {
    // Allow UTF-8 keys beyond ASCII too; reject only control chars.
    if (/[\x00-\x1F\x7F]/.test(trimmed)) return null;
  }
  return trimmed;
}

/**
 * Produce a deterministic synthetic key. Always 64-char lowercase hex
 * (SHA-256). Safe to use as a unique column value; not reversible to
 * the original input.
 */
export function syntheticKey(args: {
  ip: string | null | undefined;
  userAgent: string | null | undefined;
  contact: string;
  /** Override for tests; defaults to Date.now(). */
  nowMs?: number;
}): string {
  const now = args.nowMs ?? Date.now();
  const bucket = Math.floor(now / (SYNTHETIC_KEY_WINDOW_SECONDS * 1000));
  const input = [
    (args.ip ?? '').trim().toLowerCase(),
    (args.userAgent ?? '').trim().toLowerCase(),
    args.contact.trim().toLowerCase(),
    String(bucket),
  ].join('|');
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Resolve the idempotency key to use. Returns the client key when
 * present and well-formed; otherwise the synthetic key. Logs nothing;
 * the caller decides what to log.
 */
export function resolveIdempotencyKey(args: {
  headerValue: string | null | undefined;
  ip: string | null | undefined;
  userAgent: string | null | undefined;
  contact: string;
  nowMs?: number;
}): { value: string; source: 'client' | 'synthetic' } {
  const normalised = normaliseClientKey(args.headerValue);
  if (normalised) return { value: normalised, source: 'client' };
  return {
    value: syntheticKey({
      ip: args.ip,
      userAgent: args.userAgent,
      contact: args.contact,
      nowMs: args.nowMs,
    }),
    source: 'synthetic',
  };
}
