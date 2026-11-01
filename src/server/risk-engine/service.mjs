import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { exact,uuid,assetFields,assetInput,assessmentInput,version } from './core.mjs';
export function createRiskEngineService(transact=transaction) {
 return async(identity,requested,operation,body={},params=new URLSearchParams(),id)=>{
  if(!['list','create','update','assess','history'].includes(operation))throw new KernelError(404,'NOT_FOUND','المسار غير موجود.');
  exact(body,operation==='create'?assetFields:operation==='update'?[...assetFields,'asset_version']:operation==='assess'?['asset_version','likelihood','impact','likelihood_reason','impact_reason','controls_reason']:[]);
  if(['update','assess','history'].includes(operation)&&!uuid(id))throw new KernelError(400,'INVALID_ID','معرّف الحالة غير صالح.');
  const page=Number(params.get('page')||1);
  if(!Number.isInteger(page)||page<1||page>10000)throw new KernelError(400,'INVALID_PAGE','رقم الصفحة غير صالح.');
  return transact(async db=>{
   const scope=await tenantGuard(identity,requested,db);
   if(!scope.tenant)throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
   const tenantId=scope.tenant.tenant_id;
   const member=(await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE',[tenantId,identity.userId])).rows[0];
   requireRole(member,['OWNER','ADMIN','MEMBER']);
   const canWrite=['OWNER','ADMIN'].includes(member.role);
   if(['create','update','assess'].includes(operation))requireRole(member,['OWNER','ADMIN']);
   const audit=async action=>{
    const result=await db.query('INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES($1,$2,$3,$4) RETURNING id',[randomUUID(),tenantId,identity.userId,action]);
    if(result.rowCount!==1)throw new Error('Audit not persisted');
   };
   if(operation==='create'){
    const a=assetInput(body);
    const asset=(await db.query('INSERT INTO public.aigas_re_assets(id,tenant_id,name,owner,purpose,data_classification,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[randomUUID(),tenantId,a.name,a.owner,a.purpose,a.data_classification,identity.userId])).rows[0];
    await audit(`risk_engine.asset.created:${asset.id}`);return {asset,persisted:true};
   }
   if(operation==='list'){
    const rows=(await db.query(`SELECT a.*,s.risk_level,s.id AS latest_assessment_id,s.asset_version AS assessed_version,
      CASE WHEN s.id IS NULL THEN 'NOT_ASSESSED' WHEN s.asset_version<>a.version THEN 'REASSESSMENT_REQUIRED' ELSE 'ASSESSED' END AS assessment_status
      FROM public.aigas_re_assets a LEFT JOIN LATERAL (SELECT id,risk_level,asset_version FROM public.aigas_re_assessments WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1) s ON true
      WHERE a.tenant_id=$1 ORDER BY a.created_at DESC,a.id DESC LIMIT 26 OFFSET $2`,[tenantId,(page-1)*25])).rows;
    return {tenant:{...scope.tenant,role:member.role},memberships:scope.memberships,canWrite,assets:rows.slice(0,25),hasMore:rows.length>25,page};
   }
   // Asset lock serializes updates with assessments; never assess a stale browser revision.
   const asset=(await db.query('SELECT * FROM public.aigas_re_assets WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[tenantId,id])).rows[0];
   if(!asset)throw new KernelError(404,'NOT_FOUND','الحالة غير موجودة ضمن مؤسستك.');
   if(operation==='history'){
    const rows=(await db.query('SELECT * FROM public.aigas_re_assessments WHERE tenant_id=$1 AND asset_id=$2 ORDER BY created_at DESC,id DESC LIMIT 26 OFFSET $3',[tenantId,id,(page-1)*25])).rows;
    return {asset,assessments:rows.slice(0,25),page,hasMore:rows.length>25,canWrite};
   }
   if(version(body.asset_version)!==asset.version)throw new KernelError(409,'STALE_ASSET','تغيرت الحالة؛ حدّث بياناتها قبل التعديل أو التقييم.');
   if(operation==='update'){
    const a=assetInput(body),changed=assetFields.some(k=>a[k]!==asset[k]);
    if(!changed)return {asset,persisted:true,changed:false};
    const updated=(await db.query('UPDATE public.aigas_re_assets SET name=$3,owner=$4,purpose=$5,data_classification=$6,version=version+1,updated_at=clock_timestamp() WHERE tenant_id=$1 AND id=$2 RETURNING *',[tenantId,id,a.name,a.owner,a.purpose,a.data_classification])).rows[0];
    await audit(`risk_engine.asset.updated:${id}`);return {asset:updated,persisted:true,changed:true};
   }
   const a=assessmentInput(body);
   const snapshot=Object.fromEntries([...assetFields,'version'].map(k=>[k,asset[k]]));
   const assessment=(await db.query(`INSERT INTO public.aigas_re_assessments(id,tenant_id,asset_id,asset_version,asset_snapshot,likelihood,impact,likelihood_reason,impact_reason,controls_reason,risk_level,method_version,explanation,suggested_control,evaluator_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,[randomUUID(),tenantId,id,asset.version,snapshot,a.likelihood,a.impact,a.likelihood_reason,a.impact_reason,a.controls_reason,a.risk_level,a.method_version,a.explanation,a.suggested_control,identity.userId])).rows[0];
   await audit(`risk_engine.assessment.created:${assessment.id}`);return {assessment,persisted:true};
  });
 };
}
export const operate=createRiskEngineService();
