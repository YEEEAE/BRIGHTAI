// Firewall — no-egress local verification harness.
//
// Purpose: prove the guard order (DENY/WARN/ESCALATE -> no adapter call; ALLOW ->
// evaluated text; REDACT -> redacted text only) and the fail-closed provider gate
// without a database, a network call, an API key or a deployed service.
//
// It is NOT a test suite and it does NOT prove runtime, staging, deployment, Kernel
// policy wiring, tenant isolation or provider approval. Run it only in an approved
// local/staging step:
//
//   node scripts/firewall-local-verify.mjs
//
// Exit code 0 means every local assertion passed. Any failure prints the case name
// and exits non-zero. No output contains the submitted synthetic text.
import assert from 'node:assert/strict';
import { evaluate } from '../src/server/firewall/core.mjs';
import { enforceDecision } from '../src/server/firewall/guard.mjs';
import { decisionFingerprint, policyReference } from '../src/server/firewall/binding.mjs';
import { createLocalSandboxAdapter } from '../src/server/firewall/local-adapter.mjs';

const tenantId = '11111111-1111-4111-8111-111111111111';
const actorUserId = '22222222-2222-4222-8222-222222222222';
const requestId = '33333333-3333-4333-8333-333333333333';
const decisionId = '44444444-4444-4444-8444-444444444444';
const kernelPolicy = Object.freeze({
  decision: 'ALLOW', action: 'ALLOW', reason: 'HARNESS_ALLOW', mandatory: false,
  obligations: [], policies: [], warnings: [],
});
const policyVersion = policyReference(kernelPolicy);

const rule = (id, action, pattern, priority) => ({
  id, tenant_id: tenantId, template: null, name: `harness-${id}`,
  match_type: 'CONTAINS', pattern, action, priority, enabled: true, version: 1,
});
const rules = [
  rule('55555555-5555-4555-8555-555555555551', 'DENY', 'DEMO-BLOCK', 10),
  rule('55555555-5555-4555-8555-555555555552', 'ESCALATE', 'DEMO-ESCALATE', 20),
  rule('55555555-5555-4555-8555-555555555553', 'REDACT', 'DEMO-ID-1234', 30),
  rule('55555555-5555-4555-8555-555555555554', 'WARN', 'DEMO-WARN', 40),
  rule('55555555-5555-4555-8555-555555555555', 'ALLOW', 'DEMO-PUBLIC', 50),
];

function decisionFor(text) {
  const result = evaluate(text, rules, { enforce: true });
  const requestFingerprint = decisionFingerprint({ tenantId, actorUserId, requestId, policyVersion, result, enforced: true });
  return {
    result,
    payload: {
      decision: { id: decisionId, action: result.action, reason: result.reason, rule_id: result.rule_id, rule_version: result.rule_version },
      tenantId, actorUserId, requestId, policyVersion, requestFingerprint,
      forwardText: ['ALLOW', 'REDACT'].includes(result.action) ? result.output : null,
      kernelPolicy, escalation: null,
    },
  };
}

const cases = [];
const check = (name, fn) => cases.push({ name, fn });
const ok = (condition, message) => assert.ok(condition, message);

check('DENY never reaches an adapter', async () => {
  let calls = 0;
  const { result, payload } = decisionFor('DEMO-BLOCK');
  assert.equal(result.action, 'DENY');
  const out = await enforceDecision(payload, { resolveProvider: () => { calls++; return createLocalSandboxAdapter(); } });
  assert.equal(out.httpStatus, 403); assert.equal(out.code, 'POLICY_BLOCKED');
  assert.equal(out.external_action_executed, false); assert.equal(calls, 0);
});

check('ESCALATE without an approved review integration stops', async () => {
  let calls = 0;
  const { payload } = decisionFor('DEMO-ESCALATE');
  const out = await enforceDecision(payload, { resolveProvider: () => { calls++; return createLocalSandboxAdapter(); } });
  assert.equal(out.httpStatus, 409); assert.equal(out.code, 'HUMAN_GATE_NOT_CONFIGURED');
  assert.equal(out.review_required, true); assert.equal(calls, 0);
});

check('WARN is never forwarded automatically', async () => {
  let calls = 0;
  const { payload } = decisionFor('DEMO-WARN');
  const out = await enforceDecision(payload, { resolveProvider: () => { calls++; return createLocalSandboxAdapter(); } });
  assert.equal(out.httpStatus, 409); assert.equal(out.code, 'WARNING_NOT_FORWARDED');
  assert.equal(calls, 0);
});

check('ALLOW forwards the evaluated text, sandbox is not external execution', async () => {
  const seen = [];
  const { payload } = decisionFor('DEMO-PUBLIC فقط');
  const adapter = createLocalSandboxAdapter();
  const out = await enforceDecision(payload, {
    resolveProvider: () => Object.freeze({ ...adapter, async generate(args) { seen.push(args); return adapter.generate(args); } }),
  });
  assert.equal(out.httpStatus, 200); assert.equal(out.execution_status, 'LOCAL_SANDBOX_COMPLETED');
  assert.equal(out.external_action_executed, false); assert.equal(out.provider_kind, 'LOCAL_SANDBOX');
  assert.equal(seen.length, 1); assert.equal(seen[0].text, 'DEMO-PUBLIC فقط');
  assert.equal(seen[0].tenantId, tenantId); assert.equal(seen[0].model, 'local-synthetic-v1');
  assert.equal(seen[0].localSandbox, true);
});

check('REDACT forwards only the redacted output', async () => {
  const seen = [];
  const { result, payload } = decisionFor('معرّف DEMO-ID-1234 داخل نص');
  assert.equal(result.action, 'REDACT');
  const adapter = createLocalSandboxAdapter();
  const out = await enforceDecision(payload, {
    resolveProvider: () => Object.freeze({ ...adapter, async generate(args) { seen.push(args); return adapter.generate(args); } }),
  });
  assert.equal(out.httpStatus, 200); assert.equal(out.execution_status, 'LOCAL_SANDBOX_COMPLETED');
  assert.equal(seen.length, 1);
  assert.ok(seen[0].text.includes('[نص منقّح]'));
  assert.ok(!seen[0].text.includes('DEMO-ID-1234'), 'raw identifier must not cross the adapter boundary');
});

check('an injected external adapter is refused', async () => {
  let calls = 0;
  const { payload } = decisionFor('DEMO-PUBLIC فقط');
  const external = { external: true, localSandbox: false, model: 'x', region: 'x', async generate() { calls++; return 'x'; } };
  const out = await enforceDecision(payload, { resolveProvider: () => external });
  assert.equal(out.httpStatus, 503); assert.equal(out.code, 'PROVIDER_NOT_CONFIGURED');
  assert.equal(calls, 0);
});

check('a broken binding blocks before provider lookup', async () => {
  let calls = 0;
  const { payload } = decisionFor('DEMO-PUBLIC فقط');
  const out = await enforceDecision({ ...payload, policyVersion: 'kernel:mismatch' }, {
    resolveProvider: () => { calls++; return createLocalSandboxAdapter(); },
  });
  assert.equal(out.httpStatus, 503); assert.equal(out.code, 'EXECUTION_BINDING_MISMATCH');
  assert.equal(calls, 0);
});

check('missing Kernel ALLOW blocks before provider lookup', async () => {
  let calls = 0;
  const { payload } = decisionFor('DEMO-PUBLIC فقط');
  const out = await enforceDecision({ ...payload, kernelPolicy: { ...kernelPolicy, decision: 'BLOCK' } }, {
    resolveProvider: () => { calls++; return createLocalSandboxAdapter(); },
  });
  assert.equal(out.httpStatus, 409); assert.equal(out.code, 'KERNEL_POLICY_REQUIRED');
  assert.equal(calls, 0);
});

let failed = 0;
for (const item of cases) {
  try { await item.fn(); console.log(`PASS ${item.name}`); }
  catch (error) { failed++; console.error(`FAIL ${item.name}: ${error.message}`); }
}
console.log(`\n${cases.length - failed}/${cases.length} local guard assertions passed. No network, database or provider was used.`);
if (failed) process.exitCode = 1;
