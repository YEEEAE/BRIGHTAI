import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyBuiltHtmlMetadata } from '../scripts/seo-build.mjs';

const page = (robots = 'index, follow', title = 'A page', description = 'A useful description') =>
  `<html><head><meta content="${robots}" name="robots"><title>${title}</title><meta name="description" content="${description}"></head></html>`;

test('valid indexable and excluded HTML are both checked', () => {
  assert.deepEqual(verifyBuiltHtmlMetadata(page(), 'public'), { indexable: true });
  assert.deepEqual(verifyBuiltHtmlMetadata(page('noindex, follow'), 'demo'), { indexable: false });
});
test('an accidental empty Markdown artifact fails', () => {
  assert.throws(() => verifyBuiltHtmlMetadata('', 'README'), /robots directive/);
});
test('ambiguous indexing directives fail', () => {
  for (const directive of ['follow', 'index, noindex']) {
    assert.throws(() => verifyBuiltHtmlMetadata(page(directive), 'page'), /Explicit index or noindex/);
  }
  assert.throws(() => verifyBuiltHtmlMetadata(page() + '<meta name="robots" content="noindex">', 'page'), /Exactly one robots/);
});
test('missing metadata fails even on noindex pages', () => {
  assert.throws(() => verifyBuiltHtmlMetadata(page('noindex', ''), 'demo'), /Missing title/);
  assert.throws(() => verifyBuiltHtmlMetadata(page('noindex', 'Demo', ''), 'demo'), /Missing description/);
});

test('shared public path policy excludes private, demo and error surfaces', async () => {
  const { isPublicIndexPath } = await import('../src/server/seo/indexability.mjs');
  for (const path of ['/app/', '/auth/login/', '/private/a/', '/demo/', '/demo/risk/', '/404/', '/healthz/', '/api/x/', '/README/']) assert.equal(isPublicIndexPath(path), false, path);
  for (const path of ['/', '/docs/', '/knowledge/ai-risk-assessment/']) assert.equal(isPublicIndexPath(path), true, path);
});
