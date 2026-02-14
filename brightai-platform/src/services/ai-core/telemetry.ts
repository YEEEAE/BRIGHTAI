import agentMemory from "../agent.memory";
import agentMonitoring from "../agent.monitoring";
import aiEventBus from "./event-bus";
import type { AiEvent } from "./types";

type TraceContext = {
  userId: string;
  agentId: string;
};

const traceRegistry = new Map<string, TraceContext>();
let initialized = false;

const toLogMessage = (event: AiEvent) => {
  switch (event.type) {
    case "ORCH_STARTED":
      return "بدء تنسيق التنفيذ الذكي";
    case "PLAN_BUILT":
      return "تم بناء خطة التنفيذ";
    case "STEP_STARTED":
      return "بدء خطوة في الخطة";
    case "STEP_COMPLETED":
      return "اكتملت خطوة في الخطة";
    case "QUALITY_EVALUATED":
      return "تم تقييم جودة المخرج";
    case "RETRY_REQUESTED":
      return "تم طلب إعادة محاولة ذاتية";
    case "ORCH_COMPLETED":
      return "اكتمل التنسيق الذكي";
    case "ORCH_FAILED":
      return "فشل التنسيق الذكي";
    default:
      return "حدث تنسيقي";
  }
};

const toLevel = (event: AiEvent) => {
  if (event.type === "ORCH_FAILED") {
    return "error" as const;
  }
  if (event.type === "RETRY_REQUESTED") {
    return "warn" as const;
  }
  return "info" as const;
};

const handleEvent = (event: AiEvent) => {
  if (event.type === "ORCH_STARTED") {
    const userId = String(event.payload?.userId || "");
    const agentId = String(event.payload?.agentId || "");
    if (userId && agentId) {
      traceRegistry.set(event.traceId, { userId, agentId });
    }
  }

  const context = traceRegistry.get(event.traceId);
  agentMonitoring.record({
    executionId: event.traceId,
    agentId: context?.agentId || String(event.payload?.agentId || "unknown-agent"),
    message: toLogMessage(event),
    level: toLevel(event),
    data: {
      eventType: event.type,
      ...event.payload,
    },
  });

  if (event.type === "QUALITY_EVALUATED") {
    const passed = Boolean(event.payload?.passed);
    if (!passed && context?.userId && context.agentId) {
      const reasons = Array.isArray(event.payload?.reasons)
        ? (event.payload?.reasons as string[])
        : [];
      void agentMemory.addEntry({
        userId: context.userId,
        agentId: context.agentId,
        role: "system",
        content: `تقييم جودة منخفض. الأسباب: ${reasons.join(" | ") || "غير محدد"}`,
        metadata: {
          traceId: event.traceId,
          score: event.payload?.score,
        },
      });
    }
  }

  if (event.type === "ORCH_COMPLETED" || event.type === "ORCH_FAILED") {
    traceRegistry.delete(event.traceId);
  }
};

export const initAiCoreTelemetry = () => {
  if (initialized) {
    return;
  }
  initialized = true;
  aiEventBus.subscribe(handleEvent);
};
