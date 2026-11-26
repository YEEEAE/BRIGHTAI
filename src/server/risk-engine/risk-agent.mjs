import { KernelError } from '../kernel/core.mjs';
import { METHOD, acceptancePolicy, assessmentStatus, treatmentNeedsReview, evaluate } from './core.mjs';

// The caller supplies an authenticated tenant-scoped transaction. The agent
// cannot choose a tenant, change a record, or invoke an acceptance operation.
export async function readRiskSnapshot(db, tenantId, assetId, expectedVersion) {
  const asset = (await db.query('SELECT id,version,lifecycle_status FROM public.aigas_re_assets WHERE tenant_id=$1 AND id=$2 FOR SHARE', [tenantId, assetId])).rows[0];
  if (!asset) throw new KernelError(404, 'NOT_FOUND', 'الأصل غير موجود ضمن مؤسستك.');
  if (asset.version !== expectedVersion) throw new KernelError(409, 'STALE_ASSET', 'تغير الأصل؛ حدّث تفاصيله قبل طلب المسودة.');
  const assessment = (await db.query('SELECT id,asset_version,likelihood,impact,risk_level,method_version,evidence_references FROM public.aigas_re_assessments WHERE tenant_id=$1 AND asset_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1', [tenantId, assetId])).rows[0] ?? null;
  const treatment = (await db.query('SELECT id,version,asset_version,assessment_id,status,owner,residual_level,review_on FROM public.aigas_re_treatment_revisions WHERE tenant_id=$1 AND asset_id=$2 ORDER BY version DESC LIMIT 1', [tenantId, assetId])).rows[0] ?? null;
  return { asset, assessment, treatment };
}

// Fixed server-owned order and arguments: model output never controls tool
// execution. No free-text evidence or customer data is sent to the provider.
export function runRiskTools(snapshot = null) {
  const { asset = null, assessment = null, treatment = null } = snapshot ?? {};
  const current = asset && assessmentStatus(asset, assessment) === 'ASSESSED';
  const draft = current && assessment.method_version === METHOD.id ? evaluate(assessment.likelihood, assessment.impact) : null;
  if (draft && draft.risk_level !== assessment.risk_level) throw new KernelError(409, 'ASSESSMENT_INCONSISTENT', 'تعذر إعادة إنتاج تصنيف التقييم المحفوظ.');
  const steps = [
    { tool:'read_asset', source:asset ? { type:'asset', id:asset.id, version:asset.version } : { type:'unsaved_synthetic_input' }, result:asset ? { lifecycle_status:asset.lifecycle_status } : { status:'UNSAVED' } },
    { tool:'read_policy', source:{ type:'product_policy', version:acceptancePolicy.version }, result:{ methodology:METHOD.id, methodology_state:METHOD.state, acceptance:'HUMAN_ONLY' } },
    { tool:'read_evidence', source:assessment ? { type:'assessment', id:assessment.id, asset_version:assessment.asset_version } : { type:'assessment', status:'NOT_AVAILABLE' }, result:{ references_present:Boolean(assessment?.evidence_references), references_verified:false } },
    { tool:'assess', source:assessment ? { type:'assessment', id:assessment.id, method_version:assessment.method_version } : { type:'assessment', status:'NOT_AVAILABLE' }, result:{ status:asset ? assessmentStatus(asset, assessment) : 'NOT_ASSESSED', draft_level:draft?.risk_level ?? null, draft_score:draft?.score ?? null, approved_score:null, method_state:METHOD.state } },
    { tool:'propose_treatment', source:treatment ? { type:'treatment', id:treatment.id, version:treatment.version } : { type:'treatment', status:'NOT_AVAILABLE' }, result:{ status:treatment?.status ?? 'NOT_PLANNED', owner_recorded:Boolean(treatment?.owner), review_on:treatment?.review_on ?? null, residual_level:current && !treatmentNeedsReview(asset, assessment, treatment) ? treatment?.residual_level ?? null : null, review_required:asset ? treatmentNeedsReview(asset, assessment, treatment) : false, proposal_only:true } },
  ];
  return { steps, advisory_only:true, acceptance_authority:false, persisted:false };
}
