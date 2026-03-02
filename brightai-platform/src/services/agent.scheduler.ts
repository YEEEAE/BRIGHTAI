import agentExecutor, { type AgentExecutionInput, type AgentExecutionResult } from "./agent.executor";

export type ScheduleTrigger = "cron" | "webhook" | "event" | "batch";

export type ScheduleTask = {
  id: string;
  agentId: string;
  trigger: ScheduleTrigger;
  cron?: string;
  eventName?: string;
  webhookToken?: string;
  payload: Omit<AgentExecutionInput, "agentId">;
  batch?: {
    inputs: string[];
    mode: "parallel" | "sequence";
  };
  status: "ACTIVE" | "PAUSED";
  nextRunAt?: string;
};

type TimerEntry = {
  taskId: string;
  timerId: number;
};

const MAX_CRON_LOOKAHEAD_MINUTES = 60 * 24 * 30;

const isMatch = (field: string, value: number, min: number, max: number): boolean => {
  if (field === "*") {
    return true;
  }
  if (field.includes(",")) {
    return field.split(",").some((part) => isMatch(part.trim(), value, min, max));
  }
  if (field.startsWith("*/")) {
    const step = Number(field.replace("*/", ""));
    if (!step || step <= 0) {
      return false;
    }
    return value % step === 0;
  }
  const numeric = Number(field);
  if (Number.isNaN(numeric)) {
    return false;
  }
  if (numeric < min || numeric > max) {
    return false;
  }
  return value === numeric;
};

const getNextCronRun = (cron: string, fromDate: Date) => {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return null;
  }
  const [minute, hour, day, month, weekday] = parts;
  let cursor = new Date(fromDate.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  for (let i = 0; i < MAX_CRON_LOOKAHEAD_MINUTES; i += 1) {
    const matches =
      isMatch(minute, cursor.getMinutes(), 0, 59) &&
      isMatch(hour, cursor.getHours(), 0, 23) &&
      isMatch(day, cursor.getDate(), 1, 31) &&
      isMatch(month, cursor.getMonth() + 1, 1, 12) &&
      isMatch(weekday, cursor.getDay(), 0, 6);

    if (matches) {
      return cursor;
    }
    cursor = new Date(cursor.getTime() + 60 * 1000);
  }
  return null;
};

export class AgentScheduler {
  private tasks = new Map<string, ScheduleTask>();
  private timers = new Map<string, TimerEntry>();

  // جدولة مهمة جديدة أو تحديث مهمة قائمة
  schedule(task: ScheduleTask) {
    this.tasks.set(task.id, task);
    this.clearTimer(task.id);

    if (task.status !== "ACTIVE") {
      return;
    }

    if (task.trigger === "cron" && task.cron) {
      const nextRun = getNextCronRun(task.cron, new Date());
      if (!nextRun) {
        return;
      }
      const delay = Math.max(0, nextRun.getTime() - Date.now());
      const timerId = window.setTimeout(async () => {
        await this.runTask(task.id);
        this.schedule({ ...task, nextRunAt: nextRun.toISOString() });
      }, delay);
      this.timers.set(task.id, { taskId: task.id, timerId });
      task.nextRunAt = nextRun.toISOString();
    }
  }

  // إيقاف مهمة مؤقتاً
  pause(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "PAUSED";
      this.clearTimer(taskId);
    }
  }

  // استئناف مهمة
  resume(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "ACTIVE";
      this.schedule(task);
    }
  }

  // تسجيل مهمة تعتمد على حدث داخلي
  registerEvent(task: ScheduleTask) {
    this.tasks.set(task.id, task);
  }

  // تسجيل مهمة تعتمد على ويبهوك
  registerWebhook(task: ScheduleTask, token?: string) {
    const webhookToken = token || this.generateToken();
    this.tasks.set(task.id, { ...task, webhookToken });
    return webhookToken;
  }

  // إطلاق حدث داخلي
  async emitEvent(eventName: string, payload?: Record<string, unknown>) {
    const tasks = Array.from(this.tasks.values()).filter(
      (task) => task.trigger === "event" && task.eventName === eventName && task.status === "ACTIVE"
    );
    for (const task of tasks) {
      await this.runTask(task.id, payload);
    }
  }

  // التعامل مع ويبهوك عبر رمز مخصص
  async handleWebhook(token: string, payload?: Record<string, unknown>) {
    const task = Array.from(this.tasks.values()).find(
      (item) => item.trigger === "webhook" && item.webhookToken === token && item.status === "ACTIVE"
    );
    if (task) {
      await this.runTask(task.id, payload);
    }
  }

  // تنفيذ مهمة جدولة مع دعم الدُفعات
  async runTask(taskId: string, payload?: Record<string, unknown>) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }
    if (task.trigger === "batch" && task.batch) {
      return await this.runBatch(task, payload);
    }
    return await this.runSingle(task, payload);
  }

  private async runSingle(task: ScheduleTask, payload?: Record<string, unknown>) {
    const userId = String(task.payload.context?.userId || "");
    if (!userId) {
      throw new Error("معرف المستخدم غير متوفر للتنفيذ المجدول.");
    }
    const input: AgentExecutionInput = {
      agentId: task.agentId,
      ...task.payload,
      userMessage: payload?.message
        ? String(payload.message)
        : task.payload.userMessage,
      context: {
        ...task.payload.context,
        userId,
        metadata: {
          ...(task.payload.context?.metadata || {}),
          scheduleId: task.id,
        },
      },
    };
    return await agentExecutor.execute(input);
  }

  private async runBatch(task: ScheduleTask, payload?: Record<string, unknown>) {
    const inputs = task.batch?.inputs || [];
    if (inputs.length === 0) {
      return [] as AgentExecutionResult[];
    }
    const userId = String(task.payload.context?.userId || "");
    if (!userId) {
      throw new Error("معرف المستخدم غير متوفر للتنفيذ المجدول.");
    }
    if (task.batch?.mode === "parallel") {
      return await Promise.all(
        inputs.map((message) =>
          agentExecutor.execute({
            agentId: task.agentId,
            ...task.payload,
            userMessage: message,
            context: {
              ...task.payload.context,
              userId,
              metadata: {
                ...(task.payload.context?.metadata || {}),
                scheduleId: task.id,
              },
            },
          })
        )
      );
    }
    const results: AgentExecutionResult[] = [];
    for (const message of inputs) {
      const result = await agentExecutor.execute({
        agentId: task.agentId,
        ...task.payload,
        userMessage: message,
        context: {
          ...task.payload.context,
          userId,
          metadata: {
            ...(task.payload.context?.metadata || {}),
            scheduleId: task.id,
          },
        },
      });
      results.push(result);
    }
    return results;
  }

  private clearTimer(taskId: string) {
    const timer = this.timers.get(taskId);
    if (timer) {
      window.clearTimeout(timer.timerId);
      this.timers.delete(taskId);
    }
  }

  private generateToken() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `wh_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  }
}

const agentScheduler = new AgentScheduler();
export default agentScheduler;
