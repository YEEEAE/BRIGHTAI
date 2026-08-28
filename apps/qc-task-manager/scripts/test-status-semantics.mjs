// Product-wide status semantics guard. This is intentionally source-level so
// it runs without a browser and catches duplicate presentation systems early.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(APP_DIR, path), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

const tones = read('src/components/ui/statusTones.ts');
const canonicalRoles = ['neutral', 'info', 'pending', 'warning', 'success', 'danger', 'blocked'];
for (const role of canonicalRoles) ok(tones.includes(`'${role}'`), `canonical role missing: ${role}`);
for (const role of ['task', 'finding', 'capa', 'evidence', 'labTest', 'document', 'equipment', 'calibration', 'maintenance', 'retest', 'notification', 'account', 'ai']) {
  ok(tones.includes(`${role}:`), `domain adapter missing: ${role}`);
}
ok(tones.includes('humanizeStatusCode'), 'unknown statuses must receive a human label');
ok(tones.includes('LEGACY_TONE_ALIASES'), 'legacy tone migration aliases must remain explicit');

for (const path of ['src/components/StatusBadge.astro', 'src/components/QcStatusBadge.astro', 'src/components/lab/LabDocumentStatusBadge.astro']) {
  const source = read(path);
  ok(source.includes('StatusPill.astro'), `badge must delegate to StatusPill: ${path}`);
  ok(!/bg-(red|amber|orange|emerald|slate|violet|blue)-/.test(source), `badge owns raw status colors: ${path}`);
}

const legacyToneConsumers = ['src/pages/admin/templates/index.astro'];
for (const path of legacyToneConsumers) ok(!read(path).includes('neutral-strong'), `legacy tone leaked to consumer: ${path}`);

if (failures.length) {
  console.error(`❌ status semantics guard failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('✅ status semantics guard passed: canonical roles, adapters, labels, and badge delegation are present.');
