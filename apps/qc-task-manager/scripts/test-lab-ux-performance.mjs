import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFile(join(root, path), 'utf8');
async function sourceFiles(directory) {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.(astro|tsx|ts|css|mjs)$/.test(entry.name)) files.push(path);
  }
  return files;
}
const [home, overview, css, middleware, packageJson] = await Promise.all([
  read('src/pages/lab/index.astro'),
  read('src/lib/lab/overview.ts'),
  read('src/styles/global.css'),
  read('src/middleware.ts'),
  read('package.json'),
]);
const motionFiles = await sourceFiles('src');
const motionSource = (await Promise.all(motionFiles.map(read))).join('\n');
const csp = middleware.match(/default-src[^"`]+/)?.[0] ?? '';

const checks = [
  ['role home does not hydrate a React island', !home.includes('client:load') && !home.includes('client:visible') && !home.includes('client:idle')],
  ['overview queries stay read-only', !overview.match(/\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE INDEX)\b/i)],
  ['overview query count is bounded and reported', (overview.match(/\.prepare\(/g) ?? []).length <= 36],
  ['reduced motion is enabled globally', css.includes('@media (prefers-reduced-motion: reduce)')],
  ['CSP remains strict', csp.length > 0 && !csp.includes("'unsafe-inline'") && !csp.includes("'unsafe-eval'")],
  ['no transition-all regression in shared CSS', !css.includes('transition: all') && !css.includes('transition-all')],
  ['motion uses explicit properties', !motionSource.includes('transition-all') && !motionSource.includes('transition hover') && !motionSource.includes('hover:-translate') && !motionSource.includes('hover:translate') && !motionSource.includes('hover:scale')],
  ['operational hover does not move controls', !motionSource.match(/hover:(?:-)?(?:translate|scale)/)],
  ['focused UX checks are wired to package scripts', packageJson.includes('test-lab-ux-presentation') || packageJson.includes('test-lab-ux-performance')],
];

const prepareCount = (overview.match(/\.prepare\(/g) ?? []).length;
console.log(`Overview prepared statement baseline: ${prepareCount}`);
let failed = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? '✅' : '❌'} ${label}`);
  if (!pass) failed += 1;
}
if (failed) process.exit(1);
console.log(`\n${checks.length} UX performance checks passed.`);
