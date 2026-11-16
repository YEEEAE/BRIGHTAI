import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { enforceDecision } from '../src/server/firewall/guard.mjs';
import { reviewBindingVersion } from '../src/server/firewall/escalation.mjs';

test('pending Firewall review requires the exact tenant/request/policy/fingerprint and operation', async () => {
  const tenantId = randomUUID(), requestId = randomUUID(), decisionId = randomUUID();
  const policyVersion = 'kernel:synthetic', requestFingerprint = 'a'.repeat(64);
  const review = { id: randomUUID(), status: 'PENDING', tenant_id: tenantId,
    subject_ref: decisionId, request_ref: requestId, policy_version: policyVersion,
    request_fingerprint: requestFingerprint, operation_type: 'SYNTHETIC_REVIEW_ONLY' };
  const escalation = { requested: true, code: 'HUMAN_GATE_CONFIGURED', operation_type: review.operation_type,
    binding: { version: reviewBindingVersion, tenantId, decisionId, requestId, policyVersion, requestFingerprint }, review };
  const input = { decision: { id: decisionId, action: 'ESCALATE' }, tenantId, requestId, policyVersion,
    requestFingerprint, kernelPolicy: { decision: 'ALLOW' }, escalation };
  let calls = 0;
  const check = data => enforceDecision(data, { resolveProvider: () => { calls++; throw new Error('must never resolve'); } });
  assert.equal((await check(input)).code, 'REVIEW_PENDING');
  for (const [field, value] of Object.entries({ tenant_id: randomUUID(), request_ref: randomUUID(),
    request_fingerprint: 'b'.repeat(64), operation_type: 'OTHER', status: 'APPROVED', id: 'invalid' })) {
    const result = await check({ ...input, escalation: { ...escalation, review: { ...review, [field]: value } } });
    assert.equal(result.code, 'HUMAN_GATE_REVIEW_UNBOUND', field);
  }
  const mismatch = await check({ ...input, escalation: { ...escalation,
    binding: { ...escalation.binding, requestFingerprint: 'b'.repeat(64) } } });
  assert.equal(mismatch.code, 'HUMAN_GATE_REVIEW_UNBOUND');
  assert.equal(calls, 0);
});

import { evaluateOutput } from '../src/server/firewall/guard.mjs';
import { explainInjectionRisk } from '../src/server/firewall/provider.mjs';
import { binding, decisionAllowed } from '../src/server/human-gate/core.mjs';
const rule = (action, pattern) => ({id:randomUUID(),name:'Synthetic rule',match_type:'CONTAINS',action,pattern,enabled:true,version:1,priority:1});
test('output rules and baseline never expose denied or sensitive provider text', () => {
  const rules=[rule('ALLOW','reply'),rule('DENY','blocked'),rule('REDACT','internal')];
  assert.equal(evaluateOutput('reply blocked',rules).allowed,false);
  assert.equal(evaluateOutput('reply password=secret123',rules).allowed,false);
  const safe=evaluateOutput('reply internal synthetic@example.test',rules);
  assert.equal(safe.allowed,true); assert.ok(!safe.text.includes('internal')); assert.ok(!safe.text.includes('@'));
  for(const text of ['unmatched','reply'+'x'.repeat(4000)]) assert.equal(evaluateOutput(text,rules).allowed,false);
  assert.equal(evaluateOutput('reply',undefined).allowed,false);
  assert.equal(evaluateOutput('reply',[...rules,rule('ESCALATE','reply')]).allowed,false);
});
test('Firewall review binds only exact metadata and always requires independent review', () => {
  const requester=randomUUID();
  const request={tenant_id:randomUUID(),requester_id:requester,operation_type:'FIREWALL_ESCALATION_REVIEW',subject_ref:randomUUID(),policy_version:randomUUID(),status:'PENDING',payload:{decision_id:randomUUID(),rule_id:randomUUID(),rule_version:1,request_fingerprint:'a'.repeat(64)}};
  assert.equal(decisionAllowed(request,requester,{separation_of_duties:false},{allowed:true}),false);
  assert.notEqual(binding(request),binding({...request,payload:{...request.payload,rule_version:2}}));
  assert.throws(()=>binding({...request,payload:{...request.payload,text:'raw'}}));
});
test('advisory cannot change verdict and sends metadata only', async () => {
  const tenantId=randomUUID(),decision={action:'DENY',reason:'RULE_DENY',raw:'NEVER SEND'};
  const result=await explainInjectionRisk({tenantId,decision,model:{tenantIds:[tenantId]}},{request:async input=>{
    assert.equal(JSON.stringify(input).includes('NEVER SEND'),false);
    return {choices:[{message:{content:'ALLOW'}}],action:'ALLOW'};
  }});
  assert.equal(result.deterministic.action,'DENY'); assert.equal(result.advisory_only,true); assert.equal(decision.action,'DENY');
});

import pg from 'pg';
import { localDatabaseUrl, installSchema, grantProduct, runtime } from './helpers/database.mjs';
import { tenantGuard } from '../src/server/kernel/service.mjs';
import { requestHumanReview } from '../src/server/firewall/escalation.mjs';
import { createHumanGateService } from '../src/server/human-gate/service.mjs';
const reviewDb=localDatabaseUrl('FIREWALL_REVIEW_TEST_DATABASE_URL');
test('atomic metadata review is visible, independent, revocable and rolls back with decision',{skip:!reviewDb},async()=>{
 const pool=new pg.Pool({connectionString:reviewDb});
 try {
  await installSchema(pool);
  const tenant=randomUUID(),owner={userId:randomUUID()},reviewer={userId:randomUUID()},ruleId=randomUUID();
  for(const user of [owner,reviewer]) await pool.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[user.userId]);
  await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic Firewall')",[tenant]);
  for(const user of [owner,reviewer]) await pool.query("INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'OWNER')",[tenant,user.userId]);
  await grantProduct(pool,tenant,'human-gate'); await grantProduct(pool,tenant,'firewall');
  await pool.query("INSERT INTO aigas_hg_policies(tenant_id,version,pending_minutes,approval_minutes,enabled,updated_by,separation_of_duties,firewall_escalation_enabled) VALUES($1,$2,60,30,true,$3,false,true)",[tenant,randomUUID(),owner.userId]);
  await pool.query("INSERT INTO aigas_fw_rules(id,tenant_id,name,pattern,action) VALUES($1,$2,'Synthetic rule','Synthetic','ESCALATE')",[ruleId,tenant]);
  const transact=async work=>{const c=await pool.connect();try{await c.query('BEGIN');await runtime(c);const r=await work(c);await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}};
  const service=createHumanGateService(transact);
  const create=async(fail=false)=>transact(async db=>{
   await tenantGuard(owner,tenant,db);
   const context={decisionId:randomUUID(),requestId:randomUUID(),policyVersion:'kernel:synthetic',requestFingerprint:'a'.repeat(64)};
   await db.query("INSERT INTO aigas_fw_decisions(id,tenant_id,action,reason,rule_id,rule_version,mode,request_id,policy_version,request_fingerprint) VALUES($1,$2,'ESCALATE','RULE_ESCALATE',$3,1,'GUARD',$4,$5,$6)",[context.decisionId,tenant,ruleId,context.requestId,context.policyVersion,context.requestFingerprint]);
   const escalation=await requestHumanReview(db,owner,tenant,context);
   if(fail) throw Error('ROLLBACK');
   return {context,escalation};
  });
  const {context,escalation}=await create();
  assert.equal((await enforceDecision({decision:{id:context.decisionId,action:'ESCALATE'},tenantId:tenant,requestId:context.requestId,policyVersion:context.policyVersion,requestFingerprint:context.requestFingerprint,kernelPolicy:{decision:'ALLOW'},escalation})).httpStatus,202);
  const list=await service(owner,tenant,'list'); assert.equal(list.requests[0].id,escalation.review.id); assert.equal(list.requests[0].canDecide,false);
  await assert.rejects(service(owner,tenant,'decide',{decision:'APPROVE',reason:'Self review'},new URLSearchParams(),escalation.review.id),e=>e.code==='SELF_REVIEW_DENIED');
  await service(reviewer,tenant,'decide',{decision:'REJECT',reason:'Independent rejection'},new URLSearchParams(),escalation.review.id);
  await assert.rejects(service(owner,tenant,'execute',{},new URLSearchParams(),escalation.review.id));
  const approved=await create();
  await service(reviewer,tenant,'decide',{decision:'APPROVE',reason:'Independent approval'},new URLSearchParams(),approved.escalation.review.id);
  await pool.query('UPDATE aigas_fw_rules SET version=2 WHERE id=$1',[ruleId]);
  const invalid=await service(owner,tenant,'list',{},new URLSearchParams('status=APPROVED')); assert.equal(invalid.requests[0].bindingValid,false);
  await assert.rejects(service(owner,tenant,'execute',{},new URLSearchParams(),approved.escalation.review.id),e=>e.code==='BINDING_INVALID');
  await pool.query('UPDATE aigas_fw_rules SET version=1 WHERE id=$1',[ruleId]);
  const count=Number((await pool.query('SELECT count(*) AS n FROM aigas_fw_decisions')).rows[0].n);
  await assert.rejects(create(true),/ROLLBACK/); assert.equal(Number((await pool.query('SELECT count(*) AS n FROM aigas_fw_decisions')).rows[0].n),count);
  const payload=(await pool.query('SELECT payload FROM aigas_hg_requests LIMIT 1')).rows[0].payload;
  assert.deepEqual(Object.keys(payload).sort(),['decision_id','rule_id','rule_version','request_fingerprint'].sort());
  await pool.query('UPDATE aigas_hg_policies SET firewall_escalation_enabled=false WHERE tenant_id=$1',[tenant]);
  assert.equal((await create()).escalation.code,'HUMAN_GATE_NOT_CONFIGURED');
 } finally {await pool.end();}
});
