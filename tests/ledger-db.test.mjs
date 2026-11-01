// Disposable local PostgreSQL only. Never reads .env or changes remote databases.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createLedgerService } from '../src/server/ledger/service.mjs';
import { createHandler } from '../src/server/ledger/http.mjs';
import { hashEvent } from '../src/server/ledger/core.mjs';
import { audit } from '../src/server/kernel/service.mjs';
const url=process.env.LEDGER_TEST_DATABASE_URL;
if(url&&!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw new Error('Disposable localhost database required');
test('Postgres + HTTP: durable event, readback, integrity/tamper, tenant isolation, roles, privacy, paging and rollback',{skip:!url},async()=>{
 const db=new pg.Client({connectionString:url});await db.connect();
 try{
 await db.query('CREATE SCHEMA neon_auth; CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY,banned boolean)');
 for(const file of ['0001_aigas_kernel.sql','0003_aigas_ledger.sql'])await db.query(await readFile(new URL(`../migrations/${file}`,import.meta.url),'utf8'));
 const owner={userId:randomUUID()},admin={userId:randomUUID()},member={userId:randomUUID()},outsider={userId:randomUUID()};const tenant=randomUUID(),other=randomUUID();
 for(const identity of [owner,admin,member,outsider])await db.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[identity.userId]);
 await db.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
 for(const [u,t,role] of [[owner,tenant,'OWNER'],[admin,tenant,'ADMIN'],[member,tenant,'MEMBER'],[outsider,other,'OWNER']])await db.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u.userId,role]);
 const transact=async work=>{await db.query('BEGIN');try{const result=await work(db);await db.query('COMMIT');return result;}catch(e){await db.query('ROLLBACK');throw e;}};
 const service=createLedgerService(transact);
 const send=async(identity,op='list',body={},id,scope=tenant,query='')=>{
  const handler=createHandler(async()=>identity,service);const method=['create','verify'].includes(op)?'POST':'GET';
  const req=new Request(`https://local/app/api/ledger/events/?workspace=${scope}&${query}`,{method,headers:{origin:'https://local','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const response=await handler(req,op,id);return {status:response.status,headers:response.headers,data:await response.json()};
 };
 assert.equal((await send(owner)).data.events.length,0);
 const input={event_type:'synthetic.test.created',scenario:'integrity-check'};
 const created=await send(owner,'create',input);assert.equal(created.status,201);assert.equal(created.data.persisted,true);const id=created.data.event.event_id;
 for(const metadata of [{...created.data.event.metadata_json,prompt:'synthetic-secret'},{...created.data.event.metadata_json,scenario:null},{...created.data.event.metadata_json,decision_ref:null}])await assert.rejects(db.query('INSERT INTO aigas_ld_events SELECT $1,tenant_id,source,event_type,policy_version,$2::jsonb,created_at,created_by,integrity_hash FROM aigas_ld_events WHERE event_id=$3',[randomUUID(),JSON.stringify(metadata),id]),e=>e.code==='23514');
 await assert.rejects(db.query('UPDATE aigas_ld_events SET created_at=now() WHERE event_id=$1',[id]),/append-only/);
 await assert.rejects(db.query('DELETE FROM aigas_ld_events WHERE event_id=$1',[id]),/append-only/);
 const loaded=await send(member);assert.equal(loaded.data.events[0].event_id,id);assert.equal(loaded.data.permissions.create,false);
 assert.equal((await send(member,'detail',{},id)).status,200);
 assert.equal((await send(member,'verify',{},id)).data.result,'MATCH');
 const {tenant_id,integrity_hash,...candidate}=loaded.data.events[0];candidate.metadata_json={...candidate.metadata_json,outcome:'REVIEWED'};
 assert.equal((await send(owner,'verify',{candidate},id)).data.result,'MISMATCH');
 assert.equal((await send(owner,'verify',{},id)).data.result,'MATCH'); // candidate never changes stored row
 for(const op of ['detail','verify','export'])assert.equal((await send(outsider,op,{},id,other)).status,404);
 for(const op of ['list','create','detail','verify','export'])assert.equal((await send(outsider,op,op==='create'?input:{},id,tenant)).status,403);
 assert.equal((await send(member,'create',input)).status,403);assert.equal((await send(member,'export',{},id)).status,403);
 const exported=await send(admin,'export',{},id);assert.equal(exported.status,200);assert.equal(exported.data.event.event_id,id);assert.equal(exported.data.verification,'MATCH');assert.match(exported.headers.get('content-disposition'),/attachment/);
 for(const field of ['tenant_id','created_by','metadata_json','source','policy_version','integrity_hash','prompt','conversation'])assert.equal((await send(owner,'create',{...input,[field]:'synthetic-secret'})).status,400);
 assert.equal((await send(owner,'create',{...input,scenario:'synthetic-secret'})).status,400);
 for(let n=0;n<26;n++)assert.equal((await send(admin,'create',{...input,event_type:'synthetic.review.recorded'})).status,201);
 assert.equal((await send(owner)).data.events.length,25);assert.equal((await send(owner)).data.hasMore,true);
 assert.equal((await send(owner,'list',{},undefined,tenant,'page=2')).data.events.length,2);
 assert.equal((await send(owner,'list',{},undefined,tenant,'type=synthetic.test.created&period=1')).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent(id.slice(0,8))}`)).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent(created.data.event.metadata_json.decision_ref.slice(0,8))}`)).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent('synthetic-secret')}`)).data.events.length,0);
 const historical={...created.data.event,event_id:randomUUID(),created_at:'2026-08-01T00:00:00.000Z',metadata_json:{...created.data.event.metadata_json,decision_ref:randomUUID()}};
 historical.integrity_hash=hashEvent(historical);
 await db.query('INSERT INTO aigas_ld_events (event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,integrity_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[historical.event_id,tenant,historical.source,historical.event_type,historical.policy_version,historical.metadata_json,historical.created_at,historical.created_by,historical.integrity_hash]);
 assert.equal((await send(owner,'list',{},undefined,tenant,'page=101')).status,400);
 assert.equal((await send(owner,'list',{},undefined,tenant,'type=synthetic.test.created&period=30')).data.events.length,1);
 assert.equal((await send(owner,'verify',{},id)).data.result,'MATCH');
 assert.doesNotMatch(JSON.stringify((await db.query('SELECT metadata_json FROM aigas_ld_events')).rows),/synthetic-secret|prompt|conversation/);
 // Kernel basic audit has no Ledger table or product-license dependency.
 await transact(c=>audit(c,owner,tenant,'kernel.synthetic.test'));
 assert.ok((await db.query("SELECT id FROM aigas_audit_events WHERE action='kernel.synthetic.test'")).rowCount);
 await db.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2",[tenant,admin.userId]);
 assert.equal((await send(admin,'export',{},id)).status,403);
 await db.query('DELETE FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2',[tenant,member.userId]);
 assert.equal((await send(member)).status,403);
 await db.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[outsider.userId]);assert.equal((await send(outsider,'list',{},undefined,other)).status,401);
 const count=Number((await db.query('SELECT count(*) AS n FROM aigas_ld_events')).rows[0].n);
 await db.query("ALTER TABLE aigas_audit_events ADD CONSTRAINT synthetic_failure CHECK (false) NOT VALID");
 assert.equal((await send(owner,'create',input)).status,503);
 assert.equal(Number((await db.query('SELECT count(*) AS n FROM aigas_ld_events')).rows[0].n),count);
 await db.query('DROP TABLE public.aigas_ld_events');
 const missingSchema=await send(owner);
 assert.equal(missingSchema.status,503);
 assert.equal(missingSchema.data.code,'LEDGER_SCHEMA_MISSING');
 assert.match(missingSchema.data.message,/الترحيل المعتمد/);
 }finally{await db.end();}
});
