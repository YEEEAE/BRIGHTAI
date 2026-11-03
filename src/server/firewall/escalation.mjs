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
  return integration
    ? { code: 'HUMAN_GATE_CONFIGURED', configured: true, operation_type: integration.operationType }
    : { code: 'HUMAN_GATE_NOT_CONFIGURED', configured: false, operation_type: null, reason: 'NO_APPROVED_REVIEW_INTEGRATION' };
}

// Called inside the Firewall transaction, after the ESCALATE decision, Kernel audit
// and any mandatory Ledger evidence. A configured adapter must insert the review
// request in the same transaction; a throw rolls the whole decision back (fail-closed).
export async function requestHumanReview(db, identity, tenantId, context) {
  const integration = findIntegration(tenantId);
  if (!integration) return { requested: false, ...reviewIntegrationState(tenantId), review: null };
  const review = await integration.create(db, identity, tenantId, { ...context, operationType: integration.operationType });
  if (!review || review.status !== 'PENDING') throw new Error('REVIEW_NOT_PENDING');
  return { requested: true, code: 'HUMAN_GATE_CONFIGURED', configured: true, operation_type: integration.operationType, review };
}
