import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hashEvent, verifyEvent, filters } from '../src/server/ledger/core.mjs';
import { createHandler } from '../src/server/ledger/http.mjs';
import { KernelError } from '../src/server/kernel/core.mjs';
const sample=()=>({event_id:randomUUID(),tenant_id:randomUUID(),source:'ledger.synthetic-lab',event_type:'synthetic.test.created',policy_version:'foundation-v1',metadata_json:{synthetic:true,scenario:'integrity-check',outcome:'RECORDED',decision_ref:randomUUID()},created_at:'2026-11-01T00:00:00.123Z',created_by:randomUUID()});
test('canonical digest survives DB time/JSON ordering; detects changes to each covered field',()=>{
 const e=sample();e.integrity_hash=hashEvent(e);
 assert.equal(verifyEvent({...e,created_at:new Date(e.created_at),metadata_json:Object.fromEntries(Object.entries(e.metadata_json).reverse())}),'MATCH');
 for(const changed of [{event_id:randomUUID()},{tenant_id:randomUUID()},{created_by:randomUUID()},{created_at:'2026-11-01T00:00:01.123Z'},{event_type:'synthetic.review.recorded'},{metadata_json:{...e.metadata_json,outcome:'REVIEWED'}}])assert.equal(verifyEvent({...e,...changed}),'MISMATCH');
 assert.equal(verifyEvent({...e,source:'unknown'}),'INDETERMINATE');
 assert.equal(verifyEvent({...e,integrity_hash:'invalid'}),'INDETERMINATE');
 const {tenant_id,integrity_hash,...candidate}=e;
 assert.equal(verifyEvent(e,candidate),'MATCH');
 assert.equal(verifyEvent(e,{...candidate,metadata_json:{...candidate.metadata_json,outcome:'REVIEWED'}}),'MISMATCH');
 assert.equal(verifyEvent(e,{...candidate,tenant_id:randomUUID()}),'INDETERMINATE');
 assert.equal(verifyEvent(e,{...candidate,metadata_json:{...candidate.metadata_json,prompt:'synthetic secret'}}),'INDETERMINATE');
});
test('bounded filters reject huge pages and invalid types/periods',()=>{
 for(const query of ['page=0','page=101','page=1.5','page=999999','type=unknown','period=-1'])assert.throws(()=>filters(new URLSearchParams(query)),{status:400});
 assert.equal(filters(new URLSearchParams()).limit,25);
});
test('HTTP rejects missing identity, cross-origin writes, invalid/oversized JSON, and hides internal failures',async()=>{
 let calls=0;const handler=createHandler(async()=>({userId:randomUUID()}),async()=>{calls++;return {};});
 const req=(body='{}',origin='https://local',content='application/json')=>new Request('https://local/app/api/ledger/events/',{method:'POST',headers:{origin,'content-type':content},body});
 assert.equal((await handler(req('{}','https://evil.test'),'create')).status,403);
 assert.equal((await handler(req('{}','https://local','text/plain'),'create')).status,415);
 assert.equal((await handler(req('broken'),'create')).status,400);
 assert.equal((await handler(req(JSON.stringify({x:'a'.repeat(8200)})),'create')).status,413);
 assert.equal(calls,0);
 const unauthorized=createHandler(async()=>{throw new KernelError(401,'UNAUTHORIZED','سجّل الدخول.');});
 assert.equal((await unauthorized(req(),'create')).status,401);
 const fail=createHandler(async()=>({}),async()=>{throw new Error('database password synthetic-secret');});
 const response=await fail(req(),'create');assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/password|synthetic-secret/);
 assert.equal(response.headers.get('cache-control'),'private, no-store');
});
