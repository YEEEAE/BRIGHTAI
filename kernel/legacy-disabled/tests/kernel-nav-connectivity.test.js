import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import './setup.js';
import { loadKernelScript } from './setup.js';

function loadNav({ online = true } = {}) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: online,
  });

  loadKernelScript('kernel/assets/js/kernel-utils.js');
  loadKernelScript('kernel/assets/js/kernel-nav.js');
  return window.KernelNav;
}

describe('KernelNav connectivity toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('does not show an offline toast while the browser is online', async () => {
    const nav = loadNav({ online: true });

    await nav.checkConnectivity();

    expect(document.querySelector('[data-kernel-connectivity-toast]')).toBeNull();
  });

  it('shows a dismissible toast only after an offline probe fails', async () => {
    const nav = loadNav({ online: false });
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await nav.checkConnectivity();

    const toast = document.querySelector('[data-kernel-connectivity-toast]');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('الاتصال بالإنترنت غير متاح');

    toast.querySelector('.toast-close').click();
    expect(document.querySelector('[data-kernel-connectivity-toast]')).toBeNull();
  });

  it('removes the offline toast automatically when connectivity returns', async () => {
    const nav = loadNav({ online: false });
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await nav.checkConnectivity();

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    window.dispatchEvent(new Event('online'));
    await Promise.resolve();

    expect(document.querySelector('[data-kernel-connectivity-toast]')).toBeNull();
  });

  it('ships the shared connectivity code through a fresh service-worker cache', () => {
    const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

    expect(serviceWorker).toContain("const KERNEL_CACHE_VERSION = '2026-06-10-1'");
    expect(serviceWorker).toContain("'/kernel/assets/js/kernel-nav.js'");
  });
});
