// Source-level keyboard contract. Browser flow coverage lives in e2e-a11y.mjs;
// this gate prevents regressions in every page/component source.
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const failures = [];
const fail = (m) => failures.push(m);
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (/\.(astro|tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = await walk(resolve('src'));
const sources = await Promise.all(files.map(async (p) => [p, await readFile(p, 'utf8')]));
const layout = sources.find(([p]) => p.endsWith('/layouts/BaseLayout.astro'))?.[1] ?? '';
if (!layout.includes('href="#main-content"')) fail('skip link does not target #main-content');
if (!layout.includes('tabindex="-1"')) fail('main landmark is not programmatically focusable');
const css = await readFile(resolve('src/styles/global.css'), 'utf8');
if (!css.includes('*:focus-visible') || !css.includes('outline: 2px solid var(--color-primary-500)')) fail('global focus-visible ring contract missing');
for (const [p, source] of sources) {
  if (source.includes('<dialog') || source.includes('role="dialog"')) {
    if (!source.includes('aria-labelledby')) fail(`${relative(process.cwd(), p)} missing dialog accessible name`);
    if (!source.includes('aria-modal="true"')) fail(`${relative(process.cwd(), p)} missing modal state`);
  }
  if (/onClick=|onclick=/.test(source) && /<div[^>]*(onClick|onclick)=/.test(source)) fail(`${relative(process.cwd(), p)} uses click handler on div instead of native control`);
}
if (failures.length) { console.error(`Keyboard UX gate failed (${failures.length}):`); failures.sort().forEach((m) => console.error(`- ${m}`)); process.exit(1); }
console.log(`Keyboard UX gate passed: ${files.length} source files, skip/focus/dialog/native-control contracts verified.`);
