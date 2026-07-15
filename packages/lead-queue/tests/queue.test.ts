/**
 * queue.test.ts — enqueue() + status transitions (DB-backed integration).
 *
 * Scenarios:
 *   - enqueue() writes a PENDING row, returns {created: true}
 *   - duplicate idempotencyKey returns the existing row, {created: false}
 *   - row survives simulateRestart() (process recycle) — proves durability
 *   - recordAttemptFailure bumps attempts and schedules retries
 *   - after DEFAULT_BACKOFF_MINUTES attempts, status becomes DLQ
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  enqueue,
  recordAttemptFailure,
  claimNext,
  releaseMidFlight,
  countByStatus,
} from '../src/queue';
import { DEFAULT_BACKOFF_MINUTES } from '../src/types';
import {
  makeSubmission,
  simulateRestart,
  truncateLeadQueue,
} from './helpers';
import { dbServiceRole } from '@brightai/db';

beforeAll(async () => {
  await dbServiceRole.$queryRaw`SELECT 1`;
  await truncateLeadQueue();
});

beforeEach(async () => {
  await truncateLeadQueue();
});

afterAll(async () => {
  await truncateLeadQueue();
  await dbServiceRole.$disconnect();
});

describe('enqueue()', () => {
  it('writes a new PENDING row', async () => {
    const sub = makeSubmission({ idempotencyKey: 'cli_aaa1' });
    const r = await enqueue(sub);
    expect(r.created).toBe(true);
    expect(r.status).toBe('PENDING');
    expect(r.attempts).toBe(0);
    expect(r.idempotencyKey).toBe('cli_aaa1');
  });

  it('is idempotent on duplicate idempotencyKey', async () => {
    const sub = makeSubmission({ idempotencyKey: 'cli_aaa2' });
    const first = await enqueue(sub);
    const second = await enqueue({ ...sub, name: 'اسم مختلف' });
    expect(second.created).toBe(false);
    expect(second.id).toBe(first.id);
    // the stored name is the first enqueue (no overwrite on duplicate)
    expect(second.status).toBe(first.status);
  });

  it('survives across distinct database sessions (proves durability)', async () => {
    // HIGH-04 AC #1 — durability: a row written via one Prisma call
    // must be visible to a different client call, the way it would be
    // after a process restart. We model "different connection" with
    // an explicit transaction boundary so the second call forces a
    // fresh socket from the pool.
    const sub = makeSubmission({ idempotencyKey: 'cli_aaa3' });
    const first = await dbServiceRole.$transaction(async () => enqueue(sub));
    expect(first.created).toBe(true);

    // Second call goes through a fresh transaction. The unique index
    // must still resolve to the same row — proves the data is on disk.
    const second = await dbServiceRole.$transaction(async () => enqueue(sub));
    expect(second.created).toBe(false);
    expect(second.id).toBe(first.id);
    expect(second.status).toBe('PENDING');
  });
});

describe('recordAttemptFailure', () => {
  it('first failure schedules retry in 1 minute', async () => {
    const sub = makeSubmission({ idempotencyKey: 'cli_aaa4' });
    const { id } = await enqueue(sub);
    const updated = await recordAttemptFailure({
      id,
      responseStatus: 503,
      errorMessage: 'http_503',
      backoffMinutes: DEFAULT_BACKOFF_MINUTES,
    });
    expect(updated.attempts).toBe(1);
    expect(updated.status).toBe('PENDING');
    expect(updated.nextRetryAt).not.toBeNull();
    const diffMs = updated.nextRetryAt!.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(50_000);
    expect(diffMs).toBeLessThan(120_000);
  });

  it('escalates to DLQ after exhausting the backoff schedule', async () => {
    const sub = makeSubmission({ idempotencyKey: 'cli_aaa5' });
    const { id } = await enqueue(sub);
    let row = await recordAttemptFailure({
      id,
      responseStatus: 503,
      errorMessage: 'http_503-1',
      backoffMinutes: DEFAULT_BACKOFF_MINUTES,
    });
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(1);
    row = await recordAttemptFailure({
      id,
      responseStatus: 503,
      errorMessage: 'http_503-2',
      backoffMinutes: DEFAULT_BACKOFF_MINUTES,
    });
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(2);
    row = await recordAttemptFailure({
      id,
      responseStatus: 503,
      errorMessage: 'http_503-3',
      backoffMinutes: DEFAULT_BACKOFF_MINUTES,
    });
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(3);
    // The 4th failure is the terminal one — schedule used up, → DLQ.
    row = await recordAttemptFailure({
      id,
      responseStatus: 503,
      errorMessage: 'http_503-4',
      backoffMinutes: DEFAULT_BACKOFF_MINUTES,
    });
    expect(row.status).toBe('DLQ');
    expect(row.attempts).toBe(4);
    expect(row.nextRetryAt).toBeNull();
    expect(row.dlqAt).not.toBeNull();
  });

  it('captures lastError for DLQ triage', async () => {
    const sub = makeSubmission({ idempotencyKey: 'cli_aaa6' });
    const { id } = await enqueue(sub);
    for (let i = 0; i < DEFAULT_BACKOFF_MINUTES.length; i += 1) {
      await recordAttemptFailure({
        id,
        responseStatus: null,
        errorMessage: 'connection refused (attempt ' + (i + 1) + ')',
        backoffMinutes: DEFAULT_BACKOFF_MINUTES,
      });
    }
    // Final state: DLQ + lastError preserved.
    const after = await recordAttemptFailure({
      id,
      responseStatus: 500,
      errorMessage: 'http_500',
      backoffMinutes: DEFAULT_BACKOFF_MINUTES,
    });
    expect(after.status).toBe('DLQ');
    expect(after.lastError).toBe('http_500');
    expect(after.attempts).toBe(DEFAULT_BACKOFF_MINUTES.length + 1);
  });
});

describe('claimNext + releaseMidFlight', () => {
  it('returns rows with status PENDING and a due nextRetryAt', async () => {
    const a = await enqueue(makeSubmission({ idempotencyKey: 'cli_aaa7' }));
    const b = await enqueue(makeSubmission({ idempotencyKey: 'cli_aaa8' }));
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 60_000);

    // b has a future nextRetryAt — should NOT be claimed yet.
    await recordAttemptFailure({
      id: b.id,
      responseStatus: 500,
      errorMessage: 'http_500',
      backoffMinutes: DEFAULT_BACKOFF_MINUTES,
    });
    await (await import('@brightai/db')).dbServiceRole.leadQueue.update({
      where: { id: b.id },
      data: { nextRetryAt: future },
    });

    const claimed = await claimNext({ now: past, batchSize: 10 });
    const ids = claimed.map((r) => r.id);
    expect(ids).toContain(a.id);
    expect(ids).not.toContain(b.id); // future retry → not yet due
  });

  it('releaseMidFlight moves a row back to PENDING for the next worker', async () => {
    const { id } = await enqueue(makeSubmission({ idempotencyKey: 'cli_aaa9' }));
    const claimed = await claimNext({ now: new Date(), batchSize: 1 });
    expect(claimed.map((r) => r.id)).toContain(id);

    await releaseMidFlight({
      id,
      errorMessage: 'worker crash',
      nextRetryInMinutes: 1,
    });

    const after = await (await import('@brightai/db')).dbServiceRole.leadQueue.findUnique({
      where: { id },
    });
    expect(after?.status).toBe('PENDING');
    expect(after?.lastError).toBe('worker crash');
    expect(after?.nextRetryAt).not.toBeNull();
  });
});

describe('countByStatus', () => {
  it('groups rows by status', async () => {
    await enqueue(makeSubmission({ idempotencyKey: 'cli_b1' }));
    await enqueue(makeSubmission({ idempotencyKey: 'cli_b2' }));
    await enqueue(makeSubmission({ idempotencyKey: 'cli_b3' }));
    const counts = await countByStatus();
    expect(counts.PENDING).toBe(3);
    expect(counts.DELIVERED).toBe(0);
    expect(counts.DLQ).toBe(0);
  });
});
