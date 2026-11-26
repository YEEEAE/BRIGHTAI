// P03 — AIGAS agent runtime contract. Every state, version and handoff field
// here is server-owned. No prompt, token, secret or cross-tenant context is part
// of this module or of any persisted artifact it describes.
import { createHash } from 'node:crypto';

export const RUNTIME_VERSION = 'aigas-agent-v1';
export const HANDOFF_VERSION = 'aigas-handoff-v1';
export const POLICY_EVALUATION_VERSION = 'kernel-policy-v1';
export const OUTBOX_SCHEMA_VERSION = 1;

export const RUN_STATUSES = Object.freeze(['QUEUED','RUNNING','PAUSED','COMPLETED','FAILED','CANCELLED','EXPIRED']);
export const STEP_STATUSES = Object.freeze(['PENDING','RUNNING','DONE','FAILED','CANCELLED']);
export const TOOL_STATUSES = Object.freeze(['PENDING','ALLOWED','DENIED','EXECUTED','FAILED','CANCELLED']);
export const STEP_KINDS = Object.freeze(['PLAN','TOOL','POLICY','HUMAN_GATE','RESULT']);

// Explicit transitions. Anything not listed is rejected; a state is never
// inferred from a body field or a stored value that failed a version check.
export const RUN_TRANSITIONS = Object.freeze({
  QUEUED: ['RUNNING','CANCELLED','EXPIRED','FAILED'],
  RUNNING: ['PAUSED','COMPLETED','FAILED','CANCELLED','EXPIRED'],
  PAUSED: ['RUNNING','CANCELLED','EXPIRED','FAILED'],
  COMPLETED: [], FAILED: [], CANCELLED: [], EXPIRED: [],
});
export const STEP_TRANSITIONS = Object.freeze({
  PENDING: ['RUNNING','CANCELLED'],
  RUNNING: ['DONE','FAILED','CANCELLED'],
  DONE: [], FAILED: [], CANCELLED: [],
});
export const TOOL_TRANSITIONS = Object.freeze({
  PENDING: ['ALLOWED','DENIED','CANCELLED'],
  ALLOWED: ['EXECUTED','FAILED','CANCELLED'],
  DENIED: [], EXECUTED: [], FAILED: [], CANCELLED: [],
});
export const canTransition = (table, from, to) => (table[from] ?? []).includes(to);

// Bounded execution. These are technical ceilings, not a commercial quota or
// an SLA. A run that reaches any ceiling terminates with an explicit status.
export const LIMITS = Object.freeze({
  maxSteps: 25,
  maxToolsPerStep: 4,
  maxAgentsPerPlan: 5,
  maxDeadlineMs: 15 * 60 * 1000,
  minDeadlineMs: 1000,
  maxArgumentsBytes: 4096,
  maxResultBytes: 8192,
  maxSummaryChars: 500,
  maxInputChars: 20000,
  maxOutboxAttempts: 3,
});

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const keyPattern = /^[a-z][a-z0-9-]{1,63}$/;
const versionPattern = /^[a-zA-Z0-9_.:-]{1,64}$/;
export const isUuid = value => typeof value === 'string' && idPattern.test(value);
export const isKey = value => typeof value === 'string' && keyPattern.test(value);
export const isVersion = value => typeof value === 'string' && versionPattern.test(value);

// One product per agent. An agent cannot inherit another product's entitlement:
// the orchestrator checks each manifest separately before it creates a handoff.
export const PRODUCTS = Object.freeze(['firewall','ledger','human-gate','risk-engine','secure-chat']);
const tool = (name, capability, actions, resources) => Object.freeze({ name, version: '1', capability, actions: Object.freeze(actions), resources: Object.freeze(resources) });
export const TOOLS = Object.freeze([
  tool('policy-check','kernel.policy.evaluate',['evaluate'],['kernel:policy']),
  tool('evidence-append','kernel.evidence.append',['append'],['kernel:evidence']),
  tool('memory-read','kernel.context.read',['read'],['kernel:memory']),
  tool('firewall-evaluate','firewall.text.evaluate',['evaluate'],['firewall:text']),
  ...['inspect_input','read_policy','classify','recommend_redaction','explain_decision'].map(name =>
    tool(name, 'firewall.agent.'+name.replaceAll('_','-'), ['evaluate'], ['firewall:agent'])),
  tool('ledger-verify','ledger.chain.verify',['verify'],['ledger:chain']),
  tool('risk-assist','risk.engine.assist',['assist'],['risk-engine:assist']),
  tool('human-gate-status','human.gate.status',['read'],['human-gate:request']),
  tool('secure-chat-ready','secure.chat.readiness',['read'],['secure-chat:model']),
]);

const manifest = (product, tools, maxSteps) => Object.freeze({
  product, agent_key: product + '-agent', version: '1.0.0', tools: Object.freeze(tools), maxSteps,
});
export const CAPABILITIES = Object.freeze([
  manifest('firewall', ['policy-check','evidence-append','firewall-evaluate','inspect_input','read_policy','classify','recommend_redaction','explain_decision'], 12),
  manifest('ledger', ['policy-check','evidence-append','memory-read','ledger-verify'], 10),
  manifest('human-gate', ['policy-check','evidence-append','human-gate-status'], 8),
  manifest('risk-engine', ['policy-check','evidence-append','risk-assist'], 10),
  manifest('secure-chat', ['policy-check','evidence-append','secure-chat-ready'], 10),
]);
export const manifestFor = agentKey => CAPABILITIES.find(item => item.agent_key === agentKey) ?? null;
export const manifestForProduct = product => CAPABILITIES.find(item => item.product === product) ?? null;
export const toolFor = name => TOOLS.find(item => item.name === name) ?? null;

// A version reference is derived from server-owned literals only. It never
// contains content, an identity, a tenant or a provider key.
export function agentVersion(agentKey) {
  const manifest = manifestFor(agentKey);
  if (!manifest) return null;
  const digest = createHash('sha256').update(JSON.stringify([RUNTIME_VERSION, manifest])).digest('hex').slice(0, 16);
  return manifest.version + ':' + digest;
}
export function policyVersion(agentKey) {
  const version = agentVersion(agentKey);
  if (!version) return null;
  const digest = createHash('sha256').update(JSON.stringify([POLICY_EVALUATION_VERSION, version])).digest('hex').slice(0, 16);
  return POLICY_EVALUATION_VERSION + ':' + digest;
}
export function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function shortReference(value) {
  return fingerprint(value).slice(0, 32);
}

// Opaque references are stored, never payloads. A reference naming another
// tenant's run or step is rejected at construction, not at read time.
export const reference = (tenantId, kind, id) => {
  if (!isUuid(tenantId) || !isUuid(id) || !['run','step','tool','checkpoint','evidence','memory'].includes(kind)) return null;
  return 'aigas://' + tenantId + '/' + kind + '/' + id;
};
export function referenceTenant(value) {
  if (typeof value !== 'string') return null;
  const match = /^aigas:\/\/([0-9a-f-]{36})\/(?:run|step|tool|checkpoint|evidence|memory)\/([0-9a-f-]{36})$/i.exec(value);
  return match && isUuid(match[1]) && isUuid(match[2]) ? match[1] : null;
}

// Every handoff carries lineage and versioning, and no content. The approval
// reference is a Human Gate identifier, never a token or a secret.
export function buildHandoff({ runId, parentRunId = null, parentStepId = null, tenantId, agentKey, correlationId, previousCorrelationId = null, approvalRef = null, createdAt = null }) {
  const version = agentVersion(agentKey), policy = policyVersion(agentKey);
  if (!version || !policy || !isUuid(runId) || !isUuid(tenantId) || !isUuid(correlationId)
    || (parentRunId !== null && !isUuid(parentRunId)) || (parentStepId !== null && !isUuid(parentStepId))
    || (approvalRef !== null && !isUuid(approvalRef))) return null;
  return Object.freeze({
    handoff_version: HANDOFF_VERSION, handoff_id: fingerprint([runId, parentStepId ?? parentRunId, correlationId]),
    run_id: runId, parent_run_id: parentRunId, parent_step_id: parentStepId,
    tenant_id: tenantId, agent_key: agentKey, agent_version: version, policy_version: policy,
    correlation_id: correlationId, previous_correlation_id: previousCorrelationId,
    approval_ref: approvalRef, created_at: createdAt ?? new Date().toISOString(),
  });
}
export function handoffAllowed(handoff, tenantId, { revoked = false, requiredAgentKey = null } = {}) {
  const keys = ['handoff_version','handoff_id','run_id','tenant_id','agent_key','agent_version','policy_version','correlation_id'];
  if (!handoff || typeof handoff !== 'object' || Array.isArray(handoff)) return false;
  if (keys.some(key => typeof handoff[key] !== 'string' || !handoff[key])) return false;
  if (revoked === true || handoff.revoked === true) return false;
  if (handoff.tenant_id !== tenantId || !isUuid(tenantId)) return false;
  if (handoff.agent_key !== requiredAgentKey && requiredAgentKey !== null) return false;
  if (handoff.agent_version !== agentVersion(handoff.agent_key) || handoff.policy_version !== policyVersion(handoff.agent_key)) return false;
  if (!isUuid(handoff.correlation_id)) return false;
  if (handoff.parent_step_id !== undefined && handoff.parent_step_id !== null && !isUuid(handoff.parent_step_id)) return false;
  if (handoff.handoff_id !== fingerprint([handoff.run_id, handoff.parent_step_id ?? handoff.parent_run_id, handoff.correlation_id])) return false;
  return true;
}
export function outboxEvent({ tenantId, aggregateType, aggregateId, eventType, correlationId, causationId = null, payloadRef, idempotencyKey }) {
  const aggregates = ['AGENT_RUN','AGENT_STEP','TOOL_INVOCATION','BUDGET','MEMORY'];
  if (!isUuid(tenantId) || !aggregates.includes(aggregateType) || !isUuid(aggregateId)
    || typeof eventType !== 'string' || !/^[a-z][a-z0-9.-]{1,63}$/.test(eventType)
    || !isUuid(correlationId) || (causationId !== null && !isUuid(causationId))
    || referenceTenant(payloadRef) !== tenantId || typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(idempotencyKey)) return null;
  return Object.freeze({
    event_id: fingerprint(['outbox', tenantId, idempotencyKey]), tenant_id: tenantId,
    aggregate_type: aggregateType, aggregate_id: aggregateId, event_type: eventType,
    schema_version: OUTBOX_SCHEMA_VERSION, correlation_id: correlationId, causation_id: causationId,
    payload_ref: payloadRef, idempotency_key: idempotencyKey,
  });
}
