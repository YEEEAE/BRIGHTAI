import test from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_MODELS, findApprovedModel, listApprovedModels } from '../src/server/secure-chat/models.mjs';
import { configuredMessageLimit, errorResponse, HARD_MAX_MESSAGE_LENGTH, requireChatPolicyIntegration } from '../src/server/secure-chat/service.mjs';
import { approvedEgress, protectText, usagePolicy } from '../src/server/secure-chat/policy.mjs';

test('Secure Chat remains fail-closed while no provider approval exists', () => {
  assert.deepEqual(APPROVED_MODELS, []);
  assert.deepEqual(listApprovedModels(), []);
  assert.equal(findApprovedModel('arbitrary-client-model'), null);
});

test('missing Kernel and Firewall integration refuses dispatch with a server error', () => {
  assert.throws(() => requireChatPolicyIntegration(), error =>
    error.status === 503 && error.code === 'CHAT_POLICY_INTEGRATION_REQUIRED');
});

test('baseline blocks synthetic secrets and redacts every outgoing history item', () => {
  assert.throws(() => protectText('password: synthetic-secret-value'), e => e.code === 'SENSITIVE_CONTENT_BLOCKED');
  const result = approvedEgress([
    { role: 'user', content: 'mail synthetic@example.invalid' },
    { role: 'assistant', content: 'contact synthetic@example.invalid' },
  ]);
  assert.ok(result.every(item => !item.content.includes('synthetic@example.invalid')));
  assert.ok(result.every(item => item.content.includes('[بيانات منقحة]')));
  assert.throws(() => approvedEgress([{ role: 'system', content: 'text' }]), e => e.code === 'SENSITIVE_CONTENT_BLOCKED');
});

test('unapproved quota fails closed', () => {
  assert.throws(() => usagePolicy(), e => e.code === 'USAGE_POLICY_NOT_CONFIGURED');
});

test('configured message size accepts only bounded integer limits', () => {
  assert.equal(configuredMessageLimit('1200'), 1200);
  assert.equal(configuredMessageLimit('1'), 1);
  assert.equal(configuredMessageLimit('0'), HARD_MAX_MESSAGE_LENGTH);
  assert.equal(configuredMessageLimit('4001'), HARD_MAX_MESSAGE_LENGTH);
  assert.equal(configuredMessageLimit('1e3'), HARD_MAX_MESSAGE_LENGTH);
  assert.equal(configuredMessageLimit(), HARD_MAX_MESSAGE_LENGTH);
});

test('database setup errors are mapped without exposing SQL details', async () => {
  const response = errorResponse({ code: '42P01', message: 'SELECT secret FROM customer_messages' });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const body = await response.json();
  assert.equal(body.code, 'SECURE_CHAT_SCHEMA_MISSING');
  assert.match(body.message, /بيئة تطوير معتمدة/);
  assert.doesNotMatch(JSON.stringify(body), /customer_messages|SELECT/);
});


test('registry excludes unscoped, expired and incomplete owner approvals', () => {
  const approval = { reference: 'SYNTHETIC-OWNER', expiresAt: '2030-01-01T00:00:00Z', noTraining: true, retentionReference: 'SYNTHETIC-RETENTION', regionReference: 'SYNTHETIC-REGION' };
  const model = { id: 'fixture', tenantIds: ['tenant-a'], approval };
  const now = Date.parse('2026-11-16T00:00:00Z');
  assert.deepEqual(listApprovedModels('tenant-a', [model], now), [model]);
  assert.deepEqual(listApprovedModels('tenant-b', [model], now), []);
  assert.deepEqual(listApprovedModels(undefined, [model], now), []);
  for (const broken of [{ ...model, tenantIds: [] }, { ...model, approval: { ...approval, reference: ' ' } }, { ...model, approval: { ...approval, noTraining: false } }, { ...model, approval: { ...approval, expiresAt: new Date(now).toISOString() } }]) {
    assert.deepEqual(listApprovedModels('tenant-a', [broken], now), []);
  }
});

test('approved quota configuration has no defaults and emergency switch closes it', () => {
  const values = { AIGAS_SC_LIMITS_APPROVAL_REF: 'SYNTHETIC-ONLY', AIGAS_SC_USER_REQUESTS_PER_MINUTE: '10', AIGAS_SC_USER_REQUESTS_PER_DAY: '100', AIGAS_SC_USER_TOKENS_PER_DAY: '50000' };
  const keys = [...Object.keys(values), 'AIGAS_SC_QUOTAS_ENABLED'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    Object.assign(process.env, values);
    assert.equal(usagePolicy().userMinute, 10);
    assert.equal(usagePolicy().userDay, 100);
    assert.equal(usagePolicy().userTokensDay, 50000);
    process.env.AIGAS_SC_QUOTAS_ENABLED = 'false';
    assert.throws(() => usagePolicy(), { code: 'USAGE_POLICY_NOT_CONFIGURED' });
    delete process.env.AIGAS_SC_QUOTAS_ENABLED;
    process.env.AIGAS_SC_USER_REQUESTS_PER_DAY = '0';
    assert.throws(() => usagePolicy(), { code: 'USAGE_POLICY_INVALID' });
  } finally {
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
  }
});
