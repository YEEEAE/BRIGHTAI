import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { installSchema, localDatabaseUrl } from './helpers/database.mjs';

// Explicit disposable localhost DB only; never .env, never Neon. The owner
// connection prepares fixtures, the runtime connection exercises the real role.
const url = localDatabaseUrl('KERNEL_TRIAL_TEST_DATABASE_URL');
const RELEASE = 'a'.repeat(40);

test('P06-A runtime: request, review, operator channel, closed activation, quotas and expiry', { skip: !url }, async () => {
  const owner = new pg.Pool({ connectionString: url, max: 6 });
  const runtimeUrl = new URL(url);
  runtimeUrl.username = 'aigas_runtime';
  const runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 6 });
  try {
    await installSchema(owner);
    const ids = {
      requester: randomUUID(), admin: randomUUID(), member: randomUUID(),
      outsider: randomUUID(), operator: randomUUID(), selfOperator: randomUUID(),
    };
    for (const [key, id] of Object.entries(ids)) {
      await owner.query('INSERT INTO neon_auth."user"(id,name,email) VALUES($1,$2,$3)', [id, `Synthetic ${key}`, `${key}@example.test`]);
    }
    const a = randomUUID(), b = randomUUID(), c = randomUUID();
    await owner.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B'),($3,'Synthetic C')", [a, b, c]);
    for (const [tenant, user, role] of [
      [a, ids.requester, 'OWNER'], [a, ids.admin, 'ADMIN'], [a, ids.member, 'MEMBER'],
      [b, ids.outsider, 'OWNER'], [c, ids.selfOperator, 'OWNER'],
    ]) await owner.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)', [tenant, user, role]);
    // Named operator channel: provisioned here as a local fixture only.
    await owner.query(`INSERT INTO aigas_trial_operators(user_id,status,approval_reference)
      VALUES($1,'ACTIVE','LOCAL_SYNTHETIC_OPERATOR_APPROVAL'),($2,'ACTIVE','LOCAL_SYNTHETIC_OPERATOR_APPROVAL')`,
      [ids.operator, ids.selfOperator]);

    process.env.DATABASE_URL = runtimeUrl.href;
    process.env.AIGAS_REQUIRE_RLS = 'true';
    process.env.AIGAS_ENVIRONMENT = 'local';
    process.env.AIGAS_RELEASE_SHA = RELEASE;
    delete process.env.NEON_AUTH_BASE_URL; delete process.env.NEON_AUTH_URL;
    delete process.env.NEON_AUTH_JWKS_URL; delete process.env.NEON_JWKS_URL;
    const service = await import('../src/server/kernel/trial-service.mjs');
    const { transaction, setTenantScope } = await import('../src/server/kernel/db.mjs');
    const { tenantGuard } = await import('../src/server/kernel/service.mjs');
    const { trialLifecycle, trialProductAccess } = await import('../src/server/kernel/trial.mjs');

    const lifecycle = (tenant, user = ids.requester) => transaction(async db => {
      await tenantGuard({ userId: user }, tenant, db);
      return trialLifecycle(db, tenant);
    });
    const productAccess = (tenant, slug) => transaction(async db => {
      await tenantGuard({ userId: ids.requester }, tenant, db);
      return trialProductAccess(db, tenant, slug);
    });

    // Scope and input rejection: a member cannot request, a browser cannot claim a
    // data mode, and an unknown product is never accepted.
    await assert.rejects(service.requestTrial({ userId: ids.member }, a, { products: ['firewall'], deploymentMode: 'SAAS', businessGoal: 'x'.repeat(25) }), { status: 403, code: 'FORBIDDEN' });
    await assert.rejects(service.requestTrial({ userId: ids.requester }, a, { products: ['kernel'], deploymentMode: 'SAAS', businessGoal: 'x'.repeat(25) }), { code: 'INVALID_TRIAL_SCOPE' });
    await assert.rejects(service.requestTrial({ userId: ids.requester }, a, { products: ['firewall'], deploymentMode: 'SAAS', businessGoal: 'short' }), { code: 'INVALID_TRIAL_GOAL' });
    await assert.rejects(service.requestTrial({ userId: ids.requester }, a, { products: ['firewall'], deploymentMode: 'SAAS', businessGoal: 'x'.repeat(25), dataMode: 'CUSTOMER' }), { code: 'SYNTHETIC_DATA_ONLY' });
    await assert.rejects(service.requestTrial({ userId: ids.requester }, a, { products: ['firewall'], deploymentMode: 'SAAS', businessGoal: 'x'.repeat(25), state: 'APPROVED' }), { code: 'INVALID_BODY' });

    const created = await service.requestTrial({ userId: ids.requester }, a, {
      products: ['firewall', 'ledger'], deploymentMode: 'SAAS', businessGoal: 'Synthetic evaluation of policy and evidence flow',
    });
    assert.equal(created.persisted, true);
    assert.equal(created.state, 'REQUESTED');
    assert.equal(created.activationClosed, true);
    const trialA = created.trialId;
    await assert.rejects(service.requestTrial({ userId: ids.requester }, a, {
      products: ['firewall'], deploymentMode: 'SAAS', businessGoal: 'Synthetic evaluation of policy and evidence flow',
    }), { code: 'TRIAL_ALREADY_OPEN' });
    assert.equal((await owner.query('SELECT count(*)::int AS n FROM aigas_trial_requests WHERE tenant_id=$1', [a])).rows[0].n, 1);
    // Neither tenant sees the other's trial.
    assert.equal((await lifecycle(b, ids.outsider)).state, 'NONE');
    await assert.rejects(service.submitTrial({ userId: ids.outsider }, b, trialA, {}), { code: 'TRIAL_NOT_FOUND' });

    // Tenant review path.
    assert.equal((await service.submitTrial({ userId: ids.requester }, a, trialA, {})).state, 'ELIGIBILITY_REVIEW');
    await assert.rejects(service.submitTrial({ userId: ids.requester }, a, trialA, {}), { status: 409 });
    // Not an operator: no decision, and no operator roster is exposed.
    await assert.rejects(service.operatorDecideTrial({ userId: ids.requester }, trialA, { decision: 'APPROVE' }), { status: 403, code: 'OPERATOR_REQUIRED' });
    assert.equal((await runtime.query('SELECT count(*)::int AS n FROM aigas_trial_operators')).rows[0].n, 0);

    // Operator approval is a separate identity; approval never activates.
    const approved = await service.operatorDecideTrial({ userId: ids.operator }, trialA, { decision: 'APPROVE' });
    assert.equal(approved.state, 'APPROVED');
    assert.equal((await lifecycle(a)).state, 'APPROVED');
    assert.equal((await productAccess(a, 'firewall')).grantsProduct, false);
    assert.equal((await productAccess(a, 'firewall')).reason, 'NO_ENTITLEMENT');

    // The requester cannot approve or activate their own evaluation.
    const trialC = (await service.requestTrial({ userId: ids.selfOperator }, c, {
      products: ['human-gate'], deploymentMode: 'SAAS', businessGoal: 'Synthetic separation check for operator identity',
    })).trialId;
    await service.submitTrial({ userId: ids.selfOperator }, c, trialC, {});
    await assert.rejects(service.operatorDecideTrial({ userId: ids.selfOperator }, trialC, { decision: 'APPROVE' }), { code: 'OPERATOR_SEPARATION_REQUIRED' });

    // Activation stays closed: no acknowledgement, no readiness, no quota.
    await assert.rejects(service.operatorActivateTrial({ userId: ids.operator }, trialA, {}), { code: 'CUSTOMER_ACKNOWLEDGEMENT_REQUIRED' });
    await assert.rejects(service.operatorActivateTrial({ userId: ids.operator }, trialA, { customerAcknowledged: true }), { code: 'ACTIVATION_READINESS_REQUIRED' });
    // Database boundary: even a direct owner UPDATE cannot activate without readiness.
    await owner.query('BEGIN');
    try {
      await owner.query("SELECT set_config('aigas.environment','local',true),set_config('aigas.release_sha',$1,true)", [RELEASE]);
      await assert.rejects(owner.query(`UPDATE aigas_trial_requests SET state='ACTIVATED',decision_source='OPERATOR',
        decided_by=$2,decided_at=now(),activated_at=now(),expires_at=now()+interval '48 hours'
        WHERE id=$1`, [trialA, ids.operator]), /readiness/i);
    } finally { await owner.query('ROLLBACK'); }

    // Readiness exists but quotas do not: still refused.
    for (const slug of ['firewall', 'ledger']) {
      await owner.query(`INSERT INTO aigas_release_readiness
        (environment,release_sha,product_slug,status,verified_at,verified_by,evidence_reference,expires_at)
        VALUES('local',$1,$2,'PASS',now(),$3,'LOCAL_SYNTHETIC_READINESS',now()+interval '1 hour')`,
        [RELEASE, slug, ids.operator]);
    }
    await assert.rejects(service.operatorActivateTrial({ userId: ids.operator }, trialA, { customerAcknowledged: true }), { code: 'ACTIVATION_QUOTA_REQUIRED' });

    // Approved quota profile is a local fixture, not a commercial commitment.
    for (const [slug, limit] of [['firewall', 5], ['ledger', 3]]) {
      await owner.query(`INSERT INTO aigas_trial_quota_limits
        (product_slug,limit_units,approval_reference,approved_by,effective_from)
        VALUES($1,$2,'LOCAL_SYNTHETIC_QUOTA',$3,now()-interval '1 minute')`, [slug, limit, ids.operator]);
    }
    const activated = await service.operatorActivateTrial({ userId: ids.operator }, trialA, { customerAcknowledged: true });
    assert.equal(activated.state, 'ACTIVATED');
    assert.equal(activated.durationSeconds, 172800);
    const window = (await owner.query(`SELECT activated_at,expires_at,decision_source,decided_by,
      (expires_at = activated_at + interval '48 hours') AS exact_window
      FROM aigas_trial_requests WHERE id=$1`, [trialA])).rows[0];
    assert.equal(window.exact_window, true);
    assert.equal(window.decision_source, 'OPERATOR');
    assert.equal(window.decided_by, ids.operator);
    const entitlements = (await owner.query(`SELECT e.product_slug,e.status,
      (e.starts_at = r.activated_at AND e.ends_at = r.expires_at) AS window_matches
      FROM aigas_trial_entitlements e
      JOIN aigas_trial_requests r ON r.id=e.trial_id AND r.tenant_id=e.tenant_id
      WHERE e.trial_id=$1 ORDER BY e.product_slug`, [trialA])).rows;
    assert.deepEqual(entitlements.map(row => row.product_slug), ['firewall', 'ledger']);
    assert.ok(entitlements.every(row => row.status === 'ACTIVE' && row.window_matches === true));
    assert.equal((await lifecycle(a)).state, 'ACTIVATED');
    assert.equal((await productAccess(a, 'firewall')).grantsProduct, true);
    assert.equal((await productAccess(a, 'secure-chat')).grantsProduct, false);
    const activationEvent = (await owner.query(`SELECT actor_source,reason FROM aigas_trial_events
      WHERE trial_id=$1 AND to_state='ACTIVATED'`, [trialA])).rows[0];
    assert.equal(activationEvent.actor_source, 'OPERATOR');

    // RLS: a tenant-scoped runtime session cannot approve itself or forge an operator event.
    const client = await runtime.connect();
    try {
      await client.query('BEGIN');
      await setTenantScope(client, a, ids.requester);
      assert.equal((await client.query("UPDATE aigas_trial_requests SET state='CANCELLED',reason='FORGED_TENANT_CANCEL' WHERE id=$1 RETURNING id", [trialA])).rowCount, 0);
      await assert.rejects(client.query(`INSERT INTO aigas_trial_events
        (id,trial_id,tenant_id,from_state,to_state,actor_user_id,actor_source,reason)
        VALUES($1,$2,$3,'ACTIVATED','EXPIRED',$4,'OPERATOR','FORGED_OPERATOR_EVENT')`,
        [randomUUID(), trialA, a, ids.requester]), error => error.code === '42501');
      await client.query('ROLLBACK');
    } finally { client.release(); }

    // Quota: approved limit, idempotent replay, exhaustion and concurrency.
    const consume = (product, units, key, tenant = a, user = ids.requester) =>
      service.consumeTrialQuota({ userId: user }, tenant, { trialId: trialA, product, units, idempotencyKey: key });
    const first = await consume('firewall', 2, 'quota-key-0001');
    assert.deepEqual({ allowed: first.allowed, used: first.used, limit: first.limitUnits, remaining: first.remaining }, { allowed: true, used: 2, limit: 5, remaining: 3 });
    const replay = await consume('firewall', 2, 'quota-key-0001');
    assert.equal(replay.allowed, true);
    assert.equal(replay.used, 2);
    assert.equal((await consume('firewall', 3, 'quota-key-0002')).used, 5);
    const exhausted = await consume('firewall', 1, 'quota-key-0003');
    assert.equal(exhausted.allowed, false);
    assert.equal(exhausted.reason, 'QUOTA_EXCEEDED');
    assert.equal(exhausted.used, 5);
    // A product without an approved profile is denied, not unlimited.
    assert.equal((await consume('human-gate', 1, 'quota-key-0004')).reason, 'QUOTA_NOT_APPROVED');
    // Cross-tenant use of another tenant's trial id is not found, and a non-member
    // cannot reach the metering path at all.
    const foreign = await consume('firewall', 1, 'quota-key-0005', b, ids.outsider);
    assert.equal(foreign.allowed, false);
    assert.equal(foreign.reason, 'TRIAL_NOT_FOUND');
    await assert.rejects(consume('firewall', 1, 'quota-key-0007', a, ids.operator), { status: 403 });
    const race = await Promise.allSettled([
      consume('ledger', 2, 'quota-race-0001'),
      consume('ledger', 2, 'quota-race-0002'),
    ]);
    const raceRows = race.map(result => result.status === 'fulfilled' ? result.value : result.reason);
    assert.equal(raceRows.filter(row => row.allowed === true).length, 1, 'exactly one concurrent consumption may commit');
    assert.equal(raceRows.filter(row => row.allowed === false && row.reason === 'QUOTA_EXCEEDED').length, 1);
    assert.equal((await owner.query("SELECT units FROM aigas_trial_quota_usage WHERE trial_id=$1 AND product_slug='ledger'", [trialA])).rows[0].units, '2');

    // Expiry: the recorded row is ACTIVATED but the window has passed. Expiry is a
    // system transition, entitlements close, and the state cannot return to ACTIVE.
    const pastStart = new Date(Date.now() - 49 * 3_600_000);
    const pastEnd = new Date(pastStart.getTime() + 48 * 3_600_000);
    await owner.query('ALTER TABLE aigas_trial_requests DISABLE TRIGGER aigas_trial_transition_guard');
    await owner.query('ALTER TABLE aigas_trial_requests DISABLE TRIGGER aigas_trial_readiness_guard');
    await owner.query('ALTER TABLE aigas_trial_entitlements DISABLE TRIGGER aigas_trial_entitlement_guard');
    try {
      await owner.query('UPDATE aigas_trial_requests SET activated_at=$2, expires_at=$3 WHERE id=$1', [trialA, pastStart, pastEnd]);
      await owner.query('UPDATE aigas_trial_entitlements SET starts_at=$2, ends_at=$3 WHERE trial_id=$1', [trialA, pastStart, pastEnd]);
    } finally {
      await owner.query('ALTER TABLE aigas_trial_requests ENABLE TRIGGER aigas_trial_transition_guard');
      await owner.query('ALTER TABLE aigas_trial_requests ENABLE TRIGGER aigas_trial_readiness_guard');
      await owner.query('ALTER TABLE aigas_trial_entitlements ENABLE TRIGGER aigas_trial_entitlement_guard');
    }
    assert.equal((await lifecycle(a)).state, 'EXPIRED');
    assert.equal((await productAccess(a, 'firewall')).state, 'EXPIRED');
    assert.equal((await consume('firewall', 1, 'quota-key-0006')).reason, 'TRIAL_WINDOW_ENDED');
    const expired = await service.operatorExpireTrial({ userId: ids.operator }, trialA);
    assert.equal(expired.state, 'EXPIRED');
    assert.equal((await owner.query("SELECT count(*)::int AS n FROM aigas_trial_entitlements WHERE trial_id=$1 AND status='EXPIRED'", [trialA])).rows[0].n, 2);
    assert.equal((await owner.query("SELECT actor_source FROM aigas_trial_events WHERE trial_id=$1 AND to_state='EXPIRED'", [trialA])).rows[0].actor_source, 'SYSTEM');
    await assert.rejects(service.operatorActivateTrial({ userId: ids.operator }, trialA, { customerAcknowledged: true }), { status: 409 });
    const closed = await service.operatorCloseTrial({ userId: ids.operator }, trialA, {});
    assert.equal(closed.state, 'CLOSED');
    assert.ok((await owner.query('SELECT closed_at FROM aigas_trial_requests WHERE id=$1', [trialA])).rows[0].closed_at);

    // A closed trial keeps its trail; no row was deleted.
    assert.equal((await owner.query('SELECT count(*)::int AS n FROM aigas_trial_requests WHERE id=$1', [trialA])).rows[0].n, 1);
    assert.ok((await owner.query('SELECT count(*)::int AS n FROM aigas_trial_events WHERE trial_id=$1', [trialA])).rows[0].n >= 5);
  } finally {
    await runtime.end().catch(() => {});
    await owner.end().catch(() => {});
  }
});
