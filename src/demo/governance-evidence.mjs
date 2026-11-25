// Local demo evidence only: consistency, not origin or authenticity.
export const FORMAT = 'brightai-governance-demo-chain-v1';
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
async function digest(value) {
  if (!globalThis.crypto?.subtle) throw Error('WebCrypto unavailable');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function exportEvidence(state, correlation) {
  if (!correlation || !Array.isArray(state.events)) throw Error('Invalid session');
  const entries = [];
  let previous = null;
  for (const event of state.events) {
    const record = { sequence: entries.length + 1, correlation, previous, event };
    const hash = await digest(canonical([FORMAT, record]));
    entries.push({ ...record, hash });
    previous = hash;
  }
  return { format: FORMAT, manifest: { correlation, eventCount: entries.length, head: previous,
    assurance: 'UNSIGNED_LOCAL_CONSISTENCY_ONLY', stateHash: await digest(canonical(state)) }, state, entries };
}
export async function verifyEvidence(bundle) {
  if (!globalThis.crypto?.subtle) throw Error('WebCrypto unavailable');
  if (bundle?.format !== FORMAT || !bundle.manifest || !Array.isArray(bundle.entries) ||
      bundle.manifest.assurance !== 'UNSIGNED_LOCAL_CONSISTENCY_ONLY' ||
      typeof bundle.manifest.correlation !== 'string' || !bundle.manifest.correlation ||
      bundle.manifest.eventCount !== bundle.entries.length) return false;
  if (await digest(canonical(bundle.state)) !== bundle.manifest.stateHash ||
      canonical(bundle.state?.events) !== canonical(bundle.entries.map(entry => entry.event))) return false;
  let previous = null;
  for (let i = 0; i < bundle.entries.length; i++) {
    const { sequence, correlation, event, hash, previous: link } = bundle.entries[i];
    if (sequence !== i + 1 || correlation !== bundle.manifest.correlation || link !== previous ||
        !event || event.id !== sequence || await digest(canonical([FORMAT, { sequence, correlation, previous: link, event }])) !== hash) return false;
    previous = hash;
  }
  return previous === bundle.manifest.head;
}
