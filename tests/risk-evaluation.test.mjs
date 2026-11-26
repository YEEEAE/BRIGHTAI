import assert from 'node:assert/strict';
import test from 'node:test';
import { createGovernanceSession, SESSION_DURATION } from '../src/demo/governance.mjs';
import { replayEvaluation } from '../src/server/risk-engine/evaluation.mjs';

test('classifier proportions reproduce confusion counts and withhold insufficient rates', () => {
  const disclosure=replayEvaluation().disclosure;
  assert.equal(disclosure.live_model_run,false);
  assert.equal(disclosure.drift.status,'NOT_COMPARABLE');
  assert.equal(disclosure.fairness.minimum_group_size,20);
  const { classifier: [all, a, b, c] } = replayEvaluation();
  assert.deepEqual(all.counts, { tp: 30, fp: 12, tn: 31, fn: 10 });
  assert.equal(all.metrics.precision.value, 30 / 42);
  assert.equal(all.metrics.recall.value, 30 / 40);
  assert.equal(all.metrics.fpr.value, 12 / 43);
  assert.equal(all.metrics.fnr.value, 10 / 40);
  assert.equal(all.metrics.accuracy.value, 61 / 83);
  assert.equal(a.metrics.fpr.value, 4 / 20);
  assert.equal(b.metrics.fpr.value, 8 / 20);
  assert.equal(c.metrics.accuracy.value, null);
  assert.equal(c.metrics.accuracy.status, 'small-group');
  assert.deepEqual(c.metrics.recall, { numerator: 0, denominator: 0, value: null, status: 'zero-denominator' });
});

test('language and agent measures preserve the difference between actual and expected dispositions', () => {
  const { language: [llm, agent], sources } = replayEvaluation();
  assert.equal(llm.metrics.taskSuccess.value, 2 / 3);
  assert.equal(llm.metrics.policySafety.value, 2 / 3);
  assert.equal(llm.metrics.expectedRefusal.value, 1 / 2);
  assert.equal(llm.metrics.meanLatencyMs.value, 680 / 3);
  assert.equal(agent.metrics.policySafety.value, 1);
  assert.equal(agent.metrics.expectedRefusal.value, 0);
  assert.equal(agent.metrics.escalation.value, 2 / 3);
  assert.equal(agent.metrics.expectedEscalation.value, 1);
  assert.equal(llm.metrics.expectedEscalation.value, null);
  assert.equal(sources.judge, 'not-run');
});

test('replay records versioned findings and reruns without changing risk or crossing session boundaries', () => {
  const session = createGovernanceSession(100);
  const foreign = createGovernanceSession(100);
  const act = (action, at) => session.act({ assetId: 1, ...action }, at);
  act({ type: 'assess', likelihood: 3, impact: 3 }, 101);
  const original = session.read(101).events[0];
  act({ type: 'replay', ignored: 'custom text' }, 102);
  act({ type: 'policy', pack: 'supervision' }, 103);
  act({ type: 'replay' }, 104);
  assert.throws(() => act({ type: 'replay', assetId: 2 }, 105));
  const [risk, first, , second] = session.read(105).events;
  assert.deepEqual(risk, original);
  assert.equal(first.at, 102);
  assert.equal(first.version, 1);
  assert.equal(first.previousRunId, null);
  assert.equal(second.previousRunId, first.id);
  assert.equal(second.version, 2);
  assert.equal(second.policyPack, 'supervision');
  assert.equal(second.evidence.mode, 'synthetic-replay');
  assert.equal(Date.parse(second.evidence.findings[0].dueAt), 104 + 7 * 86400000);
  assert.equal(JSON.stringify(second).includes('custom text'), false);
  second.evidence.findings.pop();
  assert.equal(session.read(105).events.at(-1).evidence.findings.length, 3);
  assert.equal(foreign.read(105).events.length, 0);
  assert.throws(() => act({ type: 'replay' }, 100 + SESSION_DURATION));
});

test('dated synthetic cases reproduce distinct replay results without implying live monitoring', async () => {
  const { replayHistory } = await import('../src/server/risk-engine/evaluation.mjs');
  const [first, second] = replayHistory();
  assert.notEqual(first.dataset, second.dataset);
  assert.notEqual(first.model, second.model);
  assert.equal(first.mode, 'synthetic-replay');
  assert.deepEqual(first.result.counts, { tp: 2, fp: 1, tn: 3, fn: 2 });
  assert.deepEqual(second.result.counts, { tp: 3, fp: 1, tn: 3, fn: 1 });
  assert.equal(first.result.metrics.accuracy.value, 5 / 8);
  assert.equal(second.result.metrics.accuracy.value, 6 / 8);
});
