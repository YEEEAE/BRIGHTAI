/**
 * @brightai/lead-queue — Webhook delivery + retry orchestration.
 *
 * One `deliverOne(row, config)` call attempts the webhook. One
 * `drainOnce(config)` call picks all due rows and tries them in series.
 * The astro endpoint can call `drainOnce()` on startup and again on a
 * timer (60s by default).
 *
 * Retry schedule (DEFAULT_BACKOFF_MINUTES = [1, 5, 30]):
 *   - Attempt 1 fails → nextRetryAt = now + 1 min
 *   - Attempt 2 fails → nextRetryAt = now + 5 min
 *   - Attempt 3 fails → status = DLQ
 *
 * Why no parallel batching: the queue is low-volume and the webhook
 * receivers (Resend / HubSpot / Zapier / Slack / SendGrid) are slow.
 * Parallel calls would just trigger their rate limits and create
 * thundering-herd retries. Serial keeps the retry backoff predictable.
 */

import { createHmac, randomUUID } from 'node:crypto';
import {
  claimNext,
  markDelivered,
  recordAttemptFailure,
  releaseMidFlight,
} from './queue';
import type { LeadQueue } from '@brightai/db';
import type {
  DeliveryConfig,
  DeliveryOutcome,
} from './types';
import { DEFAULT_BACKOFF_MINUTES } from './types';

export type { DeliveryConfig, DeliveryOutcome } from './types';

/**
 * Build the HMAC-SHA256 signature header. Body is signed raw — the
 * receiver must verify against the exact bytes it received.
 */
export function signBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

/**
 * Fire one HTTP attempt. Aborts on timeout (AbortController). Returns
 * `ok: true` only when the response is in 2xx. Network errors and
 * non-2xx codes both result in `ok: false`.
 */
export async function tryDeliver(args: {
  body: string;
  url: string;
  signature: string | null;
  leadId: string;
  timeoutMs: number;
}): Promise<DeliveryOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-BrightAI-Lead-Id': args.leadId,
    'User-Agent': 'brightai-lead-queue/0.1',
    // Each call gets a unique X-Request-Id so the receiver can dedupe
    // across retries without changing the signature.
    'X-Request-Id': randomUUID(),
  };
  if (args.signature) headers['X-BrightAI-Signature'] = args.signature;

  try {
    const res = await fetch(args.url, {
      method: 'POST',
      headers,
      body: args.body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) return { ok: true, responseStatus: res.status };
    // Capture a short status-line for diagnostic purposes.
    return { ok: false, responseStatus: res.status, error: `http_${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      responseStatus: null,
      error: err instanceof Error ? err.message.slice(0, 200) : 'unknown_error',
    };
  }
}

/**
 * Build the canonical request body. Includes the lead fields the
 * previous in-memory implementation exposed, plus a small audit
 * envelope (delivery attempt count, last received timestamp).
 */
export function buildBody(
  row: LeadQueue,
  attempt: number,
): string {
  return JSON.stringify({
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    name: row.name,
    contact: row.contact,
    company: row.company,
    page: row.page,
    source: row.source ?? 'kernel',
    ip: row.ip, // OK to ship — the destination is operator-controlled.
    userAgent: row.userAgent,
    ts: row.createdAt.toISOString(),
    attempt,
  });
}

/**
 * Deliver a single row. Records success / failure. Returns the row's
 * new status so the worker can stop early on terminal states.
 */
export async function deliverOne(
  row: LeadQueue,
  config: DeliveryConfig,
): Promise<{ id: string; status: LeadQueue['status']; attempts: number }> {
  const timeoutMs = config.httpTimeoutMs ?? 5000;
  const secret = config.webhookSecret;
  const body = buildBody(row, row.attempts + 1);
  const signature = secret ? signBody(body, secret) : null;

  const outcome = await tryDeliver({
    body,
    url: config.webhookUrl,
    signature,
    leadId: row.id,
    timeoutMs,
  });

  if (outcome.ok) {
    await markDelivered({ id: row.id, responseStatus: outcome.responseStatus });
    return { id: row.id, status: 'DELIVERED', attempts: row.attempts + 1 };
  }

  const next = await recordAttemptFailure({
    id: row.id,
    responseStatus: outcome.responseStatus,
    errorMessage: outcome.error,
    backoffMinutes: DEFAULT_BACKOFF_MINUTES,
  });
  return { id: row.id, status: next.status, attempts: next.attempts };
}

/**
 * Drain loop body. Picks all due rows and tries each one in series.
 * Safe to call repeatedly (also from a `setInterval` in the Astro
 * endpoint) — claimNext() guarantees no row is picked twice.
 */
export async function drainOnce(config: DeliveryConfig): Promise<{
  processed: number;
  delivered: number;
  retried: number;
  dlq: number;
}> {
  if (!config.webhookUrl) {
    return { processed: 0, delivered: 0, retried: 0, dlq: 0 };
  }
  const maxAttempts = config.maxAttempts ?? DEFAULT_BACKOFF_MINUTES.length;
  const batchSize = config.batchSize ?? 10;
  const batch = await claimNext({ now: new Date(), batchSize });

  let delivered = 0;
  let retried = 0;
  let dlq = 0;

  for (const row of batch) {
    try {
      const result = await deliverOne(row, config);
      if (result.status === 'DELIVERED') delivered += 1;
      else if (result.status === 'DLQ') dlq += 1;
      else retried += 1;

      // Mark overflow attempts as DLQ when budget exceeded (defensive:
      // recordAttemptFailure already does this, but a stuck row in DLQ
      // shouldn't bounce back to PENDING if config changes).
      if (result.status === 'DLQ' && (row.attempts + 1) >= maxAttempts) {
        // already DLQ; nothing more to do.
      }
    } catch (err) {
      // Worker-side error: don't drop the row, return it to PENDING
      // so the next drain tick picks it up. Bubble the message.
      await releaseMidFlight({
        id: row.id,
        errorMessage: err instanceof Error ? err.message : 'unknown',
        nextRetryInMinutes: 1,
      });
    }
  }

  return { processed: batch.length, delivered, retried, dlq };
}
