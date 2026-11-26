import { localDatabaseUrl, installSchema, grantProduct, runtime } from './helpers/database.mjs';
// Explicit disposable localhost DB only. Never load .env or write to Neon.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { createRiskEngineService } from '../src/server/risk-engine/service.mjs';
import { createHandler } from '../src/server/risk-engine/http.mjs';
import { createHumanGateService } from '../src/server/human-gate/service.mjs';
import { createRiskAssist } from '../src/server/risk-engine/assist.mjs';
const url=localDatabaseUrl('RISK_ENGINE_TEST_DATABASE_URL');
test('Risk Engine DB: persistence, version history, tenant/role rejection, races and atomic audit',{skip:!url},async()=>{
 const pool=new pg.Pool({connectionString:url,max:5});
 try{
  await installSchema(pool);
    const owner={userId:randomUUID()},admin={userId:randomUUID()},member={userId:randomUUID()},outsider={userId:randomUUID()},tenant=randomUUID(),other=randomUUID();
  for(const user of [owner,admin,member,outsider])await pool.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[user.userId]);
  await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
  for(const [u,t,r]of [[owner,tenant,'OWNER'],[admin,tenant,'ADMIN'],[member,tenant,'MEMBER'],[outsider,other,'OWNER']])await pool.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u.userId,r]);
 await grantProduct(pool,tenant,'risk-engine'); await grantProduct(pool,other,'risk-engine');
  const transact=async work=>{const c=await pool.connect();try{await c.query('BEGIN');await runtime(c);const result=await work(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK'); throw e;}finally{c.release();}};
  const send=async(user,op='list',body={},id,scope=tenant,page=1,filters={},key)=>{
   // Inject verified identity only in this harness; production handler keeps JWT verification.
   const handler=createHandler(async()=>user,createRiskEngineService(transact)),method=['list','history','revisions'].includes(op)?'GET':op==='update'?'PATCH':op==='archive'?'DELETE':'POST';
   const query=new URLSearchParams({workspace:scope,page:String(page),...filters});
   const path={list:'assets',create:'assets',history:`assets/${id}/assessments`,assess:`assets/${id}/assessments`,
    revisions:`assets/${id}/revisions`,treatments:`assets/${id}/treatments`,'save-treatment':`assets/${id}/treatments`,
    actions:'actions',export:'export'}[op]??`assets/${id}`;
   const r=await handler(new Request(`https://brightai.live/app/api/risk-engine/${path}/?${query}`,{method,headers:{origin:'https://brightai.live','content-type':'application/json',...(key?{'Idempotency-Key':key}:{})},...(method!=='GET'?{body:JSON.stringify({...body,synthetic_data_confirmed:true})}:{})}),op,id);return {status:r.status,data:await r.json()};
  };
  const a={name:'Synthetic use',owner:'Synthetic team',purpose:'Public summaries',data_classification:'PUBLIC'};
  const assessment={asset_version:1,likelihood:1,impact:2,likelihood_reason:'Limited synthetic use',impact_reason:'Reversible synthetic impact',controls_reason:'Manual review and data minimization'};
  const createKey=randomUUID();
  const [created,replay]=await Promise.all([
   send(owner,'create',a,undefined,tenant,1,{},createKey),
   send(owner,'create',a,undefined,tenant,1,{},createKey),
  ]);
  assert.equal(created.status,201);assert.equal(replay.status,201);
  const id=created.data.asset.id;
  assert.equal(replay.data.asset.id,id);
  assert.equal([created,replay].filter(item=>item.data.replayed).length,1);
  assert.equal((await send(owner,'create',{...a,name:'Different asset'},undefined,tenant,1,{},createKey)).data.code,'IDEMPOTENCY_CONFLICT');
  assert.equal((await send(owner)).data.assets[0].assessment_status,'NOT_ASSESSED');
  assert.equal((await send(owner)).data.summary.needs_reassessment,1);
  assert.equal((await send(owner,'list',{},undefined,tenant,1)).data.filteredTotal,1);
  assert.equal((await send(owner,'list',{},undefined,tenant,1,{q:'Synthetic',classification:'PUBLIC'})).data.filteredTotal,1);
  assert.equal((await send(owner,'list',{},undefined,tenant,1,{q:'no match'})).data.filteredTotal,0);
  assert.equal((await send(member,'create',a)).status,403);
  for(const op of ['update','assess'])assert.equal((await send(member,op,op==='update'?{...a,asset_version:1}:assessment,id)).status,403);
  assert.equal((await send(outsider,'list',{},undefined,tenant)).status,403);
  assert.equal((await send(outsider,'list',{},undefined,other)).data.assets.length,0);
  for(const op of ['update','assess','history'])assert.equal((await send(outsider,op,op==='update'?{...a,asset_version:1}:op==='assess'?assessment:{},id,other)).status,404);
  for(const key of ['tenant_id','created_by','version'])assert.equal((await send(owner,'create',{...a,[key]:'forged'})).status,400);
  for(const key of ['risk_level','method_version','evaluator_id','asset_snapshot','created_at'])assert.equal((await send(owner,'assess',{...assessment,[key]:'forged'},id)).status,400);
  assert.equal((await send(owner,'assess',{...assessment,impact_reason:''},id)).status,400);
  const first=await send(admin,'assess',assessment,id);assert.equal(first.status,201);assert.equal(first.data.assessment.risk_level,'LOW');assert.equal(first.data.assessment.evaluator_id,admin.userId);
  const previousModel=process.env.GROQ_MODEL;process.env.GROQ_MODEL='local-test-model';
  try {
   let calls=0;
   const assist=createRiskAssist({transact,models:()=>[{providerModel:'local-test-model'}],request:async()=>{calls++;return {choices:[{message:{content:JSON.stringify({scenarios:['حالة اصطناعية'],suggestedControls:['مراجعة بشرية'],reviewQuestions:['ما حدود الاستخدام؟']})}}]};}});
   const input={purpose:'Public summaries',data_classification:'PUBLIC',synthetic:true,asset_id:id,asset_version:1};
   const result=await assist(owner,tenant,input);
   assert.equal(result.steps[0].source.version,1);assert.equal(result.steps[3].result.draft_score,2);assert.equal(result.acceptance_authority,false);assert.equal(calls,1);
   await assert.rejects(assist(owner,tenant,{...input,asset_version:2}),{code:'STALE_ASSET'});
   await assert.rejects(assist(member,tenant,input),{code:'FORBIDDEN'});
   await assert.rejects(assist(outsider,other,input),{code:'NOT_FOUND'});
   assert.equal(calls,1);
  } finally {if(previousModel===undefined)delete process.env.GROQ_MODEL;else process.env.GROQ_MODEL=previousModel;}
  const loaded=await send(member,'history',{},id);assert.equal(loaded.status,200);assert.equal(loaded.data.assessments[0].controls_reason,assessment.controls_reason);assert.equal(loaded.data.assessments[0].asset_snapshot.purpose,a.purpose);assert.equal(loaded.data.latestAssessment.id,loaded.data.assessments[0].id);
  assert.equal((await send(owner)).data.assets[0].assessment_status,'ASSESSED');
  assert.equal((await send(owner,'update',{...a,asset_version:1},id)).data.changed,false);
  const changed={...a,purpose:'Changed synthetic scope',asset_version:1};assert.equal((await send(owner,'update',changed,id)).data.asset.version,2);
  const revisions=await send(member,'revisions',{},id);assert.equal(revisions.status,200);assert.equal(revisions.data.revisions.length,2);assert.equal(revisions.data.revisions[0].asset_version,2);assert.equal(revisions.data.revisions[0].asset_snapshot.purpose,changed.purpose);assert.equal(revisions.data.revisions[1].asset_version,1);
  assert.equal((await send(owner)).data.assets[0].assessment_status,'REASSESSMENT_REQUIRED');
  assert.equal((await send(owner,'assess',assessment,id)).status,409);
  assert.equal((await send(owner,'update',changed,id)).status,409);
  const second=await send(owner,'assess',{...assessment,asset_version:2,likelihood:3,impact:3},id);assert.equal(second.data.assessment.risk_level,'HIGH');
  assert.equal(second.data.assessment.human_review,null);
  assert.equal(second.data.dependencies.humanGate.status,'not configured');
  assert.equal(second.data.dependencies.ledger.status,'not configured');
  const history=(await send(owner,'history',{},id)).data.assessments;assert.equal(history.length,2);assert.equal(history[0].asset_snapshot.purpose,changed.purpose);assert.equal(history[1].asset_snapshot.purpose,a.purpose);assert.equal(history[1].id,first.data.assessment.id);
  assert.equal((await send(owner)).data.assets[0].assessment_status,'ASSESSED');
  await assert.rejects(pool.query('UPDATE aigas_re_assessments SET likelihood=3 WHERE id=$1',[first.data.assessment.id]),/append-only/);
  await assert.rejects(pool.query('DELETE FROM aigas_re_assessments WHERE id=$1',[first.data.assessment.id]),/append-only/);
  await assert.rejects(pool.query('UPDATE aigas_re_asset_revisions SET asset_version=99 WHERE tenant_id=$1 AND asset_id=$2 AND asset_version=1',[tenant,id]),/append-only/);
  const races=await Promise.all([send(owner,'update',{...a,purpose:'Race one',asset_version:2},id),send(admin,'update',{...a,purpose:'Race two',asset_version:2},id)]);assert.deepEqual(races.map(r=>r.status).sort(),[200,409]);
  // Assess/update contention must either reject a stale revision or keep the older snapshot.
  const race=await Promise.all([send(owner,'assess',{...assessment,asset_version:3},id),send(admin,'update',{...a,purpose:'Race three',asset_version:3},id)]);assert.equal(race[1].status,200);assert.ok([201,409].includes(race[0].status));assert.equal((await send(owner)).data.assets[0].assessment_status,'REASSESSMENT_REQUIRED');
  // More than one page preserves all history.
  for(let i=0;i<26;i++)assert.equal((await send(owner,'assess',{...assessment,asset_version:4},id)).status,201);
  assert.equal((await send(owner,'history',{},id)).data.assessments.length,25);assert.equal((await send(owner,'history',{},id)).data.hasMore,true);assert.ok((await send(owner,'history',{},id,tenant,2)).data.assessments.length>=3);
  await grantProduct(pool,tenant,'human-gate');
  await grantProduct(pool,tenant,'ledger');
  await pool.query("INSERT INTO aigas_hg_policies(tenant_id,version,pending_minutes,approval_minutes,enabled,updated_by,separation_of_duties,risk_assessment_review_enabled) VALUES($1,$2,60,30,true,$3,false,true)",[tenant,randomUUID(),owner.userId]);
  const hg=createHumanGateService(transact);
  const high=()=>send(owner,'assess',{...assessment,asset_version:4,likelihood:3,impact:3},id);
  const pending=await high();
  assert.equal(pending.status,201,JSON.stringify(pending.data));
  assert.equal(pending.data.dependencies.humanGate.status,'available');
  const reviewId=pending.data.assessment.human_review.id;
  const decide=(user,decision,requestId=reviewId)=>hg(user,tenant,'decide',{decision,reason:'Synthetic independent review'},new URLSearchParams(),requestId);
  assert.equal((await send(owner,'history',{},id)).data.assessments[0].human_review.status,'PENDING');
  assert.equal((await send(member,'history',{},id)).data.assessments[0].human_review,null);
  await assert.rejects(decide(owner,'APPROVE'),{code:'SELF_REVIEW_DENIED'});
  const reviewRace=await Promise.allSettled([decide(admin,'APPROVE'),decide(admin,'APPROVE')]);
  assert.equal(reviewRace.filter(item=>item.status==='fulfilled').length,1);
  assert.equal(reviewRace.find(item=>item.status==='rejected').reason.code,'REQUEST_CLOSED');
  const approved=(await send(owner,'history',{},id)).data.assessments[0];
  assert.deepEqual(approved.human_review,{id:reviewId,status:'APPROVED',current:true});
  assert.equal(approved.risk_level,'HIGH');
  await assert.rejects(hg(owner,tenant,'execute',{},new URLSearchParams(),reviewId),{code:'REVIEW_ONLY'});
  assert.equal((await pool.query('SELECT 1 FROM aigas_hg_grants WHERE request_id=$1',[reviewId])).rowCount,0);
  const evidence=(await pool.query(`SELECT l.metadata_json->>'action' AS action
   FROM aigas_ld_events l JOIN aigas_audit_events a ON a.id::text=l.metadata_json->>'audit_ref'
   WHERE a.correlation_id=$1 ORDER BY l.sequence_no`,[reviewId])).rows;
  assert.deepEqual(evidence.map(row=>row.action),['kernel.human_gate.request.created','kernel.human_gate.decision.approve']);
  await pool.query(`INSERT INTO aigas_ld_evidence_requirements(tenant_id,source,event_type,policy_version,approval_reference,approved_by) VALUES
   ($1,'kernel','kernel.audit.recorded','fixture-v1','SYNTHETIC-ONLY',$2),
   ($1,'risk-engine','risk_engine.assessment.created','fixture-v1','SYNTHETIC-ONLY',$2)`,[tenant,owner.userId]);
  const reviewForRollback=(await high()).data.assessment.human_review.id;
  const counts=async()=>(await pool.query(`SELECT
   (SELECT count(*) FROM aigas_re_assessments) AS assessments,
   (SELECT count(*) FROM aigas_hg_requests) AS requests,
   (SELECT count(*) FROM aigas_hg_decisions) AS decisions,
   (SELECT count(*) FROM aigas_hg_events) AS review_events,
   (SELECT count(*) FROM aigas_audit_events) AS audit,
   (SELECT count(*) FROM aigas_ld_events) AS ledger`)).rows[0];
  const before=await counts();
  await pool.query("ALTER TABLE aigas_ld_events ADD CONSTRAINT synthetic_evidence_failure CHECK (source <> 'risk-engine' AND metadata_json->>'action' IS DISTINCT FROM 'kernel.human_gate.decision.approve') NOT VALID");
  const failedAssessment=await high();
  assert.equal(failedAssessment.status,503);
  assert.equal(failedAssessment.data.code,'MANDATORY_EVIDENCE_UNAVAILABLE');
  await assert.rejects(decide(admin,'APPROVE',reviewForRollback),{code:'MANDATORY_EVIDENCE_UNAVAILABLE'});
  assert.deepEqual(await counts(),before);
  assert.equal((await pool.query('SELECT status FROM aigas_hg_requests WHERE id=$1',[reviewForRollback])).rows[0].status,'PENDING');
  await pool.query('ALTER TABLE aigas_ld_events DROP CONSTRAINT synthetic_evidence_failure');
  const rejected=(await high()).data.assessment.human_review.id;
  await decide(admin,'REJECT',rejected);
  assert.equal((await send(owner,'history',{},id)).data.assessments[0].human_review.status,'REJECTED');
  const stale=(await high()).data.assessment.human_review.id;
  await high();
  await assert.rejects(decide(admin,'APPROVE',stale),{code:'BINDING_INVALID'});
  await pool.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2",[tenant,admin.userId]);assert.equal((await send(admin,'assess',{...assessment,asset_version:4},id)).status,403);
  await pool.query('ALTER TABLE aigas_audit_events ADD CONSTRAINT synthetic_failure CHECK(false) NOT VALID');
  const beforeAuditFailure=(await pool.query('SELECT count(*)::int AS n FROM aigas_re_assessments')).rows[0].n;
  assert.equal((await send(owner,'assess',{...assessment,asset_version:4},id)).status,503);assert.equal((await pool.query('SELECT count(*)::int AS n FROM aigas_re_assessments')).rows[0].n,beforeAuditFailure);
  assert.equal((await send(owner,'update',{...a,asset_version:4},id)).status,503);assert.equal((await send(owner,'history',{},id)).data.asset.version,4);
  assert.equal((await send(owner,'create',a)).status,503);assert.equal((await send(owner)).data.assets.length,1);
  await pool.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[owner.userId]);assert.equal((await send(owner)).status,401);
 }finally{await pool.end();}
});
