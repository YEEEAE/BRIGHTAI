import agentMonitoring from "../agent.monitoring";
import { ActionExecutor } from "./action-executor";
import { MAX_EXECUTION_TIME_MS } from "./constants";
import { buildContext, generateExecutionId, resolveModel } from "./helpers";
import { buildSystemPrompt } from "./llm";
import { NodeExecutor } from "./node-executor";
import repository from "./repository";
import { validateWorkflowStructure } from "./graph";
import { WorkflowRunner } from "./workflow-runner";
import type {
  AgentExecutionInput,
  AgentExecutionResult,
  ExecutionContext,
  ExecutionUpdate,
  NodeResult,
  ValidationResult,
  Workflow,
  WorkflowNode,
} from "./types";
import { AgentExecutorError } from "./types";

export class AgentExecutor {
  private readonly actions: ActionExecutor;
  private readonly nodeExecutor: NodeExecutor;
  private readonly runner: WorkflowRunner;

  constructor() {
    this.actions = new ActionExecutor((input) => this.execute(input));
    this.nodeExecutor = new NodeExecutor(this.actions);
    this.runner = new WorkflowRunner(this.nodeExecutor);
  }

  async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const startedAt = Date.now();
    const executionId = generateExecutionId();
    const traceId = input.context?.traceId || executionId;
    const depth = input.context?.depth ?? 0;

    const { agent, workflow } = await repository.loadAgent(input.agentId);
    const validation = this.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new AgentExecutorError(`المخطط غير صالح: ${validation.errors.join("، ")}`, "INVALID_WORKFLOW");
    }

    const apiKey = await repository.resolveApiKey(input, agent);
    const model = resolveModel(agent);
    const context = buildContext(input, model, apiKey, workflow, false, undefined, traceId, depth);

    agentMonitoring.record({ executionId: traceId, agentId: input.agentId, message: "بدء تنفيذ الوكيل", level: "info", data: { depth } });

    try {
      const result = await this.withTimeout(
        this.runner.run(workflow, input.userMessage, context, agent),
        MAX_EXECUTION_TIME_MS
      );

      const durationMs = Date.now() - startedAt;
      await repository.saveExecutionLog(input, result, durationMs, "ناجح", null);

      return {
        output: result.output,
        tokensUsed: result.tokensUsed,
        durationMs,
        cost: result.cost,
        executionId,
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      await repository.saveExecutionLog(
        input,
        { output: "", tokensUsed: 0, cost: 0 },
        durationMs,
        "فشل",
        error instanceof Error ? error.message : "فشل التنفيذ."
      );
      throw error;
    }
  }

  async *executeWithStreaming(input: AgentExecutionInput): AsyncGenerator<ExecutionUpdate> {
    const updates: ExecutionUpdate[] = [];
    let resolver: (() => void) | null = null;
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
      const executionId = generateExecutionId();
      const traceId = input.context?.traceId || executionId;
      const depth = input.context?.depth ?? 0;
      pushUpdate({ type: "بدء", data: { executionId }, progress: 0 });

      try {
        const { agent, workflow } = await repository.loadAgent(input.agentId);
        const validation = this.validateWorkflow(workflow);
        if (!validation.isValid) {
          throw new AgentExecutorError(`المخطط غير صالح: ${validation.errors.join("، ")}`, "INVALID_WORKFLOW");
        }

        const apiKey = await repository.resolveApiKey(input, agent);
        const model = resolveModel(agent);
        const context = buildContext(
          input,
          model,
          apiKey,
          workflow,
          true,
          async (chunk) => pushUpdate({ type: "رسالة", data: chunk, progress: 0 }),
          traceId,
          depth
        );

        const nodesTotal = workflow.nodes.length || 1;
        let completedNodes = 0;

        const result = await this.withTimeout(
          this.runner.run(workflow, input.userMessage, context, agent, async (update) => {
            if (update.type === "عقدة" && (update.data as { status?: string }).status === "انتهاء") {
              completedNodes += 1;
              update.progress = Math.round((completedNodes / nodesTotal) * 100);
            }
            pushUpdate(update);
          }),
          MAX_EXECUTION_TIME_MS
        );

        const durationMs = Date.now() - startedAt;
        await repository.saveExecutionLog(input, result, durationMs, "ناجح", null);
        pushUpdate({
          type: "انتهاء",
          data: { output: result.output, tokensUsed: result.tokensUsed, cost: result.cost, durationMs, executionId },
          progress: 100,
        });
      } catch (error) {
        executionError = error;
        const durationMs = Date.now() - startedAt;
        await repository.saveExecutionLog(
          input,
          { output: "", tokensUsed: 0, cost: 0 },
          durationMs,
          "فشل",
          error instanceof Error ? error.message : "فشل التنفيذ."
        );
        pushUpdate({ type: "خطأ", data: { message: error instanceof Error ? error.message : "فشل التنفيذ." }, progress: 0 });
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

  validateWorkflow(workflow: Workflow): ValidationResult {
    return validateWorkflowStructure(workflow);
  }

  buildSystemPrompt(workflow: Workflow, context?: ExecutionContext): string {
    return buildSystemPrompt(workflow, context);
  }

  executeNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeResult> {
    return this.nodeExecutor.executeNode(node, context);
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new AgentExecutorError("انتهت مهلة التنفيذ.", "TIMEOUT")), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  }
}

export default new AgentExecutor();
