import type { AgentExecutionInput, AgentExecutionResult } from "../agent.executor";

export type AiEventType =
  | "ORCH_STARTED"
  | "PLAN_BUILT"
  | "STEP_STARTED"
  | "STEP_COMPLETED"
  | "QUALITY_EVALUATED"
  | "RETRY_REQUESTED"
  | "ORCH_COMPLETED"
  | "ORCH_FAILED";

export type AiEvent = {
  id: string;
  traceId: string;
  type: AiEventType;
  timestamp: string;
  payload?: Record<string, unknown>;
};

export type ExecutionPlanStep = {
  id: string;
  name: string;
  goal: string;
};

export type ExecutionPlan = {
  traceId: string;
  steps: ExecutionPlanStep[];
  maxRetries: number;
};

export type QualityScore = {
  score: number;
  passed: boolean;
  reasons: string[];
};

export type OrchestratorExecuteInput = AgentExecutionInput & {
  orchestration?: {
    enabled?: boolean;
    maxRetries?: number;
    minimumScore?: number;
  };
};

export type OrchestratorExecuteResult = AgentExecutionResult & {
  traceId: string;
  attempts: number;
  quality: QualityScore;
};
