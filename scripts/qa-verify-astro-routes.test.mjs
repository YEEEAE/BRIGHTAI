import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  auditCss,
  auditInternalTargets,
  auditPage,
  discoverDistRoutes,
  parseSitemap,
  renderReport,
  routeToDistFile,
} from './verify-astro-routes.mjs';

const goodHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <title>صفحة اختبار BrightAI</title>
  <meta name="description" content="وصف واضح لصفحة الاختبار داخل موقع BrightAI." />
  <meta name="robots" content="index, follow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="canonical" href="https://brightai.site/about/" />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","url":"https://brightai.site/about/"}</script>
  <script src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
</head>
<body>
  <main><h1>عن BrightAI</h1><p>هذا محتوى حقيقي ظاهر في HTML بدون JavaScript.</p></main>
  <a href="/contact/">احجز عرضًا</a>
  <a href="/services/">الخدمات</a>
</body>
</html>`;

test('parseSitemap returns unique clean current-site routes', () => {
  const xml = `<?xml version="1.0"?>
  <urlset>
    <url><loc>https://brightai.site/</loc></url>
    <url><loc>https://brightai.site/about/</loc></url>
    <url><loc>https://brightai.site/about/</loc></url>
  </urlset>`;

  assert.deepEqual(parseSitemap(xml), ['/', '/about/']);
});

test('routeToDistFile maps trailing-slash routes to Astro directory output', () => {
  assert.equal(routeToDistFile('/', '/tmp/dist'), '/tmp/dist/index.html');
  assert.equal(routeToDistFile('/about/', '/tmp/dist'), '/tmp/dist/about/index.html');
});

test('discoverDistRoutes includes directory output and excludes non-route assets', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'brightai-dist-'));
  mkdirSync(path.join(root, 'about'), { recursive: true });
  mkdirSync(path.join(root, '_astro'), { recursive: true });
  writeFileSync(path.join(root, 'index.html'), goodHtml);
  writeFileSync(path.join(root, 'about', 'index.html'), goodHtml);
  writeFileSync(path.join(root, '404.html'), goodHtml);
  writeFileSync(path.join(root, '_astro', 'chunk.html'), goodHtml);

  assert.deepEqual(discoverDistRoutes(root), ['/', '/404.html', '/about/']);
});

test('auditPage accepts a complete rendered public page', () => {
  const result = auditPage({
    route: '/about/',
    html: goodHtml,
    legalPairs: new Map(),
  });

  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.issues, []);
  assert.equal(result.seo, 'PASS');
  assert.equal(result.schema, 'PASS');
  assert.equal(result.content, 'PASS');
});

test('auditPage enforces locale direction, booking CTA, and WhatsApp contracts', () => {
  const broken = goodHtml
    .replace('<html lang="ar" dir="rtl">', '<html lang="en" dir="rtl">')
    .replace('<a href="/contact/">احجز عرضًا</a>', '<a href="/pricing/">Book a demo</a>')
    .replace(
      '<a href="/services/">الخدمات</a>',
      '<a href="https://api.whatsapp.com/send?phone=966538229013">WhatsApp</a>',
    );
  const result = auditPage({
    route: '/en/privacy-policy/',
    html: broken
      .replaceAll('/about/', '/en/privacy-policy/')
      .replace(
        '</head>',
        '<link rel="alternate" hreflang="ar-SA" href="https://brightai.site/privacy-policy/" />'
        + '<link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/privacy-policy/" />'
        + '<link rel="alternate" hreflang="x-default" href="https://brightai.site/privacy-policy/" />'
        + '</head>',
      ),
  });

  assert.ok(result.issues.includes('DIRECTION_MISMATCH'));
  assert.ok(result.issues.includes('BOOKING_CTA_NOT_CONTACT'));
  assert.ok(result.issues.includes('WHATSAPP_URL_MISMATCH'));
});

test('auditPage does not treat Runbook links as booking CTAs', () => {
  const html = goodHtml.replace(
    '<a href="/services/">الخدمات</a>',
    '<a href="/docs/kernel-operations-runbook/">Kernel Operations Runbook</a>',
  );
  const result = auditPage({
    route: '/about/',
    html,
    legalPairs: new Map(),
  });

  assert.equal(result.status, 'PASS');
  assert.ok(!result.issues.includes('BOOKING_CTA_NOT_CONTACT'));
});

test('auditPage accepts an array of valid JSON-LD objects', () => {
  const arraySchema = JSON.stringify([
    { '@context': 'https://schema.org', '@type': 'Organization' },
    { '@context': 'https://schema.org', '@type': 'WebPage' },
  ]);
  const html = goodHtml.replace(
    '{"@context":"https://schema.org","@type":"WebPage","url":"https://brightai.site/about/"}',
    arraySchema,
  );

  const result = auditPage({
    route: '/about/',
    html,
    legalPairs: new Map(),
  });

  assert.equal(result.schema, 'PASS');
});

test('pricing has an Astro route source', () => {
  assert.ok(existsSync(path.join(process.cwd(), 'src/pages/pricing/index.astro')));
});

test('auditPage reports SEO, schema, links, and raw-content failures', () => {
  const html = `<!doctype html><html><head>
    <title></title>
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="http://www.brightai.site/about" />
  </head><body>
    <h1>One</h1><h1>Two</h1>
    <div id="app"></div>
    <a href="/legacy.html">Legacy</a>
    <a href="/contact">Contact</a>
  </body></html>`;
  const result = auditPage({
    route: '/about/',
    html,
    legalPairs: new Map(),
  });

  assert.equal(result.status, 'FAIL');
  assert.ok(result.issues.includes('H1_COUNT_2'));
  assert.ok(result.issues.includes('MISSING_TITLE'));
  assert.ok(result.issues.includes('MISSING_DESCRIPTION'));
  assert.ok(result.issues.includes('CANONICAL_MISMATCH'));
  assert.ok(result.issues.includes('NOINDEX'));
  assert.ok(result.issues.includes('MISSING_JSON_LD'));
  assert.ok(result.issues.includes('MISSING_GA'));
  assert.ok(result.issues.includes('HTML_INTERNAL_LINK'));
  assert.ok(result.issues.includes('NON_TRAILING_SLASH_LINK'));
  assert.ok(result.issues.includes('CONTENT_REQUIRES_JS'));
  assert.equal(result.seo, 'FAIL');
});

test('auditPage leaves API and WebSocket routes outside URL-style enforcement', () => {
  const html = goodHtml.replace(
    '</body>',
    '<a href="/api/health">API</a><a href="/ws/session">WebSocket</a></body>',
  );
  const result = auditPage({
    route: '/about/',
    html,
    legalPairs: new Map(),
  });

  assert.equal(result.status, 'PASS');
  assert.ok(!result.issues.includes('NON_TRAILING_SLASH_LINK'));
});

test('auditInternalTargets reports missing Astro routes and accepts special files', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'brightai-links-'));
  writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *');
  const html = `
    <a href="/about/">About</a>
    <a href="/missing/">Missing</a>
    <a href="/robots.txt">Robots</a>
    <a href="/api/health">API</a>
    <a href="https://example.com/">External</a>
  `;

  assert.deepEqual(auditInternalTargets({
    html,
    distDir: root,
    distRoutes: ['/', '/about/'],
  }), ['BROKEN_INTERNAL_LINK:/missing/']);
});

test('auditPage requires hreflang only for confirmed legal pairs', () => {
  const pairs = new Map([
    ['/privacy-policy/', '/en/privacy-policy/'],
    ['/en/privacy-policy/', '/privacy-policy/'],
  ]);
  const result = auditPage({
    route: '/privacy-policy/',
    html: goodHtml.replaceAll('/about/', '/privacy-policy/'),
    legalPairs: pairs,
  });

  assert.ok(result.issues.includes('MISSING_LEGAL_HREFLANG'));
});

test('auditCss rejects fixed-width overflow risks without responsive constraints', () => {
  const bad = auditCss('.card { width: 720px; }');
  const good = auditCss('.card { width: 720px; max-width: 100%; } img { max-width: 100%; }');

  assert.equal(bad.status, 'FAIL');
  assert.ok(bad.issues.some((issue) => issue.includes('720px')));
  assert.equal(good.status, 'PASS');
});

test('renderReport writes every audited and extra route as a table row', () => {
  const report = renderReport({
    sitemapPath: 'public/sitemap.xml',
    generatedAt: '2026-06-13T00:00:00.000Z',
    cssAudit: { status: 'PASS', issues: [] },
    rows: [
      {
        route: '/',
        status: 'FOUND',
        seo: 'PASS',
        mobile: 'PASS',
        schema: 'PASS',
        issues: [],
      },
      {
        route: '/extra/',
        status: 'EXTRA',
        seo: 'PASS',
        mobile: 'PASS',
        schema: 'PASS',
        issues: ['NOT_IN_SITEMAP'],
      },
    ],
  });

  assert.match(report, /\| Page \| Status \| SEO \| Mobile \| Schema \| Fix \|/);
  assert.match(report, /\| `\/` \| FOUND \| PASS \| PASS \| PASS \| None \|/);
  assert.match(report, /\| `\/extra\/` \| EXTRA \| PASS \| PASS \| PASS \| NOT_IN_SITEMAP \|/);
  assert.match(report, /Sitemap audit failures: 0/);
  assert.match(report, /Extra route findings: 1/);
});
