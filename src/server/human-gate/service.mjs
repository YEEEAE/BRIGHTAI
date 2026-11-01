import { recordProductEvent } from '../ledger/writer.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { statuses, uuid, exact, text, decisionAllowed } from './core.mjs';
export function createHumanGateService(transact=transaction) {
 return async(identity,requested,operation,body={},params=new URLSearchParams(),id)=>{
  if(!['list','create','decide','execute'].includes(operation))throw new KernelError(404,'NOT_FOUND','المسار غير موجود.');
  exact(body,operation==='create'?['title','description','reason','operation_scope']:operation==='decide'?['decision','reason']:[]);
  if(['decide','execute'].includes(operation)&&!uuid(id))throw new KernelError(400,'INVALID_ID','معرّف الطلب غير صالح.');
  const status=params.get('status')||'PENDING',page=Number(params.get('page')||1);
  if(!statuses.includes(status)||!Number.isInteger(page)||page<1||page>100)throw new KernelError(400,'INVALID_FILTER','التصفية أو رقم الصفحة غير صالح.');
  return transact(async db=>{
   const scope=await tenantGuard(identity,requested,db);
   if(!scope.tenant)throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
   const tenantId=scope.tenant.tenant_id;
   await requireProductAccess(db, identity, tenantId, 'human-gate');
   const member=(await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE',[tenantId,identity.userId])).rows[0];
   requireRole(member,['OWNER','ADMIN','MEMBER']);
   const record=async action=>{
    // Membership is locked for this transaction; a missing audit insert fails closed.
    const result=await db.query('INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES($1,$2,$3,$4) RETURNING id',[randomUUID(),tenantId,identity.userId,action]);
    if(result.rowCount!==1)throw new Error('Audit not persisted');
   };
   if(operation==='create'){
    const title=text(body.title,120),description=text(body.description),reason=text(body.reason);
    if(body.operation_scope!=='INTERNAL_DEMO_NOTE')throw new KernelError(400,'INVALID_SCOPE','المتاح فقط نشر ملاحظة داخلية تجريبية.');
    const request=(await db.query('INSERT INTO public.aigas_hg_requests(id,tenant_id,requester_id,title,description,reason,operation_scope) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[randomUUID(),tenantId,identity.userId,title,description,reason,body.operation_scope])).rows[0];
    await record(`human_gate.request.created:${request.id}`);
    await recordProductEvent(db,identity,tenantId,{source:'human-gate',event_type:'human_gate.request.created',policy_version:'human-gate-separation-v1',metadata_json:{synthetic:true,request_ref:request.id,operation_scope:request.operation_scope},idempotency_key:`request:${request.id}`});return {request,persisted:true};
   }
   if(operation==='list'){
    const rows=(await db.query(`SELECT r.*,d.id AS decision_id,d.decision,d.reviewer_id,d.reason AS decision_reason,d.decided_at FROM public.aigas_hg_requests r LEFT JOIN public.aigas_hg_decisions d ON d.tenant_id=r.tenant_id AND d.request_id=r.id WHERE r.tenant_id=$1 AND r.status=$2 ORDER BY r.created_at DESC,r.id DESC LIMIT 26 OFFSET $3`,[tenantId,status,(page-1)*25])).rows;
    return {tenant:{...scope.tenant,role:member.role},memberships:scope.memberships,page,hasMore:rows.length>25&&page<100,requests:rows.slice(0,25).map(r=>({...r,canDecide:decisionAllowed(member,r,identity.userId),canExecute:r.requester_id===identity.userId&&r.status==='APPROVED'&&!r.completed_at}))};
   }
   const request=(await db.query('SELECT * FROM public.aigas_hg_requests WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[tenantId,id])).rows[0];
   if(!request)throw new KernelError(404,'NOT_FOUND','الطلب غير موجود ضمن مؤسستك.');
   if(operation==='decide'){
    requireRole(member,['OWNER','ADMIN']);
    if(request.requester_id===identity.userId)throw new KernelError(403,'SELF_REVIEW_DENIED','لا يمكن لصاحب الطلب اتخاذ قرار على طلبه.');
    if(request.status!=='PENDING')throw new KernelError(409,'REQUEST_CLOSED','حُسم الطلب مسبقًا ولا يمكن تعديل القرار.');
    if(!['APPROVE','REJECT'].includes(body.decision))throw new KernelError(400,'INVALID_DECISION','اختر موافقة أو رفض.');
    const reason=text(body.reason);
    const decision=(await db.query('INSERT INTO public.aigas_hg_decisions(id,tenant_id,request_id,requester_id,reviewer_id,decision,reason) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[randomUUID(),tenantId,id,request.requester_id,identity.userId,body.decision,reason])).rows[0];
    await db.query('UPDATE public.aigas_hg_requests SET status=$3 WHERE tenant_id=$1 AND id=$2',[tenantId,id,body.decision==='APPROVE'?'APPROVED':'REJECTED']);
    await record(`human_gate.decision.${body.decision.toLowerCase()}:${id}`);
    await recordProductEvent(db,identity,tenantId,{source:'human-gate',event_type:'human_gate.decision.recorded',policy_version:'human-gate-separation-v1',metadata_json:{synthetic:true,request_ref:id,decision_ref:decision.id,decision:decision.decision,operation_scope:request.operation_scope},idempotency_key:`decision:${decision.id}`});return {decision,persisted:true};
   }
   if(request.requester_id!==identity.userId)throw new KernelError(403,'FORBIDDEN','تنفيذ العملية التجريبية متاح لمقدم الطلب فقط.');
   const approval=(await db.query("SELECT id FROM public.aigas_hg_decisions WHERE tenant_id=$1 AND request_id=$2 AND decision='APPROVE' AND reviewer_id<>$3",[tenantId,id,identity.userId])).rows[0];
   if(request.status!=='APPROVED'||!approval||request.operation_scope!=='INTERNAL_DEMO_NOTE')throw new KernelError(409,'APPROVAL_REQUIRED','العملية متوقفة؛ يلزم قرار موافقة محفوظ من مراجع مستقل.');
   if(request.completed_at)return {request,alreadyCompleted:true};
   const completed=(await db.query('UPDATE public.aigas_hg_requests SET completed_at=now() WHERE tenant_id=$1 AND id=$2 RETURNING *',[tenantId,id])).rows[0];
   await record(`human_gate.demo_note.completed:${id}`);
   await recordProductEvent(db,identity,tenantId,{source:'human-gate',event_type:'human_gate.demo_note.completed',policy_version:'human-gate-separation-v1',metadata_json:{synthetic:true,request_ref:id,operation_scope:request.operation_scope},idempotency_key:`completion:${id}`});return {request:completed,persisted:true};
  });
 };
}
export const operate=createHumanGateService();
