// P03 — bounded multi-agent orchestration. Every agent in a plan is an
// independent entitlement decision and carries its own tenant-bound handoff.
// No prompt, credential or context from one run is passed to the next.

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';
import { manifestFor, LIMITS, handoffAllowed, buildHandoff, isUuid } from './contracts.mjs';
import { kernelAuthorize } from './runtime.mjs';

const keyPattern = /^[A-Za-z0-9_.:-]{1,128}$/;
const planSchema = z.strictObject({
  plan: z.array(z.strictObject({
    agentKey: z.string().regex(/^[a-z][a-z0-9-]{1,63}$/),
    objective: z.string().min(3).max(500).refine(value => Boolean(value.trim())),
    messages: z.array(z.record(z.string(), z.json())).max(LIMITS.maxToolsPerStep).optional(),
  })).min(1).max(LIMITS.maxAgentsPerPlan),
  correlationId: z.uuidv4(),
  idempotencyKey: z.string().regex(keyPattern),
  deadlineMs: z.number().int().min(LIMITS.minDeadlineMs).max(LIMITS.maxDeadlineMs).optional(),
});

export function createOrchestrator({ runtime, authorize = kernelAuthorize, randomId = () => randomUUID(), now = () => new Date() } = {}) {
  return {
    schemas: Object.freeze({ plan: planSchema }),
    async execute(identity, tenantId, body) {
      const parsed = planSchema.safeParse(body);
      if (!parsed.success) throw new KernelError(400, 'INVALID_BODY', 'حقول خطة الوكلاء أو قيمها غير صالحة.');
      const input = parsed.data;
      if (!isUuid(identity?.userId) || !isUuid(tenantId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم سياق مؤسسة موثّق.');
      const agents = input.plan.map(item => manifestFor(item.agentKey));
      if (agents.some(item => !item)) throw new KernelError(404, 'AGENT_UNKNOWN', 'أحد الوكلاء غير معروف.');
      if (new Set(input.plan.map(item => item.agentKey)).size !== input.plan.length) {
        throw new KernelError(400, 'DUPLICATE_AGENT', 'لا يمكن تكرار الوكيل في خطة واحدة.');
      }
      const executed = [];
      let previous = null;
      for (const [index, item] of input.plan.entries()) {
        const manifest = agents[index];
        // Entitlement is re-checked per agent, in the same transaction shape as
        // a standalone run. One product's grant never implies another's.
        try {
          await runtime.store.transact(tx => authorize(tx, identity, tenantId, manifest.product, 'agent.orchestrate'));
        } catch (error) {
          executed.push({ run_id: null, agent_key: item.agentKey, product: manifest.product,
            status: 'DENIED', reason: error?.code ?? 'ACCESS_DENIED' });
          break;
        }
        const correlationId = index === 0 ? input.correlationId : randomId();
        let handoff = previous?.handoff ?? null;
        if (handoff && !handoffAllowed(handoff, tenantId, { requiredAgentKey: item.agentKey })) {
          handoff = buildHandoff({ runId: previous.run_id, parentRunId: previous.parent_run_id ?? null,
            parentStepId: previous.step_id ?? null, tenantId, agentKey: item.agentKey, correlationId,
            previousCorrelationId: previous.correlation_id ?? null, createdAt: now().toISOString() });
        }
        const run = await runtime.start(identity, tenantId, {
          agentKey: item.agentKey, objective: item.objective, synthetic: true, correlationId,
          idempotencyKey: input.idempotencyKey + ':' + index,
          parentRunId: previous?.run_id ?? null, parentStepId: previous?.step_id ?? null,
          deadlineMs: input.deadlineMs, handoff,
        });
        let current = run;
        for (const [toolIndex, message] of (item.messages ?? []).entries()) {
          const result = await runtime.step(identity, tenantId, run.run_id, {
            kind: 'TOOL', message, correlationId, idempotencyKey: input.idempotencyKey + ':' + index + ':tool:' + toolIndex,
          });
          current = { ...run, ...result };
          if (result.status !== 'RUNNING') break;
        }
        if (current.status === 'RUNNING') {
          const result = await runtime.step(identity, tenantId, run.run_id, {
            kind: 'RESULT', note: 'orchestration step complete', correlationId,
            idempotencyKey: input.idempotencyKey + ':' + index + ':result',
          });
          current = { ...run, ...result };
        }
        executed.push({ run_id: run.run_id, agent_key: item.agentKey, product: manifest.product,
          status: current.status ?? run.status, handoff: current.handoff ?? run.handoff, correlation_id: correlationId });
        if (current.status !== 'COMPLETED') break;
        previous = { ...current, parent_run_id: run.parent_run_id ?? null };
      }
      return Object.freeze({ status: executed.at(-1)?.status === 'COMPLETED' && executed.length === input.plan.length ? 'COMPLETED' : 'PARTIAL',
        correlation_id: input.correlationId, runs: executed });
    },
  };
}
