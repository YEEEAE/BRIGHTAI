import { createHash } from 'node:crypto';
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
// UUID, effective policy, decision and, when registered, the exact tool tuple. The submitted text
// and its hash are excluded: decisions stay metadata-only. The request
// UUID cannot be reused, so a retry can never execute the same operation twice.
export function decisionFingerprint({ tenantId, actorUserId, requestId, policyVersion, result, enforced, toolCall = null, departmentId = null }) {
  return sha256(JSON.stringify(['aigas-fw-binding-v2', tenantId, actorUserId, requestId ?? null, policyVersion,
    enforced ? 'GUARD' : 'LAB', result.action, result.reason, result.rule_id, result.rule_version,
    result.matcher_id ?? null, result.matcher_version ?? null, result.warning_held === true, departmentId,
    toolCall ? toolCallFields.map(field => toolCall[field]) : null]));
}
