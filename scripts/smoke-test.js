#!/usr/bin/env node

const MAX_REDIRECTS = 10;
const REQUEST_TIMEOUT_MS = 15000;
const CONCURRENCY = 8;

const BASE_URL = normalizeBaseUrl(process.env.BASE_URL);

const IMPORTANT_ROUTES = [
  '/',
  '/about/',
  '/contact/',
  '/consultation/',
  '/services/',
  '/blog/',
  '/ai-agent/',
  '/ai-bots/',
  '/data-analysis/',
  '/smart-automation/'
];

const EXPECTED_301_ROUTES = new Set([
  '/services',
  '/blog',
  '/about',
  '/contact',
  '/consultation'
]);

const results = [];
const canonicalCache = new Map();

main().catch((error) => {
  console.error('');
  console.error('فشل غير متوقع أثناء تشغيل smoke test:');
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  if (!BASE_URL) {
    console.error('BASE_URL مطلوب.');
    console.error('مثال: BASE_URL=https://brightai.site npm run smoke-test');
    process.exit(1);
  }

  printHeader();

  const sitemapUrls = await loadSitemapUrls();
  const sitemapPaths = sitemapUrls
    .filter((url) => sameOrigin(url, BASE_URL))
    .map((url) => new URL(url).pathname);

  const serviceRoutes = sitemapPaths.filter((path) => path === '/services/' || path.startsWith('/services/'));
  const blogRoutes = sitemapPaths.filter((path) => path === '/blog/' || path.startsWith('/blog/'));
  const routeItems = dedupeByUrl([
    ...IMPORTANT_ROUTES.map((path) => routeItem('important', path)),
    ...Array.from(EXPECTED_301_ROUTES).map((path) => routeItem('expected-301', path)),
    ...serviceRoutes.map((path) => routeItem('service', path)),
    ...blogRoutes.map((path) => routeItem('blog', path)),
    ...sitemapUrls.map((url) => routeItem('sitemap', url))
  ]);

  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`روابط sitemap: ${sitemapUrls.length}`);
  console.log(`مسارات الخدمات: ${serviceRoutes.length}`);
  console.log(`مسارات المدونة: ${blogRoutes.length}`);
  console.log(`إجمالي الفحوصات بعد إزالة التكرار: ${routeItems.length}`);
  console.log('');

  await runPool(routeItems, async (item, index) => {
    const result = await testRoute(item);
    results.push(result);
    printProgress(index + 1, routeItems.length, result);
  });

  printReport();

  const criticalFailures = results.filter((result) => result.severity === 'critical');
  process.exit(criticalFailures.length > 0 ? 1 : 0);
}

async function loadSitemapUrls() {
  const sitemapUrl = new URL('/sitemap.xml', BASE_URL).toString();
  const sitemapResponse = await requestWithRedirects(sitemapUrl);

  if (!sitemapResponse.ok || sitemapResponse.finalStatus !== 200) {
    results.push({
      type: 'sitemap',
      url: sitemapUrl,
      finalUrl: sitemapResponse.finalUrl,
      status: 'FAIL',
      severity: 'critical',
      messages: [`تعذر تحميل sitemap.xml. الحالة: ${formatStatus(sitemapResponse)}`],
      redirects: sitemapResponse.redirects
    });
    return [];
  }

  const body = sitemapResponse.body || '';
  const directUrls = extractXmlTagValues(body, 'loc');
  const childSitemaps = directUrls.filter((url) => /sitemap[^/]*\.xml(\?|$)/i.test(new URL(url).pathname));

  if (childSitemaps.length === 0 || body.includes('<urlset')) {
    return directUrls.filter(isHttpUrl);
  }

  const nestedResults = await runPool(childSitemaps, async (url) => {
    const response = await requestWithRedirects(url);
    if (!response.ok || response.finalStatus !== 200) {
      results.push({
        type: 'sitemap',
        url,
        finalUrl: response.finalUrl,
        status: 'FAIL',
        severity: 'critical',
        messages: [`تعذر تحميل sitemap فرعي. الحالة: ${formatStatus(response)}`],
        redirects: response.redirects
      });
      return [];
    }
    return extractXmlTagValues(response.body || '', 'loc').filter(isHttpUrl);
  });

  return nestedResults.flat();
}

async function testRoute(item) {
  const response = await requestWithRedirects(item.url);
  const messages = [];
  let severity = 'ok';

  if (response.loopDetected) {
    messages.push('تم اكتشاف redirect loop.');
    severity = 'critical';
  }

  if (response.tooManyRedirects) {
    messages.push(`تجاوز عدد التحويلات الحد الأقصى (${MAX_REDIRECTS}).`);
    severity = 'critical';
  }

  if (response.error) {
    messages.push(`خطأ اتصال: ${response.error}`);
    severity = 'critical';
  }

  if (response.initialStatus === 301 && EXPECTED_301_ROUTES.has(new URL(item.url).pathname)) {
    messages.push('301 متوقع لمسار بدون slash.');
  } else if (response.initialStatus === 301) {
    messages.push('301 غير مصنف ضمن التحويلات المتوقعة.');
    if (severity === 'ok') severity = 'warning';
  } else if (response.initialStatus && response.initialStatus !== 200 && response.initialStatus !== 301) {
    messages.push(`حالة HTTP أولية غير متوقعة: ${response.initialStatus}.`);
    severity = 'critical';
  }

  if (response.finalStatus !== 200) {
    messages.push(`الحالة النهائية ليست 200: ${response.finalStatus || 'غير متاحة'}.`);
    severity = 'critical';
  }

  if (response.finalStatus === 404) {
    messages.push('تم اكتشاف صفحة 404.');
    severity = 'critical';
  }

  if (response.finalStatus === 200 && isHtmlResponse(response)) {
    const htmlChecks = await inspectHtml(response.finalUrl, response.body || '');
    messages.push(...htmlChecks.messages);
    if (htmlChecks.critical) severity = 'critical';
    if (severity === 'ok' && htmlChecks.warning) severity = 'warning';
  }

  return {
    type: item.type,
    url: item.url,
    finalUrl: response.finalUrl,
    status: severity === 'critical' ? 'FAIL' : severity === 'warning' ? 'WARN' : 'PASS',
    severity,
    messages,
    redirects: response.redirects,
    initialStatus: response.initialStatus,
    finalStatus: response.finalStatus,
    durationMs: response.durationMs
  };
}

async function inspectHtml(pageUrl, html) {
  const messages = [];
  let critical = false;
  let warning = false;
  const title = extractTitle(html);
  const description = extractMetaContent(html, 'description');
  const canonical = extractCanonical(html);

  if (!title) {
    messages.push('Meta title مفقود أو فارغ.');
    critical = true;
  }

  if (!description) {
    messages.push('Meta description مفقود أو فارغ.');
    critical = true;
  }

  if (!canonical) {
    messages.push('Canonical URL مفقود.');
    warning = true;
  } else {
    const canonicalUrl = absolutizeUrl(canonical, pageUrl);
    if (!canonicalUrl) {
      messages.push(`Canonical URL غير صالح: ${canonical}`);
      critical = true;
    } else {
      const canonicalResult = await checkCanonical(canonicalUrl);
      if (!canonicalResult.ok) {
        messages.push(`Canonical URL مكسور: ${canonicalUrl} (${canonicalResult.reason}).`);
        critical = true;
      }
    }
  }

  return { messages, critical, warning };
}

async function checkCanonical(url) {
  if (canonicalCache.has(url)) return canonicalCache.get(url);

  const response = await requestWithRedirects(url, { method: 'HEAD' });
  let result;

  if (response.loopDetected) {
    result = { ok: false, reason: 'redirect loop' };
  } else if (response.tooManyRedirects) {
    result = { ok: false, reason: `أكثر من ${MAX_REDIRECTS} redirects` };
  } else if (response.error) {
    result = { ok: false, reason: response.error };
  } else if (response.finalStatus !== 200) {
    result = { ok: false, reason: `HTTP ${response.finalStatus}` };
  } else {
    result = { ok: true };
  }

  canonicalCache.set(url, result);
  return result;
}

async function requestWithRedirects(startUrl, options = {}) {
  const startedAt = Date.now();
  const redirects = [];
  const visited = new Set();
  let currentUrl = startUrl;
  let initialStatus = null;

  for (let depth = 0; depth <= MAX_REDIRECTS; depth += 1) {
    const normalizedCurrentUrl = normalizeComparableUrl(currentUrl);
    if (visited.has(normalizedCurrentUrl)) {
      return responseSummary({
        startUrl,
        finalUrl: currentUrl,
        initialStatus,
        redirects,
        loopDetected: true,
        durationMs: Date.now() - startedAt
      });
    }
    visited.add(normalizedCurrentUrl);

    const response = await fetchOnce(currentUrl, options);
    if (response.error) {
      return responseSummary({
        startUrl,
        finalUrl: currentUrl,
        initialStatus,
        redirects,
        error: response.error,
        durationMs: Date.now() - startedAt
      });
    }

    if (initialStatus === null) initialStatus = response.status;

    if (isRedirectStatus(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        return responseSummary({
          startUrl,
          finalUrl: currentUrl,
          initialStatus,
          finalStatus: response.status,
          redirects,
          body: response.body,
          headers: response.headers,
          durationMs: Date.now() - startedAt
        });
      }

      const nextUrl = new URL(location, currentUrl).toString();
      redirects.push({ from: currentUrl, to: nextUrl, status: response.status });
      currentUrl = nextUrl;
      continue;
    }

    return responseSummary({
      startUrl,
      finalUrl: currentUrl,
      initialStatus,
      finalStatus: response.status,
      redirects,
      body: response.body,
      headers: response.headers,
      durationMs: Date.now() - startedAt
    });
  }

  return responseSummary({
    startUrl,
    finalUrl: currentUrl,
    initialStatus,
    redirects,
    tooManyRedirects: true,
    durationMs: Date.now() - startedAt
  });
}

async function fetchOnce(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const method = options.method || 'GET';

  try {
    let response = await fetch(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'user-agent': 'BrightAI-SmokeTest/1.0',
        accept: method === 'HEAD' ? '*/*' : 'text/html,application/xml,text/xml,*/*;q=0.8'
      }
    });

    if (method === 'HEAD' && response.status === 405) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': 'BrightAI-SmokeTest/1.0',
          accept: 'text/html,application/xml,text/xml,*/*;q=0.8'
        }
      });
    }

    const body = method === 'HEAD' && response.status !== 405 ? '' : await response.text().catch(() => '');
    return { status: response.status, headers: response.headers, body };
  } catch (error) {
    return { error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function responseSummary(input) {
  return {
    startUrl: input.startUrl,
    finalUrl: input.finalUrl || input.startUrl,
    initialStatus: input.initialStatus,
    finalStatus: input.finalStatus || null,
    redirects: input.redirects || [],
    body: input.body || '',
    headers: input.headers || new Headers(),
    loopDetected: Boolean(input.loopDetected),
    tooManyRedirects: Boolean(input.tooManyRedirects),
    error: input.error || null,
    durationMs: input.durationMs || 0,
    ok: !input.loopDetected && !input.tooManyRedirects && !input.error
  };
}

async function runPool(items, worker) {
  const output = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, runNext));
  return output;
}

function routeItem(type, routeOrUrl) {
  return {
    type,
    url: isHttpUrl(routeOrUrl) ? routeOrUrl : new URL(routeOrUrl, BASE_URL).toString()
  };
}

function dedupeByUrl(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeComparableUrl(item.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeBaseUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function normalizeComparableUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}

function sameOrigin(url, baseUrl) {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isRedirectStatus(status) {
  return [301, 302, 303, 307, 308].includes(status);
}

function isHtmlResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html') || /^\s*<!doctype html/i.test(response.body || '') || /^\s*<html[\s>]/i.test(response.body || '');
}

function extractXmlTagValues(xml, tagName) {
  const values = [];
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match;
  while ((match = pattern.exec(xml))) {
    values.push(decodeXml(match[1].trim()));
  }
  return values;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]).trim() : '';
}

function extractMetaContent(html, name) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  const target = name.toLowerCase();

  for (const tag of metaTags) {
    const tagName = getAttribute(tag, 'name');
    if (tagName && tagName.toLowerCase() === target) {
      return decodeHtml(getAttribute(tag, 'content') || '').trim();
    }
  }

  return '';
}

function extractCanonical(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];

  for (const tag of linkTags) {
    const rel = getAttribute(tag, 'rel');
    if (rel && rel.toLowerCase().split(/\s+/).includes('canonical')) {
      return decodeHtml(getAttribute(tag, 'href') || '').trim();
    }
  }

  return '';
}

function getAttribute(tag, attributeName) {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>` + '`' + `]+))`, 'i');
  const match = tag.match(pattern);
  return match ? match[2] || match[3] || match[4] || '' : '';
}

function absolutizeUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function decodeXml(value) {
  return decodeHtml(value);
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function formatStatus(response) {
  if (response.error) return response.error;
  if (response.loopDetected) return 'redirect loop';
  if (response.tooManyRedirects) return `أكثر من ${MAX_REDIRECTS} redirects`;
  return `HTTP ${response.finalStatus || response.initialStatus || 'غير معروف'}`;
}

function printHeader() {
  console.log('');
  console.log('='.repeat(72));
  console.log('BrightAI Public Website Smoke Test');
  console.log('='.repeat(72));
}

function printProgress(done, total, result) {
  const marker = result.status === 'PASS' ? 'PASS' : result.status === 'WARN' ? 'WARN' : 'FAIL';
  const status = result.finalStatus || result.initialStatus || 'ERR';
  console.log(`[${done}/${total}] ${marker} ${status} ${result.url}`);
}

function printReport() {
  const passed = results.filter((result) => result.status === 'PASS').length;
  const warned = results.filter((result) => result.status === 'WARN').length;
  const failed = results.filter((result) => result.status === 'FAIL').length;
  const redirects = results.filter((result) => result.redirects && result.redirects.length > 0);
  const critical = results.filter((result) => result.severity === 'critical');

  console.log('');
  console.log('='.repeat(72));
  console.log('تقرير smoke test');
  console.log('='.repeat(72));
  console.log(`نجح: ${passed}`);
  console.log(`تحذيرات: ${warned}`);
  console.log(`فشل حرج: ${failed}`);
  console.log(`روابط فيها redirects: ${redirects.length}`);
  console.log('');

  printSection('الفشل الحرج', critical);
  printSection('التحذيرات', results.filter((result) => result.status === 'WARN'));
  printRedirectSummary(redirects);

  if (critical.length > 0) {
    console.log('');
    console.log('النتيجة: فشل الفحص. سيتم الخروج بالكود 1.');
  } else {
    console.log('');
    console.log('النتيجة: نجح الفحص بدون فشل حرج.');
  }
}

function printSection(title, items) {
  console.log(`--- ${title} ---`);
  if (items.length === 0) {
    console.log('لا يوجد.');
    console.log('');
    return;
  }

  for (const item of items) {
    console.log(`${item.status} ${item.type} ${item.url}`);
    if (item.finalUrl && item.finalUrl !== item.url) console.log(`  Final: ${item.finalUrl}`);
    console.log(`  Status: ${item.initialStatus || 'ERR'} -> ${item.finalStatus || 'ERR'} (${item.durationMs}ms)`);
    for (const message of item.messages) console.log(`  - ${message}`);
  }
  console.log('');
}

function printRedirectSummary(items) {
  console.log('--- redirects ---');
  if (items.length === 0) {
    console.log('لا يوجد.');
    return;
  }

  for (const item of items.slice(0, 30)) {
    const chain = item.redirects.map((redirect) => `${redirect.status}: ${redirect.from} -> ${redirect.to}`).join(' | ');
    console.log(`${item.url}`);
    console.log(`  ${chain}`);
  }

  if (items.length > 30) {
    console.log(`... تم إخفاء ${items.length - 30} redirect إضافي لتقليل طول التقرير.`);
  }
}
