import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import path from 'node:path';

const root = process.cwd();

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return readFileSync(absolute(relativePath), 'utf8');
}

test('404 page uses the Arabic layout and required clean navigation links', () => {
  const file = 'src/pages/404.astro';
  assert.ok(existsSync(absolute(file)), `${file} must exist`);

  const source = read(file);
  assert.match(source, /import ArabicLayout/);
  assert.match(source, /<ArabicLayout/);
  assert.match(source, /الصفحة غير موجودة/);
  assert.match(source, /ابحث|البحث/);

  for (const href of ['/', '/solutions/', '/kernel/', '/blog/', '/docs/']) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(source, new RegExp(`href(?:=|:)\\s*["']${escapedHref}["']`));
  }

  assert.doesNotMatch(source, /href=["'][^"']*\.html(?:[#?][^"']*)?["']/);
});

test('offline page uses the Arabic layout and provides cached and reconnect guidance', () => {
  const file = 'src/pages/offline/index.astro';
  assert.ok(existsSync(absolute(file)), `${file} must exist`);

  const source = read(file);
  assert.match(source, /import ArabicLayout/);
  assert.match(source, /<ArabicLayout/);
  assert.match(source, /غير متصل|الاتصال مقطوع/);
  assert.match(source, /المحفوظ|المخزن/);
  assert.match(source, /window\.location\.reload\(\)/);
  assert.doesNotMatch(source, /href=["'][^"']*\.html(?:[#?][^"']*)?["']/);
});

test('Arabic layout plumbing supplies RTL and the required Google Analytics tag', () => {
  assert.match(read('src/layouts/ArabicLayout.astro'), /dir="rtl"/);
  assert.match(read('src/data/site.ts'), /googleTagId:\s*'G-8LLESL207Q'/);
  assert.match(read('src/components/SEOHead.astro'), /SITE\.googleTagId/);
});

test('Astro config redirects report permanently and preserves the services page', () => {
  const source = read('astro.config.ts');
  assert.match(source, /redirects\s*:\s*\{/);
  assert.match(source, /['"]\/report\/['"]\s*:\s*\{/);
  assert.match(source, /status\s*:\s*301/);
  assert.match(source, /destination\s*:\s*['"]\/trust\/['"]/);
  assert.doesNotMatch(source, /['"]\/services\/['"]\s*:/);
  assert.doesNotMatch(source, /\.html['"]\s*:/);
});

test('service worker precaches the clean offline route', () => {
  const source = read('public/sw.js');
  assert.match(source, /const OFFLINE_URL = ['"]\/offline\/['"]/);
  assert.match(source, /const PRECACHE_URLS = \[[\s\S]*OFFLINE_URL/);
});

test('legacy 500 page is preserved in Astro public assets', () => {
  assert.ok(existsSync(absolute('500.html')), 'root legacy 500.html must remain');
  assert.ok(existsSync(absolute('public/500.html')), 'public/500.html must exist');
  assert.equal(read('public/500.html'), read('500.html'));
  assert.match(read('public/500.html'), /G-8LLESL207Q/);
});
