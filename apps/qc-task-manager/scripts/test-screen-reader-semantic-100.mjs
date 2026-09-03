// Screen-reader semantic contract: names, landmarks, status announcements.
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
const failures = [];
const fail = (m) => failures.push(m);
async function walk(dir) { const out=[]; for (const e of await readdir(dir,{withFileTypes:true})) { const p=resolve(dir,e.name); if(e.isDirectory()) out.push(...await walk(p)); else if(/\.(astro|tsx|jsx)$/.test(e.name)) out.push(p); } return out; }
const files = await walk(resolve('src'));
for (const p of files) {
  const s = await readFile(p, 'utf8'); const name = relative(process.cwd(), p);
  if (/aria-live|role="status"|role="alert"/.test(s) && !/aria-atomic|role="alert"/.test(s)) fail(`${name}: live feedback should be atomic or alert`);
  if (/<svg/.test(s) && !/aria-hidden="true"|aria-label=|title=/.test(s)) fail(`${name}: SVG needs decorative or informative semantics`);
  if (/<dialog|role="dialog"/.test(s) && !/aria-labelledby/.test(s)) fail(`${name}: dialog needs aria-labelledby`);
}
const base = await readFile(resolve('src/layouts/BaseLayout.astro'), 'utf8');
for (const landmark of ['<main id="main-content"', '<footer', 'aria-live="polite"']) if (!base.includes(landmark)) fail(`BaseLayout missing ${landmark}`);
if (failures.length) { console.error(`Screen-reader semantic gate failed (${failures.length}):`); failures.sort().forEach((m)=>console.error(`- ${m}`)); process.exit(1); }
console.log(`Screen-reader semantic gate passed: ${files.length} source files, names/landmarks/live semantics verified.`);
