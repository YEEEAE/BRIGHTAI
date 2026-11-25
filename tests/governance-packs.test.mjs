import assert from 'node:assert/strict';
import test from 'node:test';
import { digest } from '../src/server/ledger/core.mjs';
import { resolveKernelPolicy } from '../src/server/kernel/policies.mjs';
import { createGovernanceRegistry } from '../src/server/governance/registry.mjs';
import { internalPack } from '../src/server/governance/internal-pack.mjs';
import { simulateAgentAction } from '../src/server/governance/synthetic-agent.mjs';
import { fixtureAsset, run } from '../Audit/governance-packs-2026-11-25/run.mjs';

function setup(kind = 'AGENT') {
  let date = '2026-11-25';
  const registry = createGovernanceRegistry({ today: () => date });
  const asset = registry.registerAsset(fixtureAsset(kind));
  const pack = registry.publishPack(internalPack());
  const record = registry.applyPack(asset.id, pack.id);
  return { registry, asset, pack, record, setDate: value => { date = value; } };
}

test('synthetic run binds every decision, exports evidence and invalidates on pack upgrade', async () => {
  const result = await run();
  assert.equal(result.inventory.length, 5);
  const { sha256, ...body } = result.exportBeforeUpgrade;
  assert.equal(sha256, digest(JSON.stringify(body)));
  for (const check of body.checks) assert.ok(result.artifacts[check.evidence.reference]);
  assert.equal(result.superseded.effective, false);
  assert.equal(result.replacement.pack.version, 2);
});

test('pack application is idempotent and N/A cannot be edited or satisfy an empty group', () => {
  const { registry, asset, pack, record } = setup('VENDOR');
  assert.deepEqual(registry.applyPack(asset.id, pack.id), record);
  const row = record.checks.find(item => item.id === 'agent-boundary');
  assert.equal(row.status, 'N/A');
  assert.match(row.reason, /outside/);
  assert.throws(() => registry.submitEvidence(record.id, row.check.id, 0, row.owner, {}), /out of scope/);
  assert.equal(registry.gate(record.id).byProduct.firewall.meetsThreshold, false);
});

test('evidence supports independent review, revisions, disposition and resubmission', () => {
  const { registry, record } = setup();
  const [row] = record.checks;
  const submit = (revision, owner = row.owner) => registry.submitEvidence(record.id, row.check.id, revision, owner,
    { synthetic: true, kind: row.expectedEvidence.kind, reference: 'fixture.inventory', summary: 'Fixture evidence.' });
  const review = (revision, outcome, reviewer = record.asset.review.reviewer) =>
    registry.reviewCheck(record.id, row.check.id, revision, { reviewer, outcome, reason: 'Reviewed fixture evidence.' });
  assert.throws(() => submit(0, 'visitor'), /owner/);
  assert.equal(submit(0).status, 'Needs Review');
  assert.throws(() => review(1, 'Pass', row.owner), /independent/);
  assert.throws(() => submit(0), /conflict/);
  assert.equal(review(1, 'Fail').status, 'Fail');
  assert.ok(registry.gate(record.id).openP0.includes(row.id));
  assert.equal(submit(2).history.at(-1).status, 'Fail');
  assert.equal(review(3, 'Needs Evidence').status, 'Needs Evidence');
  assert.equal(submit(4).status, 'Needs Review');
  assert.equal(review(5, 'Pass').status, 'Pass');
});

test('future release is inactive until effective and old results become read-only', async () => {
  const { registry, asset, pack, record, setDate } = setup();
  assert.throws(() => registry.publishPack({ ...pack, requirements: [] }));
  assert.throws(() => registry.publishPack({ ...pack, source: { ...pack.source, reference: 'different' } }), /immutable/);
  registry.publishPack({ ...pack, version: 2, effectiveOn: '2026-11-26' });
  assert.equal(registry.applyPack(asset.id, pack.id).id, record.id);
  setDate('2026-11-26');
  assert.equal(registry.applyPack(asset.id, pack.id).pack.version, 2);
  assert.equal(registry.gate(record.id).passed, false);
  assert.throws(() => registry.reviewCheck(record.id, 'check.inventory', 0, {}), /superseded/);
  await assert.rejects(simulateAgentAction(registry, record.id, 'fixture-catalog', 'read'), /Current/);
});

test('asset revisions cannot weaken the baseline or reuse old action evidence', async () => {
  const { registry, asset, pack, record } = setup();
  const allowedBefore = await simulateAgentAction(registry, record.id, 'fixture-catalog', 'read');
  const limits = asset.limits.map(limit => ({ ...limit, mode: 'ALLOW' }));
  limits.push({ tool: 'fixture-catalog', action: 'constructor', mode: 'ALLOW' });
  assert.throws(() => registry.registerAsset({ ...asset, limits }), /immutable/);
  registry.registerAsset({ ...asset, version: 2, limits });
  assert.equal(registry.exportAssessment(record.id).effective, false);
  const updated = registry.applyPack(asset.id, pack.id);
  const allowedAfter = await simulateAgentAction(registry, updated.id, 'fixture-catalog', 'read');
  assert.notEqual(allowedAfter.policyVersion, allowedBefore.policyVersion);
  for (const action of ['delete', 'constructor']) {
    assert.equal((await simulateAgentAction(registry, updated.id, 'fixture-catalog', action)).firewallAction, 'DENY');
  }
  assert.equal((await simulateAgentAction(registry, updated.id, 'fixture-catalog', 'publish')).code, 'REVIEW_PENDING');
});

test('Kernel gives an immutable deny precedence regardless of rule order', () => {
  const rules = [
    { id: 'a', scope: 'ENTERPRISE', version: 1, effect: 'ALLOW' },
    { id: 'b', scope: 'USER', version: 1, effect: 'HARD_DENY', is_mandatory: true },
    { id: 'c', scope: 'PRODUCT', version: 1, effect: 'ALLOW' },
  ];
  const result = resolveKernelPolicy(rules);
  assert.deepEqual(result, resolveKernelPolicy([...rules].reverse()));
  assert.equal(result.decision, 'BLOCK');
  assert.equal(result.action, 'DENY');
});

test('gate requires 80 percent per axis and product plus all critical conditions', async () => {
  const { registry, asset, pack, setDate } = setup();
  const requirements = [...pack.requirements];
  const template = requirements.find(item => item.id === 'risk');
  for (let index = 1; index <= 4; index++) {
    requirements.push({ ...template, id: `risk-extra-${index}`, check: { ...template.check, id: `check.risk-extra-${index}` },
      critical: false, severity: 'STANDARD' });
  }
  registry.publishPack({ ...pack, version: 2, requirements });
  const record = registry.applyPack(asset.id, pack.id);
  const pass = row => {
    const pending = registry.submitEvidence(record.id, row.check.id, 0, row.owner,
      { synthetic: true, reference: 'fixture.evidence', kind: row.expectedEvidence.kind, summary: 'Fixture evidence.' });
    registry.reviewCheck(record.id, row.check.id, pending.revision,
      { reviewer: asset.review.reviewer, outcome: 'Pass', reason: 'Reviewed fixture.' });
  };
  record.checks.filter(row => !['risk-extra-3', 'risk-extra-4'].includes(row.id)).forEach(pass);
  assert.equal(registry.gate(record.id).byAxis.risk.meetsThreshold, false);
  assert.equal(registry.gate(record.id).passed, false);
  pass(record.checks.find(row => row.id === 'risk-extra-3'));
  assert.deepEqual(registry.gate(record.id).byProduct['risk-engine'], { pass: 4, total: 5, meetsThreshold: true });
  assert.equal(registry.gate(record.id).passed, true);
  setDate('2026-12-26');
  assert.equal(registry.gate(record.id).passed, false);
  const expired = await simulateAgentAction(registry, record.id, 'fixture-catalog', 'read');
  assert.equal(expired.firewallAction, 'DENY');
  assert.equal(expired.localCalls, 0);
});
