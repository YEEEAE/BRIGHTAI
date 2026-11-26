import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import { createGroqGateway } from '../src/server/ai/groq-gateway.mjs';
import { parseToolReply, prepareTools } from '../src/server/ai/tool-contract.mjs';

const model = Object.freeze({ approval:{reference:'SYNTHETIC',noTraining:true,expiresAt:'2099-01-01'}, providerModel:'synthetic-model', apiKeyEnv:'GROQ_API_KEY', endpoint:'https://api.groq.com/openai/v1/chat/completions', inputOverheadTokens:0, maxRequestTokens:32000, maxOutputTokens:100, inputUsdPerMillion:1, outputUsdPerMillion:1 });
const tools = [{ name:'lookup', description:'Synthetic lookup', schema:z.strictObject({ query:z.string().max(30) }) }, { name:'count', description:'Synthetic count', schema:z.strictObject({ value:z.number().int() }) }];
const call = (id, name, args) => ({id,type:'function',function:{name,arguments:args}});
const reply = calls => Response.json({choices:[{finish_reason:'tool_calls',message:{role:'assistant',content:null,tool_calls:calls}}],usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24}});
function fixture(t, fetchImpl, extra={}) {
  const prior={...process.env}, dir=mkdtempSync(join(tmpdir(),'groq-tools-'));
  Object.assign(process.env,{GROQ_API_KEY:'synthetic', GROQ_MODEL:model.providerModel,AIGAS_GROQ_DAILY_BUDGET_USD:'1',AIGAS_GROQ_MONTHLY_BUDGET_USD:'10',AIGAS_GROQ_BUDGET_FILE:join(dir,'ledger'),AIGAS_GROQ_TIMEOUT_MS:'30'});
  delete process.env.AIGAS_SC_GROQ_API_KEY;
  writeFileSync(process.env.AIGAS_GROQ_BUDGET_FILE,JSON.stringify({days:{},months:{},active:0,failures:0,openUntil:0}));
  t.after(()=>{for(const k of Object.keys(process.env)) if(!(k in prior)) delete process.env[k]; Object.assign(process.env,prior); rmSync(dir,{recursive:true,force:true});});
  return createGroqGateway({registry:[model],fetchImpl,...extra});
}
const policy = { pre:async()=>true, post:async()=>true };
const messages = [{role:'user',content:'synthetic request'}];
test('one and multiple tool calls parse and replay tool results',async t=>{
 let n=0;const gateway=fixture(t,async(_url,init)=>{const body=JSON.parse(init.body); assert.equal(body.tools[0].function.strict,true); n++; return reply(n===1?[call('a','lookup','{"query":"x"}')]:[call('b','lookup','{"query":"y"}'),call('c','count','{"value":2}')]);});
 const first=await gateway({model,messages,tools,toolPolicy:policy});
 const calls=parseToolReply(first,prepareTools(tools).byName); assert.deepEqual(calls[0].arguments,{query:'x'});
 const replay=[...messages,first.choices[0].message,{role:'tool',tool_call_id:'a',content:'synthetic result'}];
 const second=await gateway({model,messages:replay,tools,toolPolicy:policy}); assert.equal(parseToolReply(second,prepareTools(tools).byName).length,2); assert.equal(n,2);
});
test('malformed tool calls, unknown tools and invalid arguments are rejected',async t=>{
 let response;const gateway=fixture(t,async()=>reply([response]));
 for(const c of [call('a','lookup','{'),call('a','other','{}'),call('a','lookup','{"query":"x","extra":1}')]) { response=c; await assert.rejects(gateway({model,messages,tools,toolPolicy:policy}),{code:'INVALID_TOOL_CONTRACT'}); }
});
test('policy refusal and malformed history stop before fetch',async t=>{
 let calls=0;const gateway=fixture(t,async()=>{calls++;return reply([])});
 await assert.rejects(gateway({model,messages,tools,toolPolicy:{...policy,pre:async()=>false}}),{code:'POLICY_DENIED'});
 await assert.rejects(gateway({model,messages:[{role:'tool',tool_call_id:'x',content:'x'}],tools,toolPolicy:policy}),{code:'INVALID_TOOL_CONTRACT'});
 await assert.rejects(gateway({model,messages,tools}),{code:'POLICY_UNAVAILABLE'});
 assert.equal(calls,0);
});
test('post policy denial withholds proposed tool calls',async t=>{
 const gateway=fixture(t,async()=>reply([call('a','lookup','{"query":"x"}')]));
 await assert.rejects(gateway({model,messages,tools,toolPolicy:{...policy,post:async()=>false}}),{code:'POLICY_DENIED'});
});
test('expired approval is rejected without provider calls',async t=>{
 let calls=0;const gateway=fixture(t,async()=>{calls++; return reply([])}, {now:()=>Date.parse('2100-01-01T00:00:00Z')});
 await assert.rejects(gateway({model,messages,tools,toolPolicy:policy}),{code:'NO_APPROVED_MODEL'}); assert.equal(calls,0);
});
test('tool request handles rate limiting and timeout without disclosure',async t=>{
 let calls=0;const gateway=fixture(t,async()=>{calls++;return new Response('',{status:429,headers:{'retry-after':'1'}})}, {wait:async()=>{}});
 await assert.rejects(gateway({model,messages,tools,toolPolicy:policy}),{code:'GROQ_RATE_LIMIT'});assert.equal(calls,2);
 const timeout=createGroqGateway({registry:[model],fetchImpl:async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('secret'))))});
 const keep=setTimeout(()=>{},1000);
 try { await assert.rejects(timeout({model,messages,tools,toolPolicy:policy}),{code:'PROVIDER_TIMEOUT'}); } finally {clearTimeout(keep);}
});
