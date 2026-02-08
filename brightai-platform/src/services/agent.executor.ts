import supabase from "../lib/supabase";
import { http } from "./http";
import agentMemory from "./agent.memory";
import agentMonitoring from "./agent.monitoring";
import agentTools, { type ToolType } from "./agent.tools";
import { GroqError, GroqMessage, GroqRequest, GroqService } from "./groq.service";

export type AgentExecutionInput = {
  agentId: string;
  userMessage: string;
  context?: {
    userId: string;
    apiKey?: string;
    useUserKey?: boolean;
    maxCostUsd?: number;
    traceId?: string;
    depth?: number;
    metadata?: Record<string, unknown>;
    variables?: Record<string, unknown>;
  };
};

export type AgentExecutionResult = {
  output: string;
  tokensUsed: number;
  durationMs: number;
  cost: number;
  executionId?: string;
};

export type ExecutionUpdate = {
  type: "بدء" | "تقدم" | "عقدة" | "رسالة" | "انتهاء" | "خطأ";
  data: unknown;
  progress: number;
};

export type WorkflowNode = {
  id: string;
  type:
    | "input"
    | "instruction"
    | "prompt"
    | "condition"
    | "action"
    | "output"
    | "loop"
    | "variable";
  data: Record<string, unknown>;
  position: { x: number; y: number };
};

export type WorkflowEdge = {
  source: string;
  target: string;
  condition?: {
    variable: string;
    operator:
      | "equals"
      | "not_equals"
      | "includes"
      | "greater_than"
      | "less_than"
      | "exists"
      | "not_exists";
    value?: unknown;
  };
};

export type Workflow = {
  nodes: WorkflowNode[];
  edges?: WorkflowEdge[];
  settings?: {
    parallel?: boolean;
    memoryLimit?: number;
    contextWindowTokens?: number;
    prompting?: PromptingSettings;
    collaboration?: {
      maxDepth?: number;
      shareContext?: boolean;
      useUserKey?: boolean;
    };
  };
};

export type PromptingSettings = {
  systemPrefix?: string;
  systemSuffix?: string;
  fewShot?: Array<{ user: string; assistant: string }>;
  reactPattern?: boolean;
  selfReflection?: boolean;
  iterativeRefinement?: boolean;
};

export type ExecutionContext = {
  variables: Record<string, unknown>;
  history: Array<{
    nodeId: string;
    type: WorkflowNode["type"];
    success: boolean;
    output?: unknown;
    error?: string;
    errorCode?: AgentExecutorErrorCode;
  }>;
  metadata: {
    agentId: string;
    userId: string;
    startedAt: string;
    model: string;
    apiKey: string;
    workflow: Workflow;
    traceId: string;
    depth: number;
    parentExecutionId?: string;
    streamMode?: boolean;
    streamCallback?: (chunk: string) => Promise<void>;
  };
};

export type NodeResult = {
  success: boolean;
  output?: unknown;
  error?: string;
  errorCode?: AgentExecutorErrorCode;
  tokensUsed?: number;
  cost?: number;
  durationMs?: number;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

type AgentRow = {
  id: string;
  user_id: string;
  workflow?: Workflow;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

type ApiKeyRow = {
  key_encrypted: string | null;
};

export type AgentExecutorErrorCode =
  | "AGENT_NOT_FOUND"
  | "INVALID_WORKFLOW"
  | "MISSING_API_KEY"
  | "NODE_FAILED"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "UNKNOWN";

export class AgentExecutorError extends Error {
  code: AgentExecutorErrorCode;
  constructor(message: string, code: AgentExecutorErrorCode) {
    super(message);
    this.name = "AgentExecutorError";
    this.code = code;
  }
}

const MAX_EXECUTION_TIME_MS = 5 * 60 * 1000;
const DEFAULT_MEMORY_LIMIT = 50;
const DEFAULT_MODEL = "llama-3.1-70b-versatile";
const DEFAULT_CONTEXT_WINDOW = 8000;
const DEFAULT_MAX_DEPTH = 2;
const TOOL_ACTIONS: ToolType[] = [
  "web_search",
  "db_query",
  "file_upload",
  "file_delete",
  "http_request",
  "web_scrape",
  "email_send",
  "calendar_event",
];

/**
 * محرك تنفيذ الوكلاء مع دعم التحقق والبث والتتبع.
 */
export class AgentExecutor {
  /**
   * تنفيذ الوكيل وإرجاع النتيجة النهائية.
   */
  async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const startedAt = Date.now();
    const executionId = this.generateExecutionId();
    const traceId = input.context?.traceId || executionId;
    const depth = input.context?.depth ?? 0;

    const { agent, workflow } = await this.loadAgent(input.agentId);
    const validation = this.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new AgentExecutorError(
        `المخطط غير صالح: ${validation.errors.join("، ")}`,
        "INVALID_WORKFLOW"
      );
    }

    console.info("بدء تنفيذ الوكيل", {
      agentId: input.agentId,
      userId: input.context?.userId,
    });

    const apiKey = await this.resolveApiKey(input, agent);
    const model = this.resolveModel(agent);
    const context = this.buildContext(input, model, apiKey, workflow, false, undefined, traceId, depth);

    agentMonitoring.record({
      executionId: traceId,
      agentId: input.agentId,
      message: "بدء تنفيذ الوكيل",
      level: "info",
      data: { depth },
    });

    try {
      const result = await this.withTimeout(
        this.executeWorkflow(workflow, input.userMessage, context, agent),
        MAX_EXECUTION_TIME_MS
      );

      const durationMs = Date.now() - startedAt;
      await this.saveExecutionLog(
        input,
        result,
        durationMs,
        executionId,
        "ناجح",
        null
      );

      return {
        output: result.output,
        tokensUsed: result.tokensUsed,
        durationMs,
        cost: result.cost,
        executionId,
      };
    } catch (error) {
      console.error("فشل تنفيذ الوكيل", {
        agentId: input.agentId,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      });
      const durationMs = Date.now() - startedAt;
      await this.saveExecutionLog(
        input,
        { output: "", tokensUsed: 0, cost: 0 },
        durationMs,
        executionId,
        "فشل",
        error instanceof Error ? error.message : "فشل التنفيذ."
      );
      agentMonitoring.record({
        executionId: traceId,
        agentId: input.agentId,
        message: "فشل تنفيذ الوكيل",
        level: "error",
        data: {
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        },
      });
      throw error;
    }
  }

  /**
   * تنفيذ الوكيل مع بث تقدمي لتحديثات التنفيذ.
   */
  async *executeWithStreaming(
    input: AgentExecutionInput
  ): AsyncGenerator<ExecutionUpdate> {
    const updates: ExecutionUpdate[] = [];
    let resolver: ((value?: void) => void) | null = null;
    let finished = false;
    let executionError: unknown = null;

    const notify = () => {
      const current = resolver;
      resolver = null;
      if (typeof current === "function") {
        current();
      }
    };

    const pushUpdate = (update: ExecutionUpdate) => {
      updates.push(update);
      notify();
    };

    const runner = (async () => {
      const startedAt = Date.now();
      const executionId = this.generateExecutionId();
      const traceId = input.context?.traceId || executionId;
      const depth = input.context?.depth ?? 0;
      pushUpdate({ type: "بدء", data: { executionId }, progress: 0 });

      try {
        const { agent, workflow } = await this.loadAgent(input.agentId);
        const validation = this.validateWorkflow(workflow);
        if (!validation.isValid) {
          pushUpdate({
            type: "خطأ",
            data: { message: validation.errors },
            progress: 0,
          });
          throw new AgentExecutorError(
            `المخطط غير صالح: ${validation.errors.join("، ")}`,
            "INVALID_WORKFLOW"
          );
        }

        const apiKey = await this.resolveApiKey(input, agent);
        const model = this.resolveModel(agent);
        const context = this.buildContext(
          input,
          model,
          apiKey,
          workflow,
          true,
          async (chunk) => {
          pushUpdate({ type: "رسالة", data: chunk, progress: 0 });
        },
          traceId,
          depth
        );

        agentMonitoring.record({
          executionId: traceId,
          agentId: input.agentId,
          message: "بدء تنفيذ الوكيل مع البث",
          level: "info",
          data: { depth },
        });

        const nodesTotal = workflow.nodes.length || 1;
        let completedNodes = 0;

        const result = await this.withTimeout(
          this.executeWorkflow(
            workflow,
            input.userMessage,
            context,
            agent,
            async (update) => {
              if (update.type === "عقدة") {
                completedNodes += 1;
                update.progress = Math.round(
                  (completedNodes / nodesTotal) * 100
                );
              }
              pushUpdate(update);
            }
          ),
          MAX_EXECUTION_TIME_MS
        );

        const durationMs = Date.now() - startedAt;
        await this.saveExecutionLog(
          input,
          result,
          durationMs,
          executionId,
          "ناجح",
          null
        );

        pushUpdate({
          type: "انتهاء",
          data: {
            output: result.output,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
            durationMs,
            executionId,
          },
          progress: 100,
        });
      } catch (error) {
        executionError = error;
        const durationMs = Date.now() - startedAt;
        await this.saveExecutionLog(
          input,
          { output: "", tokensUsed: 0, cost: 0 },
          durationMs,
          executionId,
          "فشل",
          error instanceof Error ? error.message : "فشل التنفيذ."
        );
        pushUpdate({
          type: "خطأ",
          data: { message: error instanceof Error ? error.message : "فشل التنفيذ." },
          progress: 0,
        });
        agentMonitoring.record({
          executionId: traceId,
          agentId: input.agentId,
          message: "فشل تنفيذ الوكيل مع البث",
          level: "error",
          data: {
            error: error instanceof Error ? error.message : "خطأ غير معروف",
          },
        });
      } finally {
        finished = true;
        notify();
      }
    })();

    while (!finished || updates.length > 0) {
      if (updates.length === 0) {
        await new Promise<void>((resolve) => {
          resolver = resolve;
        });
        continue;
      }
      const update = updates.shift();
      if (update) {
        yield update;
      }
    }

    await runner;
    if (executionError) {
      throw executionError;
    }
  }

  /**
   * التحقق من صحة مخطط سير العمل قبل التنفيذ.
   */
  validateWorkflow(workflow: Workflow): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!workflow || !Array.isArray(workflow.nodes)) {
      errors.push("المخطط غير معرف أو لا يحتوي على عقد.");
      return { isValid: false, errors, warnings };
    }

    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      if (!node.id) {
        errors.push("تم العثور على عقدة بدون معرف.");
        continue;
      }
      if (nodeIds.has(node.id)) {
        errors.push(`معرف مكرر للعقدة: ${node.id}`);
      }
      nodeIds.add(node.id);
      if (!node.type) {
        errors.push(`نوع مفقود للعقدة: ${node.id}`);
      }
    }

    const hasInput = workflow.nodes.some((node) => node.type === "input");
    const hasOutput = workflow.nodes.some((node) => node.type === "output");
    if (!hasInput) {
      errors.push("يجب وجود عقدة إدخال واحدة على الأقل.");
    }
    if (!hasOutput) {
      warnings.push("لا توجد عقدة مخرجات واضحة.");
    }

    if (workflow.edges) {
      for (const edge of workflow.edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
          errors.push("يوجد ارتباط يشير إلى عقدة غير موجودة.");
        }
      }
    }

    const hasCycle = this.detectCycle(workflow);
    if (hasCycle) {
      errors.push("المخطط يحتوي على حلقة غير مسموحة.");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * بناء رسالة النظام وفق تعليمات المخطط.
   */
  buildSystemPrompt(workflow: Workflow, context?: ExecutionContext): string {
    const instructions = workflow.nodes
      .filter((node) => node.type === "instruction" || node.type === "prompt")
      .map((node) => String(node.data.text || node.data.content || ""))
      .filter((text) => text.trim().length > 0);

    const prompting = workflow.settings?.prompting;
    const memoryRaw = context?.variables.long_term_memory
      ? String(context.variables.long_term_memory)
      : "";
    const recentRaw = context?.variables.recent_history
      ? String(context.variables.recent_history)
      : "";
    const memorySnippet = memoryRaw
      ? this.limitText(memoryRaw, Math.floor(DEFAULT_CONTEXT_WINDOW / 2))
      : "";
    const recentSnippet = recentRaw
      ? this.limitText(recentRaw, Math.floor(DEFAULT_CONTEXT_WINDOW / 3))
      : "";

    const base = [
      "أنت وكيل تنفيذي لمنصة برايت أي آي وتعمل ضمن سياق أعمال سعودي.",
      "ركز على الإجابات التنفيذية المختصرة والقابلة للتطبيق فوراً.",
    ];

    if (prompting?.reactPattern) {
      base.push(
        "اتبع نمط التنفيذ خطوة بخطوة داخلياً دون عرض التفكير الداخلي للمستخدم."
      );
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

    if (memorySnippet) {
      base.push(`ذاكرة طويلة المدى مفيدة:\\n${memorySnippet}`);
    }
    if (recentSnippet) {
      base.push(`سياق قريب من المحادثة:\\n${recentSnippet}`);
    }

    return [...base, ...instructions].join("\n");
  }

  private buildFewShotMessages(workflow: Workflow): GroqMessage[] {
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
  }

  /**
   * تنفيذ عقدة واحدة حسب نوعها.
   */
  async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeResult> {
    const startedAt = Date.now();
    agentMonitoring.record({
      executionId: context.metadata.traceId,
      agentId: context.metadata.agentId,
      nodeId: node.id,
      message: "بدء تنفيذ عقدة",
      level: "debug",
      data: { type: node.type },
    });

    try {
      switch (node.type) {
        case "input": {
          const output = context.variables.userMessage;
          this.storeOutput(node, context, output);
          return {
            success: true,
            output,
            durationMs: Date.now() - startedAt,
          };
        }
        case "instruction": {
          const output = node.data.text || node.data.content;
          this.storeOutput(node, context, output);
          return {
            success: true,
            output,
            durationMs: Date.now() - startedAt,
          };
        }
        case "prompt": {
          const promptText = this.resolveTemplate(
            String(node.data.text || ""),
            context
          );
          const response = await this.callGroq(promptText, context, {
            temperature: Number(node.data.temperature ?? 0.4),
            max_tokens: Number(node.data.max_tokens ?? 1000),
            top_p: Number(node.data.top_p ?? 0.9),
            stream: Boolean(node.data.stream),
          });
          this.storeOutput(node, context, response.text);
          return {
            success: true,
            output: response.text,
            tokensUsed: response.tokensUsed,
            cost: response.cost,
            durationMs: Date.now() - startedAt,
          };
        }
        case "condition": {
          const result = this.evaluateCondition(node, context);
          this.storeOutput(node, context, result);
          return {
            success: true,
            output: result,
            durationMs: Date.now() - startedAt,
          };
        }
        case "action": {
          const result = await this.executeAction(node, context);
          this.storeOutput(node, context, result);
          return {
            success: true,
            output: result,
            durationMs: Date.now() - startedAt,
          };
        }
        case "output": {
          const template = String(node.data.template || "{{last_output}}");
          const useModel = Boolean(node.data.useModel);
          if (useModel) {
            const response = await this.callGroq(
              this.resolveTemplate(template, context),
              context,
              {
                temperature: Number(node.data.temperature ?? 0.3),
                max_tokens: Number(node.data.max_tokens ?? 800),
                top_p: Number(node.data.top_p ?? 0.9),
                stream: Boolean(node.data.stream),
              }
            );
            this.storeOutput(node, context, response.text);
            return {
              success: true,
              output: response.text,
              tokensUsed: response.tokensUsed,
              cost: response.cost,
              durationMs: Date.now() - startedAt,
            };
          }
          const output = this.resolveTemplate(template, context);
          this.storeOutput(node, context, output);
          return {
            success: true,
            output,
            durationMs: Date.now() - startedAt,
          };
        }
        case "loop": {
          const iterations = Number(node.data.iterations || 0);
          const directItems = Array.isArray(node.data.items)
            ? (node.data.items as unknown[])
            : [];
          const itemsVar =
            typeof node.data.itemsVar === "string" ? node.data.itemsVar : "";
          const variableItems =
            itemsVar && Array.isArray(context.variables[itemsVar])
              ? (context.variables[itemsVar] as unknown[])
              : [];
          const items = directItems.length > 0 ? directItems : variableItems;
          const results: unknown[] = [];
          const limit = Math.min(iterations || items.length, 50);

          for (let i = 0; i < limit; i += 1) {
            context.variables.loop_index = i;
            context.variables.loop_item = items[i];
            const nestedNode = node.data.nodeId
              ? this.findNode(context.metadata.workflow, node.data.nodeId as string)
              : null;
            if (nestedNode) {
              const nestedResult = await this.executeNode(nestedNode, context);
              results.push(nestedResult.output);
            } else {
              results.push(
                this.resolveTemplate(String(node.data.template || ""), context)
              );
            }
          }

          this.storeOutput(node, context, results);
          return {
            success: true,
            output: results,
            durationMs: Date.now() - startedAt,
          };
        }
        case "variable": {
          const operation = String(node.data.operation || "set");
          const key = String(node.data.key || node.id);
          if (operation === "set") {
            context.variables[key] = node.data.value;
            return {
              success: true,
              output: context.variables[key],
              durationMs: Date.now() - startedAt,
            };
          }
          this.storeOutput(node, context, context.variables[key]);
          return {
            success: true,
            output: context.variables[key],
            durationMs: Date.now() - startedAt,
          };
        }
        default: {
          agentMonitoring.record({
            executionId: context.metadata.traceId,
            agentId: context.metadata.agentId,
            nodeId: node.id,
            message: "نوع عقدة غير مدعوم",
            level: "warn",
          });
          return {
            success: false,
            error: "نوع عقدة غير مدعوم.",
            durationMs: Date.now() - startedAt,
          };
        }
      }
    } catch (error) {
      agentMonitoring.record({
        executionId: context.metadata.traceId,
        agentId: context.metadata.agentId,
        nodeId: node.id,
        message: "فشل تنفيذ عقدة",
        level: "error",
        data: {
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        },
      });
      if (error instanceof AgentExecutorError) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code,
          durationMs: Date.now() - startedAt,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل تنفيذ العقدة.",
        errorCode: "NODE_FAILED",
        durationMs: Date.now() - startedAt,
      };
    }
  }

  private async executeWorkflow(
    workflow: Workflow,
    userMessage: string,
    context: ExecutionContext,
    agent: { id: string; user_id: string; settings?: Record<string, unknown> },
    onUpdate?: (update: ExecutionUpdate) => Promise<void>
  ) {
    const nodesById = new Map(workflow.nodes.map((node) => [node.id, node]));
    const edges = workflow.edges || [];
    const incomingCount = new Map<string, number>();
    const satisfiedCount = new Map<string, number>();
    const adjacency = new Map<string, WorkflowEdge[]>();

    for (const node of workflow.nodes) {
      incomingCount.set(node.id, 0);
      satisfiedCount.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
      adjacency.get(edge.source)?.push(edge);
    }

    const queue: WorkflowNode[] = workflow.nodes.filter(
      (node) => (incomingCount.get(node.id) || 0) === 0
    );

    let tokensUsed = 0;
    let cost = 0;
    let lastOutput = "";

    context.variables.userMessage = userMessage;
    context.variables.memory_limit =
      workflow.settings?.memoryLimit || DEFAULT_MEMORY_LIMIT;

    if (context.metadata.userId) {
      await agentMemory.addEntry({
        userId: context.metadata.userId,
        agentId: context.metadata.agentId,
        content: userMessage,
        role: "user",
        metadata: { traceId: context.metadata.traceId },
      });
    }

    const memoryContext = await agentMemory.getContext(
      context.metadata.userId,
      context.metadata.agentId,
      userMessage
    );
    context.variables.long_term_memory = memoryContext.snippet;
    context.variables.semantic_hits = memoryContext.items;

    while (queue.length > 0) {
      const batch = workflow.settings?.parallel
        ? queue.splice(0, queue.length)
        : [queue.shift()].filter(Boolean) as WorkflowNode[];

      const results = await Promise.all(
        batch.map(async (node) => {
          console.info("بدء عقدة", { id: node.id, type: node.type });
          if (onUpdate) {
            await onUpdate({
              type: "عقدة",
              data: { id: node.id, type: node.type, status: "بدء" },
              progress: 0,
            });
          }
          const result = await this.executeNodeWithRetry(node, context);
          console.info("انتهاء عقدة", {
            id: node.id,
            type: node.type,
            success: result.success,
          });
          return { node, result };
        })
      );

      for (const { node, result } of results) {
        this.pushHistory(context, node, result);

        if (!result.success) {
          throw new AgentExecutorError(
            result.error || "فشل تنفيذ عقدة.",
            result.errorCode || "NODE_FAILED"
          );
        }

        if (result.tokensUsed) {
          tokensUsed += result.tokensUsed;
        }
        if (result.cost) {
          cost += result.cost;
        }

        context.variables.last_output = result.output;
        lastOutput = String(result.output ?? "");

        if (onUpdate) {
          await onUpdate({
            type: "عقدة",
            data: { id: node.id, type: node.type, status: "انتهاء", result },
            progress: 0,
          });
        }

        for (const edge of adjacency.get(node.id) || []) {
          if (this.isEdgeSatisfied(edge, context)) {
            satisfiedCount.set(
              edge.target,
              (satisfiedCount.get(edge.target) || 0) + 1
            );
          }
        }
      }

      for (const [nodeId, totalIncoming] of incomingCount.entries()) {
        if (!nodesById.has(nodeId)) {
          continue;
        }
        const required = totalIncoming || 0;
        const satisfied = satisfiedCount.get(nodeId) || 0;
        const nodeRef = nodesById.get(nodeId);
        if (!nodeRef) {
          continue;
        }
        const waitAll = Boolean(nodeRef.data.waitAll);
        const ready =
          required === 0 ||
          (waitAll ? satisfied >= required : satisfied >= 1);
        if (ready && !queue.find((item) => item.id === nodeId)) {
          if (!context.history.find((item) => item.nodeId === nodeId)) {
            queue.push(nodeRef);
          }
        }
      }
    }

    const maxCost = resolveCostLimit(agent, context);
    if (maxCost !== null && cost > maxCost) {
      throw new AgentExecutorError(
        "تم تجاوز الحد الأعلى للتكلفة.",
        "NODE_FAILED"
      );
    }

    if (context.metadata.userId) {
      await agentMemory.addEntry({
        userId: context.metadata.userId,
        agentId: context.metadata.agentId,
        content: String(lastOutput || ""),
        role: "assistant",
        metadata: { traceId: context.metadata.traceId },
      });
    }

    return { output: lastOutput, tokensUsed, cost };
  }

  private async executeNodeWithRetry(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeResult> {
    const retries = Number(node.data.retry || 2);
    let attempt = 0;
    while (attempt <= retries) {
      const result = await this.executeNode(node, context);
      if (result.success) {
        return result;
      }
      attempt += 1;
      const backoff =
        result.errorCode === "RATE_LIMIT"
          ? 2000 * Math.pow(2, attempt)
          : 500 * Math.pow(2, attempt);
      await this.sleep(backoff);
    }
    return {
      success: false,
      error: "فشل تنفيذ العقدة بعد عدة محاولات.",
      errorCode: "NODE_FAILED",
    };
  }

  private isEdgeSatisfied(edge: WorkflowEdge, context: ExecutionContext) {
    if (!edge.condition) {
      return true;
    }
    const value = context.variables[edge.condition.variable];
    switch (edge.condition.operator) {
      case "equals":
        return value === edge.condition.value;
      case "not_equals":
        return value !== edge.condition.value;
      case "includes":
        return Array.isArray(value)
          ? value.includes(edge.condition.value)
          : String(value || "").includes(String(edge.condition.value || ""));
      case "greater_than":
        return Number(value) > Number(edge.condition.value);
      case "less_than":
        return Number(value) < Number(edge.condition.value);
      case "exists":
        return value !== undefined && value !== null;
      case "not_exists":
        return value === undefined || value === null;
      default:
        return false;
    }
  }

  private evaluateCondition(node: WorkflowNode, context: ExecutionContext) {
    const rule = node.data as WorkflowEdge["condition"] & {
      variable?: string;
    };
    if (!rule || !rule.variable) {
      return false;
    }
    return this.isEdgeSatisfied(
      {
        source: node.id,
        target: node.id,
        condition: rule,
      },
      context
    );
  }

  private resolveTemplate(value: string, context: ExecutionContext) {
    return value.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const path = String(key).trim().split(".");
      let current: unknown = context.variables;
      for (const segment of path) {
        if (
          current &&
          typeof current === "object" &&
          segment in (current as object)
        ) {
          current = (current as Record<string, unknown>)[segment];
        } else {
          current = "";
          break;
        }
      }
      return String(current ?? "");
    });
  }

  private async executeAction(node: WorkflowNode, context: ExecutionContext) {
    const actionType = String(node.data.actionType || "http");

    if (actionType === "http") {
      const url = this.resolveTemplate(String(node.data.url || ""), context);
      const method = String(node.data.method || "POST");
      const payload =
        node.data.payload && typeof node.data.payload === "object"
          ? this.interpolateObject(
              node.data.payload as Record<string, unknown>,
              context
            )
          : undefined;
      const headers =
        node.data.headers && typeof node.data.headers === "object"
          ? this.normalizeHeaders(
              this.interpolateObject(
                node.data.headers as Record<string, unknown>,
                context
              )
            )
          : undefined;
      const response = await http.request({
        url,
        method,
        data: payload,
        headers,
      });
      return response.data;
    }

    if (actionType === "compute") {
      const expression = String(node.data.expression || "");
      return this.resolveTemplate(expression, context);
    }

    if (actionType === "agent_call" || actionType === "agent_sequence") {
      return await this.executeAgentSequence(node, context);
    }

    if (actionType === "agent_parallel") {
      return await this.executeAgentParallel(node, context);
    }

    if (actionType === "agent_orchestration") {
      return await this.executeAgentOrchestration(node, context);
    }

    if (TOOL_ACTIONS.includes(actionType as ToolType)) {
      return await this.executeToolAction(actionType as ToolType, node, context);
    }

    return null;
  }

  private async executeToolAction(
    toolType: ToolType,
    node: WorkflowNode,
    context: ExecutionContext
  ) {
    const params =
      node.data.params && typeof node.data.params === "object"
        ? (node.data.params as Record<string, unknown>)
        : (node.data as Record<string, unknown>);

    const result = await agentTools.execute(
      { type: toolType, params },
      {
        userId: context.metadata.userId,
        agentId: context.metadata.agentId,
        variables: context.variables,
        traceId: context.metadata.traceId,
      }
    );

    if (!result.success) {
      throw new AgentExecutorError(
        result.error || "فشل تنفيذ الأداة.",
        this.mapToolError(result.errorCode)
      );
    }
    return result.data;
  }

  private async executeAgentSequence(node: WorkflowNode, context: ExecutionContext) {
    const agentIds = this.extractAgentIds(node);
    if (agentIds.length === 0) {
      throw new AgentExecutorError("لا توجد وكلاء للتنفيذ.", "INVALID_WORKFLOW");
    }
    const message = this.resolveActionMessage(node, context);
    const shareContext = this.resolveShareContext(node, context);
    const results: AgentExecutionResult[] = [];
    let latestMessage = message;

    for (const agentId of agentIds) {
      const result = await this.executeAgentCall(agentId, latestMessage, context, shareContext);
      results.push(result);
      latestMessage = String(result.output || latestMessage);
      this.storeAgentOutput(context, agentId, result.output);
    }

    return node.data.returnAll ? results : results[results.length - 1]?.output;
  }

  private async executeAgentParallel(node: WorkflowNode, context: ExecutionContext) {
    const agentIds = this.extractAgentIds(node);
    if (agentIds.length === 0) {
      throw new AgentExecutorError("لا توجد وكلاء للتنفيذ.", "INVALID_WORKFLOW");
    }
    const message = this.resolveActionMessage(node, context);
    const shareContext = this.resolveShareContext(node, context);
    const parallelLimit = Math.min(Number(node.data.parallelLimit || 3), 6);

    const chunks = this.chunkArray(agentIds, parallelLimit);
    const results: AgentExecutionResult[] = [];

    for (const chunk of chunks) {
      const batchResults = await Promise.all(
        chunk.map((agentId) =>
          this.executeAgentCall(agentId, message, context, shareContext)
        )
      );
      batchResults.forEach((result, index) => {
        results.push(result);
        this.storeAgentOutput(context, chunk[index], result.output);
      });
    }

    return node.data.returnAll ? results : results.map((item) => item.output);
  }

  private async executeAgentOrchestration(node: WorkflowNode, context: ExecutionContext) {
    const plan =
      node.data.plan && typeof node.data.plan === "object"
        ? (node.data.plan as Record<string, unknown>)
        : {};
    const sequence = Array.isArray(plan.sequence) ? (plan.sequence as string[]) : [];
    const parallelGroups = Array.isArray(plan.parallel) ? (plan.parallel as string[][]) : [];

    const results: unknown[] = [];
    if (sequence.length > 0) {
      const sequenceNode: WorkflowNode = {
        ...node,
        data: { ...node.data, agentIds: sequence, returnAll: true },
      };
      results.push(await this.executeAgentSequence(sequenceNode, context));
    }

    for (const group of parallelGroups) {
      const parallelNode: WorkflowNode = {
        ...node,
        data: { ...node.data, agentIds: group, returnAll: true },
      };
      results.push(await this.executeAgentParallel(parallelNode, context));
    }

    return results;
  }

  private resolveActionMessage(node: WorkflowNode, context: ExecutionContext) {
    const template = String(node.data.message || "{{last_output}}");
    return this.resolveTemplate(template, context);
  }

  private extractAgentIds(node: WorkflowNode) {
    const direct = node.data.agentId ? [String(node.data.agentId)] : [];
    const list = Array.isArray(node.data.agentIds)
      ? (node.data.agentIds as string[]).map((id) => String(id))
      : [];
    return [...direct, ...list].filter(Boolean);
  }

  private resolveShareContext(node: WorkflowNode, context: ExecutionContext) {
    if (typeof node.data.shareContext === "boolean") {
      return node.data.shareContext;
    }
    return Boolean(context.metadata.workflow.settings?.collaboration?.shareContext ?? true);
  }

  private async executeAgentCall(
    agentId: string,
    message: string,
    context: ExecutionContext,
    shareContext: boolean
  ) {
    const maxDepth =
      context.metadata.workflow.settings?.collaboration?.maxDepth ?? DEFAULT_MAX_DEPTH;
    const nextDepth = context.metadata.depth + 1;
    if (nextDepth > maxDepth) {
      throw new AgentExecutorError("تم تجاوز عمق التعاون بين الوكلاء.", "INVALID_WORKFLOW");
    }

    const variables = shareContext
      ? this.selectSharedVariables(context.variables)
      : {};

    const useUserKey = Boolean(
      context.metadata.workflow.settings?.collaboration?.useUserKey ??
        context.variables.useUserKey
    );

    const childInput: AgentExecutionInput = {
      agentId,
      userMessage: message,
      context: {
        userId: context.metadata.userId,
        apiKey: context.metadata.apiKey,
        useUserKey,
        variables,
        traceId: context.metadata.traceId,
        depth: nextDepth,
        metadata: {
          parentAgentId: context.metadata.agentId,
          parentExecutionId: context.metadata.traceId,
        },
      },
    };

    return await this.execute(childInput);
  }

  private selectSharedVariables(variables: Record<string, unknown>) {
    const shared: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(variables)) {
      if (/key|token|secret/i.test(key)) {
        continue;
      }
      shared[key] = value;
    }
    return shared;
  }

  private storeAgentOutput(context: ExecutionContext, agentId: string, output: unknown) {
    if (!context.variables.agent_outputs || typeof context.variables.agent_outputs !== "object") {
      context.variables.agent_outputs = {};
    }
    const store = context.variables.agent_outputs as Record<string, unknown>;
    store[agentId] = output;
  }

  private chunkArray<T>(items: T[], size: number) {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  private mapToolError(code?: string): AgentExecutorErrorCode {
    switch (code) {
      case "RATE_LIMIT":
        return "RATE_LIMIT";
      case "UNAUTHORIZED":
      case "MISSING_ENDPOINT":
      case "INVALID_PARAMS":
      case "FAILED":
      default:
        return "NODE_FAILED";
    }
  }

  private interpolateObject(
    value: Record<string, unknown>,
    context: ExecutionContext
  ) {
    const result: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (typeof raw === "string") {
        result[key] = this.resolveTemplate(raw, context);
      } else {
        result[key] = raw;
      }
    }
    return result;
  }

  private normalizeHeaders(value: Record<string, unknown>) {
    const headers: Record<string, string> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (raw === undefined || raw === null) {
        continue;
      }
      headers[key] = String(raw);
    }
    return headers;
  }

  private pushHistory(
    context: ExecutionContext,
    node: WorkflowNode,
    result: NodeResult
  ) {
    context.history.push({
      nodeId: node.id,
      type: node.type,
      success: result.success,
      output: result.output,
      error: result.error,
      errorCode: result.errorCode,
    });

    const limit =
      (context.variables.memory_limit as number) || DEFAULT_MEMORY_LIMIT;
    if (context.history.length > limit) {
      context.history.splice(0, context.history.length - limit);
    }

    context.variables.recent_history = context.history
      .slice(-6)
      .map((item) => `${item.type}: ${String(item.output ?? "")}`)
      .join("\n");
  }

  private resolveModel(agent: { settings?: Record<string, unknown> }) {
    return String(agent.settings?.model || DEFAULT_MODEL);
  }

  private buildContext(
    input: AgentExecutionInput,
    model: string,
    apiKey: string,
    workflow: Workflow,
    streamMode = false,
    streamCallback?: (chunk: string) => Promise<void>,
    traceId?: string,
    depth = 0,
    parentExecutionId?: string
  ): ExecutionContext {
    const resolvedTrace = traceId || this.generateExecutionId();
    return {
      variables: {
        ...(input.context?.variables || {}),
        userMessage: input.userMessage,
        memory_limit: workflow.settings?.memoryLimit || DEFAULT_MEMORY_LIMIT,
        maxCostUsd: input.context?.maxCostUsd,
        trace_id: resolvedTrace,
      },
      history: [],
      metadata: {
        agentId: input.agentId,
        userId: input.context?.userId || "",
        startedAt: new Date().toISOString(),
        model,
        apiKey,
        workflow,
        traceId: resolvedTrace,
        depth,
        parentExecutionId,
        streamMode,
        streamCallback,
      },
    };
  }

  private async callGroq(
    prompt: string,
    context: ExecutionContext,
    overrides?: Partial<GroqRequest>
  ) {
    const client = new GroqService(context.metadata.apiKey);
    const useStream = Boolean(
      overrides?.stream && context.metadata.streamMode && context.metadata.streamCallback
    );

    const contextWindow =
      context.metadata.workflow.settings?.contextWindowTokens || DEFAULT_CONTEXT_WINDOW;
    const trimmedPrompt = this.limitText(prompt, contextWindow);

    const request: GroqRequest = {
      model: context.metadata.model,
      messages: [
        {
          role: "system",
          content: this.buildSystemPrompt(context.metadata.workflow, context),
        },
        ...this.buildFewShotMessages(context.metadata.workflow),
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
      const promptTokens = this.estimateTokens(trimmedPrompt);
      const completionTokens = this.estimateTokens(aggregated);
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
        if (error.code === "RATE_LIMIT") {
          throw new AgentExecutorError("تم تجاوز الحد المؤقت.", "RATE_LIMIT");
        }
        throw new AgentExecutorError(error.message, "NODE_FAILED");
      }
      throw new AgentExecutorError("فشل الاتصال بخدمة الذكاء.", "NODE_FAILED");
    }
  }

  private estimateTokens(text: string) {
    if (!text) {
      return 0;
    }
    return Math.max(1, Math.ceil(text.length / 4));
  }

  private limitText(text: string, maxTokens: number) {
    const estimated = this.estimateTokens(text);
    if (estimated <= maxTokens) {
      return text;
    }
    const ratio = maxTokens / Math.max(1, estimated);
    const limit = Math.max(120, Math.floor(text.length * ratio));
    return text.slice(0, limit);
  }

  private async loadAgent(agentId: string) {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single<AgentRow>();

    if (error || !data) {
      throw new AgentExecutorError("الوكيل غير موجود.", "AGENT_NOT_FOUND");
    }

    const workflow = (data.workflow || { nodes: [], edges: [] }) as Workflow;

    return { agent: data, workflow };
  }

  private async resolveApiKey(
    input: AgentExecutionInput,
    agent: { user_id: string; settings?: Record<string, unknown> }
  ) {
    if (input.context?.apiKey) {
      return input.context.apiKey;
    }

    const useUserKey =
      Boolean(input.context?.useUserKey) ||
      Boolean(agent.settings?.useUserKey);

    if (!useUserKey) {
      const platformKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!platformKey) {
        throw new AgentExecutorError("مفتاح Groq غير متوفر.", "MISSING_API_KEY");
      }
      return platformKey;
    }

    if (!input.context?.userId) {
      throw new AgentExecutorError("معرف المستخدم غير متوفر.", "MISSING_API_KEY");
    }

    const { data, error } = await supabase
      .from("api_keys")
      .select("key_encrypted")
      .eq("user_id", input.context.userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<ApiKeyRow>();

    if (error || !data?.key_encrypted) {
      throw new AgentExecutorError("مفتاح المستخدم غير متوفر.", "MISSING_API_KEY");
    }

    const { data: decrypted, error: decryptError } = await (
      supabase as unknown as {
        rpc: (
          fn: string,
          params: Record<string, unknown>
        ) => Promise<{ data: string | null; error: unknown }>;
      }
    ).rpc("decrypt_api_key", {
      encrypted_key: data.key_encrypted as string,
    });

    if (decryptError || !decrypted) {
      throw new AgentExecutorError("تعذر فك تشفير المفتاح.", "MISSING_API_KEY");
    }

    return String(decrypted);
  }

  private async saveExecutionLog(
    input: AgentExecutionInput,
    result: { output: string; tokensUsed: number; cost: number },
    durationMs: number,
    executionId: string,
    status: "ناجح" | "فشل",
    errorMessage: string | null
  ) {
    const payload = {
      agent_id: input.agentId,
      user_id: input.context?.userId,
      input: { message: input.userMessage, context: input.context?.metadata || {} },
      output: { text: result.output },
      status,
      error_message: errorMessage,
      duration_ms: durationMs,
      tokens_used: result.tokensUsed,
      cost_usd: result.cost,
      started_at: new Date(Date.now() - durationMs).toISOString(),
      completed_at: new Date().toISOString(),
    };

    const { error } = await (
      supabase as unknown as {
        from: (
          table: string
        ) => {
          insert: (
            values: Record<string, unknown>
          ) => Promise<{ error: { message: string } | null }>;
        };
      }
    )
      .from("executions")
      .insert(payload);
    if (error) {
      console.error("فشل حفظ سجل التنفيذ.", error.message);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new AgentExecutorError("انتهت مهلة التنفيذ.", "TIMEOUT"));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  private detectCycle(workflow: Workflow) {
    const nodes = workflow.nodes;
    const edges = workflow.edges || [];
    const incoming = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      incoming.set(node.id, 0);
      adjacency.set(node.id, []);
    }
    for (const edge of edges) {
      incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
      adjacency.get(edge.source)?.push(edge.target);
    }

    const queue = nodes
      .filter((node) => (incoming.get(node.id) || 0) === 0)
      .map((node) => node.id);
    let visited = 0;
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) {
        break;
      }
      visited += 1;
      for (const next of adjacency.get(id) || []) {
        incoming.set(next, (incoming.get(next) || 0) - 1);
        if ((incoming.get(next) || 0) === 0) {
          queue.push(next);
        }
      }
    }
    return visited !== nodes.length;
  }

  private async sleep(duration: number) {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  private generateExecutionId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `exec_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  }

  private findNode(workflow: Workflow, nodeId: string): WorkflowNode | null {
    return workflow.nodes.find((node) => node.id === nodeId) || null;
  }

  private storeOutput(
    node: WorkflowNode,
    context: ExecutionContext,
    output: unknown
  ) {
    if (output === undefined) {
      return;
    }
    const key = String(node.data.outputKey || node.id);
    context.variables[key] = output;
  }
}

const resolveCostLimit = (
  agent: { settings?: Record<string, unknown> },
  context: ExecutionContext
) => {
  const limit = agent.settings?.maxCostUsd ?? context.variables.maxCostUsd;
  if (limit === undefined || limit === null) {
    return null;
  }
  return Number(limit);
};

export default new AgentExecutor();
