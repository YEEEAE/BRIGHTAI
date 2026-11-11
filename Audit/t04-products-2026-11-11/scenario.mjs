// One synthetic institution, one database, real runtime RLS and HTTP handlers.
// Auth is a fixture identity resolver; this is not a managed Auth/browser test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import pg from 'pg';
import { installSchema, localDatabaseUrl, grantProduct, runtime } from '../../tests/helpers/database.mjs';
import { createFirewallService } from '../../src/server/firewall/service.mjs';
import { createHandler as firewallHandler } from '../../src/server/firewall/http.mjs';
import { createLedgerService } from '../../src/server/ledger/service.mjs';
import { createHandler as ledgerHandler } from '../../src/server/ledger/http.mjs';
import { createHumanGateService } from '../../src/server/human-gate/service.mjs';
import { createHandler as humanHandler } from '../../src/server/human-gate/http.mjs';
import { createRiskEngineService } from '../../src/server/risk-engine/service.mjs';
import { createHandler as riskHandler } from '../../src/server/risk-engine/http.mjs';

test('T04: representative four-product workflow and honest ESCALATE refusal', async () => {
  const db = new pg.Client({ connectionString: localDatabaseUrl('PRODUCTS_TEST_DATABASE_URL') });
  await db.connect();
  try {
    await installSchema(db);
    const tenant = randomUUID(), owner = { userId: randomUUID() }, reviewer = { userId: randomUUID() };
    for (const u of [owner, reviewer]) await db.query('INSERT INTO neon_auth."user"(id) VALUES($1)', [u.userId]);
    await db.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic T04 institution')", [tenant]);
    for (const [u, role] of [[owner, 'OWNER'], [reviewer, 'ADMIN']]) await db.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)', [tenant, u.userId, role]);
    for (const slug of ['firewall', 'ledger', 'human-gate', 'risk-engine']) await grantProduct(db, tenant, slug);
    // Local policy fixture only. No approval of a real institution is inferred.
    const policyId = randomUUID();
    await db.query("INSERT INTO aigas_policies(id,tenant_id,scope,policy_family,rule_key,owner_user_id,current_version) VALUES($1,$2,'ENTERPRISE','synthetic','local-allow',$3,1)", [policyId, tenant, owner.userId]);
    const checksum = createHash('sha256').update(JSON.stringify({ conditions: {}, effect: 'ALLOW', mandatory: false, obligations: [] })).digest('hex');
    await db.query("INSERT INTO aigas_policy_versions(tenant_id,policy_id,version,status,effect,checksum,change_reason,created_by,approved_by,published_at) VALUES($1,$2,1,'PUBLISHED','ALLOW',$3,'Synthetic fixture',$4,$5,now())", [tenant, policyId, checksum, owner.userId, reviewer.userId]);
    const transact = async work => {
      await db.query('BEGIN');
      try { await runtime(db); const result = await work(db); await db.query('COMMIT'); return result; }
      catch (e) { await db.query('ROLLBACK'); throw e; }
    };
    const handlers = { firewall: [firewallHandler, createFirewallService], ledger: [ledgerHandler, createLedgerService],
      human: [humanHandler, createHumanGateService], risk: [riskHandler, createRiskEngineService] };
    const send = async (product, user, operation, body = {}, id) => {
      const [handler, service] = handlers[product];
      const method = ['list', 'export', 'history'].includes(operation) ? 'GET' : 'POST';
      const response = await handler(async () => user, service(transact))(new Request(`http://localhost/app/api/${product}/?workspace=${tenant}`, {
        method, headers: { origin: 'http://localhost', 'content-type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
      }), operation, id);
      const data = await response.json();
      return { status: response.status, data };
    };
    const success = async promise => { const r = await promise; assert.ok(r.status >= 200 && r.status < 300, JSON.stringify(r)); return r.data; };
    await success(send('firewall', owner, 'create', { name: 'Synthetic escalation', pattern: 'T04-REVIEW', action: 'ESCALATE', priority: 10 }));
    await success(send('firewall', owner, 'create', { template: 'public' }));
    const requestId = randomUUID();
    const blocked = await send('firewall', owner, 'enforce', { text: 'T04-REVIEW', synthetic: true, request_id: requestId });
    assert.equal(blocked.status, 409, JSON.stringify(blocked)); assert.equal(blocked.data.code, 'HUMAN_GATE_NOT_CONFIGURED');
    assert.equal(blocked.data.external_action_executed, false);
    const saved = (await db.query('SELECT * FROM aigas_fw_decisions WHERE id=$1', [blocked.data.decision.id])).rows[0];
    assert.equal(saved.tenant_id, tenant); assert.equal(saved.request_id, requestId);
    assert.equal(saved.action, 'ESCALATE'); assert.match(saved.request_fingerprint, /^[a-f0-9]{64}$/);
    assert.equal(saved.policy_version, blocked.data.policy_version);
    assert.equal((await db.query('SELECT count(*)::int n FROM aigas_hg_requests')).rows[0].n, 0);
    assert.equal((await send('firewall', owner, 'enforce', { text: 'T04-REVIEW', synthetic: true, request_id: requestId })).status, 409);
    const lab = await success(send('firewall', reviewer, 'evaluate', { text: 'معلومة عامة', synthetic: true }));
    assert.equal(lab.action, 'ALLOW'); assert.equal(lab.mode, 'LAB'); assert.equal(lab.external_action_executed, false);
    console.log(JSON.stringify({ product: 'firewall', tenant, decisionId: saved.id, requestId, fingerprint: saved.request_fingerprint, policyVersion: saved.policy_version, result: 'PASS_BLOCKED_ONLY_ESCALATE', at: new Date().toISOString() }));

    const event = await success(send('ledger', owner, 'create', { event_type: 'synthetic.test.created', scenario: 'integrity-check', idempotency_key: randomUUID() }));
    const eventId = event.event.event_id;
    assert.equal((await success(send('ledger', reviewer, 'verify', {}, eventId))).result, 'MATCH');
    const bundle = await success(send('ledger', owner, 'export', {}, eventId));
    assert.equal(bundle.manifest.assurance, 'INTEGRITY_ONLY_NO_SIGNATURE');
    assert.equal(bundle.verification.result, 'MATCH');
    assert.equal((await db.query('SELECT event_id FROM aigas_ld_events WHERE event_id=$1', [eventId])).rowCount, 1);
    console.log(JSON.stringify({ product: 'ledger', eventId, result: 'PASS', at: new Date().toISOString() }));

    await success(send('human', owner, 'policy', { version: null, pending_minutes: 60, approval_minutes: 30, enabled: true }));
    const hg = await success(send('human', owner, 'create', { title: 'Synthetic workspace rename', description: 'Synthetic internal operation', reason: 'Local workflow proof', operation_type: 'KERNEL_WORKSPACE_RENAME', new_name: 'Synthetic T04 renamed', synthetic_confirmed: true }));
    assert.equal((await send('human', owner, 'decide', { decision: 'APPROVE', reason: 'Self attempt' }, hg.request.id)).status, 403);
    await success(send('human', reviewer, 'decide', { decision: 'APPROVE', reason: 'Independent synthetic review' }, hg.request.id));
    assert.equal((await db.query('SELECT name FROM aigas_tenants WHERE id=$1', [tenant])).rows[0].name, 'Synthetic T04 institution');
    await success(send('human', owner, 'execute', {}, hg.request.id));
    assert.equal((await send('human', owner, 'execute', {}, hg.request.id)).status, 409);
    assert.equal((await db.query('SELECT name FROM aigas_tenants WHERE id=$1', [tenant])).rows[0].name, 'Synthetic T04 renamed');
    console.log(JSON.stringify({ product: 'human-gate', requestId: hg.request.id, result: 'PASS', at: new Date().toISOString() }));

    const asset = await success(send('risk', owner, 'create', { name: 'Synthetic asset', owner: 'Synthetic team', purpose: 'Synthetic assessment', data_classification: 'PUBLIC', synthetic_data_confirmed: true }));
    const assetId = asset.asset.id;
    const assessment = await success(send('risk', reviewer, 'assess', { asset_version: 1, likelihood: 3, impact: 3, likelihood_reason: 'Synthetic likelihood', impact_reason: 'Synthetic impact', controls_reason: 'Synthetic controls', synthetic_data_confirmed: true }, assetId));
    const treatment = await success(send('risk', owner, 'save-treatment', { asset_version: 1, assessment_id: assessment.assessment.id, treatment_version: 0, owner: 'Synthetic owner', status: 'ACCEPTED', control_description: 'Synthetic control', residual_risk_description: 'Synthetic residual risk', review_on: '2027-01-01', rationale: 'Synthetic rationale with sufficient detail', residual_likelihood: 2, residual_impact: 2, synthetic_data_confirmed: true }, assetId));
    assert.equal(treatment.deployment_authorized, false);
    assert.equal((await db.query('SELECT residual_score FROM aigas_re_treatment_revisions WHERE asset_id=$1', [assetId])).rows[0].residual_score, 4);
    console.log(JSON.stringify({ product: 'risk-engine', assetId, assessmentId: assessment.assessment.id, result: 'PASS', deployment_authorized: false, at: new Date().toISOString() }));
  } finally { await db.end(); }
});
