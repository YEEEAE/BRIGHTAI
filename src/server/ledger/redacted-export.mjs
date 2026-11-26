// A selective disclosure of signed hash links, never a proof of hidden content.
export function redactBundle(bundle) {
  return { format:'aigas-ledger-redacted-v1', manifest:{ tenant_id:bundle.manifest.tenant_id, event_count:bundle.entries.length,
    target_event_id:bundle.manifest.target_event_id, head_hash:bundle.manifest.head_hash,
    scope:'SIGNED_HASH_LINKS_ONLY', redacted:['metadata','actor','source','event_type','policy','timestamp','idempotency_key','canonical_inputs'] },
    entries:bundle.entries.map(({event,signature})=>({event:{tenant_id:event.tenant_id,event_id:event.event_id,sequence_no:String(event.sequence_no),previous_hash:event.previous_hash,integrity_hash:event.integrity_hash},signature})) };
}
