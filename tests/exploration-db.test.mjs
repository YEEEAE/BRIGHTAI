import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { installSchema,localDatabaseUrl } from './helpers/database.mjs';
import { bootstrapExploration,closeExploration,exportExploration } from '../src/server/kernel/operator-exploration.mjs';
const url=localDatabaseUrl('EXPLORATION_TEST_DATABASE_URL');
test('operator bootstrap and bounded exploration across five products', {skip:!url},async()=>{
 const pool=new pg.Pool({connectionString:url});
 let app;
 try {
  await installSchema(pool);
  const op=randomUUID(),owner=randomUUID(),member=randomUUID(),other=randomUUID(),banned=randomUUID();
  for(const id of [op,owner,member,other,banned])await pool.query('INSERT INTO neon_auth."user"(id,banned) VALUES($1,$2)',[id,id===banned]);
  await pool.query("INSERT INTO aigas_trial_operators(user_id,status,approval_reference) VALUES($1,'ACTIVE','LOCAL_SYNTHETIC_OPERATOR')",[op]);
  const input={name:'Synthetic exploration A',ownerId:owner,memberIds:[member],limitUnits:5,approvalReference:'LOCAL_SYNTHETIC_EXPLORATION'};
  await assert.rejects(bootstrapExploration(pool,member,input),{code:'OPERATOR_REQUIRED'});
  await assert.rejects(bootstrapExploration(pool,op,{...input,memberIds:[banned]}),{code:'IDENTITY_REQUIRED'});
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n,0);
  const a=await bootstrapExploration(pool,op,input);
  const b=await bootstrapExploration(pool,op,{...input,name:'Synthetic exploration B',ownerId:other,memberIds:[]});
  assert.equal((await pool.query("SELECT count(*)::int n FROM aigas_memberships WHERE tenant_id=$1 AND role='OWNER'",[a.tenantId])).rows[0].n,1);
  // Audit failure after all writes must roll back the entire bootstrap.
  await pool.query("CREATE FUNCTION reject_bootstrap_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='operator.exploration.bootstrapped' THEN RETURN NULL; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_bootstrap_audit BEFORE INSERT ON aigas_audit_events FOR EACH ROW EXECUTE FUNCTION reject_bootstrap_audit()");
  await assert.rejects(bootstrapExploration(pool,op,{...input,name:'Rollback fixture'}));
  await pool.query('DROP TRIGGER reject_bootstrap_audit ON aigas_audit_events; DROP FUNCTION reject_bootstrap_audit()');
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n,2);


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
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_tenants')).rows[0].n,2);
  // Self-service uses verified identity, never a privileged operator request.
  // These catalog rows are synthetic DB fixtures, not email-delivery evidence.
  const {startTrial,trialHome,openTrialProduct}=await import('../src/server/kernel/self-service-trial.mjs');
  await assert.rejects(startTrial({userId:owner}),{code:'IDENTITY_NOT_VERIFIED'});
  await pool.query('UPDATE neon_auth."user" SET "emailVerified"=true WHERE id=$1',[owner]);
  const results=await Promise.all([startTrial({userId:owner}),startTrial({userId:owner})]);
  const trial=results[0].tenantId;assert.equal(results[1].tenantId,trial);
  assert.equal((await pool.query('SELECT role FROM aigas_memberships WHERE tenant_id=$1',[trial])).rows[0].role,'MEMBER');
  const home=await trialHome({userId:owner},trial);
  assert.equal(home.products.length,5);assert.equal(home.dataset.classification,'SYNTHETIC');
  assert.equal((await pool.query('SELECT count(*)::int n FROM aigas_re_assets WHERE tenant_id=$1',[trial])).rows[0].n,1);
  assert.ok(home.products.every(p=>p.remaining===100&&p.remainingSeconds<=172800&&p.operations.length>=1&&p.providerStatus==='PROVIDER APPROVAL REQUIRED'));
  assert.ok((await openTrialProduct({userId:owner},trial,'firewall')).href.includes(trial));
  await assert.rejects(trialHome({userId:member},trial),{status:403});
  await assert.rejects(transaction(db=>requireProductAccess(db,{userId:owner},trial,'secure-chat','send')),{code:'EXPLORATION_CAPABILITY_DENIED'});
  await createFirewallService()({userId:owner},trial,'dashboard');
  await pool.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[owner]);
  await assert.rejects(transaction(db=>requireProductAccess(db,{userId:owner},trial,'firewall','dashboard')),{status:403});
  await pool.query('UPDATE neon_auth."user" SET banned=false WHERE id=$1',[owner]);
  await pool.query("UPDATE aigas_exploration_grants SET starts_at=now()-interval '48 hours',ends_at=now() WHERE tenant_id=$1",[trial]);
  await assert.rejects(transaction(db=>requireProductAccess(db,{userId:owner},trial,'firewall','dashboard')),{code:'EXPLORATION_EXPIRED'});
  await assert.rejects(openTrialProduct({userId:owner},trial,'firewall'),{code:'TRIAL_UNAVAILABLE'});
  assert.ok((await trialHome({userId:owner},trial)).products.every(p=>p.operations.length===0));
  assert.equal((await startTrial({userId:owner})).tenantId,trial);
  assert.equal((await pool.query("SELECT count(*)::int n FROM aigas_audit_events WHERE tenant_id=$1 AND action='trial.synthetic.started'",[trial])).rows[0].n,1);
  assert.deepEqual((await pool.query('SELECT action FROM aigas_audit_events WHERE tenant_id=$1 ORDER BY created_at',[trial])).rows.map(r=>r.action),['trial.synthetic.started','exploration.browse.firewall']);
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
