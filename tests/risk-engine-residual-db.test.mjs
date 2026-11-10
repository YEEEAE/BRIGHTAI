import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { localDatabaseUrl, installSchema, grantProduct, runtime } from './helpers/database.mjs';
import { createRiskEngineService } from '../src/server/risk-engine/service.mjs';
import { createHandler } from '../src/server/risk-engine/http.mjs';

const url=localDatabaseUrl('RISK_ENGINE_RESIDUAL_TEST_DATABASE_URL');
test('Risk Engine: residual decisions and export persist with tenant and version guards', {skip:!url}, async()=>{
 const pool=new pg.Pool({connectionString:url,max:4});
 try {
  await installSchema(pool);
  const owner={userId:randomUUID()}, evaluator={userId:randomUUID()}, outsider={userId:randomUUID()}, tenant=randomUUID(), other=randomUUID();
  for(const u of [owner,evaluator,outsider])await pool.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[u.userId]);
  await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
  for(const [u,t,r] of [[owner,tenant,'OWNER'],[evaluator,tenant,'ADMIN'],[outsider,other,'OWNER']])await pool.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u.userId,r]);
  await grantProduct(pool,tenant,'risk-engine'); await grantProduct(pool,other,'risk-engine');
  let dbFailure; const transact=async work=>{const c=await pool.connect();try{await c.query('BEGIN');await runtime(c);const result=await work(c);await c.query('COMMIT');return result;}catch(e){dbFailure={code:e.code,message:e.message,where:e.where};await c.query('ROLLBACK');throw e;}finally{c.release();}};
  const send=async(user,op,body={},id,scope=tenant)=>{
   const method=['history','treatments','export'].includes(op)?'GET':op==='update'?'PATCH':'POST';
   const response=await createHandler(async()=>user,createRiskEngineService(transact))(new Request(`https://local/app/api/risk-engine/assets/?workspace=${scope}`,{method,headers:{origin:'https://local','content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify({...body,synthetic_data_confirmed:true})})}),op,id);
   return {status:response.status,headers:response.headers,data:await response.json()};
  };
  const asset={name:'Synthetic asset',owner:'Synthetic team',purpose:'Synthetic assessment',data_classification:'PUBLIC'};
  const created=await send(owner,'create',asset); assert.equal(created.status,201); const id=created.data.asset.id;
  assert.equal(created.data.asset.version,1); assert.ok(created.data.asset.created_at);
  const input={asset_version:1,likelihood:3,impact:3,likelihood_reason:'Synthetic likelihood',impact_reason:'Synthetic impact',controls_reason:'Synthetic controls'};
  const assessment=await send(evaluator,'assess',input,id); assert.equal(assessment.status,201); assert.equal(assessment.data.assessment.risk_level,'HIGH');
  const treatment={asset_version:1,assessment_id:assessment.data.assessment.id,treatment_version:0,owner:'Synthetic owner',status:'ACCEPTED',control_description:'Synthetic control',residual_risk_description:'Residual synthetic risk',review_on:'2000-01-01',rationale:'Synthetic rationale with sufficient detail',residual_likelihood:2,residual_impact:2};
  assert.equal((await send(evaluator,'save-treatment',treatment,id)).status,403);
  const selfAssess=await send(owner,'assess',input,id); assert.equal(selfAssess.status,201);
  assert.equal((await send(owner,'save-treatment',{...treatment,assessment_id:selfAssess.data.assessment.id},id)).status,403);
  const reassessed=await send(evaluator,'assess',input,id); assert.equal(reassessed.status,201);
  treatment.assessment_id=reassessed.data.assessment.id;
  assert.equal((await send(owner,'save-treatment',{...treatment,residual_impact:null},id)).status,400);
  assert.equal((await send(owner,'save-treatment',{...treatment,review_on:null},id)).status,400);
  const accepted=await send(owner,'save-treatment',treatment,id); assert.equal(accepted.status,201,JSON.stringify(dbFailure));
  assert.equal(accepted.data.treatment.residual_score,4); assert.equal(accepted.data.treatment.residual_level,'MEDIUM');
  assert.equal(accepted.data.deployment_authorized,false); assert.equal(accepted.data.policy_override,false); assert.equal(accepted.data.record_state,'ACCEPTANCE_REVIEW_DUE');
  assert.equal((await send(owner,'save-treatment',treatment,id)).status,409);
  assert.equal((await send(outsider,'history',{},id,other)).status,404);
  assert.equal((await send(outsider,'export',{},undefined,tenant)).status,403);
  const exported=await send(owner,'export'); assert.equal(exported.status,200); assert.match(exported.headers.get('content-disposition'),/attachment/);
  assert.equal(exported.data.assets.length,1); assert.equal(exported.data.assets[0].treatment.residual_score,4); assert.equal(exported.data.assets[0].treatment.residual_level,'MEDIUM');
  assert.equal(exported.data.assets[0].record_state,'ACCEPTANCE_REVIEW_DUE'); assert.equal(exported.data.authorization_scope.deployment_authorized,false);
  const persisted=await pool.query('SELECT residual_likelihood,residual_impact,residual_score,residual_level FROM aigas_re_treatment_revisions WHERE asset_id=$1',[id]);
  assert.deepEqual(persisted.rows,[{residual_likelihood:2,residual_impact:2,residual_score:4,residual_level:'MEDIUM'}]);
  const insertCopy=`INSERT INTO aigas_re_treatment_revisions(id,tenant_id,asset_id,asset_version,assessment_id,version,owner,status,control_description,residual_risk_description,review_on,rationale,residual_likelihood,residual_impact,residual_score,residual_level,acceptance_policy_version,changed_by,actor_role)
   SELECT $1,tenant_id,asset_id,asset_version,assessment_id,2,owner,status,control_description,residual_risk_description,review_on,rationale,residual_likelihood,residual_impact,$2,residual_level,acceptance_policy_version,$3,$4 FROM aigas_re_treatment_revisions WHERE id=$5`;
  const attempt=async(actor,changedBy,role,score)=>transact(async db=>{await db.query("SELECT set_config('aigas.user_id',$1,true),set_config('aigas.tenant_id',$2,true)",[actor.userId,tenant]);return db.query(insertCopy,[randomUUID(),score,changedBy.userId,role,accepted.data.treatment.id]);});
  await assert.rejects(attempt(evaluator,owner,'OWNER',4),/authenticated actor/);
  await assert.rejects(attempt(owner,owner,'OWNER',9),/Residual score and level/);
  assert.equal((await send(owner,'update',{...asset,purpose:'Changed synthetic purpose',asset_version:1},id)).status,200);
  assert.equal((await send(owner,'save-treatment',{...treatment,treatment_version:1},id)).status,409);
  assert.equal((await send(owner,'export')).data.assets[0].record_state,'REASSESSMENT_REQUIRED');
 } finally {await pool.end();}
});
