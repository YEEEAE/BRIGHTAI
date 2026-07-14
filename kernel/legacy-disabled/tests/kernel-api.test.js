import { beforeEach, describe, expect, it, vi } from 'vitest';
import './setup.js';
import { loadKernelScript } from './setup.js';

function response(data, init = {}) {
  const status = init.status || 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: vi.fn(async () => data),
  };
}

function loadApi() {
  window.BrightAIKernelConfig = {
    baseURL: 'https://api.brightai.test/kernel',
    retryAttempts: 2,
    retryDelays: [0, 0],
    retryMethods: ['GET', 'HEAD', 'OPTIONS'],
  };
  loadKernelScript('kernel/assets/js/kernel-utils.js');
  loadKernelScript('kernel/assets/js/kernel-api.js');
  return new window.KernelAPI();
}

describe('KernelAPI', () => {
  let api;

  beforeEach(() => {
    api = loadApi();
  });

  it('supports GET, POST, PUT, and DELETE requests', async () => {
    fetch.mockResolvedValue(response({ ok: true }));

    await api.request('/health');
    await api.request('/records', { method: 'POST', body: { name: 'policy' } });
    await api.request('/records/1', { method: 'PUT', body: { name: 'updated' } });
    await api.deletePolicy('policy-1');

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.brightai.test/kernel/health',
      expect.objectContaining({ method: 'GET', body: undefined })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.brightai.test/kernel/records',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'policy' }) })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'https://api.brightai.test/kernel/records/1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'updated' }) })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      'https://api.brightai.test/kernel/policies/policy-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('sends approval and rejection requests to the expected endpoints', async () => {
    fetch.mockResolvedValue(response({ id: 'trace 1', traceId: 'AI-2026-10001' }));

    const approved = await api.approveRequest('trace 1', 'مشرف');
    await api.rejectRequest('trace/2', 'مشرف', 'بيانات حساسة');

    expect(approved).toMatchObject({
      interactionId: 'trace 1',
      requestId: 'trace 1',
      traceId: 'AI-2026-10001',
    });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.brightai.test/kernel/approvals/trace%201/approve',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ approver: 'مشرف' }),
      })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.brightai.test/kernel/approvals/trace%2F2/reject',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ approver: 'مشرف', reason: 'بيانات حساسة' }),
      })
    );
  });

  it('supports bulkAction and executeApproved', async () => {
    fetch.mockResolvedValue(response({ id: 'trace-1', traceId: 'AI-2026-10001', ok: true }));

    await api.bulkAction(['trace-1', 'trace-2'], 'approve', 'مدير الامتثال');
    const executed = await api.executeApproved('trace-1');

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.brightai.test/kernel/approvals/bulk',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          requestIds: ['trace-1', 'trace-2'],
          action: 'approve',
          approver: 'مدير الامتثال',
        }),
      })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.brightai.test/kernel/approvals/trace-1/execute',
      expect.objectContaining({ method: 'POST' })
    );
    expect(executed).toMatchObject({ traceId: 'AI-2026-10001' });
  });

  it('throws APIError with response details for non-OK responses', async () => {
    fetch.mockResolvedValue(response({ error: 'فشل الطلب', code: 'BROKEN' }, { status: 500, ok: false }));

    await expect(api.request('/broken', { retry: false })).rejects.toMatchObject({
      name: 'APIError',
      status: 500,
      data: { error: 'فشل الطلب', code: 'BROKEN' },
    });
  });

  it('retries retryable GET failures and returns the successful response', async () => {
    fetch
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(response({ totalRequests: 4, riskDistribution: { high: 1 } }));

    const data = await api.getStats();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(data.totalRequests).toBe(4);
    expect(data.riskLevels.high).toBe(1);
  });
});
