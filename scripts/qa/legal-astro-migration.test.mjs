import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const siteUrl = 'https://brightai.site';

const pages = [
  { route: '/privacy-policy/', source: 'src/pages/privacy-policy/index.astro', legacy: 'privacy-policy/index.html', layout: 'ArabicLayout', locale: 'ar-SA' },
  { route: '/cookie-policy/', source: 'src/pages/cookie-policy/index.astro', legacy: 'cookie-policy/index.html', layout: 'ArabicLayout', locale: 'ar-SA' },
  { route: '/terms/', source: 'src/pages/terms/index.astro', legacy: 'terms/index.html', layout: 'ArabicLayout', locale: 'ar-SA' },
  { route: '/pdpl-statement/', source: 'src/pages/pdpl-statement/index.astro', legacy: 'pdpl-statement/index.html', layout: 'ArabicLayout', locale: 'ar-SA' },
  { route: '/data-processing-agreement/', source: 'src/pages/data-processing-agreement/index.astro', legacy: 'data-processing-agreement/index.html', layout: 'ArabicLayout', locale: 'ar-SA' },
  { route: '/privacy-cookies/', source: 'src/pages/privacy-cookies/index.astro', legacy: 'privacy-cookies/index.html', layout: 'ArabicLayout', locale: 'ar-SA', unpaired: true },
  { route: '/en/privacy-policy/', source: 'src/pages/en/privacy-policy/index.astro', legacy: 'en/privacy-policy/index.html', layout: 'EnglishLayout', locale: 'en-SA' },
  { route: '/en/cookie-policy/', source: 'src/pages/en/cookie-policy/index.astro', legacy: 'en/cookie-policy/index.html', layout: 'EnglishLayout', locale: 'en-SA' },
  { route: '/en/terms/', source: 'src/pages/en/terms/index.astro', legacy: 'en/terms/index.html', layout: 'EnglishLayout', locale: 'en-SA' },
  { route: '/en/pdpl-statement/', source: 'src/pages/en/pdpl-statement/index.astro', legacy: 'en/pdpl-statement/index.html', layout: 'EnglishLayout', locale: 'en-SA' },
  { route: '/en/data-processing-agreement/', source: 'src/pages/en/data-processing-agreement/index.astro', legacy: 'en/data-processing-agreement/index.html', layout: 'EnglishLayout', locale: 'en-SA' },
];

const pairs = [
  ['/privacy-policy/', '/en/privacy-policy/'],
  ['/cookie-policy/', '/en/cookie-policy/'],
  ['/terms/', '/en/terms/'],
  ['/pdpl-statement/', '/en/pdpl-statement/'],
  ['/data-processing-agreement/', '/en/data-processing-agreement/'],
];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function legacyLegalHtml(page) {
  const source = read(page.legacy);
  if (page.route === '/privacy-cookies/') {
    const start = source.indexOf('<header class="hero-section');
    const end = source.indexOf('<footer', start);
    assert.ok(start >= 0 && end > start, 'privacy-cookies legacy markers must exist');
    return source.slice(start, end);
  }
  const main = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  assert.ok(main, `${page.legacy} must contain a main element`);
  return main[1];
}

test('the pair map contains only the five confirmed legal pairs', () => {
  const pairFile = 'src/data/i18n-pairs.ts';
  assert.ok(existsSync(path.join(root, pairFile)), `${pairFile} must exist`);
  const source = read(pairFile);

  for (const [arabic, english] of pairs) {
    assert.match(source, new RegExp(arabic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(source, new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(source, /privacy-cookies.*en\/privacy-cookies|en\/privacy-cookies.*privacy-cookies/s);
  assert.equal((source.match(/\{\s*arabic:\s*'\//g) || []).length, 5);
  assert.equal((source.match(/,\s*english:\s*'\//g) || []).length, 5);
});

for (const page of pages) {
  test(`${page.route} has the required Astro legal contract`, () => {
    assert.ok(existsSync(path.join(root, page.source)), `${page.source} must exist`);
    assert.ok(existsSync(path.join(root, page.legacy)), `${page.legacy} must remain`);

    const source = read(page.source);
    assert.match(source, new RegExp(`import ${page.layout}`));
    assert.match(source, new RegExp(`const route = ['"]${page.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`));
    assert.match(source, new RegExp(`const canonical = .${siteUrl.replaceAll('.', '\\.')}\\\\?\\$\\{route\\}`));
    assert.match(source, /canonical=\{canonical\}/);
    assert.match(source, /getLegalAlternates|hreflang=/);
    assert.match(source, /LegalDocument/);
    assert.match(source, /WebPage/);
    assert.match(source, /legalContent/);

    if (page.unpaired) {
      assert.doesNotMatch(source, /languageCounterpart=/);
    } else {
      assert.match(source, /languageCounterpart=/);
    }
  });
}

test('layout plumbing makes the language switch explicit and optional', () => {
  for (const file of [
    'src/layouts/ArabicLayout.astro',
    'src/layouts/EnglishLayout.astro',
    'src/layouts/BaseLayout.astro',
    'src/components/Footer.astro',
  ]) {
    assert.match(read(file), /languageCounterpart/, `${file} must use languageCounterpart`);
  }

  const footer = read('src/components/Footer.astro');
  assert.doesNotMatch(footer, /prepend \/en\/|replace\(\/\^\\\/en/);
});

for (const page of pages) {
  test(`${page.route} renders the complete legal SEO and content contract`, () => {
    const distFile = path.join('dist', page.route.replace(/^\//, ''), 'index.html');
    assert.ok(existsSync(path.join(root, distFile)), `${distFile} must exist after npm run build`);

    const rendered = read(distFile);
    const $ = load(rendered);
    const canonical = `${siteUrl}${page.route}`;
    const counterpart = pairs.find(([ar, en]) => ar === page.route || en === page.route);
    const expectedAlternates = page.unpaired
      ? { 'ar-SA': canonical, 'x-default': canonical }
      : {
          'ar-SA': `${siteUrl}${counterpart[0]}`,
          'en-SA': `${siteUrl}${counterpart[1]}`,
          'x-default': `${siteUrl}${counterpart[0]}`,
        };

    assert.equal($('h1').length, 1);
    assert.equal($('link[rel="canonical"]').attr('href'), canonical);
    assert.equal($('html').attr('lang'), page.locale === 'ar-SA' ? 'ar' : 'en');
    assert.equal($('html').attr('dir'), page.locale === 'ar-SA' ? 'rtl' : 'ltr');
    assert.equal($('meta[property="og:locale"]').attr('content'), page.locale === 'ar-SA' ? 'ar_SA' : 'en_SA');
    assert.match(rendered, /G-8LLESL207Q/);

    const alternateEntries = [];
    $('link[rel="alternate"][hreflang]').each((_, element) => {
      alternateEntries.push([$(element).attr('hreflang'), $(element).attr('href')]);
    });
    const actualAlternates = Object.fromEntries(alternateEntries);
    assert.deepEqual(actualAlternates, expectedAlternates);

    const schemas = $('script[type="application/ld+json"]').map((_, element) => {
      return JSON.parse($(element).text());
    }).get();
    const types = schemas.flatMap((schema) => {
      if (Array.isArray(schema['@graph'])) return schema['@graph'].map((entry) => entry['@type']);
      return [schema['@type']];
    });
    assert.ok(types.includes('WebPage'));
    assert.ok(types.includes('LegalDocument'));

    const legacyText = normalizeText(load(legacyLegalHtml(page)).root().text());
    const renderedText = normalizeText($('.legal-page').text());
    assert.equal(renderedText, legacyText, `${page.route} legal text must match legacy verbatim`);

    const switchHref = $('.footer__lang-switch').attr('href');
    assert.equal(switchHref, page.unpaired ? undefined : counterpart.find((route) => route !== page.route));
  });
}
