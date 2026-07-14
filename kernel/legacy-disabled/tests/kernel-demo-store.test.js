import { beforeEach, describe, expect, it } from 'vitest';
import './setup.js';
import { kernelFixtures, loadKernelScript } from './setup.js';

function loadDemoStore() {
  window.BrightAIKernelConfig = {
    baseURL: 'https://api.brightai.test/kernel',
    mode: 'demo',
    retryAttempts: 0,
    retryDelays: [0],
  };
  loadKernelScript('kernel/assets/js/kernel-utils.js');
  loadKernelScript('kernel/assets/js/kernel-api.js');
  loadKernelScript('kernel/assets/js/kernel-demo-store.js');
  return window.KernelDemoStore;
}

describe('KernelDemoStore', () => {
  let store;

  beforeEach(() => {
    store = loadDemoStore();
  });

  it('initializes the mock database and persists it to localStorage', async () => {
    await store.ensureDBInitialized();

    expect(window.kernelDemoState).toBeTruthy();
    expect(window.kernelDemoState.stats.requests.total).toBeGreaterThan(0);
    expect(localStorage.getItem('brightai_kernel_mock_db')).toContain('connectors');
    expect(localStorage.getItem('brightai_kernel_demo_mode')).toBe('false');
  });

  it('loads connectors.json and scenarios.json into the demo database', async () => {
    await store.ensureDBInitialized();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/kernel/api/mock/connectors.json'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/kernel/api/mock/scenarios.json'));
    expect(window.kernelDemoState.connectors).toEqual(kernelFixtures.connectors);
    expect(window.kernelDemoState.scenarios).toEqual(kernelFixtures.scenarios);
  });

  it('generates SHA-256 hashes through crypto.subtle', async () => {
    const hash = await store.generateHash('hello');

    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
  });

  it('generates deterministic record hashes and links the previous hash into the chain', async () => {
    const record = {
      id: 'trace-1',
      action: 'BLOCKED',
      riskLevel: 'critical',
      createdAt: '2026-06-07T10:00:00.000Z',
      previousHash: 'prev-001',
    };
    const sameRecordHash = await store.generateRecordHash({ ...record });
    const repeatedHash = await store.generateRecordHash({ ...record });
    const nextHash = await store.generateRecordHash({ ...record, previousHash: sameRecordHash });

    expect(sameRecordHash).toMatch(/^[a-f0-9]{64}$/);
    expect(repeatedHash).toBe(sameRecordHash);
    expect(nextHash).toMatch(/^[a-f0-9]{64}$/);
    expect(nextHash).not.toBe(sameRecordHash);
  });
});
