// Explicit disposable localhost DB only. Never load .env or write to Neon.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRiskEngineService } from '../src/server/risk-engine/service.mjs';
import { createHandler } from '../src/server/risk-engine/http.mjs';
const url=process.env.RISK_ENGINE_TEST_DATABASE_URL;
if(url&&!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw new Error('Disposable localhost DB required');
test('Risk Engine DB: persistence, version history, tenant/role rejection, races and atomic audit',{skip:!url},async()=>{
 const pool=new pg.Pool({connectionString:url,max:5});
 try{
  await pool.query('CREATE SCHEMA neon_auth; CREATE TABLE neon_auth."user"(id uuid PRIMARY KEY,banned boolean)');
  for(const file of ['0001_aigas_kernel.sql','0005_aigas_risk_engine.sql'])await pool.query(await readFile(new URL(`../migrations/${file}`,import.meta.url),'utf8'));
  const owner={userId:randomUUID()},admin={userId:randomUUID()},member={userId:randomUUID()},outsider={userId:randomUUID()},tenant=randomUUID(),other=randomUUID();
  for(const user of [owner,admin,member,outsider])await pool.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[user.userId]);
  await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
  for(const [u,t,r]of [[owner,tenant,'OWNER'],[admin,tenant,'ADMIN'],[member,tenant,'MEMBER'],[outsider,other,'OWNER']])await pool.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u.userId,r]);
  const transact=async work=>{const c=await pool.connect();try{await c.query('BEGIN');const result=await work(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}};
  const send=async(user,op='list',body={},id,scope=tenant,page=1,filters={})=>{
   // Inject verified identity only in this harness; production handler keeps JWT verification.
   const handler=createHandler(async()=>user,createRiskEngineService(transact)),method=['list','history','revisions'].includes(op)?'GET':op==='update'?'PATCH':'POST';
   const query=new URLSearchParams({workspace:scope,page:String(page),...filters});
   const r=await handler(new Request(`https://local/app/api/risk-engine/assets/?${query}`,{method,headers:{origin:'https://local','content-type':'application/json'},...(method!=='GET'?{body:JSON.stringify(body)}:{})}),op,id);return {status:r.status,data:await r.json()};
  };
  const a={name:'Synthetic use',owner:'Synthetic team',purpose:'Public summaries',data_classification:'PUBLIC'};
  const assessment={asset_version:1,likelihood:1,impact:2,likelihood_reason:'Limited synthetic use',impact_reason:'Reversible synthetic impact',controls_reason:'Manual review and data minimization'};
  const created=await send(owner,'create',a);assert.equal(created.status,201);const id=created.data.asset.id;
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
  const loaded=await send(member,'history',{},id);assert.equal(loaded.status,200);assert.equal(loaded.data.assessments[0].controls_reason,assessment.controls_reason);assert.equal(loaded.data.assessments[0].asset_snapshot.purpose,a.purpose);assert.equal(loaded.data.latestAssessment.id,loaded.data.assessments[0].id);
  assert.equal((await send(owner)).data.assets[0].assessment_status,'ASSESSED');
  assert.equal((await send(owner,'update',{...a,asset_version:1},id)).data.changed,false);
  const changed={...a,purpose:'Changed synthetic scope',asset_version:1};assert.equal((await send(owner,'update',changed,id)).data.asset.version,2);
  const revisions=await send(member,'revisions',{},id);assert.equal(revisions.status,200);assert.equal(revisions.data.revisions.length,2);assert.equal(revisions.data.revisions[0].asset_version,2);assert.equal(revisions.data.revisions[0].asset_snapshot.purpose,changed.purpose);assert.equal(revisions.data.revisions[1].asset_version,1);
  assert.equal((await send(owner)).data.assets[0].assessment_status,'REASSESSMENT_REQUIRED');
  assert.equal((await send(owner,'assess',assessment,id)).status,409);
  assert.equal((await send(owner,'update',changed,id)).status,409);
  const second=await send(owner,'assess',{...assessment,asset_version:2,likelihood:3,impact:3},id);assert.equal(second.data.assessment.risk_level,'HIGH');
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
  await pool.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2",[tenant,admin.userId]);assert.equal((await send(admin,'assess',{...assessment,asset_version:4},id)).status,403);
  await pool.query('ALTER TABLE aigas_audit_events ADD CONSTRAINT synthetic_failure CHECK(false) NOT VALID');
  const before=(await pool.query('SELECT count(*)::int AS n FROM aigas_re_assessments')).rows[0].n;
  assert.equal((await send(owner,'assess',{...assessment,asset_version:4},id)).status,503);assert.equal((await pool.query('SELECT count(*)::int AS n FROM aigas_re_assessments')).rows[0].n,before);
  assert.equal((await send(owner,'update',{...a,asset_version:4},id)).status,503);assert.equal((await send(owner,'history',{},id)).data.asset.version,4);
  assert.equal((await send(owner,'create',a)).status,503);assert.equal((await send(owner)).data.assets.length,1);
  await pool.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[owner.userId]);assert.equal((await send(owner)).status,401);
 }finally{await pool.end();}
});
