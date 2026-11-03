// Server-owned review-integration registry, deliberately empty.
//
// Human Gate 0004/0007 accepts only INTERNAL_DEMO_NOTE and KERNEL_WORKSPACE_RENAME,
// requires an enabled operator policy, and has no approved operation type or payload
// contract for reviewing Firewall decision content. Firewall intentionally does not
// store the reviewed text, so a reviewer could not decide on a bound task. Until an
// approved mapping with a server-side create(db, identity, tenantId, context) adapter
// exists:
//   - no Human Gate request is created,
//   - ESCALATE never reaches a provider,
//   - the response says HUMAN_GATE_NOT_CONFIGURED.
// An entry must bind exact tenant IDs, an approval reference/expiry, one approved
// operationType and a create() adapter that persists a PENDING request atomically.
const approvedReviewIntegrations = Object.freeze([]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const reviewBindingVersion = 'aigas-review-binding-v1';

function findIntegration(tenantId) {
  return approvedReviewIntegrations.find(item => Array.isArray(item.tenantIds)
    && item.tenantIds.includes(tenantId)
    && typeof item.approvalReference === 'string' && item.approvalReference.length > 0
    && typeof item.approvedUntil === 'string' && Number.isFinite(Date.parse(item.approvedUntil))
    && Date.parse(item.approvedUntil) > Date.now()
    && typeof item.operationType === 'string' && item.operationType.length > 0
    && typeof item.create === 'function') ?? null;
}

export function reviewIntegrationState(tenantId) {
  const integration = findIntegration(tenantId);
  const expired = approvedReviewIntegrations.some(item => Array.isArray(item.tenantIds) && item.tenantIds.includes(tenantId)
    && typeof item.approvalReference === 'string' && typeof item.approvedUntil === 'string'
    && Number.isFinite(Date.parse(item.approvedUntil)) && Date.parse(item.approvedUntil) <= Date.now());
  return integration
    ? { code: 'HUMAN_GATE_CONFIGURED', configured: true, dependencyStatus:'available', operation_type: integration.operationType }
    : { code: 'HUMAN_GATE_NOT_CONFIGURED', configured: false, dependencyStatus:expired?'expired':'not configured', operation_type: null, reason: 'NO_APPROVED_REVIEW_INTEGRATION' };
}

// A returned review must describe exactly this decision, tenant, operation type
// and policy version. A review for a previous decision or another workspace is
// never accepted as "pending for this request".
function reviewBound(review, tenantId, context, integration) {
  return !!review
    && review.status === 'PENDING'
    && uuidPattern.test(review.id ?? '')
    && (review.tenant_id === undefined || review.tenant_id === tenantId)
    && review.subject_ref === context.decisionId
    && review.operation_type === integration.operationType
    && review.policy_version === context.policyVersion;
}

// Called inside the Firewall transaction, after the ESCALATE decision, Kernel audit
// and any mandatory Ledger evidence. A configured adapter must insert the review
// request in the same transaction; a throw rolls the whole decision back (fail-closed).
export async function requestHumanReview(db, identity, tenantId, context) {
  const integration = findIntegration(tenantId);
  if (!integration) return { requested: false, ...reviewIntegrationState(tenantId), review: null, binding: null };
  const review = await integration.create(db, identity, tenantId, { ...context, operationType: integration.operationType });
  if (!reviewBound(review, tenantId, context, integration)) throw new Error('REVIEW_BINDING_MISMATCH');
  return {
    requested: true,
    code: 'HUMAN_GATE_CONFIGURED',
    configured: true,
    operation_type: integration.operationType,
    binding: {
      version: reviewBindingVersion,
      tenantId,
      decisionId: context.decisionId,
      requestId: context.requestId,
      policyVersion: context.policyVersion,
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
