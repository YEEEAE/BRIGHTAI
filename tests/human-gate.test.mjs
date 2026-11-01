import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../src/server/human-gate/http.mjs';
import { exact,text,decisionAllowed } from '../src/server/human-gate/core.mjs';
test('Human Gate input and separation of duties',()=>{
 for(const value of [null,[],{tenant_id:'forged'}])assert.throws(()=>exact(value,['title']));
 for(const value of ['',null,'x','x'.repeat(501),'test\u0000'])assert.throws(()=>text(value));
 assert.equal(text(' Test '),'Test');
 for(const role of ['OWNER','ADMIN']){assert.equal(decisionAllowed({role},{requester_id:'a',status:'PENDING'},'b'),true);assert.equal(decisionAllowed({role},{requester_id:'a',status:'PENDING'},'a'),false);}
 assert.equal(decisionAllowed({role:'MEMBER'},{requester_id:'a',status:'PENDING'},'b'),false);
 assert.equal(decisionAllowed({role:'ADMIN'},{requester_id:'a',status:'APPROVED'},'b'),false);
});
test('Human Gate HTTP: auth first, origin, size, JSON and private errors',async()=>{
 let calls=0;const service=async()=>{calls++;return {persisted:true};};
 const real=createHandler();assert.equal((await real(new Request('https://local/app/api/human-gate/requests/'),'list')).status,401);
 const handler=createHandler(async()=>({userId:'test'}),service);
 for(const [headers,body,status] of [[{'content-type':'application/json'},'{}',403],[{origin:'https://evil','content-type':'application/json'},'{}',403],[{origin:'https://local','content-type':'text/plain'},'{}',415],[{origin:'https://local','content-type':'application/json'},'{',400],[{origin:'https://local','content-type':'application/json'},'x'.repeat(8200),413]]){
 const response=await handler(new Request('https://local/app/api/human-gate/requests/',{method:'POST',headers,body}),'decide');assert.equal(response.status,status);assert.match(response.headers.get('cache-control'),/no-store/);
 }
 assert.equal(calls,0);
 const error=createHandler(async()=>({userId:'test'}),async()=>{throw new Error('private connection string');});const response=await error(new Request('https://local/'),'list');assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private connection string/);
});
test('Human Gate reports missing schema and database privilege without leaking driver details',async()=>{
 for(const [sqlstate,code] of [['42P01','HUMAN_GATE_SCHEMA_MISSING'],['42501','HUMAN_GATE_DB_PRIVILEGE']]){
  const handler=createHandler(async()=>({userId:'test'}),async()=>{const error=new Error('private database detail');error.code=sqlstate;throw error;});
  const response=await handler(new Request('https://local/'),'list');const data=await response.json();
  assert.equal(response.status,503);assert.equal(data.code,code);assert.match(data.message,/Human Gate|runtime/u);assert.doesNotMatch(JSON.stringify(data),/private database detail/u);
 }
});
