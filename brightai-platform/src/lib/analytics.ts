// أدوات تتبع الأحداث والتحليلات

type TrackingPayload = Record<string, unknown>;

const send = (payload: TrackingPayload) => {
  try {
    const stored = localStorage.getItem("brightai_analytics");
    const queue = stored ? (JSON.parse(stored) as TrackingPayload[]) : [];
    queue.push({ ...payload, timestamp: new Date().toISOString() });
    localStorage.setItem("brightai_analytics", JSON.stringify(queue));
  } catch {
    // تجاهل الأخطاء لمنع تعطيل الواجهة
  }
};

export const trackPageView = (page: string) => {
  send({ type: "page_view", page });
};

export const trackEvent = (category: string, action: string, label?: string) => {
  send({ type: "event", category, action, label });
};

export const trackError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "خطأ غير معروف";
  send({ type: "error", message });
};

export const trackTiming = (category: string, variable: string, time: number) => {
  send({ type: "timing", category, variable, time });
};
