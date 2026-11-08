import { requireProductAccess } from '../kernel/access.mjs';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard, audit } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { HTTP_CONTRACT_VERSION } from '../kernel/contracts.mjs';
import { chainVersion, canonical, exactObject, filters, profile, publicMetadata, syntheticTypes, uuid, verificationState, verifyEvent } from './core.mjs';
import { appendEvent, columns } from './writer.mjs';
import { FORMAT, MAX_EVENTS, VERIFIER_VERSION, verifyBundle } from '../../../public/downloads/aigas-ledger-verifier.mjs';

function bundleFor(events, tenantId, targetId) {
  const last=events.at(-1);
  const versions=[...new Set(events.map(event=>event.policy_version))].sort();
  const sources=[...new Set(events.map(event=>event.source))].sort();
  const profiles=[...new Set(events.map(event=>event.hash_profile))].sort();
  return {format:FORMAT,manifest:{profile,chain_version:chainVersion,tenant_id:tenantId,coverage:'GENESIS_THROUGH_TARGET',target_event_id:targetId,event_count:events.length,first_sequence:'1',last_sequence:String(last?.sequence_no ?? 0),head_hash:last?.integrity_hash ?? null,policy_versions:versions,sources,hash_profiles:profiles,assurance:'INTEGRITY_ONLY_NO_SIGNATURE',verifier:{version:VERIFIER_VERSION,path:'/downloads/aigas-ledger-verifier.mjs'}},entries:events.map(event=>({event,canonical_hash_inputs:canonical(event)})),verification_spec:{encoding:'UTF-8',hash:'SHA-256 lowercase hex',canonicalization:'JSON.stringify array, no whitespace; metadata keys sorted by JavaScript .sort(); UTC ISO timestamp with milliseconds; sequence decimal string',field_order:['hash_profile','tenant_id','event_id','source','event_type','policy_version','metadata_json','created_at','created_by','sequence_no','previous_hash','idempotency_key'],genesis_previous_hash:null,state_mapping:{VERIFIED:'offline result MATCH / state VERIFIED_WITHIN_SCOPE',UNVERIFIED:'offline result INDETERMINATE / state UNVERIFIED',BLOCKED:'offline result MISMATCH (state TAMPERED) or a technical/structural block'},verifier:'/downloads/aigas-ledger-verifier.mjs',verifier_version:VERIFIER_VERSION,offline_command:'node aigas-ledger-verifier.mjs ledger-EVENT_ID.json'},limitations:'Consistency of the supplied prefix only; no independent signature, external anchor, source/time authenticity, proof of latest tail, legal validity, administrator tamper prevention, permanent retention or Legal Hold. Metadata and evidence are not used to train AI models.'};
}
async function chainThrough(db,tenantId,event) {
  const events=(await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND sequence_no<=$2 ORDER BY sequence_no LIMIT $3`,[tenantId,event.sequence_no,MAX_EVENTS+1])).rows;
  if (events.length>MAX_EVENTS) return {report:{result:'INDETERMINATE',reason:'PREFIX_LIMIT',state:'BLOCKED'},events:[]};
  // A prefix that mixes hash profiles cannot be checked by one canonical rule.
  // Refuse a bundle instead of exporting material the pinned verifier would have
  // to reinterpret or silently accept.
  if (events.some(row=>row.hash_profile!==profile)) return {events,report:{result:'INDETERMINATE',reason:'UNSUPPORTED_HASH_PROFILE',state:'BLOCKED'}};
  try {
    const bundle=bundleFor(events,tenantId,event.event_id);
    return {events,bundle,report:verifyBundle(bundle)};
  } catch { return {events,report:{result:'INDETERMINATE',reason:'INVALID_EVENT',state:'BLOCKED'}}; }
}
// One public shape: allowlisted metadata only, plus the derived integrity facts.
// verification_state combines the stored row hash with the supplied-prefix
// result, so a matching row inside a broken chain can never look positive.
function publicEvent(event, chainReport) {
  const safe=publicMetadata(event.metadata_json,event.source,event.event_type);
  const integrity=verifyEvent(event);
  const chain=chainReport??{result:'INDETERMINATE'};
  const verification=verificationState(integrity,chain);
  return {...event,metadata_json:safe.value,metadata_valid:safe.valid,integrity,chain_integrity:chain.result??null,verification_state:verification.state,verification_mismatch:verification.mismatch,verification_reasons:verification.reasons};
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
        return {event:publicEvent(stored),profile,chain_version:chainVersion,persisted:true,replayed:!!replayed,verifier:{version:VERIFIER_VERSION}};
      }
      if (operation==='list') {
        const rows=(await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND ($2='' OR event_type=$2) AND ($3::int IS NULL OR created_at>=now()-make_interval(days=>$3::int)) AND ($4='' OR position(lower($4) in lower(event_id::text))>0 OR EXISTS (SELECT 1 FROM jsonb_each_text(metadata_json) AS ref(key,value) WHERE ref.key IN ('decision_ref','request_ref','asset_ref','assessment_ref','audit_ref') AND position(lower($4) in lower(ref.value))>0)) AND ($5='' OR source=$5) AND ($6='' OR metadata_json->>'synthetic'=CASE WHEN $6='synthetic' THEN 'true' ELSE 'false' END) ORDER BY sequence_no DESC LIMIT 26 OFFSET $7`,[tenantId,filter.type,filter.days,filter.search,filter.source,filter.classification,(filter.page-1)*25])).rows;
        const events=rows.slice(0,25);
        // Verify the unfiltered prefix, so filtering cannot disguise missing links.
        const chain=events.length?await chainThrough(db,tenantId,events[0]):{report:{result:'EMPTY',state:'EMPTY'},events:[]};
        const summary=chain.report.result==='EMPTY'?{state:'UNVERIFIED',mismatch:false,reasons:['NO_EVIDENCE']}:verificationState('MATCH',chain.report);
        return {tenant:{...scope.tenant,role:member.role},memberships:scope.memberships,permissions,events:events.map(event=>publicEvent(event,chain.report)),chain:chain.report,verification:summary,chain_version:chainVersion,page:filter.page,hasMore:rows.length>25 && filter.page<100,maxVerificationEvents:MAX_EVENTS,verifier:{version:VERIFIER_VERSION},contract_version:HTTP_CONTRACT_VERSION};
      }
      const event=(await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND event_id=$2`,[tenantId,id])).rows[0];
      if (!event) throw new KernelError(404,'NOT_FOUND','الحدث غير موجود ضمن مؤسستك.');
      const chain=await chainThrough(db,tenantId,event);
      const stored=publicEvent(event,chain.report);
      if (operation==='verify') {
        const integrity=verifyEvent(event,body.candidate);
        const verification=verificationState(integrity,chain.report);
        return {result:integrity,state:verification.state,mismatch:verification.mismatch,reasons:verification.reasons,chain:chain.report,profile:event.hash_profile,chain_version:chainVersion,assurance:'INTEGRITY_ONLY_NO_SIGNATURE',scope:'SUPPLIED_PREFIX_ONLY',independentSignature:false,verifier:{version:VERIFIER_VERSION}};
      }
      if (operation==='export') {
        if (chain.report.reason==='PREFIX_LIMIT') throw new KernelError(413,'LEDGER_EXPORT_LIMIT','يتجاوز التسلسل حد الحزمة الأساسية (10000 حدث)؛ يلزم مسار تصدير أكبر معتمد. لم تُنشأ حزمة ناقصة.');
        if (chain.report.reason==='UNSUPPORTED_HASH_PROFILE') throw new KernelError(409,'LEDGER_EXPORT_UNSUPPORTED_PROFILE','تحتوي البادئة على حدث بإصدار بصمة غير مدعوم؛ لا تُصدَّر حزمة يتعذر التحقق منها مستقلًا. يلزم مسار ترحيل/فحص معتمد لهذا الإصدار.');
        if (!chain.bundle) throw new KernelError(409,'LEDGER_INTEGRITY_INVALID','تعذر تكوين حزمة قابلة للفحص بسبب بيانات غير صالحة. لم تُعد حزمة تدّعي السلامة.');
        // Export even a hash mismatch for investigation, with an explicit status.
        await audit(db,identity,tenantId,`ledger.event.exported:${id}`);
        const verification=verificationState(verifyEvent(event),chain.report);
        return {...chain.bundle,verification:{...chain.report,state:verification.state,mismatch:verification.mismatch,reasons:verification.reasons,assurance:'INTEGRITY_ONLY_NO_SIGNATURE',scope:'SUPPLIED_PREFIX_ONLY'}};
      }
      const verification={state:stored.verification_state,mismatch:stored.verification_mismatch,reasons:stored.verification_reasons};
      return {event:stored,profile:event.hash_profile,chain_version:chainVersion,permissions,integrity:stored.integrity,chain:chain.report,state:verification.state,mismatch:verification.mismatch,reasons:verification.reasons,verification,assurance:'INTEGRITY_ONLY_NO_SIGNATURE',verifier:{version:VERIFIER_VERSION}};
    });
  };
}
export const operate=createLedgerService();
