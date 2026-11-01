import { requireProductAccess } from '../kernel/access.mjs';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard, audit } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { canonical, exactObject, filters, profile, syntheticTypes, uuid, verifyEvent } from './core.mjs';
import { appendEvent, columns } from './writer.mjs';
import { FORMAT, MAX_EVENTS, verifyBundle } from '../../../public/downloads/aigas-ledger-verifier.mjs';

function bundleFor(events, tenantId, targetId) {
  const last=events.at(-1);
  return {format:FORMAT,manifest:{profile,tenant_id:tenantId,coverage:'GENESIS_THROUGH_TARGET',target_event_id:targetId,event_count:events.length,first_sequence:'1',last_sequence:String(last?.sequence_no ?? 0),head_hash:last?.integrity_hash ?? null},entries:events.map(event=>({event,canonical_hash_inputs:canonical(event)})),verification_spec:{encoding:'UTF-8',hash:'SHA-256 lowercase hex',canonicalization:'JSON.stringify array, no whitespace; metadata keys sorted by JavaScript .sort(); UTC ISO timestamp with milliseconds; sequence decimal string',field_order:['hash_profile','tenant_id','event_id','source','event_type','policy_version','metadata_json','created_at','created_by','sequence_no','previous_hash','idempotency_key'],genesis_previous_hash:null,verifier:'/downloads/aigas-ledger-verifier.mjs',offline_command:'node aigas-ledger-verifier.mjs ledger-EVENT_ID.json'},limitations:'Consistency of the supplied prefix only; no independent signature, external anchor, source/time authenticity, proof of latest tail, legal validity, administrator tamper prevention, permanent retention or Legal Hold. Metadata and evidence are not used to train AI models.'};
}
async function chainThrough(db,tenantId,event) {
  const events=(await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND sequence_no<=$2 ORDER BY sequence_no LIMIT $3`,[tenantId,event.sequence_no,MAX_EVENTS+1])).rows;
  if (events.length>MAX_EVENTS) return {report:{result:'INDETERMINATE',reason:'PREFIX_LIMIT',maxEvents:MAX_EVENTS},events:[]};
  try {
    const bundle=bundleFor(events,tenantId,event.event_id);
    return {events,bundle,report:verifyBundle(bundle)};
  } catch { return {events,report:{result:'INDETERMINATE',reason:'INVALID_EVENT'}}; }
}
export function createLedgerService(transact = transaction) {
  return async (identity,requested,operation,body={},params=new URLSearchParams(),id) => {
    if (!['list','create','detail','verify','export'].includes(operation)) throw new KernelError(404,'NOT_FOUND','المسار غير موجود.');
    const filter=filters(params);
    exactObject(body,operation==='create'?['event_type','scenario','idempotency_key']:operation==='verify'?['candidate']:[]);
    if (['detail','verify','export'].includes(operation) && !uuid(id)) throw new KernelError(400,'INVALID_ID','معرّف الحدث غير صالح.');
    return transact(async db => {
      const scope=await tenantGuard(identity,requested,db);
      if (!scope.tenant) throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
      const tenantId=scope.tenant.tenant_id;
      const member=await requireProductAccess(db,identity,tenantId,'ledger');
      requireRole(member,['create','export'].includes(operation)?['OWNER','ADMIN']:['OWNER','ADMIN','MEMBER']);
      const permissions={create:['OWNER','ADMIN'].includes(member.role),export:['OWNER','ADMIN'].includes(member.role)};
      if (operation==='create') {
        if (!syntheticTypes.includes(body.event_type) || !['integrity-check','access-check'].includes(body.scenario) || !uuid(body.idempotency_key)) throw new KernelError(400,'INVALID_EVENT','اختر سيناريو اصطناعيًا معتمدًا ومعرّف عملية صالحًا.');
        const event=await appendEvent(db,identity,tenantId,{source:'ledger.synthetic-lab',event_type:body.event_type,policy_version:'foundation-v1',metadata_json:{synthetic:true,scenario:body.scenario,outcome:body.event_type===syntheticTypes[0]?'RECORDED':'REVIEWED',decision_ref:body.idempotency_key},idempotency_key:`synthetic:${body.idempotency_key}`});
        if (!event.replayed) await audit(db,identity,tenantId,'ledger.synthetic.created');
        const {replayed,...stored}=event;
        return {event:stored,profile,persisted:true,replayed:!!replayed};
      }
      if (operation==='list') {
        const rows=(await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND ($2='' OR event_type=$2) AND ($3::int IS NULL OR created_at>=now()-make_interval(days=>$3::int)) AND ($4='' OR position(lower($4) in lower(event_id::text))>0 OR EXISTS (SELECT 1 FROM jsonb_each_text(metadata_json) AS ref(key,value) WHERE ref.key IN ('decision_ref','request_ref','asset_ref','assessment_ref','audit_ref') AND position(lower($4) in lower(ref.value))>0)) AND ($5='' OR source=$5) AND ($6='' OR metadata_json->>'synthetic'=CASE WHEN $6='synthetic' THEN 'true' ELSE 'false' END) ORDER BY sequence_no DESC LIMIT 26 OFFSET $7`,[tenantId,filter.type,filter.days,filter.search,filter.source,filter.classification,(filter.page-1)*25])).rows;
        const events=rows.slice(0,25);
        // Verify the unfiltered prefix, so filtering cannot disguise missing links.
        const chain=events.length?await chainThrough(db,tenantId,events[0]):{report:{result:'EMPTY'},events:[]};
        return {tenant:{...scope.tenant,role:member.role},memberships:scope.memberships,permissions,events:events.map(event=>({...event,integrity:verifyEvent(event),chain_integrity:chain.report.result})),chain:chain.report,page:filter.page,hasMore:rows.length>25 && filter.page<100,maxVerificationEvents:MAX_EVENTS};
      }
      const event=(await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND event_id=$2`,[tenantId,id])).rows[0];
      if (!event) throw new KernelError(404,'NOT_FOUND','الحدث غير موجود ضمن مؤسستك.');
      const chain=await chainThrough(db,tenantId,event);
      if (operation==='verify') return {result:verifyEvent(event,body.candidate),chain:chain.report,profile:event.hash_profile,independentSignature:false};
      if (operation==='export') {
        if (chain.report.reason==='PREFIX_LIMIT') throw new KernelError(413,'LEDGER_EXPORT_LIMIT','يتجاوز التسلسل حد الحزمة الأساسية (10000 حدث)؛ يلزم مسار تصدير أكبر معتمد. لم تُنشأ حزمة ناقصة.');
        if (!chain.bundle) throw new KernelError(409,'LEDGER_INTEGRITY_INVALID','تعذر تكوين حزمة قابلة للفحص بسبب بيانات غير صالحة.');
        // Export even a hash mismatch for investigation, with an explicit status.
        await audit(db,identity,tenantId,`ledger.event.exported:${id}`);
        return {...chain.bundle,verification:chain.report};
      }
      return {event,profile:event.hash_profile,permissions,integrity:verifyEvent(event),chain:chain.report};
    });
  };
}
export const operate=createLedgerService();
