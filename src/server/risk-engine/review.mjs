import { randomUUID } from 'node:crypto';
import { binding, providerFor, riskReviewOperation } from '../human-gate/core.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { KernelError } from '../kernel/core.mjs';
import { recordIntegratedReviewCreation } from '../human-gate/integration.mjs';

// The assessment service holds Human Gate's tenant lock before the asset lock.
export async function requestAssessmentReview(db, identity, tenantId, assessment) {
  if (assessment.risk_level !== 'HIGH') return null;
  const policy = (await db.query('SELECT * FROM public.aigas_hg_policies WHERE tenant_id=$1 FOR SHARE', [tenantId])).rows[0];
  if (!policy?.enabled || policy.risk_assessment_review_enabled !== true) return null;
  try {
    await requireProductAccess(db, identity, tenantId, 'human-gate', 'create');
  } catch (error) {
    if (error instanceof KernelError && error.code === 'PRODUCT_NOT_ENABLED') return null;
    throw error;
  }
  const payload = { asset_id:assessment.asset_id, asset_version:assessment.asset_version, method_version:assessment.method_version };
  const providerRef = providerFor(riskReviewOperation);
  const payloadDigest = binding({
    tenant_id:tenantId, requester_id:identity.userId, operation_type:riskReviewOperation,
    provider_ref:providerRef, subject_ref:assessment.id, payload, policy_version:policy.version,
  });
  const id = randomUUID();
  const request = (await db.query(`INSERT INTO public.aigas_hg_requests
    (id,tenant_id,requester_id,title,description,reason,operation_scope,operation_type,subject_ref,payload,payload_digest,policy_version,provider_ref,expires_at)
    VALUES($1,$2,$3,'Risk assessment review','Metadata-only assessment review','Independent review required',$4,$4,$5,$6,$7,$8,$9,clock_timestamp()+make_interval(mins=>$10))
    RETURNING id,status`,
  [id,tenantId,identity.userId,riskReviewOperation,assessment.id,payload,payloadDigest,policy.version,providerRef,policy.pending_minutes])).rows[0];
  await recordIntegratedReviewCreation(db,identity,tenantId,id,policy.version);
  return request;
}
