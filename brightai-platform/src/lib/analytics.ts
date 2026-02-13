declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// أدوات تتبع الأحداث والتحليلات

type TrackingPayload = Record<string, unknown>;

type FunnelStep = {
  name: string;
  step: number;
  value?: number;
};

type EcommerceItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

type EcommercePayload = {
  currency: string;
  value: number;
  items: EcommerceItem[];
};

type PerformanceMetric = {
  name: string;
  value: number;
  unit?: string;
  meta?: Record<string, unknown>;
};

type AnalyticsState = {
  initialized: boolean;
  measurementId: string | null;
};

type SentryModule = typeof import("@sentry/react");

const ANALYTICS_QUEUE_KEY = "brightai_analytics_queue";
const ERROR_COUNTER_KEY = "brightai_error_counter";

const state: AnalyticsState = {
  initialized: false,
  measurementId: null,
};

let sentryModule: SentryModule | null = null;
let sentryPromise: Promise<SentryModule | null> | null = null;
let sentryInitialized = false;

const getSessionStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
};

const getDataLayer = () => {
  if (typeof window === "undefined") {
    return null;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  return window.dataLayer;
};

const loadGtagScript = (measurementId: string) => {
  if (typeof document === "undefined") {
    return;
  }
  const existing = document.querySelector(`script[data-ga4="${measurementId}"]`);
  if (existing) {
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.setAttribute("data-ga4", measurementId);
  document.head.appendChild(script);
};

const ensureSentry = async () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN || "";
  if (!dsn) {
    return null;
  }

  if (sentryModule) {
    return sentryModule;
  }

  if (!sentryPromise) {
    sentryPromise = import("@sentry/react")
      .then((module) => {
        sentryModule = module;
        return module;
      })
      .catch(() => null);
  }

  return sentryPromise;
};

const withSentry = (handler: (module: SentryModule) => void) => {
  if (sentryModule) {
    handler(sentryModule);
    return;
  }
  void ensureSentry().then((module) => {
    if (module) {
      handler(module);
    }
  });
};

const queueEvent = (payload: TrackingPayload) => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  const stored = storage.getItem(ANALYTICS_QUEUE_KEY);
  const queue = stored ? (JSON.parse(stored) as TrackingPayload[]) : [];
  queue.push({ ...payload, timestamp: new Date().toISOString() });
  storage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue.slice(-200)));
};

const flushQueue = () => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  const stored = storage.getItem(ANALYTICS_QUEUE_KEY);
  if (!stored) {
    return;
  }
  const queue = JSON.parse(stored) as TrackingPayload[];
  queue.forEach((payload) => send(payload));
  storage.removeItem(ANALYTICS_QUEUE_KEY);
};

const send = (payload: TrackingPayload) => {
  if (typeof window === "undefined" || !window.gtag || !state.measurementId) {
    queueEvent(payload);
    return;
  }
  incrementEventCount();
  window.gtag("event", payload.event || "custom_event", payload);
};

export const initAnalytics = () => {
  const measurementId = process.env.REACT_APP_GA4_ID || "";
  if (!measurementId) {
    return false;
  }
  state.initialized = true;
  state.measurementId = measurementId;

  loadGtagScript(measurementId);
  const dataLayer = getDataLayer();
  if (dataLayer && window.gtag) {
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      anonymize_ip: true,
    });
  }
  flushQueue();
  return true;
};

export const initSentry = async () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN || "";
  if (!dsn || sentryInitialized) {
    return false;
  }
  const module = await ensureSentry();
  if (!module) {
    return false;
  }
  module.init({ dsn });
  sentryInitialized = true;
  return true;
};

export const setUserProperties = (properties: Record<string, unknown>) => {
  if (!window.gtag || !state.measurementId) {
    queueEvent({ event: "user_properties", properties });
    return;
  }
  window.gtag("set", "user_properties", properties);
};

export const setUserContext = (user: { id: string; email?: string; name?: string }) => {
  if (window.gtag && state.measurementId) {
    window.gtag("set", { user_id: user.id });
  }
  withSentry((module) => {
    module.setUser({ id: user.id, email: user.email, username: user.name });
  });
};

export const trackPageView = (page: string) => {
  send({ event: "page_view", page_location: page, page_path: page });
};

export const trackEvent = (category: string, action: string, label?: string) => {
  send({ event: action, event_category: category, event_label: label || "" });
};

export const trackAgentCreated = (agentId: string, category?: string) => {
  send({ event: "agent_created", agent_id: agentId, category });
};

export const trackAgentExecuted = (agentId: string, status: string, durationMs?: number) => {
  send({ event: "agent_executed", agent_id: agentId, status, duration_ms: durationMs });
};

export const trackApiKeyAdded = (provider: string) => {
  send({ event: "api_key_added", provider });
};

export const trackTemplateUsed = (templateId: string, category?: string) => {
  send({ event: "template_used", template_id: templateId, category });
};

export const trackSettingsChanged = (section: string) => {
  send({ event: "settings_changed", section });
};

export const trackErrorEvent = (error: unknown, source?: string) => {
  const message = error instanceof Error ? error.message : "خطأ غير معروف";
  send({ event: "error_occurred", message, source });
  withSentry((module) => {
    module.captureException(error);
  });
  incrementErrorRate();
};

export const trackFeatureUsed = (feature: string, details?: Record<string, unknown>) => {
  send({ event: "feature_used", feature, ...details });
};

export const trackEcommercePurchase = (payload: EcommercePayload) => {
  send({ event: "purchase", ecommerce: payload });
};

export const trackEcommerceView = (payload: EcommercePayload) => {
  send({ event: "view_item", ecommerce: payload });
};

export const trackCustomDimensions = (dimensions: Record<string, unknown>) => {
  send({ event: "custom_dimensions", ...dimensions });
};

export const trackFunnelStep = (step: FunnelStep) => {
  send({ event: "funnel_step", step_name: step.name, step_number: step.step, value: step.value });
};

export const trackPerformanceMetric = (metric: PerformanceMetric) => {
  send({ event: "performance_metric", name: metric.name, value: metric.value, unit: metric.unit, meta: metric.meta });
};

export const trackPageLoad = () => {
  if (typeof performance === "undefined") {
    return;
  }
  const entries = performance.getEntriesByType("navigation");
  const entry = entries[0] as PerformanceNavigationTiming | undefined;
  if (!entry) {
    return;
  }
  trackPerformanceMetric({
    name: "page_load_time",
    value: Math.round(entry.loadEventEnd - entry.startTime),
    unit: "ms",
  });
};

export const trackApiResponseTime = (url: string, method: string, durationMs: number, status?: number) => {
  trackPerformanceMetric({
    name: "api_response_time",
    value: Math.round(durationMs),
    unit: "ms",
    meta: { url, method, status },
  });
};

export const trackExecutionDuration = (agentId: string, durationMs: number, status: string) => {
  trackPerformanceMetric({
    name: "execution_duration",
    value: Math.round(durationMs),
    unit: "ms",
    meta: { agentId, status },
  });
};

export const trackEngagement = (durationMs: number, page?: string) => {
  send({ event: "user_engagement", engagement_time_msec: Math.round(durationMs), page });
};

export const startSpan = (name: string, op: string) => {
  const sentry = sentryModule as unknown as {
    startSpan?: (config: { name: string; op: string }, callback: (span: any) => any) => any;
  };
  if (!sentry.startSpan) {
    void ensureSentry();
    return null;
  }
  return sentry.startSpan({ name, op }, (span) => span);
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, unknown>) => {
  withSentry((module) => {
    module.addBreadcrumb({ message, category, data, level: "info" });
  });
};

const incrementErrorRate = () => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  const stored = storage.getItem(ERROR_COUNTER_KEY);
  const payload = stored ? (JSON.parse(stored) as { total: number; errors: number }) : { total: 0, errors: 0 };
  payload.errors += 1;
  payload.total += 1;
  storage.setItem(ERROR_COUNTER_KEY, JSON.stringify(payload));
};

export const incrementEventCount = () => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  const stored = storage.getItem(ERROR_COUNTER_KEY);
  const payload = stored ? (JSON.parse(stored) as { total: number; errors: number }) : { total: 0, errors: 0 };
  payload.total += 1;
  storage.setItem(ERROR_COUNTER_KEY, JSON.stringify(payload));
};

export const getErrorRate = () => {
  const storage = getSessionStorage();
  if (!storage) {
    return 0;
  }
  const stored = storage.getItem(ERROR_COUNTER_KEY);
  if (!stored) {
    return 0;
  }
  const payload = JSON.parse(stored) as { total: number; errors: number };
  if (!payload.total) {
    return 0;
  }
  return Math.round((payload.errors / payload.total) * 10000) / 100;
};

export const trackBusinessMetrics = (metrics: Record<string, number>) => {
  send({ event: "business_metrics", ...metrics });
};

export const trackPlanConversion = (planId: string, value: number, currency = "SAR") => {
  trackEcommercePurchase({
    currency,
    value,
    items: [
      {
        item_id: planId,
        item_name: planId,
        item_category: "اشتراكات",
        price: value,
        quantity: 1,
      },
    ],
  });
};
