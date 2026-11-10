import { localDatabaseUrl, installSchema, grantProduct, runtime } from './helpers/database.mjs';
// Disposable local PostgreSQL only. Never reads .env or changes remote databases.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createLedgerService } from '../src/server/ledger/service.mjs';
import { createHandler } from '../src/server/ledger/http.mjs';
import { hashEvent, eventFields } from '../src/server/ledger/core.mjs';
import { recordProductEvent } from '../src/server/ledger/writer.mjs';
import { audit, tenantGuard } from '../src/server/kernel/service.mjs';
const url=localDatabaseUrl('LEDGER_TEST_DATABASE_URL');
test('Postgres + HTTP: durable event, readback, integrity/tamper, tenant isolation, roles, privacy, paging and rollback',{skip:!url},async()=>{
 const db=new pg.Client({connectionString:url});await db.connect();
 try{
 await installSchema(db);
    const owner={userId:randomUUID()},admin={userId:randomUUID()},member={userId:randomUUID()},outsider={userId:randomUUID()};const tenant=randomUUID(),other=randomUUID();
 for(const identity of [owner,admin,member,outsider])await db.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[identity.userId]);
 await db.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
 for(const [u,t,role] of [[owner,tenant,'OWNER'],[admin,tenant,'ADMIN'],[member,tenant,'MEMBER'],[outsider,other,'OWNER']])await db.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u.userId,role]);
 await grantProduct(db,tenant,'ledger'); await grantProduct(db,other,'ledger');
 const transact=async work=>{await db.query('BEGIN');await runtime(db);try{const result=await work(db);await db.query('COMMIT');return result;}catch(e){await db.query('ROLLBACK');throw e;}};
 const service=createLedgerService(transact);
 const send=async(identity,op='list',body={},id,scope=tenant,query='')=>{
  const handler=createHandler(async()=>identity,service);const method=['create','verify'].includes(op)?'POST':'GET';
  const req=new Request(`https://local/app/api/ledger/events/?workspace=${scope}&${query}`,{method,headers:{origin:'https://local','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const response=await handler(req,op,id);return {status:response.status,headers:response.headers,data:await response.json()};
 };
 assert.equal((await send(owner)).data.events.length,0);
 const input={event_type:'synthetic.test.created',scenario:'integrity-check',idempotency_key:randomUUID()};
 const created=await send(owner,'create',input);assert.equal(created.status,201);assert.equal(created.data.persisted,true);const id=created.data.event.event_id;
 const replay=await send(owner,'create',input);assert.equal(replay.status,201);assert.equal(replay.data.replayed,true);assert.equal(replay.data.event.event_id,id);
 assert.equal((await send(owner,'create',{...input,event_type:'synthetic.review.recorded'})).status,409);
 for(const metadata of [{...created.data.event.metadata_json,prompt:'synthetic-secret'},{...created.data.event.metadata_json,scenario:null},{...created.data.event.metadata_json,decision_ref:null}])await assert.rejects(db.query('INSERT INTO aigas_ld_events(event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,integrity_hash,hash_profile,sequence_no,previous_hash,idempotency_key) SELECT $1,tenant_id,source,event_type,policy_version,$2::jsonb,created_at,created_by,repeat(chr(97),64),hash_profile,sequence_no+1,integrity_hash,chr(97) FROM aigas_ld_events WHERE event_id=$3',[randomUUID(),JSON.stringify(metadata),id]),e=>e.code==='23514');
 await assert.rejects(db.query('UPDATE aigas_ld_events SET created_at=now() WHERE event_id=$1',[id]),/append-only/);
 await assert.rejects(db.query('DELETE FROM aigas_ld_events WHERE event_id=$1',[id]),/append-only/);
 const loaded=await send(member);assert.equal(loaded.data.events[0].event_id,id);assert.equal(loaded.data.permissions.create,false);
 assert.equal((await send(member,'detail',{},id)).status,200);
 assert.equal((await send(member,'verify',{},id)).data.result,'MATCH');
 const candidate=Object.fromEntries(eventFields.map(key=>[key,loaded.data.events[0][key]]));candidate.metadata_json={...candidate.metadata_json,outcome:'REVIEWED'};
 assert.equal((await send(owner,'verify',{candidate},id)).data.result,'MISMATCH');
 assert.equal((await send(owner,'verify',{},id)).data.result,'MATCH'); // candidate never changes stored row
 for(const op of ['detail','verify','export'])assert.equal((await send(outsider,op,{},id,other)).status,404);
 for(const op of ['list','create','detail','verify','export'])assert.equal((await send(outsider,op,op==='create'?input:{},id,tenant)).status,403);
 assert.equal((await send(member,'create',input)).status,403);assert.equal((await send(member,'export',{},id)).status,403);
 const exported=await send(admin,'export',{},id);assert.equal(exported.status,200);assert.equal(exported.data.entries.at(-1).event.event_id,id);assert.equal(exported.data.verification.result,'MATCH');assert.match(exported.headers.get('content-disposition'),/attachment/);
 const portable=await mkdtemp(join(tmpdir(),'aigas-ledger-contract-'));
 try {
  const file=join(portable,'bundle.json');await writeFile(file,JSON.stringify(exported.data));
  const verify=()=>spawnSync(process.execPath,[new URL('../public/downloads/aigas-ledger-verifier.mjs',import.meta.url).pathname,file],{encoding:'utf8',env:{PATH:process.env.PATH,NODE_OPTIONS:process.env.NODE_OPTIONS}});
  const valid=verify();assert.equal(valid.status,0,valid.stderr);assert.equal(JSON.parse(valid.stdout).result,'MATCH');
  const changed=structuredClone(exported.data);changed.entries[0].event.metadata_json.outcome='REVIEWED';await writeFile(file,JSON.stringify(changed));
  const tampered=verify();assert.notEqual(tampered.status,0);assert.equal(JSON.parse(tampered.stdout).result,'MISMATCH');
 } finally {await rm(portable,{recursive:true});}

 for(const field of ['tenant_id','created_by','metadata_json','source','policy_version','integrity_hash','prompt','conversation'])assert.equal((await send(owner,'create',{...input,[field]:'synthetic-secret'})).status,400);
 assert.equal((await send(owner,'create',{...input,scenario:'synthetic-secret'})).status,400);
 for(let n=0;n<26;n++)assert.equal((await send(admin,'create',{...input,event_type:'synthetic.review.recorded',idempotency_key:randomUUID()})).status,201);
 assert.equal((await send(owner)).data.events.length,25);assert.equal((await send(owner)).data.hasMore,true);
 assert.equal((await send(owner,'list',{},undefined,tenant,'page=2')).data.events.length,2);
 assert.equal((await send(owner,'list',{},undefined,tenant,'type=synthetic.test.created&period=1')).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent(id.slice(0,8))}`)).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent(created.data.event.metadata_json.decision_ref.slice(0,8))}`)).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent('synthetic-secret')}`)).data.events.length,0);
 const tail=(await db.query('SELECT sequence_no,integrity_hash FROM aigas_ld_events WHERE tenant_id=$1 ORDER BY sequence_no DESC LIMIT 1',[tenant])).rows[0];
 const historical={...created.data.event,tenant_id:tenant,sequence_no:String(BigInt(tail.sequence_no)+1n),previous_hash:tail.integrity_hash,idempotency_key:'historical:fixture',event_id:randomUUID(),created_at:'2026-08-01T00:00:00.000Z',metadata_json:{...created.data.event.metadata_json,decision_ref:randomUUID()}};
 historical.integrity_hash=hashEvent(historical);
 await db.query('INSERT INTO aigas_ld_events (event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,integrity_hash,hash_profile,sequence_no,previous_hash,idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[historical.event_id,tenant,historical.source,historical.event_type,historical.policy_version,historical.metadata_json,historical.created_at,historical.created_by,historical.integrity_hash,historical.hash_profile,historical.sequence_no,historical.previous_hash,historical.idempotency_key]);
 assert.equal((await send(owner,'list',{},undefined,tenant,'page=101')).status,400);
 assert.equal((await send(owner,'list',{},undefined,tenant,'type=synthetic.test.created&period=30')).data.events.length,1);
 assert.equal((await send(owner,'verify',{},id)).data.result,'MATCH');
 assert.doesNotMatch(JSON.stringify((await db.query('SELECT metadata_json FROM aigas_ld_events')).rows),/synthetic-secret|prompt|conversation/);
 // Concurrent transactions use separate connections and the runtime role.
 const transactSeparate=async work=>{const client=new pg.Client({connectionString:url});await client.connect();try{await client.query('BEGIN');await runtime(client);const value=await work(client);await client.query('COMMIT');return value;}catch(error){await client.query('ROLLBACK');throw error;}finally{await client.end();}};
 const concurrent=createLedgerService(transactSeparate);
 const writes=await Promise.all(Array.from({length:8},()=>concurrent(owner,tenant,'create',{...input,idempotency_key:randomUUID()})));
 assert.equal(new Set(writes.map(x=>x.event.sequence_no)).size,8);
 const newest=writes.reduce((a,b)=>BigInt(a.event.sequence_no)>BigInt(b.event.sequence_no)?a:b);
 const full=await concurrent(owner,tenant,'export',{},new URLSearchParams(),newest.event.event_id);
 assert.equal(full.verification.result,'MATCH');assert.equal(full.entries.length,36);
 for(let i=0;i<full.entries.length;i++){assert.equal(String(full.entries[i].event.sequence_no),String(i+1));assert.equal(full.entries[i].event.previous_hash,i?full.entries[i-1].event.integrity_hash:null);}
 const portable2=await mkdtemp(join(tmpdir(),'aigas-ledger-prefix-'));
 try {
  const file=join(portable2,'bundle.json');
  const check=async bundle=>{await writeFile(file,JSON.stringify(bundle));const child=spawnSync(process.execPath,[new URL('../public/downloads/aigas-ledger-verifier.mjs',import.meta.url).pathname,file],{encoding:'utf8',env:{PATH:process.env.PATH,NODE_OPTIONS:process.env.NODE_OPTIONS}});return {status:child.status,result:JSON.parse(child.stdout).result};};
  assert.deepEqual(await check(full),{status:0,result:'MATCH'});
  const changes={event_id:randomUUID(),tenant_id:randomUUID(),source:'other',event_type:'synthetic.review.recorded',policy_version:'changed',metadata_json:{...full.entries[0].event.metadata_json,outcome:'REVIEWED'},created_at:'2026-01-01T00:00:00.000Z',created_by:randomUUID(),hash_profile:'unsupported',sequence_no:'2',previous_hash:'a'.repeat(64),idempotency_key:'changed',integrity_hash:'b'.repeat(64)};
  for(const [field,value] of Object.entries(changes)){const altered=structuredClone(full);altered.entries[0].event[field]=value;const result=await check(altered);assert.notEqual(result.status,0,field);assert.notEqual(result.result,'MATCH',field);}
  for(const mutate of [b=>b.entries.splice(1,1),b=>b.entries.reverse(),b=>b.entries.pop(),b=>delete b.entries[0].event.metadata_json]){const altered=structuredClone(full);mutate(altered);const result=await check(altered);assert.notEqual(result.status,0);assert.notEqual(result.result,'MATCH');}
 } finally {await rm(portable2,{recursive:true});}
 // Kernel basic audit has no Ledger table or product-license dependency.
 await transact(async c=>{await tenantGuard(owner,tenant,c);return audit(c,owner,tenant,'kernel.synthetic.test');});
 assert.ok((await db.query("SELECT id FROM aigas_audit_events WHERE action='kernel.synthetic.test'")).rowCount);
 // A synthetic policy requires evidence; unavailable Ledger aborts the caller's transaction.
 await db.query("INSERT INTO aigas_ld_evidence_requirements(tenant_id,source,event_type,policy_version,approval_reference,approved_by) VALUES($1,'kernel','kernel.audit.recorded','fixture-v1','SYNTHETIC-ONLY',$2)",[tenant,owner.userId]);
 await db.query("UPDATE aigas_product_access SET status='FOUNDATION' WHERE tenant_id=$1 AND product_slug='ledger'",[tenant]);
 const beforeMandatory=Number((await db.query("SELECT count(*) AS n FROM aigas_audit_events WHERE action='kernel.synthetic.mandatory'")).rows[0].n);
 const ref=randomUUID();
 await assert.rejects(transact(async c=>{await tenantGuard(owner,tenant,c);await audit(c,owner,tenant,'kernel.synthetic.mandatory');await recordProductEvent(c,owner,tenant,{source:'kernel',event_type:'kernel.audit.recorded',correlation_id:ref,decision_id:ref,policy_version:'fixture-v1',idempotency_key:'mandatory:fixture',metadata_json:{synthetic:false,audit_ref:ref,action:'kernel.synthetic.mandatory'}});}),{code:'MANDATORY_EVIDENCE_UNAVAILABLE'});
 assert.equal(Number((await db.query("SELECT count(*) AS n FROM aigas_audit_events WHERE action='kernel.synthetic.mandatory'")).rows[0].n),beforeMandatory);
 await db.query("UPDATE aigas_product_access SET status='ENABLED' WHERE tenant_id=$1 AND product_slug='ledger'",[tenant]);
 await db.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2",[tenant,admin.userId]);
 assert.equal((await send(admin,'export',{},id)).status,403);
 await db.query('DELETE FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2',[tenant,member.userId]);
 assert.equal((await send(member)).status,403);
 await db.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[outsider.userId]);assert.equal((await send(outsider,'list',{},undefined,other)).status,401);
 const count=Number((await db.query('SELECT count(*) AS n FROM aigas_ld_events')).rows[0].n);
 await db.query("ALTER TABLE aigas_audit_events ADD CONSTRAINT synthetic_failure CHECK (false) NOT VALID");
 assert.equal((await send(owner,'create',{...input,idempotency_key:randomUUID()})).status,503);
 assert.equal(Number((await db.query('SELECT count(*) AS n FROM aigas_ld_events')).rows[0].n),count);
 await db.query('ALTER TABLE public.aigas_ld_events RENAME TO fixture_unavailable_ld_events');
 const missingSchema=await send(owner);
 assert.equal(missingSchema.status,503);
 assert.equal(missingSchema.data.code,'LEDGER_SCHEMA_MISSING');
 assert.match(missingSchema.data.message,/الترحيل المعتمد/);
 }finally{await db.end();}
});
