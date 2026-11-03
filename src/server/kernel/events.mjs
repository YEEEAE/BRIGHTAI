// One internal envelope for product events that may be mirrored to Ledger.
//
// This is not an event bus and it adds no storage. It is the single validation
// point used by the existing `recordProductEvent` adapter so each product names
// its tenant, actor, correlation, decision reference, policy version, source,
// action and idempotency key in the same way.
//
// The browser never supplies this envelope: `tenantId` and `actorId` come from
// the verified membership scope and token, and the remaining values are chosen
// by server code. Metadata still uses the small per-source allowlist in
// `ledger/core.mjs`; no content, prompt or personal data is copied here.
import { KernelError, isUuid } from './core.mjs';
import { sourceTypes } from '../ledger/core.mjs';

export const EVENT_CONTRACT_VERSION = 'aigas-product-event-v1';

export const eventKinds = Object.freeze({ DECISION: 'DECISION', OBSERVATION: 'OBSERVATION', OUTCOME: 'OUTCOME' });

// `reference` names the metadata field that must carry the same UUID as
// `decisionId`. That is the stable, tenant-bound reference for one cycle: a
// decision, request, asset, assessment or audit record.
const definitions = Object.freeze({
  'firewall:firewall.decision.recorded': { action: 'DECISION_RECORDED', kind: eventKinds.DECISION, reference: 'decision_ref' },
  'human-gate:human_gate.request.created': { action: 'REQUEST_RECORDED', kind: eventKinds.OBSERVATION, reference: 'request_ref' },
  'human-gate:human_gate.decision.recorded': { action: 'DECISION_RECORDED', kind: eventKinds.DECISION, reference: 'decision_ref' },
  // An outcome may only be recorded after the effect happened inside the
  // same transaction. The caller must pass `outcomeConfirmed: true`.
  'human-gate:human_gate.demo_note.completed': { action: 'OUTCOME_RECORDED', kind: eventKinds.OUTCOME, reference: 'request_ref' },
  'risk-engine:risk_engine.asset.created': { action: 'ASSET_REGISTERED', kind: eventKinds.OBSERVATION, reference: 'asset_ref' },
  'risk-engine:risk_engine.asset.updated': { action: 'ASSET_UPDATED', kind: eventKinds.OBSERVATION, reference: 'asset_ref' },
  'risk-engine:risk_engine.assessment.created': { action: 'ASSESSMENT_RECORDED', kind: eventKinds.DECISION, reference: 'assessment_ref' },
  'kernel:kernel.audit.recorded': { action: 'AUDIT_RECORDED', kind: eventKinds.OBSERVATION, reference: 'audit_ref' },
});

const policyVersionPattern = /^[a-zA-Z0-9_.:-]{1,120}$/;
const idempotencyKeyPattern = /^[a-zA-Z0-9_.:-]{1,180}$/;

export function eventDefinition(source, eventType) {
  const definition = definitions[`${source}:${eventType}`];
  // The Ledger allowlist remains authoritative: a definition here can never
  // introduce a source/type pair the writer would reject.
  if (!definition || !sourceTypes[source]?.includes(eventType)) throw new KernelError(403, 'UNTRUSTED_EVENT', 'مصدر الحدث غير مخوّل.');
  return definition;
}

export function eventSupported(source, eventType) {
  return !!definitions[`${source}:${eventType}`] && !!sourceTypes[source]?.includes(eventType);
}

export function buildProductEvent({ identity, tenantId, source, eventType, correlationId, decisionId, policyVersion, idempotencyKey, outcomeConfirmed = false, metadata = null } = {}) {
  const definition = eventDefinition(source, eventType);
  if (!isUuid(tenantId) || !isUuid(identity?.userId)) throw new KernelError(503, 'EVENT_CONTEXT_UNAVAILABLE', 'تعذر تأكيد نطاق المؤسسة أو الفاعل؛ لم يُسجّل الحدث.');
  if (!isUuid(correlationId)) throw new KernelError(400, 'INVALID_EVENT_CONTEXT', 'مرجع التتبع المطلوب غير صالح؛ لم يُسجّل الحدث.');
  if (!isUuid(decisionId)) throw new KernelError(400, 'INVALID_EVENT_CONTEXT', 'مرجع القرار أو الكيان غير صالح؛ لم يُسجّل الحدث.');
  if (typeof policyVersion !== 'string' || !policyVersionPattern.test(policyVersion)) throw new KernelError(400, 'INVALID_EVENT_CONTEXT', 'نسخة السياسة غير صالحة؛ لم يُسجّل الحدث.');
  if (typeof idempotencyKey !== 'string' || !idempotencyKeyPattern.test(idempotencyKey)) throw new KernelError(400, 'INVALID_EVENT_CONTEXT', 'مفتاح منع التكرار غير صالح؛ لم يُسجّل الحدث.');
  if (definition.kind === eventKinds.OUTCOME && outcomeConfirmed !== true) {
    throw new KernelError(409, 'OUTCOME_NOT_CONFIRMED', 'لا يمكن تسجيل نتيجة قبل تأكيد وقوع الأثر داخل المعاملة؛ لم يُسجّل الحدث.');
  }
  // When the persisted metadata carries the reference field, it must be the
  // same reference. This blocks a caller from attaching one decision's outcome
  // to another decision or to a replayed identifier.
  if (metadata && Object.hasOwn(metadata, definition.reference) && metadata[definition.reference] !== decisionId) {
    throw new KernelError(409, 'EVENT_REFERENCE_MISMATCH', 'مرجع الحدث لا يطابق القرار أو الكيان المذكور؛ لم يُسجّل الحدث.');
  }
  return Object.freeze({
    contract: EVENT_CONTRACT_VERSION,
    tenantId,
    actorId: identity.userId,
    correlationId,
    decisionId,
    policyVersion,
    source,
    action: definition.action,
    kind: definition.kind,
    eventType,
    idempotencyKey,
  });
}

// The subset accepted by the existing Ledger writer. No envelope field is
// persisted beyond the current schema, so adding the contract needs no table.
export function eventLedgerFields(envelope) {
  return {
    source: envelope.source,
    event_type: envelope.eventType,
    policy_version: envelope.policyVersion,
    idempotency_key: envelope.idempotencyKey,
  };
}

// Safe outward projection for diagnostics, without metadata or content.
export function publicEventEnvelope(envelope) {
  return {
    contract: envelope.contract,
    source: envelope.source,
    action: envelope.action,
    kind: envelope.kind,
    eventType: envelope.eventType,
    correlationId: envelope.correlationId,
    decisionId: envelope.decisionId,
    policyVersion: envelope.policyVersion,
    idempotencyKey: envelope.idempotencyKey,
  };
}
