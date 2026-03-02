import { DEFAULT_MEMORY_LIMIT, DEFAULT_MODEL } from "./constants";
import type { AgentExecutionInput, ExecutionContext, NodeResult, Workflow, WorkflowNode } from "./types";

export const resolveModel = (agent: { settings?: Record<string, unknown> }): string => {
  return String(agent.settings?.model || DEFAULT_MODEL);
};

export const resolveCostLimit = (
  agent: { settings?: Record<string, unknown> },
  context: ExecutionContext
): number | null => {
  const limit = agent.settings?.maxCostUsd ?? context.variables.maxCostUsd;
  if (limit === undefined || limit === null) {
    return null;
  }
  return Number(limit);
};

export const sleep = async (duration: number): Promise<void> => {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
};

export const generateExecutionId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `exec_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
};

export const findNode = (workflow: Workflow, nodeId: string): WorkflowNode | null => {
  return workflow.nodes.find((node) => node.id === nodeId) || null;
};

export const storeOutput = (
  node: WorkflowNode,
  context: ExecutionContext,
  output: unknown
): void => {
  if (output === undefined) {
    return;
  }
  const key = String(node.data.outputKey || node.id);
  context.variables[key] = output;
};

export const pushHistory = (
  context: ExecutionContext,
  node: WorkflowNode,
  result: NodeResult
): void => {
  context.history.push({
    nodeId: node.id,
    type: node.type,
    success: result.success,
    output: result.output,
    error: result.error,
    errorCode: result.errorCode,
  });

  const limit = (context.variables.memory_limit as number) || DEFAULT_MEMORY_LIMIT;
  if (context.history.length > limit) {
    context.history.splice(0, context.history.length - limit);
  }

  context.variables.recent_history = context.history
    .slice(-6)
    .map((item) => `${item.type}: ${String(item.output ?? "")}`)
    .join("\n");
};

export const resolveTemplate = (value: string, context: ExecutionContext): string => {
  return value.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const path = String(key).trim().split(".");
    let current: unknown = context.variables;
    for (const segment of path) {
      if (current && typeof current === "object" && segment in (current as object)) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        current = "";
        break;
      }
    }
    return String(current ?? "");
  });
};

export const interpolateObject = (
  value: Record<string, unknown>,
  context: ExecutionContext
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    result[key] = typeof raw === "string" ? resolveTemplate(raw, context) : raw;
  }
  return result;
};

export const normalizeHeaders = (value: Record<string, unknown>): Record<string, string> => {
  const headers: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null) {
      continue;
    }
    headers[key] = String(raw);
  }
  return headers;
};

export const buildContext = (
  input: AgentExecutionInput,
  model: string,
  apiKey: string,
  workflow: Workflow,
  streamMode = false,
  streamCallback?: (chunk: string) => Promise<void>,
  traceId?: string,
  depth = 0,
  parentExecutionId?: string
): ExecutionContext => {
  const resolvedTrace = traceId || generateExecutionId();
  return {
    variables: {
      ...(input.context?.variables || {}),
      userMessage: input.userMessage,
      memory_limit: workflow.settings?.memoryLimit || DEFAULT_MEMORY_LIMIT,
      maxCostUsd: input.context?.maxCostUsd,
      trace_id: resolvedTrace,
    },
    history: [],
    metadata: {
      agentId: input.agentId,
      userId: input.context?.userId || "",
      startedAt: new Date().toISOString(),
      model,
      apiKey,
      workflow,
      traceId: resolvedTrace,
      depth,
      parentExecutionId,
      streamMode,
      streamCallback,
    },
  };
};
