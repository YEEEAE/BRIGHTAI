import test from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_MODELS, findApprovedModel, listApprovedModels } from '../src/server/secure-chat/models.mjs';
import { configuredMessageLimit, errorResponse, HARD_MAX_MESSAGE_LENGTH } from '../src/server/secure-chat/service.mjs';

test('Secure Chat remains fail-closed while no provider approval exists', () => {
  assert.deepEqual(APPROVED_MODELS, []);
  assert.deepEqual(listApprovedModels(), []);
  assert.equal(findApprovedModel('arbitrary-client-model'), null);
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
