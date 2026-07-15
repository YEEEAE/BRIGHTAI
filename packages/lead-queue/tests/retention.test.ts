/**
 * retention.test.ts — TTL sweep (HIGH-04 AC #4).
 *
 * Sweep deletes:
 *   - DELIVERED rows where deliveredAt < now - 7 days
 *   - DLQ rows     where dlqAt < now - 30 days
 *
 * Young rows are left untouched.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { enqueue, markDelivered } from '../src/queue';
import { sweepDelivered, sweepDlq, runRetentionSweep } from '../src/retention';
import { DELIVERED_TTL_DAYS, DLQ_TTL_DAYS } from '../src/types';
import { makeSubmission, truncateLeadQueue } from './helpers';
import { dbServiceRole } from '@brightai/db';

beforeAll(async () => {
  // Sanity ping + truncate once before the suite so leftovers from
  // queue.test.ts (or earlier suites) don't pollute this one.
  await dbServiceRole.$queryRaw`SELECT 1`;
  await truncateLeadQueue();
});

beforeEach(async () => {
  await truncateLeadQueue();
});

afterAll(async () => {
  await truncateLeadQueue();
});

async function setDeliveredAtAgo(id: string, days: number): Promise<void> {
  const past = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await dbServiceRole.leadQueue.update({
    where: { id },
    data: { deliveredAt: past, status: 'DELIVERED', responseStatus: 200 },
  });
}

async function setDlqAtAgo(id: string, days: number): Promise<void> {
  const past = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await dbServiceRole.leadQueue.update({
    where: { id },
    data: { dlqAt: past, status: 'DLQ', lastError: 'expired' },
  });
}

describe('sweepDelivered', () => {
  it('removes rows older than DELIVERED_TTL_DAYS', async () => {
    const now = Date.now();
    const old = await dbServiceRole.leadQueue.create({
      data: {
        idempotencyKey: 'cli_ret1',
        name: 'سارة',
        contact: 'sara@test.sa',
        company: 'شركة',
        status: 'DELIVERED',
        deliveredAt: new Date(now - (DELIVERED_TTL_DAYS + 2) * 24 * 60 * 60 * 1000),
        responseStatus: 200,
      },
    });
    const young = await dbServiceRole.leadQueue.create({
      data: {
        idempotencyKey: 'cli_ret2',
        name: 'نورة',
        contact: 'nora@test.sa',
        company: 'شركة',
        status: 'DELIVERED',
        deliveredAt: new Date(now - 60_000), // 1 minute ago
        responseStatus: 200,
      },
    });

    // Sanity: both rows exist.
    expect(await dbServiceRole.leadQueue.count()).toBe(2);

    const deleted = await sweepDelivered();
    expect(deleted).toBe(1);

    const remaining = await dbServiceRole.leadQueue.findMany({});
    const ids = remaining.map((r) => r.id);
    expect(ids).toContain(young.id);
    expect(ids).not.toContain(old.id);
  });

  it('does NOT delete rows under the TTL even if they are DELIVERED', async () => {
    const r = await dbServiceRole.leadQueue.create({
      data: {
        idempotencyKey: 'cli_ret3',
        name: 'هند',
        contact: 'hind@test.sa',
        company: 'شركة',
        status: 'DELIVERED',
        deliveredAt: new Date(),
        responseStatus: 200,
      },
    });
    const deleted = await sweepDelivered();
    expect(deleted).toBe(0);
    const after = await dbServiceRole.leadQueue.findUnique({ where: { id: r.id } });
    expect(after).not.toBeNull();
  });
});

describe('sweepDlq', () => {
  it('removes DLQ rows whose dlqAt is older than DLQ_TTL_DAYS', async () => {
    const now = Date.now();
    const old = await dbServiceRole.leadQueue.create({
      data: {
        idempotencyKey: 'cli_dlq_old',
        name: 'أحمد',
        contact: '+966538229013',
        company: 'شركة',
        status: 'DLQ',
        dlqAt: new Date(now - (DLQ_TTL_DAYS + 2) * 24 * 60 * 60 * 1000),
        lastError: 'http_503 x3',
      },
    });
    const young = await dbServiceRole.leadQueue.create({
      data: {
        idempotencyKey: 'cli_dlq_young',
        name: 'فاطمة',
        contact: 'fatima@test.sa',
        company: 'شركة',
        status: 'DLQ',
        dlqAt: new Date(now - 60_000),
        lastError: 'http_503 x3',
      },
    });

    const deleted = await sweepDlq();
    expect(deleted).toBe(1);
    const ids = (await dbServiceRole.leadQueue.findMany({})).map((r) => r.id);
    expect(ids).not.toContain(old.id);
    expect(ids).toContain(young.id);
  });
});

describe('runRetentionSweep', () => {
  it('returns both counts in a single call', async () => {
    const now = Date.now();
    const r1 = await dbServiceRole.leadQueue.create({
      data: {
        idempotencyKey: 'cli_full_1',
        name: 'محمد',
        contact: 'mh@test.sa',
        company: 'شركة',
        status: 'DELIVERED',
        deliveredAt: new Date(now - (DELIVERED_TTL_DAYS + 2) * 24 * 60 * 60 * 1000),
        responseStatus: 200,
      },
    });
    const r2 = await dbServiceRole.leadQueue.create({
      data: {
        idempotencyKey: 'cli_full_2',
        name: 'منى',
        contact: 'mona@test.sa',
        company: 'شركة',
        status: 'DLQ',
        dlqAt: new Date(now - (DLQ_TTL_DAYS + 2) * 24 * 60 * 60 * 1000),
        lastError: 'http_503 x3',
      },
    });

    const result = await runRetentionSweep();
    expect(result.deliveredDeleted).toBe(1);
    expect(result.dlqDeleted).toBe(1);
    expect(result.sweptAt).toBeInstanceOf(Date);

    const remaining = await dbServiceRole.leadQueue.findMany({});
    const ids = remaining.map((r) => r.id);
    expect(ids).not.toContain(r1.id);
    expect(ids).not.toContain(r2.id);
  });
});
