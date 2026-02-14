import type { ExecutionPlan, OrchestratorExecuteInput } from "./types";

export class AiPlanner {
  buildPlan(input: OrchestratorExecuteInput, traceId: string): ExecutionPlan {
    const maxRetries = Math.min(
      Math.max(input.orchestration?.maxRetries ?? 1, 0),
      3
    );

    return {
      traceId,
      maxRetries,
      steps: [
        {
          id: "analyze_intent",
          name: "تحليل النية",
          goal: "تحويل طلب المستخدم إلى صياغة تشغيلية دقيقة.",
        },
        {
          id: "execute_workflow",
          name: "تنفيذ سير الوكيل",
          goal: "تشغيل الوكيل باستخدام السياق والمعرفة المتاحة.",
        },
        {
          id: "evaluate_quality",
          name: "تقييم الجودة",
          goal: "قياس جودة النتيجة وتحديد الحاجة لإعادة المحاولة.",
        },
      ],
    };
  }
}

const aiPlanner = new AiPlanner();
export default aiPlanner;
