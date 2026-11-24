import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import pg from 'pg';
import { grantProduct, installSchema, localDatabaseUrl } from './helpers/database.mjs';
import { syntheticChatModel } from './helpers/secure-chat-model.mjs';
import * as models from '../src/server/secure-chat/models.mjs';

test('Secure Chat routes with real local auth verification, Postgres and captured transports', async t => {
  const connectionString = localDatabaseUrl('CHAT_SECURITY_TEST_DATABASE_URL');
  assert.ok(connectionString, 'A fresh local PostgreSQL database is required');
  const db = new pg.Client({ connectionString });
  await db.connect();
  t.after(() => db.end());
  await installSchema(db);
  const tenant = randomUUID(), user = randomUUID(), reviewer = randomUUID();
  for (const id of [user, reviewer]) await db.query('INSERT INTO neon_auth."user"(id) VALUES($1)', [id]);
  await db.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic route fixture')", [tenant]);
  await db.query("INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'OWNER'),($1,$3,'ADMIN')", [tenant, user, reviewer]);
  await grantProduct(db, tenant, 'secure-chat');
  await grantProduct(db, tenant, 'ledger');
  const policyId = randomUUID();
  const checksum = createHash('sha256').update(JSON.stringify({ conditions: {}, effect: 'ALLOW', mandatory: false, obligations: [] })).digest('hex');
  await db.query("INSERT INTO aigas_policies(id,tenant_id,scope,policy_family,rule_key,owner_user_id,current_version) VALUES($1,$2,'ENTERPRISE','synthetic','chat-security-test',$3,1)", [policyId, tenant, user]);
  await db.query("INSERT INTO aigas_policy_versions(tenant_id,policy_id,version,status,effect,checksum,change_reason,created_by,approved_by,published_at) VALUES($1,$2,1,'PUBLISHED','ALLOW',$3,'Synthetic route fixture',$4,$5,now())", [tenant, policyId, checksum, user, reviewer]);
  await db.query("INSERT INTO aigas_fw_rules(id,tenant_id,name,match_type,pattern,action,priority,enabled) VALUES($1,$2,'Synthetic allow','CONTAINS','SYNTHETIC','ALLOW',10,true)", [randomUUID(), tenant]);

  const model = syntheticChatModel(tenant);
  const registry = [model];
  t.mock.module(new URL('../src/server/secure-chat/models.mjs', import.meta.url).href, {
    namedExports: { ...models, APPROVED_MODELS: registry,
      tenantModels: tenantId => models.tenantModels(tenantId, registry),
      listApprovedModels: tenantId => models.listApprovedModels(tenantId, registry) },
  });
  const { POST, DELETE } = await import('../src/pages/app/api/secure-chat/messages.ts');
  const { GET } = await import('../src/pages/app/api/secure-chat/models.ts');
  const { database } = await import('../src/server/kernel/db.mjs');
  t.after(() => database().end());

  const dir = await mkdtemp(join(tmpdir(), 'secure-chat-security-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const budget = join(dir, 'ledger');
  const restoreBudget = () => writeFile(budget, '{"days":{},"months":{},"active":0,"failures":0,"openUntil":0}');
  await restoreBudget();
  const { privateKey, publicKey } = await generateKeyPair('EdDSA');
  const issuer = 'https://auth.example.invalid';
  const token = await new SignJWT({ role: 'authenticated' }).setProtectedHeader({ alg: 'EdDSA', kid: 'fixture' })
    .setSubject(user).setIssuer(issuer).setIssuedAt().setExpirationTime('5m').sign(privateKey);
  const jwk = { ...await exportJWK(publicKey), kid: 'fixture', alg: 'EdDSA' };
  Object.assign(process.env, {
    DATABASE_URL: connectionString, AIGAS_DB_RUNTIME_ROLE: 'aigas_runtime',
    NEON_AUTH_BASE_URL: issuer, NEON_AUTH_JWKS_URL: issuer + '/jwks',
    GROQ_MODEL: model.providerModel, AIGAS_SC_GROQ_API_KEY: 'synthetic-provider-key',
    AIGAS_GROQ_BUDGET_FILE: budget, AIGAS_GROQ_DAILY_BUDGET_USD: '1', AIGAS_GROQ_MONTHLY_BUDGET_USD: '1',
    AIGAS_GROQ_TIMEOUT_MS: '500', AIGAS_SC_QUOTAS_ENABLED: 'true',
    AIGAS_SC_LIMITS_APPROVAL_REF: 'SYNTHETIC', AIGAS_SC_TENANT_REQUESTS_PER_DAY: '100',
    AIGAS_MONITORING_APPROVAL_REF: 'SYNTHETIC', AIGAS_MONITORING_ENVIRONMENT: 'beta',
    AIGAS_MONITORING_RELEASE: 'a'.repeat(40), AIGAS_SENTRY_ENABLED: 'true',
    AIGAS_SENTRY_APPROVAL_REF: 'SYNTHETIC', AIGAS_SENTRY_APPROVED_ORIGIN: 'https://sentry.example.invalid',
    AIGAS_SENTRY_DSN: 'https://syntheticpublickey@sentry.example.invalid/42',
    AIGAS_POSTHOG_ENABLED: 'true', AIGAS_ANALYTICS_APPROVAL_REF: 'SYNTHETIC',
    AIGAS_POSTHOG_API_KEY: 'phc_syntheticpublickey', AIGAS_POSTHOG_HOST: 'https://analytics.example.invalid',
  });

  const input = 'SYNTHETIC CHATINPUTCANARY dev@example.invalid';
  const output = 'SYNTHETIC CHATOUTPUTCANARY ١٢٣٤٥٦٧٨٩٠';
  const errorText = 'UPSTREAMERRORCANARY';
  const canaries = /CHATINPUTCANARY|CHATOUTPUTCANARY|UPSTREAMERRORCANARY|dev@example\.invalid|1234567890|١٢٣٤٥٦٧٨٩٠/;
  const providerCalls = [], telemetry = [], logs = [];
  for (const method of ['log', 'info', 'debug', 'warn', 'error']) t.mock.method(console, method, (...args) => logs.push(args));
  let mode = 'success', notifyProvider;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const host = new URL(url).hostname;
    if (host === 'auth.example.invalid') return Response.json({ keys: [jwk] });
    if (host === 'analytics.example.invalid' || host === 'sentry.example.invalid') {
      telemetry.push({ host, body: init.body });
      return new Response(null, { status: 204 });
    }
    assert.equal(host, 'api.groq.com');
    providerCalls.push(JSON.parse(init.body));
    notifyProvider?.();
    if (mode === 'wait') return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Error(errorText)), { once: true }));
    if (mode === 'unavailable') return new Response(errorText, { status: 503 });
    if (mode === 'rate') return new Response(errorText, { status: 429 });
    if (mode === 'tool') return Response.json({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: output, tool_calls: [{}] } }],
      usage: { prompt_tokens: 30, completion_tokens: 10, total_tokens: 40 } });
    return Response.json({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: output } }],
      usage: { prompt_tokens: 30, completion_tokens: 10, total_tokens: 40 } });
  });
  const origin = 'https://app.example.invalid';
  const request = (route, method, data, signal) => ({
    request: new Request(`${origin}/app/api/secure-chat/${route}/?workspace=${tenant}`, {
      method, signal, headers: { origin, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      ...(data ? { body: JSON.stringify(data) } : {}),
    }),
  });
  const send = (overrides = {}, signal) => POST(request('messages', 'POST', {
    requestId: randomUUID(), modelId: model.id, message: input, syntheticAcknowledged: true, ...overrides,
  }, signal));
  const refused = async (result, code, status) => {
    const response = await result;
    assert.equal(response.status, status);
    const body = await response.json();
    assert.equal(body.code, code);
    assert.doesNotMatch(JSON.stringify(body), canaries);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  };

  const list = async () => (await GET(request('models', 'GET'))).json();
  assert.equal((await list()).available, true);
  const success = await send();
  assert.equal(success.status, 200);
  const data = await success.json();
  assert.match(data.reply, /CHATOUTPUTCANARY.*\[بيانات منقحة\]/);
  assert.match(data.submittedText, /CHATINPUTCANARY.*\[بيانات منقحة\]/);
  assert.deepEqual(Object.keys(providerCalls[0].messages[0]).sort(), ['content', 'role']);
  assert.equal(providerCalls[0].stream, false);
  assert.doesNotMatch(JSON.stringify(providerCalls[0]), /dev@example\.invalid|CHATOUTPUTCANARY/);
  for (const [fields, code, status] of [
    [{ systemPrompt: 'SYNTHETIC free-form field' }, 'INVALID_BODY', 400],
    [{ history: [{ role: 'system', content: 'SYNTHETIC role fixture' }, { role: 'assistant', content: input }] }, 'INVALID_HISTORY', 400],
    [{ message: 'SYNTHETIC password: synthetic-secret-value' }, 'SENSITIVE_CONTENT_BLOCKED', 422],
    [{ message: 'SYNTHETIC ' + 'ع'.repeat(1800) }, 'CONTEXT_LIMIT', 413],
    [{ requestId: data.requestId }, 'REQUEST_ALREADY_SEEN', 409],
  ]) await refused(send(fields), code, status);
  assert.equal(providerCalls.length, 1);
  process.env.AIGAS_SC_TENANT_REQUESTS_PER_DAY = '1';
  await refused(send(), 'USAGE_LIMIT_REACHED', 429);
  process.env.AIGAS_SC_TENANT_REQUESTS_PER_DAY = '100';
  await db.query('REVOKE UPDATE ON aigas_sc_requests FROM aigas_runtime');
  try {
    assert.equal((await list()).availabilityCode, 'USAGE_POLICY_NOT_READY');
    await refused(send(), 'USAGE_POLICY_NOT_READY', 503);
  } finally { await db.query('GRANT UPDATE ON aigas_sc_requests TO aigas_runtime'); }
  const expiry = model.approval.expiresAt;
  model.approval.expiresAt = '2026-02-01T00:00:00Z';
  await refused(send(), 'MODEL_APPROVAL_EXPIRED', 503);
  assert.equal((await list()).availabilityCode, 'MODEL_APPROVAL_EXPIRED');
  model.approval.expiresAt = expiry;
  await writeFile(budget, '{}');
  assert.equal((await list()).available, false);
  await refused(send(), 'BUDGET_STORE_UNAVAILABLE', 503);
  await restoreBudget();
  assert.equal(providerCalls.length, 1);

  mode = 'rate';
  await refused(send(), 'GROQ_RATE_LIMIT', 429);
  assert.equal(providerCalls.length, 2, 'the body is submitted once at most');
  mode = 'tool';
  await refused(send(), 'INVALID_PROVIDER_REPLY', 502);
  mode = 'unavailable';
  await refused(send(), 'PROVIDER_REJECTED', 502);
  mode = 'wait';
  await refused(send(), 'PROVIDER_TIMEOUT', 504);
  const controller = new AbortController();
  const requestId = randomUUID();
  const started = new Promise(resolve => { notifyProvider = resolve; });
  const pending = send({ requestId }, controller.signal);
  await started;
  const cancellation = await DELETE(request('messages', 'DELETE', { requestId }));
  assert.equal((await cancellation.json()).state, 'CANCEL_PENDING');
  controller.abort();
  await refused(pending, 'REQUEST_CANCELLED', 409);
  const cancelled = (await db.query('SELECT state,total_tokens FROM aigas_sc_requests WHERE id=$1', [requestId])).rows[0];
  assert.deepEqual(cancelled, { state: 'CANCELLED', total_tokens: null });

  const evidence = (await db.query(`SELECT row_to_json(x) AS evidence FROM aigas_kernel_policy_decisions x
    UNION ALL SELECT row_to_json(x) FROM aigas_audit_events x
    UNION ALL SELECT row_to_json(x) FROM aigas_sc_requests x
    UNION ALL SELECT row_to_json(x) FROM aigas_sc_cancellations x
    UNION ALL SELECT row_to_json(x) FROM aigas_ld_events x`)).rows;
  assert.ok(evidence.some(row => row.evidence.event_type === 'kernel.audit.recorded'));
  assert.doesNotMatch(JSON.stringify(evidence), canaries);
  assert.ok(telemetry.some(event => event.host === 'sentry.example.invalid'));
  assert.ok(telemetry.some(event => event.host === 'analytics.example.invalid'));
  assert.doesNotMatch(JSON.stringify(telemetry), canaries);
  assert.doesNotMatch(JSON.stringify(logs), canaries);
});
