import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { grantProduct,installSchema,localDatabaseUrl } from './helpers/database.mjs';
import { bootstrapExploration,closeExploration,exportExploration } from '../src/server/kernel/operator-exploration.mjs';
const url=localDatabaseUrl('EXPLORATION_TEST_DATABASE_URL');
test('operator bootstrap and bounded exploration across five products', {skip:!url},async()=>{
 const pool=new pg.Pool({connectionString:url});
 let app;
 try {
  await installSchema(pool, {through:'0039'});
  const legacyActor=randomUUID();
  const legacy=await pool.connect();
  let legacyTenant;
  try {
   await legacy.query('BEGIN');
   await legacy.query('INSERT INTO neon_auth."user"(id,"emailVerified") VALUES($1,true)',[legacyActor]);
   await legacy.query("SELECT set_config('aigas.user_id',$1,true)",[legacyActor]);
   legacyTenant=(await legacy.query('SELECT public.aigas_start_self_service_trial() AS id')).rows[0].id;
   await legacy.query('COMMIT');
  } finally { legacy.release(); }
  const legacyWindow=(await pool.query(`SELECT starts_at,ends_at FROM aigas_exploration_grants
    WHERE tenant_id=$1 AND product_slug='ledger'`,[legacyTenant])).rows[0];
  await pool.query(await readFile(new URL('../migrations/0040_aigas_self_service_trial_lifecycle.sql',import.meta.url),'utf8'));
  const op=randomUUID(),owner=randomUUID(),member=randomUUID(),other=randomUUID(),banned=randomUUID();
  for(const id of [op,owner,member,other,banned])await pool.query('INSERT INTO neon_auth."user"(id,banned) VALUES($1,$2)',[id,id===banned]);
  await pool.query("INSERT INTO aigas_trial_operators(user_id,status,approval_reference) VALUES($1,'ACTIVE','LOCAL_SYNTHETIC_OPERATOR')",[op]);
  const input={name:'Synthetic exploration A',ownerId:owner,memberIds:[member],limitUnits:5,approvalReference:'LOCAL_SYNTHETIC_EXPLORATION'};
  await assert.rejects(bootstrapExploration(pool,member,input),{code:'OPERATOR_REQUIRED'});
  await assert.rejects(bootstrapExploration(pool,op,{...input,memberIds:[banned]}),{code:'IDENTITY_REQUIRED'});
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n,1);
  const a=await bootstrapExploration(pool,op,input);
  const b=await bootstrapExploration(pool,op,{...input,name:'Synthetic exploration B',ownerId:other,memberIds:[]});
  assert.equal((await pool.query("SELECT count(*)::int n FROM aigas_memberships WHERE tenant_id=$1 AND role='OWNER'",[a.tenantId])).rows[0].n,1);
  // Audit failure after all writes must roll back the entire bootstrap.
  await pool.query("CREATE FUNCTION reject_bootstrap_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='operator.exploration.bootstrapped' THEN RETURN NULL; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_bootstrap_audit BEFORE INSERT ON aigas_audit_events FOR EACH ROW EXECUTE FUNCTION reject_bootstrap_audit()");
  await assert.rejects(bootstrapExploration(pool,op,{...input,name:'Rollback fixture'}));
  await pool.query('DROP TRIGGER reject_bootstrap_audit ON aigas_audit_events; DROP FUNCTION reject_bootstrap_audit()');
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n,3);


  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_release_readiness')).rows[0].n,0);
  const runtime=new URL(url);runtime.username='aigas_runtime';process.env.DATABASE_URL=runtime.href;process.env.AIGAS_REQUIRE_RLS='true';
  const {database,transaction}=await import('../src/server/kernel/db.mjs');app=database();
  const {dashboard}=await import('../src/server/kernel/service.mjs');
  const {requireProductAccess}=await import('../src/server/kernel/access.mjs');
  const {createFirewallService}=await import('../src/server/firewall/service.mjs');
  const {createLedgerService}=await import('../src/server/ledger/service.mjs');
  const {createHumanGateService}=await import('../src/server/human-gate/service.mjs');
  const {createRiskEngineService}=await import('../src/server/risk-engine/service.mjs');
  const identity={userId:member};
  const view=await dashboard(identity,a.tenantId);
  assert.equal(view.products.filter(p=>p.enabled&&p.exploration?.readiness==='NOT_ASSERTED').length,5);
  const {authorizedProductDestination}=await import('../src/shared/product-navigation.mjs');
  assert.equal(authorizedProductDestination('/app/secure-chat/',view),`/app/secure-chat/?workspace=${a.tenantId}`);
  const browse=(tenant,slug,operation)=>transaction(db=>requireProductAccess(db,identity,tenant,slug,operation));
  await createFirewallService()(identity,a.tenantId,'dashboard');
  await createLedgerService()(identity,a.tenantId,'list');
  await createHumanGateService()(identity,a.tenantId,'list');
  await createRiskEngineService()(identity,a.tenantId,'list');
  await browse(a.tenantId,'secure-chat','browse');
  await assert.rejects(browse(b.tenantId,'secure-chat','browse'),{status:403});
  await assert.rejects(browse(a.tenantId,'secure-chat','send'),{code:'EXPLORATION_CAPABILITY_DENIED'});
  await assert.rejects(browse(a.tenantId,'ledger','create'),{code:'EXPLORATION_CAPABILITY_DENIED'});
  // Atomic quota: one remaining unit, concurrent calls cannot both succeed.
  await pool.query("UPDATE aigas_exploration_grants SET used=limit_units-1 WHERE tenant_id=$1 AND product_slug='secure-chat'",[a.tenantId]);
  const race=await Promise.allSettled([browse(a.tenantId,'secure-chat','browse'),browse(a.tenantId,'secure-chat','browse')]);
  assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(race.find(r=>r.status==='rejected').reason.code,'EXPLORATION_QUOTA_EXCEEDED');
  await pool.query("UPDATE aigas_exploration_grants SET starts_at=now()-interval '49 hours',ends_at=now()-interval '1 hour' WHERE tenant_id=$1 AND product_slug='ledger'",[a.tenantId]);
  await assert.rejects(browse(a.tenantId,'ledger','list'),{code:'EXPLORATION_EXPIRED'});
  const report=await exportExploration(pool,op,a.tenantId);
  assert.equal(report.grants.length,5);assert.equal(report.purge.deleteExecuted,false);
  assert.ok(report.events.some(e=>e.action==='operator.exploration.bootstrapped'));
  assert.ok(report.events.some(e=>e.action==='exploration.browse.firewall'));
  const window=report.grants.find(g=>g.product_slug==='firewall');assert.equal(new Date(window.ends_at)-new Date(window.starts_at),172800000);
  await assert.rejects(transaction(async db=>{await db.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Self grant')",[randomUUID()]);}),{code:'42501'});
  await assert.rejects(transaction(db=>db.query('UPDATE aigas_exploration_grants SET used=0 WHERE tenant_id=$1',[a.tenantId])),{code:'42501'});
  await closeExploration(pool,op,a.tenantId);
  await assert.rejects(browse(a.tenantId,'firewall','dashboard'),{code:'EXPLORATION_EXPIRED'});
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n,3);
  // Self-service uses verified identity, never a privileged operator request.
  // These catalog rows are synthetic DB fixtures, not email-delivery evidence.
  const {startTrial,trialHome,openTrialProduct}=await import('../src/server/kernel/self-service-trial.mjs');
  const upgraded=await trialHome({userId:legacyActor});
  assert.equal(upgraded.tenantId,legacyTenant);
  assert.equal(upgraded.status,'ACTIVE');
  assert.deepEqual([upgraded.startedAt,upgraded.expiresAt],[legacyWindow.starts_at,legacyWindow.ends_at]);
  await assert.rejects(startTrial({userId:owner}),{code:'IDENTITY_NOT_VERIFIED'});
  await pool.query('UPDATE neon_auth."user" SET "emailVerified"=true WHERE id=$1',[owner]);
  const trialIdentity={userId:owner};
  assert.equal((await trialHome(trialIdentity)).status,'NOT_STARTED');
  await assert.rejects(startTrial(trialIdentity,a.tenantId),{code:'TRIAL_WORKSPACE_UNAVAILABLE'});
  await pool.query('REVOKE SELECT ON aigas_ld_events FROM aigas_runtime');
  assert.equal((await trialHome(trialIdentity)).status,'NOT_CONFIGURED');
  await assert.rejects(startTrial(trialIdentity),{code:'TRIAL_DEPENDENCIES_UNAVAILABLE',status:503});
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_self_service_trials WHERE user_id=$1',[owner])).rows[0].n,0);
  await pool.query('GRANT SELECT ON aigas_ld_events TO aigas_runtime');
  const results=await Promise.all(Array.from({length:8},()=>startTrial(trialIdentity)));
  const trial=results[0].tenantId;
  assert.ok(results.every(result=>result.tenantId===trial));
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_self_service_trials WHERE user_id=$1',[owner])).rows[0].n,1);
  assert.equal((await pool.query('SELECT role FROM aigas_memberships WHERE tenant_id=$1',[trial])).rows[0].role,'MEMBER');
  const home=await trialHome(trialIdentity);
  assert.equal(home.tenantId,trial);
  assert.equal(home.status,'ACTIVE');
  assert.equal(home.activationSource,'SELF_SERVICE');
  assert.equal(home.expiresAt-home.startedAt,172800000);
  assert.ok(home.remainingSeconds>0&&home.remainingSeconds<=172800);
  assert.equal(home.products.length,5);assert.equal(home.dataset.classification,'SYNTHETIC');
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_re_assets WHERE tenant_id=$1',[trial])).rows[0].n,1);
  assert.ok(home.products.every(p=>p.remaining===100&&p.status==='READ_ONLY'&&p.operations.length>=1&&p.providerStatus==='NOT_CONFIGURED'));
  assert.ok((await openTrialProduct({userId:owner},trial,'firewall')).href.includes(trial));
  await assert.rejects(trialHome({userId:member},trial),{status:403});
  await assert.rejects(openTrialProduct({userId:member},trial,'firewall'),{status:403});
  await pool.query("INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'MEMBER')",[trial,member]);
  await assert.rejects(browse(trial,'secure-chat','browse'),{code:'TRIAL_WORKSPACE_MISMATCH'});
  await grantProduct(pool,trial,'secure-chat');
  await assert.rejects(transaction(db=>requireProductAccess(db,{userId:owner},trial,'secure-chat','send')),{code:'EXPLORATION_CAPABILITY_DENIED'});
  await createFirewallService()({userId:owner},trial,'dashboard');
  await pool.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[owner]);
  await assert.rejects(transaction(db=>requireProductAccess(db,{userId:owner},trial,'firewall','dashboard')),{status:403});
  await pool.query('UPDATE neon_auth."user" SET banned=false WHERE id=$1',[owner]);
  const replay=await startTrial(trialIdentity,trial);
  assert.equal(replay.tenantId,trial);
  const restored=await trialHome(trialIdentity);
  assert.deepEqual([restored.startedAt,restored.expiresAt],[home.startedAt,home.expiresAt]);
  assert.equal(restored.products.find(product=>product.slug==='firewall').remaining,99);

  // Move only the lifecycle window to the boundary using the fixture owner.
  // The product grants remain active and cannot extend this window.
  const {rows:[expiredWindow]}=await pool.query(`WITH boundary AS (SELECT clock_timestamp() AS expires)
    UPDATE aigas_self_service_trials SET started_at=expires-interval '48 hours',expires_at=expires
    FROM boundary WHERE tenant_id=$1 RETURNING started_at,expires_at`,[trial]);
  await assert.rejects(transaction(db=>requireProductAccess(db,{userId:owner},trial,'firewall','dashboard')),{code:'EXPLORATION_EXPIRED'});
  await assert.rejects(transaction(db=>requireProductAccess(db,trialIdentity,trial,'secure-chat','browse')),{code:'EXPLORATION_EXPIRED'});
  const expired=await Promise.all([
    trialHome(trialIdentity), trialHome(trialIdentity,trial), startTrial(trialIdentity),
  ]);
  for(const view of expired.slice(0,2)){
    assert.equal(view.status,'EXPIRED');
    assert.equal(view.remainingSeconds,0);
    assert.deepEqual([view.startedAt,view.expiresAt],[expiredWindow.started_at,expiredWindow.expires_at]);
    assert.ok(view.products.every(p=>p.operations.length===0));
  }
  assert.equal(expired[2].tenantId,trial);
  await assert.rejects(openTrialProduct({userId:owner},trial,'firewall'),{code:'TRIAL_UNAVAILABLE'});
  const receipt=(await pool.query('SELECT status,started_at,expires_at,user_id FROM aigas_self_service_trials WHERE tenant_id=$1',[trial])).rows[0];
  assert.deepEqual(receipt,{status:'EXPIRED',...expiredWindow,user_id:owner});
  const events=(await pool.query('SELECT action,created_at FROM aigas_audit_events WHERE tenant_id=$1 ORDER BY created_at',[trial])).rows;
  assert.deepEqual(events.map(row=>row.action),['trial.synthetic.started','exploration.browse.firewall','trial.synthetic.expired']);
  assert.deepEqual(events[0].created_at,home.startedAt);
  assert.ok(events[2].created_at>=expiredWindow.expires_at);
  // No direct changes to the one-trial receipt, membership or quota by runtime.
  await assert.rejects(transaction(db=>db.query('UPDATE aigas_self_service_trials SET dataset=dataset')),{code:'42501'});
  const tenantCount=(await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n;
  await pool.query('UPDATE neon_auth."user" SET "emailVerified"=true WHERE id=$1',[member]);
  await pool.query("CREATE FUNCTION reject_trial_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='trial.synthetic.started' THEN RETURN NULL; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_trial_audit BEFORE INSERT ON aigas_audit_events FOR EACH ROW EXECUTE FUNCTION reject_trial_audit()");
  await assert.rejects(startTrial({userId:member}),{code:'P0001'});
  await pool.query('DROP TRIGGER reject_trial_audit ON aigas_audit_events; DROP FUNCTION reject_trial_audit()');
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n,tenantCount);
 }finally{if(app)await app.end();await pool.end();}
});
