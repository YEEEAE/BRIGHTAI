import { recordProductEvent } from '../ledger/writer.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { audit, tenantGuard } from '../kernel/service.mjs';
import { KernelError, requireRole, workspaceName } from '../kernel/core.mjs';
import { HTTP_CONTRACT_VERSION } from '../kernel/contracts.mjs';
import { statuses, operations, reviewLevels, uuid, exact, text, minutes, binding, bindingVersion, admin, decisionAllowed, cancelAllowed, meetsLevel, roleRank, providerFor, canTransition } from './core.mjs';

const failure=(status,code,message)=>({failure:{status,code,message}});
// Source-level mirror of core.transitions; the database guard remains the
// final authority and repeats the same allow-list.
const assertTransition=(from,to)=>{
 if(!canTransition(from,to)) throw new KernelError(409,'INVALID_TRANSITION','حالة الطلب لا تسمح بهذا الانتقال؛ حدّث الصفحة قبل الإجراء.');
};
const bodyKeys={
 list:[],
 create:['title','description','reason','operation_type','new_name','synthetic_confirmed'],
 decide:['decision','reason'],
 execute:[],
 cancel:['reason'],
 policy:['version','pending_minutes','approval_minutes','enabled','review_level','separation_of_duties','delegation_enabled'],
 delegate:['delegatee_id','operation_type','level','minutes','reason'],
 'revoke-delegation':['reason'],
 delegations:[],
};
const requestsWithId=new Set(['decide','execute','cancel']);
export function createHumanGateService(transact=transaction) {
 return async(identity,requested,operation,body={},params=new URLSearchParams(),id)=>{
  if(!Object.hasOwn(bodyKeys,operation)) throw new KernelError(404,'NOT_FOUND','المسار غير موجود.');
  exact(body,bodyKeys[operation]);
  if((requestsWithId.has(operation)||operation==='revoke-delegation')&&!uuid(id)) throw new KernelError(400,'INVALID_ID','معرّف العملية غير صالح.');
  const status=params.get('status')||'',view=params.get('view')||'mine',page=Number(params.get('page')||1);
  if((status&&!statuses.includes(status))||!['mine','review','completed'].includes(view)||!Number.isInteger(page)||page<1||page>100) throw new KernelError(400,'INVALID_FILTER','التصفية أو رقم الصفحة غير صالح.');
  // Return terminal errors after COMMIT so expiry is persisted with its audit.
  const result=await transact(async db=>{
   const scope=await tenantGuard(identity,requested,db);
   if(!scope.tenant) throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
   const tenantId=scope.tenant.tenant_id;
   const member=await requireProductAccess(db,identity,tenantId,'human-gate');
   const caller=(await db.query('SELECT id FROM neon_auth."user" WHERE id=$1 AND banned IS NOT TRUE',[identity.userId])).rows[0];
   if(!caller) throw new KernelError(401,'UNAUTHORIZED','انتهت صلاحية الحساب.');
   // One order for policy, delegation, request transitions and lazy expiry within this tenant.
   await db.query("SELECT pg_advisory_xact_lock(hashtextextended('human-gate:' || $1,0))",[tenantId]);
   const policy=(await db.query('SELECT * FROM public.aigas_hg_policies WHERE tenant_id=$1 FOR SHARE',[tenantId])).rows[0]||null;
   const record=async(action,request,event,reason=null,auditAction=null)=>{
    const eventAction=auditAction??(request?`human_gate.${action}:${request.id}`:'kernel.human_gate.policy.updated');
     const correlationId=request?.id??randomUUID();
     const auditId=await audit(db,identity,tenantId,eventAction,{correlationId,policyVersion:request?.policy_version??policy?.version??'human-gate-policy-v3',idempotencyKey:request?`human-gate:${request.id}:${event}`:`human-gate:policy:${randomUUID()}`});
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
      let decisionRef=null;
      if(event==='APPROVED'||event==='REJECTED'){
       decisionRef=(await db.query('SELECT id,decision FROM public.aigas_hg_decisions WHERE tenant_id=$1 AND request_id=$2',[tenantId,request.id])).rows[0];
       if(!decisionRef?.id) throw new KernelError(503,'AUDIT_UNAVAILABLE','تعذر ربط القرار بسجل الطلب؛ لم تكتمل العملية.');
       Object.assign(metadata,{decision_ref:decisionRef.id,decision:decisionRef.decision});
      }
      await recordProductEvent(db,identity,tenantId,{
       source:'human-gate',event_type:eventType,
       correlation_id:correlationId,
       decision_id:decisionRef?.id??request.id,
       policy_version:request.policy_version,
       metadata_json:metadata,
       idempotency_key:`hg:${request.id}:${event}`,
       // Only the terminal EXECUTED transition records an outcome, and only
       // after the effect happened inside this transaction.
       outcome_confirmed:event==='EXECUTED',
      });
     }
    }else{
     // The Ledger kernel source only accepts `workspace.created` or `kernel.*`
     // action codes. A per-record suffix stays in the Kernel audit action, never
     // in the allowlisted metadata, so a delegation event cannot be rejected by
     // the evidence constraint after the real change was already made.
     const kernelEventAction=/^(workspace\.created|kernel\.[a-z_.-]+)$/.test(auditAction??'')?auditAction:`kernel.human_gate.${action}`;
     await recordProductEvent(db,identity,tenantId,{
      source:'kernel',event_type:'kernel.audit.recorded',
      correlation_id:correlationId,
      decision_id:auditId,
      policy_version:request?.policy_version||policy?.version||'human-gate-policy-v3',
      metadata_json:{synthetic:false,audit_ref:auditId,action:kernelEventAction},
      idempotency_key:`audit:${auditId}`,
     });
    }
    await assertAccessFresh(db,tenantId);
   };
   const revokeGrant=async(requestId)=>{
    await db.query("UPDATE public.aigas_hg_grants SET status='REVOKED' WHERE tenant_id=$1 AND request_id=$2 AND status='ACTIVE'",[tenantId,requestId]);
   };
   const expire=async(request,reason)=>{
    if(!canTransition(request.status,'EXPIRED')) return request;
    const expired=(await db.query("UPDATE public.aigas_hg_requests SET status='EXPIRED',terminal_reason=$3 WHERE tenant_id=$1 AND id=$2 AND status IN ('PENDING','APPROVED') RETURNING *",[tenantId,request.id,reason])).rows[0];
    if(expired){
     await revokeGrant(expired.id);
     await record('request.expired',expired,'EXPIRED',reason);
    }
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
    const reviewLevel=body.review_level??policy?.review_level??'ADMIN';
    const sod=body.separation_of_duties??policy?.separation_of_duties??true;
    const delegation=body.delegation_enabled??policy?.delegation_enabled??false;
    if(!reviewLevels.includes(reviewLevel)||typeof sod!=='boolean'||typeof delegation!=='boolean') throw new KernelError(400,'INVALID_POLICY','مستوى المراجعة أو فصل المهام أو التفويض غير صالح.');
    if(reviewLevel==='OWNER'&&member.role!=='OWNER') throw new KernelError(403,'POLICY_LEVEL_DENIED','تعيين مراجعة OWNER يتطلب مالك المؤسسة.');
    const updated=(await db.query('INSERT INTO public.aigas_hg_policies(tenant_id,version,pending_minutes,approval_minutes,enabled,review_level,separation_of_duties,delegation_enabled,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(tenant_id) DO UPDATE SET version=EXCLUDED.version,pending_minutes=EXCLUDED.pending_minutes,approval_minutes=EXCLUDED.approval_minutes,enabled=EXCLUDED.enabled,review_level=EXCLUDED.review_level,separation_of_duties=EXCLUDED.separation_of_duties,delegation_enabled=EXCLUDED.delegation_enabled,updated_by=EXCLUDED.updated_by,updated_at=clock_timestamp() RETURNING *',[tenantId,randomUUID(),pending,approval,body.enabled,reviewLevel,sod,delegation,identity.userId])).rows[0];
    await record('policy.updated',null,null);
    // A policy revision invalidates pending approvals and any unused execution grant.
    const stale=(await db.query("SELECT * FROM public.aigas_hg_requests WHERE tenant_id=$1 AND status IN ('PENDING','APPROVED') ORDER BY id FOR UPDATE",[tenantId])).rows;
    for(const request of stale) await expire(request,'POLICY_CHANGED');
    return {policy:updated,persisted:true};
   }
   const reviewAuthority=async(request)=>{
    const required=policy?.review_level??'ADMIN';
    if(admin(member)&&meetsLevel(member.role,required)) return {allowed:true,delegated:false,delegation_id:null,level:member.role};
    if(!policy?.delegation_enabled) return {allowed:false,delegated:false,delegation_id:null,level:null};
    // Delegation is bounded by an active server date window, one operation scope,
    // and the delegator's current role. It never exceeds the delegator's authority.
    const delegation=(await db.query(`SELECT d.id,d.level,d.delegator_id
      FROM public.aigas_hg_delegations d
      WHERE d.tenant_id=$1 AND d.delegatee_id=$2 AND d.operation_type=$3
       AND d.revoked_at IS NULL AND d.starts_at<=clock_timestamp() AND d.expires_at>clock_timestamp()
      ORDER BY d.expires_at DESC,d.created_at DESC LIMIT 1 FOR SHARE OF d`,[tenantId,identity.userId,request.operation_type])).rows[0];
    const delegator=delegation&&(await db.query('SELECT role FROM public.aigas_lock_member($1,$2)',[tenantId,delegation.delegator_id])).rows[0];
    if(!delegation||!admin(delegator)||!meetsLevel(delegator.role,delegation.level)||!meetsLevel(delegation.level,required)) return {allowed:false,delegated:false,delegation_id:null,level:null};
    return {allowed:true,delegated:true,delegation_id:delegation.id,level:delegation.level};
   };
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
    const provider=providerFor(body.operation_type);
    const data={tenant_id:tenantId,requester_id:identity.userId,operation_type:body.operation_type,provider_ref:provider,subject_ref:subjectRef,payload,policy_version:policy.version};
    const request=(await db.query('INSERT INTO public.aigas_hg_requests(id,tenant_id,requester_id,title,description,reason,operation_scope,operation_type,subject_ref,payload,payload_digest,policy_version,provider_ref,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,clock_timestamp()+make_interval(mins=>$13)) RETURNING *',[requestId,tenantId,identity.userId,title,description,reason,body.operation_type,subjectRef,payload,binding(data),policy.version,provider,policy.pending_minutes])).rows[0];
    await record('request.created',request,'CREATED');
    return {request,persisted:true,binding_version:bindingVersion};
   }
   if(operation==='delegate'){
    requireRole(member,['OWNER','ADMIN']);
    if(!policy?.enabled) throw new KernelError(409,'POLICY_REQUIRED','يلزم تفعيل سياسة المراجعة قبل التفويض.');
    if(!policy.delegation_enabled) throw new KernelError(409,'DELEGATION_DISABLED','التفويض غير مفعّل في سياسة المؤسسة الحالية.');
    if(!uuid(body.delegatee_id)||!operations.includes(body.operation_type)||!reviewLevels.includes(body.level)) throw new KernelError(400,'INVALID_DELEGATION','حدد عضوًا وعملية ومستوى تفويض صالحًا.');
    if(body.delegatee_id===identity.userId) throw new KernelError(400,'INVALID_DELEGATION','لا يمكن تفويض نفسك.');
    if(roleRank[body.level]>roleRank[member.role]) throw new KernelError(403,'DELEGATION_EXCEEDS_AUTHORITY','لا يمكن منح مستوى أعلى من صلاحيتك الحالية.');
    const delegatee=(await db.query('SELECT role,name FROM public.aigas_lock_member($1,$2)',[tenantId,body.delegatee_id])).rows[0];
    if(!delegatee) throw new KernelError(400,'USER_NOT_MEMBER','العضو المفوّض ليس عضوًا نشطًا في هذه المؤسسة.');
    const reason=text(body.reason),duration=minutes(body.minutes);
    const delegation=(await db.query('INSERT INTO public.aigas_hg_delegations(id,tenant_id,delegator_id,delegatee_id,operation_type,level,delegator_role,reason,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,clock_timestamp()+make_interval(mins=>$9)) RETURNING *',[randomUUID(),tenantId,identity.userId,body.delegatee_id,body.operation_type,body.level,member.role,reason,duration])).rows[0];
    await record('delegation.created',null,null,null,`human_gate.delegation.created:${delegation.id}`);
    return {delegation:{...delegation,delegatee_name:delegatee.name},persisted:true};
   }
   if(operation==='revoke-delegation'){
    requireRole(member,['OWNER','ADMIN']);
    const delegation=(await db.query('SELECT * FROM public.aigas_hg_delegations WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[tenantId,id])).rows[0];
    if(!delegation) throw new KernelError(404,'NOT_FOUND','التفويض غير موجود أو ليس ضمن صلاحيتك.');
    if(delegation.revoked_at) throw new KernelError(409,'DELEGATION_REVOKED','التفويض ملغى مسبقًا.');
    if(delegation.delegator_id!==identity.userId&&member.role!=='OWNER') throw new KernelError(403,'FORBIDDEN','إلغاء التفويض متاح لصاحبه أو مالك المؤسسة.');
    const revokeReason=text(body.reason);
    const revoked=(await db.query('UPDATE public.aigas_hg_delegations SET revoked_at=clock_timestamp(),revoked_by=$3,revoke_reason=$4 WHERE tenant_id=$1 AND id=$2 AND revoked_at IS NULL RETURNING *',[tenantId,id,identity.userId,revokeReason])).rows[0];
    if(!revoked) throw new KernelError(409,'STATE_CONFLICT','تغيرت حالة التفويض؛ حدّث الصفحة.');
    await record('delegation.revoked',null,null,null,`human_gate.delegation.revoked:${revoked.id}`);
    return {delegation:revoked,persisted:true};
   }
   if(operation==='delegations'){
    const delegations=(await db.query(`SELECT d.*,du.name AS delegator_name,eu.name AS delegatee_name
      FROM public.aigas_hg_delegations d
      LEFT JOIN neon_auth."user" du ON du.id=d.delegator_id
      LEFT JOIN neon_auth."user" eu ON eu.id=d.delegatee_id
      WHERE d.tenant_id=$1 AND ($2::boolean OR d.delegator_id=$3 OR d.delegatee_id=$3)
      ORDER BY d.created_at DESC LIMIT 100`,[tenantId,admin(member),identity.userId])).rows;
    return {delegations,policy,canManage:admin(member)&&!!policy?.delegation_enabled,persisted:true};
   }
   const eligible=async(request)=>{
    // Legacy or hand-modified rows must fail closed, not throw a 400 while a
    // list page is being rendered. Only the digest check is guarded here; real
    // database errors below still surface and abort the request.
    let digestValid=false;
    try { digestValid=!!request.payload_digest&&binding(request)===request.payload_digest; } catch { digestValid=false; }
    if(!policy?.enabled||policy.version!==request.policy_version||!digestValid) return false;
    if((request.provider_ref??providerFor(request.operation_type))!==providerFor(request.operation_type)) return false;
    const requester=(await db.query('SELECT role FROM public.aigas_lock_member($1,$2)',[tenantId,request.requester_id])).rows[0];
    if(!requester||(request.operation_type==='KERNEL_WORKSPACE_RENAME'&&!admin(requester))) return false;
    if(request.operation_type==='KERNEL_WORKSPACE_RENAME'){
     // A delegated MEMBER can read the target but cannot acquire an UPDATE-policy
     // row lock. Execution rechecks and locks the target before changing it.
     const target=(await db.query('SELECT name,profile_version FROM public.aigas_tenants WHERE id=$1',[tenantId])).rows[0];
     if(request.subject_ref!==tenantId||target?.name!==request.payload.expected_name||String(target?.profile_version)!==request.payload.expected_version) return false;
    }
    return true;
   };
   if(operation==='list'){
    const reviewScopes=policy?.enabled&&policy?.delegation_enabled?(await db.query(`SELECT DISTINCT operation_type FROM public.aigas_hg_delegations WHERE tenant_id=$1 AND delegatee_id=$2 AND revoked_at IS NULL AND starts_at<=clock_timestamp() AND expires_at>clock_timestamp()`,[tenantId,identity.userId])).rows.map(row=>row.operation_type):[];
    const rows=(await db.query(`SELECT r.*,d.id AS decision_id,d.decision,d.reviewer_id,d.reason AS decision_reason,d.decided_at,
       d.authority_level AS decision_level,
       g.id AS grant_id,g.status AS grant_status,g.expires_at AS grant_expires_at,g.consumed_at AS grant_consumed_at,g.consumed_by AS grant_consumed_by
      FROM public.aigas_hg_requests r
      LEFT JOIN public.aigas_hg_decisions d ON d.tenant_id=r.tenant_id AND d.request_id=r.id
      LEFT JOIN public.aigas_hg_grants g ON g.tenant_id=r.tenant_id AND g.request_id=r.id
      WHERE r.tenant_id=$1 AND ($2='' OR r.status=$2)
       AND (($3='mine' AND r.requester_id=$4)
        OR ($3='review' AND $5::boolean AND r.status='PENDING')
        OR ($3='review' AND $6::text[] <> '{}'::text[] AND r.operation_type=ANY($6::text[]))
        OR ($3='completed' AND r.status IN ('REJECTED','EXPIRED','CANCELLED','EXECUTED') AND (r.requester_id=$4 OR $5::boolean OR d.reviewer_id=$4)))
      ORDER BY r.created_at DESC,r.id DESC LIMIT 26 OFFSET $7`,[tenantId,status,view,identity.userId,admin(member),reviewScopes,(page-1)*25])).rows;
    const serverTime=(await db.query('SELECT clock_timestamp() AS time')).rows[0].time;
    const requests=[];
    for(const request of rows.slice(0,25)){
     const valid=['PENDING','APPROVED'].includes(request.status)&&await eligible(request);
     const authority=valid&&request.status==='PENDING'?await reviewAuthority(request):{allowed:false,delegated:false,delegation_id:null,level:null};
     let reviewerValid=false;
     if(valid&&request.status==='APPROVED') reviewerValid=await reviewerStillAuthorized(db,tenantId,request,policy);
     const grantActive=request.grant_status==='ACTIVE'&&request.grant_expires_at&&new Date(request.grant_expires_at).getTime()>new Date(serverTime).getTime();
     const history=(await db.query('SELECT event_type,reason_code,actor_user_id,created_at,audit_id FROM public.aigas_hg_events WHERE tenant_id=$1 AND request_id=$2 ORDER BY created_at,id',[tenantId,request.id])).rows;
     const canDecide=!!valid&&decisionAllowed(request,identity.userId,policy,authority);
     const canExecute=!!valid&&reviewerValid&&request.requester_id===identity.userId&&request.status==='APPROVED'&&grantActive;
     // Codes only; the UI owns the Arabic wording. They explain a disabled control
     // instead of implying that the viewer has authority the server did not grant.
     const reviewBlock=request.status!=='PENDING'?null
      :!valid?'BINDING_INVALID'
      :request.requester_id===identity.userId&&((policy?.separation_of_duties!==false)||request.operation_type==='KERNEL_WORKSPACE_RENAME')?'SELF_REVIEW'
      :!authority.allowed?'NO_AUTHORITY'
      :null;
     const executeBlock=request.status==='APPROVED'&&request.requester_id===identity.userId&&valid&&!canExecute
      ?(!reviewerValid?'REVIEWER_LOST':!grantActive?'PERMIT_INACTIVE':null)
      :null;
     requests.push({...request,history,
      bindingValid:!!valid,
       binding_version:bindingVersion,
       approval_expires_at:request.status==='APPROVED'?request.expires_at:null,
      isRequester:request.requester_id===identity.userId,
      canDecide,
      reviewBlock,
      executeBlock,
      canCancel:['PENDING','APPROVED'].includes(request.status)&&cancelAllowed(request,member,identity.userId),
      canExecute,
      decision_level:request.decision_level??null,
      grant:request.grant_id?{id:request.grant_id,status:request.grant_status,expires_at:request.grant_expires_at,consumed_at:request.grant_consumed_at,consumed_by:request.grant_consumed_by,active:grantActive}:null,
     });
    }
    const tenant=(await db.query('SELECT name,profile_version FROM public.aigas_tenants WHERE id=$1',[tenantId])).rows[0];
    const canManage=admin(member);
    const reviewers=canManage?(await db.query(`SELECT m.user_id,m.role,COALESCE(u.name,'عضو') AS name
      FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id
      WHERE m.tenant_id=$1 AND u.banned IS NOT TRUE
      ORDER BY CASE m.role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END,u.name`,[tenantId])).rows:[];
    const delegations=(await db.query(`SELECT d.*,du.name AS delegator_name,eu.name AS delegatee_name
      FROM public.aigas_hg_delegations d
      LEFT JOIN neon_auth."user" du ON du.id=d.delegator_id
      LEFT JOIN neon_auth."user" eu ON eu.id=d.delegatee_id
      WHERE d.tenant_id=$1 AND ($2::boolean OR d.delegator_id=$3 OR d.delegatee_id=$3)
      ORDER BY d.created_at DESC LIMIT 100`,[tenantId,canManage,identity.userId])).rows;
    return {tenant:{...scope.tenant,...tenant,role:member.role},memberships:scope.memberships.map(m=>m.tenant_id===tenantId?{...m,name:tenant.name}:m),policy,canManage,canReview:canManage||reviewScopes.length>0,canDelegate:canManage&&!!policy?.enabled&&!!policy?.delegation_enabled,reviewers,delegations,page,hasMore:rows.length>25&&page<100,requests,serverTime,contract_version:HTTP_CONTRACT_VERSION};
   }
   const request=(await db.query('SELECT * FROM public.aigas_hg_requests WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[tenantId,id])).rows[0];
   if(!request) throw new KernelError(404,'NOT_FOUND','الطلب غير موجود أو ليس ضمن صلاحيتك.');
   if(request.requester_id!==identity.userId&&!admin(member)){
    // A time-boxed delegate may load only a pending task within the delegated operation.
    if(operation!=='decide'||request.status!=='PENDING'||!(await reviewAuthority(request)).allowed) throw new KernelError(404,'NOT_FOUND','الطلب غير موجود أو ليس ضمن صلاحيتك.');
   }
   if(request.status==='EXPIRED') return failure(410,'REQUEST_EXPIRED','انتهت صلاحية الطلب؛ أنشئ طلبًا جديدًا.');
   if(request.status==='EXECUTED') throw new KernelError(409,'ALREADY_EXECUTED','نُفّذ الطلب مسبقًا؛ لا يمكن استخدام موافقته مرة أخرى.');
   if(request.status==='CANCELLED') throw new KernelError(409,'REQUEST_CANCELLED','أُلغي الطلب؛ يلزم طلب جديد.');
   if(operation==='cancel'){
    if(!cancelAllowed(request,member,identity.userId)) throw new KernelError(403,'FORBIDDEN','إلغاء الطلب غير متاح لهذا الدور أو الحالة.');
    assertTransition(request.status,'CANCELLED');
    const reason=text(body.reason);
    const terminal=request.requester_id===identity.userId?'CANCELLED_BY_REQUESTER':'CANCELLED_BY_REVIEWER';
    await revokeGrant(request.id);
    const cancelled=(await db.query("UPDATE public.aigas_hg_requests SET status='CANCELLED',cancelled_at=clock_timestamp(),cancelled_by=$3,cancel_reason=$4,terminal_reason=$5 WHERE tenant_id=$1 AND id=$2 AND status IN ('PENDING','APPROVED') AND expires_at>clock_timestamp() RETURNING *",[tenantId,id,identity.userId,reason,terminal])).rows[0];
    if(!cancelled) throw new KernelError(410,'REQUEST_EXPIRED','انتهت المهلة قبل حفظ الإلغاء؛ لم يتغير الطلب.');
    await record('request.cancelled',cancelled,'CANCELLED',terminal);
    return {request:cancelled,persisted:true};
   }
   if(!(await eligible(request))){
    let terminal='AUTHORITY_CHANGED';
    if(request.operation_type==='KERNEL_WORKSPACE_RENAME'){
     const target=(await db.query('SELECT name,profile_version FROM public.aigas_tenants WHERE id=$1',[tenantId])).rows[0];
     if(request.subject_ref!==tenantId||target?.name!==request.payload?.expected_name||String(target?.profile_version)!==request.payload?.expected_version) terminal='TARGET_CHANGED';
    }
    if(['PENDING','APPROVED'].includes(request.status)) await expire(request,terminal);
    return failure(409,'BINDING_INVALID','تغير الهدف أو السياسة أو الصلاحية؛ يلزم طلب جديد.');
   }
   if(operation==='decide'){
    if(request.status!=='PENDING') throw new KernelError(409,'REQUEST_CLOSED','حُسم الطلب ولا يمكن تسجيل قرار آخر.');
    if(!['APPROVE','REJECT'].includes(body.decision)) throw new KernelError(400,'INVALID_DECISION','اختر موافقة أو رفض.');
    const newStatus=body.decision==='APPROVE'?'APPROVED':'REJECTED';
    assertTransition(request.status,newStatus);
    const authority=await reviewAuthority(request);
    if(request.requester_id===identity.userId&&((policy?.separation_of_duties!==false)||request.operation_type==='KERNEL_WORKSPACE_RENAME')) throw new KernelError(403,'SELF_REVIEW_DENIED','فصل المهام يمنع صاحب الطلب من اعتماده أو رفضه.');
    if(!decisionAllowed(request,identity.userId,policy,authority)) throw new KernelError(403,'REVIEW_NOT_AUTHORIZED','لا تملك صلاحية مراجعة هذه العملية ضمن المستوى والتفويض الحاليين.');
    const reason=text(body.reason);
    const decision=(await db.query('INSERT INTO public.aigas_hg_decisions(id,tenant_id,request_id,requester_id,reviewer_id,decision,reason,payload_digest,policy_version,delegation_id,authority_level) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',[randomUUID(),tenantId,id,request.requester_id,identity.userId,body.decision,reason,request.payload_digest,request.policy_version,authority.delegation_id,authority.level])).rows[0];
    const updated=(await db.query("UPDATE public.aigas_hg_requests SET status=$3,expires_at=CASE WHEN $3='APPROVED' THEN LEAST(expires_at,clock_timestamp()+make_interval(mins=>$4)) ELSE expires_at END WHERE tenant_id=$1 AND id=$2 AND status='PENDING' AND expires_at>clock_timestamp() RETURNING *",[tenantId,id,newStatus,policy.approval_minutes])).rows[0];
    if(!updated) throw new KernelError(410,'REQUEST_EXPIRED','انتهت المهلة قبل حفظ القرار؛ لم يُسجل القرار.');
    let grant=null;
    if(newStatus==='APPROVED'){
     // The execution permit is bound to the exact task and expires with the approval.
     grant=(await db.query('INSERT INTO public.aigas_hg_grants(id,tenant_id,request_id,requester_id,reviewer_id,operation_type,subject_ref,payload_digest,policy_version,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[randomUUID(),tenantId,id,request.requester_id,identity.userId,request.operation_type,request.subject_ref,request.payload_digest,request.policy_version,updated.expires_at])).rows[0];
    }
    await record('decision.'+body.decision.toLowerCase(),updated,newStatus);
    await assertFresh(db,tenantId,id);
    return {request:updated,decision,grant,binding_version:bindingVersion,approval_expires_at:newStatus==='APPROVED'?updated.expires_at:null,persisted:true};
   }
   if(request.requester_id!==identity.userId) throw new KernelError(403,'FORBIDDEN','التنفيذ متاح لمقدم الطلب فقط.');
   if(request.status!=='APPROVED') throw new KernelError(409,'APPROVAL_REQUIRED','يلزم قرار موافقة مستقل وصالح قبل التنفيذ.');
   assertTransition(request.status,'EXECUTED');
   // Lock the permit before any side effect. A consumed or revoked permit cannot authorize a second run.
   const permit=(await db.query('SELECT *,expires_at>clock_timestamp() AS active FROM public.aigas_hg_grants WHERE tenant_id=$1 AND request_id=$2 FOR UPDATE',[tenantId,id])).rows[0];
   if(!permit) throw new KernelError(409,'PERMIT_REQUIRED','لا يوجد إذن تنفيذ مربوط بهذا الطلب؛ يلزم اعتماد جديد.');
   if(permit.status==='CONSUMED') throw new KernelError(409,'PERMIT_ALREADY_CONSUMED','استُهلك إذن التنفيذ مسبقًا؛ لا يمكن إعادة العملية.');
   if(permit.status!=='ACTIVE') throw new KernelError(409,'PERMIT_NOT_ACTIVE','إذن التنفيذ ملغى أو منتهٍ؛ أعد الاعتماد ضمن سياسة سارية.');
   if(!permit.active) throw new KernelError(410,'PERMIT_EXPIRED','انتهت صلاحية إذن التنفيذ قبل الاستخدام.');
   // The permit may shorten but never outlive the approved request window.
   if(new Date(permit.expires_at).getTime()>new Date(request.expires_at).getTime()) throw new KernelError(409,'BINDING_INVALID','صلاحية إذن التنفيذ تتجاوز المهمة المعتمدة؛ يلزم اعتماد جديد.');
   const approval=(await db.query("SELECT * FROM public.aigas_hg_decisions WHERE tenant_id=$1 AND request_id=$2 AND decision='APPROVE'",[tenantId,id])).rows[0];
   const selfApproval=approval?.reviewer_id===identity.userId;
   if(!approval||(selfApproval&&((policy?.separation_of_duties!==false)||request.operation_type==='KERNEL_WORKSPACE_RENAME'))||approval.payload_digest!==request.payload_digest||approval.policy_version!==request.policy_version||permit.payload_digest!==request.payload_digest||permit.policy_version!==request.policy_version||permit.subject_ref!==request.subject_ref||permit.operation_type!==request.operation_type||permit.requester_id!==request.requester_id||permit.reviewer_id!==approval.reviewer_id) throw new KernelError(409,'APPROVAL_REQUIRED','الموافقة أو إذن التنفيذ لا يطابق المهمة الحالية.');
   // Lock both identities and memberships until COMMIT; re-check the reviewer now.
   const principals=[];
   for(const userId of [...new Set([request.requester_id,approval.reviewer_id])].sort()){
    const principal=(await db.query('SELECT role FROM public.aigas_lock_member($1,$2)',[tenantId,userId])).rows[0];
    if(principal) principals.push({...principal,user_id:userId});
   }
   const requester=principals.find(p=>p.user_id===request.requester_id);
   if(!requester||(request.operation_type==='KERNEL_WORKSPACE_RENAME'&&!admin(requester))||!(await reviewerStillAuthorized(db,tenantId,request,policy))){
    await expire(request,'AUTHORITY_CHANGED');
    return failure(403,'AUTHORITY_CHANGED','تغيرت صلاحية مقدم الطلب أو المراجع أو التفويض؛ يلزم طلب جديد.');
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
   // Consume exactly once, after all binding checks and inside the same transaction as the effect.
   const consumed=(await db.query("UPDATE public.aigas_hg_grants SET status='CONSUMED',consumed_at=clock_timestamp(),consumed_by=$3 WHERE tenant_id=$1 AND request_id=$2 AND status='ACTIVE' AND expires_at>clock_timestamp() RETURNING *",[tenantId,id,identity.userId])).rows[0];
   if(!consumed) throw new KernelError(409,'PERMIT_ALREADY_CONSUMED','تعذر استهلاك إذن التنفيذ مرة واحدة؛ أُلغي الأثر.');
   await record('request.executed',request,'EXECUTED');
   await assertAccessFresh(db,tenantId);
   // Last statement after audit/evidence waits: late expiry rolls back the side effect too.
   const completed=(await db.query("UPDATE public.aigas_hg_requests SET status='EXECUTED',completed_at=clock_timestamp(),executed_by=$3,execution_result=$4 WHERE tenant_id=$1 AND id=$2 AND status='APPROVED' AND expires_at>clock_timestamp() RETURNING *",[tenantId,id,identity.userId,executionResult])).rows[0];
   if(!completed) throw new KernelError(410,'REQUEST_EXPIRED','انتهت المهلة قبل اكتمال التنفيذ؛ أُلغي التغيير داخل المعاملة.');
   return {request:completed,permit:consumed,binding_version:bindingVersion,approval_expires_at:completed.expires_at,persisted:true};
  });
  if(result.failure) throw new KernelError(result.failure.status,result.failure.code,result.failure.message);
  return result;
 };
}
async function reviewerStillAuthorized(db,tenantId,request,policy){
 const required=policy?.review_level??'ADMIN';
 const approval=(await db.query("SELECT reviewer_id,delegation_id FROM public.aigas_hg_decisions WHERE tenant_id=$1 AND request_id=$2 AND decision='APPROVE'",[tenantId,request.id])).rows[0];
 if(!approval) return false;
 const reviewer=(await db.query('SELECT role FROM public.aigas_lock_member($1,$2)',[tenantId,approval.reviewer_id])).rows[0];
 if(!reviewer) return false;
 if(approval.delegation_id){
  const delegation=(await db.query(`SELECT d.level,d.delegator_id FROM public.aigas_hg_delegations d
    WHERE d.id=$1 AND d.tenant_id=$2 AND d.delegatee_id=$3 AND d.operation_type=$4
     AND d.revoked_at IS NULL AND d.starts_at<=clock_timestamp() AND d.expires_at>clock_timestamp()
    FOR SHARE OF d`,[approval.delegation_id,tenantId,approval.reviewer_id,request.operation_type])).rows[0];
  const delegator=delegation&&(await db.query('SELECT role FROM public.aigas_lock_member($1,$2)',[tenantId,delegation.delegator_id])).rows[0];
  return !!delegation&&admin(delegator)&&meetsLevel(delegator.role,delegation.level)&&meetsLevel(delegation.level,required);
 }
 return admin(reviewer)&&meetsLevel(reviewer.role,required);
}
async function assertAccessFresh(db,tenantId){
 const access=(await db.query("SELECT g.tenant_id FROM public.aigas_product_grants g JOIN public.aigas_product_access a USING(tenant_id,product_slug) WHERE g.tenant_id=$1 AND g.product_slug='human-gate' AND g.access_kind='ADMIN_NON_BILLED' AND g.approved_at<=clock_timestamp() AND g.revoked_at IS NULL AND g.expires_at>clock_timestamp() AND a.status='ENABLED'",[tenantId])).rows[0];
 if(!access) throw new KernelError(403,'PRODUCT_NOT_ENABLED','انتهى قرار إتاحة Human Gate؛ لم تكتمل العملية.');
}
async function assertFresh(db,tenantId,id){
 const fresh=(await db.query('SELECT expires_at>clock_timestamp() AS fresh FROM public.aigas_hg_requests WHERE tenant_id=$1 AND id=$2',[tenantId,id])).rows[0];
 if(!fresh?.fresh) throw new KernelError(410,'REQUEST_EXPIRED','انتهت المهلة أثناء الحفظ؛ لم تكتمل العملية.');
}
export const operate=createHumanGateService();
