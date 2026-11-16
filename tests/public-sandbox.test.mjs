import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSandbox} from '../src/server/ai/public-sandbox-limiter.mjs';
const env={NODE_ENV:'development',AIGAS_PUBLIC_DEMO_GROQ_ENABLED:'true',AIGAS_PUBLIC_DEMO_DAILY_REQUESTS:'10',GROQ_API_KEY:'private-test-key',GROQ_MODEL:'test'};
const req=(extra={},origin='http://localhost:4321')=>new Request('http://localhost:4321/api/public-demo/groq-sandbox',{method:'POST',headers:{origin},body:JSON.stringify({text:'لخص دليل عام',sessionId:'test',consent:{syntheticOnly:true,regionAndTermsAccepted:true},...extra})});
test('disabled: zero provider calls',async()=>{let calls=0;const run=createSandbox({env:{},fetcher:()=>{calls++;}});assert.equal((await run(req(),'a')).status,503);assert.equal(calls,0);});
test('origin, consent and secrets denied before provider',async()=>{const run=createSandbox({env,fetcher:()=>assert.fail('egress')});assert.equal((await run(req({},'https://evil.test'),'a')).status,403);assert.equal((await run(req({consent:{}}),'a')).status,403);assert.equal((await run(req({text:'password=abcd1234'}),'a')).status,422);});
test('three successes, fourth 429, no key disclosure',async()=>{let calls=0;const run=createSandbox({env,fetcher:async()=>{calls++;return Response.json({choices:[{message:{content:'رد اصطناعي'}}]});}});for(let i=0;i<3;i++){const r=await run(req(),'a');assert.equal(r.status,200);assert.ok(!(await r.text()).includes(env.GROQ_API_KEY));}assert.equal((await run(req(),'a')).status,429);assert.equal(calls,3);});
test('failure circuit and runtime kill switch',async()=>{const config={...env};let calls=0;const run=createSandbox({env:config,fetcher:async()=>{calls++;throw Error(env.GROQ_API_KEY);}});assert.equal((await run(req(),'a')).status,503);assert.equal((await run(req(),'b')).status,503);assert.equal(calls,1);config.AIGAS_PUBLIC_DEMO_GROQ_ENABLED='false';assert.equal((await run(req(),'c')).status,503);assert.equal(calls,1);});
test('transitive sandbox import graph has no database driver or query',async()=>{
 const {readFile}=await import('node:fs/promises');const seen=new Set();
 async function walk(url){if(seen.has(url.href))return;seen.add(url.href);const source=await readFile(url,'utf8');assert.doesNotMatch(source,/from\s+['"](?:pg|@neon)|\b(?:pool\.query|connectDatabase|DATABASE_URL)\b/);for(const m of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g))await walk(new URL(m[1],url));}
 await walk(new URL('../src/server/ai/public-sandbox-limiter.mjs',import.meta.url));
});
