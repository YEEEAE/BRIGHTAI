#!/usr/bin/env node
/**
 * _audit-unused-images.mjs
 * ابحث عن الصور (png/jpg/webp/avif/svg/...) في public/ و تحقق من استخدامها
 * في src/ و public/ (الملفات المرجعية) وملفات التكوين.
 *
 * Output: list of { image, refCount, refs[] }
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve, basename, dirname, extname } from 'node:path';

const ROOT = resolve(process.cwd());

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.bmp', '.ico', '.svg']);

// search paths: src/, public/ (لازم نتجنب البحث عن الصورة في نفسها)
const SEARCH_DIRS = ['src', 'public'];

// config files to also search (outside src/ and public/)
const ROOT_CONFIG_FILES = [
  'package.json',
  'astro.config.mjs',
  'tsconfig.json',
  'render.yaml',
  'redirects.json',
  'sitemap.xml',
  'sitemap-images.xml',
  'robots.txt',
  'llms.txt',
  'llms-full.txt',
  'ai.txt',
  'humans.txt',
  'manifest.webmanifest',
  'CLAUDE.md',
  'AGENTS.md',
  'META-CHANGES.csv',
  'MONOREPO.md',
  'README.md',
  'DESIGN.md',
  'knowledge.md',
  'implementation_plan.md',
];

async function listImageFiles(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try { entries = await readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        // skip noise dirs
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' ||
            e.name === '.astro' || e.name === 'download' || e.name === '_reports' ||
            e.name === 'audit' || e.name === 'reports' || e.name === 'artifacts' ||
            e.name === '.agents' || e.name === 'a11y-report.html' || e.name === 'a11y-report.json') {
          continue;
        }
        await walk(full);
      } else if (e.isFile()) {
        const ext = extname(e.name).toLowerCase();
        if (IMAGE_EXT.has(ext)) {
          out.push(full);
        }
      }
    }
  }
  await walk(dir);
  return out;
}

async function readAllFiles(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try { entries = await readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' ||
            e.name === '.astro' || e.name === 'download' || e.name === '_reports' ||
            e.name === 'audit' || e.name === 'reports' || e.name === 'artifacts' ||
            e.name === '.agents' || e.name === 'worklog.md') {
          continue;
        }
        await walk(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

async function readRootConfigs() {
  const out = [];
  for (const f of ROOT_CONFIG_FILES) {
    const full = join(ROOT, f);
    if (existsSync(full)) {
      out.push(full);
    }
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchRefsForImage(imageFile, allSearchFiles) {
  const ref = relative(ROOT, imageFile);
  // للـ public/ files: اسم الملف يبحث في src/ + public/ (ما عدا الملف نفسه)
  // للـ src/ files: ما نتوقع (نادر) — ابحث بنفس الاسم
  const baseName = basename(imageFile);
  const baseNoExt = baseName.replace(/\.[^.]+$/, '');
  // public path: e.g. "/images/foo.png"
  let publicPath = null;
  if (imageFile.startsWith(join(ROOT, 'public'))) {
    publicPath = '/' + relative(join(ROOT, 'public'), imageFile).split(/[\\/]/).join('/');
  }

  const refs = [];
  for (const sf of allSearchFiles) {
    // skip the file itself
    if (sf === imageFile) continue;
    let content;
    try { content = readFileSync(sf, 'utf-8'); } catch { continue; }

    // patterns to search:
    // 1. exact filename match: foo.png
    // 2. public path: /images/foo.png (only for public/ images)
    // 3. relative path: ../../public/images/foo.png
    // 4. basename without ext (for SVG sprite use): foo (only if we add this if needed)
    const candidates = [];
    candidates.push(baseName);
    if (publicPath) candidates.push(publicPath);
    // also check without extension (some CSS/JS use basename no ext)
    if (baseName.endsWith('.svg') || baseName.endsWith('.png') || baseName.endsWith('.webp') || baseName.endsWith('.avif')) {
      candidates.push(baseNoExt);
    }

    let matched = false;
    for (const cand of candidates) {
      if (matched) break;
      const re = new RegExp(escapeRegExp(cand));
      if (re.test(content)) {
        refs.push(relative(ROOT, sf));
        matched = true;
        break;
      }
    }
  }
  return refs;
}

async function main() {
  console.log('🔍 Auditing images for unused references...\n');
  console.log('ROOT:', ROOT);
  console.log('');

  // 1. list all images in public/ + src/
  const allImages = [];
  for (const d of SEARCH_DIRS) {
    const full = join(ROOT, d);
    if (existsSync(full)) {
      const imgs = await listImageFiles(full);
      allImages.push(...imgs);
    }
  }
  console.log(`📦 Found ${allImages.length} image files\n`);

  // 2. collect all search files
  const allSearch = [];
  for (const d of SEARCH_DIRS) {
    const full = join(ROOT, d);
    if (existsSync(full)) {
      const files = await readAllFiles(full);
      allSearch.push(...files);
    }
  }
  const rootConfigs = await readRootConfigs();
  allSearch.push(...rootConfigs);
  console.log(`📑 Searching ${allSearch.length} files for references\n`);

  // 3. for each image, find refs
  const results = [];
  for (const img of allImages) {
    const refs = searchRefsForImage(img, allSearch);
    results.push({ image: relative(ROOT, img), refCount: refs.length, refs });
  }

  // 4. sort by refCount asc (unused first)
  results.sort((a, b) => a.refCount - b.refCount);

  // 5. print
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' IMAGE                         REFS   STATUS');
  console.log('═══════════════════════════════════════════════════════════════');

  let unusedCount = 0;
  let usedCount = 0;
  const unusedList = [];
  for (const r of results) {
    const status = r.refCount === 0 ? '❌ UNUSED' : '✅ in use';
    if (r.refCount === 0) {
      unusedCount++;
      unusedList.push(r.image);
    } else {
      usedCount++;
    }
    const pad = r.image.padEnd(40);
    const cnt = String(r.refCount).padStart(4);
    console.log(` ${pad} ${cnt}   ${status}`);
  }
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(` Summary: ${usedCount} used, ${unusedCount} unused, ${allImages.length} total`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (unusedList.length) {
    console.log('🗑️  UNUSED IMAGES (candidates for deletion):');
    for (const u of unusedList) {
      const full = join(ROOT, u);
      try {
        const s = await stat(full);
        const kb = (s.size / 1024).toFixed(1);
        console.log(`   - ${u}  (${kb} KB)`);
      } catch {
        console.log(`   - ${u}`);
      }
    }
  } else {
    console.log('🎉 No unused images found.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
