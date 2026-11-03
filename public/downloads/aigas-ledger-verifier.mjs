// Standalone Node 22 verifier. No dependencies, network, app server or credentials.
// Usage: node aigas-ledger-verifier.mjs ledger-EVENT_ID.json
// MATCH establishes consistency of this supplied prefix, never authenticity.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export const FORMAT = 'aigas-ledger-bundle-v2';
export const PROFILE = 'aigas-ledger-sha256-chain-v2';
// Bump only with a reviewed change to canonicalInputs/verifyBundle semantics.
// Bundles record this version; a different verifier fails closed instead of
// silently reapplying a newer interpretation to an older bundle.
export const VERIFIER_VERSION = '2.1.0';
export const MAX_EVENTS = 10000;
const fields = ['event_id','tenant_id','source','event_type','policy_version','metadata_json','created_at','created_by','hash_profile','sequence_no','previous_hash','idempotency_key','integrity_hash'];
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const policyVersion = value => typeof value === 'string' && /^[a-zA-Z0-9_.:-]{1,120}$/.test(value);
const hash = value => createHash('sha256').update(value,'utf8').digest('hex');
export function canonicalInputs(event) {
  if (!event || Object.keys(event).length !== fields.length || fields.some(k=>!Object.hasOwn(event,k))) throw new Error('Unsupported event fields');
  if (![event.event_id,event.tenant_id,event.created_by].every(uuid) || event.hash_profile!==PROFILE || !/^[1-9]\d*$/.test(String(event.sequence_no)) || !policyVersion(event.policy_version) || !event.metadata_json || Array.isArray(event.metadata_json) || typeof event.metadata_json!=='object') throw new Error('Unsupported event');
  const meta = Object.fromEntries(Object.keys(event.metadata_json).sort().map(k=>[k,event.metadata_json[k]]));
  if (Object.values(meta).some(v=>v!==null && !['string','boolean','number'].includes(typeof v))) throw new Error('Non-scalar metadata');
  return JSON.stringify([PROFILE,event.tenant_id,event.event_id,event.source,event.event_type,event.policy_version,meta,new Date(event.created_at).toISOString(),event.created_by,String(event.sequence_no),event.previous_hash,event.idempotency_key]);
}
const stateFor = result => result==='MATCH'?'VERIFIED':result==='MISMATCH'?'BLOCKED':'UNVERIFIED';
export function verifyBundle(bundle) {
  const fail = (result,reason,extra={}) => ({result,reason,state:stateFor(result),independentSignature:false,externalAnchor:false,verifier:{version:VERIFIER_VERSION,pinned:extra.pinned===true},...extra});
  try {
    const m=bundle?.manifest, entries=bundle?.entries;
    if (bundle?.format!==FORMAT || !m || !Array.isArray(entries) || !entries.length || entries.length>MAX_EVENTS || m.profile!==PROFILE || m.coverage!=='GENESIS_THROUGH_TARGET' || !uuid(m.tenant_id)) return fail('INDETERMINATE','UNSUPPORTED_BUNDLE');
    // A bundle that declares a verifier version must be read by that exact version.
    // Older bundles without the declaration are still checked but reported unpinned.
    const pinned = !!m.verifier;
    if (pinned && (typeof m.verifier!=='object' || m.verifier.version!==VERIFIER_VERSION)) return fail('INDETERMINATE','VERIFIER_VERSION_MISMATCH',{pinned:true});
    if (!Number.isSafeInteger(m.event_count) || m.event_count!==entries.length || String(m.first_sequence)!=='1' || String(m.last_sequence)!==String(entries.length)) return fail('MISMATCH','MANIFEST_RANGE');
    let previous=null;
    const ids=new Set(),keys=new Set(),versions=new Set();
    for (let i=0;i<entries.length;i++) {
      const {event,canonical_hash_inputs}=entries[i];
      if (!event || typeof event!=='object') return fail('MISMATCH','INVALID_EVENT');
      const key=`${event.source}:${event.idempotency_key}`;
      if (event.tenant_id!==m.tenant_id || String(event.sequence_no)!==String(i+1) || event.previous_hash!==previous || ids.has(event.event_id) || keys.has(key)) return fail('MISMATCH','CHAIN_REFERENCE');
      const canonical=canonicalInputs(event);
      if (canonical!==canonical_hash_inputs || hash(canonical)!==event.integrity_hash) return fail('MISMATCH','HASH_INPUTS');
      ids.add(event.event_id);keys.add(key);versions.add(event.policy_version);previous=event.integrity_hash;
    }
    const target=entries.at(-1).event;
    if (m.head_hash!==previous || m.target_event_id!==target.event_id) return fail('MISMATCH','MANIFEST_TARGET');
    if (Array.isArray(m.policy_versions) && (m.policy_versions.length!==versions.size || m.policy_versions.some(v=>!versions.has(v)))) return fail('MISMATCH','MANIFEST_POLICY_VERSIONS');
    return {...fail('MATCH','CONSISTENT_SUPPLIED_PREFIX',{pinned,...(pinned?{}:{warnings:['VERIFIER_VERSION_NOT_DECLARED']})}),eventCount:entries.length,limits:'No independent signature or external anchor. Cannot prove source truth, timestamp truth, omitted tail, legal validity, or detect administrator rewrite of the entire supplied chain. No retention guarantee.'};
  } catch { return fail('INDETERMINATE','MALFORMED_BUNDLE'); }
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length!==3) throw new Error('Usage: node aigas-ledger-verifier.mjs ledger-EVENT_ID.json');
    const result=verifyBundle(JSON.parse(await readFile(process.argv[2],'utf8')));
    process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
    process.exitCode=result.result==='MATCH'?0:1;
  } catch { process.stderr.write('INDETERMINATE: supply one readable Ledger JSON export.\n');process.exitCode=2; }
}
