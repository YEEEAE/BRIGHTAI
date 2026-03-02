import { useCallback, useEffect, useMemo, useState } from "react";
import { خياراتالايقونات, عناوينالخطوات } from "../../constants/agent-builder.constants";
import { trackFeatureUsed } from "../../lib/analytics";
import type {
  حالةالنموذج,
  حالةنظام,
  مقطعمعرفةاختبار,
  خطوة,
  ملخصسير,
  رسالةاختبار,
  حقلمسودةنصي,
} from "../../types/agent-builder.types";
import {
  buildFallbackReply,
  buildKnowledgeContext,
  buildKnowledgeContextFromChunks,
  estimateExecutionCostSar,
  resolveGroqClient,
  streamFallbackReply,
} from "./agent-builder-testing.utils";
import useBuilderKeyboardShortcuts from "./useBuilderKeyboardShortcuts";

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
  const [lastKnowledgeContext, setLastKnowledgeContext] = useState("");
  const [lastKnowledgeSegments, setLastKnowledgeSegments] = useState(0);
  const [lastKnowledgeChunks, setLastKnowledgeChunks] = useState<مقطعمعرفةاختبار[]>([]);

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
    const knowledgeResult = buildKnowledgeContext(message.trim(), form, lastKnowledgeChunks);
    setLastKnowledgeChunks(knowledgeResult.chunks);
    const knowledgeContext = knowledgeResult.context;

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
              content: [form.الموجهالنظامي, knowledgeContext]
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
                content: [form.الموجهالنظامي, knowledgeContext]
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
        full = await streamFallbackReply(buildFallbackReply(form, message));
        updateAssistantText(full);
      }
    } catch {
      full = await streamFallbackReply(buildFallbackReply(form, message));
      updateAssistantText(full);
    } finally {
      setIsStreaming(false);
    }

    const latency = Math.round(performance.now() - started);
    const costInfo = estimateExecutionCostSar(form.النموذج, `${form.الموجهالنظامي}\n${message}\n${full}`);

    setTestLatency(latency);
    setTestTokens(costInfo.tokens);
    setTestCost(costInfo.costSar);

    trackFeatureUsed("اختبار الوكيل", {
      tokens: costInfo.tokens,
      latency,
      live: full.trim().length > 0,
    });
  }, [
    form,
    isStreaming,
    lastKnowledgeChunks,
    setIsStreaming,
    setTestCost,
    setTestInput,
    setTestLatency,
    setTestMessages,
    setTestTokens,
  ]);

  const clearChat = useCallback(() => {
    setTestMessages([]);
    setTestTokens(0);
    setTestCost(0);
    setTestLatency(0);
    setLastKnowledgeChunks([]);
  }, [setTestCost, setTestLatency, setTestMessages, setTestTokens]);

  const runScenario = useCallback(() => {
    const scenario = "أريد بناء خطة رد تلقائي لشكاوى العملاء المتكررة";
    runTestMessage(scenario);
  }, [runTestMessage]);

  const toggleKnowledgeChunk = useCallback((id: string) => {
    setLastKnowledgeChunks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  }, []);

  useEffect(() => {
    const nextContext = buildKnowledgeContextFromChunks(
      lastKnowledgeChunks,
      form.النموذج,
      form.maxTokens
    );
    setLastKnowledgeSegments(lastKnowledgeChunks.filter((item) => item.enabled).length);
    setLastKnowledgeContext(nextContext);
  }, [form.maxTokens, form.النموذج, lastKnowledgeChunks]);

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

  useBuilderKeyboardShortcuts({ step, saveAgent, jumpToStep });

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
    lastKnowledgeContext,
    lastKnowledgeSegments,
    lastKnowledgeChunks,
    toggleKnowledgeChunk,
  };
};

export default useAgentBuilderTesting;
