import { http } from "../http";
import agentTools, { type ToolType } from "../agent.tools";
import { DEFAULT_MAX_DEPTH, TOOL_ACTIONS } from "./constants";
import { findNode, interpolateObject, normalizeHeaders, resolveTemplate } from "./helpers";
import type { AgentExecutionInput, AgentExecutionResult, ExecutionContext, WorkflowNode } from "./types";
import { AgentExecutorError } from "./types";

type ExecuteAgentFn = (input: AgentExecutionInput) => Promise<AgentExecutionResult>;

export class ActionExecutor {
  constructor(private readonly executeAgent: ExecuteAgentFn) {}

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<unknown> {
    const actionType = String(node.data.actionType || "http");

    if (actionType === "http") {
      return this.executeHttpAction(node, context);
    }

    if (actionType === "compute") {
      const expression = String(node.data.expression || "");
      return resolveTemplate(expression, context);
    }

    if (actionType === "agent_call" || actionType === "agent_sequence") {
      return this.executeAgentSequence(node, context);
    }

    if (actionType === "agent_parallel") {
      return this.executeAgentParallel(node, context);
    }

    if (actionType === "agent_orchestration") {
      return this.executeAgentOrchestration(node, context);
    }

    if (TOOL_ACTIONS.includes(actionType as ToolType)) {
      return this.executeToolAction(actionType as ToolType, node, context);
    }

    return null;
  }

  private async executeHttpAction(node: WorkflowNode, context: ExecutionContext): Promise<unknown> {
    const url = resolveTemplate(String(node.data.url || ""), context);
    const method = String(node.data.method || "POST");
    const payload =
      node.data.payload && typeof node.data.payload === "object"
        ? interpolateObject(node.data.payload as Record<string, unknown>, context)
        : undefined;
    const headers =
      node.data.headers && typeof node.data.headers === "object"
        ? normalizeHeaders(interpolateObject(node.data.headers as Record<string, unknown>, context))
        : undefined;

    const response = await http.request({
      url,
      method,
      data: payload,
      headers,
    });

    return response.data;
  }

  private async executeToolAction(toolType: ToolType, node: WorkflowNode, context: ExecutionContext): Promise<unknown> {
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
      throw new AgentExecutorError(result.error || "فشل تنفيذ الأداة.", this.mapToolError(result.errorCode));
    }

    return result.data;
  }

  private mapToolError(code?: string) {
    switch (code) {
      case "RATE_LIMIT":
        return "RATE_LIMIT" as const;
      default:
        return "NODE_FAILED" as const;
    }
  }

  private resolveActionMessage(node: WorkflowNode, context: ExecutionContext): string {
    const template = String(node.data.message || "{{last_output}}");
    return resolveTemplate(template, context);
  }

  private extractAgentIds(node: WorkflowNode): string[] {
    const direct = node.data.agentId ? [String(node.data.agentId)] : [];
    const list = Array.isArray(node.data.agentIds)
      ? (node.data.agentIds as string[]).map((id) => String(id))
      : [];
    return [...direct, ...list].filter(Boolean);
  }

  private resolveShareContext(node: WorkflowNode, context: ExecutionContext): boolean {
    if (typeof node.data.shareContext === "boolean") {
      return node.data.shareContext;
    }
    return Boolean(context.metadata.workflow.settings?.collaboration?.shareContext ?? true);
  }

  private selectSharedVariables(variables: Record<string, unknown>): Record<string, unknown> {
    const shared: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(variables)) {
      if (/key|token|secret/i.test(key)) {
        continue;
      }
      shared[key] = value;
    }
    return shared;
  }

  private storeAgentOutput(context: ExecutionContext, agentId: string, output: unknown): void {
    if (!context.variables.agent_outputs || typeof context.variables.agent_outputs !== "object") {
      context.variables.agent_outputs = {};
    }
    const store = context.variables.agent_outputs as Record<string, unknown>;
    store[agentId] = output;
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  private async executeAgentCall(
    agentId: string,
    message: string,
    context: ExecutionContext,
    shareContext: boolean
  ): Promise<AgentExecutionResult> {
    const maxDepth = context.metadata.workflow.settings?.collaboration?.maxDepth ?? DEFAULT_MAX_DEPTH;
    const nextDepth = context.metadata.depth + 1;
    if (nextDepth > maxDepth) {
      throw new AgentExecutorError("تم تجاوز عمق التعاون بين الوكلاء.", "INVALID_WORKFLOW");
    }

    const variables = shareContext ? this.selectSharedVariables(context.variables) : {};
    const useUserKey = Boolean(
      context.metadata.workflow.settings?.collaboration?.useUserKey ?? context.variables.useUserKey
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

    return this.executeAgent(childInput);
  }

  private async executeAgentSequence(node: WorkflowNode, context: ExecutionContext): Promise<unknown> {
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

  private async executeAgentParallel(node: WorkflowNode, context: ExecutionContext): Promise<unknown> {
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
      const batchResults = await Promise.all(chunk.map((agentId) => this.executeAgentCall(agentId, message, context, shareContext)));
      batchResults.forEach((result, index) => {
        results.push(result);
        this.storeAgentOutput(context, chunk[index], result.output);
      });
    }

    return node.data.returnAll ? results : results.map((item) => item.output);
  }

  private async executeAgentOrchestration(node: WorkflowNode, context: ExecutionContext): Promise<unknown> {
    const plan = node.data.plan && typeof node.data.plan === "object" ? (node.data.plan as Record<string, unknown>) : {};
    const sequence = Array.isArray(plan.sequence) ? (plan.sequence as string[]) : [];
    const parallelGroups = Array.isArray(plan.parallel) ? (plan.parallel as string[][]) : [];

    const results: unknown[] = [];
    if (sequence.length > 0) {
      const sequenceNode: WorkflowNode = { ...node, data: { ...node.data, agentIds: sequence, returnAll: true } };
      results.push(await this.executeAgentSequence(sequenceNode, context));
    }

    for (const group of parallelGroups) {
      const parallelNode: WorkflowNode = { ...node, data: { ...node.data, agentIds: group, returnAll: true } };
      results.push(await this.executeAgentParallel(parallelNode, context));
    }

    return results;
  }
}
