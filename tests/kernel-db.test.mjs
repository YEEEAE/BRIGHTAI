import { localDatabaseUrl, installSchema, grantProduct, runtime } from './helpers/database.mjs';
// Explicit disposable localhost DB only. Never load .env or write to Neon.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
const url=localDatabaseUrl('KERNEL_TEST_DATABASE_URL');
test('Kernel DB: real product state, tenant-scoped totals, activity and member roles', { skip: !url }, async () => {
  const pool = new pg.Pool({ connectionString: url, max: 5 });
  try {
    await installSchema(pool);
    const owner = randomUUID(), admin = randomUUID(), member = randomUUID(), outsider = randomUUID(), banned = randomUUID();
    const a = randomUUID(), b = randomUUID();
    for (const [id, name, email] of [[owner, 'Synthetic Owner', 'owner@example.test'], [admin, 'Synthetic Admin', 'admin@example.test'], [member, 'Synthetic Member', 'member@example.test'], [outsider, 'Synthetic Outsider', 'outsider@example.test'], [banned, 'Synthetic Banned', 'banned@example.test']]) {
      await pool.query('INSERT INTO neon_auth."user"(id,name,email,banned) VALUES($1,$2,$3,false)', [id, name, email]);
    }
    await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')", [a, b]);
    for (const [tenant, user, role] of [[a, owner, 'OWNER'], [a, admin, 'ADMIN'], [a, member, 'MEMBER'], [b, outsider, 'OWNER']]) {
      await pool.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)', [tenant, user, role]);
    }
    await pool.query("INSERT INTO aigas_product_access(tenant_id,product_slug,status) SELECT $1, unnest($2::text[]), unnest($3::text[])", [a, ['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat'], ['ENABLED', 'FOUNDATION', 'DISABLED', 'FOUNDATION', 'FOUNDATION']]);
    await pool.query("INSERT INTO aigas_product_access(tenant_id,product_slug,status) SELECT $1, unnest($2::text[]), unnest($3::text[])", [b, ['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat'], ['FOUNDATION', 'FOUNDATION', 'FOUNDATION', 'FOUNDATION', 'FOUNDATION']]);
    await pool.query("INSERT INTO aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES($1,$2,$3,'workspace.created'),($4,$2,$5,'firewall.rule.created')", [randomUUID(), a, owner, randomUUID(), admin]);
    await pool.query("INSERT INTO aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES($1,$2,$3,'workspace.created')", [randomUUID(), b, outsider]);
    await grantProduct(pool,a,'firewall');
    // Regression: real runtime locks work without self-mutation or foreign visibility.
    const locked=await pool.connect(), contender=await pool.connect();
    try {
      await locked.query('BEGIN'); await runtime(locked);
      assert.equal((await locked.query('SELECT * FROM public.aigas_lock_member($1,$2)',[a,owner])).rowCount,0);
      await locked.query("SELECT set_config('aigas.user_id',$1,true)",[owner]);
      assert.equal((await locked.query('SELECT * FROM public.aigas_lock_member($1,$2)',[a,owner])).rows[0].role,'OWNER');
      assert.equal((await locked.query('SELECT * FROM public.aigas_lock_member($1,$2)',[b,outsider])).rowCount,0);
      await locked.query("SELECT set_config('aigas.tenant_id',$1,true)",[a]);
      assert.equal((await locked.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2 RETURNING role",[a,owner])).rowCount,0);
      assert.equal((await locked.query('SELECT * FROM public.aigas_locked_product_grants($1)',[b])).rowCount,0);
      await contender.query('BEGIN'); await contender.query("SET LOCAL lock_timeout='100ms'");
      await assert.rejects(contender.query("UPDATE aigas_memberships SET role='ADMIN' WHERE tenant_id=$1 AND user_id=$2",[a,owner]),{code:'55P03'});
      await contender.query('ROLLBACK');
      assert.equal((await locked.query('SELECT * FROM public.aigas_locked_product_grants($1)',[a])).rowCount,1);
      await contender.query('BEGIN'); await contender.query("SET LOCAL lock_timeout='100ms'");
      await assert.rejects(contender.query("UPDATE aigas_product_grants SET revoked_at=now() WHERE tenant_id=$1",[a]),{code:'55P03'});
      await contender.query('ROLLBACK'); await locked.query('ROLLBACK');
      assert.equal((await pool.query('SELECT role FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2',[a,owner])).rows[0].role,'OWNER');
      await locked.query('BEGIN'); await locked.query('SET LOCAL ROLE authenticated');
      await assert.rejects(locked.query('SELECT * FROM public.aigas_lock_member($1,$2)',[a,owner]),{code:'42501'});
      await locked.query('ROLLBACK');
    } finally { await locked.query('ROLLBACK'); await contender.query('ROLLBACK'); locked.release(); contender.release(); }
    const runtimeUrl=new URL(url);runtimeUrl.username='aigas_runtime';
    process.env.DATABASE_URL = runtimeUrl.href;
    process.env.AIGAS_REQUIRE_RLS='true';
    delete process.env.NEON_AUTH_BASE_URL; delete process.env.NEON_AUTH_URL;
    delete process.env.NEON_AUTH_JWKS_URL; delete process.env.NEON_JWKS_URL;
    const { dashboard, tenantMembers, operationalHealth } = await import('../src/server/kernel/service.mjs');
    const seen = await dashboard({ userId: owner });
    assert.equal(seen.tenant.tenant_id, a);
    assert.equal(seen.connection, 'CONNECTED');
    assert.equal(seen.summary.members, 3);
    assert.equal(seen.summary.events, 2);
    assert.equal(seen.canManageMembers, true);
    const firewall = seen.products.find(p => p.slug === 'firewall');
    assert.equal(firewall.state, 'ENABLED'); assert.equal(firewall.enabled, true);
    assert.equal(firewall.label, 'مفعّل للمؤسسة'); assert.equal(firewall.href, '/app/firewall/');
    assert.equal(seen.products.find(p => p.slug === 'human-gate').href, null);
    assert.equal(seen.products.find(p => p.slug === 'ledger').state, 'NOT_CONFIGURED');
    // Audit rows never cross the tenant boundary, and display names replace raw ids.
    assert.equal(seen.activity.length, 2);
    assert.ok(seen.activity.every(row => ['workspace.created', 'firewall.rule.created'].includes(row.action)));
    assert.ok(seen.activity.every(row=>row.actor===null), 'Activity must not disclose actor names');
    const asMember = await dashboard({ userId: member });
    assert.equal(asMember.canManageMembers, false);
    assert.equal(asMember.summary.members, 3);
    const elsewhere = await dashboard({ userId: outsider });
    assert.equal(elsewhere.tenant.tenant_id, b);
    assert.equal(elsewhere.summary.members, 1); assert.equal(elsewhere.summary.events, 1);
    // Membership in one tenant never authorizes another.
    await assert.rejects(dashboard({ userId: outsider }, a), { status: 403 });
    await assert.rejects(tenantMembers({ userId: outsider }, a), { status: 403 });
    await pool.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1', [banned]);
    await assert.rejects(dashboard({ userId: banned }), { status: 401 });
    await assert.rejects(tenantMembers({ userId: banned }, a), { status: 401 });
    const userOnly = randomUUID();
    await pool.query("INSERT INTO neon_auth.\"user\"(id,name,email,banned) VALUES($1,'Synthetic New','new@example.test',false)", [userOnly]);
    const fresh = await dashboard({ userId: userOnly });
    assert.equal(fresh.tenant, null); assert.equal(fresh.summary, null); assert.equal(fresh.activity.length, 0);
    assert.ok(fresh.products.every(p => p.href === null || p.state === 'NOT_CONFIGURED'));
    const roster = await tenantMembers({ userId: owner });
    assert.equal(roster.members.length, 3);
    assert.equal(roster.members[0].role, 'OWNER'); assert.equal(roster.members[0].roleLabel, 'مالك');
    assert.ok(roster.members.every(m => typeof m.email === 'string' && m.email.endsWith('@example.test')));
    assert.equal(roster.canManage, true);
    assert.equal(roster.invitation.available, false);
    const memberView = await tenantMembers({ userId: member });
    assert.ok(memberView.members.every(m => m.email === null));
    assert.equal(memberView.canManage, false);
    const health = await operationalHealth();
    assert.equal(health.checks.database, 'READY'); assert.equal(health.checks.schema, 'READY');
    assert.equal(health.checks.auth, 'AUTH_SETUP_REQUIRED'); assert.equal(health.status, 'degraded');
    await pool.query('ALTER TABLE public.aigas_audit_events RENAME TO fixture_unavailable_audit_events');
    const missing = await operationalHealth();
    assert.equal(missing.checks.schema, 'SCHEMA_MISSING'); assert.equal(missing.status, 'degraded');
  } finally {
    await pool.end();
  }
});
