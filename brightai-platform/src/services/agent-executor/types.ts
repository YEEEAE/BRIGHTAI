import type { GroqRequest } from "../groq.service";

export type AgentExecutionInput = {
  agentId: string;
  userMessage: string;
  context?: {
    userId: string;
    apiKey?: string;
    useUserKey?: boolean;
    maxCostUsd?: number;
    traceId?: string;
    depth?: number;
    metadata?: Record<string, unknown>;
    variables?: Record<string, unknown>;
  };
};

export type AgentExecutionResult = {
  output: string;
  tokensUsed: number;
  durationMs: number;
  cost: number;
  executionId?: string;
};

export type ExecutionUpdate = {
  type: "بدء" | "تقدم" | "عقدة" | "رسالة" | "انتهاء" | "خطأ";
  data: unknown;
  progress: number;
};

export type WorkflowNode = {
  id: string;
  type: "input" | "instruction" | "prompt" | "condition" | "action" | "output" | "loop" | "variable";
  data: Record<string, unknown>;
  position: { x: number; y: number };
};

export type WorkflowEdge = {
  source: string;
  target: string;
  condition?: {
    variable: string;
    operator: "equals" | "not_equals" | "includes" | "greater_than" | "less_than" | "exists" | "not_exists";
    value?: unknown;
  };
};

export type PromptingSettings = {
  systemPrefix?: string;
  systemSuffix?: string;
  fewShot?: Array<{ user: string; assistant: string }>;
  reactPattern?: boolean;
  selfReflection?: boolean;
  iterativeRefinement?: boolean;
};

export type Workflow = {
  nodes: WorkflowNode[];
  edges?: WorkflowEdge[];
  settings?: {
    parallel?: boolean;
    memoryLimit?: number;
    contextWindowTokens?: number;
    prompting?: PromptingSettings;
    collaboration?: {
      maxDepth?: number;
      shareContext?: boolean;
      useUserKey?: boolean;
    };
  };
};

export type ExecutionContext = {
  variables: Record<string, unknown>;
  history: Array<{ nodeId: string; type: WorkflowNode["type"]; success: boolean; output?: unknown; error?: string; errorCode?: AgentExecutorErrorCode }>;
  metadata: {
    agentId: string;
    userId: string;
    startedAt: string;
    model: string;
    apiKey: string;
    workflow: Workflow;
    traceId: string;
    depth: number;
    parentExecutionId?: string;
    streamMode?: boolean;
    streamCallback?: (chunk: string) => Promise<void>;
  };
};

export type NodeResult = {
  success: boolean;
  output?: unknown;
  error?: string;
  errorCode?: AgentExecutorErrorCode;
  tokensUsed?: number;
  cost?: number;
  durationMs?: number;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type AgentRow = {
  id: string;
  user_id: string;
  workflow?: Workflow;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ApiKeyRow = {
  key_encrypted: string | null;
};

export type AgentExecutorErrorCode = "AGENT_NOT_FOUND" | "INVALID_WORKFLOW" | "MISSING_API_KEY" | "NODE_FAILED" | "TIMEOUT" | "RATE_LIMIT" | "UNKNOWN";

export class AgentExecutorError extends Error {
  code: AgentExecutorErrorCode;
  constructor(message: string, code: AgentExecutorErrorCode) {
    super(message);
    this.name = "AgentExecutorError";
    this.code = code;
  }
}

export type AgentExecutionSummary = {
  output: string;
  tokensUsed: number;
  cost: number;
};

export type GroqOverrides = Partial<GroqRequest>;
