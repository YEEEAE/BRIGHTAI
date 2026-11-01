import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate,assetInput,assessmentInput,exact,version } from '../src/server/risk-engine/core.mjs';
import { createHandler } from '../src/server/risk-engine/http.mjs';
import { createRiskEngineService } from '../src/server/risk-engine/service.mjs';
test('Risk Engine: every draft matrix cell and untrusted fields',()=>{
 const expected=[['LOW','LOW','MEDIUM'],['LOW','MEDIUM','HIGH'],['MEDIUM','HIGH','HIGH']];
 for(let l=1;l<=3;l++)for(let i=1;i<=3;i++){const r=evaluate(l,i);assert.equal(r.risk_level,expected[l-1][i-1]);assert.equal(r.score,l*i);assert.match(r.explanation,new RegExp(`${l} × الأثر ${i}`));assert.ok(r.suggested_control);assert.equal(r.method_version,'draft-likelihood-impact-v1');}
 for(const v of [0,4,1.5,'1',null,NaN])assert.throws(()=>evaluate(v,1));
 for(const v of [0,-1,'1',null,1.5])assert.throws(()=>version(v));
 for(const body of [null,[],{tenant_id:'x'},{risk_level:'LOW'},{evaluator_id:'x'},{asset_snapshot:{}}])assert.throws(()=>exact(body,['likelihood']));
 const a={name:'Synthetic asset',owner:'Synthetic team',purpose:'Synthetic use',data_classification:'PUBLIC'};assert.deepEqual(assetInput(a),a);
 for(const bad of [{...a,name:''},{...a,owner:'a'},{...a,purpose:'x\u0000'},{...a,data_classification:'OTHER'}])assert.throws(()=>assetInput(bad));
 const assessment={asset_version:1,likelihood:3,impact:3,likelihood_reason:'Synthetic reason',impact_reason:'Synthetic impact',controls_reason:'Synthetic controls'};
 assert.equal(assessmentInput(assessment).risk_level,'HIGH');for(const key of ['likelihood_reason','impact_reason','controls_reason'])assert.throws(()=>assessmentInput({...assessment,[key]:''}));
});
test('Risk Engine service: validate search and filter input before database access',async()=>{
 let calls=0;const service=createRiskEngineService(async()=>{calls++;throw new Error('database should not be reached');});
 for(const [query,code]of [['q='+encodeURIComponent('x'.repeat(81)),'INVALID_SEARCH'],['classification=OTHER','INVALID_CLASSIFICATION'],['risk_level=CRITICAL','INVALID_RISK_LEVEL']])
  await assert.rejects(service({userId:'synthetic'},null,'list',{},new URLSearchParams(query)),error=>error.code===code);
 assert.equal(calls,0);
});
test('Risk Engine HTTP: auth before data, origin, JSON limit, private failure',async()=>{
 const request=new Request('https://local/app/api/risk-engine/assets/');assert.equal((await createHandler()(request,'list')).status,401);
 let calls=0;const handler=createHandler(async()=>({userId:'synthetic'}),async()=>{calls++;return {persisted:true};});
 for(const [headers,body,expected]of [[{},'{}',403],[{origin:'https://evil','content-type':'application/json'},'{}',403],[{origin:'https://local','content-type':'text/plain'},'{}',415],[{origin:'https://local','content-type':'application/json'},'{',400],[{origin:'https://local','content-type':'application/json'},'x'.repeat(8200),413]]){const r=await handler(new Request(request,{method:'POST',headers,body}),'assess');assert.equal(r.status,expected);assert.match(r.headers.get('cache-control'),/no-store/);}
 assert.equal(calls,0);const broken=createHandler(async()=>({userId:'synthetic'}),async()=>{throw new Error('SECRET');});const r=await broken(request,'history');assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/SECRET/);
});
