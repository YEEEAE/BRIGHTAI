import { createHash } from 'node:crypto';

export const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');

// Effective Kernel policy reference: the exact policy versions/checksums that allowed
// the decision, collapsed into one opaque, comparable value.
export function policyReference(kernelPolicy) {
  const evidence = (kernelPolicy?.policies ?? [])
    .map(item => [item.policy_id, item.version, item.checksum ?? null])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return `kernel:${sha256(JSON.stringify(evidence))}`;
}

// Durable binding over the server-selected tenant and actor, the single-use request
// UUID, the effective policy reference and the decision outcome. The submitted text
// and its hash are deliberately excluded: decisions stay metadata-only. The request
// UUID cannot be reused, so a retry can never execute the same operation twice.
export function decisionFingerprint({ tenantId, actorUserId, requestId, policyVersion, result, enforced }) {
  return sha256(JSON.stringify(['aigas-fw-binding-v1', tenantId, actorUserId, requestId ?? null, policyVersion,
    enforced ? 'GUARD' : 'LAB', result.action, result.reason, result.rule_id, result.rule_version]));
}
