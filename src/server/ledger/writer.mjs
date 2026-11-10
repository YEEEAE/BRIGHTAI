import { randomUUID } from 'node:crypto';
import { assertTenantMembership, productGrants } from '../kernel/access.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { buildProductEvent, eventDefinition, eventLedgerFields, publicEventEnvelope } from '../kernel/events.mjs';
import { dependencyClasses } from '../kernel/contracts.mjs';
import { profile, metadata, hashEvent, verifyEvent, sourceTypes, uuid } from './core.mjs';

export const columns = 'event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,hash_profile,sequence_no,previous_hash,idempotency_key,integrity_hash';

// Internal only. Call within the originating product's transaction after its guard.
// There is deliberately no HTTP ingestion endpoint accepting source/actor/tenant.
export async function appendEvent(db, identity, tenantId, input) {
  if (!uuid(identity?.userId) || !uuid(tenantId) || !sourceTypes[input.source]?.includes(input.event_type)) throw new KernelError(403,'UNTRUSTED_EVENT','مصدر الحدث غير مخوّل.');
  // Actor, tenant and source are bound by the calling service; nothing here is
  // accepted from a request body. Reject malformed envelope values early so a
  // database constraint never has to absorb them silently.
  if (typeof input.policy_version!=='string' || !/^[a-zA-Z0-9_.:-]{1,120}$/.test(input.policy_version) || typeof input.idempotency_key!=='string' || !/^[a-zA-Z0-9_.:-]{1,180}$/.test(input.idempotency_key)) throw new KernelError(400,'INVALID_EVENT','مرجع العملية أو نسخة السياسة غير صالح.');
  const member = (await db.query('SELECT role FROM public.aigas_lock_member($1,$2)',[tenantId,identity.userId])).rows[0];
  requireRole(member,['OWNER','ADMIN','MEMBER']);
// All appends in this implementation serialize per tenant until COMMIT. The
// transaction-scoped lock covers tail read, sequence increment, idempotency
// lookup and insert, so two concurrent writers cannot fork the sequence.
// hash_profile is the chain version recorded on every row.
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended('ledger:' || $1,0))",[tenantId]);
  const event = {event_id:randomUUID(),tenant_id:tenantId,source:input.source,event_type:input.event_type,policy_version:input.policy_version,metadata_json:metadata(input.metadata_json,input.source,input.event_type),created_by:identity.userId,hash_profile:profile,idempotency_key:input.idempotency_key};
  const existing = (await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND source=$2 AND idempotency_key=$3`,[tenantId,event.source,event.idempotency_key])).rows[0];
  if (existing) {
    // A legacy v1 row with the same scoped key is not a replay of a v2 event.
    // Treat any profile drift as a conflicting key, never as success.
    if (existing.hash_profile!==event.hash_profile || existing.created_by!==event.created_by || existing.event_type!==event.event_type || existing.policy_version!==event.policy_version || JSON.stringify(metadata(existing.metadata_json,existing.source,existing.event_type))!==JSON.stringify(event.metadata_json) || verifyEvent(existing)!=='MATCH') throw new KernelError(409,'EVIDENCE_KEY_CONFLICT','مرجع العملية مرتبط بدليل مختلف أو تعذر فحصه.');
    return {...existing,replayed:true};
  }
  const tail = (await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 ORDER BY sequence_no DESC LIMIT 1`,[tenantId])).rows[0];
  if (tail && verifyEvent(tail)!=='MATCH') throw new KernelError(503,'LEDGER_INTEGRITY_UNAVAILABLE','تعذر فحص آخر دليل؛ لم تكتمل العملية.');
  event.sequence_no = String(BigInt(tail?.sequence_no ?? 0)+1n);
  event.previous_hash = tail?.integrity_hash ?? null;
  event.created_at = new Date((await db.query('SELECT clock_timestamp() AS time')).rows[0].time).toISOString();
  event.integrity_hash = hashEvent(event);
  const result = await db.query(`INSERT INTO public.aigas_ld_events (${columns}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[event.event_id,tenantId,event.source,event.event_type,event.policy_version,event.metadata_json,event.created_at,event.created_by,event.hash_profile,event.sequence_no,event.previous_hash,event.idempotency_key,event.integrity_hash]);
  if (result.rowCount!==1) throw new KernelError(503,'EVIDENCE_UNAVAILABLE','تعذر حفظ الدليل؛ لم تكتمل العملية.');
  return event;
}

// Ledger evidence is additive unless an approved Kernel requirement makes it mandatory.
// A savepoint lets an optional Ledger outage roll back only that append, not the Kernel audit.
//
// `input` is validated through the shared product envelope first. The persisted
// reference (`decision_ref`, `request_ref`, `asset_ref`, `assessment_ref` or
// `audit_ref`) must match the envelope's `decision_id`; a product cannot attach
// an outcome to a different decision or replay another cycle's reference.
const referenceState = (ready, access, grant) => {
  // No approved Ledger configuration at all. This is not "access denied" and it
  // never disables Kernel audit; it only means optional evidence is unavailable.
  if (!ready.events || !ready.access || !ready.grants) return { status: dependencyClasses.NOT_CONFIGURED, code: 'LEDGER_NOT_CONFIGURED', entitled: false };
  // No access row or no grant means no approved commercial entitlement. It is
  // reported as not configured, not as a security denial of the caller.
  if (!access || !grant) return { status: dependencyClasses.NOT_CONFIGURED, code: 'LEDGER_NOT_ENTITLED', entitled: false };
  if (grant.grantState === 'REVOKED') return { status: dependencyClasses.NOT_ENTITLED, code: 'LEDGER_ENTITLEMENT_REVOKED', entitled: false };
  if (grant.grantState === 'EXPIRED' || access.status === 'EXPIRED') return { status: dependencyClasses.EXPIRED, code: 'LEDGER_ENTITLEMENT_EXPIRED', entitled: false };
  if (grant.grantState === 'NOT_CONFIGURED') return { status: dependencyClasses.NOT_CONFIGURED, code: 'LEDGER_ENTITLEMENT_NOT_CONFIGURED', entitled: false };
  if (grant.grantState === 'PENDING') return { status: dependencyClasses.BLOCKED, code: 'LEDGER_ENTITLEMENT_PENDING', entitled: false };
  // FOUNDATION is a database default, not an administrative decision. It means
  // "not configured", never "blocked" and never "not subscribed".
  if (access.status === 'FOUNDATION') return { status: dependencyClasses.NOT_CONFIGURED, code: 'LEDGER_ACCESS_UNDECIDED', entitled: false };
  if (access.status !== 'ENABLED') return { status: dependencyClasses.BLOCKED, code: 'LEDGER_PRODUCT_DISABLED', entitled: true };
  if (grant.grantState !== 'ACTIVE') return { status: dependencyClasses.NOT_ENTITLED, code: 'LEDGER_ENTITLEMENT_UNUSABLE', entitled: false };
  return { status: dependencyClasses.AVAILABLE, code: 'LEDGER_AVAILABLE', entitled: true };
};

export async function recordProductEvent(db, identity, tenantId, input) {
  const definition = eventDefinition(input.source, input.event_type);
  // Callers normally pass the reference explicitly; deriving it from the
  // allowlisted metadata prevents a second, divergent value for the same cycle.
  const decisionId = input.decision_id ?? input.metadata_json?.[definition.reference];
  const envelope = buildProductEvent({
    identity, tenantId,
    source: input.source,
    eventType: input.event_type,
    correlationId: input.correlation_id,
    decisionId,
    policyVersion: input.policy_version,
    idempotencyKey: input.idempotency_key,
    outcomeConfirmed: input.outcome_confirmed === true,
    metadata: input.metadata_json,
  });
  // Membership is checked before any tenant-scoped read below; the caller's
  // tenant is still the one derived from tenantGuard, never a request body.
  await assertTenantMembership(db, identity, tenantId);
  const ready = (await db.query("SELECT to_regclass('public.aigas_ld_evidence_requirements') IS NOT NULL AS requirements, to_regclass('public.aigas_ld_events') IS NOT NULL AS events, to_regclass('public.aigas_product_access') IS NOT NULL AS access, to_regclass('public.aigas_product_grants') IS NOT NULL AS grants")).rows[0];
  const requirement = ready.requirements ? (await db.query('SELECT policy_version FROM public.aigas_locked_evidence_requirements($1) WHERE tenant_id=$1 AND source=$2 AND event_type=$3',[tenantId,envelope.source,envelope.eventType])).rows[0] : null;
  const mandatoryFailure = status => new KernelError(503,'MANDATORY_EVIDENCE_UNAVAILABLE','السياسة المعتمدة تشترط دليلًا لهذه العملية؛ تعذر تأكيد Ledger. لم تكتمل العملية.',status);
  await db.query('SAVEPOINT aig_optional_ledger_event');
  try {
    let access = null, grant = null;
    if (ready.access && ready.grants) {
      access = (await db.query("SELECT status FROM public.aigas_product_access WHERE tenant_id=$1 AND product_slug='ledger' FOR SHARE",[tenantId])).rows[0] ?? null;
      if (access) grant = (await productGrants(db,tenantId,'ledger'))[0] ?? null;
    }
    const state = referenceState(ready, access, grant);
    if (state.status !== dependencyClasses.AVAILABLE) {
      if (requirement) throw mandatoryFailure(state.status);
      await db.query('RELEASE SAVEPOINT aig_optional_ledger_event');
      return {
        recorded:false, dependencyStatus:state.status, dependencyCode:state.code,
        entitled:state.entitled, required:false, reason:'LEDGER_NOT_AVAILABLE',
        contract: envelope.contract, event: publicEventEnvelope(envelope),
      };
    }
    const ledgerInput = eventLedgerFields(envelope);
    const event = await appendEvent(db, identity, tenantId, {
      ...ledgerInput,
      metadata_json: requirement ? { ...input.metadata_json, evidence_policy_version: requirement.policy_version } : input.metadata_json,
    });
    await db.query('RELEASE SAVEPOINT aig_optional_ledger_event');
    return {
      ...event, dependencyStatus:dependencyClasses.AVAILABLE, dependencyCode:'LEDGER_AVAILABLE',
      entitled:true, required:!!requirement, contract: envelope.contract, event: publicEventEnvelope(envelope),
    };
  } catch (error) {
    await db.query('ROLLBACK TO SAVEPOINT aig_optional_ledger_event');
    await db.query('RELEASE SAVEPOINT aig_optional_ledger_event');
    // Caller/contract misuse can never be downgraded to an optional skip: the
    // product request itself is wrong and must fail with its precise code.
    if (error instanceof KernelError && ['INVALID_EVENT','UNTRUSTED_EVENT','INVALID_AUDIT_CONTEXT','INVALID_EVENT_CONTEXT','EVENT_REFERENCE_MISMATCH','OUTCOME_NOT_CONFIRMED','EVIDENCE_KEY_CONFLICT'].includes(error.code)) throw error;
    // A declared requirement blocks only the operation that produced this event.
    // Without one, Ledger stays an optional dependency: no append happens, the
    // caller receives the classified state, and the Kernel baseline continues.
    if (requirement) {
      if (error instanceof KernelError && error.code === 'MANDATORY_EVIDENCE_UNAVAILABLE') throw error;
      throw mandatoryFailure(error?.code === '42501' ? dependencyClasses.NOT_ENTITLED : dependencyClasses.TEMPORARILY_UNAVAILABLE);
    }
    const integrityBlocked = error?.code === 'LEDGER_INTEGRITY_UNAVAILABLE' || error?.code === 'EVIDENCE_UNAVAILABLE';
    const privilegeDenied = error?.code === '42501';
    return {
      recorded:false,
      dependencyStatus: privilegeDenied ? dependencyClasses.NOT_ENTITLED : integrityBlocked ? dependencyClasses.BLOCKED : dependencyClasses.TEMPORARILY_UNAVAILABLE,
      dependencyCode: privilegeDenied ? 'LEDGER_DB_PRIVILEGE' : integrityBlocked ? 'LEDGER_INTEGRITY_UNAVAILABLE' : 'LEDGER_TEMPORARILY_UNAVAILABLE',
      entitled:!privilegeDenied, required:false, reason:integrityBlocked?'LEDGER_INTEGRITY_UNAVAILABLE':'LEDGER_TEMPORARILY_UNAVAILABLE',
      contract: envelope.contract, event: publicEventEnvelope(envelope),
    };
  }
}
