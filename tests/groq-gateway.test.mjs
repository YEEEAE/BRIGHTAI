import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGroqGateway } from '../src/server/ai/groq-gateway.mjs';
import { resolveProviderSecret } from '../src/server/kernel/env.mjs';
const model = Object.freeze({ approval:{reference:'synthetic-only',noTraining:true,expiresAt:'2099-01-01'}, providerModel:'qwen/qwen3.8-27b', apiKeyEnv:'AIGAS_SC_GROQ_API_KEY', endpoint:'https://api.groq.com/openai/v1/chat/completions', inputOverheadTokens:0, maxRequestTokens:100, maxOutputTokens:20, inputUsdPerMillion:0.80, outputUsdPerMillion:4 });
const ok = () => Response.json({ choices:[{finish_reason:'stop',message:{role:'assistant',content:'ok'}}], usage:{prompt_tokens:10,completion_tokens:2,total_tokens:12} });
function fixture(t, fetchImpl, extra={}) {
  const prior={...process.env}, dir=mkdtempSync(join(tmpdir(),'groq-test-'));
  Object.assign(process.env,{ GROQ_API_KEY:'synthetic-secret', GROQ_MODEL:model.providerModel,AIGAS_GROQ_DAILY_BUDGET_USD:'1',AIGAS_GROQ_MONTHLY_BUDGET_USD:'10',AIGAS_GROQ_BUDGET_FILE:join(dir,'ledger'),AIGAS_GROQ_TIMEOUT_MS:'1000',AIGAS_GROQ_MAX_CONCURRENCY:'5' });
  delete process.env.AIGAS_SC_GROQ_API_KEY;
  writeFileSync(process.env.AIGAS_GROQ_BUDGET_FILE,JSON.stringify({days:{},months:{},active:0,failures:0,openUntil:0}));
  t.after(()=>{ for(const k of Object.keys(process.env)) if(!(k in prior)) delete process.env[k]; Object.assign(process.env,prior); rmSync(dir,{recursive:true,force:true}); });
  return createGroqGateway({registry:[model],fetchImpl,...extra});
}
test('200 governed body and actual cost persisted across gateway instances',async t=>{
  const gateway=fixture(t,async(url,init)=>{const b=JSON.parse(init.body);assert.equal(b.reasoning_effort,'none');assert.equal(b.temperature,0.7);assert.equal(b.top_p,0.8);assert.equal(b.stream,false);assert.equal(b.n,1);assert.equal(b.reasoning_format,undefined);return ok();});
  await gateway({model,messages:[]});
  const state=JSON.parse(readFileSync(process.env.AIGAS_GROQ_BUDGET_FILE));
  assert.equal(state.active,0); assert.ok(Math.abs(Object.values(state.days)[0]-0.000016)<1e-12);
  process.env.AIGAS_GROQ_DAILY_BUDGET_USD='0.00015';
  await assert.rejects(createGroqGateway({registry:[model],fetchImpl:async()=>ok()})({model,messages:[]}),{code:'BUDGET_CAP_REACHED'});
});
test('429 retry-after respected with at most two total attempts',async t=>{
  let calls=0;const delays=[];
  const gateway=fixture(t,async()=>{calls++;return new Response('',{status:429,headers:{'retry-after':'2'}});},{wait:async ms=>delays.push(ms)});
  await assert.rejects(gateway({model,messages:[]}),{code:'GROQ_RATE_LIMIT'});assert.equal(calls,2);assert.deepEqual(delays,[2000]);
});
test('timeout and upstream secrets never escape',async t=>{
  const gateway=fixture(t,async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('Authorization: Bearer synthetic-secret')))));
  process.env.AIGAS_GROQ_TIMEOUT_MS='10';
  const keepAlive=setTimeout(()=>{},1000);
  try { await assert.rejects(gateway({model,messages:[]}),e=>e.code==='PROVIDER_TIMEOUT'&&!JSON.stringify(e).includes('synthetic-secret')); } finally {clearTimeout(keepAlive);}
});
test('five 5xx open circuit for 60 seconds; then recovers',async t=>{
  let time=Date.now(),calls=0;
  const gateway=fixture(t,async()=>{calls++;return calls<=5?new Response('',{status:503}):ok();},{now:()=>time});
  for(let i=0;i<5;i++) await assert.rejects(gateway({model,messages:[]}),{code:'PROVIDER_REJECTED'});
  await assert.rejects(gateway({model,messages:[]}),{code:'GROQ_CIRCUIT_OPEN'});assert.equal(calls,5);
  time+=60001;await gateway({model,messages:[]});assert.equal(calls,6);
});
test('budget caps block before egress, including concurrent reservations',async t=>{
  let release;let calls=0;
  const gateway=fixture(t,async()=>{calls++;await new Promise(r=>release=r);return ok();});
  process.env.AIGAS_GROQ_DAILY_BUDGET_USD='0.0002';
  const first=gateway({model,messages:[]});await assert.rejects(gateway({model,messages:[]}),{code:'BUDGET_CAP_REACHED'});release();await first;assert.equal(calls,1);
  process.env.AIGAS_GROQ_MONTHLY_BUDGET_USD='0.00001';await assert.rejects(gateway({model,messages:[]}),{code:'BUDGET_CAP_REACHED'});
});
test('concurrency slot includes GET models; no secret in returned metadata',async t=>{
  let release;const gateway=fixture(t,async(url,init)=>{assert.ok(url.endsWith('/models'));assert.equal(init.method,'GET');await new Promise(r=>release=r);return Response.json({data:[{id:model.providerModel,Authorization:'synthetic-secret'},{id:'synthetic-secret'}],Authorization:'synthetic-secret'});});
  process.env.AIGAS_GROQ_MAX_CONCURRENCY='1';const first=gateway({model,models:true});await assert.rejects(gateway({model,messages:[]}),{code:'GROQ_CONCURRENCY_LIMIT'});release();assert.deepEqual(await first,{data:[{id:model.providerModel,object:'model'}]});
});
test('invalid names, public variables and newline values rejected',t=>{
  fixture(t,async()=>ok());
  for(const name of ['GROQ_API_KEY','PUBLIC_GROQ_API_KEY','AIGAS_SC_bad_API_KEY']) assert.throws(()=>resolveProviderSecret(name),/INVALID_SECRET_NAME/);
  process.env.GROQ_API_KEY='bad\nvalue';assert.throws(()=>resolveProviderSecret(model.apiKeyEnv),/PROVIDER_SECRET_UNAVAILABLE/);
  process.env.PUBLIC_GROQ_TEST='';assert.throws(()=>resolveProviderSecret(model.apiKeyEnv),/PUBLIC_PROVIDER_SECRET_FORBIDDEN/);
});
test('unapproved object, model mismatch, missing ledger and raw network error fail closed',async t=>{
  const gateway=fixture(t,async()=>{throw Error('Authorization synthetic-secret');});
  await assert.rejects(gateway({model:{...model},messages:[]}),{code:'NO_APPROVED_MODEL'});
  process.env.GROQ_MODEL='other';await assert.rejects(gateway({model,messages:[]}),{code:'NO_APPROVED_MODEL'});process.env.GROQ_MODEL=model.providerModel;
  await assert.rejects(gateway({model,messages:[]}),e=>!JSON.stringify(e).includes('synthetic-secret'));
  process.env.AIGAS_GROQ_BUDGET_FILE='/missing/ledger';await assert.rejects(gateway({model,messages:[]}),{code:'BUDGET_STORE_UNAVAILABLE'});
});

test('input exceeding reserved bound never dispatches',async t=>{
  let calls=0;const gateway=fixture(t,async()=>{calls++;return ok();});
  await assert.rejects(gateway({model,messages:[{role:'user',content:'x'.repeat(81)}]}),{code:'REQUEST_LIMIT_REACHED'});assert.equal(calls,0);
});
