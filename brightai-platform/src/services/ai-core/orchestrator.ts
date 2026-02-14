import agentExecutor from "../agent.executor";
import aiEventBus from "./event-bus";
import aiPlanner from "./planner";
import aiQualityEvaluator from "./evaluator";
import promptOptimizer from "./prompt-optimizer";
import type {
  OrchestratorExecuteInput,
  OrchestratorExecuteResult,
  QualityScore,
} from "./types";

const createTraceId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export class AiOrchestrator {
  async execute(input: OrchestratorExecuteInput): Promise<OrchestratorExecuteResult> {
    const traceId = input.context?.traceId || createTraceId();
    const minimumScore = Math.min(
      Math.max(input.orchestration?.minimumScore ?? 0.72, 0.5),
      0.95
    );
    const plan = aiPlanner.buildPlan(input, traceId);

    aiEventBus.emit(traceId, "ORCH_STARTED", {
      agentId: input.agentId,
      userId: input.context?.userId || "",
    });
    aiEventBus.emit(traceId, "PLAN_BUILT", {
      steps: plan.steps.map((step) => step.id),
      retries: plan.maxRetries,
    });

    let attempts = 0;
    let message = promptOptimizer.optimizeInitialMessage(input);
    let lastResult = await agentExecutor.execute({
      ...input,
      userMessage: message,
      context: { ...input.context, traceId },
    });
    let quality: QualityScore = aiQualityEvaluator.evaluate(lastResult.output, minimumScore);

    while (!quality.passed && attempts < plan.maxRetries) {
      attempts += 1;
      aiEventBus.emit(traceId, "RETRY_REQUESTED", {
        attempt: attempts,
        reasons: quality.reasons,
      });

      message = promptOptimizer.optimizeRetryMessage(message, quality.reasons);
      lastResult = await agentExecutor.execute({
        ...input,
        userMessage: message,
        context: { ...input.context, traceId },
      });
      quality = aiQualityEvaluator.evaluate(lastResult.output, minimumScore);
      aiEventBus.emit(traceId, "QUALITY_EVALUATED", {
        score: quality.score,
        passed: quality.passed,
        reasons: quality.reasons,
      });
    }

    aiEventBus.emit(traceId, "ORCH_COMPLETED", {
      attempts,
      score: quality.score,
      passed: quality.passed,
    });

    return {
      ...lastResult,
      traceId,
      attempts,
      quality,
    };
  }

  getTraceEvents(traceId: string) {
    return aiEventBus.getTraceEvents(traceId);
  }
}

const aiOrchestrator = new AiOrchestrator();
export default aiOrchestrator;
