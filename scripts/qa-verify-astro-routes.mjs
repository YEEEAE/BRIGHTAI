#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const SITE_URL = 'https://brightai.site';
const GA_ID = 'G-8LLESL207Q';
const CONTENT_MIN_LENGTH = 40;
const LEGAL_PAIRS = new Map([
  ['/privacy-policy/', '/en/privacy-policy/'],
  ['/en/privacy-policy/', '/privacy-policy/'],
  ['/cookie-policy/', '/en/cookie-policy/'],
  ['/en/cookie-policy/', '/cookie-policy/'],
  ['/terms/', '/en/terms/'],
  ['/en/terms/', '/terms/'],
  ['/pdpl-statement/', '/en/pdpl-statement/'],
  ['/en/pdpl-statement/', '/pdpl-statement/'],
  ['/data-processing-agreement/', '/en/data-processing-agreement/'],
  ['/en/data-processing-agreement/', '/data-processing-agreement/'],
]);

function normalizeRoute(value) {
  const url = new URL(value, SITE_URL);
  let route = url.pathname.replace(/\/{2,}/g, '/');
  if (route !== '/' && !path.posix.extname(route) && !route.endsWith('/')) {
    route += '/';
  }
  return route;
}

export function parseSitemap(xml) {
  const $ = load(xml, { xmlMode: true });
  const routes = [];
  const seen = new Set();

  $('loc').each((_, element) => {
    const value = $(element).text().trim();
    if (!value) return;
    const url = new URL(value, SITE_URL);
    if (url.origin !== SITE_URL) return;
    const route = normalizeRoute(url.pathname);
    if (!seen.has(route)) {
      seen.add(route);
      routes.push(route);
    }
  });

  return routes;
}

export function routeToDistFile(route, distDir) {
  if (route === '/') return path.join(distDir, 'index.html');
  const relative = route.replace(/^\/|\/$/g, '');
  return path.join(distDir, relative, 'index.html');
}

function walkHtmlFiles(directory, root = directory, output = []) {
  if (!existsSync(directory)) return output;

  for (const entry of readdirSync(directory)) {
    if (entry === '_astro') continue;
    const absolute = path.join(directory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      walkHtmlFiles(absolute, root, output);
    } else if (entry.endsWith('.html')) {
      output.push(path.relative(root, absolute));
    }
  }

  return output;
}

export function discoverDistRoutes(distDir) {
  return walkHtmlFiles(distDir)
    .map((relative) => {
      const posix = relative.split(path.sep).join('/');
      if (posix === 'index.html') return '/';
      if (posix.endsWith('/index.html')) {
        return `/${posix.slice(0, -'index.html'.length)}`;
      }
      return `/${posix}`;
    })
    .sort();
}

function isInternalNavigationHref(href) {
  if (!href || href.startsWith('#')) return false;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:)/i.test(href)) return false;

  const url = new URL(href, SITE_URL);
  return url.origin === SITE_URL;
}

function isApiRoute(pathname) {
  return pathname.startsWith('/api/') || pathname.startsWith('/ws/');
}

export function auditInternalTargets({ html, distDir, distRoutes }) {
  const $ = load(html);
  const routeSet = new Set(distRoutes);
  const issues = [];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!isInternalNavigationHref(href)) return;

    const url = new URL(href, SITE_URL);
    if (isApiRoute(url.pathname)) return;

    if (path.posix.extname(url.pathname)) {
      const target = path.join(distDir, url.pathname.replace(/^\/+/, ''));
      if (!existsSync(target)) issues.push(`BROKEN_INTERNAL_LINK:${url.pathname}`);
      return;
    }

    const route = normalizeRoute(url.pathname);
    if (!routeSet.has(route)) issues.push(`BROKEN_INTERNAL_LINK:${route}`);
  });

  return [...new Set(issues)];
}

function auditSchemas($) {
  const schemas = [];
  const issues = [];

  $('script[type="application/ld+json"]').each((index, element) => {
    try {
      const schema = JSON.parse($(element).text());
      schemas.push(schema);
    } catch {
      issues.push(`INVALID_JSON_LD_${index + 1}`);
    }
  });

  if (schemas.length === 0) {
    issues.push('MISSING_JSON_LD');
    return issues;
  }

  const documents = schemas.flatMap((schema) => (Array.isArray(schema) ? schema : [schema]));
  const nodes = documents.flatMap((schema) => (
    Array.isArray(schema?.['@graph']) ? schema['@graph'] : [schema]
  ));
  if (!nodes.some((node) => node?.['@type'])) issues.push('JSON_LD_MISSING_TYPE');
  if (!documents.some((schema) => schema?.['@context'] === 'https://schema.org')) {
    issues.push('JSON_LD_MISSING_CONTEXT');
  }

  return issues;
}

function auditLegalHreflang($, route, legalPairs) {
  if (!legalPairs.has(route)) return [];

  const counterpart = legalPairs.get(route);
  const arabicRoute = route.startsWith('/en/') ? counterpart : route;
  const englishRoute = route.startsWith('/en/') ? route : counterpart;
  const actual = new Map();

  $('link[rel="alternate"][hreflang]').each((_, element) => {
    actual.set($(element).attr('hreflang'), $(element).attr('href'));
  });

  const expected = new Map([
    ['ar-SA', `${SITE_URL}${arabicRoute}`],
    ['en-SA', `${SITE_URL}${englishRoute}`],
    ['x-default', `${SITE_URL}${arabicRoute}`],
  ]);

  for (const [language, href] of expected) {
    if (actual.get(language) !== href) return ['MISSING_LEGAL_HREFLANG'];
  }
  return [];
}

export function auditPage({ route, html, legalPairs = LEGAL_PAIRS }) {
  const $ = load(html);
  const issues = [];
  const expectedCanonical = `${SITE_URL}${route}`;
  const expectsEnglish = route.startsWith('/en/');
  const expectedLang = expectsEnglish ? 'en' : 'ar';
  const expectedDirection = expectsEnglish ? 'ltr' : 'rtl';
  const h1Count = $('h1').length;

  if (h1Count !== 1) issues.push(`H1_COUNT_${h1Count}`);
  if (
    $('html').attr('lang')?.split('-')[0] !== expectedLang
    || $('html').attr('dir') !== expectedDirection
  ) {
    issues.push('DIRECTION_MISMATCH');
  }
  if (!$('title').first().text().trim()) issues.push('MISSING_TITLE');
  if (!$('meta[name="description"]').attr('content')?.trim()) issues.push('MISSING_DESCRIPTION');
  if ($('link[rel="canonical"]').attr('href') !== expectedCanonical) issues.push('CANONICAL_MISMATCH');

  const robots = $('meta[name="robots"]').attr('content') || '';
  if (/\bnoindex\b/i.test(robots)) issues.push('NOINDEX');
  if (!html.includes(GA_ID)) issues.push('MISSING_GA');
  if (!$('meta[name="viewport"]').attr('content')?.includes('width=device-width')) {
    issues.push('MISSING_VIEWPORT');
  }

  issues.push(...auditSchemas($));
  issues.push(...auditLegalHreflang($, route, legalPairs));

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const anchorText = $(element).text().replace(/\s+/g, ' ').trim();
    if (/(?:احجز|حجز|\bbook(?:ing)?\b|\bschedule\b).*(?:\bdemo\b|عرض|موعد)?/i.test(anchorText)) {
      const bookingUrl = new URL(href, SITE_URL);
      if (bookingUrl.origin !== SITE_URL || bookingUrl.pathname !== '/contact/') {
        issues.push('BOOKING_CTA_NOT_CONTACT');
      }
    }
    if (/(?:wa\.me|whatsapp\.com)/i.test(href || '')) {
      const whatsappUrl = new URL(href);
      if (
        whatsappUrl.origin !== 'https://wa.me'
        || whatsappUrl.pathname !== '/966538229013'
      ) {
        issues.push('WHATSAPP_URL_MISMATCH');
      }
    }
    if (!isInternalNavigationHref(href)) return;
    const url = new URL(href, SITE_URL);
    if (isApiRoute(url.pathname)) return;
    if (/\.html$/i.test(url.pathname)) issues.push('HTML_INTERNAL_LINK');
    if (
      url.pathname !== '/'
      && !url.pathname.endsWith('/')
      && !path.posix.extname(url.pathname)
    ) {
      issues.push('NON_TRAILING_SLASH_LINK');
    }
  });

  const pageText = $('main').text().replace(/\s+/g, ' ').trim();
  if (pageText.length < CONTENT_MIN_LENGTH) issues.push('CONTENT_REQUIRES_JS');

  const uniqueIssues = [...new Set(issues)];
  const seoIssueNames = new Set([
    'MISSING_TITLE',
    'MISSING_DESCRIPTION',
    'CANONICAL_MISMATCH',
    'NOINDEX',
    'MISSING_GA',
    'MISSING_VIEWPORT',
    'DIRECTION_MISMATCH',
    'MISSING_LEGAL_HREFLANG',
    'BOOKING_CTA_NOT_CONTACT',
    'WHATSAPP_URL_MISMATCH',
    'HTML_INTERNAL_LINK',
    'NON_TRAILING_SLASH_LINK',
    'CONTENT_REQUIRES_JS',
  ]);
  const schemaFailed = uniqueIssues.some((issue) => (
    issue.startsWith('INVALID_JSON_LD')
    || issue.startsWith('JSON_LD_')
    || issue === 'MISSING_JSON_LD'
  ));
  const seoFailed = uniqueIssues.some((issue) => (
    seoIssueNames.has(issue) || issue.startsWith('H1_COUNT_')
  ));

  return {
    status: uniqueIssues.length === 0 ? 'PASS' : 'FAIL',
    seo: seoFailed ? 'FAIL' : 'PASS',
    schema: schemaFailed ? 'FAIL' : 'PASS',
    content: uniqueIssues.includes('CONTENT_REQUIRES_JS') ? 'FAIL' : 'PASS',
    issues: uniqueIssues,
  };
}

export function auditCss(css) {
  const issues = [];
  const blocks = css.match(/[^{}]+\{[^{}]*\}/g) || [];

  for (const block of blocks) {
    const body = block.slice(block.indexOf('{') + 1, -1);
    const maxWidthSafe = /max-width\s*:\s*(?:100%|100vw|calc\()/i.test(body);
    const fluidWidth = /width\s*:\s*(?:min\(|max\(|clamp\(|calc\(|100%|auto)/i.test(body);
    const fixedWidths = [
      ...body.matchAll(/(?:^|;)\s*(?:width|min-width)\s*:\s*(\d+(?:\.\d+)?)px/gi),
    ];

    for (const match of fixedWidths) {
      const pixels = Number(match[1]);
      if (pixels > 390 && !maxWidthSafe && !fluidWidth) {
        issues.push(`FIXED_WIDTH_${match[1]}px_WITHOUT_MAX_WIDTH`);
      }
    }
  }

  return {
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    issues: [...new Set(issues)],
  };
}

function escapeTableCell(value) {
  return String(value).replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

export function renderReport({
  sitemapPath,
  generatedAt,
  cssAudit,
  rows,
}) {
  const found = rows.filter((row) => row.status === 'FOUND').length;
  const missing = rows.filter((row) => row.status === 'MISSING').length;
  const extra = rows.filter((row) => row.status === 'EXTRA').length;
  const sitemapFailures = rows.filter((row) => (
    row.status !== 'EXTRA'
    && (
      row.status === 'MISSING'
      || row.seo === 'FAIL'
      || row.mobile === 'FAIL'
      || row.schema === 'FAIL'
    )
  )).length;
  const lines = [
    '# SEO Migration Check',
    '',
    `> Generated: ${generatedAt}`,
    `> Sitemap source: \`${sitemapPath}\``,
    `> Routes: ${rows.length} | FOUND: ${found} | MISSING: ${missing} | EXTRA: ${extra}`,
    `> Sitemap audit failures: ${sitemapFailures} | Extra route findings: ${extra}`,
    `> Mobile CSS constraint audit: ${cssAudit.status}`,
    '',
    '| Page | Status | SEO | Mobile | Schema | Fix |',
    '|---|---|---|---|---|---|',
  ];

  for (const row of rows) {
    lines.push([
      `| \`${escapeTableCell(row.route)}\``,
      escapeTableCell(row.status),
      escapeTableCell(row.seo),
      escapeTableCell(row.mobile),
      escapeTableCell(row.schema),
      `${escapeTableCell(row.issues.length ? row.issues.join(', ') : 'None')} |`,
    ].join(' | '));
  }

  if (cssAudit.issues.length) {
    lines.push('', '## Mobile CSS Findings', '');
    for (const issue of cssAudit.issues) lines.push(`- \`${issue}\``);
  }

  lines.push(
    '',
    '## Audit Contract',
    '',
    '- `SEO`: exactly one H1, title, description, self-canonical, indexable robots, GA, viewport, legal-pair hreflang, clean internal links, and server-rendered content.',
    '- `Schema`: parseable JSON-LD with `https://schema.org` context and at least one `@type`.',
    '- `Mobile`: static CSS constraint check for fixed widths above 390px without a fluid or max-width constraint.',
    '- `Status`: route presence relative to the current sitemap. `EXTRA` is informational.',
    '',
  );

  return lines.join('\n');
}

function collectCss(distDir, htmlFiles) {
  const chunks = [];
  const assetDir = path.join(distDir, '_astro');
  if (existsSync(assetDir)) {
    for (const entry of readdirSync(assetDir)) {
      if (entry.endsWith('.css')) chunks.push(readFileSync(path.join(assetDir, entry), 'utf8'));
    }
  }
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const $ = load(html);
    $('style').each((_, element) => chunks.push($(element).text()));
  }
  return chunks.join('\n');
}

function findSitemap(root) {
  for (const relative of ['public/sitemap.xml', 'sitemap.xml']) {
    if (existsSync(path.join(root, relative))) return relative;
  }
  throw new Error('No sitemap.xml found in public/ or repository root.');
}

function printRouteResults(rows) {
  for (const row of rows) {
    const suffix = row.issues.length ? ` (${row.issues.join(', ')})` : '';
    console.log(`${row.status.padEnd(7)} ${row.route}${suffix}`);
  }
}

export function runAudit({
  root = process.cwd(),
  runBuild = true,
  writeReport = true,
} = {}) {
  const sitemapPath = findSitemap(root);
  const sitemapRoutes = parseSitemap(readFileSync(path.join(root, sitemapPath), 'utf8'));
  const distDir = path.join(root, 'dist');

  if (runBuild) {
    console.log('Running Astro build...');
    rmSync(distDir, { recursive: true, force: true });
    const build = spawnSync('npm', ['run', 'build'], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'inherit',
    });
    if (build.status !== 0) {
      throw new Error(`Astro build failed with exit code ${build.status ?? 1}.`);
    }
  }

  const distRoutes = discoverDistRoutes(distDir);
  const sitemapSet = new Set(sitemapRoutes);
  const rows = [];
  const renderedFiles = [];

  for (const route of sitemapRoutes) {
    const file = routeToDistFile(route, distDir);
    if (!existsSync(file)) {
      rows.push({
        route,
        status: 'MISSING',
        seo: 'FAIL',
        mobile: 'FAIL',
        schema: 'FAIL',
        issues: ['DIST_INDEX_MISSING'],
      });
      continue;
    }

    renderedFiles.push(file);
    const html = readFileSync(file, 'utf8');
    const audit = auditPage({
      route,
      html,
      legalPairs: LEGAL_PAIRS,
    });
    const targetIssues = auditInternalTargets({
      html,
      distDir,
      distRoutes,
    });
    rows.push({
      route,
      status: 'FOUND',
      seo: audit.seo,
      mobile: 'PENDING',
      schema: audit.schema,
      issues: [...audit.issues, ...targetIssues],
    });
  }

  const cssAudit = auditCss(collectCss(distDir, renderedFiles));
  for (const row of rows) {
    if (row.status === 'MISSING') continue;
    row.mobile = cssAudit.status;
    if (cssAudit.status === 'FAIL') row.issues.push('CSS_OVERFLOW_RISK');
  }

  for (const route of distRoutes.filter((route) => !sitemapSet.has(route))) {
    const file = route.endsWith('.html')
      ? path.join(distDir, route.slice(1))
      : routeToDistFile(route, distDir);
    const html = readFileSync(file, 'utf8');
    const audit = auditPage({
      route,
      html,
      legalPairs: LEGAL_PAIRS,
    });
    const targetIssues = auditInternalTargets({
      html,
      distDir,
      distRoutes,
    });
    rows.push({
      route,
      status: 'EXTRA',
      seo: audit.seo,
      mobile: cssAudit.status,
      schema: audit.schema,
      issues: ['NOT_IN_SITEMAP', ...audit.issues, ...targetIssues],
    });
  }

  const report = renderReport({
    sitemapPath,
    generatedAt: new Date().toISOString(),
    cssAudit,
    rows,
  });
  if (writeReport) writeFileSync(path.join(root, 'SEO-MIGRATION-CHECK.md'), report);

  printRouteResults(rows);
  console.log(`\nSitemap routes: ${sitemapRoutes.length}`);
  console.log(`Generated HTML routes: ${distRoutes.length}`);
  console.log(`Mobile CSS audit: ${cssAudit.status}`);

  const missing = rows.filter((row) => row.status === 'MISSING');
  const failed = rows.filter((row) => (
    row.status !== 'EXTRA'
    && (
      row.seo === 'FAIL'
      || row.mobile === 'FAIL'
      || row.schema === 'FAIL'
      || row.issues.some((issue) => issue.startsWith('BROKEN_INTERNAL_LINK:'))
    )
  ));

  return {
    exitCode: missing.length || failed.length ? 1 : 0,
    sitemapRoutes,
    distRoutes,
    cssAudit,
    rows,
  };
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  try {
    const result = runAudit();
    process.exitCode = result.exitCode;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
