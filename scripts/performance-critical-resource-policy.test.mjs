import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseLayout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');

test('keeps only the Arabic regular LCP font in the high-priority preload queue', () => {
  assert.match(
    baseLayout,
    /<link rel="preload" href="\/fonts\/IBMPlexSansArabic-Regular\.woff2" as="font" type="font\/woff2" crossorigin fetchpriority="high" \/>/,
  );
  assert.doesNotMatch(baseLayout, /IBMPlexSansArabic-SemiBold\.woff2"[^>]*fetchpriority="high"/);
});

test('does not preload both logo formats on every page', () => {
  assert.doesNotMatch(baseLayout, /<link rel="preload" as="image" href="\/logo-192\.avif"/);
  assert.doesNotMatch(baseLayout, /<link rel="preload" as="image" href="\/logo-192\.webp"/);
});

test('loads non-critical global behavior after the load event through one small loader', async () => {
  const loader = await readFile(new URL('../public/js/noncritical-init.js', import.meta.url), 'utf8');

  assert.match(baseLayout, /<script defer src="\/js\/noncritical-init\.js"><\/script>/);
  for (const script of ['analytics', 'prevent-default-forms', 'scroll-reveal', 'focus-trap']) {
    assert.doesNotMatch(baseLayout, new RegExp(`src="\\/js\\/${script}\\.js"`));
    assert.match(loader, new RegExp(`['"]\\/js\\/${script}\\.js['"]`));
  }
  assert.match(loader, /import\(moduleUrl\)/);
  assert.match(loader, /window\.addEventListener\('load', schedule, \{ once: true \}\)/);
});
