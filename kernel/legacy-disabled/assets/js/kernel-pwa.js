/* BrightAI Kernel PWA registration, install prompt, update notification, and helpers */
(function () {
  'use strict';

  const SW_URL = '/kernel/sw.js';
  const SW_SCOPE = '/kernel/';
  const INSTALL_DISMISSED_KEY = 'brightai_kernel_install_banner_dismissed';
  const LAST_PENDING_KEY = 'brightai_kernel_last_pending_count';
  const UPDATE_DISMISSED_KEY = 'brightai_kernel_update_dismissed_at';
  let deferredInstallPrompt = null;
  let pendingCheckTimer = null;
  const pwaPerf = initPwaPerformanceMetrics();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      pwaPerf.markRegistrationStart();
      navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE })
        .then((registration) => {
          pwaPerf.measureRegistration('success');
          watchForUpdates(registration);
          registerPeriodicSync(registration);
          return registration;
        })
        .catch((error) => {
          pwaPerf.measureRegistration('error', error);
        });
    });
  }

  /* ── Update Notification ──────────────────────────────── */
  function watchForUpdates(registration) {
    /* Check for updates on page focus (user returns to tab) */
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => null);
      }
    });

    /* Listen for new service worker waiting to activate */
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          /* New version available — show update notification */
          showUpdateNotification(registration);
        }
      });
    });

    /* Also check if a worker is already waiting when page loads */
    if (registration.waiting && navigator.serviceWorker.controller) {
      showUpdateNotification(registration);
    }

    /* Handle controller change after update */
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  function showUpdateNotification(registration) {
    /* Don't show if dismissed within the last 4 hours */
    const dismissedAt = Number(localStorage.getItem(UPDATE_DISMISSED_KEY) || '0');
    if (Date.now() - dismissedAt < 4 * 60 * 60 * 1000) return;

    /* Don't duplicate the banner */
    if (document.getElementById('kernel-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'kernel-update-banner';
    banner.className = 'kernel-update-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = window.DOMPurify?.sanitize?.(`
      <div class="kernel-update-banner__content">
        <iconify-icon class="icon-rotate" aria-hidden="true" icon="mdi:refresh"></iconify-icon>
        <div>
          <strong>تحديث جديد متوفر</strong>
          <span>يتوفر إصدار أحدث من BrightAI Kernel. حدّث الآن للحصول على أحدث التحسينات.</span>
        </div>
      </div>
      <div class="kernel-update-banner__actions">
        <button type="button" class="kernel-update-banner__button" id="kernel-update-action">تحديث</button>
        <button type="button" class="kernel-update-banner__dismiss" id="kernel-update-dismiss" aria-label="إخفاء">×</button>
      </div>
    `) || `
      <div class="kernel-update-banner__content">
        <iconify-icon class="icon-rotate" aria-hidden="true" icon="mdi:refresh"></iconify-icon>
        <div>
          <strong>تحديث جديد متوفر</strong>
          <span>يتوفر إصدار أحدث من BrightAI Kernel. حدّث الآن للحصول على أحدث التحسينات.</span>
        </div>
      </div>
      <div class="kernel-update-banner__actions">
        <button type="button" class="kernel-update-banner__button" id="kernel-update-action">تحديث</button>
        <button type="button" class="kernel-update-banner__dismiss" id="kernel-update-dismiss" aria-label="إخفاء">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('kernel-update-action')?.addEventListener('click', () => {
      /* Tell the waiting SW to skip waiting and activate immediately */
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      dismissUpdateBanner();
    });

    document.getElementById('kernel-update-dismiss')?.addEventListener('click', () => {
      localStorage.setItem(UPDATE_DISMISSED_KEY, String(Date.now()));
      dismissUpdateBanner();
    });
  }

  function dismissUpdateBanner() {
    const banner = document.getElementById('kernel-update-banner');
    if (banner) {
      banner.classList.add('kernel-update-banner--exiting');
      setTimeout(() => banner.remove(), 300);
    }
  }

  /* ── Periodic Background Sync Registration ─────────────── */
  async function registerPeriodicSync(registration) {
    if (!('periodicSync' in registration)) return;
    try {
      const tags = await registration.periodicSync.getTags();
      if (!tags.includes('brightai-kernel-periodic-sync')) {
        await registration.periodicSync.register('brightai-kernel-periodic-sync', {
          minInterval: 24 * 60 * 60 * 1000 // Once per day
        });
      }
    } catch (_error) {
      // Periodic background sync requires the app to be installed and have engagement.
      // Gracefully degrade — data will refresh on next visit.
    }
  }

  /* ── Install Prompt ────────────────────────────────────── */
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    dismissInstallBanner();
  });

  document.addEventListener('DOMContentLoaded', () => {
    showInstallBanner();
    initPendingApprovalNotifications();
  });

  function showInstallBanner() {
    if (!deferredInstallPrompt) return;
    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return;
    if (document.getElementById('kernel-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'kernel-install-banner';
    banner.className = 'kernel-install-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = window.DOMPurify?.sanitize?.(`
      <div class="kernel-install-banner__content">
        <strong>تثبيت BrightAI Kernel</strong>
        <span>شغّل لوحة الحوكمة كتطبيق سريع مع دعم offline.</span>
      </div>
      <div class="kernel-install-banner__actions">
        <button type="button" class="kernel-install-banner__button" id="kernel-install-action">تثبيت</button>
        <button type="button" class="kernel-install-banner__dismiss" id="kernel-install-dismiss" aria-label="إخفاء">×</button>
      </div>
    `) || `
      <div class="kernel-install-banner__content">
        <strong>تثبيت BrightAI Kernel</strong>
        <span>شغّل لوحة الحوكمة كتطبيق سريع مع دعم offline.</span>
      </div>
      <div class="kernel-install-banner__actions">
        <button type="button" class="kernel-install-banner__button" id="kernel-install-action">تثبيت</button>
        <button type="button" class="kernel-install-banner__dismiss" id="kernel-install-dismiss" aria-label="إخفاء">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('kernel-install-action')?.addEventListener('click', installKernelApp);
    document.getElementById('kernel-install-dismiss')?.addEventListener('click', () => {
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
      dismissInstallBanner();
    });
  }

  async function installKernelApp() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    dismissInstallBanner();
    await requestNotificationSupport();
  }

  function dismissInstallBanner() {
    document.getElementById('kernel-install-banner')?.remove();
  }

  /* ── Notifications ─────────────────────────────────────── */
  async function requestNotificationSupport() {
    if (!('Notification' in window) || Notification.permission === 'denied') return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission().catch(() => null);
    }
    await subscribeToPushNotifications();
  }

  async function subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const publicKey = window.BrightAIKernelPushPublicKey;
    if (!publicKey) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/kernel/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      }).catch(() => null);
    } catch (_error) {
      // Push subscription support is optional until the backend provides a VAPID key.
    }
  }

  function initPendingApprovalNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'default') {
      document.addEventListener('click', requestNotificationSupport, { once: true });
    } else if (Notification.permission === 'granted') {
      subscribeToPushNotifications();
    }

    checkPendingApprovalCount();
    pendingCheckTimer = window.setInterval(checkPendingApprovalCount, 60000);
    window.addEventListener('beforeunload', () => {
      if (pendingCheckTimer) window.clearInterval(pendingCheckTimer);
    });
  }

  async function checkPendingApprovalCount() {
    if (!navigator.onLine || Notification.permission !== 'granted') return;

    try {
      const response = await fetch('/api/kernel/approvals', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const count = Number(data.summary?.totalPending ?? data.total ?? data.pending?.length ?? 0) || 0;
      const lastCount = Number(localStorage.getItem(LAST_PENDING_KEY) || '0') || 0;
      localStorage.setItem(LAST_PENDING_KEY, String(count));

      if (count > lastCount && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_PENDING_APPROVAL_NOTIFICATION',
          count
        });
      }
    } catch (_error) {
      // Offline API fallback is handled by the service worker.
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /* ── Performance Metrics ───────────────────────────────── */
  function initPwaPerformanceMetrics() {
    const supportedTypes = new Set(window.PerformanceObserver?.supportedEntryTypes || []);
    const endpoint = window.BrightAIKernelPwaPerfEndpoint || window.BrightAIKernelAnalyticsEndpoint || '';
    const cacheStats = { hit: 0, miss: 0 };
    let registrationStatus = 'pending';

    function sendMetric(name, detail = {}) {
      const payload = {
        name,
        page: window.location.pathname || '/',
        timestamp: Date.now(),
        performanceNow: Math.round(performance.now?.() || 0),
        ...detail
      };

      console.info?.('[BrightAI Kernel PWA Perf]', payload);

      if (endpoint && navigator.sendBeacon) {
        try {
          const body = JSON.stringify(payload);
          navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
        } catch (_error) {
          // PWA telemetry is non-critical.
        }
      }

      window.dispatchEvent?.(new CustomEvent('brightai:kernel-pwa-perf', { detail: payload }));
    }

    function observeType(type, callback) {
      if (!window.PerformanceObserver || !supportedTypes.has(type)) return null;

      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        observer.observe({ type, buffered: true });
        return observer;
      } catch (_error) {
        return null;
      }
    }

    function updateCacheRatio(result, detail = {}) {
      if (result === 'hit') cacheStats.hit += 1;
      if (result === 'miss') cacheStats.miss += 1;

      const total = cacheStats.hit + cacheStats.miss;
      if (!total) return;

      sendMetric('cache_ratio', {
        hit: cacheStats.hit,
        miss: cacheStats.miss,
        hitRatio: Math.round((cacheStats.hit / total) * 1000) / 1000,
        ...detail
      });
    }

    function inferCacheResult(entry) {
      if (!entry.name || !entry.name.startsWith(window.location.origin)) return;
      const url = new URL(entry.name);
      if (!url.pathname.startsWith('/kernel/')) return;
      if (!['script', 'style', 'font', 'fetch'].includes(entry.initiatorType)) return;

      const hasBody = (entry.decodedBodySize || entry.encodedBodySize || 0) > 0;
      const result = entry.transferSize === 0 && hasBody ? 'hit' : 'miss';
      updateCacheRatio(result, {
        source: 'resource_timing',
        resourceType: entry.initiatorType,
        resource: url.pathname,
        duration: Math.round(entry.duration || 0)
      });
    }

    function reportOfflineFallbackFromNavigation(entry) {
      const isOfflineFallback = document.querySelector('.offline-shell') || !navigator.onLine;
      if (!isOfflineFallback) return;

      sendMetric('offline_fallback_latency', {
        source: 'navigation_timing',
        duration: Math.round(entry.duration || entry.responseEnd || 0),
        responseStart: Math.round(entry.responseStart || 0)
      });
    }

    observeType('measure', (entry) => {
      if (entry.name !== 'kernel-sw-registration') return;
      sendMetric('service_worker_registration', {
        duration: Math.round(entry.duration || 0),
        status: registrationStatus
      });
    });

    observeType('resource', inferCacheResult);
    observeType('navigation', reportOfflineFallbackFromNavigation);

    const navigation = performance.getEntriesByType?.('navigation')?.[0];
    if (navigation) reportOfflineFallbackFromNavigation(navigation);

    navigator.serviceWorker?.addEventListener?.('message', (event) => {
      const message = event.data || {};
      if (message.type !== 'KERNEL_PWA_PERF' || !message.metric) return;

      const metric = message.metric;
      const { name, ...metricDetail } = metric;
      if (name === 'cache') updateCacheRatio(metric.result, { source: 'service_worker', ...metricDetail });
      if (name === 'offline_fallback_latency') sendMetric('offline_fallback_latency', { source: 'service_worker', ...metricDetail });
    });

    return {
      markRegistrationStart() {
        performance.mark?.('kernel-sw-registration-start');
      },
      measureRegistration(status, error) {
        registrationStatus = status;
        performance.mark?.('kernel-sw-registration-end');
        try {
          performance.measure('kernel-sw-registration', 'kernel-sw-registration-start', 'kernel-sw-registration-end');
        } catch (_measureError) {
          sendMetric('service_worker_registration', {
            duration: 0,
            status,
            error: error ? String(error.message || error) : ''
          });
        }
      }
    };
  }
})();
