import type { QualityScore } from "./types";

const countWords = (text: string) => {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

export class AiQualityEvaluator {
  evaluate(output: string, minimumScore = 0.72): QualityScore {
    const reasons: string[] = [];
    let score = 1;

    const trimmed = output.trim();
    const words = countWords(trimmed);

    if (!trimmed) {
      score -= 0.6;
      reasons.push("المخرج فارغ.");
    }

    if (words < 12) {
      score -= 0.18;
      reasons.push("المخرج قصير وقد لا يغطي المطلوب.");
    }

    if (/(لا أعلم|غير متأكد|ربما)/.test(trimmed)) {
      score -= 0.08;
      reasons.push("المخرج يتضمن صياغة منخفضة الثقة.");
    }

    if (!/[.!؟]/.test(trimmed)) {
      score -= 0.05;
      reasons.push("تنسيق الإخراج ضعيف.");
    }

    score = Math.max(0, Number(score.toFixed(2)));

    return {
      score,
      passed: score >= minimumScore,
      reasons,
    };
  }
}

const aiQualityEvaluator = new AiQualityEvaluator();
export default aiQualityEvaluator;
