import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createMemoryStore } from '../src/server/agents/repository.mjs';
import { createAgentRuntime } from '../src/server/agents/runtime.mjs';
import { createOrchestrator } from '../src/server/agents/orchestrator.mjs';
import { createToolExecutor } from '../src/server/agents/tool-executor.mjs';
import {
  RUN_TRANSITIONS, STEP_TRANSITIONS, canTransition, buildHandoff, handoffAllowed,
  agentVersion, policyVersion, outboxEvent, reference, LIMITS, manifestFor, isUuid,
} from '../src/server/agents/contracts.mjs';
import { KernelError } from '../src/server/kernel/core.mjs';

const tenant = randomUUID(), actor = randomUUID(), actor2 = randomUUID();
const identity = { userId: actor };
const correlation = () => randomUUID();
const allow = async () => ({ decision: 'ALLOW', reason: 'POLICY_ALLOW', obligations: [] });
const evidenceLog = () => {
  const rows = [];
  return { rows, fn: async (_tx, _id, _tenant, input) => { rows.push(input); return { auditId: randomUUID(), recorded: true, dependencyStatus: null }; } };
};
function harness({ tools = {}, policy = allow, approval = async () => ({ approved: true, reason: 'APPROVAL_VERIFIED' }), dispatch = null, revoked = new Set(), evidence = evidenceLog() } = {}) {
  const store = createMemoryStore();
  const authorize = async (_tx, _identity, _tenant, product, operation) => {
    if (revoked.has(product)) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', 'إتاحة المنتج غير سارية.');
    return { role: 'OWNER', product, operation };
  };
  const runtime = createAgentRuntime({ store, tools, authorize, evaluatePolicy: policy, appendEvidence: evidence.fn, verifyApproval: approval, dispatch });
  return { store, runtime, evidence, authorize };
}
const startBody = (overrides = {}) => ({ agentKey: 'firewall-agent', objective: 'تقييم نص اصطناعي داخل المؤسسة', synthetic: true,
  correlationId: correlation(), idempotencyKey: 'run-' + randomUUID(), ...overrides });
const toolMessage = (overrides = {}) => ({ tool: 'policy-check', action: 'evaluate', resource: 'kernel:policy:synthetic',
  capability: 'kernel.policy.evaluate', version: 1, arguments: { scenario: 'synthetic' }, ...overrides });

test('state tables refuse skipped, repeated and reverse transitions', () => {
  assert.equal(canTransition(RUN_TRANSITIONS, 'QUEUED', 'RUNNING'), true);
  assert.equal(canTransition(RUN_TRANSITIONS, 'RUNNING', 'COMPLETED'), true);
  assert.equal(canTransition(RUN_TRANSITIONS, 'COMPLETED', 'RUNNING'), false);
  for (const from of ['COMPLETED','FAILED','CANCELLED','EXPIRED']) assert.deepEqual(RUN_TRANSITIONS[from], []);
  assert.equal(canTransition(STEP_TRANSITIONS, 'PENDING', 'DONE'), false);
});

test('handoff binds tenant, agent and versions and rejects foreign or stale context', () => {
  const runId = randomUUID(), corr = correlation();
  const handoff = buildHandoff({ runId, tenantId: tenant, agentKey: 'firewall-agent', correlationId: corr });
  assert.equal(handoffAllowed(handoff, tenant, { requiredAgentKey: 'firewall-agent' }), true);
  assert.equal(handoffAllowed(handoff, randomUUID()), false);
  assert.equal(handoffAllowed(handoff, tenant, { requiredAgentKey: 'ledger-agent' }), false);
  assert.equal(handoffAllowed(handoff, tenant, { revoked: true }), false);
  assert.equal(handoffAllowed({ ...handoff, policy_version: 'stale' }, tenant), false);
  assert.equal(handoffAllowed({ ...handoff, correlation_id: randomUUID() }, tenant), false);
  assert.equal(Object.values(handoff).some(value => typeof value === 'string' && value.includes('password')), false);
  assert.match(agentVersion('firewall-agent'), /^1.0.0:/);
  assert.match(policyVersion('firewall-agent'), /^kernel-policy-v1:/);
});

test('outbox events require tenant-owned opaque references and valid aggregate names', () => {
  const runId = randomUUID(), corr = correlation();
  const event = outboxEvent({ tenantId: tenant, aggregateType: 'AGENT_RUN', aggregateId: runId, eventType: 'agent.run.started',
    correlationId: corr, payloadRef: reference(tenant, 'run', runId), idempotencyKey: 'run:key-1' });
  assert.equal(event.tenant_id, tenant);
  assert.equal(outboxEvent({ tenantId: tenant, aggregateType: 'ARBITRARY', aggregateId: runId, eventType: 'x', correlationId: corr,
    payloadRef: reference(tenant, 'run', runId), idempotencyKey: 'k' }), null);
  assert.equal(outboxEvent({ tenantId: tenant, aggregateType: 'AGENT_RUN', aggregateId: runId, eventType: 'agent.run.started',
    correlationId: corr, payloadRef: reference(randomUUID(), 'run', runId), idempotencyKey: 'k' }), null);
});

test('start is idempotent, derives tenant from the session and records atomic evidence', async () => {
  const { runtime, store, evidence } = harness();
  const body = startBody();
  const first = await runtime.start(identity, tenant, body);
  assert.equal(first.status, 'RUNNING');
  assert.equal(first.tenant_id, tenant);
  assert.equal(first.handoff.tenant_id, tenant);
  const replay = await runtime.start(identity, tenant, body);
  assert.equal(replay.run_id, first.run_id);
  assert.equal(replay.replayed, true);
  assert.equal(evidence.rows.length, 1);
  assert.equal([...store.inspect().outbox.values()].filter(row => row?.event_id && row?.idempotency_key).length, 1);
  await assert.rejects(runtime.start(identity, tenant, { ...body, objective: 'مختلف تمامًا عن الطلب الأول' }), { code: 'AGENT_IDEMPOTENCY_CONFLICT' });
  const tenantBound = createAgentRuntime({ store: createMemoryStore(), authorize: async (_tx, _identity, selected) => {
    if (selected !== tenant) throw new KernelError(403, 'TENANT_MISMATCH', 'مؤسسة غير مسموحة.');
    return { role: 'OWNER' };
  }, evaluatePolicy: allow, appendEvidence: evidenceLog().fn });
  await assert.rejects(tenantBound.start(identity, randomUUID(), body), { status: 403 });
  await assert.rejects(runtime.start(identity, tenant, { ...body, synthetic: false }), { status: 400 });
});

test('an evidence failure rolls back the run and its outbox event', async () => {
  const store = createMemoryStore();
  const runtime = createAgentRuntime({ store, authorize: async () => ({}), evaluatePolicy: allow,
    appendEvidence: async () => { throw new KernelError(503, 'EVIDENCE_UNAVAILABLE', 'تعذر حفظ الدليل.'); } });
  await assert.rejects(runtime.start(identity, tenant, startBody()), { code: 'EVIDENCE_UNAVAILABLE' });
  assert.equal(store.inspect().runs.size, 0);
  assert.equal(store.inspect().outbox.size, 0);
});

test('steps re-check policy, enforce the tool allowlist and never persist arguments', async () => {
  let calls = 0;
  const policy = async () => { calls += 1; return { decision: 'ALLOW', reason: 'POLICY_ALLOW', obligations: [] }; };
  const tools = { 'policy-check': async ({ message }) => ({ outcome: 'ALLOW', summary: 'readiness verified', data: { hidden: 'secret-value' } }) };
  const { runtime, store } = harness({ tools, policy });
  const run = await runtime.start(identity, tenant, startBody());
  const firstCalls = calls;
  const result = await runtime.step(identity, tenant, run.run_id, { kind: 'TOOL', message: toolMessage(), correlationId: correlation(), idempotencyKey: 'step-1' });
  assert.equal(result.status, 'RUNNING');
  assert.equal(result.tool.status, 'EXECUTED');
  assert.ok(calls - firstCalls >= 3, 'step, pre and post policy checks must re-evaluate');
  const persisted = JSON.stringify(store.inspect());
  assert.equal(persisted.includes('secret-value'), false);
  assert.equal(persisted.includes('scenario'), false);
  const denied = await runtime.step(identity, tenant, run.run_id, { kind: 'TOOL',
    message: toolMessage({ tool: 'unlisted-tool', capability: 'kernel.policy.evaluate' }), correlationId: correlation(), idempotencyKey: 'step-2' });
  assert.equal(denied.tool.status, 'DENIED');
  assert.equal(denied.tool.reason, 'TOOL_NOT_ALLOWED');
});

test('provider outage fails the step and the run without a simulated success', async () => {
  const tools = { 'policy-check': async () => { throw new Error('provider unreachable'); } };
  const { runtime } = harness({ tools });
  const run = await runtime.start(identity, tenant, startBody());
  const result = await runtime.step(identity, tenant, run.run_id, { kind: 'TOOL', message: toolMessage(), correlationId: correlation(), idempotencyKey: 'outage' });
  assert.equal(result.tool.status, 'FAILED');
  assert.equal(result.tool.outcome, 'UNAVAILABLE');
  assert.equal(result.status, 'FAILED');
  const view = await runtime.get(identity, tenant, run.run_id);
  assert.equal(view.status, 'FAILED');
});

test('a denied policy step is recorded as evidence and a REQUEST_APPROVAL obligation pauses the run', async () => {
  let decision = { decision: 'BLOCK', reason: 'BLOCK', obligations: [] };
  const { runtime, store } = harness({ policy: async () => decision });
  const run = await runtime.start(identity, tenant, startBody());
  await assert.rejects(runtime.step(identity, tenant, run.run_id, { kind: 'PLAN', note: 'مسودة خطة', correlationId: correlation(), idempotencyKey: 'deny' }), { code: 'AGENT_POLICY_DENIED' });
  assert.equal((await runtime.get(identity, tenant, run.run_id)).status, 'FAILED');
  decision = { decision: 'BLOCK', reason: 'REQUEST_APPROVAL', obligations: ['REQUEST_APPROVAL'] };
  const pausedRun = await runtime.start(identity, tenant, startBody({ idempotencyKey: 'pause-run' }));
  const paused = await runtime.step(identity, tenant, pausedRun.run_id, { kind: 'PLAN', note: 'مراجعة مطلوبة', correlationId: correlation(), idempotencyKey: 'pause-step' });
  assert.equal(paused.status, 'PAUSED');
  assert.ok(paused.approval_fingerprint);
  assert.equal(store.inspect().checkpoints.size, 1);
});

test('pause and resume require a verified Human Gate approval bound to the checkpoint', async () => {
  let approved = false;
  const { runtime } = harness({ policy: async () => ({ decision: 'BLOCK', reason: 'REQUEST_APPROVAL', obligations: ['REQUEST_APPROVAL'] }),
    approval: async () => approved ? { approved: true, reason: 'APPROVAL_VERIFIED' } : { approved: false, reason: 'APPROVAL_NOT_ACTIVE' } });
  const run = await runtime.start(identity, tenant, startBody());
  await runtime.step(identity, tenant, run.run_id, { kind: 'HUMAN_GATE', correlationId: correlation(), idempotencyKey: 'hg-1' });
  const resumeBody = () => ({ approvalRef: randomUUID(), correlationId: correlation(), idempotencyKey: 'resume-' + randomUUID() });
  await assert.rejects(runtime.resume(identity, tenant, run.run_id, resumeBody()), { code: 'APPROVAL_NOT_VERIFIED' });
  approved = true;
  const resumed = await runtime.resume(identity, tenant, run.run_id, resumeBody());
  assert.equal(resumed.status, 'RUNNING');
  assert.equal(isUuid(resumed.handoff.approval_ref), true);
  await assert.rejects(runtime.resume(identity, tenant, run.run_id, resumeBody()), { code: 'AGENT_NOT_PAUSED' });
});

test('cancel stops a run, refuses further steps and is recorded as terminal', async () => {
  const { runtime } = harness();
  const run = await runtime.start(identity, tenant, startBody());
  const cancelled = await runtime.cancel(identity, tenant, run.run_id, { reason: 'CANCELLED_BY_REQUESTER', correlationId: correlation(), idempotencyKey: 'cancel-1' });
  assert.equal(cancelled.status, 'CANCELLED');
  await assert.rejects(runtime.step(identity, tenant, run.run_id, { kind: 'PLAN', note: 'بعد الإلغاء', correlationId: correlation(), idempotencyKey: 'after-cancel' }), { code: 'AGENT_NOT_RUNNING' });
  await assert.rejects(runtime.cancel(identity, tenant, run.run_id, { reason: 'CANCELLED_BY_REQUESTER', correlationId: correlation(), idempotencyKey: 'cancel-2' }), { code: 'AGENT_TERMINAL' });
});

test('bounded steps and deadline stop a run with explicit statuses', async () => {
  const { runtime } = harness();
  const run = await runtime.start(identity, tenant, startBody({ idempotencyKey: 'bounded' }));
  for (let i = 0; i < 11; i += 1) await runtime.step(identity, tenant, run.run_id, { kind: 'PLAN', note: 'خطوة ضمن الحد', correlationId: correlation(), idempotencyKey: 'plan-' + i });
  const result = await runtime.step(identity, tenant, run.run_id, { kind: 'RESULT', note: 'إغلاق', correlationId: correlation(), idempotencyKey: 'result-1' });
  assert.equal(result.status, 'COMPLETED');
  const view = await runtime.get(identity, tenant, run.run_id);
  assert.equal(view.status, 'COMPLETED');
  const expiredStore = createMemoryStore();
  const expiredRuntime = createAgentRuntime({ store: expiredStore, authorize: async () => ({}), evaluatePolicy: allow, appendEvidence: evidenceLog().fn });
  const expiring = await expiredRuntime.start(identity, tenant, startBody({ idempotencyKey: 'expiring', deadlineMs: 1000 }));
  assert.ok(Date.parse(expiring.expires_at) - Date.now() <= 1000);
  await assert.rejects(expiredRuntime.start(identity, tenant, startBody({ idempotencyKey: 'too-long', deadlineMs: 99999999 })), { status: 400 });
});

test('outbox retry is bounded and reports undispatched events as failures', async () => {
  const { runtime } = harness();
  const run = await runtime.start(identity, tenant, startBody());
  const body = () => ({ correlationId: correlation(), idempotencyKey: 'retry-' + randomUUID() });
  const first = await runtime.retry(identity, tenant, run.run_id, body());
  assert.equal(first.dispatched, 0);
  assert.equal(first.failed, 1);
  const view = await runtime.get(identity, tenant, run.run_id);
  assert.equal(view.outbox[0].attempts, 1);
  let attempts = 0;
  const retryHarness = harness({ dispatch: async () => { attempts += 1; if (attempts === 1) throw new Error('dispatcher down'); } });
  const secondRun = await retryHarness.runtime.start(identity, tenant, startBody({ idempotencyKey: 'retry-dispatch' }));
  const b = () => ({ correlationId: correlation(), idempotencyKey: 'retry-d-' + randomUUID() });
  assert.deepEqual(await retryHarness.runtime.retry(identity, tenant, secondRun.run_id, b()), { dispatched: 0, failed: 1, dead: 0, remaining: 1 });
  assert.deepEqual(await retryHarness.runtime.retry(identity, tenant, secondRun.run_id, b()), { dispatched: 1, failed: 0, dead: 0, remaining: 0 });
});

test('revoked entitlement fails every later operation', async () => {
  const revoked = new Set();
  const { runtime } = harness({ revoked });
  const run = await runtime.start(identity, tenant, startBody());
  revoked.add('firewall');
  await assert.rejects(runtime.step(identity, tenant, run.run_id, { kind: 'PLAN', note: 'بعد سحب الإتاحة', correlationId: correlation(), idempotencyKey: 'revoked' }), { status: 403 });
  await assert.rejects(runtime.cancel(identity, tenant, run.run_id, { reason: 'CANCELLED_BY_REQUESTER', correlationId: correlation(), idempotencyKey: 'revoked-cancel' }), { status: 403 });
});

test('orchestrator checks each product separately and carries tenant-bound handoffs', async () => {
  const revoked = new Set(['ledger']);
  const { runtime, store } = harness({ revoked });
  const orchestrator = createOrchestrator({ runtime, authorize: async (_tx, _identity, _tenant, product) => {
    if (revoked.has(product)) throw new KernelError(403, 'PRODUCT_NOT_ENABLED', 'منتج غير مسموح.');
    return { role: 'OWNER' };
  } });
  const body = { plan: [
    { agentKey: 'firewall-agent', objective: 'مراجعة سياسة اصطناعية' },
    { agentKey: 'ledger-agent', objective: 'قراءة سجل اصطناعي' },
    { agentKey: 'risk-engine-agent', objective: 'تقييم اصطناعي' },
  ], correlationId: correlation(), idempotencyKey: 'orchestration-1' };
  const result = await orchestrator.execute(identity, tenant, body);
  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.runs.length, 2);
  assert.equal(result.runs[0].status, 'COMPLETED');
  assert.equal(result.runs[1].status, 'DENIED');
  assert.equal(result.runs[0].handoff.tenant_id, tenant);
  assert.equal(result.runs[0].handoff.agent_key, 'firewall-agent');
  assert.equal([...store.inspect().runs.values()].filter(row => row?.id && row?.status).length, 1);
  revoked.clear();
  const full = await orchestrator.execute(identity, tenant, { ...body, idempotencyKey: 'orchestration-2' });
  assert.equal(full.status, 'COMPLETED');
  assert.equal(full.runs.length, 3);
  assert.equal(full.runs.every(item => item.handoff.tenant_id === tenant), true);
  await assert.rejects(orchestrator.execute(identity, 'not-a-uuid', { ...body, idempotencyKey: 'orchestration-3' }), { status: 401 });
});

test('tool executor rejects malformed messages, unknown capabilities and oversized results', async () => {
  const { runtime } = harness({ tools: { 'policy-check': async () => ({ outcome: 'ALLOW', summary: 'ok', data: { x: 'y'.repeat(9000) } }) } });
  const executor = createToolExecutor({ tools: { 'policy-check': async () => ({ outcome: 'ALLOW', summary: 'ok' }) }, evaluatePolicy: allow });
  await assert.rejects(executor.execute({ tx: {}, identity, tenantId: tenant, agentKey: 'firewall-agent', toolId: randomUUID(), message: { tool: 42 } }), { code: 'INVALID_TOOL_MESSAGE' });
  const denied = await executor.execute({ tx: {}, identity, tenantId: tenant, agentKey: 'firewall-agent', toolId: randomUUID(),
    message: toolMessage({ capability: 'unknown.capability' }) });
  assert.equal(denied.reason, 'TOOL_NOT_ALLOWED');
  assert.ok(runtime.schemas.message.safeParse(toolMessage()).success);
  assert.equal(runtime.schemas.message.safeParse({ ...toolMessage(), extra: true }).success, false);
  assert.equal(manifestFor('unknown-agent'), null);
});
