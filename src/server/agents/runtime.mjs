// P03 — bounded run/step/tool lifecycle. Identity and tenant always arrive from
// the verified Kernel session through the caller; this module never reads them
// from a body, never stores content, and never manufactures success.

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { KernelError } from '../kernel/core.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { evaluateKernelPolicy } from '../kernel/policies.mjs';
import { audit } from '../kernel/service.mjs';
import { recordKernelAuditEvidence } from '../ledger/writer.mjs';
import { createAgentStore } from './repository.mjs';
import { createToolExecutor } from './tool-executor.mjs';
import {
  LIMITS, RUN_STATUSES, STEP_KINDS, buildHandoff, handoffAllowed, manifestFor,
  agentVersion, policyVersion, shortReference, reference, outboxEvent, isUuid, canTransition,
  RUN_TRANSITIONS,
} from './contracts.mjs';

const keyPattern = /^[A-Za-z0-9_.:-]{1,128}$/;
const reasonPattern = /^[A-Z][A-Z0-9_]{1,79}$/;
const startSchema = z.strictObject({
  agentKey: z.string().regex(/^[a-z][a-z0-9-]{1,63}$/),
  objective: z.string().min(3).max(500).refine(value => Boolean(value.trim())),
  synthetic: z.literal(true),
  correlationId: z.uuidv4(),
  idempotencyKey: z.string().regex(keyPattern),
  parentRunId: z.uuid().nullish(),
  parentStepId: z.uuid().nullish(),
  deadlineMs: z.number().int().min(LIMITS.minDeadlineMs).max(LIMITS.maxDeadlineMs).optional(),
  handoff: z.record(z.string(), z.json()).nullish(),
});
const stepSchema = z.strictObject({
  kind: z.enum(STEP_KINDS),
  message: z.record(z.string(), z.json()).nullish(),
  note: z.string().min(3).max(200).nullish(),
  correlationId: z.uuidv4(),
  idempotencyKey: z.string().regex(keyPattern),
});
const approveSchema = z.strictObject({
  approvalRef: z.uuid(), correlationId: z.uuidv4(), idempotencyKey: z.string().regex(keyPattern),
});
const cancelSchema = z.strictObject({
  reason: z.string().regex(reasonPattern), correlationId: z.uuidv4(), idempotencyKey: z.string().regex(keyPattern),
});

const parse = (schema, body) => {
  const result = schema.safeParse(body);
  if (!result.success) throw new KernelError(400, 'INVALID_BODY', 'حقول الطلب أو قيمها غير صالحة.');
  return result.data;
};
const summarize = (kind, detail) => [kind, detail].filter(Boolean).join(': ').slice(0, LIMITS.maxSummaryChars);
const publicRun = (run, { replayed = false } = {}) => Object.freeze({
  run_id: run.id, tenant_id: run.tenant_id, status: run.status, agent_key: run.agent_key,
  agent_version: run.agent_version ?? agentVersion(run.agent_key),
  policy_version: run.policy_version, correlation_id: run.correlation_id ?? null,
  handoff: run.handoff ?? null, expires_at: run.expires_at ?? null, created_at: run.created_at ?? null,
  replayed,
});

export const kernelAuthorize = (tx, identity, tenantId, product, operation) => requireProductAccess(tx.db, identity, tenantId, product, operation);
export const kernelPolicy = (tx, identity, tenantId, context) => evaluateKernelPolicy(tx.db, identity, tenantId, context);
export async function kernelEvidence(tx, identity, tenantId, { action, correlationId, policyVersion, idempotencyKey }) {
  const auditId = randomUUID();
  await audit(tx.db, identity, tenantId, action, { correlationId, policyVersion, idempotencyKey });
  const ledger = await recordKernelAuditEvidence(tx.db, identity, tenantId, { auditId, correlationId, policyVersion, action: 'kernel.' + action });
  return { auditId, recorded: ledger.recorded === true, dependencyStatus: ledger.dependencyStatus ?? null };
}
export async function kernelApproval(tx, identity, tenantId, { approvalRef, fingerprint: expected }) {
  // A digest prefix and an APPROVE row do not prove a current, one-use grant.
  // Resume remains closed until the checkpoint has a transactional HG binding.
  return { approved: false, reason: 'APPROVAL_BINDING_NOT_CONFIGURED' };
}

export function createAgentRuntime({
  store = createAgentStore(),
  tools = Object.create(null),
  authorize = kernelAuthorize,
  evaluatePolicy = kernelPolicy,
  appendEvidence = kernelEvidence,
  verifyApproval = kernelApproval,
  dispatch = null,
  now = () => new Date(),
  randomId = () => randomUUID(),
} = {}) {
  const executor = createToolExecutor({ tools, evaluatePolicy, now });
  const controllers = new Map();
  const abort = runId => controllers.get(runId)?.abort();

  const writeEvidence = async (tx, identity, tenantId, { runId, action, correlationId, idempotencyKey, eventType, causationId = null }) => {
    const policy = policyVersion(tx.agentKey);
    const evidence = await appendEvidence(tx, identity, tenantId, { action, correlationId, policyVersion: policy, idempotencyKey });
    const event = outboxEvent({ tenantId, aggregateType: 'AGENT_RUN', aggregateId: runId, eventType,
      correlationId, causationId, payloadRef: reference(tenantId, 'run', runId), idempotencyKey: 'outbox:' + idempotencyKey });
    if (!event) throw new KernelError(400, 'INVALID_OUTBOX_EVENT', 'مرجع حدث غير صالح.');
    await tx.appendOutbox(event);
    return evidence;
  };

  const load = async (tx, identity, tenantId, runId, operation) => {
    if (!isUuid(runId)) throw new KernelError(400, 'INVALID_RUN_ID', 'معرّف التشغيل غير صالح.');
    const run = await tx.getRun(tenantId, runId);
    if (!run) throw new KernelError(404, 'RUN_NOT_FOUND', 'التشغيل غير موجود.');
    if (run.tenant_id !== tenantId) throw new KernelError(403, 'TENANT_MISMATCH', 'التشغيل ليس من مؤسستك.');
    await authorize(tx, identity, tenantId, manifestFor(run.agent_key)?.product, operation);
    if (!RUN_STATUSES.includes(run.status)) throw new KernelError(409, 'AGENT_STATE_INVALID', 'حالة التشغيل غير صالحة.');
    if (new Date(run.expires_at).getTime() <= now().getTime() && !['COMPLETED','FAILED','CANCELLED','EXPIRED'].includes(run.status)) {
      await tx.updateRun(tenantId, runId, { status: 'EXPIRED' }, run.status);
      run.status = 'EXPIRED';
    }
    return run;
  };

  return {
    store, executor,
    schemas: Object.freeze({ start: startSchema, step: stepSchema, approve: approveSchema, cancel: cancelSchema, ...executor.schemas }),
    async start(identity, tenantId, body) {
      const input = parse(startSchema, body);
      if (!isUuid(identity?.userId) || !isUuid(tenantId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم سياق مؤسسة موثّق.');
      const manifest = manifestFor(input.agentKey);
      if (!manifest) throw new KernelError(404, 'AGENT_UNKNOWN', 'الوكيل غير معروف.');
      const deadlineMs = input.deadlineMs ?? LIMITS.maxDeadlineMs;
      const expiresAt = new Date(now().getTime() + Math.min(deadlineMs, LIMITS.maxDeadlineMs)).toISOString();
      const fingerprintValue = shortReference([input.agentKey, input.objective, input.correlationId, tenantId]);
      const runId = randomId();
      return store.transact(async tx => {
        await authorize(tx, identity, tenantId, manifest.product, 'agent.run.start');
        tx.agentKey = input.agentKey;
        if (input.handoff && !handoffAllowed(input.handoff, tenantId, { requiredAgentKey: input.agentKey })) {
          throw new KernelError(403, 'HANDOFF_REJECTED', 'التسليم غير مطابق للمؤسسة أو النسخة أو مفتاح الإلغاء.');
        }
        const handoff = buildHandoff({ runId, parentRunId: input.parentRunId ?? null, parentStepId: input.parentStepId ?? null,
          tenantId, agentKey: input.agentKey, correlationId: input.correlationId,
          previousCorrelationId: input.handoff?.correlation_id ?? null, createdAt: now().toISOString() });
        const run = await tx.createRun({ id: runId, tenantId, actorId: identity.userId,
          parentRunId: input.parentRunId ?? null, agentKey: input.agentKey, policyVersion: policyVersion(input.agentKey),
          status: 'QUEUED', idempotencyKey: input.idempotencyKey, requestFingerprint: fingerprintValue,
          expiresAt, correlation_id: input.correlationId, handoff, agent_version: agentVersion(input.agentKey) });
        if (run.request_fingerprint !== fingerprintValue || run.agent_key !== input.agentKey || run.policy_version !== policyVersion(input.agentKey)) {
          throw new KernelError(409, 'AGENT_IDEMPOTENCY_CONFLICT', 'مفتاح منع التكرار مرتبط بتشغيل مختلف.');
        }
        if (run.status !== 'QUEUED') return publicRun({ ...run, handoff: run.handoff ?? handoff }, { replayed: true });
        await writeEvidence(tx, identity, tenantId, { runId, action: 'kernel.agent.run.started', correlationId: input.correlationId,
          idempotencyKey: 'run:' + input.idempotencyKey, eventType: 'agent.run.started', causationId: input.parentRunId ?? null });
        const active = await tx.updateRun(tenantId, runId, { status: 'RUNNING' }, 'QUEUED');
        return publicRun({ ...active, correlation_id: input.correlationId, handoff });
      });
    },
    async step(identity, tenantId, runId, body) {
      const input = parse(stepSchema, body);
      if (!isUuid(identity?.userId) || !isUuid(tenantId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم سياق مؤسسة موثّق.');
      const outcome = await store.transact(async tx => {
        const run = await load(tx, identity, tenantId, runId, 'agent.step');
        if (run.status !== 'RUNNING') throw new KernelError(409, 'AGENT_NOT_RUNNING', 'التشغيل ليس قيد التنفيذ.');
        const manifest = manifestFor(run.agent_key);
        tx.agentKey = run.agent_key;
        const stepNo = (await tx.countSteps(tenantId, runId)) + 1;
        if (stepNo > Math.min(manifest.maxSteps, LIMITS.maxSteps)) {
          await tx.updateRun(tenantId, runId, { status: 'FAILED' }, 'RUNNING');
          return { status: 'FAILED', reason: 'AGENT_STEP_LIMIT', error: { status: 409, code: 'AGENT_STEP_LIMIT', message: 'بلغ التشغيل الحد الأقصى للخطوات؛ لم يُكمل.' } };
        }
        const decision = await evaluatePolicy(tx, identity, tenantId, { productSlug: manifest.product,
          operation: 'agent.step.' + input.kind, resource_type: 'agent-step' });
        if (!decision || decision.decision !== 'ALLOW') {
          const needsApproval = decision?.obligations?.includes('REQUEST_APPROVAL') === true;
          const step = await tx.appendStep({ tenantId, runId, stepNo, kind: 'POLICY', status: 'FAILED',
            summary: summarize('policy', needsApproval ? 'approval required' : 'denied'), policyVersion: run.policy_version,
            idempotencyKey: input.idempotencyKey, expiresAt: run.expires_at });
          await writeEvidence(tx, identity, tenantId, { runId, action: 'kernel.agent.policy.denied', correlationId: input.correlationId,
            idempotencyKey: 'policy:' + input.idempotencyKey, eventType: 'agent.policy.denied', causationId: step.id });
          if (needsApproval) {
            const checkpoint = await tx.checkpoint({ tenantId, runId, version: stepNo,
              stateRef: reference(tenantId, 'checkpoint', randomId()), approvalFingerprint: shortReference([runId, stepNo, input.correlationId]), expiresAt: run.expires_at });
            await tx.updateRun(tenantId, runId, { status: 'PAUSED' }, 'RUNNING');
            return { status: 'PAUSED', step_id: step.id, step_no: stepNo, reason: 'APPROVAL_REQUIRED',
              approval_fingerprint: checkpoint.approval_fingerprint, handoff: run.handoff ?? null };
          }
          await tx.updateRun(tenantId, runId, { status: 'FAILED' }, 'RUNNING');
          return { status: 'FAILED', reason: 'AGENT_POLICY_DENIED', step_id: step.id, step_no: stepNo,
            error: { status: 403, code: 'AGENT_POLICY_DENIED', message: 'منعت سياسة Kernel الخطوة؛ لم تُنفذ.' } };
        }
        const controller = new AbortController();
        controllers.set(runId, controller);
        let toolResult = null, toolRow = null;
        try {
          if (input.kind === 'TOOL') {
            const message = input.message;
            if (!message || typeof message !== 'object' || Array.isArray(message)) throw new KernelError(400, 'INVALID_TOOL_MESSAGE', 'رسالة الأداة مطلوبة.');
            const toolId = randomId();
            toolRow = await tx.appendTool({ id: toolId, tenantId, runId, stepId: null,
              toolName: message.tool ?? 'unknown', toolVersion: String(message.version ?? 0), argumentsRef: null,
              resultRef: null, status: 'PENDING', idempotencyKey: input.idempotencyKey,
              requestFingerprint: shortReference([runId, message, input.correlationId]), expiresAt: run.expires_at });
            toolResult = await executor.execute({ tx, identity, tenantId, agentKey: run.agent_key, toolId,
              message, signal: controller.signal, deadlineMs: Math.max(1000, Math.min(5000, new Date(run.expires_at).getTime() - now().getTime())) });
            await tx.updateTool(tenantId, toolId, { status: toolResult.status, resultRef: toolResult.result_ref }, 'PENDING');
            if (toolResult.outcome === 'NEEDS_APPROVAL') {
              const checkpoint = await tx.checkpoint({ tenantId, runId, version: stepNo,
                stateRef: reference(tenantId, 'checkpoint', randomId()), approvalFingerprint: shortReference([runId, toolId, input.correlationId]), expiresAt: run.expires_at });
              const step = await tx.appendStep({ tenantId, runId, stepNo, kind: 'HUMAN_GATE', status: 'DONE',
                summary: summarize('tool', 'approval required'), policyVersion: run.policy_version,
                idempotencyKey: 'hg:' + input.idempotencyKey, expiresAt: run.expires_at });
              await tx.updateRun(tenantId, runId, { status: 'PAUSED' }, 'RUNNING');
              return { status: 'PAUSED', step_id: step.id, step_no: stepNo, reason: 'APPROVAL_REQUIRED',
                approval_fingerprint: checkpoint.approval_fingerprint, tool: toolResult, handoff: run.handoff ?? null };
            }
          } else if (input.kind === 'HUMAN_GATE') {
            const checkpoint = await tx.checkpoint({ tenantId, runId, version: stepNo,
              stateRef: reference(tenantId, 'checkpoint', randomId()), approvalFingerprint: shortReference([runId, stepNo, input.correlationId]), expiresAt: run.expires_at });
            const step = await tx.appendStep({ tenantId, runId, stepNo, kind: 'HUMAN_GATE', status: 'DONE',
              summary: summarize('human-gate', 'paused'), policyVersion: run.policy_version,
              idempotencyKey: input.idempotencyKey, expiresAt: run.expires_at });
            await tx.updateRun(tenantId, runId, { status: 'PAUSED' }, 'RUNNING');
            return { status: 'PAUSED', step_id: step.id, step_no: stepNo, reason: 'APPROVAL_REQUIRED',
              approval_fingerprint: checkpoint.approval_fingerprint, handoff: run.handoff ?? null };
          }
          const failed = toolResult && ['FAILED','CANCELLED','DENIED'].includes(toolResult.status);
          const step = await tx.appendStep({ tenantId, runId, stepNo, kind: input.kind,
            status: failed ? 'FAILED' : 'DONE', summary: summarize(input.kind.toLowerCase(), toolResult ? toolResult.reason : input.note ?? 'recorded'),
            inputRef: reference(tenantId, 'run', runId), outputRef: toolResult?.result_ref ?? null,
            policyVersion: run.policy_version, idempotencyKey: input.idempotencyKey, expiresAt: run.expires_at });
          await writeEvidence(tx, identity, tenantId, { runId, action: 'kernel.agent.step.' + (failed ? 'failed' : 'completed'),
            correlationId: input.correlationId, idempotencyKey: 'step:' + input.idempotencyKey,
            eventType: failed ? 'agent.step.failed' : 'agent.step.completed', causationId: step.id });
          if (toolResult?.status === 'CANCELLED') await tx.updateRun(tenantId, runId, { status: 'CANCELLED' }, 'RUNNING');
          else if (['FAILED','DENIED'].includes(toolResult?.status)) await tx.updateRun(tenantId, runId, { status: 'FAILED' }, 'RUNNING');
          if (input.kind === 'RESULT' && !failed) await tx.updateRun(tenantId, runId, { status: 'COMPLETED' }, 'RUNNING');
          const handoff = buildHandoff({ runId, parentRunId: run.parent_run_id ?? null, parentStepId: step.id,
            tenantId, agentKey: run.agent_key, correlationId: input.correlationId,
            previousCorrelationId: run.correlation_id ?? null, createdAt: now().toISOString() });
          const finalStatus = ['CANCELLED','FAILED','DENIED'].includes(toolResult?.status) ? toolResult.status
            : input.kind === 'RESULT' ? 'COMPLETED' : 'RUNNING';
          return { status: finalStatus, step_id: step.id, step_no: stepNo,
            tool: toolResult, invocation_id: toolRow?.id ?? null, handoff };
        } finally {
          controllers.delete(runId);
        }
      });
      if (outcome?.error) throw new KernelError(outcome.error.status, outcome.error.code, outcome.error.message);
      return outcome;
    },
    async resume(identity, tenantId, runId, body) {
      const input = parse(approveSchema, body);
      if (!isUuid(identity?.userId) || !isUuid(tenantId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم سياق مؤسسة موثّق.');
      return store.transact(async tx => {
        const run = await load(tx, identity, tenantId, runId, 'agent.resume');
        if (run.status !== 'PAUSED') throw new KernelError(409, 'AGENT_NOT_PAUSED', 'التشغيل ليس متوقفًا لمراجعة بشرية.');
        tx.agentKey = run.agent_key;
        const stepNo = await tx.countSteps(tenantId, runId);
        const checkpoint = await tx.getCheckpoint(tenantId, runId, stepNo);
        if (!checkpoint) throw new KernelError(409, 'CHECKPOINT_MISSING', 'نقطة الاستئناف غير موجودة.');
        const approval = await verifyApproval(tx, identity, tenantId, { approvalRef: input.approvalRef, fingerprint: checkpoint.approval_fingerprint });
        if (approval.approved !== true) throw new KernelError(403, 'APPROVAL_NOT_VERIFIED', approval.reason ?? 'لم يتم التحقق من الاعتماد البشري.');
        const decision = await evaluatePolicy(tx, identity, tenantId, { productSlug: manifestFor(run.agent_key).product,
          operation: 'agent.resume', resource_type: 'agent-step' });
        if (!decision || decision.decision !== 'ALLOW' || decision.obligations?.length) throw new KernelError(403, 'AGENT_POLICY_DENIED', 'سياسة Kernel لا تسمح بالاستئناف.');
        await tx.updateRun(tenantId, runId, { status: 'RUNNING' }, 'PAUSED');
        await writeEvidence(tx, identity, tenantId, { runId, action: 'kernel.agent.run.resumed', correlationId: input.correlationId,
          idempotencyKey: 'resume:' + input.idempotencyKey, eventType: 'agent.run.resumed', causationId: input.approvalRef });
        const handoff = buildHandoff({ runId, parentRunId: run.parent_run_id ?? null, tenantId,
          agentKey: run.agent_key, correlationId: input.correlationId, approvalRef: input.approvalRef,
          previousCorrelationId: run.correlation_id ?? null, createdAt: now().toISOString() });
        return { status: 'RUNNING', step_no: stepNo, handoff };
      });
    },
    async cancel(identity, tenantId, runId, body) {
      const input = parse(cancelSchema, body);
      if (!isUuid(identity?.userId) || !isUuid(tenantId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم سياق مؤسسة موثّق.');
      abort(runId);
      return store.transact(async tx => {
        const run = await load(tx, identity, tenantId, runId, 'agent.cancel');
        if (!canTransition(RUN_TRANSITIONS, run.status, 'CANCELLED')) throw new KernelError(409, 'AGENT_TERMINAL', 'لا يمكن إلغاء تشغيل منتهٍ.');
        tx.agentKey = run.agent_key;
        await tx.updateRun(tenantId, runId, { status: 'CANCELLED' }, run.status);
        await writeEvidence(tx, identity, tenantId, { runId, action: 'kernel.agent.run.cancelled', correlationId: input.correlationId,
          idempotencyKey: 'cancel:' + input.idempotencyKey, eventType: 'agent.run.cancelled' });
        return { status: 'CANCELLED', run_id: runId, reason: input.reason };
      });
    },
    async get(identity, tenantId, runId) {
      if (!isUuid(identity?.userId) || !isUuid(tenantId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم سياق مؤسسة موثّق.');
      return store.transact(async tx => {
        const run = await load(tx, identity, tenantId, runId, 'agent.run.read');
        tx.agentKey = run.agent_key;
        const steps = await tx.countSteps(tenantId, runId);
        const outbox = (await tx.listOutbox(tenantId)).filter(event => event.aggregate_id === runId);
        return { ...publicRun(run), steps, outbox: outbox.map(event => ({ event_id: event.event_id, event_type: event.event_type,
          status: event.status, attempts: event.attempts })) };
      });
    },
    async retry(identity, tenantId, runId, body) {
      const input = parse(z.strictObject({ correlationId: z.uuidv4(), idempotencyKey: z.string().regex(keyPattern) }), body);
      if (!isUuid(identity?.userId) || !isUuid(tenantId)) throw new KernelError(401, 'UNAUTHORIZED', 'يلزم سياق مؤسسة موثّق.');
      return store.transact(async tx => {
        const run = await load(tx, identity, tenantId, runId, 'agent.outbox.retry');
        if (['COMPLETED','CANCELLED','EXPIRED'].includes(run.status)) throw new KernelError(409, 'AGENT_TERMINAL', 'لا يمكن إعادة إرسال أحداث تشغيل منتهٍ.');
        tx.agentKey = run.agent_key;
        let dispatched = 0, failed = 0, dead = 0;
        for (const event of (await tx.listOutbox(tenantId)).filter(item => item.aggregate_id === runId && ['PENDING','FAILED'].includes(item.status))) {
          const attempts = (event.attempts ?? 0) + 1;
          let outcome = 'FAILED';
          try {
            if (typeof dispatch !== 'function') throw new KernelError(503, 'DISPATCH_NOT_CONFIGURED', 'لا يوجد موصل إرسال مهيأ؛ لم يُؤكد الإرسال.');
            await dispatch(event);
            outcome = 'DISPATCHED';
          } catch { outcome = 'FAILED'; }
          const status = outcome === 'DISPATCHED' ? 'DISPATCHED' : attempts >= LIMITS.maxOutboxAttempts ? 'DEAD' : 'FAILED';
          if (status === 'DISPATCHED') dispatched += 1;
          else if (status === 'DEAD') dead += 1;
          else failed += 1;
          await tx.updateOutbox(tenantId, event.event_id, { status, attempts, nextAttemptAt: new Date(now().getTime() + 1000 * attempts) });
        }
        await appendEvidence(tx, identity, tenantId, { action: 'kernel.agent.outbox.retried', correlationId: input.correlationId,
          policyVersion: policyVersion(run.agent_key), idempotencyKey: 'retry:' + input.idempotencyKey });
        return { dispatched, failed, dead, remaining: failed };
      });
    },
  };
}
