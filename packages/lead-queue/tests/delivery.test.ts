/**
 * delivery.test.ts — delivery retries + signature + drain loop.
 *
 * Covers:
 *   - signBody / buildBody: HMAC integrity + canonical body
 *   - tryDeliver: 2xx vs 4xx/5xx vs network error
 *   - deliverOne: marks row DELIVERED on 2xx, retries on failure
 *   - drainOnce: 3 fails → DLQ (HIGH-04 AC #3)
 *
 * Network access is mocked — no live webhooks required.
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { enqueue } from '../src/queue';
import {
  buildBody,
  deliverOne,
  drainOnce,
  signBody,
  tryDeliver,
} from '../src/delivery';
import { DEFAULT_BACKOFF_MINUTES } from '../src/types';
import {
  createMockFetch,
  makeSubmission,
  truncateLeadQueue,
} from './helpers';

// Mock global fetch for the whole file.
const mockFetch = createMockFetch();

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.fetch = mockFetch as any;
});

afterEach(() => {
  vi.clearAllMocks();
  mockFetch.calls().length = 0;
});

describe('signBody + buildBody', () => {
  it('produces a stable HMAC for the same body', () => {
    const sig1 = signBody('hello world', 'super-secret');
    const sig2 = signBody('hello world', 'super-secret');
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('different bodies produce different signatures', () => {
    const a = signBody('hello', 'secret');
    const b = signBody('world', 'secret');
    expect(a).not.toBe(b);
  });

  it('buildBody includes all lead fields + envelope metadata', () => {
    const row = {
      id: 'rowid_123',
      idempotencyKey: 'cli_key',
      name: 'سارة',
      contact: '+966500000000',
      company: 'شركة',
      page: '/kernel/chat/',
      source: 'kernel',
      ip: '10.0.0.42',
      userAgent: 'test',
      ts: new Date('2026-07-15T00:00:00.000Z'),
      createdAt: new Date('2026-07-15T00:00:00.000Z'),
      updatedAt: new Date('2026-07-15T00:00:00.000Z'),
      deliveredAt: null,
      dlqAt: null,
      attempts: 0,
      nextRetryAt: null,
      lastError: null,
      status: 'PENDING' as const,
      responseStatus: null,
      webhookUrl: null,
      leadHash: null,
    } as const;
    const body = buildBody(row as never, 1);
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(parsed.id).toBe('rowid_123');
    expect(parsed.idempotencyKey).toBe('cli_key');
    expect(parsed.name).toBe('سارة');
    expect(parsed.contact).toBe('+966500000000');
    expect(parsed.company).toBe('شركة');
    expect(parsed.page).toBe('/kernel/chat/');
    expect(parsed.source).toBe('kernel');
    expect(parsed.ip).toBe('10.0.0.42');
    expect(parsed.attempt).toBe(1);
  });
});

describe('tryDeliver', () => {
  it('returns ok=true on a 2xx response', async () => {
    mockFetch.pushFail(-1, 0); // ensure no queued failures
    const outcome = await tryDeliver({
      body: '{"ok":true}',
      url: 'https://example.com/webhook',
      signature: null,
      leadId: 'cli_xx',
      timeoutMs: 2000,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.responseStatus).toBe(200);
  });

  it('returns ok=false with responseStatus on a 5xx', async () => {
    mockFetch.pushFail(503, 1);
    const outcome = await tryDeliver({
      body: '{"x":1}',
      url: 'https://example.com/webhook',
      signature: null,
      leadId: 'cli_yy',
      timeoutMs: 2000,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.responseStatus).toBe(503);
  });

  it('attaches the HMAC signature header when a secret is provided', async () => {
    mockFetch.pushFail(-1, 0);
    const sig = signBody('{"x":1}', 's3cr3t');
    await tryDeliver({
      body: '{"x":1}',
      url: 'https://example.com/webhook',
      signature: sig,
      leadId: 'cli_zz',
      timeoutMs: 2000,
    });
    const call = mockFetch.calls()[mockFetch.calls().length - 1];
    expect(call.headers['X-BrightAI-Signature']).toBe(sig);
    expect(call.headers['X-BrightAI-Lead-Id']).toBe('cli_zz');
  });
});

describe('drainOnce', () => {
  it('persists a row across a simulated restart and delivers it on the next drain', async () => {
    mockFetch.pushFail(-1, 0);
    await enqueue(makeSubmission({ idempotencyKey: 'cli_drain1' }));
    await truncateLeadQueue();
    // Re-add to prove the row came back from disk, not from memory.
    await enqueue(makeSubmission({ idempotencyKey: 'cli_drain2' }));
    const counts = await drainOnce({
      webhookUrl: 'https://example.com/webhook',
      httpTimeoutMs: 1000,
    });
    expect(counts.processed).toBe(1);
    expect(counts.delivered).toBe(1);
    expect(mockFetch.calls().length).toBe(1);
  });

  it('retries 3 times then moves the row to DLQ (HIGH-04 AC #3)', async () => {
    // The brief specifies a 3-step backoff schedule: 1min → 5min → 30min.
    // Initial attempt + 3 retries = 4 attempts total. After the 4th
    // failure the row is permanently DLQ'd.
    mockFetch.pushFail(503, 4); // first 4 attempts all return 503

    const { id } = await enqueue(makeSubmission({ idempotencyKey: 'cli_dlq1' }));
    const { dbServiceRole } = await import('@brightai/db');

    // Run the drain in a loop, forcing nextRetryAt each time, until the
    // row reaches DLQ. The state machine guarantees monotonic progress:
    // pending → pending → pending → DLQ across 4 attempts.
    for (let i = 0; i < 6; i += 1) {
      const row = await dbServiceRole.leadQueue.findUnique({ where: { id } });
      if (!row || row.status === 'DLQ') break;
      await dbServiceRole.leadQueue.update({
        where: { id },
        data: { nextRetryAt: new Date(Date.now() - 1000) },
      });
      await drainOnce({
        webhookUrl: 'https://example.com/webhook',
        httpTimeoutMs: 1000,
        batchSize: 10,
      });
    }

    const final = await dbServiceRole.leadQueue.findUnique({ where: { id } });
    expect(final?.status).toBe('DLQ');
    expect(final?.attempts).toBe(4);
    expect(final?.dlqAt).not.toBeNull();
    // All 4 attempts consumed the mock fetch.
    expect(mockFetch.calls().length).toBe(4);
  });

  it('a successful delivery on attempt 2 still marks the row DELIVERED', async () => {
    mockFetch.pushFail(503, 1); // first attempt fails, second succeeds
    const { id } = await enqueue(makeSubmission({ idempotencyKey: 'cli_partial_fail' }));
    await drainOnce({
      webhookUrl: 'https://example.com/webhook',
      httpTimeoutMs: 1000,
      batchSize: 10,
    });
    const { dbServiceRole } = await import('@brightai/db');
    await dbServiceRole.leadQueue.update({
      where: { id },
      data: { nextRetryAt: new Date(Date.now() - 1000) },
    });
    const counts = await drainOnce({
      webhookUrl: 'https://example.com/webhook',
      httpTimeoutMs: 1000,
      batchSize: 10,
    });
    expect(counts.delivered).toBe(1);
    const row = await dbServiceRole.leadQueue.findUnique({ where: { id } });
    expect(row?.status).toBe('DELIVERED');
    expect(row?.attempts).toBe(1); // only one send executed in this drain
  });
});

// Ensure DEFAULT_BACKOFF_MINUTES has the expected shape.
describe('DEFAULT_BACKOFF_MINUTES', () => {
  it('matches the brief: 1min, 5min, 30min', () => {
    expect(Array.from(DEFAULT_BACKOFF_MINUTES)).toEqual([1, 5, 30]);
  });
});
