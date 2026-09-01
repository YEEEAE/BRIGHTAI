#!/usr/bin/env node
/**
 * Source-level guards for the global background contract and CSS delivery.
 *
 * Runs without a browser so it can gate every commit. Runtime behaviour is
 * verified separately by scripts/qa/layout-audit.mjs against a real Chromium.
 *
 * Usage: node scripts/qa/verify-background-contract.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const read = (p) => readFileSync(join(REPO, p), 'utf8');
const exists = (p) => existsSync(join(REPO, p));

let pass = 0;
const failures = [];
const ok = (cond, label) => { if (cond) pass += 1; else failures.push(label); };

/* ─────────────────────────────── 1. background components exist and comply */
const CONTRACT = [
  ['src/components/SiteBackground.astro', '/media/brightai-background.mp4', '/media/brightai-background-poster.jpg'],
  ['apps/dashboard/components/SiteBackground.module.css', null, null],
  ['apps/qc-task-manager/src/components/SystemBackground.astro', '/media/qc-system-background.mp4', '/media/qc-system-background-poster.jpg'],
  ['public/500.html', '/media/brightai-background.mp4', '/media/brightai-background-poster.jpg'],
];

for (const [file, video, poster] of CONTRACT) {
  ok(exists(file), `background source exists: ${file}`);
  if (!exists(file)) continue;
  const raw = read(file);
  // Only inspect the background rules themselves. These files also contain
  // unrelated CSS (500.html carries a large inlined critical stylesheet) and
  // prose comments that would otherwise trip the substring checks.
  const bgRules = (raw.match(/\.(bai-site-background|qc-system-background|background|video)[^{]*\{[^}]*\}/g) || []).join('\n');
  const src = bgRules || raw;
  ok(src.includes('position: fixed'), `${file}: background layer is viewport-fixed`);
  ok(src.includes('width: 1600px') && src.includes('height: 1200px'), `${file}: video keeps its native 1600x1200`);
  ok(src.includes('object-fit: contain'), `${file}: uses object-fit: contain`);
  ok(!/object-fit:\s*cover/.test(src), `${file}: never uses object-fit: cover`);
  ok(!/transform:\s*scale\(/.test(src) && !/\bzoom:/.test(src), `${file}: never scales or zooms the video`);
  ok(src.includes('opacity: 1'), `${file}: opacity is 1`);
  ok(src.includes('filter: none'), `${file}: filter is none`);
  ok(!/mix-blend-mode/.test(src), `${file}: no colour-altering blend mode`);
  ok(!/(class|className)="[^"]*scrim|\.\w*scrim/.test(raw), `${file}: no scrim element or class`);
  ok(src.includes('pointer-events: none'), `${file}: background never intercepts input`);
  ok(raw.includes('prefers-reduced-motion: reduce'), `${file}: honours reduced motion`);
  ok(raw.includes('@media print'), `${file}: excluded from print`);
  if (video) ok(raw.includes(video), `${file}: points at ${video}`);
  if (poster) ok(raw.includes(poster), `${file}: uses the matching poster`);
}

// The dashboard component markup lives beside its CSS module.
if (exists('apps/dashboard/components/SiteBackground.tsx')) {
  const s = read('apps/dashboard/components/SiteBackground.tsx');
  ok(s.includes('/media/brightai-background.mp4'), 'dashboard component points at the synced video');
  ok(s.includes('aria-hidden="true"'), 'dashboard background is hidden from assistive tech');
  ok(s.includes('autoPlay') && s.includes('muted') && s.includes('loop') && s.includes('playsInline'),
    'dashboard video autoplays muted and looping inline');
}

/* ───────────────────────────── 2. one mount point per shell, no duplication */
const shell = read('src/layouts/BaseLayout.astro');
ok(shell.includes("import SiteBackground from '../components/SiteBackground.astro'"),
  'BaseLayout imports SiteBackground');
ok((shell.match(/<SiteBackground \/>/g) || []).length === 1,
  'BaseLayout renders exactly one SiteBackground');
for (const child of ['ArabicLayout', 'EnglishLayout', 'KernelLayout', 'BlogLayout', 'DocsLayout']) {
  const s = read(`src/layouts/${child}.astro`);
  ok(!s.includes('<SiteBackground'), `${child} does not duplicate the background (BaseLayout owns it)`);
}
const dashLayout = read('apps/dashboard/app/layout.tsx');
ok((dashLayout.match(/<SiteBackground \/>/g) || []).length === 1,
  'dashboard root layout renders exactly one SiteBackground');

// Pages that own their own <html> need their own mount.
for (const p of ['src/pages/answer/[slug].astro', 'src/pages/lp/[slug].astro', 'src/pages/kernel/admin/quota.astro']) {
  const s = read(p);
  ok(s.includes('<SiteBackground />'), `${p} mounts its own background (it owns its <html> shell)`);
  ok(/:global\(body > \*:not\(\[aria-hidden='true'\]\)\)/.test(s), `${p} lifts its content above the background layer`);
}
ok(read('public/500.html').includes('class="bai-site-background"'), '500.html mounts the background inline');

/* ───────────────────────── 3. the removed page-level background stack is gone */
const REMOVED = [
  ['src/layouts/BaseLayout.astro', /<DottedBackground/, 'the dotted CSS background is unmounted'],
  ['src/styles/base.css', /^body::before\s*\{/m, 'the fixed full-viewport body noise overlay rule is gone'],
  ['src/components/SplitHero.astro', /\.split-hero__vignette\s*\{/, 'the hero vignette wash is gone'],
  ['src/components/SplitHero.astro', /<canvas/, 'the hero canvas is gone'],
  ['src/components/SplitHero.astro', /\.split-hero__beams\s*\{/, 'the hero gradient beams are gone'],
  ['src/styles/components.css', /^\.dotted-bg\s*\{/m, 'the .dotted-bg name collision is gone'],
];
for (const [file, pattern, label] of REMOVED) {
  ok(!pattern.test(read(file)), label);
}
ok(read('src/styles/base.css').includes('body > * { position: relative; z-index: 2; }'),
  'base.css still lifts body children above the background layer');

// BackgroundGrid rendered an unstyled div on 25 pages; nothing should mount it.
const srcFiles = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || n === 'node_modules') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(astro|css|ts|tsx)$/.test(p)) srcFiles.push(p);
  }
}(join(REPO, 'src')));
const gridUsers = srcFiles.filter((p) => !p.endsWith('BackgroundGrid.astro') && readFileSync(p, 'utf8').includes('BackgroundGrid'));
ok(gridUsers.length === 0, `BackgroundGrid is unmounted everywhere (found ${gridUsers.length}: ${gridUsers.map((p) => relative(REPO, p)).join(', ')})`);

/* ───────────────── 4. CSS delivery: no shell page may lose components/pages */
// This is the regression this guard exists for. components.css and pages.css used
// to be imported by ArabicLayout only, so the homepage, /en/* and /kernel/* shipped
// without ~269KB of their own styles and rendered with collapsed grids.
ok(shell.includes("@import '../styles/components.css' layer(components)"),
  'BaseLayout delivers components.css to every shell page');
ok(shell.includes("@import '../styles/pages.css' layer(pages)"),
  'BaseLayout delivers pages.css to every shell page');
const layerLine = (shell.match(/@layer [^;]+;/) || [''])[0];
ok(/tokens.*base.*components.*pages/.test(layerLine),
  `layer order still puts components and pages after base (${layerLine})`);
for (const child of ['ArabicLayout', 'EnglishLayout', 'KernelLayout']) {
  const s = read(`src/layouts/${child}.astro`);
  ok(!s.includes("styles/components.css") && !s.includes("styles/pages.css"),
    `${child} no longer re-imports components.css / pages.css (BaseLayout owns delivery)`);
}

/* ────────────────────────── 5. the media sync is wired into the build */
const pkg = JSON.parse(read('package.json'));
ok(/bg:sync/.test(pkg.scripts.prebuild), 'prebuild syncs the background media');
ok(pkg.scripts['bg:verify'] === 'node scripts/sync-background-media.mjs --check',
  'bg:verify exists for CI byte-identity checks');
const ignore = read('.gitignore');
for (const p of ['public/media/brightai-background.mp4', 'apps/dashboard/public/media/brightai-background.mp4']) {
  ok(ignore.includes(p), `generated copy is gitignored: ${p}`);
}
ok(exists('9.mp4'), 'the single committed source video is present at the repo root');

/* ─────────────────────────────────────────────────────────────────── report */
for (const f of failures) console.error(`  ✖ ${f}`);
const total = pass + failures.length;
console.log(`\nverify-background-contract: ${pass}/${total} checks passed`);
if (failures.length) {
  console.error(`${failures.length} check(s) failed.`);
  process.exit(1);
}
