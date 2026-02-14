import {
  clampKnowledgeContext,
  delay,
  retrieveKnowledgeChunks,
  تقديرالرموز,
} from "../../lib/agent-builder.utils";
import { GroqService } from "../../services/groq.service";
import apiKeyService from "../../services/apikey.service";
import type { حالةالنموذج, مقطعمعرفةاختبار } from "../../types/agent-builder.types";

export const resolveGroqClient = async () => {
  if (process.env.REACT_APP_GROQ_API_KEY) {
    return new GroqService(process.env.REACT_APP_GROQ_API_KEY);
  }

  try {
    const key = await apiKeyService.getApiKey("groq");
    if (key) {
      return new GroqService(key);
    }
  } catch {
    return null;
  }

  return null;
};

export const buildFallbackReply = (form: حالةالنموذج, message: string) => {
  const resolvedCategory =
    form.الفئة === "أخرى (مخصصة)" ? form.فئةمخصصة.trim() || "أخرى" : form.الفئة;

  const bullets = [
    `تلقيت طلبك حول: ${message}`,
    `سأتعامل معه وفق فئة: ${resolvedCategory}`,
    `نبرة الإجابة: ${form.اللهجة}`,
    "الخطوة المقترحة: ابدأ بتحديد الهدف التجاري والقيود المتاحة ثم نفذ خطة قصيرة من ثلاث مراحل.",
  ];

  if (form.قواعدالسلوك.length > 0) {
    bullets.push(`قاعدة مطبقة: ${form.قواعدالسلوك[0]}`);
  }

  return bullets.join("\n");
};

export const streamFallbackReply = async (full: string) => {
  let current = "";
  for (const char of full) {
    current += char;
    await delay(14);
  }
  return current;
};

const formatKnowledgeContext = (chunks: مقطعمعرفةاختبار[]) => {
  const active = chunks.filter((chunk) => chunk.enabled);
  if (active.length === 0) {
    return "";
  }
  const lines = active.map((chunk, index) => `[${index + 1}] ${chunk.source}\n${chunk.text}`);
  return `مقاطع معرفة مسترجعة (الأكثر صلة بالسؤال):\n${lines.join("\n\n")}`;
};

export const buildKnowledgeContext = (
  question: string,
  form: حالةالنموذج,
  lastKnowledgeChunks: مقطعمعرفةاختبار[]
) => {
  if (!form.تفعيلالاسترجاعالمعرفي) {
    return { chunks: [] as مقطعمعرفةاختبار[], context: "" };
  }

  const maxChunks = Math.min(Math.max(form.حدالمقاطعالمعرفية, 1), 20);
  const maxChunkChars = Math.min(Math.max(form.حدطولالمقطعالمعرفي, 120), 1200);
  const retrieved = retrieveKnowledgeChunks(
    question,
    form.نصالمعرفة,
    form.روابطالمعرفة,
    form.ملفاتالمعرفة,
    maxChunks,
    maxChunkChars
  );

  const disabledIds = new Set(
    lastKnowledgeChunks.filter((item) => !item.enabled).map((item) => item.id)
  );
  const chunks: مقطعمعرفةاختبار[] = retrieved.map((item) => ({
    ...item,
    enabled: !disabledIds.has(item.id),
  }));
  const context = formatKnowledgeContext(chunks);

  return {
    chunks,
    context: context
      ? clampKnowledgeContext(context, form.النموذج, form.maxTokens + 2200)
      : "",
  };
};

export const buildKnowledgeContextFromChunks = (
  chunks: مقطعمعرفةاختبار[],
  model: string,
  maxTokens: number
) => {
  const context = formatKnowledgeContext(chunks);
  if (!context) {
    return "";
  }
  return clampKnowledgeContext(context, model, maxTokens + 2200);
};

export const estimateExecutionCostSar = (model: string, prompt: string) => {
  const tokens = تقديرالرموز(prompt);
  const usdCost = (() => {
    try {
      const client = new GroqService(process.env.REACT_APP_GROQ_API_KEY || "");
      return client.calculateCost(model, tokens);
    } catch {
      return tokens * 0.00024;
    }
  })();

  return {
    tokens,
    costSar: Number((usdCost * 3.75).toFixed(4)),
  };
};
