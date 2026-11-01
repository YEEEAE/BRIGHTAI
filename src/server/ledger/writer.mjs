import { randomUUID } from 'node:crypto';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { profile, metadata, hashEvent, verifyEvent, sourceTypes, uuid } from './core.mjs';

export const columns = 'event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,hash_profile,sequence_no,previous_hash,idempotency_key,integrity_hash';

// Internal only. Call within the originating product's transaction after its guard.
// There is deliberately no HTTP ingestion endpoint accepting source/actor/tenant.
export async function appendEvent(db, identity, tenantId, input) {
  if (!uuid(identity?.userId) || !uuid(tenantId) || !sourceTypes[input.source]?.includes(input.event_type)) throw new KernelError(403,'UNTRUSTED_EVENT','مصدر الحدث غير مخوّل.');
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

// An optional subscription adds evidence; Kernel audit remains independent.
// Approved mandatory requirements have no fallback in this release: fail closed.
export async function recordProductEvent(db, identity, tenantId, input) {
  const ready = (await db.query("SELECT to_regclass('public.aigas_ld_evidence_requirements') IS NOT NULL AS requirements, to_regclass('public.aigas_product_grants') IS NOT NULL AS grants")).rows[0];
  const requirement = ready.requirements ? (await db.query('SELECT policy_version FROM public.aigas_ld_evidence_requirements WHERE tenant_id=$1 AND source=$2 AND event_type=$3 FOR SHARE',[tenantId,input.source,input.event_type])).rows[0] : null;
  const access = ready.grants ? (await db.query("SELECT a.status FROM public.aigas_product_access a JOIN public.aigas_product_grants g ON g.tenant_id=a.tenant_id AND g.product_slug=a.product_slug WHERE a.tenant_id=$1 AND a.product_slug='ledger' AND a.status='ENABLED' AND g.revoked_at IS NULL AND g.expires_at>now() FOR SHARE OF a,g",[tenantId])).rows[0] : null;
  if (!access) {
    if (requirement) throw new KernelError(503,'MANDATORY_EVIDENCE_UNAVAILABLE','السياسة المعتمدة تشترط دليلًا لهذه العملية؛ Ledger غير متاح ولا يوجد احتياطي معتمد. لم تكتمل العملية.');
    return {recorded:false,reason:'LEDGER_NOT_ENABLED'};
  }
  try {
    return await appendEvent(db,identity,tenantId,requirement ? {...input,metadata_json:{...input.metadata_json,evidence_policy_version:requirement.policy_version}} : input);
  } catch (error) {
    if (error instanceof KernelError) throw error;
    throw new KernelError(503,'EVIDENCE_UNAVAILABLE','تعذر حفظ دليل Ledger داخل المعاملة؛ لم تكتمل العملية. راجع المخطط وصلاحيات الخادم.');
  }
}
