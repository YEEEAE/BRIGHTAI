import agentMemory from "../agent.memory";
import { DEFAULT_MEMORY_LIMIT } from "./constants";
import { pushHistory, resolveCostLimit } from "./helpers";
import type {
  AgentExecutionSummary,
  ExecutionContext,
  ExecutionUpdate,
  NodeResult,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
} from "./types";
import { AgentExecutorError } from "./types";
import { NodeExecutor } from "./node-executor";

export class WorkflowRunner {
  constructor(private readonly nodeExecutor: NodeExecutor) {}

  async run(
    workflow: Workflow,
    userMessage: string,
    context: ExecutionContext,
    agent: { id: string; user_id: string; settings?: Record<string, unknown> },
    onUpdate?: (update: ExecutionUpdate) => Promise<void>
  ): Promise<AgentExecutionSummary> {
    const nodesById = new Map(workflow.nodes.map((node) => [node.id, node]));
    const edges = workflow.edges || [];
    const incomingCount = this.buildIncomingCount(workflow.nodes, edges);
    const satisfiedCount = new Map<string, number>(workflow.nodes.map((node) => [node.id, 0]));
    const adjacency = this.buildAdjacency(workflow.nodes, edges);

    const queue: WorkflowNode[] = workflow.nodes.filter((node) => (incomingCount.get(node.id) || 0) === 0);

    let tokensUsed = 0;
    let cost = 0;
    let lastOutput = "";

    context.variables.userMessage = userMessage;
    context.variables.memory_limit = workflow.settings?.memoryLimit || DEFAULT_MEMORY_LIMIT;

    await this.attachMemoryContext(context, userMessage);

    while (queue.length > 0) {
      const batch = workflow.settings?.parallel ? queue.splice(0, queue.length) : [queue.shift()].filter(Boolean) as WorkflowNode[];

      const results = await Promise.all(
        batch.map(async (node) => {
          if (onUpdate) {
            await onUpdate({ type: "عقدة", data: { id: node.id, type: node.type, status: "بدء" }, progress: 0 });
          }
          const result = await this.nodeExecutor.executeNodeWithRetry(node, context);
          return { node, result };
        })
      );

      for (const { node, result } of results) {
        this.consumeNodeResult({ node, result, context, onUpdate, stats: { tokensUsed, cost } });
        tokensUsed += result.tokensUsed || 0;
        cost += result.cost || 0;

        if (!result.success) {
          throw new AgentExecutorError(result.error || "فشل تنفيذ عقدة.", result.errorCode || "NODE_FAILED");
        }

        context.variables.last_output = result.output;
        lastOutput = String(result.output ?? "");

        for (const edge of adjacency.get(node.id) || []) {
          if (this.nodeExecutor.isEdgeSatisfied(edge, context)) {
            satisfiedCount.set(edge.target, (satisfiedCount.get(edge.target) || 0) + 1);
          }
        }
      }

      this.enqueueReadyNodes({ workflow, queue, incomingCount, satisfiedCount, nodesById, context });
    }

    const maxCost = resolveCostLimit(agent, context);
    if (maxCost !== null && cost > maxCost) {
      throw new AgentExecutorError("تم تجاوز الحد الأعلى للتكلفة.", "NODE_FAILED");
    }

    await this.persistAssistantMemory(context, lastOutput);

    return { output: lastOutput, tokensUsed, cost };
  }

  private buildIncomingCount(nodes: WorkflowNode[], edges: WorkflowEdge[]): Map<string, number> {
    const incoming = new Map<string, number>(nodes.map((node) => [node.id, 0]));
    for (const edge of edges) {
      incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    }
    return incoming;
  }

  private buildAdjacency(nodes: WorkflowNode[], edges: WorkflowEdge[]): Map<string, WorkflowEdge[]> {
    const adjacency = new Map<string, WorkflowEdge[]>(nodes.map((node) => [node.id, []]));
    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge);
    }
    return adjacency;
  }

  private async attachMemoryContext(context: ExecutionContext, userMessage: string): Promise<void> {
    if (context.metadata.userId) {
      await agentMemory.addEntry({
        userId: context.metadata.userId,
        agentId: context.metadata.agentId,
        content: userMessage,
        role: "user",
        metadata: { traceId: context.metadata.traceId },
      });
    }

    const memoryContext = await agentMemory.getContext(context.metadata.userId, context.metadata.agentId, userMessage);
    context.variables.long_term_memory = memoryContext.snippet;
    context.variables.semantic_hits = memoryContext.items;
  }

  private consumeNodeResult(args: {
    node: WorkflowNode;
    result: NodeResult;
    context: ExecutionContext;
    onUpdate?: (update: ExecutionUpdate) => Promise<void>;
    stats: { tokensUsed: number; cost: number };
  }): void {
    const { node, result, context, onUpdate } = args;
    pushHistory(context, node, result);
    if (onUpdate) {
      void onUpdate({ type: "عقدة", data: { id: node.id, type: node.type, status: "انتهاء", result }, progress: 0 });
    }
  }

  private enqueueReadyNodes(args: {
    workflow: Workflow;
    queue: WorkflowNode[];
    incomingCount: Map<string, number>;
    satisfiedCount: Map<string, number>;
    nodesById: Map<string, WorkflowNode>;
    context: ExecutionContext;
  }): void {
    const { workflow, queue, incomingCount, satisfiedCount, nodesById, context } = args;

    for (const node of workflow.nodes) {
      const required = incomingCount.get(node.id) || 0;
      const satisfied = satisfiedCount.get(node.id) || 0;
      const waitAll = Boolean(node.data.waitAll);
      const ready = required === 0 || (waitAll ? satisfied >= required : satisfied >= 1);

      if (!ready) {
        continue;
      }
      if (!nodesById.has(node.id)) {
        continue;
      }
      if (queue.find((item) => item.id === node.id)) {
        continue;
      }
      if (context.history.find((item) => item.nodeId === node.id)) {
        continue;
      }

      queue.push(node);
    }
  }

  private async persistAssistantMemory(context: ExecutionContext, lastOutput: string): Promise<void> {
    if (!context.metadata.userId) {
      return;
    }

    await agentMemory.addEntry({
      userId: context.metadata.userId,
      agentId: context.metadata.agentId,
      content: String(lastOutput || ""),
      role: "assistant",
      metadata: { traceId: context.metadata.traceId },
    });
  }
}
