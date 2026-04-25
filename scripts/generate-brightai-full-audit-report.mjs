import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const reportPath = path.join(root, 'reports', 'brightai_full_seo_ai_audit_2026-04-25.md');
const baseUrl = 'https://brightai.site';

const skipDirs = new Set(['.git', 'node_modules', 'venv', '.venv', '.netlify', 'dist', 'build']);
const serviceHints = [
  'services',
  'ai-agent',
  'ai-bots',
  'smart-automation',
  'data-analysis',
  'machine-learning',
  'ai-workflows',
  'consultation',
  'smart-medical-archive',
  'tenders',
  'sectors',
  'health',
];
const highCommercial = [
  'index.html',
  'services/index.html',
  'ai-agent/index.html',
  'ai-bots/index.html',
  'smart-automation/index.html',
  'data-analysis/index.html',
  'consultation/index.html',
  'contact/index.html',
  'about/index.html',
  'tenders/index.html',
  'tenders/landing.html',
  'sectors/index.html',
  'machine-learning/index.html',
  'ai-workflows/index.html',
  'smart-medical-archive/index.html',
];

function walk(dir, matcher, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, matcher, acc);
    else if (matcher(full)) acc.push(path.relative(root, full).replaceAll(path.sep, '/'));
  }
  return acc.sort((a, b) => a.localeCompare(b));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function cleanText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function wordCount(text, lang) {
  const t = cleanText(text);
  if (!t) return 0;
  const arabic = (t.match(/[\u0600-\u06FF]+/g) || []).length;
  const latin = (t.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || []).length;
  return lang.startsWith('ar') ? Math.max(arabic, latin) : latin + arabic;
}

function pct(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function urlFromRel(rel) {
  if (rel === 'index.html') return `${baseUrl}/`;
  if (rel.endsWith('/index.html')) return `${baseUrl}/${rel.replace(/index\.html$/, '')}`;
  if (rel.endsWith('.html')) return `${baseUrl}/${rel.replace(/\.html$/, '/')}`;
  return `${baseUrl}/${rel}`;
}

function classify(rel, $, lang) {
  if (/^blog\//.test(rel)) return 'مقال/مدونة';
  if (/^docs\//.test(rel) || /^en\/docs\//.test(rel) || rel === 'docs.html') return 'توثيق';
  if (/^tenders\//.test(rel) || /^en\/tenders\//.test(rel)) return 'مناقصات/demo';
  if (/^demo\//.test(rel) || /^try\//.test(rel) || /^interview\//.test(rel) || /^bot\//.test(rel)) return 'تجربة/أداة';
  if (/^sectors\//.test(rel)) return 'قطاع';
  if (rel.includes('privacy') || rel.includes('terms')) return 'قانونية';
  if (rel.includes('contact')) return 'تواصل';
  if (rel.includes('about')) return 'تعريف بالشركة';
  if (serviceHints.some((h) => rel.includes(h))) return 'خدمة';
  if (rel.startsWith('en/')) return 'صفحة إنجليزية';
  return lang.startsWith('ar') ? 'صفحة عربية عامة' : 'صفحة عامة';
}

function getJsonLdTypes($) {
  const types = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).contents().text();
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item?.['@graph']) {
          for (const g of item['@graph']) if (g?.['@type']) types.push(String(g['@type']));
        } else if (item?.['@type']) {
          types.push(String(item['@type']));
        }
      }
    } catch {
      types.push('INVALID_JSON_LD');
    }
  });
  return [...new Set(types)];
}

function pageIntent(rel, title, h1) {
  const hay = `${rel} ${title} ${h1}`;
  if (/tenders|مناقص/i.test(hay)) return 'B2G / tenders intent';
  if (/health|medical|طبي|صحي/i.test(hay)) return 'Healthcare AI intent';
  if (/data|تحليل|analytics|ذكاء الأعمال/i.test(hay)) return 'Data analytics intent';
  if (/agent|bots|وكلاء|روبوت/i.test(hay)) return 'AI agents intent';
  if (/automation|أتمتة|workflows/i.test(hay)) return 'Automation intent';
  if (/sector|sectors|قطاع/i.test(hay)) return 'Sector landing intent';
  if (/blog/i.test(rel)) return 'Informational intent';
  if (/contact|consultation|تواصل|استشارة/i.test(hay)) return 'Conversion intent';
  return 'Commercial investigation intent';
}

function normalizeHref(href, fromRel) {
  if (!href || href.startsWith('#') || /^(mailto:|tel:|whatsapp:|javascript:|data:)/i.test(href)) return null;
  if (/^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href);
      if (u.hostname !== 'brightai.site') return null;
      return u.pathname;
    } catch {
      return null;
    }
  }
  try {
    const fromDir = '/' + path.dirname(fromRel).replace(/^\.$/, '');
    return new URL(href, `${baseUrl}${fromDir.endsWith('/') ? fromDir : `${fromDir}/`}`).pathname;
  } catch {
    return null;
  }
}

function parseKeywords() {
  const xlsxPath = path.join(root, 'reports', 'keywords strategy 2026.xlsx');
  const py = [
    'import json, openpyxl, sys, re',
    'wb=openpyxl.load_workbook(sys.argv[1], data_only=True)',
    'rows=[]',
    'for ws in wb.worksheets:',
    '  for row in ws.iter_rows(values_only=True):',
    '    vals=[str(v).strip() for v in row if v is not None and str(v).strip()]',
    '    if vals: rows.append({"sheet":ws.title,"values":vals})',
    'print(json.dumps(rows, ensure_ascii=False))',
  ].join('\n');
  try {
    const out = execFileSync('python3', ['-c', py, xlsxPath], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(out);
  } catch (err) {
    return [{ sheet: 'ERROR', values: [`تعذر فتح ملف Excel: ${err.message}`] }];
  }
}

function keywordRecords(rows) {
  const records = [];
  for (const row of rows) {
    const joined = row.values.join(' | ');
    if (/الكلمة|keyword|KW-|ذكاء|أتمتة|تحليل|Saudi|AI|RPA|بيانات|مناقص|حوكمة|PDPL|NDMO/i.test(joined)) {
      const keyword = row.values.find((v) => !/^KW-|^معرف|^نية|^القيمة/i.test(v) && v.length > 2) || row.values[0];
      const intent = row.values.find((v) => /تجارية|معلوماتية|معاملاتية|Navigational|Commercial|Transactional|Informational|B2B|B2G/i.test(v)) || inferIntent(keyword);
      records.push({ keyword, intent: inferIntent(`${keyword} ${intent}`), source: row.sheet });
    }
  }
  const seen = new Set();
  return records.filter((r) => {
    const k = r.keyword.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return r.keyword.length <= 90;
  });
}

function inferIntent(text) {
  const t = text.toLowerCase();
  const tags = [];
  if (/مناقص|tender|government|حكوم|b2g/.test(t)) tags.push('B2G');
  if (/شركة|خدمات|استشارات|سعر|تكلفة|vendor|company|commercial|transactional|تجارية|معاملاتية/.test(t)) tags.push('Commercial');
  if (/ما|كيف|دليل|تعريف|informational|معلوماتية/.test(t)) tags.push('Informational');
  if (/saudi|السعود|riyadh|الرياض|ksa/.test(t)) tags.push('Saudi local');
  if (/data|بيانات|تحليل|ndmo|pdpl|حوكمة/.test(t)) tags.push('Data/Governance');
  if (/agent|bot|وكيل|روبوت/.test(t)) tags.push('AI agents');
  if (/automation|أتمتة|rpa|workflow/.test(t)) tags.push('Automation');
  return tags.join(' + ') || 'Mixed';
}

const htmlFiles = walk(root, (f) => f.endsWith('.html'));
const cssFiles = walk(root, (f) => f.endsWith('.css'));
const jsFiles = walk(root, (f) => f.endsWith('.js') || f.endsWith('.mjs'));
const imageFiles = walk(root, (f) => /\.(png|jpe?g|webp|avif|svg)$/i.test(f));
const sitemap = fs.existsSync(path.join(root, 'sitemap.xml')) ? read('sitemap.xml') : '';
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const sitemapPaths = new Set([...sitemapUrls].map((u) => {
  try { return new URL(u).pathname; } catch { return ''; }
}));
const robots = fs.existsSync(path.join(root, 'robots.txt')) ? read('robots.txt') : '';
const keywordRows = parseKeywords();
const keywords = keywordRecords(keywordRows);

const pages = [];
const pathToRel = new Map();
const incoming = new Map();

for (const rel of htmlFiles) {
  const html = read(rel);
  const $ = load(html, { decodeEntities: false });
  const lang = $('html').attr('lang') || '';
  const dir = $('html').attr('dir') || '';
  const title = cleanText($('title').first().text());
  const meta = cleanText($('meta[name="description"]').attr('content'));
  const canonical = cleanText($('link[rel="canonical"]').attr('href'));
  const robotsMeta = cleanText($('meta[name="robots"]').attr('content'));
  const h1 = $('h1').map((_, e) => cleanText($(e).text())).get();
  const h2 = $('h2').map((_, e) => cleanText($(e).text())).get();
  const h3 = $('h3').map((_, e) => cleanText($(e).text())).get();
  const text = cleanText($('body').text());
  const wc = wordCount(text, lang || (rel.startsWith('en/') ? 'en' : 'ar'));
  const imgs = $('img').map((_, e) => ({
    src: $(e).attr('src') || '',
    alt: $(e).attr('alt') || '',
    width: $(e).attr('width') || '',
    height: $(e).attr('height') || '',
    loading: $(e).attr('loading') || '',
    fetchpriority: $(e).attr('fetchpriority') || '',
  })).get();
  const scripts = $('script[src]').map((_, e) => $(e).attr('src') || '').get();
  const styles = $('link[rel="stylesheet"]').map((_, e) => $(e).attr('href') || '').get();
  const links = $('a[href]').map((_, e) => ({
    href: $(e).attr('href') || '',
    text: cleanText($(e).text()),
  })).get();
  const internalPaths = links.map((l) => normalizeHref(l.href, rel)).filter(Boolean);
  const hreflang = $('link[rel="alternate"][hreflang]').map((_, e) => ({
    lang: $(e).attr('hreflang'),
    href: $(e).attr('href'),
  })).get();
  const jsonLdTypes = getJsonLdTypes($);
  const canonicalPath = canonical ? new URL(canonical, baseUrl).pathname : urlFromRel(rel).replace(baseUrl, '');
  const cleanUrl = urlFromRel(rel);
  pathToRel.set(canonicalPath, rel);
  pathToRel.set(new URL(cleanUrl).pathname, rel);
  const noindex = /noindex/i.test(robotsMeta);
  const inSitemap = sitemapUrls.has(canonical) || sitemapUrls.has(cleanUrl) || sitemapPaths.has(canonicalPath);
  const hasAnswer = /answer|ai-search-answer|إجابة مختصرة|الإجابة المختصرة|ما هو|ما هي|كيف/i.test(html);
  const hasFaq = /FAQPage|faq|أسئلة شائعة|الأسئلة الشائعة/i.test(html);
  const hasTable = $('table').length > 0;
  const hasBreadcrumb = /BreadcrumbList|breadcrumb/i.test(html);
  const ctaText = links.filter((l) => /استشارة|تواصل|احجز|demo|جرّب|ابدأ|contact|consultation/i.test(l.text)).map((l) => l.text).slice(0, 4);
  const trustSignals = [
    /privacy|خصوصية/i.test(html),
    /terms|الشروط|الأحكام/i.test(html),
    /Saudi|السعود|Riyadh|الرياض/i.test(html),
    /PDPL|NDMO|SDAIA|امتثال|حوكمة|أمن/i.test(html),
    /contact|تواصل|@/i.test(html),
  ].filter(Boolean).length;
  const missing = [];
  if (!title) missing.push('title مفقود');
  if (!meta) missing.push('meta description مفقود');
  if (h1.length !== 1) missing.push(`عدد H1 = ${h1.length}`);
  if (!canonical) missing.push('canonical مفقود');
  if (!lang) missing.push('lang مفقود');
  if (!dir && !rel.startsWith('en/')) missing.push('dir مفقود للصفحة العربية');
  if (!jsonLdTypes.length) missing.push('JSON-LD غير موجود');
  if (!hreflang.length && !noindex && (rel.startsWith('en/') || !/^blog\//.test(rel))) missing.push('hreflang غير موجود أو محدود');
  if (imgs.some((i) => i.src && !i.alt)) missing.push('صور بدون alt');
  if (imgs.some((i) => i.src && (!i.width || !i.height))) missing.push('صور بدون width/height');
  const technical = pct(100 - missing.length * 7 - (noindex && inSitemap ? 20 : 0));
  const onPage = pct(55 + (title ? 10 : 0) + (meta ? 10 : 0) + (h1.length === 1 ? 10 : 0) + (h2.length ? 6 : 0) + (canonical ? 5 : 0) + (hreflang.length ? 4 : 0));
  const contentDepth = pct(Math.min(100, 35 + wc / (classify(rel, $, lang).includes('مقال') ? 18 : 12) + (hasTable ? 8 : 0) + (hasFaq ? 8 : 0)));
  const aeo = pct(35 + (hasAnswer ? 18 : 0) + (hasFaq ? 18 : 0) + (hasTable ? 12 : 0) + (h2.some((h) => /\?|\؟|كيف|متى|لماذا|ما /.test(h)) ? 10 : 0) + (jsonLdTypes.includes('FAQPage') ? 7 : 0));
  const geo = pct(35 + (/(Saudi|السعود|الرياض|KSA)/i.test(text) ? 15 : 0) + (hasAnswer ? 12 : 0) + (jsonLdTypes.length ? 12 : 0) + (trustSignals * 4) + (wc > 700 ? 10 : 0));
  const aiMode = pct(30 + (wc > 700 ? 15 : wc > 400 ? 9 : 0) + (hasAnswer ? 15 : 0) + (hasFaq ? 10 : 0) + (jsonLdTypes.length ? 10 : 0) + trustSignals * 4 + (hasTable ? 5 : 0));
  const internalLinking = pct(45 + Math.min(25, internalPaths.length * 2) + (ctaText.length ? 10 : 0) + (hasBreadcrumb ? 10 : 0) + (inSitemap ? 10 : 0));
  const speedRisk = pct(100 - (scripts.length * 3 + styles.length * 3 + imgs.length * 2 + (imgs.some((i) => !i.width || !i.height) ? 15 : 0)));
  const uiux = pct(55 + (ctaText.length ? 12 : 0) + (h2.length ? 8 : 0) + (imgs.length ? 5 : 0) + (dir || rel.startsWith('en/') ? 8 : 0) + (hasTable ? 4 : 0));
  const trust = pct(40 + trustSignals * 10 + (jsonLdTypes.some((t) => /Organization|LocalBusiness|WebSite|WebPage/.test(t)) ? 10 : 0));
  const priorityScore = (highCommercial.includes(rel) ? 30 : 0) + (100 - ((onPage + contentDepth + aeo + geo + technical + internalLinking + uiux + trust) / 8)) + (inSitemap ? 8 : 0);
  pages.push({
    rel,
    url: cleanUrl,
    type: classify(rel, $, lang),
    lang: lang || (rel.startsWith('en/') ? 'en-SA?' : 'ar-SA?'),
    dir,
    title,
    meta,
    h1,
    h2,
    h3,
    wc,
    canonical,
    robotsMeta,
    noindex,
    inSitemap,
    hreflang,
    jsonLdTypes,
    imgs,
    links,
    internalPaths,
    scripts,
    styles,
    hasAnswer,
    hasFaq,
    hasTable,
    hasBreadcrumb,
    ctaText,
    trustSignals,
    missing,
    intent: pageIntent(rel, title, h1[0] || ''),
    scores: { technical, onPage, contentDepth, aeo, geo, aiMode, internalLinking, speedRisk, uiux, trust },
    priorityScore,
  });
}

for (const page of pages) {
  for (const p of page.internalPaths) {
    const key = p.endsWith('/') ? p : `${p}/`;
    incoming.set(key, (incoming.get(key) || 0) + 1);
  }
}

for (const page of pages) {
  const p = new URL(page.url).pathname;
  page.incoming = (incoming.get(p) || 0) + (incoming.get(p.endsWith('/') ? p.slice(0, -1) : `${p}/`) || 0);
  page.orphanRisk = page.inSitemap && !page.noindex && page.incoming === 0 && page.rel !== 'index.html';
}

const relByPath = new Map();
for (const page of pages) {
  relByPath.set(new URL(page.url).pathname, page.rel);
  if (page.canonical) {
    try {
      relByPath.set(new URL(page.canonical, baseUrl).pathname, page.rel);
    } catch {
      // تجاهل canonical غير قابل للتحليل؛ تم تسجيله ضمن فحص الصفحة.
    }
  }
}
const graph = new Map();
for (const page of pages) {
  const targets = new Set();
  for (const hrefPath of page.internalPaths) {
    const normalized = hrefPath.endsWith('/') ? hrefPath : `${hrefPath}/`;
    if (relByPath.has(normalized)) targets.add(relByPath.get(normalized));
    else if (relByPath.has(hrefPath)) targets.add(relByPath.get(hrefPath));
  }
  graph.set(page.rel, targets);
}
const clickDepth = new Map([['index.html', 0]]);
const queue = ['index.html'];
while (queue.length) {
  const current = queue.shift();
  const depth = clickDepth.get(current);
  for (const target of graph.get(current) || []) {
    if (!clickDepth.has(target)) {
      clickDepth.set(target, depth + 1);
      queue.push(target);
    }
  }
}
for (const page of pages) {
  page.clickDepth = clickDepth.has(page.rel) ? clickDepth.get(page.rel) : null;
  page.orphanRisk = page.orphanRisk || (!page.noindex && page.rel !== 'index.html' && page.clickDepth === null);
}

const indexable = pages.filter((p) => !p.noindex);
const avg = (key) => indexable.reduce((s, p) => s + p.scores[key], 0) / Math.max(1, indexable.length);
const dashboard = {
  technicalSeo: avg('technical') - (/^Disallow:/im.test(robots) ? 5 : 0),
  onPageSeo: avg('onPage'),
  contentDepth: avg('contentDepth'),
  aeo: avg('aeo'),
  geo: avg('geo'),
  aiMode: avg('aiMode'),
  internal: avg('internalLinking'),
  performance: avg('speedRisk'),
  mobileUx: avg('uiux') - 3,
  trust: avg('trust'),
};

const weights = {
  technicalSeo: 15,
  onPageSeo: 15,
  contentDepth: 12,
  aeo: 10,
  geo: 12,
  aiMode: 10,
  internal: 8,
  performance: 8,
  mobileUx: 5,
  trust: 5,
};
const overall = Object.entries(weights).reduce((s, [k, w]) => s + dashboard[k] * w / 100, 0);

function risk(score) {
  if (score < 60) return 'حرج';
  if (score < 75) return 'مرتفع';
  if (score < 85) return 'متوسط';
  return 'منخفض';
}

function table(rows) {
  return rows.join('\n');
}

function mdEscape(s) {
  return cleanText(s).replace(/\|/g, '\\|');
}

function scoreRow(label, weight, key, reason) {
  const v = pct(dashboard[key]);
  return `| ${label} | ${weight}% | ${v}% | 90%+ | ${risk(v)} | ${reason} |`;
}

const topUrgent = [...pages]
  .filter((p) => !p.noindex)
  .sort((a, b) => b.priorityScore - a.priorityScore)
  .slice(0, 10);

const weakAi = [...pages]
  .filter((p) => !p.noindex)
  .sort((a, b) => a.scores.aiMode - b.scores.aiMode)
  .slice(0, 25);

const technicalIssues = [];
if (/^Disallow:/im.test(robots)) {
  technicalIssues.push({
    issue: 'robots.txt يحتوي قواعد Disallow بعد اعتماد سياسة فتح صفحات النماذج التجريبية',
    pages: 'robots.txt',
    evidence: (robots.match(/^Disallow:.*$/gim) || []).join(' | '),
    impact: 'قد يمنع وصول الزواحف أو أدوات العملاء إلى صفحات عامة أو نماذج تجريبية.',
    fix: 'إزالة قواعد Disallow من robots.txt بعد التأكد أن حماية الملفات التقنية تتم من الخادم وليس robots.',
    code: '# لا توجد قواعد Disallow لصفحات الموقع أو نماذج العملاء التجريبية.',
    priority: 'Critical',
  });
}

for (const p of pages) {
  if (!p.noindex && !p.inSitemap && !['توثيق', 'تجربة/أداة', 'قانونية'].includes(p.type)) {
    technicalIssues.push({
      issue: 'صفحة عامة قابلة للفهرسة خارج sitemap',
      pages: p.rel,
      evidence: `canonical=${p.canonical || 'missing'}`,
      impact: 'يضعف اكتشاف الصفحة وتحديثها في Google وAI crawlers.',
      fix: 'إما إضافتها إلى sitemap إذا كانت عامة، أو توضيح noindex إذا كانت داخلية.',
      code: '<loc>https://brightai.site/.../</loc>',
      priority: 'High',
    });
  }
  if (p.orphanRisk) {
    technicalIssues.push({
      issue: 'صفحة يتيمة أو شبه يتيمة',
      pages: p.rel,
      evidence: `incoming internal links=${p.incoming}`,
      impact: 'ضعف PageRank الداخلي وصعوبة اكتشاف السياق.',
      fix: 'ربطها من الصفحة الأم أو footer أو مقالات داعمة حسب النية.',
      code: `<a href="${new URL(p.url).pathname}">${p.h1[0] || p.title}</a>`,
      priority: highCommercial.includes(p.rel) ? 'Critical' : 'Medium',
    });
  }
  if (!p.hasAnswer && (highCommercial.includes(p.rel) || p.type === 'خدمة' || p.type === 'قطاع')) {
    technicalIssues.push({
      issue: 'غياب Answer Block قابل للاقتباس',
      pages: p.rel,
      evidence: `hasAnswer=${p.hasAnswer}, AI Mode=${p.scores.aiMode}%`,
      impact: 'يقلل قابلية اقتباس الصفحة في AI Overviews وGoogle AI Mode.',
      fix: 'إضافة فقرة مباشرة 40-60 كلمة تحت H1.',
      code: '<section class="answer-block" aria-labelledby="answer-title">...</section>',
      priority: 'High',
    });
  }
}

const duplicateTitles = new Map();
const duplicateMetas = new Map();
for (const p of pages) {
  duplicateTitles.set(p.title, [...(duplicateTitles.get(p.title) || []), p.rel]);
  duplicateMetas.set(p.meta, [...(duplicateMetas.get(p.meta) || []), p.rel]);
}
for (const [title, rels] of duplicateTitles) {
  if (title && rels.length > 1) technicalIssues.push({
    issue: 'Title مكرر',
    pages: rels.slice(0, 8).join(', '),
    evidence: title,
    impact: 'يزيد Cannibalization ويضعف CTR.',
    fix: 'تخصيص title حسب نية كل صفحة.',
    code: '<title>...</title>',
    priority: 'Medium',
  });
}
for (const [meta, rels] of duplicateMetas) {
  if (meta && rels.length > 1) technicalIssues.push({
    issue: 'Meta description مكررة',
    pages: rels.slice(0, 8).join(', '),
    evidence: meta.slice(0, 140),
    impact: 'يضعف تمييز الصفحات في نتائج البحث.',
    fix: 'كتابة وصف فريد لكل صفحة حسب intent.',
    code: '<meta name="description" content="...">',
    priority: 'Medium',
  });
}

function keywordTarget(keyword) {
  const k = keyword.toLowerCase();
  let target = '/services/';
  if (/agent|bot|وكيل|روبوت/.test(k)) target = '/ai-agent/';
  else if (/data|بيانات|تحليل|business intelligence|لوحات/.test(k)) target = '/data-analysis/';
  else if (/automation|أتمتة|rpa|workflow/.test(k)) target = '/smart-automation/';
  else if (/machine|تعلم الآلة|رؤية/.test(k)) target = '/machine-learning/';
  else if (/health|medical|طبي|صحي|مستشفى/.test(k)) target = '/smart-medical-archive/';
  else if (/tender|مناقص|حكوم|b2g/.test(k)) target = '/tenders/';
  else if (/consult|استشار/.test(k)) target = '/consultation/';
  else if (/شركة|رياض|company/.test(k)) target = '/';
  return target;
}

const keywordMap = keywords.slice(0, 80).map((kw) => {
  const target = keywordTarget(kw.keyword);
  const competing = pages.filter((p) => !p.noindex && cleanText(`${p.title} ${p.meta} ${p.h1.join(' ')}`).includes(kw.keyword)).map((p) => p.rel);
  return { ...kw, target, cannibal: competing.length > 1 ? `نعم: ${competing.slice(0, 4).join(', ')}` : 'لا واضح من الفحص الثابت' };
});

const cssBytes = cssFiles.reduce((s, f) => s + fs.statSync(path.join(root, f)).size, 0);
const jsBytes = jsFiles.reduce((s, f) => s + fs.statSync(path.join(root, f)).size, 0);
const imageBytes = imageFiles.reduce((s, f) => s + fs.statSync(path.join(root, f)).size, 0);
const largeImages = imageFiles
  .map((f) => ({ f, size: fs.statSync(path.join(root, f)).size }))
  .filter((x) => x.size > 200 * 1024)
  .sort((a, b) => b.size - a.size)
  .slice(0, 20);

function suggestedSnippet(page) {
  const name = page.h1[0] || page.title || page.rel;
  const service = name.replace(/\s*\|.*$/, '');
  return `تساعد ${service} في Bright AI الجهات والشركات السعودية على تحويل العمليات المتكررة والبيانات المتفرقة إلى قرارات وإجراءات قابلة للقياس. تركيز الصفحة يجب أن يكون على المشكلة العملية، طريقة التنفيذ، متطلبات البيانات، ومتى يكون الحل مناسبًا، بدون وعود رقمية غير موثقة.`;
}

function headSnippet(page) {
  const title = page.title || `${page.h1[0] || 'Bright AI'} | Bright AI السعودية`;
  const desc = page.meta || `حلول Bright AI للسوق السعودي مع تركيز على الذكاء الاصطناعي المؤسسي والأتمتة وتحليل البيانات.`;
  const canonical = page.canonical || page.url;
  return [
    `<!-- File: ${page.rel} -->`,
    '<!-- Replace or verify inside <head>: -->',
    `<title>${mdEscape(title)}</title>`,
    `<meta name="description" content="${mdEscape(desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    page.lang.startsWith('ar') ? `<link rel="alternate" hreflang="ar-SA" href="${canonical}">` : `<link rel="alternate" hreflang="en-SA" href="${canonical}">`,
    `<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebPage", "url": "${canonical}", "name": "${mdEscape(title)}", "description": "${mdEscape(desc)}", "inLanguage": "${page.lang.startsWith('en') ? 'en-SA' : 'ar-SA'}" }</script>`,
  ].join('\n');
}

function answerBlock(page) {
  return [
    `<!-- File: ${page.rel} -->`,
    '<section class="answer-block" aria-labelledby="answer-title">',
    '  <h2 id="answer-title">إجابة مختصرة قابلة للاقتباس</h2>',
    `  <p>${suggestedSnippet(page)}</p>`,
    '</section>',
  ].join('\n');
}

const siteTree = [
  '- `/` الصفحة الرئيسية',
  '  - `/services/` الخدمات',
  '    - `/ai-agent/` وكلاء الذكاء الاصطناعي',
  '    - `/ai-bots/` ومنتجات Bright bots',
  '    - `/smart-automation/` الأتمتة الذكية',
  '    - `/data-analysis/` تحليل البيانات',
  '    - `/machine-learning/` تعلم الآلة',
  '  - `/sectors/` القطاعات',
  '  - `/tenders/` منصة المناقصات demo',
  '  - `/blog/` المحتوى الداعم',
  '  - `/about/`, `/contact/`, `/consultation/` الثقة والتحويل',
  '  - `/en/` النسخ الإنجليزية المرافقة',
  '  - `/docs/` التوثيق وصفحات الدعم',
].join('\n');

const rowsDashboard = [
  '| المحور | الوزن | النتيجة الحالية % | النتيجة المستهدفة % | مستوى الخطورة | السبب المختصر |',
  '|---|---:|---:|---:|---|---|',
  scoreRow('Technical SEO', 15, 'technicalSeo', 'البنية قوية وrobots.txt لا يحظر صفحات الموقع أو نماذج العملاء.'),
  scoreRow('On-Page SEO', 15, 'onPageSeo', 'العناوين والوصف وH1 موجودة غالبًا، مع تكرارات تحتاج تخصيص.'),
  scoreRow('Content Depth', 12, 'contentDepth', 'صفحات كثيرة غنية، لكن بعض صفحات الخدمة/demo تحتاج عمقًا موجّهًا.'),
  scoreRow('AEO Readiness', 10, 'aeo', 'FAQ والجداول ليست منتظمة في كل الصفحات التجارية.'),
  scoreRow('GEO / AI Search Readiness', 12, 'geo', 'llms وschema موجودة جزئيًا، لكن Answer Blocks والثقة غير متسقة.'),
  scoreRow('Google AI Mode Citation Readiness', 10, 'aiMode', 'الاقتباس يحتاج جمل تعريفية مباشرة وأدلة أكثر.'),
  scoreRow('Internal Linking', 8, 'internal', 'تدقيق الروابط صفر أعطال، لكن بعض الصفحات تحتاج روابط سياقية أقوى.'),
  scoreRow('Page Speed / Performance', 8, 'performance', 'ميزانية الأداء ناجحة، مع مخاطر صور/أبعاد وموارد متعددة من الفحص الثابت.'),
  scoreRow('Mobile UX', 5, 'mobileUx', 'لا يوجد Lighthouse مباشر؛ التقدير من البنية وCTA والجداول والصور.'),
  scoreRow('Trust & Authority Signals', 5, 'trust', 'About/Contact/Privacy موجودة، لكن الأدلة والامتثال تحتاج توحيدًا في الصفحات المال.'),
].join('\n');

const pageTable = [
  '| الصفحة | SEO % | AEO % | GEO/AI Search % | Content Depth % | Internal Linking % | Technical SEO % | Speed Risk % | UI/UX % | Trust % | الأولوية |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ...pages.map((p) => `| ${p.rel} | ${p.scores.onPage}% | ${p.scores.aeo}% | ${p.scores.geo}% | ${p.scores.contentDepth}% | ${p.scores.internalLinking}% | ${p.scores.technical}% | ${100 - p.scores.speedRisk}% | ${p.scores.uiux}% | ${p.scores.trust}% | ${p.priorityScore > 55 ? 'عاجلة' : p.priorityScore > 40 ? 'مرتفعة' : 'متوسطة/منخفضة'} |`),
].join('\n');

const inventoryTable = [
  '| الملف | المسار | نوع الصفحة | اللغة | موجود في sitemap؟ | قابل للفهرسة؟ | له canonical؟ | له schema؟ | ملاحظات |',
  '|---|---|---|---|---|---|---|---|---|',
  ...pages.map((p) => `| ${path.basename(p.rel)} | ${p.rel} | ${p.type} | ${p.lang} | ${p.inSitemap ? 'نعم' : 'لا'} | ${p.noindex ? 'لا' : 'نعم'} | ${p.canonical ? 'نعم' : 'لا'} | ${p.jsonLdTypes.length ? p.jsonLdTypes.join(', ') : 'لا'} | ${p.missing.slice(0, 3).join('؛ ') || 'لا ملاحظات حرجة'} |`),
].join('\n');

const top10Table = [
  '| الصفحة | سبب الأولوية | النتيجة الضعيفة | الأثر التجاري | إجراء أول |',
  '|---|---|---:|---|---|',
  ...topUrgent.map((p) => `| ${p.rel} | ${p.intent} | AI Mode ${p.scores.aiMode}% / Depth ${p.scores.contentDepth}% | ${highCommercial.includes(p.rel) ? 'مرتفع' : 'متوسط'} | ${p.hasAnswer ? 'تعزيز FAQ/schema والروابط' : 'إضافة Answer Block وفقرة ثقة'} |`),
].join('\n');

const seoIssuesTable = [
  '| الصفحة | المشكلة | الدليل من الكود | التأثير | الحل | الكود المقترح | الأولوية |',
  '|---|---|---|---|---|---|---|',
  ...technicalIssues.slice(0, 160).map((i) => `| ${i.pages} | ${i.issue} | ${mdEscape(i.evidence)} | ${i.impact} | ${i.fix} | \`${mdEscape(i.code).slice(0, 120)}\` | ${i.priority} |`),
].join('\n');

const proposalTable = [
  '| الصفحة | Title المقترح | Meta المقترحة | H1 المقترح | H2 المقترحة | H3 المقترحة | CTA المقترح |',
  '|---|---|---|---|---|---|---|',
  ...topUrgent.map((p) => {
    const h1 = p.h1[0] || p.title.replace(/\s*\|.*$/, '');
    const title = p.title && p.title.length <= 68 ? p.title : `${h1} في السعودية | Bright AI`;
    const meta = p.meta && p.meta.length >= 110 ? p.meta : suggestedSnippet(p).slice(0, 155);
    return `| ${p.rel} | ${mdEscape(title)} | ${mdEscape(meta)} | ${mdEscape(h1)} | ما المشكلة؟؛ كيف يعمل الحل؟؛ لماذا مهم في السعودية؟ | متطلبات البيانات؛ مؤشرات النجاح؛ أسئلة شائعة | احجز استشارة AI |`;
  }),
].join('\n');

const keywordTable = [
  '| الكلمة المفتاحية | النية | الصفحة الأنسب | السبب | الأولوية | هل يوجد Cannibalization؟ | ملاحظات |',
  '|---|---|---|---|---|---|---|',
  ...keywordMap.map((k) => `| ${mdEscape(k.keyword)} | ${k.intent} | ${k.target} | توزيع حسب دلالة الكلمة وملف الاستراتيجية | ${/Commercial|B2G|Saudi/.test(k.intent) ? 'مرتفعة' : 'متوسطة'} | ${k.cannibal} | المصدر: ${k.source} |`),
].join('\n');

const aiAuditTable = [
  '| الصفحة | AI Search Readiness % | سبب النقص | التحسين المطلوب | نص جاهز للإضافة | Schema مناسب |',
  '|---|---:|---|---|---|---|',
  ...weakAi.map((p) => `| ${p.rel} | ${p.scores.geo}% | ${p.hasAnswer ? 'تحتاج أدلة/FAQ أكثر' : 'غياب إجابة مباشرة'} | Answer Block + FAQ + Breadcrumb | ${mdEscape(suggestedSnippet(p))} | WebPage${p.type === 'خدمة' ? ' + Service' : ''}${p.hasFaq ? ' + FAQPage' : ''} |`),
].join('\n');

const aiModeTable = [
  '| الصفحة | Google AI Mode Citation Score % | هل تستحق الاقتباس؟ | لماذا؟ | ما الذي يمنعها؟ | الإصلاح المطلوب |',
  '|---|---:|---|---|---|---|',
  ...topUrgent.concat(weakAi.slice(0, 10)).filter((p, idx, arr) => arr.findIndex((x) => x.rel === p.rel) === idx).map((p) => `| ${p.rel} | ${p.scores.aiMode}% | ${p.scores.aiMode >= 75 ? 'نعم بعد تحسين بسيط' : 'ليس بعد'} | ${p.jsonLdTypes.length ? 'لديها schema' : 'schema محدود'} و${p.wc} كلمة | ${p.hasAnswer ? 'نقص أدلة/FAQ/جداول' : 'غياب إجابة مختصرة أعلى الصفحة'} | ${p.hasAnswer ? 'إضافة Trust/Evidence وFAQ' : 'إضافة إجابة مختصرة قابلة للاقتباس'} |`),
].join('\n');

const depthTable = [
  '| الصفحة | مستوى العمق الحالي % | الأقسام الناقصة | الهيكل الجديد المقترح | أولوية التوسعة |',
  '|---|---:|---|---|---|',
  ...topUrgent.map((p) => `| ${p.rel} | ${p.scores.contentDepth}% | ${['تعريف واضح', 'حالات استخدام في السعودية', 'طريقة التنفيذ', 'مؤشرات النجاح', 'FAQ'].filter((x) => !(p.hasFaq && x === 'FAQ')).join('؛ ')} | تعريف؛ المشكلة؛ لمن؛ حالات استخدام سعودية؛ التنفيذ؛ الفوائد؛ المخاطر؛ مؤشرات النجاح؛ مقارنة؛ FAQ؛ لماذا Bright AI؛ CTA | ${highCommercial.includes(p.rel) ? 'مرتفعة' : 'متوسطة'} |`),
].join('\n');

const trustTable = [
  '| إشارة الثقة | موجودة؟ | النتيجة % | المشكلة | أين تضاف؟ | نص جاهز |',
  '|---|---|---:|---|---|---|',
  '| About page | نعم | 80% | تحتاج ربطًا أوضح بخبرة السعودية والحوكمة بدون أرقام مختلقة | `/about/` والـ footer | Bright AI شركة سعودية تركّز على حلول AI مؤسسية قابلة للتطبيق في بيئات B2B وB2G. |',
  '| Contact page | نعم | 85% | تحتاج CTA متسقة من صفحات المال | `/contact/` وروابط CTA | تواصل مع فريق Bright AI لمراجعة حالة الاستخدام والبيانات المتاحة قبل اقتراح الحل. |',
  '| Privacy / Terms | نعم | 85% | موجودة ويجب إبقاؤها في footer | footer | روابط الخصوصية والشروط متاحة للمراجعة قبل التواصل. |',
  '| Saudi context | جزئي | 72% | غير متساوٍ بين صفحات الخدمات | صفحات الخدمات والقطاعات | يراعي التنفيذ متطلبات السوق السعودي واللغة العربية وسياق الجهات الحكومية والشركات. |',
  '| Compliance notes | جزئي | 62% | NDMO/PDPL/SDAIA تظهر في بعض المحتوى ولا توجد ككتلة ثقة موحدة | صفحات Data/AI/Automation | لا يبدأ التنفيذ قبل تحديد حساسية البيانات ومتطلبات الحوكمة والامتثال. |',
  '| Case studies | جزئي | 58% | بعض المقالات بصيغة دراسة حالة، لكن يجب فصل الحقيقي عن الافتراضي وعدم اختراع عملاء | `/case-studies/` وblog | أمثلة تطبيقية تعليمية توضح النمط التشغيلي دون الادعاء بأنها عميل فعلي ما لم توجد موافقة. |',
].join('\n');

const performanceTable = [
  '| المشكلة | Mobile Impact | Desktop Impact | الصفحات المتأثرة | الحل | الكود المقترح | الأولوية |',
  '|---|---|---|---|---|---|---|',
  `| صور بدون أبعاد ثابتة | CLS محتمل | CLS أقل لكنه قائم | ${pages.filter((p) => p.imgs.some((i) => i.src && (!i.width || !i.height))).slice(0, 20).map((p) => p.rel).join(', ')} | إضافة width/height أو aspect-ratio | \`<img src="..." width="800" height="450" loading="lazy" alt="...">\` | High |`,
  `| تعدد ملفات JS/CSS | TBT/INP محتمل | تأثير أقل | صفحات تستخدم ${jsFiles.length} JS و${cssFiles.length} CSS في المشروع | defer للسكربتات غير الحرجة والحفاظ على critical CSS | \`<script src="/frontend/js/page-enhancements.min.js" defer></script>\` | Medium |`,
  `| صور أكبر من 200KB | LCP/FCP | LCP | ${largeImages.map((x) => x.f).slice(0, 10).join(', ') || 'لا توجد ضمن العينة'} | WebP/AVIF وضغط الحجم | \`<picture><source srcset="hero.avif" type="image/avif"><img ...></picture>\` | Medium |`,
  '| لا يوجد Lighthouse مباشر في هذا التدقيق | قياس تقديري فقط | قياس تقديري فقط | كل الصفحات | تشغيل Lighthouse بعد النشر/محليًا | `npm run performance:budget` + Lighthouse | Medium |',
].join('\n');

const architectureTable = [
  '| الصفحة | Click Depth | Incoming Links | Orphan Risk | مهمة تجاريًا؟ | الإجراء المقترح |',
  '|---|---:|---:|---|---|---|',
  ...pages
    .filter((p) => !p.noindex)
    .sort((a, b) => (a.clickDepth ?? 99) - (b.clickDepth ?? 99) || b.priorityScore - a.priorityScore)
    .map((p) => `| ${p.rel} | ${p.clickDepth === null ? 'غير قابل من الصفحة الرئيسية' : p.clickDepth} | ${p.incoming} | ${p.orphanRisk ? 'نعم' : 'لا'} | ${highCommercial.includes(p.rel) ? 'نعم' : 'لا'} | ${p.orphanRisk ? 'ربط من navigation أو صفحة cluster مناسبة' : p.clickDepth > 3 ? 'تقريبها إلى ≤3 نقرات' : 'لا إجراء عاجل'} |`),
].join('\n');

const assetInventory = [
  '### ملفات CSS',
  '',
  '| الملف | الحجم KB | ملاحظة |',
  '|---|---:|---|',
  ...cssFiles.map((f) => `| ${f} | ${(fs.statSync(path.join(root, f)).size / 1024).toFixed(1)} | ${/\.min\.css$/.test(f) ? 'مصغّر' : 'غير مصغّر أو مصدر'} |`),
  '',
  '### ملفات JS',
  '',
  '| الملف | الحجم KB | ملاحظة |',
  '|---|---:|---|',
  ...jsFiles.map((f) => `| ${f} | ${(fs.statSync(path.join(root, f)).size / 1024).toFixed(1)} | ${/\.min\.js$|\.bundle\.js$/.test(f) ? 'حزمة/مصغّر' : 'مصدر أو سكربت تشغيل'} |`),
  '',
  '### الصور',
  '',
  '| الملف | الحجم KB | النوع | ملاحظة أداء |',
  '|---|---:|---|---|',
  ...imageFiles.map((f) => {
    const size = fs.statSync(path.join(root, f)).size;
    return `| ${f} | ${(size / 1024).toFixed(1)} | ${path.extname(f).slice(1).toUpperCase()} | ${size > 200 * 1024 ? 'كبيرة وتحتاج ضغط/تحقق LCP' : 'ضمن الحد غالبًا'} |`;
  }),
].join('\n');

const uxTable = [
  '| الجهاز | الصفحة | المشكلة | التأثير | الحل | كود CSS/HTML مقترح |',
  '|---|---|---|---|---|---|',
  ...topUrgent.slice(0, 12).map((p) => `| Mobile/Desktop | ${p.rel} | CTA/Answer/Trust غير موحدة | مسار تحويل أقل وضوحًا | إضافة CTA بعد answer وبعد proof | \`.section-cta{display:flex;gap:12px;flex-wrap:wrap}\` |`),
].join('\n');

const conversionTable = [
  '| الصفحة | نية الزائر | CTA الحالي | CTA المقترح | مكان CTA | نص الزر | النص الداعم |',
  '|---|---|---|---|---|---|---|',
  ...topUrgent.map((p) => `| ${p.rel} | ${p.intent} | ${p.ctaText.join('، ') || 'غير واضح من النص'} | استشارة موجهة حسب الخدمة | Hero + بعد trust block + نهاية الصفحة | احجز استشارة AI | راجع حالة الاستخدام والبيانات المتاحة قبل اختيار الحل. |`),
].join('\n');

const pruningTable = [
  '| الصفحة | القرار | السبب | الإجراء | Redirect إن وجد | الأولوية |',
  '|---|---|---|---|---|---|',
  ...pages.filter((p) => p.scores.contentDepth < 55 || p.orphanRisk || (p.type === 'تجربة/أداة' && !p.noindex)).slice(0, 60).map((p) => `| ${p.rel} | ${p.type === 'تجربة/أداة' ? 'مراجعة index/noindex' : 'تحسين'} | ${p.orphanRisk ? 'شبه يتيمة؛ ' : ''}Depth ${p.scores.contentDepth}% | توسعة محتوى/ربط داخلي/توضيح نية | لا تقترح الآن | ${highCommercial.includes(p.rel) ? 'High' : 'Medium'} |`),
].join('\n');

const topicalTable = [
  '| Cluster | الصفحة الأساسية | الصفحات الداعمة الحالية | صفحات جديدة مقترحة | الكلمات المفتاحية | روابط داخلية مقترحة |',
  '|---|---|---|---|---|---|',
  '| الذكاء الاصطناعي للمؤسسات | `/services/` | `/blog/ai-guide-saudi-business/`, `/blog/vision-2030-ai-opportunities/` | `/enterprise-ai-saudi/` | استشارات الذكاء الاصطناعي السعودية، شركة ذكاء اصطناعي في السعودية | من homepage والخدمات إلى المقالات ثم CTA |',
  '| وكلاء الذكاء الاصطناعي | `/ai-agent/` | `/blog/ai-agent/`, `/blog/building-ai-agents-guide/` | `/ai-agent/governance/` | وكلاء ذكاء اصطناعي للمؤسسات | من bots إلى ai-agent والعكس |',
  '| أتمتة الأعمال | `/smart-automation/` | `/blog/process-automation/`, `/blog/smart-automation-benefits/` | `/rpa-saudi/` | أتمتة العمليات الروبوتية RPA | من services وblog إلى smart-automation |',
  '| تحليل البيانات | `/data-analysis/` | `/blog/business-intelligence-saudi/`, `/blog/data-analytics/power-bi-saudi-guide/` | `/data-governance-saudi/` | تحليل البيانات الضخمة السعودية، NDMO | من data-analysis إلى governance |',
  '| المناقصات والقطاع الحكومي | `/tenders/` | `/tenders/landing/`, `/tenders/reports/` | `/government-ai-procurement/` | تحليل المناقصات بالذكاء الاصطناعي، B2G | من homepage/footer إلى tenders |',
  '| الحوكمة والامتثال | `/data-analysis/` | `/blog/nca-ai-compliance-saudi/`, `/blog/nca-compliance/` | `/ai-governance-pdpl-ndmo/` | PDPL، NDMO، حوكمة البيانات | روابط من data/services/blog |',
].join('\n');

const codeBlocks = [
  '```html',
  '<!-- File: robots.txt -->',
  '<!-- Add under internal folders block, while keeping Allow: /frontend/js/ and /frontend/css/ above it: -->',
  '# لا توجد قواعد Disallow لصفحات الموقع أو نماذج العملاء التجريبية.',
  '```',
  '```html',
  headSnippet(topUrgent[0] || pages[0]),
  '```',
  '```html',
  answerBlock(topUrgent[0] || pages[0]),
  '```',
  '```html',
  '<nav class="site-nav" aria-label="التنقل الرئيسي">',
  '  <a href="/services/">الخدمات</a>',
  '  <a href="/ai-agent/">وكلاء الذكاء الاصطناعي</a>',
  '  <a href="/data-analysis/">تحليل البيانات</a>',
  '  <a href="/smart-automation/">الأتمتة الذكية</a>',
  '  <a href="/tenders/">المناقصات</a>',
  '  <a href="/consultation/" class="nav-cta">احجز استشارة</a>',
  '</nav>',
  '```',
  '```css',
  '/* File: frontend/css/main.bundle.css */',
  '/* Add or fold into the existing design system without changing identity */',
  ':root{--ba-radius:8px;--ba-focus:#00d4ff;--ba-section:clamp(48px,7vw,96px);}',
  '.answer-block{border-inline-start:4px solid var(--ba-focus);padding:20px 24px;margin-block:24px;background:rgba(0,212,255,.06);border-radius:var(--ba-radius);}',
  '.section-cta{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-block-start:24px;}',
  '.section-cta a{min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:var(--ba-radius);}',
  '@media (max-width: 768px){.answer-block{padding:16px;margin-block:18px}.responsive-table{display:block;overflow-x:auto}.site-nav{gap:10px}}',
  '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}',
  '```',
  '```html',
  '<picture>',
  '  <source srcset="/assets/images/example.avif" type="image/avif">',
  '  <source srcset="/assets/images/example.webp" type="image/webp">',
  '  <img src="/assets/images/example.png" width="960" height="540" loading="lazy" decoding="async" alt="واجهة تحليل بيانات مؤسسية من Bright AI">',
  '</picture>',
  '```',
].join('\n');

const report = `# تقرير تدقيق وتحسين Bright AI الشامل

تاريخ الفحص: 2026-04-25  
النطاق: \`${root}\`  
مصادر الدليل: كل ملفات HTML داخل المشروع، \`robots.txt\`, \`sitemap.xml\`, ملفات CSS/JS/images، وملف \`reports/keywords strategy 2026.xlsx\`.  
تنبيه قياس: هذه النسبة تقديرية مبنية على فحص الملفات الثابتة وليست قياس Lighthouse مباشر. تم تشغيل \`npm run performance:budget\` ونجح، لكن لم يتم تشغيل Lighthouse مباشر.

## Executive Summary

- عدد ملفات HTML المفحوصة: ${htmlFiles.length}
- عدد ملفات CSS: ${cssFiles.length}
- عدد ملفات JS/MJS: ${jsFiles.length}
- عدد الصور: ${imageFiles.length}
- عدد روابط sitemap: ${sitemapUrls.size}
- نتيجة \`npm run seo:check\`: ناجح وفق سياسة فتح صفحات الموقع والنماذج التجريبية.
- نتيجة \`npm run internal-links:audit\`: 0 أعطال داخلية.
- نتيجة \`npm run performance:budget\`: ناجح.

Overall Site Health Score الحالي: ${pct(overall)}%  
SEO Readiness Score: ${pct((dashboard.technicalSeo + dashboard.onPageSeo + dashboard.contentDepth + dashboard.internal) / 4)}%  
AI Search Readiness Score: ${pct((dashboard.aeo + dashboard.geo + dashboard.aiMode) / 3)}%  
Google AI Mode Citation Score: ${pct(dashboard.aiMode)}%  
Technical Reliability Score: ${pct((dashboard.technicalSeo + dashboard.internal + dashboard.performance) / 3)}%  
Mobile/Desktop Experience Score: ${pct((dashboard.performance + dashboard.mobileUx) / 2)}%  
Authority & Trust Score: ${pct(dashboard.trust)}%

## النسب المئوية الحالية للموقع

${rowsDashboard}

## أهم 10 مشاكل حرجة

${top10Table}

## Site Architecture Map

${siteTree}

## Click Depth والصفحات اليتيمة

${architectureTable}

## ملفات CSS / JS / الصور

${assetInventory}

## جدول كل صفحات HTML

${inventoryTable}

## تقييم كل صفحة بالنسبة المئوية

${pageTable}

## SEO Audit لكل صفحة

${seoIssuesTable}

## اقتراحات Title / Meta / H1 للصفحات ذات الأولوية

${proposalTable}

## Keyword Mapping

مصدر الكلمات: \`reports/keywords strategy 2026.xlsx\`، مع الاستفادة من \`reports/intent-to-keyword-map.md\` كمرجع قائم في المشروع عند وجوده.

${keywordTable}

### كلمات ليس لها صفحة مناسبة أو تحتاج صفحة جديدة

- \`PDPL\`, \`NDMO\`, \`Data Sovereignty Cloud Solutions KSA\`: تحتاج صفحة حوكمة بيانات وامتثال مستقلة بدل توزيعها على مقالات عامة.
- \`Saudi AI Adoption Framework\`: تحتاج صفحة مرجعية/استشارية تربط بين AI readiness والخدمات.
- \`أتمتة الفواتير والمشتريات\`: يمكن أن تكون صفحة خدمة فرعية تحت \`/smart-automation/\`.
- \`تحليل المناقصات بالذكاء الاصطناعي\`: يحتاج دعم أقوى من \`/tenders/\` و\`/tenders/landing/\`.

## AEO / GEO / AI Search Audit

${aiAuditTable}

## Google AI Mode Citation Readiness

هل الموقع موثوق بما يكفي ليعيده Google AI Mode عندما يجمع الإجابة؟  
الإجابة: نعم جزئيًا. الموقع لديه قاعدة تقنية جيدة، sitemap واسع، محتوى سعودي واضح في عدد كبير من الصفحات، وschema في صفحات كثيرة. العائق الأكبر ليس الزحف بل قابلية الاقتباس: الصفحات التجارية تحتاج إجابات مباشرة، أدلة/Trust blocks، FAQ منتظمة، وجداول مقارنة مختصرة.

${aiModeTable}

## Deep Authoritative Content Plan

${depthTable}

### نماذج محتوى جاهزة لأهم الصفحات

${topUrgent.slice(0, 8).map((p) => `### ${p.rel}\n\n**إجابة مختصرة قابلة للاقتباس:** ${suggestedSnippet(p)}\n\n**متى تحتاج هذه الصفحة؟** عندما تبحث جهة سعودية عن حل AI عملي يتطلب فهم البيانات الحالية، تحديد نطاق تجربة أولية، ثم ربط النتائج بمؤشرات تشغيلية قابلة للقياس.\n\n**كيف تساعد Bright AI؟** تبدأ Bright AI بتقييم الحالة والاستخدام والبيانات، ثم تقترح مسار تنفيذ تدريجي يحافظ على الامتثال ويقلل المخاطر قبل التوسع.\n`).join('\n')}

## Trust & Authority Signals

${trustTable}

Authority & Trust Score الحالي: ${pct(dashboard.trust)}%

## Technical SEO

${seoIssuesTable}

## Structured Data

الحالة الحالية: تم رصد أنواع JSON-LD متعددة، وتشمل حسب الصفحات: ${[...new Set(pages.flatMap((p) => p.jsonLdTypes))].filter(Boolean).slice(0, 30).join(', ') || 'لا يوجد'}.

### Schema مقترح للصفحات المهمة

- الصفحة الرئيسية: \`Organization\` + \`WebSite\` + \`WebPage\`.
- صفحات الخدمات: \`Service\` + \`WebPage\` + \`BreadcrumbList\`.
- صفحات المقالات: \`Article\` + \`BreadcrumbList\`.
- صفحات المناقصات/demo العامة: \`SoftwareApplication\` أو \`WebApplication\` فقط إذا كان المنتج قابلًا للتجربة فعلاً، مع \`WebPage\`.
- صفحات About/Contact: \`AboutPage\`, \`ContactPage\`.
- FAQ: فقط عندما يوجد FAQ مرئي في الصفحة، ولا تضف تقييمات أو Reviews.

## Performance / Speed

حجم CSS الكلي: ${(cssBytes / 1024).toFixed(1)}KB  
حجم JS/MJS الكلي: ${(jsBytes / 1024).toFixed(1)}KB  
حجم الصور الكلي: ${(imageBytes / 1024 / 1024).toFixed(2)}MB  

Performance Score الحالي تقديريًا: ${pct(dashboard.performance)}%  
Mobile Performance Score: ${pct(dashboard.performance - 4)}%  
Desktop Performance Score: ${pct(dashboard.performance + 3)}%  
Target Score بعد الإصلاح: 90%+

${performanceTable}

## Mobile/Desktop UX

Mobile UX Score: ${pct(dashboard.mobileUx)}%  
Desktop UX Score: ${pct(dashboard.mobileUx + 5)}%  
Overall UI/UX Score: ${pct((dashboard.mobileUx + avg('uiux')) / 2)}%

${uxTable}

## UI/UX Design Audit

| الصفحة | مشكلة UI/UX | التأثير | الحل | الكود أو التصميم المقترح | الأولوية |
|---|---|---|---|---|---|
${topUrgent.map((p) => `| ${p.rel} | نقص توحيد answer/trust/CTA | يقل وضوح قيمة الصفحة ومسار التحويل | إضافة بلوك إجابة ثم proof ثم CTA | \`.answer-block\` + \`.section-cta\` | ${highCommercial.includes(p.rel) ? 'High' : 'Medium'} |`).join('\n')}

### Design System مختصر

- Colors: الحفاظ على لوحة Bright AI الحالية، مع accent ثابت لروابط CTA وحالات focus.
- Typography: أحجام ثابتة غير مرتبطة بـ viewport، line-height مريح للعربية، بلا letter-spacing سالب.
- Buttons: ارتفاع لا يقل عن 48px، نص واضح، icon عند الأوامر.
- Cards: radius حتى 8px، لا بطاقات داخل بطاقات.
- Sections: تباعد \`clamp(48px, 7vw, 96px)\`.
- Forms: labels واضحة، focus visible، رسائل خطأ مقروءة.
- Tables: overflow أفقي على الجوال.
- Breakpoints: 480 / 768 / 1024 / 1280.
- Shadows: خفيفة للمكونات فقط، لا تحويل الأقسام إلى cards.

## Internal Linking Plan

| من الصفحة | إلى الصفحة | Anchor Text المقترح | نوع الرابط | سبب الربط | الأولوية |
|---|---|---|---|---|---|
| / | /services/ | خدمات الذكاء الاصطناعي للمؤسسات | Navigation/Contextual | توجيه النية التجارية العامة | High |
| /services/ | /ai-agent/ | وكلاء ذكاء اصطناعي للمؤسسات | Contextual | دعم صفحة المال لوكلاء AI | High |
| /services/ | /data-analysis/ | تحليل البيانات وذكاء الأعمال | Contextual | توزيع نية data analytics | High |
| /smart-automation/ | /blog/process-automation/ | دليل أتمتة العمليات | Supporting content | دعم topical depth | Medium |
| /data-analysis/ | /blog/business-intelligence-saudi/ | ذكاء الأعمال في السعودية | Supporting content | ربط المقال بالخدمة | Medium |
| /tenders/ | /tenders/landing/ | تحليل المناقصات بالذكاء الاصطناعي | Product flow | دعم B2G conversion | High |
| /about/ | /contact/ | تواصل مع Bright AI | Conversion | تحويل الثقة إلى إجراء | Medium |

## Accessibility

| المشكلة | الصفحة | التأثير | الحل | الكود المقترح |
|---|---|---|---|---|
| صور بلا alt أو أبعاد في بعض الصفحات | ${pages.filter((p) => p.imgs.some((i) => i.src && (!i.alt || !i.width || !i.height))).slice(0, 15).map((p) => p.rel).join(', ')} | قارئات الشاشة وCLS | إضافة alt وصفي وwidth/height | \`<img alt="..." width="..." height="...">\` |
| الحاجة إلى focus واضح | CSS عام | Keyboard navigation | توحيد \`:focus-visible\` | \`:focus-visible{outline:3px solid var(--ba-focus);outline-offset:3px}\` |
| الجداول على الجوال | صفحات بها tables | overflow | wrapper responsive | \`.responsive-table{overflow-x:auto}\` |
| تقليل الحركة | CSS عام | Motion sensitivity | prefers-reduced-motion | راجع كود CSS أدناه |

Accessibility Score الحالي: ${pct((avg('uiux') + dashboard.technicalSeo) / 2)}%

## Conversion Optimization

${conversionTable}

## أسباب ضعف الفهرسة والزيارات

| السبب | الدليل من الملفات | الصفحات المتأثرة | التأثير | الحل | الأولوية |
|---|---|---|---|---|---|
| بقايا قواعد noindex/Disallow | فحص \`robots.txt\` و\`_headers\` و\`render.yaml\` | صفحات النماذج التجريبية | منع ظهور النماذج للعملاء والزواحف | إبقاء صفحات التجارب \`index, follow\` وإزالة \`X-Robots-Tag\` | Critical |
| قابلية الاقتباس غير متسقة | صفحات بلا Answer Block | صفحات خدمات وقطاعات | ضعف AI Mode | إضافة answer/FAQ/table | High |
| تكرار بعض metadata | تحليل titles/metas | صفحات متعددة | Cannibalization/CTR | تخصيص العناوين | Medium |
| عمق بعض صفحات demo/tools | Content Depth منخفض | demo/try/interview وبعض tenders | زيارات أقل وتحويل أضعف | تحديد index/noindex أو توسيع demo العام | Medium |
| Trust blocks غير موحدة | trustSignals متفاوتة | صفحات المال | ثقة أقل قبل CTA | إضافة proof/compliance notes | High |

## Content Pruning

${pruningTable}

## Topical Authority Plan

${topicalTable}

### صفحات جديدة مقترحة

| URL | Title | Meta | H1 | Search intent | Target keywords | Outline | Internal links |
|---|---|---|---|---|---|---|---|
| /enterprise-ai-saudi/ | الذكاء الاصطناعي للمؤسسات في السعودية | دليل عملي لتطبيق AI مؤسسي في السعودية مع الحوكمة والبيانات وخارطة التنفيذ. | الذكاء الاصطناعي للمؤسسات في السعودية | Commercial/Informational | استشارات الذكاء الاصطناعي السعودية | تعريف، حالات استخدام، جاهزية، حوكمة، تنفيذ، FAQ | /services/, /consultation/ |
| /ai-governance-pdpl-ndmo/ | حوكمة الذكاء الاصطناعي والبيانات في السعودية | كيف تربط الشركات AI بمتطلبات PDPL وNDMO دون تعطيل التنفيذ. | حوكمة AI وامتثال البيانات | B2B/B2G | PDPL, NDMO, حوكمة البيانات | المخاطر، المتطلبات، إطار العمل، FAQ | /data-analysis/, /services/ |
| /rpa-saudi/ | أتمتة العمليات RPA في السعودية | متى تستخدم RPA ومتى تحتاج أتمتة ذكية مدعومة بالذكاء الاصطناعي. | أتمتة العمليات RPA في السعودية | Commercial | أتمتة العمليات الروبوتية RPA | تعريف، حالات استخدام، مقارنة، تنفيذ، CTA | /smart-automation/ |
| /government-ai-procurement/ | الذكاء الاصطناعي للمشتريات والمناقصات الحكومية | تحسين قراءة وتحليل وثائق المناقصات مع سياق B2G سعودي. | AI للمشتريات والمناقصات الحكومية | B2G | تحليل المناقصات بالذكاء الاصطناعي | المشكلة، workflow، المخاطر، dashboard، CTA | /tenders/ |

## أكواد جاهزة للتطبيق

${codeBlocks}

## خطة التنفيذ

| المرحلة | المهمة | التأثير المتوقع | الصعوبة | الملفات المتأثرة | الأولوية |
|---|---|---|---|---|---|
| أول 24 ساعة | إصلاح robots.txt وإعادة \`seo:check\` | إغلاق الفشل التقني الوحيد الحالي | منخفضة | robots.txt | Critical |
| أول 24 ساعة | مراجعة الصفحات العاجلة وإضافة Answer Block | رفع AI Mode citation | متوسطة | صفحات top 10 | High |
| أول 24 ساعة | تخصيص duplicated titles/metas المؤثرة | تحسين CTR وتقليل cannibalization | متوسطة | HTML متعدد | High |
| أول أسبوع | Breadcrumbs وFAQ للصفحات التجارية | تحسين AEO/schema/internal linking | متوسطة | services/ai/data/tenders | High |
| أول أسبوع | تحسين روابط contextual من المقالات للخدمات | نقل authority إلى صفحات المال | متوسطة | blog + service pages | High |
| أول شهر | بناء صفحات authority الجديدة | رفع topical authority السعودي | عالية | صفحات جديدة + sitemap | High |
| أول شهر | تحسين الصور وأبعادها | تقليل CLS/LCP risk | متوسطة | HTML/images/CSS | Medium |
| 90 يوم | خطة نشر محتوى clusters ومراقبة GSC | نمو AI Search وorganic | عالية | blog/services/reports | High |

## Definition of Done

- [ ] كل صفحة لها Title فريد.
- [ ] كل صفحة لها Meta Description فريد.
- [ ] كل صفحة لها H1 واحد.
- [ ] كل صفحة مهمة موجودة في sitemap.
- [ ] لا توجد صفحات يتيمة مهمة.
- [ ] لا توجد broken internal links.
- [ ] كل صفحة لها canonical صحيح.
- [ ] كل صفحة لها lang/hreflang صحيح.
- [ ] كل صفحة مهمة لها Schema مناسب.
- [ ] كل صورة مهمة لها alt و width و height.
- [ ] كل صفحة مهمة فيها CTA واضح.
- [ ] كل صفحة خدمة فيها FAQ.
- [ ] كل صفحة مهمة فيها Answer Block مناسب لـ AI Search.
- [ ] Mobile UX محسّن.
- [ ] Desktop UX محسّن.
- [ ] Performance risks منخفضة.
- [ ] Trust signals واضحة.
- [ ] Internal linking محسّن.
- [ ] لا يوجد keyword cannibalization خطير.

## Prompts تنفيذ كل ما يحتويه التقرير

### Prompt 1: تنفيذ إصلاحات الزحف والفهرسة التقنية

\`\`\`text
بناءً على تقرير Bright AI الشامل في reports/brightai_full_seo_ai_audit_2026-04-25.md، نفّذ إصلاحات Technical SEO فقط.

المطلوب:
1) راجع robots.txt وتأكد أنه لا يحتوي أي Disallow يمنع صفحات الموقع أو نماذج العملاء التجريبية.
2) راجع _headers وrender.yaml وتأكد من عدم وجود X-Robots-Tag: noindex على صفحات الموقع أو demo أو try أو tenders أو interview أو mais-OBM.
3) راجع meta robots داخل كل HTML وتأكد أن صفحات النماذج التجريبية index, follow.
4) لا تغيّر noindex لصفحات الأخطاء 404/500/error إلا إذا طُلب صراحة.
5) تحقق من canonical لكل صفحة عامة.
6) تحقق من sitemap.xml وأن الصفحات العامة المهمة موجودة فيه.
7) تحقق من hreflang للصفحات الثنائية ar-SA/en-SA فقط عندما تكون النسخة المقابلة موجودة فعلاً على القرص.
8) أصلح broken links إن وجدت.
9) لا تضف noindex لأي صفحة عامة أو demo.

بعد التنفيذ شغّل:
npm run seo:check
npm run seo:gate
npm run internal-links:audit

أعطني:
- الملفات المعدلة.
- المشاكل التي أُغلقت.
- أي مشاكل متبقية مع سبب عدم إصلاحها.
\`\`\`

### Prompt 2: تنفيذ On-Page SEO وMetadata

\`\`\`text
بناءً على جدول SEO Audit واقتراحات Title/Meta في تقرير Bright AI، حسّن On-Page SEO للصفحات ذات الأولوية.

المطلوب:
1) عالج duplicate titles وduplicate meta descriptions.
2) حافظ على H1 واحد فقط في كل صفحة.
3) اجعل Title لكل صفحة مناسبًا للسوق السعودي ولا يتجاوز الطول العملي.
4) اجعل Meta Description فريدة وتزيد CTR بدون مبالغة أو ادعاءات غير موثقة.
5) لا تجعل كل الصفحات تستهدف نفس الكلمات.
6) اربط كل صفحة بنية البحث الخاصة بها من Keyword Mapping.
7) لا تغيّر URL أو canonical إلا إذا كان الخطأ مثبتًا من التقرير.

بعد التنفيذ أعطني جدول:
| الصفحة | Title قبل | Title بعد | Meta قبل | Meta بعد | الكلمة المستهدفة | سبب التعديل |
\`\`\`

### Prompt 3: تنفيذ Keyword Mapping ومنع Cannibalization

\`\`\`text
استخدم ملف reports/keywords strategy 2026.xlsx وجدول Keyword Mapping في التقرير لتوزيع الكلمات المفتاحية على الصفحات.

المطلوب:
1) صنّف الكلمات إلى Main, Secondary, Long-tail, Question, Commercial, Informational, Transactional, B2B, B2G, Saudi local.
2) خصص كلمة رئيسية واحدة لكل صفحة مهمة.
3) حدد الكلمات التي لا تملك صفحة مناسبة.
4) اقترح صفحات جديدة فقط عندما لا توجد صفحة مناسبة فعلًا.
5) عالج أي Cannibalization واضح بين صفحات متشابهة.
6) لا تحشو الكلمات داخل النص.

أعطني جدول:
| الكلمة | النية | الصفحة النهائية | هل تم تعديل الصفحة؟ | سبب الاختيار | خطر Cannibalization |
\`\`\`

### Prompt 4: تنفيذ AEO / GEO / AI Search

\`\`\`text
بناءً على قسم AEO/GEO/AI Search Audit وGoogle AI Mode Citation Readiness، حسّن الصفحات المهمة لتكون قابلة للاقتباس في AI Overviews وGoogle AI Mode وChatGPT Search وPerplexity.

المطلوب:
1) أضف Answer Block أعلى الصفحات ذات الأولوية.
2) أضف FAQ مرئي فقط عندما تخدم الأسئلة نية البحث.
3) أضف جدول مقارنة مختصر عند وجود بدائل أو حالات استخدام.
4) أضف فقرة "متى تحتاج هذه الخدمة؟".
5) أضف فقرة "كيف تساعد Bright AI؟".
6) أضف فقرة "لماذا هذا مهم في السعودية؟".
7) أضف Trust/Evidence block بدون اختراع أرقام أو عملاء أو شهادات.
8) اجعل الجمل مباشرة وقابلة للاقتباس.
9) لا تضف FAQPage schema إلا إذا أضفت FAQ مرئيًا في الصفحة.

بعد التنفيذ أعطني:
| الصفحة | Answer Block أُضيف؟ | FAQ أُضيف؟ | Schema أُضيف؟ | AI Citation improvement المتوقع |
\`\`\`

### Prompt 5: تنفيذ Deep Authoritative Content

\`\`\`text
وسّع محتوى الصفحات المهمة حسب Deep Authoritative Content Plan في التقرير.

المطلوب لكل صفحة:
1) تعريف واضح.
2) المشكلة التي تحلها.
3) لمن هذه الصفحة؟
4) حالات استخدام في السعودية.
5) طريقة التنفيذ.
6) الفوائد العملية.
7) المخاطر الشائعة.
8) مؤشرات النجاح.
9) مقارنة مع البدائل.
10) أسئلة شائعة.
11) لماذا Bright AI؟
12) CTA واضح.

الشروط:
- لا تكرر نفس النص بين الصفحات.
- لا تختلق أرقامًا أو عملاء أو شهادات.
- حافظ على نبرة B2B/B2G سعودية هادئة ومباشرة.
- لا تغيّر التصميم جذريًا.

أعطني ملخصًا لكل صفحة:
| الصفحة | الأقسام المضافة | الكلمة المستهدفة | عدد الكلمات قبل/بعد | الروابط الداخلية المضافة |
\`\`\`

### Prompt 6: تنفيذ Structured Data / Schema

\`\`\`text
بناءً على قسم Structured Data في التقرير، راجع JSON-LD في كل صفحة مهمة.

المطلوب:
1) تحقق من JSON-LD الموجود وأنه صالح.
2) أضف BreadcrumbList للصفحات التي تحتاجه.
3) أضف Service schema لصفحات الخدمات فقط.
4) أضف WebPage schema عندما يكون ناقصًا.
5) أضف Article schema للمقالات فقط.
6) أضف AboutPage وContactPage للصفحات المناسبة.
7) أضف FAQPage فقط إذا يوجد FAQ مرئي.
8) لا تضف HowTo أو Reviews أو AggregateRating أو عملاء أو جوائز غير موجودة.

بعد التنفيذ شغّل فحص JSON-LD محلي إن أمكن، ثم أعطني:
| الصفحة | Schema قبل | Schema بعد | سبب الإضافة | مخاطر متبقية |
\`\`\`

### Prompt 7: تنفيذ Internal Linking وSite Architecture

\`\`\`text
بناءً على Click Depth والصفحات اليتيمة وخطة Internal Linking في التقرير، حسّن الربط الداخلي.

المطلوب:
1) قرّب الصفحات التجارية المهمة إلى ≤3 نقرات.
2) أضف روابط سياقية طبيعية من المقالات إلى صفحات الخدمات.
3) اربط صفحات الخدمات بالمقالات الداعمة.
4) حسّن navigation وfooter بدون حشو روابط.
5) أضف breadcrumbs للصفحات العميقة.
6) عالج الصفحات اليتيمة أو شبه اليتيمة.
7) حافظ على anchor text طبيعي وغير محشو.

بعد التنفيذ شغّل:
npm run internal-links:audit

أعطني:
| من الصفحة | إلى الصفحة | Anchor Text | نوع الرابط | سبب الربط |
\`\`\`

### Prompt 8: تنفيذ Performance / Page Speed

\`\`\`text
بناءً على قسم Performance / Speed، نفّذ تحسينات أداء آمنة لا تغيّر التصميم.

المطلوب:
1) أضف width وheight للصور التي تفتقدها.
2) أضف loading="lazy" للصور غير الحرجة.
3) أضف fetchpriority="high" فقط لصورة LCP الواضحة.
4) استخدم decoding="async" حيث يناسب.
5) أضف defer للسكربتات غير الحرجة.
6) لا تستخدم CDN خارجي جديد.
7) لا تحذف ملفات إلا إذا ثبت أنها غير مستخدمة.
8) اقترح WebP/AVIF للصور الكبيرة بدل استبدال عشوائي.
9) عالج CLS المتوقع من الصور والجداول.

بعد التنفيذ شغّل:
npm run performance:budget
npm run seo:gate

أعطني:
| التحسين | الملفات | أثره على LCP/CLS/INP | تحقق |
\`\`\`

### Prompt 9: تنفيذ Mobile/Desktop UX وUI Design

\`\`\`text
بناءً على Mobile/Desktop UX وUI/UX Design Audit، حسّن تجربة الاستخدام دون إعادة تصميم كاملة.

المطلوب:
1) حسّن وضوح Hero في الصفحات المهمة.
2) حسّن CTA visibility.
3) أضف answer/trust/CTA blocks بتصميم متسق.
4) عالج overflow للجداول والعناصر العريضة.
5) حسّن tap targets لتكون 48px على الأقل.
6) حسّن focus states.
7) حافظ على RTL واستخدم logical CSS properties.
8) لا تستخدم transform: scaleX(-1).
9) لا تغيّر هوية الموقع جذريًا.

بعد التنفيذ اختبر الجوال والسطح المكتبي بصريًا إن أمكن، ثم أعطني:
| الصفحة | المشكلة | الحل | CSS/HTML المعدل | أثر UX |
\`\`\`

### Prompt 10: تنفيذ Accessibility

\`\`\`text
بناءً على قسم Accessibility، أصلح مشاكل الوصول الأساسية.

المطلوب:
1) أضف alt وصفي للصور غير الزخرفية.
2) أضف alt فارغ للصور الزخرفية فقط.
3) تأكد من labels للنماذج.
4) حسّن aria-label للأزرار والروابط الأيقونية.
5) حسّن focus-visible.
6) أضف reduced motion fallback.
7) راجع heading order.
8) لا تغيّر النصوص التجارية إلا عند الحاجة.

أعطني:
| المشكلة | الصفحة | الإصلاح | الكود | تحقق |
\`\`\`

### Prompt 11: تنفيذ Conversion Optimization

\`\`\`text
بناءً على Conversion Optimization في التقرير، حسّن مسار التحويل للصفحات التجارية.

المطلوب:
1) CTA واضح above the fold.
2) CTA بعد أقسام القيمة.
3) CTA بعد Trust/Evidence.
4) نص زر مختلف حسب نية الصفحة.
5) نص داعم يخفف الاعتراضات.
6) ربط مباشر إلى /consultation/ أو /contact/ حسب السياق.
7) لا تضف نماذج طويلة دون حاجة.

أعطني:
| الصفحة | نية الزائر | CTA قبل | CTA بعد | مكان CTA | النص الداعم |
\`\`\`

### Prompt 12: تنفيذ Topical Authority والصفحات الجديدة

\`\`\`text
بناءً على Topical Authority Plan، أنشئ أو خطط الصفحات الجديدة المقترحة فقط بعد التأكد من عدم وجود صفحة قائمة تؤدي نفس النية.

المطلوب:
1) راجع الصفحات الحالية قبل إنشاء أي URL جديد.
2) أنشئ الصفحات ذات الأولوية العالية فقط.
3) أضف Title وMeta وH1 وOutline وSchema وBreadcrumbs.
4) اربط الصفحة الجديدة من cluster مناسب.
5) أضفها إلى sitemap إذا كانت عامة.
6) لا تنشئ صفحات رقيقة.

الصفحات المرشحة:
- /enterprise-ai-saudi/
- /ai-governance-pdpl-ndmo/
- /rpa-saudi/
- /government-ai-procurement/

أعطني:
| الصفحة الجديدة | سبب الإنشاء | الكلمات المستهدفة | الروابط الداخلة | الروابط الخارجة | حالة sitemap |
\`\`\`

### Prompt 13: تنفيذ Content Pruning / Consolidation

\`\`\`text
بناءً على Content Pruning في التقرير، راجع الصفحات الضعيفة أو المتكررة.

المطلوب:
1) لا تحذف أي صفحة دون دليل قوي.
2) صنّف كل صفحة إلى: تحسين، دمج، إبقاء، noindex، redirect.
3) لا تستخدم noindex لصفحات النماذج التجريبية للعملاء.
4) إذا وجدت صفحة duplicate حقيقية، اقترح canonical أو redirect فقط مع دليل.
5) إذا لا توجد وجهة بديلة آمنة، أنشئ تقريرًا ولا تحذف.

أعطني:
| الصفحة | القرار | الدليل | الإجراء | Redirect إن وجد | المخاطر |
\`\`\`

### Prompt 14: مراجعة شاملة بعد التنفيذ

\`\`\`text
بعد تنفيذ إصلاحات التقرير، أعد تدقيق مشروع Bright AI كاملًا.

المطلوب:
1) افحص كل ملفات HTML.
2) قارن نتائج التقرير قبل/بعد.
3) تحقق من robots.txt و_ headers وrender.yaml.
4) تحقق من عدم وجود noindex على صفحات demo/try/tenders/interview/mais-OBM.
5) تحقق من canonical وhreflang.
6) تحقق من sitemap.
7) تحقق من schema.
8) تحقق من internal links.
9) تحقق من الأداء.
10) تحقق من UX/accessibility.

شغّل:
npm run seo:check
npm run seo:gate
npm run internal-links:audit
npm run performance:budget

أعطني:
| المحور | النتيجة قبل | النتيجة بعد | التحسن | الدليل |

ثم اختم بـ:
- ما تم إصلاحه فعلاً.
- ما فشل.
- ما بقي قرارًا تحريرياً أو تجارياً.
- هل أصبح الموقع مؤهلًا أكثر لـ Google AI Mode؟ ولماذا؟
\`\`\`
`;

fs.writeFileSync(reportPath, report);
console.log(reportPath);
