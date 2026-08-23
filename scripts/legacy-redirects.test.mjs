/**
 * scripts/legacy-redirects.test.mjs — BAI-IDX-REDIR-001 regression test
 *
 * Live incident (2026-08-24): every legacy redirect 404'd in production
 * because the runtime map in src/lib/legacy-redirects.mjs resolved
 * redirects.json to dist/redirects.json (missing) and silently loaded an
 * empty Map. This test pins:
 *   1. loadLegacyRedirects() against the real redirects.json returns a
 *      non-empty map with the exact lookup entries (source + variants).
 *   2. The cwd fallback in resolveRedirectsJsonPath() — the module is
 *      imported while cwd = repo root, exactly like Render's
 *      `node ./dist/server/entry.mjs` startCommand.
 *   3. patch-server-entry.mjs ships dist/redirects.json when dist/ exists.
 *
 * Run: node --test scripts/legacy-redirects.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

const { loadLegacyRedirects, expandVariants, findLegacyRedirect } = await import(
  path.join(root, 'src', 'lib', 'legacy-redirects.mjs')
);

test('runtime legacy-redirect map loads a non-empty Map from the real redirects.json (cwd fallback)', async () => {
  const map = await loadLegacyRedirects();
  assert.ok(map.size > 200, `expected 200+ redirect variants, got ${map.size}`);
});

test('exact .html legacy entries resolve (the variant class that only the middleware covers)', async () => {
  const map = await loadLegacyRedirects();
  const hit = findLegacyRedirect('/services/finance.html', map);
  assert.ok(hit, '/services/finance.html must be in the runtime map');
  assert.equal(hit.to, '/solutions/banking-ai-governance/');
  assert.equal(hit.status, 301);
});

test('trailing-slash legacy entries resolve including the intentional /404/ suppressions', async () => {
  const map = await loadLegacyRedirects();
  const suppressed = findLegacyRedirect('/blog/ai/', map);
  assert.ok(suppressed, '/blog/ai/ must be in the runtime map');
  assert.equal(suppressed.to, '/404/');

  const legacy = findLegacyRedirect('/blog/cloude-opus-4.6/', map);
  assert.ok(legacy, '/blog/cloude-opus-4.6/ must be in the runtime map');
  assert.equal(legacy.to, '/blog/ai-governance/');
});

test('expandVariants registers the shapes the @astrojs/node handler can forward', () => {
  const variants = expandVariants('/blog/cloude-opus-4.6.html');
  assert.ok(variants.includes('/blog/cloude-opus-4.6.html'), 'original .html form');
  assert.ok(variants.includes('/blog/cloude-opus-4.6'), 'extension-stripped form');
});

test('dist/redirects.json is shipped when dist/ exists (patch-server-entry copy)', () => {
  const distServer = path.join(root, 'dist', 'server', 'entry.mjs');
  if (!existsSync(distServer)) {
    // dist/ not built in this environment — nothing to assert yet.
    return;
  }
  const shipped = path.join(root, 'dist', 'redirects.json');
  assert.ok(
    existsSync(shipped),
    'dist/ exists but dist/redirects.json is missing — run scripts/patch-server-entry.mjs (build:patch-entry)'
  );
});
