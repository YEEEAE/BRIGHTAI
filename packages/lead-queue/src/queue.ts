/**
 * @brightai/lead-queue — Queue operations.
 *
 * - `enqueue()` is idempotent: a duplicate Idempotency-Key returns the
 *   existing row without insertion. The row's `lastError` and
 *   `status` are preserved.
 * - All DB access goes through the service-role client
 *   (`dbServiceRole` from @brightai/db). LeadQueue is not
 *   tenant-scoped, so RLS would silently drop inserts and updates.
 * - Calls log lead-hash only (never PII). See
 *   scripts/retention-sweep.mjs for the cron counterpart.
 */

import { dbServiceRole, Prisma } from '@brightai/db';
import type { LeadQueue } from '@brightai/db';
import type { EnqueueResult, LeadSubmission } from './types';

/**
 * Insert or fetch an existing LeadQueue row. The unique index on
 * `idempotencyKey` guarantees we never end up with two rows for the
 * same key. Returning the same shape regardless of which path won
 * keeps the endpoint's downstream code simple.
 */
export async function enqueue(
  submission: LeadSubmission,
): Promise<EnqueueResult> {
  const data: Prisma.LeadQueueUncheckedCreateInput = {
    idempotencyKey: submission.idempotencyKey,
    name: submission.name,
    contact: submission.contact,
    company: submission.company,
    page: submission.page ?? null,
    source: submission.source ?? null,
    ip: submission.ip ?? null,
    userAgent: submission.userAgent ?? null,
    status: 'PENDING',
    attempts: 0,
  };

  const existing = await dbServiceRole.leadQueue.findUnique({
    where: { idempotencyKey: submission.idempotencyKey },
  });
  if (existing) {
    return {
      id: existing.id,
      idempotencyKey: existing.idempotencyKey,
      created: false,
      status: existing.status,
      attempts: existing.attempts,
    };
  }

  try {
    const row = await dbServiceRole.leadQueue.create({ data });
    return {
      id: row.id,
      idempotencyKey: row.idempotencyKey,
      created: true,
      status: row.status,
      attempts: row.attempts,
    };
  } catch (err) {
    // Race: another writer inserted the same key between findUnique
    // and create. The unique index makes this safe — re-fetch and
    // return the now-existing row.
    if (isUniqueConstraintError(err, 'lead_queue_idempotency_key_key')) {
      const row = await dbServiceRole.leadQueue.findUnique({
        where: { idempotencyKey: submission.idempotencyKey },
      });
      if (row) {
        return {
          id: row.id,
          idempotencyKey: row.idempotencyKey,
          created: false,
          status: row.status,
          attempts: row.attempts,
        };
      }
    }
    throw err;
  }
}

/**
 * Mark a row as delivered (DLQ-resolved happy path). Used by
 * `delivery.ts` after a 2xx response.
 */
export async function markDelivered(args: {
  id: string;
  responseStatus: number;
}): Promise<void> {
  await dbServiceRole.leadQueue.update({
    where: { id: args.id },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      responseStatus: args.responseStatus,
      lastError: null,
      nextRetryAt: null,
    },
  });
}

/**
 * Record a failed attempt. Bumps `attempts`, sets `nextRetryAt` based
 * on the provided backoff schedule, and (when the budget is exhausted)
 * moves the row to DLQ. Returns the updated status so the caller can
 * decide whether to schedule another drain tick.
 */
export async function recordAttemptFailure(args: {
  id: string;
  responseStatus: number | null;
  errorMessage: string;
  backoffMinutes: readonly number[];
}): Promise<LeadQueue> {
  const row = await dbServiceRole.leadQueue.findUnique({ where: { id: args.id } });
  if (!row) throw new Error(`LeadQueue row not found: ${args.id}`);
  const attempt = row.attempts + 1;
  const budget = args.backoffMinutes.length;
  const isFinal = attempt >= budget + 1; // 1st failure counted as attempt 1
  const status: LeadQueue['status'] = isFinal ? 'DLQ' : 'PENDING';
  const nextRetryAt = isFinal
    ? null
    : new Date(
        Date.now() + (args.backoffMinutes[Math.min(attempt - 1, budget - 1)] ?? 30) * 60_000,
      );

  return dbServiceRole.leadQueue.update({
    where: { id: args.id },
    data: {
      attempts: attempt,
      status,
      nextRetryAt,
      dlqAt: isFinal ? new Date() : null,
      lastError: args.errorMessage.slice(0, 1000),
      responseStatus: args.responseStatus,
    },
  });
}

/**
 * Mark a row as currently being sent (transitions PENDING → SENDING
 * and clears nextRetryAt so concurrent workers don't double-pick it).
 * Uses a compare-and-set via updateMany to avoid races when two
 * workers fire at once.
 */
export async function claimNext(args: {
  now: Date;
  batchSize: number;
}): Promise<LeadQueue[]> {
  // Pick rows that are due for retry OR have never been attempted.
  // We lock them by transitioning to SENDING atomically; if a second
  // worker tries to grab the same row, the status mismatch stops it.
  const rows = await dbServiceRole.leadQueue.findMany({
    where: {
      status: 'PENDING',
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: args.now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: args.batchSize,
  });
  if (rows.length === 0) return [];

  // Atomic claim: only the rows actually in PENDING get flipped.
  const claimed: LeadQueue[] = [];
  for (const row of rows) {
    const updated = await dbServiceRole.leadQueue.updateMany({
      where: { id: row.id, status: 'PENDING' },
      data: { status: 'SENDING' },
    });
    if (updated.count === 1) {
      claimed.push({
        ...row,
        status: 'SENDING',
      });
    }
  }
  return claimed;
}

/**
 * Release a row back to PENDING (used when the worker process crashes
 * mid-flight — the row stays SENDING and would otherwise hang). The
 * caller is expected to set a sensible nextRetryAt so the next worker
 * picks it up promptly.
 */
export async function releaseMidFlight(args: {
  id: string;
  errorMessage: string;
  nextRetryInMinutes: number;
}): Promise<void> {
  await dbServiceRole.leadQueue.update({
    where: { id: args.id },
    data: {
      status: 'PENDING',
      lastError: args.errorMessage.slice(0, 1000),
      nextRetryAt: new Date(Date.now() + args.nextRetryInMinutes * 60_000),
    },
  });
}

/** Count rows by status (used by tests + health endpoint). */
export async function countByStatus(): Promise<Record<LeadQueue['status'], number>> {
  const rows = await dbServiceRole.leadQueue.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const out: Record<LeadQueue['status'], number> = {
    PENDING: 0,
    SENDING: 0,
    DELIVERED: 0,
    DLQ: 0,
    EXPIRED: 0,
  };
  for (const row of rows) {
    out[row.status] = row._count._all;
  }
  return out;
}

/** Type-narrow helper for Prisma unique-constraint errors. */
function isUniqueConstraintError(
  err: unknown,
  expectedIndexName: string,
): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: string; meta?: { target?: string[] | string } };
  if (e.code !== 'P2002') return false;
  if (Array.isArray(e.meta?.target)) {
    return e.meta!.target!.includes(expectedIndexName);
  }
  return e.meta?.target === expectedIndexName;
}
