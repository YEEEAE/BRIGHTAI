/* BrightAI Kernel runtime Web Vitals telemetry */
(function (global) {
  'use strict';

  const METRIC_PREFIX = '[BrightAI Kernel Web Vitals]';
  const endpoint = global.BrightAIKernelVitalsEndpoint || global.BrightAIKernelAnalyticsEndpoint || '';
  const supportedTypes = new Set(global.PerformanceObserver?.supportedEntryTypes || []);
  const state = {
    lcp: null,
    cls: 0,
    inp: null,
    ttfbReported: false,
    finalReported: new Set()
  };

  function now() {
    return Math.round(global.performance?.now?.() || 0);
  }

  function ratingFor(name, value) {
    const thresholds = {
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      TTFB: [800, 1800],
      INP: [200, 500]
    }[name];

    if (!thresholds) return 'unknown';
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  }

  function roundedValue(name, value) {
    if (name === 'CLS') return Math.round(value * 1000) / 1000;
    return Math.round(value);
  }

  function metricPayload(name, value, detail = {}) {
    const rounded = roundedValue(name, value);
    return {
      name,
      value: rounded,
      rating: ratingFor(name, rounded),
      page: global.location?.pathname || '/',
      timestamp: Date.now(),
      performanceNow: now(),
      ...detail
    };
  }

  function sendMetric(name, value, detail = {}) {
    const payload = metricPayload(name, value, detail);

    if (global.console?.info) {
      global.console.info(METRIC_PREFIX, payload);
    }

    if (endpoint && global.navigator?.sendBeacon) {
      try {
        const body = JSON.stringify(payload);
        global.navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      } catch (_error) {
        // Telemetry must never affect the page.
      }
    }

    global.dispatchEvent?.(new CustomEvent('brightai:kernel-web-vital', { detail: payload }));
    return payload;
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

  function observeLcp() {
    observeType('largest-contentful-paint', (entry) => {
      state.lcp = entry;
    });
  }

  function observeFid() {
    observeType('first-input', (entry) => {
      const value = entry.processingStart - entry.startTime;
      sendMetric('FID', value, {
        eventType: entry.name || 'first-input',
        startTime: Math.round(entry.startTime)
      });
    });
  }

  function observeCls() {
    observeType('layout-shift', (entry) => {
      if (!entry.hadRecentInput) state.cls += entry.value || 0;
    });
  }

  function observeTtfb() {
    const reportNavigation = (entry) => {
      if (state.ttfbReported) return;
      const activationStart = entry.activationStart || 0;
      const value = Math.max(0, entry.responseStart - activationStart);
      state.ttfbReported = true;
      sendMetric('TTFB', value, {
        navigationType: entry.type || 'navigate',
        responseStart: Math.round(entry.responseStart || 0)
      });
    };

    observeType('navigation', reportNavigation);

    const navigation = global.performance?.getEntriesByType?.('navigation')?.[0];
    if (navigation) reportNavigation(navigation);
  }

  function observeInp() {
    const interactionDurations = new Map();

    observeType('event', (entry) => {
      const interactionId = entry.interactionId || `${entry.name}:${Math.round(entry.startTime)}`;
      const current = interactionDurations.get(interactionId) || 0;
      const duration = Math.max(current, entry.duration || 0);
      interactionDurations.set(interactionId, duration);

      if (!state.inp || duration > state.inp.value) {
        state.inp = {
          value: duration,
          eventType: entry.name || 'event',
          interactionId,
          startTime: entry.startTime
        };
      }
    }, { durationThreshold: 40 });
  }

  function flushFinalMetric(name, value, detail = {}) {
    if (value === null || value === undefined || state.finalReported.has(name)) return;
    state.finalReported.add(name);
    sendMetric(name, value, { phase: 'final', ...detail });
  }

  function flushPageMetrics() {
    if (state.lcp) {
      flushFinalMetric('LCP', state.lcp.renderTime || state.lcp.loadTime || state.lcp.startTime, {
        element: state.lcp.element?.tagName || '',
        url: state.lcp.url || ''
      });
    }

    flushFinalMetric('CLS', state.cls);

    if (state.inp) {
      flushFinalMetric('INP', state.inp.value, {
        eventType: state.inp.eventType,
        interactionId: String(state.inp.interactionId),
        startTime: Math.round(state.inp.startTime || 0)
      });
    }
  }

  observeLcp();
  observeFid();
  observeCls();
  observeTtfb();
  observeInp();

  global.addEventListener('visibilitychange', () => {
    if (global.document?.visibilityState === 'hidden') flushPageMetrics();
  });
  global.addEventListener('pagehide', flushPageMetrics, { once: true });

  global.BrightAIKernelWebVitals = {
    flush: flushPageMetrics,
    report: sendMetric
  };
})(window);
