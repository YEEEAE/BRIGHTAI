import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';

const root = process.cwd();

// تخطي الاختبار بنجاح إذا تم حذف ملفات HTML القديمة
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.log('Legacy HTML files not found. Skipping parity tests.');
  process.exit(0);
}

const kernelSlugs = [
  'chat',
  'audit',
  'approvals',
  'stats',
  'connectors',
  'scenarios',
  'policies',
  'evidence',
  'compliance',
  'reports',
  'offline',
];

const pairs = [
  ['index.html', 'dist/index.html'],
  ['kernel/index.html', 'dist/kernel/index.html'],
  ...kernelSlugs.map((slug) => [
    `kernel/${slug}.html`,
    `dist/kernel/${slug}/index.html`,
  ]),
];

function load(relativePath) {
  return cheerio.load(
    fs.readFileSync(path.join(root, relativePath), 'utf8'),
    { decodeEntities: false },
  );
}

function normalize(value) {
  return value
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleBlocks($) {
  $('script, style, noscript, template, header, nav, footer, .brightai-raw-internal-links, [aria-hidden="true"]').remove();
  const blocks = [];

  $('h1, h2, h3, h4, p, li, td, th, figcaption, blockquote').each((_, element) => {
    if ($(element).find('h1, h2, h3, h4, p, li, td, th, figcaption, blockquote').length) return;
    const text = normalize($(element).text());
    if (text.length >= 12) blocks.push(text);
  });

  return [...new Set(blocks)];
}

test('homepage and Kernel Astro routes preserve legacy metadata and visible content', () => {
  for (const [sourcePath, builtPath] of pairs) {
    const source = load(sourcePath);
    const built = load(builtPath);

    assert.equal(
      normalize(built('title').first().text()),
      normalize(source('title').first().text()),
      `${builtPath} title differs from ${sourcePath}`,
    );
    assert.equal(
      built('meta[name="description"]').attr('content'),
      source('meta[name="description"]').attr('content'),
      `${builtPath} description differs from ${sourcePath}`,
    );
    assert.equal(
      built('link[rel="canonical"]').attr('href'),
      source('link[rel="canonical"]').attr('href'),
      `${builtPath} canonical differs from ${sourcePath}`,
    );

    const builtText = normalize(built('body').text());
    const missing = visibleBlocks(source).filter((block) => !builtText.includes(block));
    assert.deepEqual(missing, [], `${builtPath} is missing visible blocks from ${sourcePath}`);
  }
});

test('homepage preserves the legacy structured-data entity types', () => {
  const source = load('index.html');
  const built = load('dist/index.html');

  function schemaTypes($) {
    const types = new Set();
    $('script[type="application/ld+json"]').each((_, element) => {
      const value = JSON.parse($(element).text());
      const entities = value['@graph'] ?? (Array.isArray(value) ? value : [value]);
      for (const entity of entities) {
        const type = entity['@type'];
        for (const item of Array.isArray(type) ? type : [type]) {
          if (item) types.add(item);
        }
      }
    });
    return types;
  }

  const sourceTypes = schemaTypes(source);
  const builtTypes = schemaTypes(built);
  for (const type of sourceTypes) {
    assert.ok(builtTypes.has(type), `dist/index.html is missing ${type} schema`);
  }
});
