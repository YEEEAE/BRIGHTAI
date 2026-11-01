import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, templates, inputText } from '../src/server/firewall/core.mjs';
import { createHandler } from '../src/server/firewall/http.mjs';
const rules = Object.values(templates).map((t,i)=>({...t,id:String(i),enabled:true,version:1}));
test('three synthetic examples and denial precedence',()=>{
 assert.equal(evaluate('معلومة عامة',rules).action,'ALLOW');
 assert.equal(evaluate('DEMO-ID-1234',rules).output,'[معرّف منقّح]');
 assert.equal(evaluate('معلومة عامة DEMO-BLOCK DEMO-ID-1234',rules).action,'BLOCK');
 assert.equal(evaluate('معلومة عامة DEMO-ID-1234',rules).action,'REDACT');
 assert.equal(evaluate('demo-id-1234 / DEMO-ID-1234',rules).output,'[معرّف منقّح] / [معرّف منقّح]');
});
test('empty or corrupt policy fails closed; bounded text',()=>{
 assert.equal(evaluate('text',[]).action,'BLOCK');
 assert.equal(evaluate('text',[{...rules[0],pattern:'(a+)+'}]).reason,'INVALID_POLICY');
 assert.throws(()=>inputText('x'.repeat(4001)));assert.throws(()=>inputText(null));assert.throws(()=>inputText('  '));
});
test('HTTP rejects missing identity, cross origin, tenant injection and oversized body',async()=>{
 const handler=createHandler();
 assert.equal((await handler(new Request('http://localhost/app/api/firewall/rules/'),'dashboard')).status,401);
 const authenticated=createHandler(async()=>({userId:'test'}),async()=>({}));
 const request=(body,origin='http://localhost')=>new Request('http://localhost/app/api/firewall/rules/',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await authenticated(request({template:'public'},'https://other.example'),'create')).status,403);
 assert.equal((await authenticated(request({template:'public',tenant_id:'other'}),'create')).status,400);
 assert.equal((await authenticated(request({text:'x'.repeat(19000)}),'evaluate')).status,413);
});
test('audit persistence failure never returns ALLOW',async()=>{
 const handler=createHandler(async()=>({userId:'test'}),async()=>{throw new Error('secret request must not escape');});
 const response=await handler(new Request('http://localhost/app/api/firewall/evaluate/',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:'{"text":"synthetic"}'}),'evaluate');
 assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.doesNotMatch(await response.text(),/secret request/);
});
