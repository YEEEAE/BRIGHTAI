import { randomUUID } from 'node:crypto';
import { binding } from '../human-gate/core.mjs';
import { requireProductAccess } from '../kernel/access.mjs';
import { KernelError } from '../kernel/core.mjs';
import { lockHumanGate, recordIntegratedReviewCreation } from '../human-gate/integration.mjs';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const reviewBindingVersion = 'aigas-review-binding-v2';

export function reviewIntegrationState(tenantId, policy = null) {
  if(policy?.enabled && policy.firewall_escalation_enabled === true) return {code:'HUMAN_GATE_CONFIGURED',configured:true,dependencyStatus:'available',operation_type:'FIREWALL_ESCALATION_REVIEW'};
  return { code:'HUMAN_GATE_NOT_CONFIGURED', configured:false, dependencyStatus:'not configured', operation_type:null, reason:'TENANT_POLICY_REQUIRED' };
}

// A returned review must describe exactly this decision, tenant, operation type
// and policy version. A review for a previous decision or another workspace is
// never accepted as "pending for this request".
export function reviewBound(review, tenantId, context, integration) {
  return !!review
    && uuidPattern.test(tenantId ?? '')
    && uuidPattern.test(context.decisionId ?? '')
    && uuidPattern.test(context.requestId ?? '')
    && typeof context.policyVersion === 'string' && context.policyVersion.length > 0
    && /^[0-9a-f]{64}$/.test(context.requestFingerprint ?? '')
    && review.status === 'PENDING'
    && uuidPattern.test(review.id ?? '')
    && review.tenant_id === tenantId
    && review.request_ref === context.requestId
    && review.request_fingerprint === context.requestFingerprint
    && review.subject_ref === context.decisionId
    && review.operation_type === integration.operationType
    && review.policy_version === context.policyVersion;
}

// Called inside the Firewall transaction after the ESCALATE decision and Kernel
// audit. A configured adapter inserts the review and its evidence
// request in the same transaction; a throw rolls the whole decision back (fail-closed).
export async function requestHumanReview(db, identity, tenantId, context) {
  await lockHumanGate(db, tenantId);
  const policy = (await db.query('SELECT * FROM public.aigas_hg_policies WHERE tenant_id=$1 FOR SHARE',[tenantId])).rows[0];
  if (!policy?.enabled || policy.firewall_escalation_enabled !== true) return {requested:false,...reviewIntegrationState(),review:null,binding:null};
  try {
    await requireProductAccess(db, identity, tenantId, 'human-gate', 'create');
  } catch (error) {
    if (!(error instanceof KernelError) || error.code !== 'PRODUCT_NOT_ENABLED') throw error;
    return {requested:false,...reviewIntegrationState(),reason:error.code,dependencyStatus:error.dependencyStatus,review:null,binding:null};
  }
  const integration = {operationType:'FIREWALL_ESCALATION_REVIEW', create: createReview};
  const review = await integration.create(db, identity, tenantId, { ...context, operationType: integration.operationType });
  if (!reviewBound(review, tenantId, context, integration)) throw new Error('REVIEW_BINDING_MISMATCH');
  return {
    requested: true,
    code: 'HUMAN_GATE_CONFIGURED',
    configured: true,
    dependencyStatus: 'available',
    operation_type: integration.operationType,
    binding: {
      version: reviewBindingVersion,
      tenantId,
      decisionId: context.decisionId,
      requestId: context.requestId,
      policyVersion: context.policyVersion,
      requestFingerprint: context.requestFingerprint,
    },
    review,
  };
}

// Firewall never executes the approved action itself. If a future adapter supplies
// an approval, it is accepted only as a bound, unexpired, single-use authorization
// for this exact tenant/request/policy/fingerprint. Even then, forwarding stays
// blocked until a separately approved execution integration exists.
export function verifyHumanApproval(escalation, expected) {
  const approval = escalation?.approval;
  if (!approval) return { state: 'NONE', reason: 'NO_BOUND_APPROVAL' };
  const expires = typeof approval.expires_at === 'string' ? Date.parse(approval.expires_at) : NaN;
  const bound = approval.tenant_id === expected.tenantId
    && approval.decision_id === expected.decisionId
    && approval.status === 'ACTIVE'
    && approval.decision === 'APPROVE'
    && approval.request_ref === expected.requestId
    && approval.policy_version === expected.policyVersion
    && approval.request_fingerprint === expected.requestFingerprint
    && Number.isFinite(expires) && expires > Date.now();
  return bound
    ? { state: 'BOUND' }
    : { state: 'INVALID', reason: 'APPROVAL_BINDING_MISMATCH' };
}

async function createReview(db, identity, tenantId, context) {
  const policy=(await db.query('SELECT * FROM public.aigas_hg_policies WHERE tenant_id=$1 FOR SHARE',[tenantId])).rows[0];
  const decision=(await db.query("SELECT * FROM public.aigas_fw_decisions WHERE tenant_id=$1 AND id=$2 AND action='ESCALATE'",[tenantId,context.decisionId])).rows[0];
  if(!decision || decision.request_id!==context.requestId || decision.request_fingerprint!==context.requestFingerprint || decision.policy_version!==context.policyVersion) throw Error('REVIEW_BINDING_MISMATCH');
  const payload={decision_id:decision.id,rule_id:decision.rule_id,rule_version:decision.rule_version,request_fingerprint:decision.request_fingerprint};
  const data={tenant_id:tenantId,requester_id:identity.userId,operation_type:context.operationType,subject_ref:decision.id,payload,policy_version:policy.version};
  const id=randomUUID();
  const review=(await db.query(`INSERT INTO public.aigas_hg_requests(id,tenant_id,requester_id,title,description,reason,operation_scope,operation_type,subject_ref,payload,payload_digest,policy_version,provider_ref,expires_at)
    VALUES($1,$2,$3,'Firewall escalation review','Metadata-only policy review','Independent review required',$4,$4,$5,$6,$7,$8,'aigas-kernel',clock_timestamp()+make_interval(mins=>$9)) RETURNING *`,
    [id,tenantId,identity.userId,context.operationType,decision.id,payload,binding(data),policy.version,policy.pending_minutes])).rows[0];
  await recordIntegratedReviewCreation(db,identity,tenantId,id,policy.version);
  return {...review,review_policy_version:policy.version,policy_version:context.policyVersion,request_ref:context.requestId,request_fingerprint:context.requestFingerprint};
}
