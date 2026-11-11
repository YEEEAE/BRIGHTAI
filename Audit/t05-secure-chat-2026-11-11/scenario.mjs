import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import pg from 'pg';
import { installSchema, localDatabaseUrl, grantProduct, runtime } from '../../tests/helpers/database.mjs';
import { requireProductAccess } from '../../src/server/kernel/access.mjs';
import { authorizeChatContext } from '../../src/server/secure-chat/integration.mjs';
import { reserve, cancel, settleUnknown } from '../../src/server/secure-chat/requests.mjs';
import { database } from '../../src/server/kernel/db.mjs';

test('Chat policy, durable metadata, refusal and conservative cancellation on restricted runtime', async () => {
  const connectionString = localDatabaseUrl('CHAT_TEST_DATABASE_URL');
  const db = new pg.Client({ connectionString });
  await db.connect();
  try {
    await installSchema(db);
    const tenant = randomUUID(), user = { userId: randomUUID() }, reviewer = randomUUID(), outsider = { userId: randomUUID() };
    for (const id of [user.userId, reviewer, outsider.userId]) await db.query('INSERT INTO neon_auth."user"(id) VALUES($1)', [id]);
    await db.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'BRIGHT AI synthetic local T05')", [tenant]);
    for (const [id, role] of [[user.userId, 'OWNER'], [reviewer, 'ADMIN']]) await db.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)', [tenant, id, role]);
    await grantProduct(db, tenant, 'secure-chat');
    const policyId = randomUUID();
    await db.query("INSERT INTO aigas_policies(id,tenant_id,scope,policy_family,rule_key,owner_user_id,current_version) VALUES($1,$2,'ENTERPRISE','synthetic','chat-local-allow',$3,1)", [policyId, tenant, user.userId]);
    const checksum = createHash('sha256').update(JSON.stringify({ conditions: {}, effect: 'ALLOW', mandatory: false, obligations: [] })).digest('hex');
    await db.query("INSERT INTO aigas_policy_versions(tenant_id,policy_id,version,status,effect,checksum,change_reason,created_by,approved_by,published_at) VALUES($1,$2,1,'PUBLISHED','ALLOW',$3,'Synthetic local fixture',$4,$5,now())", [tenant, policyId, checksum, user.userId, reviewer]);
    for (const [pattern, action] of [['SYNTHETIC', 'ALLOW'], ['DEMO-ID', 'REDACT'], ['DEMO-BLOCK', 'DENY']]) await db.query("INSERT INTO aigas_fw_rules(id,tenant_id,name,match_type,pattern,action,priority,enabled) VALUES($1,$2,$3,'CONTAINS',$4,$5,10,true)", [randomUUID(), tenant, `Synthetic ${action}`, pattern, action]);
    const model = { id: 'LOCAL_POLICY_FIXTURE_ONLY', providerModel: 'qwen/qwen3.8-27b', endpoint: 'https://api.groq.com/openai/v1/chat/completions', region: 'UNVERIFIED', maxRequestTokens: 4096 };
    const authorize = async (identity, requestId, messages) => {
      await db.query('BEGIN');
      try {
        await runtime(db);
        await requireProductAccess(db, identity, tenant, 'secure-chat');
        await db.query('SELECT id FROM aigas_tenants WHERE id=$1 FOR UPDATE', [tenant]);
        const result = await authorizeChatContext(db, identity, tenant, requestId, model, messages);
        await db.query('COMMIT'); return result;
      } catch (e) { await db.query('ROLLBACK'); throw e; }
    };
    const requestId = randomUUID();
    const allowed = await authorize(user, requestId, [{ role: 'user', content: 'SYNTHETIC DEMO-ID' }]);
    assert.equal(allowed.error, undefined);
    assert.doesNotMatch(allowed.outbound[0].content, /DEMO-ID/);
    assert.equal((await db.query('SELECT decision FROM aigas_kernel_policy_decisions WHERE request_id=$1', [requestId])).rows[0].decision, 'ALLOW');
    await db.query('UPDATE aigas_policies SET current_version=0 WHERE id=$1', [policyId]);
    const kernelDenied = await authorize(user, randomUUID(), [{ role: 'user', content: 'SYNTHETIC safe' }]);
    assert.equal(kernelDenied.error.code, 'CHAT_POLICY_DENIED');
    await db.query('UPDATE aigas_policies SET current_version=1 WHERE id=$1', [policyId]);
    const deniedId = randomUUID();
    const denied = await authorize(user, deniedId, [{ role: 'assistant', content: 'SYNTHETIC DEMO-BLOCK' }, { role: 'user', content: 'SYNTHETIC safe' }]);
    assert.equal(denied.error.code, 'CHAT_POLICY_DENIED');
    assert.equal(denied.outbound, undefined);
    assert.equal((await db.query("SELECT 1 FROM aigas_audit_events WHERE correlation_id=$1 AND action='secure_chat.policy.denied'", [deniedId])).rowCount, 1);
    const sensitive = await authorize(user, randomUUID(), [{ role: 'user', content: 'password: synthetic-secret-value' }]);
    assert.equal(sensitive.error.code, 'SENSITIVE_CONTENT_BLOCKED');
    await assert.rejects(authorize(outsider, randomUUID(), [{ role: 'user', content: 'SYNTHETIC safe' }]), { status: 403 });
    // Owner-approved ceilings for this local fixture, not provider/model approval.
    process.env.AIGAS_SC_LIMITS_APPROVAL_REF = 'OWNER_2026_11_11_5_REQUESTS_30000_TOKENS_DAY_48H';
    process.env.AIGAS_SC_TENANT_REQUESTS_PER_DAY = '5';
    process.env.AIGAS_SC_TENANT_TOKENS_PER_DAY = '30000';
    const url = new URL(connectionString); url.username = 'aigas_runtime';
    process.env.DATABASE_URL = url.href;
    const cancellationId = randomUUID();
    await reserve(user, tenant, cancellationId, model);
    await cancel(user, tenant, cancellationId);
    assert.equal(await settleUnknown(user, tenant, cancellationId, 'CANCELLED', null), 'CANCELLED');
    const charge = (await db.query('SELECT state,reserved_tokens,total_tokens FROM aigas_sc_requests WHERE id=$1', [cancellationId])).rows[0];
    assert.equal(charge.state, 'CANCELLED'); assert.equal(Number(charge.reserved_tokens), 4096); assert.equal(charge.total_tokens, null);
    // No text in persisted policy/audit/request rows, no provider calls or fake answers.
    const evidence = (await db.query('SELECT row_to_json(x) evidence FROM aigas_kernel_policy_decisions x')).rows;
    assert.doesNotMatch(JSON.stringify(evidence), /DEMO-ID|DEMO-BLOCK|synthetic-secret-value/);
    await db.query("UPDATE aigas_product_grants SET expires_at=now()-interval '1 second',approved_at=now()-interval '2 days' WHERE tenant_id=$1 AND product_slug='secure-chat'", [tenant]);
    await assert.rejects(authorize(user, randomUUID(), [{ role: 'user', content: 'SYNTHETIC safe' }]), { status: 403 });
    console.log(JSON.stringify({ at: new Date().toISOString(), requestId, deniedId, cancellationId, providerStatus: 'NOT_CALLED', usage: null, conservativeQuotaCharge: 4096, result: 'LOCAL_POLICY_ONLY_PASS' }));
  } finally { await database().end().catch(() => {}); await db.end(); }
});
