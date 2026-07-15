/**
 * Shared test helpers — DB isolation, sample payloads, mock fetch.
 *
 * Each integration test gets a clean LeadQueue table. The helpers
 * here are the only place that talks to the real Prisma client.
 */

import { dbServiceRole } from '@brightai/db';

/**
 * Truncate the lead_queue table. Used in beforeEach / afterEach so
 * each test starts with a clean slate.
 */
export async function truncateLeadQueue(): Promise<void> {
  await dbServiceRole.leadQueue.deleteMany({});
}

/**
 * Build a deterministic submission payload. `ip` and `userAgent`
 * default to fixed values so tests share the same synthetic key
 * patterns unless they explicitly vary them.
 */
export function makeSubmission(
  overrides: Partial<{
    idempotencyKey: string;
    name: string;
    contact: string;
    company: string;
    page: string;
    source: string;
    ip: string;
    userAgent: string;
  }> = {},
) {
  return {
    idempotencyKey:
      overrides.idempotencyKey ??
      'cli_' + Math.random().toString(36).slice(2, 18).padEnd(16, '0'),
    name: overrides.name ?? 'أحمد محمد السبيعي',
    contact: overrides.contact ?? '+966538229013',
    company: overrides.company ?? 'شركة الاختبار للذكاء الاصطناعي',
    page: overrides.page ?? '/kernel/compliance/',
    source: overrides.source ?? 'test',
    ip: overrides.ip ?? '10.0.0.42',
    userAgent: overrides.userAgent ?? 'test-runner/0.1',
  };
}

export interface RecordedCall {
  url: string;
  body: string;
  headers: Record<string, string>;
}

/**
 * A minimal mock fetch that records each call. Returns 2xx by default
 * unless a queued failure is set via pushFail().
 */
export interface MockFetch {
  (...args: unknown[]): Promise<Response>;
  pushFail: (status: number, times: number) => void;
  calls: () => RecordedCall[];
}

export function createMockFetch(): MockFetch {
  const calls: RecordedCall[] = [];
  const failures: { status: number; times: number }[] = [];

  const fn = (...args: unknown[]): Promise<Response> => {
    const [url, init] = args as [string, RequestInit];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = typeof init?.body === 'string' ? init.body : '';
    calls.push({ url, body, headers });

    const pendingFail = failures.find((f) => f.times > 0);
    if (pendingFail) {
      pendingFail.times -= 1;
      return Promise.resolve(new Response('nope', { status: pendingFail.status }));
    }
    return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
  };

  fn.pushFail = (status: number, times: number) => {
    failures.push({ status, times });
  };
  fn.calls = () => calls;
  return fn;
}

/**
 * Simulate process restart by closing the underlying PG pool so the
 * next call rebuilds it. Mirrors what happens in production when a
 * process is recycled.
 */
export async function simulateRestart(): Promise<void> {
  await dbServiceRole.$disconnect();
}
