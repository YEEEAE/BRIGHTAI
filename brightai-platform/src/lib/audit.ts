import supabase from "./supabase";

type AuditLevel = "info" | "warn" | "error";

type AuditEventInput = {
  action: string;
  tableName: string;
  level?: AuditLevel;
  payload?: Record<string, unknown>;
};

type AuditQueueEvent = {
  action: string;
  tableName: string;
  level: AuditLevel;
  payload: Record<string, unknown>;
  createdAt: string;
};

const AUDIT_QUEUE_KEY = "brightai_audit_queue";
const MAX_QUEUE_SIZE = 300;
const AUDIT_ENDPOINT = process.env.REACT_APP_AUDIT_ENDPOINT || "/api/audit";
const AUDIT_ENABLED = String(process.env.REACT_APP_AUDIT_ENABLED || "true").toLowerCase() !== "false";
const SAMPLE_RATE_RAW = Number(process.env.REACT_APP_AUDIT_SAMPLE_RATE || "1");
const SAMPLE_RATE = Number.isFinite(SAMPLE_RATE_RAW)
  ? Math.min(Math.max(SAMPLE_RATE_RAW, 0), 1)
  : 1;

let flushPromise: Promise<void> | null = null;
let lifecycleBound = false;

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
};

const readQueue = (): AuditQueueEvent[] => {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  const raw = storage.getItem(AUDIT_QUEUE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditQueueEvent[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: AuditQueueEvent[]) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(AUDIT_QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
};

const shouldSample = () => {
  if (SAMPLE_RATE >= 1) {
    return true;
  }
  return Math.random() <= SAMPLE_RATE;
};

const shouldSkipEndpoint = (endpoint: string) =>
  endpoint.includes("/api/audit") || endpoint.includes("/.netlify/functions/audit");

const getAuthToken = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return "";
    }
    return data.session?.access_token || "";
  } catch {
    return "";
  }
};

const postEvent = async (event: AuditQueueEvent): Promise<boolean> => {
  if (!AUDIT_ENABLED || shouldSkipEndpoint(AUDIT_ENDPOINT)) {
    return true;
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(AUDIT_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(event),
    keepalive: true,
  });

  return response.ok;
};

const bindLifecycleFlush = () => {
  if (lifecycleBound || typeof window === "undefined") {
    return;
  }
  lifecycleBound = true;

  const triggerFlush = () => {
    void flushAuditQueue();
  };

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      triggerFlush();
    }
  });
  window.addEventListener("beforeunload", triggerFlush);
};

export const flushAuditQueue = async () => {
  if (!AUDIT_ENABLED || typeof window === "undefined") {
    return;
  }
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = (async () => {
    const queue = readQueue();
    if (queue.length === 0) {
      return;
    }

    const failed: AuditQueueEvent[] = [];
    for (const event of queue) {
      try {
        const ok = await postEvent(event);
        if (!ok) {
          failed.push(event);
        }
      } catch {
        failed.push(event);
      }
    }

    writeQueue(failed);
  })().finally(() => {
    flushPromise = null;
  });

  await flushPromise;
};

export const queueAuditEvent = (input: AuditEventInput) => {
  if (!AUDIT_ENABLED || !shouldSample()) {
    return;
  }
  if (typeof window === "undefined") {
    return;
  }

  const event: AuditQueueEvent = {
    action: input.action,
    tableName: input.tableName,
    level: input.level || "info",
    createdAt: new Date().toISOString(),
    payload: {
      release: process.env.REACT_APP_RELEASE || "",
      environment: process.env.NODE_ENV || "development",
      pagePath: window.location.pathname,
      userAgent: navigator.userAgent,
      ...input.payload,
    },
  };

  const queue = readQueue();
  queue.push(event);
  writeQueue(queue);
  bindLifecycleFlush();
  void flushAuditQueue();
};

export const queueHttpAuditEvent = (payload: {
  endpoint: string;
  method: string;
  statusCode?: number;
  latencyMs: number;
  requestId?: string;
  success: boolean;
  source?: string;
}) => {
  if (shouldSkipEndpoint(payload.endpoint)) {
    return;
  }
  queueAuditEvent({
    action: "API_REQUEST",
    tableName: "http_client",
    level: payload.success ? "info" : "error",
    payload,
  });
};

export const queueSecurityAuditEvent = (payload: {
  type: string;
  message: string;
  meta?: Record<string, unknown>;
}) => {
  queueAuditEvent({
    action: "SECURITY_EVENT",
    tableName: "security_client",
    level: "warn",
    payload,
  });
};

export const queueAuthAuditEvent = (payload: {
  event: string;
  success: boolean;
  meta?: Record<string, unknown>;
}) => {
  queueAuditEvent({
    action: "AUTH_EVENT",
    tableName: "auth_client",
    level: payload.success ? "info" : "warn",
    payload,
  });
};

export const queueAiAuditEvent = (payload: {
  endpoint: string;
  model?: string;
  statusCode?: number;
  latencyMs: number;
  requestId?: string;
  success: boolean;
  usage?: Record<string, unknown>;
  error?: string;
}) => {
  queueAuditEvent({
    action: "AI_REQUEST",
    tableName: "ai_client",
    level: payload.success ? "info" : "error",
    payload,
  });
};

export const queueExecutionAuditEvent = (payload: {
  executionId: string;
  agentId: string;
  level: string;
  message: string;
  nodeId?: string;
  data?: Record<string, unknown>;
}) => {
  queueAuditEvent({
    action: "EXECUTION_EVENT",
    tableName: "agent_execution",
    level: payload.level === "error" ? "error" : payload.level === "warn" ? "warn" : "info",
    payload,
  });
};
