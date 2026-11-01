import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectMembership, requireRole, workspaceName, productStates, roleLabel, auditActionLabel } from '../src/server/kernel/core.mjs';
import { authenticate } from '../src/server/kernel/auth.mjs';
test('tenant selection cannot manufacture membership', () => {
  const rows = [{tenant_id:'a',role:'MEMBER'}];
  assert.equal(selectMembership(rows,'a').role,'MEMBER');
  assert.throws(()=>selectMembership(rows,'b'),{status:403});
  assert.equal(selectMembership([],null),null);
});
test('role guard rejects member escalation',()=>{
  assert.throws(()=>requireRole({role:'MEMBER'},['OWNER','ADMIN']),{status:403});
  assert.equal(requireRole({role:'OWNER'},['OWNER']).role,'OWNER');
});
test('workspace names validate type and limits',()=>{
  for(const value of [null,{},'a','x'.repeat(101)]) assert.throws(()=>workspaceName(value),{status:400});
  assert.equal(workspaceName('  مؤسسة  '),'مؤسسة');
});
test('product state comes from the access row, not the interface',()=>{
  const enabled=productStates([{product_slug:'firewall',status:'ENABLED'}]);
  assert.equal(enabled.length,5);
  assert.equal(enabled[0].state,'ENABLED'); assert.equal(enabled[0].enabled,true);
  assert.equal(enabled[0].label,'مفعّل للمؤسسة'); assert.equal(enabled[0].href,'/app/firewall/');
  assert.equal(enabled[1].state,'FOUNDATION'); assert.equal(enabled[1].enabled,false);
  assert.equal(enabled[1].label,'قيد التأسيس'); assert.equal(enabled[1].href,'/app/ledger/');
  const disabled=productStates([{product_slug:'ledger',status:'DISABLED'}]);
  assert.equal(disabled[1].href,null); assert.equal(disabled[1].label,'معطّل من المشغّل');
  const unknown=productStates([{product_slug:'not-a-product',status:'ENABLED'}]);
  assert.ok(unknown.every(p=>p.state==='FOUNDATION'&&p.enabled===false));
});
test('labels never expose a raw role or audit code to the interface',()=>{
  assert.equal(roleLabel('OWNER'),'مالك'); assert.equal(roleLabel('ADMIN'),'مدير'); assert.equal(roleLabel('MEMBER'),'عضو');
  assert.equal(roleLabel('SUPERUSER'),'دور غير معروف');
  assert.equal(auditActionLabel('workspace.created'),'إنشاء مساحة العمل');
  assert.equal(auditActionLabel('unregistered.action'),'حدث تشغيلي');
});
test('missing and forged authentication are rejected before DB access',async()=>{
  await assert.rejects(authenticate(new Request('https://local/app/api/kernel/')),{status:401});
  process.env.NEON_AUTH_BASE_URL='https://auth.example.test/auth';
  process.env.NEON_AUTH_JWKS_URL='https://auth.example.test/auth/jwks';
  await assert.rejects(authenticate(new Request('https://local/app/api/kernel/',{headers:{authorization:'Bearer forged'}})),{status:401});
});

import { generateKeyPair, SignJWT } from 'jose';
import { verifyIdentity } from '../src/server/kernel/auth.mjs';
test('signed identity verifies signature, issuer, expiry and anonymous denial', async()=>{
  const {privateKey,publicKey}=await generateKeyPair('EdDSA');
  const other=await generateKeyPair('EdDSA');
  const sign=(claims={},issuer='https://auth.example.test',exp='5m')=>new SignJWT(claims).setProtectedHeader({alg:'EdDSA'}).setIssuer(issuer).setSubject('test-user').setIssuedAt().setExpirationTime(exp).sign(privateKey);
  const token=await sign();
  assert.deepEqual(await verifyIdentity(token,publicKey,'https://auth.example.test'),{userId:'test-user'});
  await assert.rejects(verifyIdentity(token,other.publicKey,'https://auth.example.test'));
  await assert.rejects(verifyIdentity(token,publicKey,'https://other.example.test'));
  await assert.rejects(verifyIdentity(await sign({},undefined,'-1s'),publicKey,'https://auth.example.test'));
  await assert.rejects(verifyIdentity(await sign({role:'anonymous'}),publicKey,'https://auth.example.test'));
});
