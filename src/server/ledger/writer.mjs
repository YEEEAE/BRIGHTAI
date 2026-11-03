import { randomUUID } from 'node:crypto';
import { KernelError, requireRole } from '../kernel/core.mjs';
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
  const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE',[tenantId,identity.userId])).rows[0];
  requireRole(member,['OWNER','ADMIN','MEMBER']);
  // All appends in this implementation serialize per tenant until COMMIT.
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended('ledger:' || $1,0))",[tenantId]);
  const event = {event_id:randomUUID(),tenant_id:tenantId,source:input.source,event_type:input.event_type,policy_version:input.policy_version,metadata_json:metadata(input.metadata_json,input.source,input.event_type),created_by:identity.userId,hash_profile:profile,idempotency_key:input.idempotency_key};
  const existing = (await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND source=$2 AND idempotency_key=$3`,[tenantId,event.source,event.idempotency_key])).rows[0];
  if (existing) {
    if (existing.created_by!==event.created_by || existing.event_type!==event.event_type || existing.policy_version!==event.policy_version || JSON.stringify(metadata(existing.metadata_json,existing.source,existing.event_type))!==JSON.stringify(event.metadata_json) || verifyEvent(existing)!=='MATCH') throw new KernelError(409,'EVIDENCE_KEY_CONFLICT','مرجع العملية مرتبط بدليل مختلف أو تعذر فحصه.');
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
export async function recordProductEvent(db, identity, tenantId, input) {
  const ready = (await db.query("SELECT to_regclass('public.aigas_ld_evidence_requirements') IS NOT NULL AS requirements, to_regclass('public.aigas_ld_events') IS NOT NULL AS events, to_regclass('public.aigas_product_access') IS NOT NULL AS access, to_regclass('public.aigas_product_grants') IS NOT NULL AS grants")).rows[0];
  const requirement = ready.requirements ? (await db.query('SELECT policy_version FROM public.aigas_ld_evidence_requirements WHERE tenant_id=$1 AND source=$2 AND event_type=$3 FOR SHARE',[tenantId,input.source,input.event_type])).rows[0] : null;
  const mandatoryFailure = status => new KernelError(503,'MANDATORY_EVIDENCE_UNAVAILABLE','السياسة المعتمدة تشترط دليلًا لهذه العملية؛ تعذر تأكيد Ledger. لم تكتمل العملية.',status);
  await db.query('SAVEPOINT aig_optional_ledger_event');
  try {
    let access = null, grant = null;
    if (ready.access && ready.grants) {
      access = (await db.query("SELECT status FROM public.aigas_product_access WHERE tenant_id=$1 AND product_slug='ledger' FOR SHARE",[tenantId])).rows[0] ?? null;
      if (access) grant = (await db.query("SELECT revoked_at,expires_at<=clock_timestamp() AS expired FROM public.aigas_product_grants WHERE tenant_id=$1 AND product_slug='ledger' FOR SHARE",[tenantId])).rows[0] ?? null;
    }
    const state = !ready.events || !ready.access || !ready.grants ? 'not configured'
      : !access || !grant || grant.revoked_at || access.status !== 'ENABLED' ? 'access denied'
      : grant.expired ? 'expired' : 'available';
    if (state !== 'available') {
      if (requirement) throw mandatoryFailure(state);
      await db.query('RELEASE SAVEPOINT aig_optional_ledger_event');
      return { recorded:false, dependencyStatus:state, reason:'LEDGER_NOT_AVAILABLE' };
    }
    const event = await appendEvent(db,identity,tenantId,requirement ? {...input,metadata_json:{...input.metadata_json,evidence_policy_version:requirement.policy_version}} : input);
    await db.query('RELEASE SAVEPOINT aig_optional_ledger_event');
    return { ...event, dependencyStatus:'available' };
  } catch (error) {
    await db.query('ROLLBACK TO SAVEPOINT aig_optional_ledger_event');
    await db.query('RELEASE SAVEPOINT aig_optional_ledger_event');
    if (error instanceof KernelError && ['INVALID_EVENT','UNTRUSTED_EVENT','INVALID_AUDIT_CONTEXT'].includes(error.code)) throw error;
    if (requirement) {
      if (error instanceof KernelError && error.code === 'MANDATORY_EVIDENCE_UNAVAILABLE') throw error;
      throw mandatoryFailure(error?.code === '42501' ? 'access denied' : 'temporarily unavailable');
    }
    return { recorded:false, dependencyStatus:error?.code === '42501' ? 'access denied' : 'temporarily unavailable', reason:'LEDGER_TEMPORARILY_UNAVAILABLE' };
  }
}
