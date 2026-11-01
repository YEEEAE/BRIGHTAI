// Dedicated disposable local Postgres only. No .env or remote targets are read.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createFirewallService } from '../src/server/firewall/service.mjs';
const url=process.env.FIREWALL_TEST_DATABASE_URL;
if(url && !['localhost','127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Local isolated database required');
test('Postgres: migration, persistence, tenant isolation, permissions, policy changes and metadata privacy',{skip:!url},async()=>{
 const db=new pg.Client({connectionString:url});await db.connect();
 try {
 await db.query('CREATE SCHEMA neon_auth; CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY,banned boolean)');
 await db.query(await readFile(new URL('../migrations/0001_aigas_kernel.sql',import.meta.url),'utf8'));
 await db.query(await readFile(new URL('../migrations/0002_aigas_firewall.sql',import.meta.url),'utf8'));
 const owner={userId:randomUUID()}, member={userId:randomUUID()}, outsider={userId:randomUUID()};const tenant=randomUUID(), other=randomUUID();
 for(const identity of [owner,member,outsider])await db.query('INSERT INTO neon_auth."user" (id) VALUES ($1)',[identity.userId]);
 await db.query("INSERT INTO aigas_tenants (id,name) VALUES ($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
 for(const [user,t,role] of [[owner,tenant,'OWNER'],[member,tenant,'MEMBER'],[outsider,other,'OWNER']])await db.query('INSERT INTO aigas_memberships (tenant_id,user_id,role) VALUES ($1,$2,$3)',[t,user.userId,role]);
 const operate=createFirewallService(async work=>{await db.query('BEGIN');try{const r=await work(db);await db.query('COMMIT');return r;}catch(e){await db.query('ROLLBACK');throw e;}});
 assert.equal((await operate(owner,tenant,'evaluate',{text:'معلومة عامة'})).reason,'NO_ACTIVE_POLICY');
 for(const template of ['public','identifier','prohibited'])await operate(owner,tenant,'create',{template});
 let dashboard=await operate(owner,tenant,'dashboard');assert.equal(dashboard.rules.length,3);
 assert.equal((await operate(member,tenant,'evaluate',{text:'معلومة عامة'})).action,'ALLOW');
 assert.equal((await operate(member,tenant,'evaluate',{text:'secret synthetic DEMO-ID-1234'})).action,'REDACT');
 assert.equal((await operate(owner,tenant,'evaluate',{text:'DEMO-BLOCK'})).action,'BLOCK');
 const blocked=dashboard.rules.find(r=>r.template==='prohibited');
 await operate(owner,tenant,'toggle',{id:blocked.id,version:1,enabled:false});
 assert.equal((await operate(owner,tenant,'evaluate',{text:'DEMO-BLOCK'})).action,'ALLOW');
 assert.equal((await operate(owner,tenant,'dashboard')).rules.find(r=>r.id===blocked.id).version,2);
 await assert.rejects(operate(member,tenant,'create',{template:'public'}),e=>e.status===403);
 await assert.rejects(operate(member,tenant,'toggle',{id:blocked.id,version:2,enabled:true}),e=>e.status===403);
 await assert.rejects(operate(outsider,tenant,'dashboard'),e=>e.status===403);
 await assert.rejects(operate(outsider,other,'toggle',{id:blocked.id,version:2,enabled:true}),e=>e.status===409);
 await assert.rejects(operate(owner,tenant,'toggle',{id:blocked.id,version:1,enabled:true}),e=>e.status===409);
 assert.equal((await operate(outsider,other,'dashboard')).decisions.length,0);
 for(let i=0;i<12;i++)await operate(owner,tenant,'evaluate',{text:'معلومة عامة'});
 dashboard=await operate(owner,tenant,'dashboard');assert.equal(dashboard.decisions.length,10);
 assert.ok((await operate(owner,tenant,'dashboard',{},'BLOCK')).decisions.every(d=>d.action==='BLOCK'));
 const persisted=JSON.stringify((await db.query('SELECT * FROM aigas_fw_decisions')).rows);assert.doesNotMatch(persisted,/secret synthetic|DEMO-ID|معلومة عامة/);
 const columns=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='aigas_fw_decisions'")).rows.map(c=>c.column_name);assert.ok(!columns.some(c=>/text|prompt|output|content/.test(c)));
 await db.query("ALTER TABLE aigas_fw_decisions ADD CONSTRAINT synthetic_failure CHECK (false) NOT VALID");
 await assert.rejects(operate(owner,tenant,'evaluate',{text:'معلومة عامة'}));
 }finally{await db.end();}
});
