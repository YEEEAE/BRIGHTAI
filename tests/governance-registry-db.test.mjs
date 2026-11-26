import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { installSchema, localDatabaseUrl } from './helpers/database.mjs';
const url = localDatabaseUrl('REGISTRY_TEST_DATABASE_URL');
test('registry isolates tenants, revisions and independent expiring decisions', { skip: !url }, async () => {
  const pool = new pg.Pool({connectionString:url});
  try {
    await installSchema(pool);
    const owner=randomUUID(), admin=randomUUID(), member=randomUUID(), outsider=randomUUID(), tenant=randomUUID(), other=randomUUID();
    for (const user of [owner,admin,member,outsider]) await pool.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[user]);
    await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Registry A'),($2,'Registry B')",[tenant,other]);
    for (const [t,u,r] of [[tenant,owner,'OWNER'],[tenant,admin,'ADMIN'],[tenant,member,'MEMBER'],[other,outsider,'OWNER']]) await pool.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u,r]);
    const runtime = new URL(url); runtime.username = 'aigas_app_login'; process.env.DATABASE_URL = runtime.href; process.env.AIGAS_DB_RUNTIME_ROLE='aigas_runtime'; process.env.AIGAS_REQUIRE_RLS='true';
    const {registryOperation: call} = await import('../src/server/governance/persistent-registry.mjs');
    const invoke=(actor,body) => call({userId:actor},tenant,body);
    const entry={kind:'THIRD_PARTY_AGENT',name:'Synthetic agent',ownerId:admin,mandate:'Read approved records',productSlug:'secure-chat',capabilities:['read.records'],sourceReference:'fixture.agent.v1',links:[{requirement:'req.1',control:'ctl.1',finding:'find.1',evidence:'evidence.1'}]};
    await assert.rejects(invoke(member,{operation:'create',entry}),{status:403});
    const created=await invoke(admin,{operation:'create',entry});
    await assert.rejects(call({userId:outsider},tenant),{status:403});
    assert.equal((await invoke(member)).entries[0].status,'DRAFT');
    await assert.rejects(invoke(admin,{operation:'approve',id:created.id,version:1,expiresAt:'2099-01-01T00:00:00Z',reason:'approve'}),{status:403});
    await assert.rejects(invoke(owner,{operation:'approve',id:created.id,version:1,expiresAt:'2000-01-01T00:00:00Z',reason:'expired'}),{code:'REGISTRY_EXPIRY_INVALID'});
    assert.equal((await invoke(owner,{operation:'approve',id:created.id,version:1,expiresAt:'2099-01-01T00:00:00Z',reason:'reviewed'})).status,'APPROVED');
    assert.equal((await invoke(member)).entries[0].status,'APPROVED');
    await pool.query("UPDATE aigas_registry_decisions SET expires_at=clock_timestamp()-interval '1 second' WHERE tenant_id=$1 AND entry_id=$2 AND decision='APPROVED'",[tenant,created.id]);
    assert.equal((await invoke(member)).entries[0].status,'EXPIRED');
    await invoke(owner,{operation:'revoke',id:created.id,version:1,reason:'withdrawn'});
    assert.equal((await invoke(member)).entries[0].status,'REVOKED');
    await assert.rejects(invoke(owner,{operation:'revoke',id:created.id,version:1,reason:'again'}),{code:'REGISTRY_REVOCATION_INVALID'});
    await invoke(admin,{operation:'revise',id:created.id,expectedVersion:1,entry});
    await assert.rejects(invoke(admin,{operation:'revise',id:created.id,expectedVersion:1,entry}),{code:'REGISTRY_VERSION_CONFLICT'});
    assert.equal((await invoke(member)).entries[0].status,'DRAFT');
    const own=await invoke(owner,{operation:'create',entry:{...entry,ownerId:owner}});
    await assert.rejects(invoke(owner,{operation:'approve',id:own.id,version:1,expiresAt:'2099-01-01T00:00:00Z',reason:'self approval'}),{code:'SEPARATION_OF_DUTIES'});
  } finally { await pool.end(); }
});
