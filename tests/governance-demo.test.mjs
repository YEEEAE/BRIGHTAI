import assert from 'node:assert/strict';
import test from 'node:test';
import { createGovernanceSession, SESSION_DURATION } from '../src/demo/governance.mjs';

test('pack and risk decisions lead to asset-version-specific reviews and evidence', () => {
  const session = createGovernanceSession(100);
  const act = action => session.act({ assetId: 1, ...action }, 101);
  act({ type: 'check', sample: 'normal' });
  act({ type: 'check', sample: 'sensitive' });
  act({ type: 'policy', pack: 'supervision' });
  act({ type: 'check', sample: 'normal' });
  act({ type: 'assess', likelihood: 3, impact: 3 });
  assert.throws(() => act({ type: 'review', sourceId: 1, decision: 'APPROVED' }));
  assert.throws(() => act({ type: 'review', sourceId: 2, decision: 'APPROVED' }));
  for (const sourceId of [4, 5]) {
    act({ type: 'review', sourceId, decision: 'APPROVED' });
    assert.throws(() => act({ type: 'review', sourceId, decision: 'APPROVED' }));
  }
  assert.deepEqual(session.read(101).events.map(event => [event.version, event.result]), [
    [1, 'ALLOW'], [1, 'BLOCK'], [2, 'supervision'], [2, 'REVIEW_REQUIRED'],
    [2, 'HIGH'], [2, 'APPROVED'], [2, 'APPROVED'],
  ]);
  act({ type: 'policy', pack: 'privacy' });
  assert.throws(() => act({ type: 'review', sourceId: 5, decision: 'REJECTED' }));
});

test('fresh sessions do not share data and reject foreign references, including across assets', () => {
  const a = createGovernanceSession(100);
  const b = createGovernanceSession(100);
  const { assetId } = a.act({ type: 'add', template: 'intake' }, 101);
  a.act({ type: 'assess', assetId, likelihood: 3, impact: 3 }, 101);
  assert.throws(() => a.act({ type: 'review', assetId: 1, sourceId: 2, decision: 'REJECTED' }, 101));
  assert.throws(() => b.act({ type: 'record', assetId }, 101));
  assert.throws(() => b.act({ type: 'review', assetId: 1, sourceId: 2, decision: 'REJECTED' }, 101));
  assert.equal(b.read(101).events.length, 0);
  a.read(101).assets.length = 0;
  assert.equal(a.read(101).assets.length, 2);
});

test('session reaches a fixed expiry and clear prevents further reads and writes', () => {
  const session = createGovernanceSession(100);
  const deadline = 100 + SESSION_DURATION;
  session.act({ type: 'record', assetId: 1 }, deadline - 1);
  assert.throws(() => session.read(deadline));
  assert.throws(() => session.act({ type: 'record', assetId: 1 }, deadline - 1));
  const cleared = createGovernanceSession(100);
  cleared.close();
  assert.throws(() => cleared.read(101));
  assert.throws(() => cleared.act({ type: 'record', assetId: 1 }, 101));
});

test('invalid operations leave state intact and writes are bounded', () => {
  const session = createGovernanceSession(100);
  for (const action of [
    { type: 'add', template: 'custom input' },
    { type: 'check', sample: 'custom input' },
    { type: 'assess', likelihood: 0, impact: 9 },
    { type: 'execute' },
  ]) assert.throws(() => session.act({ assetId: 1, ...action }, 101));
  assert.equal(session.read(101).events.length, 0);
  for (let index = 0; index < 9; index++) session.act({ type: 'add', template: 'support' }, 101);
  assert.throws(() => session.act({ type: 'add', template: 'support' }, 101));
  for (let index = 9; index < 100; index++) session.act({ type: 'record', assetId: 1 }, 101);
  assert.throws(() => session.act({ type: 'record', assetId: 1 }, 101));
  assert.equal(session.read(101).events.length, 100);
});
