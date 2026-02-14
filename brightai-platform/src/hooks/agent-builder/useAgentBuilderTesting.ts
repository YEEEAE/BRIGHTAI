import { useCallback, useEffect, useMemo } from "react";
import { خياراتالايقونات, عناوينالخطوات } from "../../constants/agent-builder.constants";
import { delay, extractKnowledgeContext, تقديرالرموز } from "../../lib/agent-builder.utils";
import { trackFeatureUsed } from "../../lib/analytics";
import { GroqService } from "../../services/groq.service";
import apiKeyService from "../../services/apikey.service";
import type {
  حالةالنموذج,
  حالةنظام,
  خطوة,
  ملخصسير,
  رسالةاختبار,
  حقلمسودةنصي,
} from "../../types/agent-builder.types";

type Params = {
  step: خطوة;
  form: حالةالنموذج;
  localMode: boolean;
  workflowSummary: ملخصسير;
  isStreaming: boolean;
  setTestMessages: (next: رسالةاختبار[] | ((prev: رسالةاختبار[]) => رسالةاختبار[])) => void;
  setTestInput: (next: string) => void;
  setIsStreaming: (next: boolean) => void;
  setTestLatency: (next: number) => void;
  setTestTokens: (next: number) => void;
  setTestCost: (next: number) => void;
  setSystemState: (next: حالةنظام | ((prev: حالةنظام) => حالةنظام)) => void;
  validateStep: (stepId: خطوة, silent?: boolean) => boolean;
  saveAgent: (type: "مسودة" | "تفعيل" | "سوق") => Promise<void>;
  jumpToStep: (target: خطوة, step: خطوة) => void;
  getFieldValueFromRef: (field: حقلمسودةنصي) => string;
};

const useAgentBuilderTesting = ({
  step,
  form,
  localMode,
  workflowSummary,
  isStreaming,
  setTestMessages,
  setTestInput,
  setIsStreaming,
  setTestLatency,
  setTestTokens,
  setTestCost,
  setSystemState,
  validateStep,
  saveAgent,
  jumpToStep,
  getFieldValueFromRef,
}: Params) => {
  const resolveGroqClient = useCallback(async () => {
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
  }, []);

  const buildTestReply = useCallback((message: string) => {
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
  }, [form.فئةمخصصة, form.الفئة, form.اللهجة, form.قواعدالسلوك]);

  const buildKnowledgeContext = useCallback((question: string) => {
    const semanticContext = extractKnowledgeContext(
      question,
      form.نصالمعرفة,
      form.روابطالمعرفة,
      form.ملفاتالمعرفة,
      8
    );

    if (semanticContext) {
      return semanticContext;
    }

    const chunks: string[] = [];
    if (form.نصالمعرفة.trim()) {
      chunks.push(`نص معرفة مباشر:\n${form.نصالمعرفة.trim().slice(0, 4000)}`);
    }
    if (form.روابطالمعرفة.length > 0) {
      const urls = form.روابطالمعرفة.map((item) => `- ${item.url} (${item.status})`).join("\n");
      chunks.push(`روابط معرفة:\n${urls}`);
    }
    if (form.ملفاتالمعرفة.length > 0) {
      const files = form.ملفاتالمعرفة
        .map((item) => `- ${item.name} | كلمات: ${item.words} | رموز: ${item.tokens}`)
        .join("\n");
      chunks.push(`ملفات معرفة:\n${files}`);
    }
    if (chunks.length === 0) {
      return "";
    }
    return `استخدم سياق المعرفة التالي عند الإجابة:\n${chunks.join("\n\n")}`;
  }, [form.نصالمعرفة, form.روابطالمعرفة, form.ملفاتالمعرفة]);

  const streamFallbackReply = useCallback(async (message: string) => {
    const full = buildTestReply(message);
    let current = "";
    for (const char of full) {
      current += char;
      await delay(14);
    }
    return current;
  }, [buildTestReply]);

  const runTestMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) {
      return;
    }

    const started = performance.now();
    const userMessage: رسالةاختبار = {
      id: `${Date.now()}_u`,
      role: "مستخدم",
      text: message.trim(),
      createdAt: new Date().toISOString(),
    };

    const botMessage: رسالةاختبار = {
      id: `${Date.now()}_a`,
      role: "الوكيل",
      text: "",
      createdAt: new Date().toISOString(),
    };

    setTestMessages((prev) => [...prev, userMessage, botMessage]);
    setTestInput("");
    setIsStreaming(true);

    let full = "";
    const updateAssistantText = (nextText: string) => {
      setTestMessages((prev) => {
        const clone = [...prev];
        const last = clone[clone.length - 1];
        if (last && last.role === "الوكيل") {
          clone[clone.length - 1] = { ...last, text: nextText };
        }
        return clone;
      });
    };

    try {
      const client = await resolveGroqClient();
      if (client) {
        let streamed = "";
        const stream = client.streamChat({
          model: form.النموذج,
          messages: [
            {
                role: "system",
              content: [form.الموجهالنظامي, buildKnowledgeContext(message.trim())]
                .filter(Boolean)
                .join("\n\n"),
            },
            {
              role: "user",
              content: message.trim(),
            },
          ],
          temperature: form.temperature,
          max_tokens: form.maxTokens,
          top_p: form.topP,
          stream: true,
        });

        for await (const chunk of stream) {
          streamed += chunk;
          updateAssistantText(streamed);
        }

        if (streamed.trim().length === 0) {
          const response = await client.chat({
            model: form.النموذج,
            messages: [
              {
                role: "system",
                content: [form.الموجهالنظامي, buildKnowledgeContext(message.trim())]
                  .filter(Boolean)
                  .join("\n\n"),
              },
              { role: "user", content: message.trim() },
            ],
            temperature: form.temperature,
            max_tokens: form.maxTokens,
            top_p: form.topP,
            stream: false,
          });
          full = response.choices?.[0]?.message?.content?.trim() || "";
          updateAssistantText(full);
        } else {
          full = streamed;
        }
      } else {
        full = await streamFallbackReply(message);
        updateAssistantText(full);
      }
    } catch {
      full = await streamFallbackReply(message);
      updateAssistantText(full);
    } finally {
      setIsStreaming(false);
    }

    const latency = Math.round(performance.now() - started);
    const tokens = تقديرالرموز(`${form.الموجهالنظامي}\n${message}\n${full}`);
    const usdCost = (() => {
      try {
        const client = new GroqService(process.env.REACT_APP_GROQ_API_KEY || "");
        return client.calculateCost(form.النموذج, tokens);
      } catch {
        return tokens * 0.00024;
      }
    })();
    const costSar = Number((usdCost * 3.75).toFixed(4));

    setTestLatency(latency);
    setTestTokens(tokens);
    setTestCost(costSar);

    trackFeatureUsed("اختبار الوكيل", {
      tokens,
      latency,
      live: full.trim().length > 0,
    });
  }, [
    form.الموجهالنظامي,
    form.النموذج,
    form.temperature,
    form.maxTokens,
    form.topP,
    buildKnowledgeContext,
    isStreaming,
    resolveGroqClient,
    setIsStreaming,
    setTestCost,
    setTestInput,
    setTestLatency,
    setTestMessages,
    setTestTokens,
    streamFallbackReply,
  ]);

  const clearChat = useCallback(() => {
    setTestMessages([]);
    setTestTokens(0);
    setTestCost(0);
    setTestLatency(0);
  }, [setTestCost, setTestLatency, setTestMessages, setTestTokens]);

  const runScenario = useCallback(() => {
    const scenario = "أريد بناء خطة رد تلقائي لشكاوى العملاء المتكررة";
    runTestMessage(scenario);
  }, [runTestMessage]);

  useEffect(() => {
    const promptReady = form.الموجهالنظامي.trim().length >= 30;
    const workflowReady =
      form.وضعالسير === "بسيط" ? true : workflowSummary.nodes > 0 && workflowSummary.edges >= 0;

    const warnings: string[] = [];

    if (!form.webhookUrl && form.webhookHeaders.length > 0) {
      warnings.push("تمت إضافة ترويسات ويب هوك بدون رابط.");
    }

    if (form.maxTokens > 12000) {
      warnings.push("قيمة الرموز مرتفعة وقد تزيد التكلفة اليومية.");
    }

    if (form.temperature > 1.2) {
      warnings.push("درجة الإبداع عالية وقد تقلل الثبات في الردود.");
    }
    if (localMode) {
      warnings.push("أنت في وضع محلي مؤقت. النشر على قاعدة البيانات غير متاح حالياً.");
    }

    setSystemState((prev) => ({
      ...prev,
      promptReady,
      workflowReady,
      warnings,
    }));
  }, [
    form.maxTokens,
    form.الموجهالنظامي,
    form.temperature,
    form.webhookHeaders.length,
    form.webhookUrl,
    form.وضعالسير,
    localMode,
    setSystemState,
    workflowSummary.edges,
    workflowSummary.nodes,
  ]);

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      const metaOrCtrl = event.ctrlKey || event.metaKey;
      if (!metaOrCtrl) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveAgent("مسودة");
      }

      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        jumpToStep(Number(event.key) as خطوة, step);
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [jumpToStep, saveAgent, step]);

  const progress = useMemo(() => ((step - 1) / 4) * 100, [step]);

  const selectedIcon = useMemo(() => {
    return خياراتالايقونات.find((item) => item.id === form.الايقونة) || خياراتالايقونات[0];
  }, [form.الايقونة]);

  const descriptionChars = form.الوصف.length;

  const stepHasError = useMemo(() => {
    return !validateStep(step, true);
  }, [step, validateStep]);

  const currentStepTitle =
    عناوينالخطوات.find((item) => item.id === step)?.title || "";

  const previewName = getFieldValueFromRef("الاسم") || form.الاسم || "وكيل جديد";

  return {
    runTestMessage,
    clearChat,
    runScenario,
    progress,
    selectedIcon,
    descriptionChars,
    stepHasError,
    currentStepTitle,
    previewName,
  };
};

export default useAgentBuilderTesting;
