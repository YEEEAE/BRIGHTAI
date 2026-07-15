/**
 * @brightai/lead-queue — Public types.
 *
 * Re-exports the generated Prisma types for `LeadQueue` and its status
 * enum, plus local helpers used across the public API. Consumers should
 * import from here so we keep one source of truth for shape changes.
 */

import type { LeadQueue } from '@brightai/db';

export type {
  LeadQueue,
  LeadQueueStatus,
} from '@brightai/db';

/**
 * Input shape the Astro endpoint passes to `enqueue()`. Stored 1:1 on
 * the row (encrypted-at-rest when the database has pgcrypto enabled).
 */
export interface LeadSubmission {
  /** Idempotency-Key header value, OR a synthetic fallback. UNIQUE. */
  idempotencyKey: string;
  name: string;
  contact: string;
  company: string;
  page?: string;
  source?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Result returned by `enqueue()`. The endpoint uses this to build the
 * `mode` field in the JSON response (shipped | queued). For
 * idempotent duplicates, `mode` reflects what the original row
 * eventually did (or `pending` if it's still queued).
 */
export interface EnqueueResult {
  id: string;
  idempotencyKey: string;
  /** True when this call created the row (vs. matched an existing one). */
  created: boolean;
  status: LeadQueue['status'];
  attempts: number;
}

/**
 * Configuration the worker uses when draining the queue. Tuned for the
 * marketing-site Render Node service: small batch, short per-attempt
 * timeout, wide retry spread.
 */
export interface DeliveryConfig {
  /** Webhook URL to POST to (LEAD_WEBHOOK_URL env in caller). */
  webhookUrl: string;
  /** Optional HMAC secret. When set, `x-brightai-signature` is attached. */
  webhookSecret?: string;
  /**
   * How many attempts before a row moves to DLQ. Default 3
   * (matches the 1min + 5min + 30min schedule below).
   */
  maxAttempts?: number;
  /** HTTP fetch timeout per attempt in ms. Default 5000. */
  httpTimeoutMs?: number;
  /** How many rows to pull per drain tick. Default 10. */
  batchSize?: number;
}

/**
 * Outcome of a single delivery attempt.
 */
export type DeliveryOutcome =
  | { ok: true; responseStatus: number }
  | { ok: false; responseStatus: number | null; error: string };

/**
 * Schedule for exponential backoff. Attempt N waits `backoffMinutes[N]`
 * minutes before firing. Default = [1, 5, 30] (1st retry after 1min,
 * 2nd after 5min from then, 3rd after 30min from then). After 3
 * attempts the row moves to DLQ.
 */
export const DEFAULT_BACKOFF_MINUTES: readonly number[] = [1, 5, 30] as const;

/**
 * Retention windows. The sweep deletes:
 *   - DELIVERED rows older than `DELIVERED_TTL_DAYS` (default 7).
 *   - DLQ rows     older than `DLQ_TTL_DAYS` (default 30).
 */
export const DELIVERED_TTL_DAYS = 7;
export const DLQ_TTL_DAYS = 30;

/**
 * Synthetic-key resolution window. If two requests from the same client
 * (same ip + userAgent + contact) arrive within this window, they share
 * the same idempotency key (dedup). Anything older gets a new key. The
 * window is intentionally short so legitimate form resubmissions after
 * a network blip are not silently dropped.
 */
export const SYNTHETIC_KEY_WINDOW_SECONDS = 30;
