import test from 'node:test';
import assert from 'node:assert/strict';
import { createGovernanceSession } from '../src/demo/governance.mjs';
import { exportEvidence, verifyEvidence } from '../src/demo/governance-evidence.mjs';
import { verify } from '../public/downloads/governance-demo-verifier.mjs';

test('unsigned demo export is independently checked and changes are detected', async () => {
  const session = createGovernanceSession(100);
  session.act({ type: 'record', assetId: 1 }, 101);
  session.act({ type: 'assess', assetId: 1, likelihood: 3, impact: 3 }, 102);
  const bundle = await exportEvidence(session.read(102), 'synthetic-correlation');
  assert.equal(await verifyEvidence(bundle), true);
  assert.equal(verify(bundle), true);
  const tampered = structuredClone(bundle);
  tampered.entries[0].event.result = 'ALTERED';
  assert.equal(await verifyEvidence(tampered), false);
  assert.equal(verify(tampered), false);
  assert.equal(verify({ ...bundle, entries: bundle.entries.slice(0, 1) }), false);
});
