/* BrightAI Kernel runtime performance instrumentation */
(function (global) {
  'use strict';

  const PERF_PREFIX = '[BrightAI Kernel Perf]';
  const API_SLOW_THRESHOLD_MS = 2000;
  const MEMORY_SAMPLE_MS = 15000;
  const endpoint = global.BrightAIKernelPerfEndpoint || global.BrightAIKernelAnalyticsEndpoint || '';
  const supportedTypes = new Set(global.PerformanceObserver?.supportedEntryTypes || []);
  const state = {
    scripts: [],
    apiCalls: [],
    memory: [],
    domNodes: 0,
    slowApiCalls: 0,
    reportElement: null
  };

  function isDevelopmentMode() {
    const host = global.location?.hostname || '';
    const params = new URLSearchParams(global.location?.search || '');
    let localFlag = false;

    try {
      localFlag = global.localStorage?.getItem('brightai_kernel_perf_report') === 'true';
    } catch (_error) {
      localFlag = false;
    }

    return host === 'localhost' || host === '127.0.0.1' || host === '' || params.has('kernelPerf') || localFlag;
  }

  function sendMetric(name, detail = {}) {
    const payload = {
      name,
      page: global.location?.pathname || '/',
      timestamp: Date.now(),
      performanceNow: Math.round(global.performance?.now?.() || 0),
      ...detail
    };

    if (name === 'api_call_slow') {
      global.console?.warn?.(PERF_PREFIX, payload);
    } else {
      global.console?.info?.(PERF_PREFIX, payload);
    }

    if (endpoint && global.navigator?.sendBeacon) {
      try {
        const body = JSON.stringify(payload);
        global.navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      } catch (_error) {
        // Runtime telemetry should stay non-blocking.
      }
    }

    global.dispatchEvent?.(new CustomEvent('brightai:kernel-perf', { detail: payload }));
    updateDevReport();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function observeType(type, callback, options = {}) {
    if (!global.PerformanceObserver || !supportedTypes.has(type)) return null;

    try {
      const observer = new global.PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true, ...options });
      return observer;
    } catch (_error) {
      return null;
    }
  }

  function observeScriptResources() {
    observeType('resource', (entry) => {
      const isScript = entry.initiatorType === 'script' || /\.js(?:\?|$)/i.test(entry.name);
      if (!isScript) return;

      const metric = {
        url: entry.name,
        duration: Math.round(entry.duration || 0),
        transferSize: entry.transferSize || 0,
        encodedBodySize: entry.encodedBodySize || 0,
        startTime: Math.round(entry.startTime || 0)
      };
      state.scripts.push(metric);
      sendMetric('script_load', metric);
    });
  }

  function normalizeUrl(input) {
    try {
      if (typeof input === 'string') return new URL(input, global.location?.origin);
      if (input instanceof Request) return new URL(input.url, global.location?.origin);
      if (input?.url) return new URL(input.url, global.location?.origin);
    } catch (_error) {
      return null;
    }
    return null;
  }

  function shouldTrackApi(url) {
    if (!url) return false;
    return url.origin === global.location?.origin && url.pathname.startsWith('/api/');
  }

  function recordApiCall(url, duration, status, error) {
    const metric = {
      url: `${url.pathname}${url.search}`,
      duration: Math.round(duration),
      status: status || 0,
      slow: duration > API_SLOW_THRESHOLD_MS,
      error: error ? String(error.message || error) : ''
    };

    state.apiCalls.push(metric);
    if (metric.slow) {
      state.slowApiCalls += 1;
      sendMetric('api_call_slow', metric);
      return;
    }

    sendMetric('api_call', metric);
  }

  function instrumentFetch() {
    if (typeof global.fetch !== 'function' || global.fetch.__brightAiKernelPerfWrapped) return;

    const nativeFetch = global.fetch.bind(global);
    const wrappedFetch = function (...args) {
      const url = normalizeUrl(args[0]);
      const start = global.performance?.now?.() || Date.now();

      return nativeFetch(...args)
        .then((response) => {
          if (shouldTrackApi(url)) recordApiCall(url, (global.performance?.now?.() || Date.now()) - start, response.status);
          return response;
        })
        .catch((error) => {
          if (shouldTrackApi(url)) recordApiCall(url, (global.performance?.now?.() || Date.now()) - start, 0, error);
          throw error;
        });
    };

    wrappedFetch.__brightAiKernelPerfWrapped = true;
    global.fetch = wrappedFetch;
  }

  function instrumentXhr() {
    if (!global.XMLHttpRequest || global.XMLHttpRequest.prototype.__brightAiKernelPerfWrapped) return;

    const proto = global.XMLHttpRequest.prototype;
    const nativeOpen = proto.open;
    const nativeSend = proto.send;

    proto.open = function (method, url, ...rest) {
      this.__brightAiKernelPerfUrl = normalizeUrl(url);
      return nativeOpen.call(this, method, url, ...rest);
    };

    proto.send = function (...args) {
      const url = this.__brightAiKernelPerfUrl;
      const start = global.performance?.now?.() || Date.now();

      this.addEventListener('loadend', () => {
        if (shouldTrackApi(url)) {
          recordApiCall(url, (global.performance?.now?.() || Date.now()) - start, this.status);
        }
      }, { once: true });

      return nativeSend.apply(this, args);
    };

    proto.__brightAiKernelPerfWrapped = true;
  }

  function sampleMemory() {
    const memory = global.performance?.memory;
    if (!memory) return;

    const metric = {
      usedJSHeapSize: memory.usedJSHeapSize || 0,
      totalJSHeapSize: memory.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory.jsHeapSizeLimit || 0
    };

    state.memory.push(metric);
    sendMetric('memory_usage', metric);
  }

  function countDomNodes() {
    if (!global.document?.getElementsByTagName) return 0;
    return global.document.getElementsByTagName('*').length;
  }

  function sampleDomNodes() {
    state.domNodes = countDomNodes();
    sendMetric('dom_nodes', { count: state.domNodes });
  }

  function observeDomNodes() {
    const sample = () => sampleDomNodes();
    let timer = null;

    global.addEventListener('DOMContentLoaded', sample, { once: true });
    global.addEventListener('load', sample, { once: true });

    if (!global.MutationObserver || !global.document?.documentElement) return;
    const observer = new global.MutationObserver(() => {
      global.clearTimeout(timer);
      timer = global.setTimeout(sample, 2000);
    });
    observer.observe(global.document.documentElement, { childList: true, subtree: true });
  }

  function createDevReport() {
    if (!isDevelopmentMode() || state.reportElement || !global.document?.body) return;

    const panel = global.document.createElement('section');
    panel.id = 'kernel-perf-report';
    panel.setAttribute('aria-label', 'BrightAI Kernel performance report');
    panel.style.cssText = [
      'position:fixed',
      'left:12px',
      'bottom:12px',
      'z-index:9999',
      'width:min(340px,calc(100vw - 24px))',
      'max-height:42vh',
      'overflow:auto',
      'padding:12px',
      'border:1px solid rgba(148,163,184,.35)',
      'border-radius:8px',
      'background:rgba(2,6,23,.94)',
      'color:#e2e8f0',
      'font:12px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'box-shadow:0 14px 36px rgba(0,0,0,.35)'
    ].join(';');

    state.reportElement = panel;
    global.document.body.appendChild(panel);
    updateDevReport();
  }

  function updateDevReport() {
    if (!state.reportElement) return;

    const lastMemory = state.memory[state.memory.length - 1];
    const slowestScript = state.scripts.reduce((slowest, item) => (
      !slowest || item.duration > slowest.duration ? item : slowest
    ), null);
    const slowestApi = state.apiCalls.reduce((slowest, item) => (
      !slowest || item.duration > slowest.duration ? item : slowest
    ), null);

    state.reportElement.innerHTML = `
      <strong style="display:block;margin-bottom:6px">Kernel Perf</strong>
      <div>Scripts observed: ${state.scripts.length}</div>
      <div>Slowest script: ${slowestScript ? `${slowestScript.duration}ms` : 'n/a'}</div>
      <div>API calls: ${state.apiCalls.length} (${state.slowApiCalls} slow)</div>
      <div>Slowest API: ${slowestApi ? `${slowestApi.duration}ms ${escapeHtml(slowestApi.url)}` : 'n/a'}</div>
      <div>DOM nodes: ${state.domNodes || countDomNodes()}</div>
      <div>JS heap: ${lastMemory ? `${Math.round(lastMemory.usedJSHeapSize / 1024 / 1024)}MB` : 'n/a'}</div>
    `;
  }

  observeScriptResources();
  instrumentFetch();
  instrumentXhr();
  observeDomNodes();
  sampleMemory();
  global.setInterval(sampleMemory, MEMORY_SAMPLE_MS);
  global.addEventListener('DOMContentLoaded', createDevReport, { once: true });
  global.addEventListener('pagehide', () => {
    sampleMemory();
    sampleDomNodes();
  }, { once: true });

  global.BrightAIKernelPerf = {
    state,
    sampleMemory,
    sampleDomNodes,
    report: sendMetric
  };
})(window);
