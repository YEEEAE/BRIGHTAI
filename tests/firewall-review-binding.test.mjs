import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { enforceDecision } from '../src/server/firewall/guard.mjs';
import { reviewBindingVersion } from '../src/server/firewall/escalation.mjs';

test('pending Firewall review requires the exact tenant/request/policy/fingerprint and operation', async () => {
  const tenantId = randomUUID(), requestId = randomUUID(), decisionId = randomUUID();
  const policyVersion = 'kernel:synthetic', requestFingerprint = 'a'.repeat(64);
  const review = { id: randomUUID(), status: 'PENDING', tenant_id: tenantId,
    subject_ref: decisionId, request_ref: requestId, policy_version: policyVersion,
    request_fingerprint: requestFingerprint, operation_type: 'SYNTHETIC_REVIEW_ONLY' };
  const escalation = { requested: true, code: 'HUMAN_GATE_CONFIGURED', operation_type: review.operation_type,
    binding: { version: reviewBindingVersion, tenantId, decisionId, requestId, policyVersion, requestFingerprint }, review };
  const input = { decision: { id: decisionId, action: 'ESCALATE' }, tenantId, requestId, policyVersion,
    requestFingerprint, kernelPolicy: { decision: 'ALLOW' }, escalation };
  let calls = 0;
  const check = data => enforceDecision(data, { resolveProvider: () => { calls++; throw new Error('must never resolve'); } });
  assert.equal((await check(input)).code, 'REVIEW_PENDING');
  for (const [field, value] of Object.entries({ tenant_id: randomUUID(), request_ref: randomUUID(),
    request_fingerprint: 'b'.repeat(64), operation_type: 'OTHER', status: 'APPROVED', id: 'invalid' })) {
    const result = await check({ ...input, escalation: { ...escalation, review: { ...review, [field]: value } } });
    assert.equal(result.code, 'HUMAN_GATE_REVIEW_UNBOUND', field);
  }
  const mismatch = await check({ ...input, escalation: { ...escalation,
    binding: { ...escalation.binding, requestFingerprint: 'b'.repeat(64) } } });
  assert.equal(mismatch.code, 'HUMAN_GATE_REVIEW_UNBOUND');
  assert.equal(calls, 0);
});
