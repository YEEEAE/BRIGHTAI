import { recordProductEvent } from '../ledger/writer.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard } from '../kernel/service.mjs';
import { KernelError, requireRole, workspaceName } from '../kernel/core.mjs';
import { statuses, operations, uuid, exact, text, minutes, binding, admin, decisionAllowed } from './core.mjs';

const failure=(status,code,message)=>({failure:{status,code,message}});
export function createHumanGateService(transact=transaction) {
 return async(identity,requested,operation,body={},params=new URLSearchParams(),id)=>{
  if(!['list','create','decide','execute','policy'].includes(operation)) throw new KernelError(404,'NOT_FOUND','المسار غير موجود.');
  exact(body,operation==='create'?['title','description','reason','operation_type','new_name','synthetic_confirmed']:operation==='decide'?['decision','reason']:operation==='policy'?['version','pending_minutes','approval_minutes','enabled']:[]);
  if(['decide','execute'].includes(operation)&&!uuid(id)) throw new KernelError(400,'INVALID_ID','معرّف الطلب غير صالح.');
  const status=params.get('status')||'',view=params.get('view')||'mine',page=Number(params.get('page')||1);
  if((status&&!statuses.includes(status))||!['mine','review','completed'].includes(view)||!Number.isInteger(page)||page<1||page>100) throw new KernelError(400,'INVALID_FILTER','التصفية أو رقم الصفحة غير صالح.');
  // Return terminal errors after COMMIT so expiry is persisted with its audit.
  const result=await transact(async db=>{
   const scope=await tenantGuard(identity,requested,db);
   if(!scope.tenant) throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
   const tenantId=scope.tenant.tenant_id;
   const member=await requireProductAccess(db,identity,tenantId,'human-gate');
   const caller=(await db.query('SELECT id FROM neon_auth."user" WHERE id=$1 AND banned IS NOT TRUE FOR SHARE',[identity.userId])).rows[0];
   if(!caller) throw new KernelError(401,'UNAUTHORIZED','انتهت صلاحية الحساب.');
   // One order for policy, request transitions and lazy expiry within this tenant.
   await db.query("SELECT pg_advisory_xact_lock(hashtextextended('human-gate:' || $1,0))",[tenantId]);
   const policy=(await db.query('SELECT * FROM public.aigas_hg_policies WHERE tenant_id=$1 FOR SHARE',[tenantId])).rows[0]||null;
   const record=async(action,request,event,reason=null)=>{
    const auditId=randomUUID();
    const saved=await db.query('INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES($1,$2,$3,$4)',[auditId,tenantId,identity.userId,request?`human_gate.${action}:${request.id}`:'kernel.human_gate.policy.updated']);
    if(saved.rowCount!==1) throw new KernelError(503,'AUDIT_UNAVAILABLE','تعذر حفظ أثر العملية؛ لم تكتمل.');
    if(request){
     const savedEvent=await db.query('INSERT INTO public.aigas_hg_events(id,tenant_id,request_id,requester_id,actor_user_id,event_type,reason_code,audit_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[randomUUID(),tenantId,request.id,request.requester_id,identity.userId,event,reason,auditId]);
     if(savedEvent.rowCount!==1) throw new KernelError(503,'AUDIT_UNAVAILABLE','تعذر حفظ سجل الطلب؛ لم تكتمل العملية.');
    }
    // Kernel's existing metadata-only evidence adapter keeps Ledger optional.
    // Synthetic note events retain their existing explicitly synthetic classification.
    if(request?.operation_type==='INTERNAL_DEMO_NOTE'){
     const eventType={CREATED:'human_gate.request.created',APPROVED:'human_gate.decision.recorded',REJECTED:'human_gate.decision.recorded',EXECUTED:'human_gate.demo_note.completed'}[event];
     if(eventType){
      const metadata={synthetic:true,request_ref:request.id,operation_scope:'INTERNAL_DEMO_NOTE'};
      if(event==='APPROVED'||event==='REJECTED'){
       const d=(await db.query('SELECT id,decision FROM public.aigas_hg_decisions WHERE tenant_id=$1 AND request_id=$2',[tenantId,request.id])).rows[0];
       Object.assign(metadata,{decision_ref:d.id,decision:d.decision});
      }
      await recordProductEvent(db,identity,tenantId,{source:'human-gate',event_type:eventType,policy_version:request.policy_version,metadata_json:metadata,idempotency_key:`hg:${request.id}:${event}`});
     }
    }else{
     await recordProductEvent(db,identity,tenantId,{source:'kernel',event_type:'kernel.audit.recorded',policy_version:request?.policy_version||'human-gate-policy-v2',metadata_json:{synthetic:false,audit_ref:auditId,action:`kernel.human_gate.${action}`},idempotency_key:`audit:${auditId}`});
    }
    await assertAccessFresh(db,tenantId);
   };
   const expire=async(request,reason)=>{
    const expired=(await db.query("UPDATE public.aigas_hg_requests SET status='EXPIRED',terminal_reason=$3 WHERE tenant_id=$1 AND id=$2 AND status IN ('PENDING','APPROVED') RETURNING *",[tenantId,request.id,reason])).rows[0];
    if(expired) await record('request.expired',expired,'EXPIRED',reason);
    return expired||request;
   };
   // All displayed expired states come from persisted DB transitions, never a relabel in JS.
   const due=(await db.query("SELECT * FROM public.aigas_hg_requests WHERE tenant_id=$1 AND status IN ('PENDING','APPROVED') AND (expires_at<=clock_timestamp() OR policy_version IS DISTINCT FROM $2 OR $3::boolean IS NOT TRUE) ORDER BY id FOR UPDATE",[tenantId,policy?.version??null,policy?.enabled??false])).rows;
   for(const request of due) await expire(request,policy?.enabled&&request.policy_version===policy.version?'TIMEOUT':'POLICY_CHANGED');

   if(operation==='policy'){
    requireRole(member,['OWNER','ADMIN']);
    if(!(body.version===null||uuid(body.version))||typeof body.enabled!=='boolean') throw new KernelError(400,'INVALID_POLICY','إعداد السياسة غير صالح.');
    if((policy?.version??null)!==body.version) throw new KernelError(409,'POLICY_CONFLICT','تغيرت السياسة؛ حدّث الصفحة قبل الحفظ.');
    const pending=minutes(body.pending_minutes),approval=minutes(body.approval_minutes);
    const updated=(await db.query('INSERT INTO public.aigas_hg_policies(tenant_id,version,pending_minutes,approval_minutes,enabled,updated_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(tenant_id) DO UPDATE SET version=EXCLUDED.version,pending_minutes=EXCLUDED.pending_minutes,approval_minutes=EXCLUDED.approval_minutes,enabled=EXCLUDED.enabled,updated_by=EXCLUDED.updated_by,updated_at=clock_timestamp() RETURNING *',[tenantId,randomUUID(),pending,approval,body.enabled,identity.userId])).rows[0];
    await record('policy.updated',null,null);
    const stale=(await db.query("SELECT * FROM public.aigas_hg_requests WHERE tenant_id=$1 AND status IN ('PENDING','APPROVED') ORDER BY id FOR UPDATE",[tenantId])).rows;
    for(const request of stale) await expire(request,'POLICY_CHANGED');
    return {policy:updated,persisted:true};
   }
   if(operation==='create'){
    if(!policy?.enabled) throw new KernelError(409,'POLICY_REQUIRED','يلزم أن يحدد المالك أو المسؤول مهلة سياسة مفعّلة أولًا.');
    if(body.synthetic_confirmed!==true) throw new KernelError(400,'SYNTHETIC_REQUIRED','أكد استخدام مساحة تجريبية ونصوص غير حساسة، دون بيانات عميل حقيقية.');
    if(!operations.includes(body.operation_type)) throw new KernelError(400,'INVALID_SCOPE','اختر عملية متاحة.');
    const requestId=randomUUID(),title=text(body.title,120),description=text(body.description),reason=text(body.reason);
    let subjectRef=requestId,payload={note:description};
    if(body.operation_type==='KERNEL_WORKSPACE_RENAME'){
     requireRole(member,['OWNER','ADMIN']);
     const tenant=(await db.query('SELECT id,name,profile_version FROM public.aigas_tenants WHERE id=$1 FOR SHARE',[tenantId])).rows[0];
     const newName=workspaceName(text(body.new_name,100));
     if(newName===tenant.name) throw new KernelError(400,'NO_CHANGE','الاسم الجديد يطابق الاسم الحالي.');
     subjectRef=tenant.id;payload={expected_name:tenant.name,expected_version:String(tenant.profile_version),new_name:newName};
    }else if(body.new_name) throw new KernelError(400,'INVALID_BODY','الملاحظة التجريبية لا تغيّر اسم المساحة.');
    const data={tenant_id:tenantId,requester_id:identity.userId,operation_type:body.operation_type,subject_ref:subjectRef,payload,policy_version:policy.version};
    const request=(await db.query('INSERT INTO public.aigas_hg_requests(id,tenant_id,requester_id,title,description,reason,operation_scope,operation_type,subject_ref,payload,payload_digest,policy_version,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,clock_timestamp()+make_interval(mins=>$12)) RETURNING *',[requestId,tenantId,identity.userId,title,description,reason,body.operation_type,subjectRef,payload,binding(data),policy.version,policy.pending_minutes])).rows[0];
    await record('request.created',request,'CREATED');
    return {request,persisted:true};
   }
   const eligible=async(request)=>{
    if(!policy?.enabled||policy.version!==request.policy_version||!request.payload_digest||binding(request)!==request.payload_digest) return false;
    const requester=(await db.query('SELECT m.role FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=$1 AND m.user_id=$2 AND u.banned IS NOT TRUE FOR SHARE OF m,u',[tenantId,request.requester_id])).rows[0];
    if(!requester||(request.operation_type==='KERNEL_WORKSPACE_RENAME'&&!admin(requester))) return false;
    if(request.operation_type==='KERNEL_WORKSPACE_RENAME'){
     const target=(await db.query('SELECT name,profile_version FROM public.aigas_tenants WHERE id=$1 FOR SHARE',[tenantId])).rows[0];
     if(request.subject_ref!==tenantId||target?.name!==request.payload.expected_name||String(target?.profile_version)!==request.payload.expected_version) return false;
    }
    return true;
   };
   if(operation==='list'){
    const rows=(await db.query(`SELECT r.*,d.id AS decision_id,d.decision,d.reviewer_id,d.reason AS decision_reason,d.decided_at FROM public.aigas_hg_requests r LEFT JOIN public.aigas_hg_decisions d ON d.tenant_id=r.tenant_id AND d.request_id=r.id WHERE r.tenant_id=$1 AND ($2='' OR r.status=$2) AND (($3='mine' AND r.requester_id=$4) OR ($3='review' AND $5::boolean AND r.requester_id<>$4 AND r.status='PENDING') OR ($3='completed' AND r.status IN ('REJECTED','EXPIRED','EXECUTED') AND (r.requester_id=$4 OR $5::boolean))) ORDER BY r.created_at DESC,r.id DESC LIMIT 26 OFFSET $6`,[tenantId,status,view,identity.userId,admin(member),(page-1)*25])).rows;
    const requests=[];
    for(const request of rows.slice(0,25)){
     const valid=['PENDING','APPROVED'].includes(request.status)&&await eligible(request);
     let reviewerValid=false;
     if(valid&&request.status==='APPROVED') reviewerValid=!!(await db.query('SELECT m.user_id FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=$1 AND m.user_id=$2 AND m.role IN (\'OWNER\',\'ADMIN\') AND u.banned IS NOT TRUE FOR SHARE OF m,u',[tenantId,request.reviewer_id])).rowCount;
     const history=(await db.query('SELECT event_type,reason_code,actor_user_id,created_at,audit_id FROM public.aigas_hg_events WHERE tenant_id=$1 AND request_id=$2 ORDER BY created_at,id',[tenantId,request.id])).rows;
     requests.push({...request,history,bindingValid:!!valid,canDecide:!!valid&&decisionAllowed(member,request,identity.userId),canExecute:!!valid&&reviewerValid&&request.requester_id===identity.userId&&request.status==='APPROVED'});
    }
    const tenant=(await db.query('SELECT name,profile_version FROM public.aigas_tenants WHERE id=$1',[tenantId])).rows[0];
    return {tenant:{...scope.tenant,...tenant,role:member.role},memberships:scope.memberships.map(m=>m.tenant_id===tenantId?{...m,name:tenant.name}:m),policy,canManage:admin(member),page,hasMore:rows.length>25&&page<100,requests,serverTime:(await db.query('SELECT clock_timestamp() AS time')).rows[0].time};
   }
   const request=(await db.query('SELECT * FROM public.aigas_hg_requests WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[tenantId,id])).rows[0];
   if(!request||(request.requester_id!==identity.userId&&!admin(member))) throw new KernelError(404,'NOT_FOUND','الطلب غير موجود أو ليس ضمن صلاحيتك.');
   if(request.status==='EXPIRED') return failure(410,'REQUEST_EXPIRED','انتهت صلاحية الطلب؛ أنشئ طلبًا جديدًا.');
   if(request.status==='EXECUTED') throw new KernelError(409,'ALREADY_EXECUTED','نُفّذ الطلب مسبقًا؛ لا يمكن استخدام موافقته مرة أخرى.');
   if(!(await eligible(request))){
    if(['PENDING','APPROVED'].includes(request.status)) await expire(request,'AUTHORITY_CHANGED');
    return failure(409,'BINDING_INVALID','تغير الهدف أو السياسة أو الصلاحية؛ يلزم طلب جديد.');
   }
   if(operation==='decide'){
    requireRole(member,['OWNER','ADMIN']);
    if(request.requester_id===identity.userId) throw new KernelError(403,'SELF_REVIEW_DENIED','لا يمكن لصاحب الطلب اتخاذ قرار على طلبه.');
    if(request.status!=='PENDING') throw new KernelError(409,'REQUEST_CLOSED','حُسم الطلب ولا يمكن تسجيل قرار آخر.');
    if(!['APPROVE','REJECT'].includes(body.decision)) throw new KernelError(400,'INVALID_DECISION','اختر موافقة أو رفض.');
    const reason=text(body.reason);
    const decision=(await db.query('INSERT INTO public.aigas_hg_decisions(id,tenant_id,request_id,requester_id,reviewer_id,decision,reason,payload_digest,policy_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[randomUUID(),tenantId,id,request.requester_id,identity.userId,body.decision,reason,request.payload_digest,request.policy_version])).rows[0];
    const newStatus=body.decision==='APPROVE'?'APPROVED':'REJECTED';
    const updated=(await db.query('UPDATE public.aigas_hg_requests SET status=$3,expires_at=CASE WHEN $3=\'APPROVED\' THEN LEAST(expires_at,clock_timestamp()+make_interval(mins=>$4)) ELSE expires_at END WHERE tenant_id=$1 AND id=$2 AND expires_at>clock_timestamp() RETURNING *',[tenantId,id,newStatus,policy.approval_minutes])).rows[0];
    if(!updated) throw new KernelError(410,'REQUEST_EXPIRED','انتهت المهلة قبل حفظ القرار؛ لم يُسجل القرار.');
    await record('decision.'+body.decision.toLowerCase(),updated,newStatus);
    await assertFresh(db,tenantId,id);
    return {request:updated,decision,persisted:true};
   }
   if(request.requester_id!==identity.userId) throw new KernelError(403,'FORBIDDEN','التنفيذ متاح لمقدم الطلب فقط.');
   if(request.status!=='APPROVED') throw new KernelError(409,'APPROVAL_REQUIRED','يلزم قرار موافقة مستقل وصالح قبل التنفيذ.');
   const approval=(await db.query("SELECT * FROM public.aigas_hg_decisions WHERE tenant_id=$1 AND request_id=$2 AND decision='APPROVE' FOR SHARE",[tenantId,id])).rows[0];
   if(!approval||approval.reviewer_id===identity.userId||approval.payload_digest!==request.payload_digest||approval.policy_version!==request.policy_version) throw new KernelError(409,'APPROVAL_REQUIRED','الموافقة لا تطابق المهمة الحالية.');
   // Lock both identities and memberships until COMMIT; re-check the reviewer now.
   const principals=(await db.query('SELECT m.user_id,m.role FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id WHERE m.tenant_id=$1 AND m.user_id=ANY($2::uuid[]) AND u.banned IS NOT TRUE ORDER BY m.user_id FOR SHARE OF m,u',[tenantId,[request.requester_id,approval.reviewer_id]])).rows;
   const requester=principals.find(p=>p.user_id===request.requester_id),reviewer=principals.find(p=>p.user_id===approval.reviewer_id);
   if(!requester||!admin(reviewer)||(request.operation_type==='KERNEL_WORKSPACE_RENAME'&&!admin(requester))){
    await expire(request,'AUTHORITY_CHANGED');
    return failure(403,'AUTHORITY_CHANGED','تغيرت صلاحية مقدم الطلب أو المراجع؛ يلزم طلب جديد.');
   }
   let executionResult={kind:'INTERNAL_DEMO_NOTE',note_ref:request.id};
   if(request.operation_type==='KERNEL_WORKSPACE_RENAME'){
    const target=(await db.query('SELECT id,name,profile_version FROM public.aigas_tenants WHERE id=$1 FOR UPDATE',[tenantId])).rows[0];
    if(request.subject_ref!==target.id||target.name!==request.payload.expected_name||String(target.profile_version)!==request.payload.expected_version){
     await expire(request,'TARGET_CHANGED');return failure(409,'TARGET_CHANGED','تغير اسم المساحة أو نسختها؛ يلزم طلب جديد.');
    }
    const changed=(await db.query('UPDATE public.aigas_tenants SET name=$2 WHERE id=$1 AND profile_version=$3 RETURNING id,profile_version',[tenantId,request.payload.new_name,request.payload.expected_version])).rows[0];
    if(!changed) throw new KernelError(409,'TARGET_CHANGED','تغيرت المساحة؛ لم تُنفّذ العملية.');
    executionResult={kind:'KERNEL_WORKSPACE_RENAME',subject_ref:changed.id,profile_version:String(changed.profile_version)};
   }
   await record('request.executed',request,'EXECUTED');
   await assertAccessFresh(db,tenantId);
   // Last statement after audit/evidence waits: late expiry rolls back the side effect too.
   const completed=(await db.query("UPDATE public.aigas_hg_requests SET status='EXECUTED',completed_at=clock_timestamp(),executed_by=$3,execution_result=$4 WHERE tenant_id=$1 AND id=$2 AND status='APPROVED' AND expires_at>clock_timestamp() RETURNING *",[tenantId,id,identity.userId,executionResult])).rows[0];
   if(!completed) throw new KernelError(410,'REQUEST_EXPIRED','انتهت المهلة قبل اكتمال التنفيذ؛ أُلغي التغيير داخل المعاملة.');
   return {request:completed,persisted:true};
  });
  if(result.failure) throw new KernelError(result.failure.status,result.failure.code,result.failure.message);
  return result;
 };
}
async function assertAccessFresh(db,tenantId){
 const access=(await db.query("SELECT g.tenant_id FROM public.aigas_product_grants g JOIN public.aigas_product_access a USING(tenant_id,product_slug) WHERE g.tenant_id=$1 AND g.product_slug='human-gate' AND g.revoked_at IS NULL AND g.expires_at>clock_timestamp() AND a.status='ENABLED'",[tenantId])).rows[0];
 if(!access) throw new KernelError(403,'PRODUCT_NOT_ENABLED','انتهى قرار إتاحة Human Gate؛ لم تكتمل العملية.');
}
async function assertFresh(db,tenantId,id){
 const fresh=(await db.query('SELECT expires_at>clock_timestamp() AS fresh FROM public.aigas_hg_requests WHERE tenant_id=$1 AND id=$2',[tenantId,id])).rows[0];
 if(!fresh?.fresh) throw new KernelError(410,'REQUEST_EXPIRED','انتهت المهلة أثناء الحفظ؛ لم تكتمل العملية.');
}
export const operate=createHumanGateService();
