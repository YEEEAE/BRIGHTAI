import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { assetKinds } from '../../../src/server/governance/contract.mjs';
import { internalPack } from '../../../src/server/governance/internal-pack.mjs';
import { createGovernanceRegistry } from '../../../src/server/governance/registry.mjs';
import { simulateAgentAction, syntheticLimits } from '../../../src/server/governance/synthetic-agent.mjs';
import { evaluate } from '../../../src/server/risk-engine/core.mjs';

export function fixtureAsset(kind) {
  return {
    synthetic: true, kind, id: `fixture-${kind.toLowerCase().replace('_', '-')}`, version: 1,
    owner: 'fixture-owner', purpose: 'Exercise the local synthetic governance contract.',
    dataSource: { kind: 'SYNTHETIC', reference: 'fixture-catalog-v1' },
    limits: kind === 'AGENT' ? syntheticLimits() : [],
    review: { reviewer: 'fixture-reviewer', dueOn: '2026-12-25' },
  };
}

export async function run() {
  const registry = createGovernanceRegistry({ today: () => '2026-11-25' });
  const pack = registry.publishPack(internalPack());
  const inventory = assetKinds.map(kind => registry.registerAsset(fixtureAsset(kind)));
  const assessments = inventory.map(asset => registry.applyPack(asset.id, pack.id));
  const agent = assessments.find(item => item.asset.kind === 'AGENT');
  const [allowed, blocked, review, unknown] = await Promise.all(
    ['read', 'delete', 'publish', 'unknown'].map(action => simulateAgentAction(registry, agent.id, 'fixture-catalog', action))
  );

  assert.equal(allowed.executionStatus, 'LOCAL_SANDBOX_COMPLETED');
  assert.equal(allowed.localCalls, 1);
  for (const decision of [blocked, unknown]) {
    assert.equal(decision.kernelDecision, 'BLOCK');
    assert.equal(decision.firewallAction, 'DENY');
    assert.equal(decision.httpStatus, 403);
    assert.equal(decision.localCalls, 0);
  }
  assert.equal(review.code, 'REVIEW_PENDING');
  assert.equal(review.localCalls, 0);
  assert.deepEqual(review.independentReview, {
    currentBinding: true, staleBinding: false, requesterAllowed: false, reviewerEligible: true,
  });
  assert.ok([allowed, blocked, review, unknown].every(item => item.externalActionExecuted === false));

  const risk = { likelihood: 2, impact: 3, rationale: 'Fixture publication has simulated material impact.', ...evaluate(2, 3) };
  assert.equal(risk.requires_human_review, true);
  const evidence = {
    inventory: { artifact: agent.asset, summary: 'Registry revision, ownership and review are recorded.' },
    'agent-boundary': { artifact: { allowed, blocked, review, unknown }, summary: 'All four synthetic scenarios produced their expected decisions.' },
    risk: { artifact: risk, summary: 'Versioned draft risk scenario requires human review.' },
    'human-review': { artifact: review, summary: 'Pending review matches the current action and prevents self-approval.' },
    evidence: { artifact: agent, summary: 'Initial export contains the five required controls and check references.' },
    'secure-chat': { artifact: { synthetic: true, model: 'fixture-model', decision: 'fixture-policy-decision' }, summary: 'Synthetic chat model and policy references are recorded.' },
  };
  const artifacts = {};
  for (const check of agent.checks) {
    const { artifact, summary } = evidence[check.id];
    const reference = `fixture.${check.id}`;
    artifacts[reference] = artifact;
    const pending = registry.submitEvidence(agent.id, check.check.id, check.revision, check.owner,
      { synthetic: true, kind: check.expectedEvidence.kind, reference, summary });
    registry.reviewCheck(agent.id, check.check.id, pending.revision, {
      reviewer: agent.asset.review.reviewer, outcome: 'Pass', reason: summary,
    });
  }
  const gate = registry.gate(agent.id);
  assert.equal(gate.passed, true);
  const exportBeforeUpgrade = registry.exportAssessment(agent.id);
  registry.publishPack({ ...pack, version: 2 });
  const superseded = registry.exportAssessment(agent.id);
  const replacement = registry.applyPack(agent.asset.id, pack.id);
  assert.ok(superseded.checks.every(item => item.status === 'Needs Review' && item.previousStatus === 'Pass'));
  assert.ok(replacement.checks.every(item => item.status === 'Needs Evidence'));
  return { inventory, assessments, exportBeforeUpgrade, gate, superseded, replacement, artifacts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await run(), null, 2));
}
