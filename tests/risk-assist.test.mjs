import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRiskAssist,createAssistHandler,validateDraft} from '../src/server/risk-engine/assist.mjs';
import {evaluate,acceptanceDecision} from '../src/server/risk-engine/core.mjs';
const draft={scenarios:['سيناريو اصطناعي'],suggestedControls:['مراجعة بشرية'],reviewQuestions:['ما حدود الاستخدام؟']};
const body={purpose:'غرض اصطناعي',data_classification:'PUBLIC',synthetic:true};
function fixture(options={}){
 let calls=0;
 const assist=createRiskAssist({transact:fn=>fn({}),guard:async()=>({tenant:{tenant_id:'tenant-a'}}),access:async()=>({role:'OWNER'}),models:tenant=>{assert.equal(tenant,'tenant-a');return [{}];},request:async input=>{calls++;assert.ok(!JSON.stringify(input).includes('person@example.com'));return {choices:[{message:{content:JSON.stringify(draft)}}]};},...options});
 return {assist,calls:()=>calls};
}
test('strict complete output, no extra/nested/numeric/empty fields or malformed JSON',()=>{
 assert.deepEqual(validateDraft(JSON.stringify(draft)),draft);
 for(const bad of [{...draft,score:1},{...draft,acceptanceDecision:'ACCEPTED'},{scenarios:[]},{...draft,scenarios:[{score:1}]},{...draft,reviewQuestions:[1]},{...draft,suggestedControls:[]},null,[],{...draft,scenarios:['x'.repeat(101)]}])assert.throws(()=>validateDraft(JSON.stringify(bad)));
 for(const key of Object.keys(draft)){const missing={...draft};delete missing[key];assert.throws(()=>validateDraft(JSON.stringify(missing)));}
 assert.throws(()=>validateDraft('```json {} ```'));
});
test('authorized advisory uses protected purpose only and has no persistence',async()=>{
 const f=fixture();assert.deepEqual(await f.assist({userId:'actor'},'tenant-a',{...body,purpose:'مثال person@example.com'}),{draft,advisory_only:true});assert.equal(f.calls(),1);
});
test('admin can request an advisory draft',async()=>{
 const f=fixture({access:async()=>({role:'ADMIN'})});assert.equal((await f.assist({},'tenant-a',body)).advisory_only,true);assert.equal(f.calls(),1);
});
test('member, tenant denial, missing approval, secrets and invalid inputs never call provider',async()=>{
 for(const options of [{access:async()=>({role:'MEMBER'})},{guard:async()=>{throw Error('denied');}},{models:()=>[]}]){const f=fixture(options);await assert.rejects(f.assist({},'tenant-b',body));assert.equal(f.calls(),0);}
 for(const bad of [{...body,synthetic:false},{...body,score:1},{...body,purpose:'password=secret123'},{...body,data_classification:'UNKNOWN'},{...body,purpose:null}]){const f=fixture();await assert.rejects(f.assist({},'tenant-a',bad));assert.equal(f.calls(),0);}
});
test('model score injection rejected, deterministic score and high acceptance unchanged',async()=>{
 const before=evaluate(3,3);
 const args=[{version:1,lifecycle_status:'ACTIVE'},{asset_version:1,risk_level:'HIGH',evaluator_id:'actor'},{review_on:'2027-01-01',residual_level:'LOW',rationale:'x'.repeat(30)},{role:'OWNER'},'actor'];
 const acceptance=acceptanceDecision(...args);
 const f=fixture({request:async()=>({choices:[{message:{content:JSON.stringify({...draft,score:1,acceptanceDecision:'ACCEPTED'})}}]})});
 await assert.rejects(f.assist({},'tenant-a',body),{code:'INVALID_ASSIST_REPLY'});
 assert.deepEqual(evaluate(3,3),before);assert.equal(before.score,9);assert.deepEqual(acceptanceDecision(...args),acceptance);assert.equal(acceptance.allowed,false);
});
test('output protection and provider failures fail closed',async()=>{
 assert.throws(()=>validateDraft(JSON.stringify({...draft,scenarios:['password=secret123']})));
 assert.match(validateDraft(JSON.stringify({...draft,scenarios:['person@example.com']})).scenarios[0],/منقحة/);
 const f=fixture({request:async()=>{throw Error('upstream secret');}});await assert.rejects(f.assist({},'tenant-a',body));
});
test('HTTP authenticates, checks origin/size/content type and hides unknown failures',async()=>{
 let calls=0;
 const handler=createAssistHandler(async()=>({userId:'actor'}),async()=>{calls++;return {draft,advisory_only:true};});
 const req=(patch={})=>new Request('https://example.test/app/api/risk-engine/assist/?workspace=a',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json'},body:JSON.stringify(body),...patch});
 assert.equal((await handler(req())).status,200);assert.equal(calls,1);
 for(const request of [req({headers:{origin:'https://evil.test','content-type':'application/json'}}),req({headers:{origin:'https://example.test'}}),req({body:'x'.repeat(8193)})])assert.ok((await handler(request)).status>=400);
 assert.equal(calls,1);
 const denied=createAssistHandler(async()=>{throw Error('secret');},async()=>{throw Error('never');});const res=await denied(req());assert.equal(res.status,503);assert.ok(!(await res.text()).includes('secret'));assert.match(res.headers.get('cache-control'),/no-store/);
});
