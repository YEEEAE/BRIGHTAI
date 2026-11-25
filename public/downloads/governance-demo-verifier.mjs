// Independent offline verifier for unsigned synthetic demo exports. Node 22+.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const FORMAT = 'brightai-governance-demo-chain-v1';
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
export function verify(bundle) {
  try {
    const m = bundle.manifest, entries = bundle.entries;
    if (bundle.format !== FORMAT || !m || !Array.isArray(entries) || m.assurance !== 'UNSIGNED_LOCAL_CONSISTENCY_ONLY' ||
        typeof m.correlation !== 'string' || !m.correlation || m.eventCount !== entries.length) return false;
    if (createHash('sha256').update(canonical(bundle.state)).digest('hex') !== m.stateHash ||
        canonical(bundle.state?.events) !== canonical(entries.map(entry => entry.event))) return false;
    let previous = null;
    for (let i = 0; i < entries.length; i++) {
      const { sequence, correlation, previous: link, event, hash } = entries[i];
      if (sequence !== i + 1 || correlation !== m.correlation || link !== previous || !event || event.id !== sequence) return false;
      const expected = createHash('sha256').update(canonical([FORMAT, { sequence, correlation, previous: link, event }])).digest('hex');
      if (hash !== expected) return false;
      previous = hash;
    }
    return previous === m.head;
  } catch { return false; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw Error('Expected one file');
    const valid = verify(JSON.parse(await readFile(process.argv[2], 'utf8')));
    console.log(valid ? 'MATCH: unsigned local consistency only; origin is not authenticated.' : 'MISMATCH: invalid or modified chain.');
    process.exitCode = valid ? 0 : 1;
  } catch { console.error('Unable to read a demo export.'); process.exitCode = 2; }
}
