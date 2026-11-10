import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { grantProduct, installSchema, localDatabaseUrl } from './helpers/database.mjs';

// Explicit disposable localhost DB only. The app connection is switched to the
// NOBYPASSRLS runtime role; fixtures and readback use a separate owner pool.
const url = localDatabaseUrl('KERNEL_IDENTITY_TEST_DATABASE_URL');

test('AU02/AU05/AU06/AU07 runtime: identity-scoped memberships, member races and policy lifecycle', { skip: !url }, async () => {
  const pool = new pg.Pool({ connectionString: url, max: 6 });
  try {
    await installSchema(pool);
    const ids = {
      owner1: randomUUID(), owner2: randomUUID(), owner3: randomUUID(), owner4: randomUUID(),
      owner5: randomUUID(), owner6: randomUUID(), admin1: randomUUID(),
      member1: randomUUID(), member2: randomUUID(), member3: randomUUID(),
      outsider: randomUUID(), noMembership: randomUUID(), banned: randomUUID(), invited: randomUUID(),
    };
    for (const [key, id] of Object.entries(ids)) {
      await pool.query('INSERT INTO neon_auth."user"(id,name,email,banned) VALUES($1,$2,$3,$4)', [id, `Synthetic ${key}`, `${key}@example.test`, key === 'banned']);
    }
    const a = randomUUID(), b = randomUUID();
    await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')", [a, b]);
    for (const [tenant, user, role] of [
      [a, ids.owner1, 'OWNER'], [a, ids.owner2, 'OWNER'], [a, ids.owner3, 'OWNER'], [a, ids.owner4, 'OWNER'],
      [a, ids.owner5, 'OWNER'], [a, ids.owner6, 'OWNER'], [a, ids.admin1, 'ADMIN'],
      [a, ids.member1, 'MEMBER'], [a, ids.member2, 'MEMBER'], [a, ids.member3, 'MEMBER'],
      [b, ids.outsider, 'OWNER'],
    ]) await pool.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)', [tenant, user, role]);
    await pool.query("INSERT INTO aigas_product_access(tenant_id,product_slug,status) SELECT $1, unnest($2::text[]), unnest($3::text[])",
      [a, ['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat'], ['ENABLED', 'ENABLED', 'ENABLED', 'FOUNDATION', 'FOUNDATION']]);
    await pool.query("INSERT INTO aigas_product_access(tenant_id,product_slug,status) SELECT $1, unnest($2::text[]), unnest($3::text[])",
      [b, ['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat'], ['FOUNDATION', 'FOUNDATION', 'ENABLED', 'FOUNDATION', 'FOUNDATION']]);
    await grantProduct(pool, a, 'firewall');

    const runtimeUrl = new URL(url); runtimeUrl.username = 'aigas_runtime';
    process.env.DATABASE_URL = runtimeUrl.href;
    process.env.AIGAS_REQUIRE_RLS = 'true';
    delete process.env.NEON_AUTH_BASE_URL; delete process.env.NEON_AUTH_URL;
    delete process.env.NEON_AUTH_JWKS_URL; delete process.env.NEON_JWKS_URL;
    const { dashboard, tenantMembers, createWorkspace, tenantGuard } = await import('../src/server/kernel/service.mjs');
    const { manageMember, manageInvitation, incomingInvitations } = await import('../src/server/kernel/administration.mjs');
    const { policyOperation, evaluateKernelPolicy } = await import('../src/server/kernel/policies.mjs');
    const { requireProductAccess } = await import('../src/server/kernel/access.mjs');
    const { transaction } = await import('../src/server/kernel/db.mjs');
    const productAccess = (identity, tenantId, slug) => transaction(db => requireProductAccess(db, identity, tenantId, slug));
    const evaluate = (identity, tenantId, context) => transaction(async db => {
      await tenantGuard(identity, tenantId, db);
      return evaluateKernelPolicy(db, identity, tenantId, context);
    });

    // AU02: the tenant is selected only from the verified identity's own memberships.
    assert.equal((await dashboard({ userId: ids.member1 })).tenant.tenant_id, a);
    await assert.rejects(dashboard({ userId: ids.outsider }, a), { status: 403, code: 'FORBIDDEN' });
    await assert.rejects(dashboard({ userId: ids.owner1 }, randomUUID()), { status: 403, code: 'FORBIDDEN' });
    await assert.rejects(dashboard({ userId: ids.owner1 }, 'not-a-uuid'), { status: 400, code: 'INVALID_WORKSPACE' });
    await assert.rejects(dashboard({ userId: ids.owner1 }, b), { status: 403, code: 'FORBIDDEN' });
    assert.equal((await dashboard({ userId: ids.noMembership })).tenant, null);
    await assert.rejects(dashboard({ userId: ids.banned }), { status: 401, code: 'UNAUTHORIZED' });

    // AU05: role changes are actor-authorized and a member is not visible to another tenant.
    assert.equal((await manageMember({ userId: ids.owner1 }, a, { operation: 'set-role', userId: ids.member3, role: 'ADMIN' })).role, 'ADMIN');
    await assert.rejects(manageMember({ userId: ids.admin1 }, a, { operation: 'set-role', userId: ids.member1, role: 'ADMIN' }), { status: 403, code: 'OWNER_REQUIRED' });
    await assert.rejects(manageMember({ userId: ids.owner1 }, a, { operation: 'set-role', userId: ids.owner1, role: 'ADMIN' }), { status: 409, code: 'SELF_ROLE_CHANGE_REJECTED' });
    await assert.rejects(manageMember({ userId: ids.owner1 }, a, { operation: 'revoke', userId: ids.owner1 }), { status: 409, code: 'SELF_REVOCATION_REJECTED' });
    assert.deepEqual(await manageMember({ userId: ids.owner1 }, a, { operation: 'revoke', userId: ids.member2 }), { persisted: true });
    // Revocation is effective on the next request, not at token expiry.
    assert.equal((await dashboard({ userId: ids.member2 })).tenant, null);
    await assert.rejects(dashboard({ userId: ids.member2 }, a), { status: 403 });
    assert.deepEqual(await manageMember({ userId: ids.owner1 }, a, { operation: 'revoke', userId: ids.member2 }), { persisted: true, unchanged: true });
    // Two owners revoking each other concurrently must never remove the last owner.
    const race = await Promise.allSettled([
      manageMember({ userId: ids.owner5 }, a, { operation: 'revoke', userId: ids.owner6 }),
      manageMember({ userId: ids.owner6 }, a, { operation: 'revoke', userId: ids.owner5 }),
    ]);
    const owners = (await pool.query("SELECT count(*)::int AS count FROM aigas_memberships WHERE tenant_id=$1 AND role='OWNER'", [a])).rows[0].count;
    assert.ok(owners >= 1, 'a concurrent revocation pair must preserve at least one owner');
    assert.ok(race.some(item => item.status === 'rejected'), 'at most one side of the revocation race may commit');

    // AU06: owner creates, a delegated admin approves, a different owner publishes.
    await policyOperation({ userId: ids.owner1 }, a, { operation: 'delegate-approver', userId: ids.admin1, expiresAt: new Date(Date.now() + 86_400_000).toISOString(), reason: 'اختبار محلي للاعتماد' });
    const definition = (overrides = {}) => ({ scope: 'ENTERPRISE', family: 'identity-test', ruleKey: 'allow-chat', conditions: {}, effect: 'ALLOW', obligations: [], mandatory: false, requiredApprovals: 1, effectiveFrom: null, expiresAt: null, reason: 'اختبار محلي', ...overrides });
    const allow = await policyOperation({ userId: ids.owner1 }, a, { operation: 'create', definition: definition() });
    await policyOperation({ userId: ids.owner1 }, a, { operation: 'submit', policyId: allow.policyId, version: 1, reason: 'إحالة للاختبار' });
    await assert.rejects(policyOperation({ userId: ids.owner1 }, a, { operation: 'approve', policyId: allow.policyId, version: 1, reason: 'اعتماد ذاتي مرفوض' }), { status: 403, code: 'SEPARATION_OF_DUTIES' });
    assert.equal((await policyOperation({ userId: ids.admin1 }, a, { operation: 'approve', policyId: allow.policyId, version: 1, reason: 'اعتماد مفوض' })).status, 'APPROVED');
    assert.equal((await policyOperation({ userId: ids.owner2 }, a, { operation: 'publish', policyId: allow.policyId, version: 1, expectedVersion: 0, reason: 'نشر الاختبار' })).status, 'PUBLISHED');
    assert.equal((await evaluate({ userId: ids.member1 }, a, { operation: 'chat.send', productSlug: 'secure-chat', resource_type: 'message' })).decision, 'ALLOW');

    const mandatory = await policyOperation({ userId: ids.owner1 }, a, { operation: 'create', definition: definition({ ruleKey: 'deny-secret', effect: 'HARD_DENY', mandatory: true }) });
    await policyOperation({ userId: ids.owner1 }, a, { operation: 'submit', policyId: mandatory.policyId, version: 1, reason: 'إحالة الإلزامي' });
    await policyOperation({ userId: ids.admin1 }, a, { operation: 'approve', policyId: mandatory.policyId, version: 1, reason: 'اعتماد الإلزامي' });
    await policyOperation({ userId: ids.owner2 }, a, { operation: 'publish', policyId: mandatory.policyId, version: 1, expectedVersion: 0, reason: 'نشر الإلزامي' });
    const blocked = await evaluate({ userId: ids.member1 }, a, { operation: 'chat.send', productSlug: 'secure-chat', resource_type: 'message' });
    assert.equal(blocked.decision, 'BLOCK'); assert.equal(blocked.reason, 'MANDATORY_BLOCK');
    await assert.rejects(policyOperation({ userId: ids.owner1 }, a, { operation: 'revise', policyId: mandatory.policyId, expectedVersion: 1, definition: definition({ ruleKey: 'deny-secret', effect: 'ALLOW' }) }), { status: 409, code: 'MANDATORY_POLICY_IMMUTABLE' });
    await assert.rejects(policyOperation({ userId: ids.owner2 }, a, { operation: 'retire', policyId: mandatory.policyId, version: 1, reason: 'محاولة إيقاف إلزامي' }), { status: 409, code: 'MANDATORY_POLICY_IMMUTABLE' });
    await assert.rejects(policyOperation({ userId: ids.owner1 }, a, { operation: 'create', definition: definition({ ruleKey: 'bad-dates', effectiveFrom: '2026-02-01T00:00:00Z', expiresAt: '2026-01-01T00:00:00Z' }) }), { status: 400, code: 'INVALID_POLICY' });

    // Four-eyes: two distinct approvers are required and the author cannot publish.
    const four = await policyOperation({ userId: ids.owner1 }, a, { operation: 'create', definition: definition({ ruleKey: 'four-eyes', requiredApprovals: 2 }) });
    await policyOperation({ userId: ids.owner1 }, a, { operation: 'submit', policyId: four.policyId, version: 1, reason: 'إحالة رباعية' });
    assert.equal((await policyOperation({ userId: ids.admin1 }, a, { operation: 'approve', policyId: four.policyId, version: 1, reason: 'المراجع الأول' })).status, 'IN_REVIEW');
    assert.equal((await policyOperation({ userId: ids.owner3 }, a, { operation: 'approve', policyId: four.policyId, version: 1, reason: 'المراجع الثاني' })).status, 'APPROVED');
    await assert.rejects(policyOperation({ userId: ids.owner1 }, a, { operation: 'publish', policyId: four.policyId, version: 1, expectedVersion: 0, reason: 'نشر المنشئ مرفوض' }), { status: 403, code: 'SEPARATION_OF_DUTIES' });
    assert.equal((await policyOperation({ userId: ids.owner4 }, a, { operation: 'publish', policyId: four.policyId, version: 1, expectedVersion: 0, reason: 'نشر طرف ثالث' })).status, 'PUBLISHED');
    await assert.rejects(policyOperation({ userId: ids.outsider }, a, { operation: 'list' }), { status: 403 });

    // AU07: administrative grant, trial and product isolation are decided separately.
    assert.equal((await productAccess({ userId: ids.member1 }, a, 'firewall')).role, 'MEMBER');
    await assert.rejects(productAccess({ userId: ids.member1 }, a, 'ledger'), { status: 403, code: 'PRODUCT_NOT_ENABLED' });
    await pool.query("UPDATE aigas_product_grants SET revoked_at=clock_timestamp() WHERE tenant_id=$1 AND product_slug='firewall'", [a]);
    await assert.rejects(productAccess({ userId: ids.member1 }, a, 'firewall'), { status: 403, code: 'PRODUCT_NOT_ENABLED' });

    const activateTrial = async (tenant, requestedBy, decidedBy, start, end) => {
      // P06-A: activation needs a verified environment/release plus an approved
      // readiness and quota row for the exact product. These are local synthetic
      // fixtures for an isolation test, not a product readiness result.
      const release = 'b'.repeat(40);
      const trialId = randomUUID();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('aigas.environment','local',true),set_config('aigas.release_sha',$1,true)", [release]);
        await client.query(`INSERT INTO aigas_release_readiness
          (environment,release_sha,product_slug,status,verified_at,verified_by,evidence_reference,expires_at)
          VALUES('local',$1,'human-gate','PASS',now(),$2,'LOCAL_SYNTHETIC_READINESS',now()+interval '1 hour')
          ON CONFLICT DO NOTHING`, [release, decidedBy]);
        await client.query(`INSERT INTO aigas_trial_quota_limits
          (product_slug,limit_units,approval_reference,approved_by,effective_from)
          VALUES('human-gate',10,'LOCAL_SYNTHETIC_QUOTA',$1,now()-interval '1 minute')
          ON CONFLICT (product_slug) DO NOTHING`, [decidedBy]);
        await client.query(`INSERT INTO aigas_trial_requests(id,tenant_id,requested_by,requested_products,deployment_mode,business_goal)
          VALUES($1,$2,$3,ARRAY['human-gate'],'SAAS','Synthetic local entitlement fixture for Kernel access separation')`, [trialId, tenant, requestedBy]);
        await client.query("UPDATE aigas_trial_requests SET state='ELIGIBILITY_REVIEW' WHERE id=$1 AND tenant_id=$2", [trialId, tenant]);
        await client.query("UPDATE aigas_trial_requests SET state='APPROVED',decided_by=$3,decided_at=clock_timestamp() WHERE id=$1 AND tenant_id=$2", [trialId, tenant, decidedBy]);
        await client.query(`UPDATE aigas_trial_requests SET state='ACTIVATED',decision_source='OPERATOR',decided_by=$3,decided_at=clock_timestamp(),activated_at=$4,expires_at=$5 WHERE id=$1 AND tenant_id=$2`, [trialId, tenant, decidedBy, start, end]);
        await client.query("INSERT INTO aigas_trial_entitlements(trial_id,tenant_id,product_slug,status,starts_at,ends_at) VALUES($1,$2,'human-gate','ACTIVE',$3,$4)", [trialId, tenant, start, end]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally { client.release(); }
      return trialId;
    };
    const activeStart = new Date(Date.now() - 3_600_000), activeEnd = new Date(activeStart.getTime() + 48 * 3_600_000);
    await activateTrial(a, ids.owner1, ids.owner2, activeStart, activeEnd);
    assert.equal((await productAccess({ userId: ids.member1 }, a, 'human-gate')).role, 'MEMBER');
    await assert.rejects(productAccess({ userId: ids.member1 }, a, 'risk-engine'), { status: 403, code: 'PRODUCT_NOT_ENABLED' });
    const expiredStart = new Date(Date.now() - 49 * 3_600_000), expiredEnd = new Date(expiredStart.getTime() + 48 * 3_600_000);
    await activateTrial(b, ids.outsider, ids.owner1, expiredStart, expiredEnd);
    await assert.rejects(productAccess({ userId: ids.outsider }, b, 'human-gate'), { status: 403, code: 'PRODUCT_NOT_ENABLED', dependencyStatus: 'expired' });

    // AU03/AU04 negative: a browser identity cannot self-grant a tenant or accept an invitation
    // before the reviewed P19 provisioning channel exists.
    const tenantsBefore = (await pool.query('SELECT count(*)::int AS count FROM aigas_tenants')).rows[0].count;
    await assert.rejects(createWorkspace({ userId: ids.noMembership }, 'مؤسسة اختبار'), { status: 503, code: 'WORKSPACE_PROVISIONING_REQUIRED' });
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM aigas_tenants')).rows[0].count, tenantsBefore);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM aigas_memberships WHERE user_id=$1', [ids.noMembership])).rows[0].count, 0);

    const orgId = randomUUID(), invitationId = randomUUID();
    await pool.query('INSERT INTO neon_auth.organization(id,name) VALUES($1,$2)', [orgId, 'Synthetic Org A']);
    await pool.query("INSERT INTO neon_auth.member(id,\"organizationId\",\"userId\",role) VALUES($1,$2,$3,'owner')", [randomUUID(), orgId, ids.owner1]);
    await pool.query('INSERT INTO aigas_auth_organizations(tenant_id,organization_id,linked_by) VALUES($1,$2,$3)', [a, orgId, ids.owner1]);
    await pool.query("INSERT INTO neon_auth.invitation(id,email,status,\"expiresAt\",\"organizationId\",\"inviterId\",role) VALUES($1,$2,'pending',now()+interval '1 day',$3,$4,'member')", [invitationId, `${'invited'}@example.test`, orgId, ids.owner1]);
    assert.equal((await manageInvitation({ userId: ids.owner1 }, a, { operation: 'register', invitationId })).persisted, true);
    // Under runtime RLS the invited identity has no tenant scope yet, so the registered
    // invitation is not discoverable and acceptance stays closed until P19 supplies the
    // reviewed bootstrap channel. This is a negative proof, not a granted membership.
    assert.equal((await incomingInvitations({ userId: ids.invited })).invitations.length, 0);
    await assert.rejects(manageInvitation({ userId: ids.invited }, null, { operation: 'accept', invitationId }), { status: 503, code: 'INVITATION_BOOTSTRAP_REQUIRED' });
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2', [a, ids.invited])).rows[0].count, 0);
  } finally {
    await pool.end();
  }
});
