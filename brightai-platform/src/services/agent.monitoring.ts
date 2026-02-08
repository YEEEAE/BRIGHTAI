export type MonitoringLevel = "info" | "warn" | "error" | "debug";

export type ExecutionLogEntry = {
  id: string;
  executionId: string;
  agentId: string;
  nodeId?: string;
  message: string;
  level: MonitoringLevel;
  timestamp: string;
  data?: Record<string, unknown>;
};

const LOG_PREFIX = "brightai.execution.logs";
const MAX_LOGS = 300;

const buildKey = (executionId: string) => `${LOG_PREFIX}.${executionId}`;

const safeParse = (value: string | null): ExecutionLogEntry[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as ExecutionLogEntry[]) : [];
  } catch {
    return [];
  }
};

export class AgentMonitoring {
  // تسجيل خطوة تنفيذ مع تخزين محلي سريع
  record(entry: Omit<ExecutionLogEntry, "id" | "timestamp">) {
    const stored: ExecutionLogEntry = {
      ...entry,
      id: crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      const key = buildKey(entry.executionId);
      const current = safeParse(window.sessionStorage.getItem(key));
      const next = [...current, stored].slice(-MAX_LOGS);
      window.sessionStorage.setItem(key, JSON.stringify(next));
    }
  }

  // جلب آخر السجلات لواجهة المراقبة
  getRecent(executionId: string, limit = 50): ExecutionLogEntry[] {
    if (typeof window === "undefined") {
      return [];
    }
    const key = buildKey(executionId);
    const current = safeParse(window.sessionStorage.getItem(key));
    return current.slice(-limit);
  }
}

const agentMonitoring = new AgentMonitoring();
export default agentMonitoring;
