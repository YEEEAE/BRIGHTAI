/**
 * @brightai/dashboard — Request context tests (P0-3, 2026-07-19).
 *
 * Verifies the AsyncLocalStorage-based context propagates correctly
 * across async boundaries (await, setTimeout, Promise.all).
 */

import { describe, expect, it } from 'vitest';
import {
  getOrgContext,
  getRequestContext,
  getRequestId,
  runWithRequestContext,
} from '@/lib/observability/request-context';

const baseCtx = {
  requestId: 'req_test_1',
  organizationId: 'org_1',
  userId: 'usr_1',
  path: '/test',
  method: 'GET',
  startedAt: Date.now(),
};

describe('request-context', () => {
  it('returns undefined when no context is set', () => {
    expect(getRequestContext()).toBeUndefined();
    expect(getRequestId()).toBe('no-request');
    expect(getOrgContext()).toEqual({ organizationId: undefined, userId: undefined });
  });

  it('exposes the active context inside runWithRequestContext', () => {
    runWithRequestContext(baseCtx, () => {
      const ctx = getRequestContext();
      expect(ctx?.requestId).toBe('req_test_1');
      expect(ctx?.organizationId).toBe('org_1');
      expect(ctx?.userId).toBe('usr_1');
      expect(getRequestId()).toBe('req_test_1');
      expect(getOrgContext()).toEqual({ organizationId: 'org_1', userId: 'usr_1' });
    });
  });

  it('preserves context across await', async () => {
    await runWithRequestContext(baseCtx, async () => {
      await Promise.resolve();
      expect(getRequestId()).toBe('req_test_1');
    });
  });

  it('preserves context across setTimeout', async () => {
    await runWithRequestContext(baseCtx, async () => {
      await new Promise((r) => setTimeout(r, 5));
      expect(getRequestId()).toBe('req_test_1');
    });
  });

  it('isolates concurrent contexts', async () => {
    const a = runWithRequestContext({ ...baseCtx, requestId: 'req_A' }, async () => {
      await new Promise((r) => setTimeout(r, 10));
      return getRequestId();
    });
    const b = runWithRequestContext({ ...baseCtx, requestId: 'req_B' }, async () => {
      await new Promise((r) => setTimeout(r, 5));
      return getRequestId();
    });
    const [idA, idB] = await Promise.all([a, b]);
    expect(idA).toBe('req_A');
    expect(idB).toBe('req_B');
  });
});
