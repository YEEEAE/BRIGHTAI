import agentExecutor from "../agent.executor";
import agentMemory from "../agent.memory";
import aiEventBus from "./event-bus";
import aiPlanner from "./planner";
import aiQualityEvaluator from "./evaluator";
import promptOptimizer from "./prompt-optimizer";
import { initAiCoreTelemetry } from "./telemetry";
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
    initAiCoreTelemetry();

    const traceId = input.context?.traceId || createTraceId();
    const userId = input.context?.userId || "";
    if (!userId) {
      throw new Error("معرف المستخدم مطلوب للتنفيذ الذكي.");
    }
    const minimumScore = Math.min(
      Math.max(input.orchestration?.minimumScore ?? 0.72, 0.5),
      0.95
    );
    const plan = aiPlanner.buildPlan(input, traceId);

    aiEventBus.emit(traceId, "ORCH_STARTED", {
      agentId: input.agentId,
      userId,
    });
    aiEventBus.emit(traceId, "PLAN_BUILT", {
      steps: plan.steps.map((step) => step.id),
      retries: plan.maxRetries,
    });

    let attempts = 0;
    aiEventBus.emit(traceId, "STEP_STARTED", {
      stepId: "analyze_intent",
      stepName: "تحليل النية",
    });

    let message = promptOptimizer.optimizeInitialMessage(input);
    const memoryContext = await agentMemory.getContext(userId, input.agentId, input.userMessage);
    if (memoryContext.snippet) {
      message = `${message}\n\nسياق ذاكرة سابق:\n${memoryContext.snippet}`;
    }

    aiEventBus.emit(traceId, "STEP_COMPLETED", {
      stepId: "analyze_intent",
      stepName: "تحليل النية",
      semanticHits: memoryContext.items.length,
    });

    aiEventBus.emit(traceId, "STEP_STARTED", {
      stepId: "execute_workflow",
      stepName: "تنفيذ سير الوكيل",
      attempt: 0,
    });

    let lastResult = await agentExecutor.execute({
      ...input,
      userMessage: message,
      context: {
        ...input.context,
        userId,
        traceId,
        metadata: {
          ...(input.context?.metadata || {}),
          orchestrationTraceId: traceId,
          orchestrationAttempt: 0,
          orchestrationPlanSteps: plan.steps.map((item) => item.id),
        },
      },
    });
    aiEventBus.emit(traceId, "STEP_COMPLETED", {
      stepId: "execute_workflow",
      stepName: "تنفيذ سير الوكيل",
      attempt: 0,
      durationMs: lastResult.durationMs,
      tokensUsed: lastResult.tokensUsed,
      cost: lastResult.cost,
    });

    aiEventBus.emit(traceId, "STEP_STARTED", {
      stepId: "evaluate_quality",
      stepName: "تقييم الجودة",
      attempt: 0,
    });
    let quality: QualityScore = aiQualityEvaluator.evaluate(lastResult.output, minimumScore);
    aiEventBus.emit(traceId, "STEP_COMPLETED", {
      stepId: "evaluate_quality",
      stepName: "تقييم الجودة",
      attempt: 0,
      score: quality.score,
      passed: quality.passed,
    });
    aiEventBus.emit(traceId, "QUALITY_EVALUATED", {
      score: quality.score,
      passed: quality.passed,
      reasons: quality.reasons,
      attempt: 0,
    });

    while (!quality.passed && attempts < plan.maxRetries) {
      attempts += 1;
      aiEventBus.emit(traceId, "RETRY_REQUESTED", {
        attempt: attempts,
        reasons: quality.reasons,
      });

      message = promptOptimizer.optimizeRetryMessage(message, quality.reasons);
      aiEventBus.emit(traceId, "STEP_STARTED", {
        stepId: "execute_workflow",
        stepName: "تنفيذ سير الوكيل",
        attempt: attempts,
      });
      lastResult = await agentExecutor.execute({
        ...input,
        userMessage: message,
        context: {
          ...input.context,
          userId,
          traceId,
          metadata: {
            ...(input.context?.metadata || {}),
            orchestrationTraceId: traceId,
            orchestrationAttempt: attempts,
            orchestrationPlanSteps: plan.steps.map((item) => item.id),
            orchestrationRetryReasons: quality.reasons,
          },
        },
      });
      aiEventBus.emit(traceId, "STEP_COMPLETED", {
        stepId: "execute_workflow",
        stepName: "تنفيذ سير الوكيل",
        attempt: attempts,
        durationMs: lastResult.durationMs,
        tokensUsed: lastResult.tokensUsed,
        cost: lastResult.cost,
      });
      aiEventBus.emit(traceId, "STEP_STARTED", {
        stepId: "evaluate_quality",
        stepName: "تقييم الجودة",
        attempt: attempts,
      });
      quality = aiQualityEvaluator.evaluate(lastResult.output, minimumScore);
      aiEventBus.emit(traceId, "STEP_COMPLETED", {
        stepId: "evaluate_quality",
        stepName: "تقييم الجودة",
        attempt: attempts,
        score: quality.score,
        passed: quality.passed,
      });
      aiEventBus.emit(traceId, "QUALITY_EVALUATED", {
        score: quality.score,
        passed: quality.passed,
        reasons: quality.reasons,
        attempt: attempts,
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
