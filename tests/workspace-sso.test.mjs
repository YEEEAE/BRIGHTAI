import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { generateKeyPair, SignJWT } from 'jose';
import { oidcRoute, requireWorkspaceSso, ssoProof } from '../src/server/kernel/sso.mjs';

test('OIDC workspace proof binds issuer, client, nonce, membership identity and current configuration', async t => {
  const workspace = randomUUID(), userId = randomUUID(), subject = 'employee-1';
  const row = {workspace, clientId:'pilot', issuer:'https://idp.example', token:'https://idp.example/token',
    authorization:'https://idp.example/authorize', jwks:'https://idp.example/keys', revision:'one', mode:'required',bindings:[{subject,userId}]};
  const prior = [process.env.AIGAS_OIDC_CONNECTIONS,process.env.AIGAS_OIDC_COOKIE_KEY];
  t.after(() => ['AIGAS_OIDC_CONNECTIONS','AIGAS_OIDC_COOKIE_KEY'].forEach((k,i) => prior[i] === undefined ? delete process.env[k] : process.env[k]=prior[i]));
  process.env.AIGAS_OIDC_COOKIE_KEY = 'ab'.repeat(32);
  process.env.AIGAS_OIDC_CONNECTIONS = JSON.stringify([row]);
  const base = 'https://brightai.live/auth/sso/';
  const start = await oidcRoute(new Request(base+'start/?workspace='+workspace),false);
  const destination = new URL(start.headers.get('location'));
  const flow = start.headers.getSetCookie()[0].split(';')[0];
  let keys = await generateKeyPair('RS256');
  const callback = (state, token) => oidcRoute(new Request(base+'callback/?code=example&state='+state,{headers:{Cookie:flow}}),true,
    async (_url,{body}) => {assert.ok(body.get('code_verifier')); return Response.json({id_token:token});},()=>keys.publicKey);
  const sign = (aud, nonce) => new SignJWT({nonce,email:'same@example.test'}).setProtectedHeader({alg:'RS256'})
    .setIssuer(row.issuer).setSubject(subject).setAudience(aud).setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
  const state = destination.searchParams.get('state'), nonce = destination.searchParams.get('nonce');
  assert.equal((await callback('wrong','unused')).status,403);
  assert.equal((await callback(state,await sign('other',nonce))).status,403);
  assert.equal((await callback(state,await sign('pilot','other'))).status,403);
  const oldToken = await sign('pilot',nonce);
  keys = await generateKeyPair('RS256');
  assert.equal((await callback(state,oldToken)).status,403);
  const offline = await oidcRoute(new Request(base+'callback/?state='+state+'&code=example',{headers:{Cookie:flow}}),true,
    async () => { throw Error('offline'); });
  assert.equal(offline.status,403);
  assert.ok(offline.headers.getSetCookie().every(v=>!v.startsWith('__Host-brightai-oidc-proof=')));
  const result = await callback(state,await sign('pilot',nonce));
  assert.equal(result.status,302);
  const cookie = result.headers.getSetCookie().find(v=>v.startsWith('__Host-brightai-oidc-proof=')).split(';')[0];
  const sso = await ssoProof(new Request(base,{headers:{Cookie:cookie}}));
  requireWorkspaceSso({userId,sso},workspace);
  assert.throws(()=>requireWorkspaceSso({userId},workspace));
  assert.throws(()=>requireWorkspaceSso({userId:randomUUID(),sso},workspace));
  const other = {...row,workspace:randomUUID()};
  process.env.AIGAS_OIDC_CONNECTIONS = JSON.stringify([row,other]);
  assert.throws(()=>requireWorkspaceSso({userId,sso},other.workspace));
  process.env.AIGAS_OIDC_CONNECTIONS = JSON.stringify([{...row,mode:'suspended'}]);
  assert.throws(()=>requireWorkspaceSso({userId,sso},workspace));
});
