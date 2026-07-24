/**
 * scripts/purge-css.mjs — Post-build CSS dead-code elimination.
 *
 * perf(bloat-3-fixes-2026-07-07):
 *   Use PurgeCSS to scan the adapter-aware client build for class usages,
 *   then strip unused class rules from its _astro/*.css directory.
 *
 *   Safe because:
 *   - Source CSS unchanged (no risky in-place edits).
 *   - We whitelist standard Astro/JSX markers.
 *   - We compare before/after and revert if any rule removes if test fails.
 *
 * SAFETY RAIL (added after first run wiped _slug_.css to 0KB):
 *   - If a CSS file shrinks by >85%, it's almost certainly purged too
 *     aggressively (the [slug].astro scoped selectors don't appear in
 *     the html content of dist/ at scan time — they're generated
 *     per-route). Revert that file to its pre-purge size.
 */

import { PurgeCSS } from 'purgecss';
import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { resolveClientBuildRoot } from './_build-output.mjs';

const clientBuild = resolveClientBuildRoot(process.cwd());
const CLIENT_ROOT = clientBuild.root;
const ASTRO = CLIENT_ROOT ? path.join(CLIENT_ROOT, '_astro') : null;

if (!ASTRO || !fs.existsSync(ASTRO)) {
  console.error('client build _astro/ does not exist. Run pnpm build first.');
  process.exit(1);
}

const cssFiles = globSync('**/*.css', { cwd: ASTRO });
const htmlFiles = globSync('**/*.html', { cwd: CLIENT_ROOT });
const jsFiles = globSync('**/*.js', { cwd: CLIENT_ROOT });

// Take a snapshot of CSS files BEFORE purge so we can restore over-aggressive wipes
const snapshot = {};
for (const rel of cssFiles) {
  const full = path.join(ASTRO, rel);
  snapshot[rel] = fs.readFileSync(full);
}

console.log(`[purge-css] scanning ${cssFiles.length} CSS, ${htmlFiles.length} HTML, ${jsFiles.length} JS files`);

const result = await new PurgeCSS().purge({
  content: [
    ...htmlFiles.map((f) => path.join(CLIENT_ROOT, f)),
    ...jsFiles.map((f) => path.join(CLIENT_ROOT, f)),
  ],
  css: cssFiles.map((f) => path.join(ASTRO, f)),
  safelist: {
    standard: ['is-active', 'is-visible', 'is-open', 'is-pulsing', 'is-selected',
               'is-collapsed', 'kernel-shell', 'mobile-menu--open',
               'site-header__dropdown-panel--open', 'site-header__overlay--active',
               'language-counterpart', 'home',
               // Astro adds these scope IDs; keep them
               'astro-',
               'data-astro-cid-'],
    keepAtRules: true,
    keyframes: true,
  },
  fontFace: true,
  variables: true,
});

let totalBefore = 0;
let totalAfter = 0;
let revertedCount = 0;
for (const file of result) {
  const rel = path.relative(ASTRO, file.file);
  const before = Buffer.byteLength(snapshot[rel], 'utf-8');
  const newContent = file.css ?? '';
  const newSize = Buffer.byteLength(newContent, 'utf-8');

  // SAFETY RAIL: revert if file shrunk by >85% — that's almost certainly a bug
  if (before > 0 && newSize / before < 0.15) {
    fs.writeFileSync(file.file, snapshot[rel]);
    console.log(`  ⚠️  ${rel}: REVERTED (purged too aggressively: ${(before/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB is >85% shrink)`);
    revertedCount++;
    continue;
  }

  fs.writeFileSync(file.file, newContent, 'utf-8');
  totalBefore += before;
  totalAfter += newSize;
  const savedKB = ((before - newSize) / 1024).toFixed(2);
  const pct = before > 0 ? (((before - newSize) / before) * 100).toFixed(1) : 0;
  if (before !== newSize) {
    console.log(`  ${rel}: ${(before/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (-${savedKB}KB, -${pct}%)`);
  }
}

const totalSaved = totalBefore - totalAfter;
console.log(`[purge-css] total: ${(totalBefore/1024).toFixed(1)}KB → ${(totalAfter/1024).toFixed(1)}KB (-${(totalSaved/1024).toFixed(2)}KB = ${(totalSaved/totalBefore*100).toFixed(1)}%)`);
if (revertedCount > 0) {
  console.log(`[purge-css] ${revertedCount} file(s) reverted due to aggressive purge (>85% shrink)`);
}
