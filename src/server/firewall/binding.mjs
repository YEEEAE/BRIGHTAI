import { createHash, createHmac } from 'node:crypto';
import { policyVersion } from '../../shared/firewall-policy.mjs';
import { registryVersion, toolCallFields } from './agent-registry.mjs';

export const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');

// Effective Kernel policy reference: the exact policy versions/checksums that allowed
// the decision, collapsed into one opaque, comparable value.
const ruleVersions = rules => rules.filter(rule => rule.enabled)
  .map(rule => [rule.id, rule.version]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

export function evaluatorReference(rules) {
  return `${policyVersion}:${sha256(JSON.stringify(ruleVersions(rules)))}`;
}

export function policyReference(kernelPolicy, rules = []) {
  // Evidence rows carry `policyId`; `policy_id` is accepted for stored decisions
  // written before the evidence shape was extended.
  const evidence = (kernelPolicy?.policies ?? [])
    .map(item => [item.policyId ?? item.policy_id, item.version, item.checksum ?? null])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return `kernel:${sha256(JSON.stringify([registryVersion, evidence, evaluatorReference(rules)]))}`;
}

// Durable binding over the server-selected tenant and actor, the single-use request
// UUID, effective policy, decision and, when registered, the exact tool tuple.
// A configured human review also binds a keyed commitment to payload and grant;
// only the outer fingerprint is stored. Request UUIDs remain single use.
export function decisionFingerprint({ tenantId, actorUserId, requestId, policyVersion, result, enforced, toolCall = null, departmentId = null, reviewCommitment = null, reviewGrant = null }) {
  if (reviewCommitment && !/^[0-9a-f]{64}$/.test(reviewGrant ?? '')) throw Error('REVIEW_GRANT_BINDING_REQUIRED');
  const digest = sha256(JSON.stringify([reviewCommitment ? 'aigas-fw-binding-v3' : 'aigas-fw-binding-v2', tenantId, actorUserId, requestId ?? null, policyVersion,
    enforced ? 'GUARD' : 'LAB', result.action, result.reason, result.rule_id, result.rule_version,
    result.matcher_id ?? null, result.matcher_version ?? null, result.warning_held === true, departmentId,
    toolCall ? toolCallFields.map(field => toolCall[field]) : null, ...(reviewCommitment ? [reviewCommitment] : [])]));
  return reviewCommitment ? reviewGrant.slice(0,32) + digest.slice(0,32) : digest;
}

// The keyed commitment stays inside the outer fingerprint; plaintext and grant
// details are never saved. A deployment must provision and retain its own key.
function grantFields(grant) {
  const instant = value => value == null ? null : new Date(value).toISOString();
  return [grant.product_slug, grant.approval_reference, grant.access_kind,
    instant(grant.approved_at), instant(grant.expires_at), instant(grant.revoked_at)];
}
export function reviewCommitment({ tenantId, actorUserId, requestId, payload, grant }, key = process.env.AIGAS_FIREWALL_REVIEW_BINDING_KEY) {
  if (typeof key !== 'string' || Buffer.byteLength(key, 'utf8') < 32 || !grant || typeof grant !== 'object') throw Error('REVIEW_BINDING_NOT_CONFIGURED');
  return createHmac('sha256', key).update(JSON.stringify(['firewall-review-v1', tenantId, actorUserId, requestId, payload, grantFields(grant)])).digest('hex');
}
export function reviewGrantCommitment({ tenantId, actorUserId, requestId, grant }, key = process.env.AIGAS_FIREWALL_REVIEW_BINDING_KEY) {
  if (typeof key !== 'string' || Buffer.byteLength(key, 'utf8') < 32 || !grant || typeof grant !== 'object') throw Error('REVIEW_BINDING_NOT_CONFIGURED');
  return createHmac('sha256', key).update(JSON.stringify(['firewall-review-grant-v1', tenantId, actorUserId, requestId, grantFields(grant)])).digest('hex');
}
