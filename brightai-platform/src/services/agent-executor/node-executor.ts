import { callGroq } from "./llm";
import { ActionExecutor } from "./action-executor";
import { findNode, resolveTemplate, sleep, storeOutput } from "./helpers";
import type { ExecutionContext, NodeResult, WorkflowEdge, WorkflowNode } from "./types";
import { AgentExecutorError } from "./types";

export class NodeExecutor {
  constructor(private readonly actions: ActionExecutor) {}

  async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeResult> {
    const startedAt = Date.now();

    try {
      switch (node.type) {
        case "input": {
          const output = context.variables.userMessage;
          storeOutput(node, context, output);
          return { success: true, output, durationMs: Date.now() - startedAt };
        }
        case "instruction": {
          const output = node.data.text || node.data.content;
          storeOutput(node, context, output);
          return { success: true, output, durationMs: Date.now() - startedAt };
        }
        case "prompt": {
          const promptText = resolveTemplate(String(node.data.text || ""), context);
          const response = await callGroq(promptText, context, {
            temperature: Number(node.data.temperature ?? 0.4),
            max_tokens: Number(node.data.max_tokens ?? 1000),
            top_p: Number(node.data.top_p ?? 0.9),
            stream: Boolean(node.data.stream),
          });
          storeOutput(node, context, response.text);
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
          storeOutput(node, context, result);
          return { success: true, output: result, durationMs: Date.now() - startedAt };
        }
        case "action": {
          const result = await this.actions.execute(node, context);
          storeOutput(node, context, result);
          return { success: true, output: result, durationMs: Date.now() - startedAt };
        }
        case "output": {
          const template = String(node.data.template || "{{last_output}}");
          const useModel = Boolean(node.data.useModel);
          if (useModel) {
            const response = await callGroq(resolveTemplate(template, context), context, {
              temperature: Number(node.data.temperature ?? 0.3),
              max_tokens: Number(node.data.max_tokens ?? 800),
              top_p: Number(node.data.top_p ?? 0.9),
              stream: Boolean(node.data.stream),
            });
            storeOutput(node, context, response.text);
            return {
              success: true,
              output: response.text,
              tokensUsed: response.tokensUsed,
              cost: response.cost,
              durationMs: Date.now() - startedAt,
            };
          }
          const output = resolveTemplate(template, context);
          storeOutput(node, context, output);
          return { success: true, output, durationMs: Date.now() - startedAt };
        }
        case "loop": {
          const output = await this.executeLoop(node, context);
          storeOutput(node, context, output);
          return { success: true, output, durationMs: Date.now() - startedAt };
        }
        case "variable": {
          return this.executeVariable(node, context, startedAt);
        }
        default:
          return { success: false, error: "نوع عقدة غير مدعوم.", durationMs: Date.now() - startedAt };
      }
    } catch (error) {
      if (error instanceof AgentExecutorError) {
        return { success: false, error: error.message, errorCode: error.code, durationMs: Date.now() - startedAt };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل تنفيذ العقدة.",
        errorCode: "NODE_FAILED",
        durationMs: Date.now() - startedAt,
      };
    }
  }

  async executeNodeWithRetry(node: WorkflowNode, context: ExecutionContext): Promise<NodeResult> {
    const retries = Number(node.data.retry || 2);
    let attempt = 0;

    while (attempt <= retries) {
      const result = await this.executeNode(node, context);
      if (result.success) {
        return result;
      }
      attempt += 1;
      const backoff = result.errorCode === "RATE_LIMIT" ? 2000 * Math.pow(2, attempt) : 500 * Math.pow(2, attempt);
      await sleep(backoff);
    }

    return { success: false, error: "فشل تنفيذ العقدة بعد عدة محاولات.", errorCode: "NODE_FAILED" };
  }

  isEdgeSatisfied(edge: WorkflowEdge, context: ExecutionContext): boolean {
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

  private evaluateCondition(node: WorkflowNode, context: ExecutionContext): boolean {
    const rule = node.data as WorkflowEdge["condition"] & { variable?: string };
    if (!rule || !rule.variable) {
      return false;
    }
    return this.isEdgeSatisfied({ source: node.id, target: node.id, condition: rule }, context);
  }

  private async executeLoop(node: WorkflowNode, context: ExecutionContext): Promise<unknown[]> {
    const iterations = Number(node.data.iterations || 0);
    const directItems = Array.isArray(node.data.items) ? (node.data.items as unknown[]) : [];
    const itemsVar = typeof node.data.itemsVar === "string" ? node.data.itemsVar : "";
    const variableItems = itemsVar && Array.isArray(context.variables[itemsVar]) ? (context.variables[itemsVar] as unknown[]) : [];
    const items = directItems.length > 0 ? directItems : variableItems;

    const results: unknown[] = [];
    const limit = Math.min(iterations || items.length, 50);

    for (let i = 0; i < limit; i += 1) {
      context.variables.loop_index = i;
      context.variables.loop_item = items[i];
      const nestedNode = node.data.nodeId ? findNode(context.metadata.workflow, node.data.nodeId as string) : null;
      if (nestedNode) {
        const nestedResult = await this.executeNode(nestedNode, context);
        results.push(nestedResult.output);
      } else {
        results.push(resolveTemplate(String(node.data.template || ""), context));
      }
    }

    return results;
  }

  private executeVariable(node: WorkflowNode, context: ExecutionContext, startedAt: number): NodeResult {
    const operation = String(node.data.operation || "set");
    const key = String(node.data.key || node.id);
    if (operation === "set") {
      context.variables[key] = node.data.value;
      return { success: true, output: context.variables[key], durationMs: Date.now() - startedAt };
    }
    storeOutput(node, context, context.variables[key]);
    return { success: true, output: context.variables[key], durationMs: Date.now() - startedAt };
  }
}
