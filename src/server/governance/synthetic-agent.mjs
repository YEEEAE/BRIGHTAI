import { randomUUID } from 'node:crypto';
import { evaluate } from '../firewall/core.mjs';
import { enforceDecision } from '../firewall/guard.mjs';
import { decisionFingerprint, policyReference } from '../firewall/binding.mjs';
import { reviewBindingVersion, reviewBound } from '../firewall/escalation.mjs';
import { binding, decisionAllowed } from '../human-gate/core.mjs';
import { resolveKernelPolicy } from '../kernel/policies.mjs';

const tenantId = '10000000-0000-4000-8000-000000000001';
const actorUserId = '10000000-0000-4000-8000-000000000002';
const reviewerId = '10000000-0000-4000-8000-000000000003';
const policyId = '10000000-0000-4000-8000-000000000004';
const operationType = 'FIREWALL_ESCALATION_REVIEW';
const baseline = Object.freeze({ read: 'ALLOW', delete: 'DENY', publish: 'ESCALATE' });

export function syntheticLimits() {
  return Object.entries(baseline).map(([action, mode]) => ({ tool: 'fixture-catalog', action, mode }));
}

export async function simulateAgentAction(registry, assessmentId, tool, action) {
  const { effective, reviewOverdue, asset, pack } = registry.exportAssessment(assessmentId);
  if (!effective || asset.kind !== 'AGENT' || pack.id !== 'aigas.synthetic-baseline') {
    throw Error('Current synthetic agent baseline assessment required');
  }

  const registered = asset.limits.find(limit => limit.tool === tool && limit.action === action)?.mode;
  const minimum = tool === 'fixture-catalog' && Object.hasOwn(baseline, action) ? baseline[action] : 'DENY';
  const enterprise = { id: policyId, scope: 'ENTERPRISE', effect: 'ALLOW', version: pack.version,
    checksum: assessmentId, conditions: {}, obligations: [] };
  const blocked = reviewOverdue || minimum === 'DENY' || !registered || registered === 'DENY';
  const kernelPolicy = resolveKernelPolicy(blocked
    ? [{ ...enterprise, effect: 'HARD_DENY', is_mandatory: true }]
    : [enterprise]);

  const requestId = randomUUID();
  const decisionId = randomUUID();
  const rule = { id: randomUUID(), version: pack.version, enabled: true, name: 'Synthetic action boundary',
    match_type: 'CONTAINS', pattern: 'fixture-action', priority: 1,
    action: blocked ? 'DENY' : minimum === 'ESCALATE' || registered === 'ESCALATE' ? 'ESCALATE' : 'ALLOW' };
  const decision = { ...evaluate('fixture-action', [rule], { enforce: true }), id: decisionId };
  const policyVersion = policyReference(kernelPolicy);
  const requestFingerprint = decisionFingerprint({
    tenantId, actorUserId, requestId, policyVersion, result: decision, enforced: true,
  });
  let escalation = null;
  if (decision.action === 'ESCALATE') {
    const review = {
      id: randomUUID(), tenant_id: tenantId, requester_id: actorUserId, subject_ref: decisionId,
      status: 'PENDING', operation_type: operationType, request_ref: requestId,
      policy_version: policyVersion, request_fingerprint: requestFingerprint,
    };
    const payload = { decision_id: decisionId, rule_id: rule.id, rule_version: rule.version,
      request_fingerprint: requestFingerprint };
    review.payload_digest = binding({ ...review, policy_version: 1, payload });
    review.review_policy_version = 1;
    escalation = {
      requested: true, code: 'HUMAN_GATE_CONFIGURED', operation_type: operationType, review,
      binding: { version: reviewBindingVersion, tenantId, decisionId, requestId, policyVersion, requestFingerprint },
    };
  }

  let localCalls = 0;
  const result = await enforceDecision({
    decision, tenantId, actorUserId, requestId, policyVersion, requestFingerprint,
    forwardText: decision.output, kernelPolicy, escalation,
    outputRules: [{ ...rule, pattern: 'Synthetic fixture read', action: 'ALLOW' }],
  }, {
    resolveProvider: () => ({
      localSandbox: true, external: false,
      generate() {
        localCalls++;
        return 'Synthetic fixture read';
      },
    }),
  });
  const review = result.review ?? null;
  return {
    synthetic: true, assessmentId, assetVersion: asset.version, packVersion: pack.version,
    decisionId, ruleId: rule.id, ruleVersion: rule.version, requestId, requestFingerprint, policyVersion,
    kernelDecision: kernelPolicy.decision, firewallAction: decision.action, review, localCalls,
    httpStatus: result.httpStatus, code: result.code ?? null, executionStatus: result.execution_status,
    externalActionExecuted: result.external_action_executed,
    independentReview: review ? {
      currentBinding: reviewBound(review, tenantId, { decisionId, requestId, policyVersion, requestFingerprint }, { operationType }),
      staleBinding: reviewBound(review, tenantId, { decisionId, requestId, policyVersion: 'superseded', requestFingerprint }, { operationType }),
      requesterAllowed: decisionAllowed(review, actorUserId, { separation_of_duties: false }, { allowed: true }),
      reviewerEligible: decisionAllowed(review, reviewerId, { separation_of_duties: false }, { allowed: true }),
    } : null,
  };
}
