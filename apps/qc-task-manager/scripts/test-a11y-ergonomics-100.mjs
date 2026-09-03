// QC-100-A11Y-011 — source-level accessibility and ergonomics gate.
//
// This is deliberately a contract gate, not a substitute for VoiceOver/NVDA
// or a browser/axe run. It inventories every public page/component source and
// fails on regressions in the shared accessibility guarantees that can be
// proven without rendering or a human assistive-technology session.

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve('src');
const failures = [];
const fail = (message) => failures.push(message);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (/\.(astro|tsx|jsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

const [pages, components] = await Promise.all([
  walk(resolve(root, 'pages')),
  walk(resolve(root, 'components')),
]);
const pageSources = await Promise.all(pages.map(async (path) => [path, await readFile(path, 'utf8')]));
const componentSources = await Promise.all(components.map(async (path) => [path, await readFile(path, 'utf8')]));
const all = [...pageSources, ...componentSources];

// Shared bypass/landmark contract.
const layout = await readFile(resolve(root, 'layouts/BaseLayout.astro'), 'utf8');
if (!layout.includes('class="skip-link"') || !layout.includes('href="#main-content"') || !layout.includes('تخطي إلى المحتوى الرئيسي')) fail('BaseLayout must expose a first-focusable Arabic skip link to #main-content');
if (!layout.includes('<main id="main-content"') || !layout.includes('tabindex="-1"')) fail('BaseLayout main landmark must be targetable by the skip link');
if (!layout.includes('<footer') || !layout.includes('aria-live="polite"')) fail('BaseLayout must expose footer and stable polite live region landmarks');
if (!layout.includes('<html lang="en"') || !layout.includes('dir="ltr"')) fail('BaseLayout must declare document language and direction');

// Dialog relationship + dismissal contract.
for (const [path, source] of all.filter(([, source]) => source.includes('<dialog') || source.includes('role="dialog"'))) {
  if (!source.includes('aria-labelledby')) fail(`${relative(process.cwd(), path)}: dialog is missing aria-labelledby`);
  if (!source.includes('aria-modal="true"')) fail(`${relative(process.cwd(), path)}: modal dialog is missing aria-modal=true`);
  if (!source.includes('aria-describedby')) fail(`${relative(process.cwd(), path)}: dialog is missing aria-describedby`);
  if (path.endsWith('.tsx') && !source.includes('Escape') && !source.includes('onCancel')) {
    fail(`${relative(process.cwd(), path)}: interactive React dialog needs Escape/cancel handling`);
  }
}

// Dynamic status feedback must be announced, and chart components must expose
// a non-visual alternative in their rendered markup.
for (const [path, source] of componentSources) {
  const name = relative(process.cwd(), path);
  if (/Feedback|Notice|Toast|CommentBox|OperationalState/.test(path) && !source.includes('aria-live') && !source.includes('role="alert"')) {
    fail(`${name}: status/feedback component lacks an announcement contract`);
  }
  if (/Chart/.test(path) && !source.includes('aria-label') && !source.includes('aria-labelledby') && !source.includes('sr-only')) {
    fail(`${name}: chart needs an accessible name or text alternative`);
  }
}

// CSS contracts for keyboard visibility, reduced motion and zoom-safe dialogs.
const css = await readFile(resolve(root, 'styles/global.css'), 'utf8');
for (const required of [':focus-visible', 'prefers-reduced-motion: reduce', 'scroll-behavior: auto', 'max-block-size: calc(100dvh']) {
  if (!css.includes(required)) fail(`global.css missing ${required}`);
}

// Keep the manual boundary explicit in the report: these checks are source
// evidence only and do not inflate a manual AT score.
const consolidatedEvidence = fileURLToPath(new URL('../../../audit/qc/QC-Task-Manager/Evidences/QC-TASK-MANAGER-ALL-EVIDENCES-COMBINED.md', import.meta.url));
const localEvidence = resolve('A11Y-ERGONOMICS-100-EVIDENCE.md');
if (!existsSync(consolidatedEvidence) && !existsSync(localEvidence)) {
  fail('Consolidated evidence file (audit/qc/QC-Task-Manager/Evidences/QC-TASK-MANAGER-ALL-EVIDENCES-COMBINED.md) or local A11Y-ERGONOMICS-100-EVIDENCE.md must exist');
}

if (failures.length) {
  console.error(`A11Y/ergonomics source gate failed (${failures.length}):`);
  for (const failure of failures.sort()) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`A11Y/ergonomics source gate passed: ${pages.length} page sources, ${components.length} component sources, automated contract 100%. Manual AT evidence remains separate.`);
