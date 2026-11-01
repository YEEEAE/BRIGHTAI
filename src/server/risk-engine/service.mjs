import { recordProductEvent } from '../ledger/writer.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { exact,uuid,assetFields,assetInput,assessmentInput,version,classifications,treatmentFields,treatmentInput,treatmentStatuses } from './core.mjs';
export function createRiskEngineService(transact=transaction) {
 return async(identity,requested,operation,body={},params=new URLSearchParams(),id)=>{
  if(!['list','create','update','assess','history','revisions','treatments','save-treatment','actions','export'].includes(operation))throw new KernelError(404,'NOT_FOUND','المسار غير موجود.');
  const mutating=['create','update','assess','save-treatment'].includes(operation);
  const allowed=operation==='create'?assetFields:operation==='update'?[...assetFields,'asset_version']:operation==='assess'?['asset_version','likelihood','impact','likelihood_reason','impact_reason','controls_reason','evidence_references']:operation==='save-treatment'?treatmentFields:[];
  exact(body,mutating?[...allowed,'synthetic_data_confirmed']:allowed);
  if(mutating&&body.synthetic_data_confirmed!==true)throw new KernelError(400,'SYNTHETIC_DATA_REQUIRED','أكد استخدام أوصاف اصطناعية وغير حساسة؛ بيانات العملاء الحقيقية غير متاحة في هذا المسار.');
  if(['update','assess','history','revisions','treatments','save-treatment'].includes(operation)&&!uuid(id))throw new KernelError(400,'INVALID_ID','معرّف الحالة غير صالح.');
  const page=Number(params.get('page')||1);
  if(!Number.isInteger(page)||page<1||page>10000)throw new KernelError(400,'INVALID_PAGE','رقم الصفحة غير صالح.');
  const search=(params.get('q')||'').trim();
  if(search.length>80||/[\u0000-\u001f\u007f]/u.test(search))throw new KernelError(400,'INVALID_SEARCH','عبارة البحث طويلة أو غير صالحة.');
  const classification=params.get('classification')||'';
  if(classification&&!classifications.includes(classification))throw new KernelError(400,'INVALID_CLASSIFICATION','مرشح تصنيف البيانات غير صالح.');
  const riskLevel=params.get('risk_level')||'';
  if(riskLevel&&!['LOW','MEDIUM','HIGH'].includes(riskLevel))throw new KernelError(400,'INVALID_RISK_LEVEL','مرشح مستوى المخاطر غير صالح.');
  const assessmentStatus=params.get('assessment_status')||'';
  if(assessmentStatus&&!['NOT_ASSESSED','REASSESSMENT_REQUIRED','ASSESSED'].includes(assessmentStatus))throw new KernelError(400,'INVALID_ASSESSMENT_STATUS','مرشح حالة التقييم غير صالح.');
  const treatmentStatus=params.get('treatment_status')||'';
  if(treatmentStatus&&!treatmentStatuses.includes(treatmentStatus))throw new KernelError(400,'INVALID_TREATMENT_STATUS','مرشح المعالجة غير صالح.');
  const dueOnly=params.get('due')==='1';
  return transact(async db=>{
   const scope=await tenantGuard(identity,requested,db);
   if(!scope.tenant)throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
   const tenantId=scope.tenant.tenant_id;
   await requireProductAccess(db, identity, tenantId, 'risk-engine');
   const member=(await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE',[tenantId,identity.userId])).rows[0];
   requireRole(member,['OWNER','ADMIN','MEMBER']);
   const canWrite=['OWNER','ADMIN'].includes(member.role);
   if(['create','update','assess','save-treatment','export'].includes(operation))requireRole(member,['OWNER','ADMIN']);
   const audit=async action=>{
   const result=await db.query('INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES($1,$2,$3,$4) RETURNING id',[randomUUID(),tenantId,identity.userId,action]);
    if(result.rowCount!==1)throw new Error('Audit not persisted');
   };
   const snapshot=a=>Object.fromEntries([...assetFields,'version'].map(k=>[k,a[k]]));
   if(operation==='export'){
    // One statement supplies a consistent organization snapshot; never export a truncated page.
    const rows=(await db.query(`SELECT a.*,to_jsonb(s) AS assessment,to_jsonb(t) AS mitigation,
      CASE WHEN s.id IS NULL THEN 'NOT_ASSESSED' WHEN s.asset_version<>a.version THEN 'REASSESSMENT_REQUIRED' ELSE 'ASSESSED' END AS assessment_status,
      (t.id IS NOT NULL AND (t.asset_version<>a.version OR t.assessment_id IS DISTINCT FROM s.id)) AS treatment_review_required,
      (t.review_on IS NOT NULL AND t.review_on<=timezone('Asia/Riyadh',now())::date) AS review_due
      FROM public.aigas_re_assets a
      LEFT JOIN LATERAL(SELECT * FROM public.aigas_re_assessments WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1)s ON true
      LEFT JOIN LATERAL(SELECT * FROM public.aigas_re_treatment_revisions WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY version DESC LIMIT 1)t ON true
      WHERE a.tenant_id=$1 ORDER BY a.id LIMIT 10001`,[tenantId])).rows;
    if(rows.length>10000)throw new KernelError(422,'EXPORT_TOO_LARGE','يتجاوز السجل حد التصدير التقني 10000 أصل؛ لم يُنشأ ملف جزئي.');
    const summary={total:rows.length,low:0,medium:0,high:0,needs_reassessment:0};
    for(const row of rows){if(row.assessment_status!=='ASSESSED')summary.needs_reassessment++;else summary[row.assessment.risk_level.toLowerCase()]++;}
    await audit('risk_engine.summary.exported');
    return {schema_version:'risk-register-v1',tenant_id:tenantId,exported_at:new Date().toISOString(),scope:'All organization assets; latest assessment and latest treatment revision per asset',limitations:'Rules-only draft; treatment acceptance is not deployment authorization or compliance certification. No customer data training.',summary,assets:rows};
   }
   if(operation==='actions'){
    const rows=(await db.query(`SELECT a.id AS asset_id,a.name,a.version AS asset_version,s.id AS latest_assessment_id,s.risk_level,
      to_jsonb(t) AS treatment,
      (t.asset_version<>a.version OR t.assessment_id IS DISTINCT FROM s.id) AS review_required,
      (t.review_on IS NOT NULL AND t.review_on<=timezone('Asia/Riyadh',now())::date) AS review_due
      FROM public.aigas_re_assets a
      JOIN LATERAL(SELECT * FROM public.aigas_re_treatment_revisions WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY version DESC LIMIT 1)t ON true
      LEFT JOIN LATERAL(SELECT id,risk_level FROM public.aigas_re_assessments WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1)s ON true
      WHERE a.tenant_id=$1 AND ($2='' OR t.status=$2)
      AND (NOT $3::boolean OR t.review_on<=timezone('Asia/Riyadh',now())::date)
      ORDER BY t.review_on ASC NULLS LAST,a.id LIMIT 26 OFFSET $4`,[tenantId,treatmentStatus,dueOnly,(page-1)*25])).rows;
    return {actions:rows.slice(0,25),hasMore:rows.length>25,page,canWrite};
   }

   if(operation==='create'){
    const a=assetInput(body);
    const asset=(await db.query('INSERT INTO public.aigas_re_assets(id,tenant_id,name,owner,purpose,data_classification,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[randomUUID(),tenantId,a.name,a.owner,a.purpose,a.data_classification,identity.userId])).rows[0];
    await db.query('INSERT INTO public.aigas_re_asset_revisions(tenant_id,asset_id,asset_version,asset_snapshot,changed_by) VALUES($1,$2,$3,$4,$5)',[tenantId,asset.id,asset.version,snapshot(asset),identity.userId]);
    await audit(`risk_engine.asset.created:${asset.id}`);
    await recordProductEvent(db,identity,tenantId,{source:'risk-engine',event_type:'risk_engine.asset.created',policy_version:'risk-asset-schema-v1',metadata_json:{synthetic:false,asset_ref:asset.id,asset_version:asset.version},idempotency_key:`asset:${asset.id}:v${asset.version}`});return {asset,persisted:true};
   }
   if(operation==='list'){
    const summary=(await db.query(`SELECT count(*)::int AS total,
      count(*) FILTER(WHERE s.id IS NULL OR s.asset_version<>a.version)::int AS needs_reassessment,
      count(*) FILTER(WHERE s.asset_version=a.version AND s.risk_level='LOW')::int AS low,
      count(*) FILTER(WHERE s.asset_version=a.version AND s.risk_level='MEDIUM')::int AS medium,
      count(*) FILTER(WHERE s.asset_version=a.version AND s.risk_level='HIGH')::int AS high
      FROM public.aigas_re_assets a LEFT JOIN LATERAL (SELECT id,risk_level,asset_version FROM public.aigas_re_assessments WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1) s ON true WHERE a.tenant_id=$1`,[tenantId])).rows[0];
    const rows=(await db.query(`SELECT a.*,s.risk_level,s.id AS latest_assessment_id,s.asset_version AS assessed_version,
      CASE WHEN s.id IS NULL THEN 'NOT_ASSESSED' WHEN s.asset_version<>a.version THEN 'REASSESSMENT_REQUIRED' ELSE 'ASSESSED' END AS assessment_status
      FROM public.aigas_re_assets a LEFT JOIN LATERAL (SELECT id,risk_level,asset_version FROM public.aigas_re_assessments WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1) s ON true
      WHERE a.tenant_id=$1 AND ($2='' OR a.name ILIKE '%'||$2||'%' OR a.owner ILIKE '%'||$2||'%' OR a.purpose ILIKE '%'||$2||'%')
      AND ($3='' OR a.data_classification=$3)
      AND ($4='' OR (s.asset_version=a.version AND s.risk_level=$4)) AND ($6='' OR $6=CASE WHEN s.id IS NULL THEN 'NOT_ASSESSED' WHEN s.asset_version<>a.version THEN 'REASSESSMENT_REQUIRED' ELSE 'ASSESSED' END)
      ORDER BY a.created_at DESC,a.id DESC LIMIT 26 OFFSET $5`,[tenantId,search,classification,riskLevel,(page-1)*25,assessmentStatus])).rows;
    const filteredTotal=(await db.query(`SELECT count(*)::int AS total FROM public.aigas_re_assets a LEFT JOIN LATERAL (SELECT id,risk_level,asset_version FROM public.aigas_re_assessments WHERE tenant_id=a.tenant_id AND asset_id=a.id ORDER BY created_at DESC,id DESC LIMIT 1) s ON true WHERE a.tenant_id=$1 AND ($2='' OR a.name ILIKE '%'||$2||'%' OR a.owner ILIKE '%'||$2||'%' OR a.purpose ILIKE '%'||$2||'%') AND ($3='' OR a.data_classification=$3) AND ($4='' OR (s.asset_version=a.version AND s.risk_level=$4)) AND ($5='' OR $5=CASE WHEN s.id IS NULL THEN 'NOT_ASSESSED' WHEN s.asset_version<>a.version THEN 'REASSESSMENT_REQUIRED' ELSE 'ASSESSED' END)`,[tenantId,search,classification,riskLevel,assessmentStatus])).rows[0].total;
    return {tenant:{...scope.tenant,role:member.role},memberships:scope.memberships,canWrite,assets:rows.slice(0,25),hasMore:rows.length>25,page,summary,filteredTotal};
   }
   // Asset lock serializes updates with assessments; never assess a stale browser revision.
   const asset=(await db.query('SELECT * FROM public.aigas_re_assets WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[tenantId,id])).rows[0];
   if(!asset)throw new KernelError(404,'NOT_FOUND','الحالة غير موجودة ضمن مؤسستك.');
   const latestAssessment=(await db.query('SELECT * FROM public.aigas_re_assessments WHERE tenant_id=$1 AND asset_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1',[tenantId,id])).rows[0]||null;
   const latestTreatment=(await db.query('SELECT * FROM public.aigas_re_treatment_revisions WHERE tenant_id=$1 AND asset_id=$2 ORDER BY version DESC LIMIT 1',[tenantId,id])).rows[0]||null;
   if(operation==='treatments'){
    const rows=(await db.query('SELECT * FROM public.aigas_re_treatment_revisions WHERE tenant_id=$1 AND asset_id=$2 ORDER BY version DESC LIMIT 26 OFFSET $3',[tenantId,id,(page-1)*25])).rows;
    return {asset,treatments:rows.slice(0,25),latestTreatment,latestAssessment,page,hasMore:rows.length>25,canWrite,
     reviewRequired:!!latestTreatment&&(latestTreatment.asset_version!==asset.version||latestTreatment.assessment_id!==latestAssessment?.id),
     canAcceptHigh:member.role==='OWNER'&&!!latestAssessment&&latestAssessment.evaluator_id!==identity.userId};
   }
   if(operation==='save-treatment'){
    const t=treatmentInput(body);
    if(t.asset_version!==asset.version||!latestAssessment||latestAssessment.asset_version!==asset.version||t.assessment_id!==latestAssessment.id)throw new KernelError(409,'ASSESSMENT_STALE','يلزم تقييم محفوظ للنسخة الحالية؛ حدّث التفاصيل وأعد التقييم أولًا.');
    if(t.treatment_version!==(latestTreatment?.version||0))throw new KernelError(409,'STALE_TREATMENT','تغيرت خطة المعالجة؛ حدّث التفاصيل قبل الحفظ.');
    if(t.status==='ACCEPTED'&&latestAssessment.risk_level==='HIGH'){
     requireRole(member,['OWNER']);
     if(latestAssessment.evaluator_id===identity.userId)throw new KernelError(403,'SELF_ACCEPTANCE_DENIED','قبول الخطر المرتفع يتطلب مالكًا مستقلًا عن المقيّم. يمكن حفظ المعالجة دون قبول.');
    }
    const treatment=(await db.query(`INSERT INTO public.aigas_re_treatment_revisions(id,tenant_id,asset_id,asset_version,assessment_id,version,owner,status,control_description,review_on,rationale,changed_by,actor_role)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,[randomUUID(),tenantId,id,asset.version,latestAssessment.id,t.treatment_version+1,t.owner,t.status,t.control_description,t.review_on,t.rationale,identity.userId,member.role])).rows[0];
    await audit(`risk_engine.treatment.saved:${treatment.id}`);
    return {treatment,persisted:true,deployment_authorized:false};
   }
   if(operation==='history'){
    const rows=(await db.query('SELECT * FROM public.aigas_re_assessments WHERE tenant_id=$1 AND asset_id=$2 ORDER BY created_at DESC,id DESC LIMIT 26 OFFSET $3',[tenantId,id,(page-1)*25])).rows;
    return {asset,assessments:rows.slice(0,25),latestAssessment,page,hasMore:rows.length>25,canWrite};
   }
   if(operation==='revisions'){
    const rows=(await db.query('SELECT asset_version,asset_snapshot,changed_by,changed_at FROM public.aigas_re_asset_revisions WHERE tenant_id=$1 AND asset_id=$2 ORDER BY asset_version DESC LIMIT 26 OFFSET $3',[tenantId,id,(page-1)*25])).rows;
    return {asset,revisions:rows.slice(0,25),page,hasMore:rows.length>25,canWrite};
   }
   if(version(body.asset_version)!==asset.version)throw new KernelError(409,'STALE_ASSET','تغيرت الحالة؛ حدّث بياناتها قبل التعديل أو التقييم.');
   if(operation==='update'){
    const a=assetInput(body),changed=assetFields.some(k=>a[k]!==asset[k]);
    if(!changed)return {asset,persisted:true,changed:false};
    const updated=(await db.query('UPDATE public.aigas_re_assets SET name=$3,owner=$4,purpose=$5,data_classification=$6,version=version+1,updated_at=clock_timestamp() WHERE tenant_id=$1 AND id=$2 RETURNING *',[tenantId,id,a.name,a.owner,a.purpose,a.data_classification])).rows[0];
    await db.query('INSERT INTO public.aigas_re_asset_revisions(tenant_id,asset_id,asset_version,asset_snapshot,changed_by) VALUES($1,$2,$3,$4,$5)',[tenantId,id,updated.version,snapshot(updated),identity.userId]);
    await audit(`risk_engine.asset.updated:${id}`);
    await recordProductEvent(db,identity,tenantId,{source:'risk-engine',event_type:'risk_engine.asset.updated',policy_version:'risk-asset-schema-v1',metadata_json:{synthetic:false,asset_ref:id,asset_version:updated.version},idempotency_key:`asset:${id}:v${updated.version}`});return {asset:updated,persisted:true,changed:true};
   }
   const a=assessmentInput(body);
   const assetSnapshot=snapshot(asset);
   const assessment=(await db.query(`INSERT INTO public.aigas_re_assessments(id,tenant_id,asset_id,asset_version,asset_snapshot,likelihood,impact,likelihood_reason,impact_reason,controls_reason,risk_level,method_version,explanation,suggested_control,evaluator_id,method_name,evidence_references,previous_assessment_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,[randomUUID(),tenantId,id,asset.version,assetSnapshot,a.likelihood,a.impact,a.likelihood_reason,a.impact_reason,a.controls_reason,a.risk_level,a.method_version,a.explanation,a.suggested_control,identity.userId,a.method_name,a.evidence_references,latestAssessment?.id||null])).rows[0];
   await audit(`risk_engine.assessment.created:${assessment.id}`);
   await recordProductEvent(db,identity,tenantId,{source:'risk-engine',event_type:'risk_engine.assessment.created',policy_version:assessment.method_version,metadata_json:{synthetic:false,asset_ref:id,asset_version:asset.version,assessment_ref:assessment.id,risk_level:assessment.risk_level},idempotency_key:`assessment:${assessment.id}`});return {assessment,persisted:true};
  });
 };
}
export const operate=createRiskEngineService();
