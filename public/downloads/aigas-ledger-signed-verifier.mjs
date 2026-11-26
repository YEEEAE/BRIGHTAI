// Verify with a public key obtained independently from a trusted operator.
// node aigas-ledger-signed-verifier.mjs export.json trusted-public-key.pem expected-key-id
import { createPublicKey, verify } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { verifyBundle } from './aigas-ledger-verifier.mjs';
export function verifySignedExport(envelope, trustedPublicKey, expectedKeyId) {
  try {
    if (!envelope || Object.keys(envelope).sort().join(',') !== 'bundle,format,key_id,signature' || envelope.format !== 'aigas-ledger-signed-export-v1' || !expectedKeyId || envelope.key_id !== expectedKeyId || typeof envelope.signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature)) return { result:'INDETERMINATE', reason:'SIGNATURE_CONTEXT_INVALID' };
    const key = createPublicKey(trustedPublicKey);
    if (key.asymmetricKeyType !== 'ed25519') return { result:'INDETERMINATE', reason:'UNSUPPORTED_KEY' };
    const payload = JSON.stringify({ format:envelope.format, key_id:envelope.key_id, bundle:envelope.bundle });
    if (!verify(null, Buffer.from(payload), key, Buffer.from(envelope.signature,'base64'))) return { result:'MISMATCH', reason:'SIGNATURE_MISMATCH' };
    for (const entry of envelope.bundle.entries ?? []) {
      const receipt = entry.signature, event = entry.event;
      if (!receipt || receipt.key_id !== expectedKeyId || typeof receipt.signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(receipt.signature)) return { result:'INDETERMINATE', reason:'EVENT_SIGNATURE_MISSING_OR_UNKNOWN_KEY' };
      const eventPayload=JSON.stringify(['aigas-ledger-event-ed25519-v1',receipt.key_id,event.tenant_id,event.event_id,String(event.sequence_no),event.integrity_hash]);
      if (!verify(null,Buffer.from(eventPayload),key,Buffer.from(receipt.signature,'base64'))) return { result:'MISMATCH', reason:'EVENT_SIGNATURE_INVALID' };
    }
    if (envelope.bundle?.format === 'aigas-ledger-redacted-v1') {
      const m=envelope.bundle.manifest, entries=envelope.bundle.entries;
      if (!m || !Array.isArray(entries) || entries.length<1 || entries.length>10000 || m.event_count!==entries.length || m.scope!=='SIGNED_HASH_LINKS_ONLY') return {result:'INDETERMINATE',reason:'REDACTED_MANIFEST_INVALID'};
      let previous=null; const ids=new Set();
      for (let i=0;i<entries.length;i++) {
        const e=entries[i]?.event;
        if (!e || Object.keys(e).sort().join(',')!=='event_id,integrity_hash,previous_hash,sequence_no,tenant_id' || e.tenant_id!==m.tenant_id || String(e.sequence_no)!==String(i+1) || e.previous_hash!==previous || !/^[0-9a-f]{64}$/.test(e.integrity_hash) || ids.has(e.event_id)) return {result:'MISMATCH',reason:'REDACTED_CHAIN_INVALID'};
        ids.add(e.event_id); previous=e.integrity_hash;
      }
      if (m.head_hash!==previous || m.target_event_id!==entries.at(-1).event.event_id) return {result:'MISMATCH',reason:'REDACTED_MANIFEST_MISMATCH'};
      return {result:'MATCH',reason:'SIGNED_REDACTED_LINKS_VALID',key_id:expectedKeyId,scope:'SIGNED_HASH_LINKS_ONLY',limitations:'Hidden content cannot be independently rehashed; previous links are vouched for by the export signature, not independently recovered from hidden content. Omitted tail, source truth, retention and key authorization are not proven.'};
    }
    const chain = verifyBundle(envelope.bundle);
    if (chain.result !== 'MATCH') return { result:chain.result, reason:chain.reason };
    return { result:'MATCH', reason:'SIGNED_EXPORT_AND_PREFIX_VALID', key_id:expectedKeyId, scope:'SIGNED_SUPPLIED_PREFIX_ONLY', limitations:'Does not prove omitted tail, source truth, retention or key authorization.' };
  } catch { return { result:'INDETERMINATE', reason:'CRYPTO_OR_KEY_UNAVAILABLE' }; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 5) throw Error('arguments');
    const result = verifySignedExport(JSON.parse(await readFile(process.argv[2], 'utf8')), await readFile(process.argv[3]), process.argv[4]);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = result.result === 'MATCH' ? 0 : 1;
  } catch { process.stderr.write('INDETERMINATE: supply export, trusted public key, and expected key ID.\n'); process.exitCode = 2; }
}
