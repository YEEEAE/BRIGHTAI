import { GroqError, type GroqMessage, type GroqRequest, GroqService } from "../groq.service";
import { DEFAULT_CONTEXT_WINDOW } from "./constants";
import {
  clampKnowledgeContext,
  extractKnowledgeContext,
  normalizeKnowledgeFiles,
  normalizeKnowledgeUrls,
} from "../../lib/agent-builder.utils";
import type {
  AgentExecutorErrorCode,
  ExecutionContext,
  GroqOverrides,
  PromptingSettings,
  Workflow,
} from "./types";
import { AgentExecutorError } from "./types";

const estimateTokens = (text: string): number => {
  if (!text) {
    return 0;
  }
  return Math.max(1, Math.ceil(text.length / 4));
};

const limitText = (text: string, maxTokens: number): string => {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) {
    return text;
  }
  const ratio = maxTokens / Math.max(1, estimated);
  const limit = Math.max(120, Math.floor(text.length * ratio));
  return text.slice(0, limit);
};

const buildFewShotMessages = (workflow: Workflow): GroqMessage[] => {
  const examples = workflow.settings?.prompting?.fewShot || [];
  const messages: GroqMessage[] = [];
  for (const example of examples) {
    if (!example.user || !example.assistant) {
      continue;
    }
    messages.push({ role: "user", content: example.user });
    messages.push({ role: "assistant", content: example.assistant });
  }
  return messages;
};

const buildPromptingBase = (prompting?: PromptingSettings): string[] => {
  const base = [
    "أنت وكيل تنفيذي لمنصة برايت أي آي وتعمل ضمن سياق أعمال سعودي.",
    "ركز على الإجابات التنفيذية المختصرة والقابلة للتطبيق فوراً.",
  ];

  if (prompting?.reactPattern) {
    base.push("اتبع نمط التنفيذ خطوة بخطوة داخلياً دون عرض التفكير الداخلي للمستخدم.");
  }
  if (prompting?.selfReflection) {
    base.push("راجع الإجابة وتحقق من الدقة قبل الإخراج النهائي.");
  }
  if (prompting?.iterativeRefinement) {
    base.push("حسّن الإجابة بشكل تكراري حتى تصل إلى أفضل صياغة ممكنة.");
  }
  if (prompting?.systemPrefix) {
    base.unshift(prompting.systemPrefix);
  }
  if (prompting?.systemSuffix) {
    base.push(prompting.systemSuffix);
  }

  return base;
};

const buildAgentKnowledgeSnippet = (context?: ExecutionContext): string => {
  if (!context) {
    return "";
  }

  const question = String(context.variables.userMessage || "");
  const raw = (context.variables.agent_knowledge || {}) as Record<string, unknown>;
  const directText = typeof raw.text === "string" ? raw.text : "";
  const urls = normalizeKnowledgeUrls(raw.urls);
  const files = normalizeKnowledgeFiles(raw.files);

  const semantic = extractKnowledgeContext(question, directText, urls, files, 8);
  if (semantic) {
    return clampKnowledgeContext(semantic, context.metadata.model, 2600);
  }

  if (!directText.trim()) {
    return "";
  }

  return clampKnowledgeContext(
    `معرفة الوكيل:\n${limitText(directText, Math.floor(DEFAULT_CONTEXT_WINDOW / 3))}`,
    context.metadata.model,
    2600
  );
};

export const buildSystemPrompt = (workflow: Workflow, context?: ExecutionContext): string => {
  const instructions = workflow.nodes
    .filter((node) => node.type === "instruction" || node.type === "prompt")
    .map((node) => String(node.data.text || node.data.content || ""))
    .filter((text) => text.trim().length > 0);

  const memoryRaw = context?.variables.long_term_memory ? String(context.variables.long_term_memory) : "";
  const recentRaw = context?.variables.recent_history ? String(context.variables.recent_history) : "";
  const memorySnippet = memoryRaw ? limitText(memoryRaw, Math.floor(DEFAULT_CONTEXT_WINDOW / 2)) : "";
  const recentSnippet = recentRaw ? limitText(recentRaw, Math.floor(DEFAULT_CONTEXT_WINDOW / 3)) : "";

  const base = buildPromptingBase(workflow.settings?.prompting);
  const agentKnowledgeSnippet = buildAgentKnowledgeSnippet(context);

  if (memorySnippet) {
    base.push(`ذاكرة طويلة المدى مفيدة:\n${memorySnippet}`);
  }
  if (recentSnippet) {
    base.push(`سياق قريب من المحادثة:\n${recentSnippet}`);
  }
  if (agentKnowledgeSnippet) {
    base.push(agentKnowledgeSnippet);
  }

  return [...base, ...instructions].join("\n");
};

const mapGroqError = (error: GroqError): AgentExecutorErrorCode => {
  if (error.code === "RATE_LIMIT") {
    return "RATE_LIMIT";
  }
  return "NODE_FAILED";
};

export const callGroq = async (
  prompt: string,
  context: ExecutionContext,
  overrides?: GroqOverrides
): Promise<{ text: string; tokensUsed: number; cost: number }> => {
  const client = new GroqService(context.metadata.apiKey);
  const useStream = Boolean(overrides?.stream && context.metadata.streamMode && context.metadata.streamCallback);

  const contextWindow = context.metadata.workflow.settings?.contextWindowTokens || DEFAULT_CONTEXT_WINDOW;
  const trimmedPrompt = limitText(prompt, contextWindow);

  const request: GroqRequest = {
    model: context.metadata.model,
    messages: [
      { role: "system", content: buildSystemPrompt(context.metadata.workflow, context) },
      ...buildFewShotMessages(context.metadata.workflow),
      { role: "user", content: trimmedPrompt },
    ],
    temperature: overrides?.temperature ?? 0.4,
    max_tokens: overrides?.max_tokens ?? 1000,
    top_p: overrides?.top_p ?? 0.9,
    stream: useStream,
  };

  if (useStream && context.metadata.streamCallback) {
    const stream = client.streamChat(request);
    let aggregated = "";
    for await (const chunk of stream) {
      aggregated += chunk;
      await context.metadata.streamCallback(chunk);
    }
    const promptTokens = estimateTokens(trimmedPrompt);
    const completionTokens = estimateTokens(aggregated);
    const tokensUsed = promptTokens + completionTokens;
    const cost = client.calculateCost(request.model, tokensUsed);
    context.variables.last_output = aggregated;
    return { text: aggregated, tokensUsed, cost };
  }

  try {
    const response = await client.chat(request);
    const choice = response.choices?.[0]?.message?.content || "";
    const tokensUsed = response.usage?.total_tokens || 0;
    const cost = client.calculateCost(request.model, tokensUsed);
    context.variables.last_output = choice;
    return { text: choice, tokensUsed, cost };
  } catch (error) {
    if (error instanceof GroqError) {
      throw new AgentExecutorError(error.message, mapGroqError(error));
    }
    throw new AgentExecutorError("فشل الاتصال بخدمة الذكاء.", "NODE_FAILED");
  }
};
