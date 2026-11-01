import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, templates, inputText, ruleName, rulePattern, rulePriority, ruleAction } from '../src/server/firewall/core.mjs';
import { createHandler } from '../src/server/firewall/http.mjs';

const rules = Object.values(templates).map((template, index) => ({ ...template, id: `00000000-0000-4000-8000-00000000000${index}`, enabled: true, version: 1 }));
const rule = overrides => ({ ...rules[2], ...overrides });

test('synthetic outcomes, denial precedence and priority within the winning action', () => {
  assert.equal(evaluate('معلومة عامة', rules).action, 'ALLOW');
  assert.equal(evaluate('DEMO-ID-1234', rules).output, '[معرّف منقّح]');
  assert.equal(evaluate('معلومة عامة DEMO-BLOCK DEMO-ID-1234', rules).action, 'BLOCK');
  assert.equal(evaluate('معلومة عامة DEMO-ID-1234', rules).action, 'REDACT');
  assert.equal(evaluate('demo-id-1234 / DEMO-ID-1234', rules).output, '[معرّف منقّح] / [معرّف منقّح]');
  // An ALLOW rule can never outrank BLOCK, whatever its priority.
  const permissive = rule({ id: '00000000-0000-4000-8000-000000000099', name: 'سماح بأولوية عليا', pattern: 'DEMO-BLOCK', action: 'ALLOW', priority: 1 });
  assert.equal(evaluate('DEMO-BLOCK', [...rules, permissive]).action, 'BLOCK');
  // Priority only selects which matching BLOCK rule is cited.
  const earlier = rule({ id: '00000000-0000-4000-8000-000000000098', name: 'حجب أولوية 5', pattern: 'demo-block', action: 'BLOCK', priority: 5 });
  const cited = evaluate('DEMO-BLOCK', [...rules, earlier]);
  assert.equal(cited.rule_name, 'حجب أولوية 5');
  assert.equal(cited.rule_version, 1);
});

test('literal patterns are never compiled; corrupt policy and empty policy fail closed', () => {
  const literal = rule({ pattern: '(a+)+$', action: 'ALLOW' });
  const started = Date.now();
  const result = evaluate('x (a+)+$ y', [literal]);
  assert.equal(result.action, 'ALLOW');
  assert.ok(Date.now() - started < 1000, 'literal matching must not backtrack');
  assert.equal(evaluate('text', []).action, 'BLOCK');
  assert.equal(evaluate('text', [rule({ version: 0 })]).reason, 'INVALID_POLICY');
  assert.equal(evaluate('text', [rule({ action: 'DELETE' })]).reason, 'INVALID_POLICY');
  assert.equal(evaluate('text', [rule({ match_type: 'REGEX' })]).reason, 'INVALID_POLICY');
  assert.equal(evaluate('text', [rule({ priority: 0 })]).reason, 'INVALID_POLICY');
  assert.throws(() => inputText('x'.repeat(4001)));
  assert.throws(() => inputText(null));
  assert.throws(() => inputText('  '));
});

test('server-side rule validation stays literal and bounded', () => {
  assert.equal(ruleName('  حجب كلمة  '), 'حجب كلمة');
  assert.throws(() => ruleName('a'), error => error.code === 'INVALID_RULE_NAME');
  assert.throws(() => ruleName('a\nb'), error => error.code === 'INVALID_RULE_NAME');
  assert.throws(() => rulePattern(''), error => error.code === 'INVALID_RULE_PATTERN');
  assert.throws(() => rulePattern('x'.repeat(81)), error => error.code === 'INVALID_RULE_PATTERN');
  assert.throws(() => rulePattern('line\u0000break'), error => error.code === 'INVALID_RULE_PATTERN');
  assert.equal(ruleAction('BLOCK'), 'BLOCK');
  assert.throws(() => ruleAction('DROP'), error => error.code === 'INVALID_RULE_ACTION');
  assert.equal(rulePriority(undefined), 100);
  assert.throws(() => rulePriority(0), error => error.code === 'INVALID_RULE_PRIORITY');
  assert.throws(() => rulePriority(1.5), error => error.code === 'INVALID_RULE_PRIORITY');
});

test('HTTP rejects missing identity, cross origin, tenant injection, unknown fields and oversized bodies', async () => {
  const handler = createHandler();
  assert.equal((await handler(new Request('http://localhost/app/api/firewall/rules/'), 'dashboard')).status, 401);
  const authenticated = createHandler(async () => ({ userId: 'test' }), async () => ({}));
  const request = (body, origin = 'http://localhost') => new Request('http://localhost/app/api/firewall/rules/', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await authenticated(request({ template: 'public' }, 'https://other.example'), 'create')).status, 403);
  assert.equal((await authenticated(request({ template: 'public', tenant_id: 'other' }), 'create')).status, 400);
  assert.equal((await authenticated(request({ id: 'x', version: 1, action: 'BLOCK', role: 'OWNER' }), 'update')).status, 400);
  assert.equal((await authenticated(request({ text: 'x'.repeat(19000) }), 'evaluate')).status, 413);
});

test('missing Firewall tables and unknown failures never return ALLOW', async () => {
  const schemaHandler = createHandler(async () => ({ userId: 'test' }), async () => { const error = new Error('relation public.aigas_fw_rules does not exist'); error.code = '42P01'; throw error; });
  const response = await schemaHandler(new Request('http://localhost/app/api/firewall/evaluate/', { method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: '{"text":"synthetic"}' }), 'evaluate');
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'FIREWALL_SCHEMA_MISSING');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');

  const handler = createHandler(async () => ({ userId: 'test' }), async () => { throw new Error('secret request must not escape'); });
  const failure = await handler(new Request('http://localhost/app/api/firewall/evaluate/', { method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: '{"text":"synthetic"}' }), 'evaluate');
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get('cache-control'), 'private, no-store');
  assert.doesNotMatch(await failure.text(), /secret request/);
});
