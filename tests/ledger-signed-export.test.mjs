import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { hashEvent, profile } from '../src/server/ledger/core.mjs';
import { signExport, signingKey, signEvent } from '../src/server/ledger/signing.mjs';
import { canonicalInputs, FORMAT, VERIFIER_VERSION } from '../public/downloads/aigas-ledger-verifier.mjs';
import { verifySignedExport } from '../public/downloads/aigas-ledger-signed-verifier.mjs';

function fixture() {
  const tenant = randomUUID(), actor = randomUUID();
  let previous = null;
  const events = [1, 2, 3].map(n => {
    const e = { event_id:randomUUID(), tenant_id:tenant, source:'ledger.synthetic-lab', event_type:'synthetic.test.created', policy_version:'foundation-v1', metadata_json:{ synthetic:true, scenario:'integrity-check', outcome:'RECORDED', decision_ref:randomUUID() }, created_at:'2026-01-01T00:00:00.000Z', created_by:actor, hash_profile:profile, sequence_no:String(n), previous_hash:previous, idempotency_key:'event:'+n };
    e.integrity_hash=hashEvent(e); previous=e.integrity_hash; return e;
  });
  return { format:FORMAT, manifest:{ profile, chain_version:profile, tenant_id:tenant, coverage:'GENESIS_THROUGH_TARGET', target_event_id:events.at(-1).event_id, event_count:3, first_sequence:'1', last_sequence:'3', head_hash:previous, policy_versions:['foundation-v1'], verifier:{version:VERIFIER_VERSION} }, entries:events.map(event=>({event,canonical_hash_inputs:canonicalInputs(event)})) };
}
test('signed export needs an independently trusted key and detects changes, deletion, reorder and replay', () => {
  const pair=generateKeyPairSync('ed25519'), other=generateKeyPairSync('ed25519');
  const pem=pair.publicKey.export({type:'spki',format:'pem'});
  const bundle=fixture(); for (const entry of bundle.entries) entry.signature=signEvent(entry.event,{id:'test-key',key:pair.privateKey});
  const signed=signExport(bundle,{id:'test-key',key:pair.privateKey});
  assert.equal(verifySignedExport(signed,pem,'test-key').result,'MATCH');
  assert.notEqual(verifySignedExport(signed,other.publicKey.export({type:'spki',format:'pem'}),'test-key').result,'MATCH');
  assert.notEqual(verifySignedExport(signed,pem,'another-key').result,'MATCH');
  assert.notEqual(verifySignedExport(signed,null,'test-key').result,'MATCH');
  const alteredReceipt=structuredClone(signed.bundle); alteredReceipt.entries[0].signature.signature=Buffer.alloc(64).toString('base64');
  assert.equal(verifySignedExport(signExport(alteredReceipt,{id:'test-key',key:pair.privateKey}),pem,'test-key').reason,'EVENT_SIGNATURE_INVALID');
  const noReceipt=structuredClone(signed.bundle); delete noReceipt.entries[0].signature;
  assert.equal(verifySignedExport(signExport(noReceipt,{id:'test-key',key:pair.privateKey}),pem,'test-key').result,'INDETERMINATE');
  for (const mutate of [b=>{b.entries[0].event.metadata_json.outcome='REVIEWED'}, b=>{b.entries.splice(1,1)}, b=>{b.entries.reverse()}, b=>{b.entries[1]=structuredClone(b.entries[0])}, b=>{b.manifest.tenant_id=randomUUID()}]) {
    const altered=structuredClone(signed); mutate(altered.bundle);
    assert.equal(verifySignedExport(altered,pem,'test-key').result,'MISMATCH');
    const resigned=signExport(altered.bundle,{id:'test-key',key:pair.privateKey});
    assert.notEqual(verifySignedExport(resigned,pem,'test-key').result,'MATCH');
  }
});
test('missing, invalid or wrong-type signing keys fail closed', () => {
  assert.throws(()=>signingKey({}),{code:'LEDGER_SIGNING_UNAVAILABLE'});
  assert.throws(()=>signExport(fixture(),null),{code:'LEDGER_SIGNING_UNAVAILABLE'});
  const rsa=generateKeyPairSync('rsa',{modulusLength:2048});
  assert.throws(()=>signExport(fixture(),{id:'rsa',key:rsa.privateKey}),{code:'LEDGER_SIGNING_UNAVAILABLE'});
});

test('redacted export verifies signed links without exposing content and detects changes', async () => {
  const { redactBundle }=await import('../src/server/ledger/redacted-export.mjs');
  const pair=generateKeyPairSync('ed25519'), config={id:'test-key',key:pair.privateKey};
  const full=fixture(); for (const entry of full.entries) entry.signature=signEvent(entry.event,config);
  const redacted=redactBundle(full), signed=signExport(redacted,config), pem=pair.publicKey.export({type:'spki',format:'pem'});
  const result=verifySignedExport(signed,pem,'test-key');
  assert.equal(result.result,'MATCH'); assert.equal(result.scope,'SIGNED_HASH_LINKS_ONLY');
  assert.doesNotMatch(JSON.stringify(redacted.entries),/metadata_json|created_by|canonical_hash_inputs|idempotency_key/);
  const reordered=structuredClone(redacted); reordered.entries.reverse();
  assert.notEqual(verifySignedExport(signExport(reordered,config),pem,'test-key').result,'MATCH');
  const removed=structuredClone(redacted); removed.entries.pop();
  assert.notEqual(verifySignedExport(signExport(removed,config),pem,'test-key').result,'MATCH');
});
