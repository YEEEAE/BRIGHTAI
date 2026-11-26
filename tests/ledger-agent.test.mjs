import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createLedgerAgent } from '../src/server/ledger/ledger-agent.mjs';

test('agent delegates tenant-scoped authorization and reports only retrieved evidence', async () => {
  const userId = randomUUID(), eventId = randomUUID();
  let call;
  const agent = createLedgerAgent(async (...args) => {
    call = args;
    return { event: { event_id: eventId, source: 'kernel', event_type: 'kernel.audit.recorded', policy_version: 'v1', created_at: '2026-01-01', metadata_json: { synthetic: false }, integrity_hash: 'secret' }, integrity: 'MATCH', chain: { result: 'MATCH' }, state: 'VERIFIED', mismatch: false, reasons: [], assurance: 'INTEGRITY_ONLY_NO_SIGNATURE' };
  });
  const result = await agent({ userId }, 'workspace', eventId);
  assert.equal(call[1], 'workspace');
  assert.equal(call[2], 'detail');
  assert.equal(call[5], eventId);
  assert.equal(result.assurance, 'INTEGRITY_ONLY_NO_SIGNATURE');
  assert.equal(result.state, 'UNVERIFIED');
  assert.equal(result.prefix_state, 'VERIFIED');
  assert.ok(result.reasons.includes('SIGNATURE_NOT_VERIFIED'));
  assert.doesNotMatch(JSON.stringify(result), /secret/);
  assert.match(result.interpretation, /لا يثبت/);
});

test('agent propagates access denial and refuses missing or mismatched evidence', async () => {
  const eventId = randomUUID(), identity = { userId: randomUUID() };
  const denied = createLedgerAgent(async () => { throw Object.assign(new Error('denied'), { status: 403 }); });
  await assert.rejects(denied(identity, 'other-tenant', eventId), { status: 403 });
  const missing = createLedgerAgent(async () => ({ event: { event_id: randomUUID() } }));
  await assert.rejects(missing(identity, 'workspace', eventId), { code: 'EVIDENCE_UNAVAILABLE' });
  await assert.rejects(missing(identity, 'workspace', 'invalid'), { code: 'INVALID_EVIDENCE_REQUEST' });
});
