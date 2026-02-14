import type { AgentExecutionInput } from "../agent.executor";

const buildRetryDirective = (reasons: string[]) => {
  if (reasons.length === 0) {
    return "";
  }
  return `\n\nتعليمات تحسين الجودة:\n- ${reasons.join("\n- ")}\n- قدّم إجابة عملية أكثر دقة مع خطوات تنفيذ واضحة.`;
};

export class PromptOptimizer {
  optimizeInitialMessage(input: AgentExecutionInput) {
    const base = input.userMessage.trim();
    if (!base) {
      return base;
    }

    const withConstraints = [
      base,
      "اكتب الإجابة بالعربية وبشكل عملي ومباشر.",
      "قسّم الإجابة إلى نقاط قابلة للتنفيذ.",
    ].join("\n");

    return withConstraints;
  }

  optimizeRetryMessage(previousMessage: string, reasons: string[]) {
    return `${previousMessage}${buildRetryDirective(reasons)}`;
  }
}

const promptOptimizer = new PromptOptimizer();
export default promptOptimizer;
