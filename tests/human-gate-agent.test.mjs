import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { summarizeHumanGateRequest } from '../src/server/human-gate/human-gate-agent.mjs';
import { kernelApproval } from '../src/server/agents/runtime.mjs';

test('review assistant reads only an authorized review and has no decision authority', async () => {
 const identity={userId:randomUUID()}, tenant=randomUUID(), id=randomUUID();
 let calls=0;
 const service=async (actor, workspace, operation, body, params) => {
  calls++; assert.equal(actor,identity); assert.equal(workspace,tenant); assert.equal(operation,'list');
  assert.deepEqual(body,{}); assert.equal(params.get('view'),'review'); assert.equal(params.get('request'),id);
  return {requests:[{id,canDecide:true,operation_type:'INTERNAL_DEMO_NOTE',status:'PENDING',policy_version:'v1',payload_digest:'abc',description:'private content'}]};
 };
 const result=await summarizeHumanGateRequest(identity,tenant,id,service);
 assert.equal(calls,1); assert.equal(result.advisory_only,true); assert.equal(result.decision_authority,false);
 assert.equal(result.execution_authority,false); assert.doesNotMatch(JSON.stringify(result),/private content/);
 await assert.rejects(summarizeHumanGateRequest(identity,tenant,id,async()=>({requests:[{id,canDecide:false}]})),{code:'NOT_FOUND'});
});

test('default agent resume verifier stays closed without transactional grant binding', async () => {
 assert.deepEqual(await kernelApproval({}, {}, '', {}),{approved:false,reason:'APPROVAL_BINDING_NOT_CONFIGURED'});
});
