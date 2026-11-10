import test from 'node:test';
import assert from 'node:assert/strict';
import { createHumanGateService } from '../src/server/human-gate/service.mjs';
import { createHandler } from '../src/server/human-gate/http.mjs';
import { exact,text,decisionAllowed,binding } from '../src/server/human-gate/core.mjs';
test('Human Gate input and separation of duties',()=>{
 for(const value of [null,[],{tenant_id:'forged'}])assert.throws(()=>exact(value,['title']));
 for(const value of ['',null,'x','x'.repeat(501),'test\u0000'])assert.throws(()=>text(value));
 assert.equal(text(' Test '),'Test');
 const pending={requester_id:'a',status:'PENDING'};
 assert.equal(decisionAllowed(pending,'b',{}, {allowed:true}),true);
 assert.equal(decisionAllowed(pending,'a',{}, {allowed:true}),false);
 assert.equal(decisionAllowed(pending,'b',{}, {allowed:false}),false);
 assert.equal(decisionAllowed(pending,'b',{}),false);
 assert.equal(decisionAllowed({...pending,status:'APPROVED'},'b',{}, {allowed:true}),false);
 assert.equal(decisionAllowed(pending,'a',{separation_of_duties:false},{allowed:true}),true);
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

test('Human Gate list is routed to the transaction and rejects injected fields',async()=>{
 const sentinel=new Error('transaction reached');let calls=0;
 const service=createHumanGateService(async()=>{calls++;throw sentinel;});
 await assert.rejects(service({userId:'synthetic'},null,'list'),error=>error===sentinel);
 await assert.rejects(service({userId:'synthetic'},null,'list',{tenant_id:'forged'}),{code:'INVALID_BODY'});
 assert.equal(calls,1);
});

test('rename approval binding changes with its principal, policy, target and effect',()=>{
 const request={tenant_id:'tenant',requester_id:'requester',operation_type:'KERNEL_WORKSPACE_RENAME',provider_ref:'aigas-kernel',subject_ref:'workspace',policy_version:'policy-1',payload:{expected_name:'Before',expected_version:'1',new_name:'After'}};
 const original=binding(request);
 for(const change of [{tenant_id:'other'},{requester_id:'other'},{provider_ref:'other'},{subject_ref:'other'},{policy_version:'policy-2'},...Object.entries({expected_name:'Changed',expected_version:'2',new_name:'Different'}).map(([key,value])=>({payload:{...request.payload,[key]:value}}))]){
  assert.notEqual(binding({...request,...change}),original);
 }
 assert.throws(()=>binding({...request,payload:{...request.payload,extra:'unexpected'}}));
});
