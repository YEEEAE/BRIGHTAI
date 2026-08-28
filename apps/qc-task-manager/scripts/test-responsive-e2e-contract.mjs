import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const registry = readFileSync(new URL('./e2e-registry.mjs', import.meta.url), 'utf8');
const script = new URL('./e2e-responsive.mjs', import.meta.url);

const failures = [];
if (!packageJson.scripts['e2e:responsive']) failures.push('package.json must expose e2e:responsive');
if (!registry.includes("['responsive', 'scripts/e2e-responsive.mjs']")) failures.push('responsive suite must be canonical in e2e-registry.mjs');
if (!registry.includes('responsive')) failures.push('responsive suite label must exist');
try { readFileSync(script); } catch { failures.push('scripts/e2e-responsive.mjs must exist'); }

if (failures.length) {
  console.error('Responsive E2E contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Responsive E2E contract passed.');
