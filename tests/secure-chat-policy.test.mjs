import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { authorizeChatContext, protectContext } from '../src/server/secure-chat/integration.mjs';
import { providerState, providerConfiguration } from '../src/server/secure-chat/adapter.mjs';

import { syntheticChatModel } from './helpers/secure-chat-model.mjs';

const rule = (action, pattern, id = action) => ({ id, name: 'Synthetic rule', match_type: 'CONTAINS', pattern, action, priority: 10, enabled: true, version: 1 });
const rules = [rule('ALLOW', 'SYNTHETIC'), rule('REDACT', 'DEMO-ID'), rule('DENY', 'DEMO-BLOCK'), rule('ESCALATE', 'DEMO-REVIEW'), rule('WARN', 'DEMO-WARN')];

test('provider boundary requires readable policy audit evidence', async () => {
  const tenantId = randomUUID(), identity = { userId: randomUUID() }, requestId = randomUUID();
  const model = { provider: 'groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions', providerModel: 'synthetic-model', region: 'synthetic-region' };
  const messages = [{ role: 'user', content: 'SYNTHETIC DEMO-ID' }];
  const fields = { conditions: {}, effect: 'ALLOW', mandatory: false, obligations: [] };
  const policy = { ...fields, is_mandatory: false, id: randomUUID(), scope: 'ENTERPRISE', version: 1,
    checksum: createHash('sha256').update(JSON.stringify(fields)).digest('hex') };
  let outage = true, calls = 0;
  const db = { async query(sql, args) {
    if (sql.startsWith('SELECT clock_timestamp()::text AS evaluated_at')) return { rows: [{ evaluated_at: '2026-11-24T00:00:00Z' }] };
    if (sql.startsWith('SELECT department_id') || sql.startsWith('SELECT 1 FROM public.aigas_policies')) return { rows: [], rowCount: 0 };
    if (sql.startsWith('SELECT p.id')) return { rows: [policy] };
    if (sql.includes('FROM public.aigas_fw_rules')) return { rows: rules };
    if (sql.startsWith('INSERT INTO public.aigas_kernel_policy_decisions')) return { rowCount: 1 };
    if (sql.startsWith('INSERT INTO public.aigas_audit_events')) {
      assert.equal(args[3], 'secure_chat.policy.allowed');
      assert.doesNotMatch(JSON.stringify(args), /DEMO-ID/);
      return { rowCount: 1 };
    }
    if (sql.startsWith('SELECT action,actor_user_id')) {
      if (outage) throw new Error('synthetic audit read failure');
      return { rowCount: 1, rows: [{ action: 'secure_chat.policy.allowed', actor_user_id: identity.userId }] };
    }
    if (sql.startsWith('SELECT role FROM public.aigas_lock_member')) return {rows:[{role:'MEMBER'}]};
    if (sql.startsWith("SELECT to_regclass('public.aigas_ld_evidence_requirements')")) {
      return {rows:[{requirements:false,events:false,access:false,grants:false}]};
    }
    if (sql === 'SAVEPOINT aig_optional_ledger_event' || sql === 'RELEASE SAVEPOINT aig_optional_ledger_event') return {};
    assert.fail(`Unexpected fixture query: ${sql}`);
  } };
  const fakeProvider = async outbound => {
    calls++;
    assert.doesNotMatch(JSON.stringify(outbound), /DEMO-ID/);
  };
  const run = async () => {
    const { error, outbound } = await authorizeChatContext(db, identity, tenantId, requestId, model, messages);
    if (error) throw error;
    await fakeProvider(outbound);
  };
  await assert.rejects(run, { code: 'EVIDENCE_UNAVAILABLE' });
  assert.equal(calls, 0);
  outage = false;
  await run();
  assert.equal(calls, 1);
});

test('policy inspects and redacts every role while preserving immutable context', () => {
  const messages = [{ role: 'user', content: 'SYNTHETIC contact synthetic@example.invalid' }, { role: 'assistant', content: 'SYNTHETIC DEMO-ID' }, { role: 'user', content: 'SYNTHETIC summary' }];
  const outbound = protectContext(messages, rules);
  assert.ok(Object.isFrozen(outbound) && outbound.every(Object.isFrozen));
  assert.equal(outbound[1].role, 'assistant');
  assert.doesNotMatch(JSON.stringify(outbound), /DEMO-ID|synthetic@example/);
  assert.match(messages[1].content, /DEMO-ID/);
});

test('history deny, escalation, warning, secret and missing allow all stop egress', () => {
  for (const content of ['SYNTHETIC DEMO-BLOCK', 'SYNTHETIC DEMO-REVIEW', 'SYNTHETIC DEMO-WARN', 'unmatched']) {
    assert.throws(() => protectContext([{ role: 'assistant', content }, { role: 'user', content: 'SYNTHETIC safe' }], rules), { code: 'CHAT_POLICY_DENIED' });
  }
  assert.throws(() => protectContext([{ role: 'assistant', content: 'SYNTHETIC password: synthetic-secret' }], rules), { code: 'SENSITIVE_CONTENT_BLOCKED' });
  assert.throws(() => protectContext([{ role: 'user', content: 'SYNTHETIC' }], []), { code: 'CHAT_POLICY_DENIED' });
  assert.throws(() => protectContext([], rules), { code: 'INVALID_HISTORY' });
  assert.throws(() => protectContext([{ role: 'user', content: 'SYNTHETIC' + 'x'.repeat(4000) }], rules), { code: 'CONTEXT_LIMIT' });
});

test('redaction cannot become an implicit allow or expose a hidden deny', () => {
  assert.throws(() => protectContext([{ role: 'user', content: 'SYNTHETIC synthetic@example.invalid' }],
    [...rules, rule('DENY', 'synthetic@example.invalid')]), { code: 'CHAT_POLICY_DENIED' });
  assert.throws(() => protectContext([{ role: 'user', content: 'DEMO-ID' }], rules), { code: 'CHAT_POLICY_DENIED' });
  assert.throws(() => protectContext([{ role: 'user', content: 'SYNTHETIC AsecretB' }], [rule('ALLOW', 'SYNTHETIC'), rule('REDACT', 'secret'), rule('DENY', 'A[نص منقّح]B')]), { code: 'CHAT_POLICY_DENIED' });
});

test('expired and unavailable model approval fail before any fetch', () => {
  const expired = { approval: { expiresAt: '2020-01-01T00:00:00Z' } };
  assert.equal(providerState(expired), 'EXPIRED');
  assert.throws(() => providerConfiguration(expired), { code: 'NO_APPROVED_MODEL', dependencyStatus: 'expired' });
  assert.equal(providerState({}), 'NOT_APPROVED');
});

import { protectReply } from '../src/server/secure-chat/service.mjs';

test('model reply uses baseline and enforced Firewall before disclosure', () => {
  const result = protectReply('SYNTHETIC DEMO-ID هوية ١٢٣٤٥٦٧٨٩٠', rules);
  assert.equal(result.redacted, true);
  assert.doesNotMatch(result.text, /DEMO-ID|١٢٣٤٥٦٧٨٩٠|1234567890/);
  for (const content of ['SYNTHETIC DEMO-BLOCK', 'SYNTHETIC DEMO-REVIEW', 'SYNTHETIC DEMO-WARN', 'unmatched']) {
    assert.throws(() => protectReply(content, rules), { code: 'CHAT_POLICY_DENIED' });
  }
  assert.throws(() => protectReply('SYNTHETIC api_key: synthetic-secret-value', rules), { status: 422, code: 'SENSITIVE_CONTENT_BLOCKED' });
  assert.throws(() => protectReply('SYNTHETIC', []), { code: 'CHAT_POLICY_DENIED' });
});


test('valid registry shape still requires matching runtime model and server secret', (t) => {
  const prior = process.env.GROQ_MODEL;
  const priorKey = process.env.AIGAS_SC_GROQ_API_KEY;
  const priorLegacy = process.env.GROQ_API_KEY;
  t.after(() => {
    if (prior === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = prior;
    if (priorKey === undefined) delete process.env.AIGAS_SC_GROQ_API_KEY;
    else process.env.AIGAS_SC_GROQ_API_KEY = priorKey;
    if (priorLegacy === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = priorLegacy;
  });
  delete process.env.GROQ_MODEL;
  const model = syntheticChatModel();
  assert.throws(() => providerConfiguration(model), { code: 'NO_APPROVED_MODEL' });
  process.env.GROQ_MODEL = model.providerModel;
  delete process.env.AIGAS_SC_GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'legacy-fixture';
  // The legacy key cannot make a Secure Chat adapter ready.
  assert.throws(() => providerConfiguration(model), { code: 'PROVIDER_NOT_CONFIGURED' });
});
