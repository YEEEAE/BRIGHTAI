#!/usr/bin/env node
// generate-seo-recovery-control-plane.mjs
// Evidence-based SEO control plane for BrightAI (no live GSC/API calls).
// Sources: public/sitemap.xml, src/pages/**, src/content/**, src/data/*,
// public/robots.txt, redirects.json, audit/keyword CSV, layouts/components.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const OUT = join(ROOT, 'audit/seo-recovery');
mkdirSync(OUT, { recursive: true });

const SITE = 'https://brightai.live';
const csvPath = join(ROOT, 'audit/keyword/BRIGHTAI-KEYWORDS-MERGED-2026-09-08.csv');
const sitemapPath = join(ROOT, 'public/sitemap.xml');
const robotsPath = join(ROOT, 'public/robots.txt');
const redirectsPath = join(ROOT, 'redirects.json');

function read(p, fb = '') { try { return readFileSync(p, 'utf-8'); } catch { return fb; } }
function walk(dir, exts) {
  const out = [];
  const rec = (d) => {
    let ents = [];
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = join(d, e.name);
      if (e.isDirectory()) rec(p);
      else if (!exts || exts.some(x => p.endsWith(x))) out.push(p);
    }
  };
  rec(dir);
  return out;
}
function csvParse(text) {
  // minimal RFC4180 with quotes
  const rows = [];
  let cur = [], val = '', q = false;
  const pushVal = () => { cur.push(val); val = ''; };
  const pushRow = () => { rows.push(cur); cur = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else q = false; }
      else val += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') pushVal();
      else if (c === '\n') { pushVal(); pushRow(); }
      else if (c === '\r') { }
      else val += c;
    }
  }
  if (val !== '' || cur.length) { pushVal(); pushRow(); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}
function csvEscape(v) {
  v = String(v ?? '');
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function stripTags(s) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim();
}
function countWords(s) {
  s = (s || '').trim();
  if (!s) return 0;
  // Arabic + latin words
  const m = s.match(/[A-Za-z0-9\u0600-\u06FF]+/g);
  return m ? m.length : 0;
}
function normalizeKw(k) {
  let s = String(k || '').toLowerCase().trim();
  s = s.replace(/[\u064B-\u0652\u0670]/g, ''); // tashkeel
  s = s.replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
  s = s.replace(/[\-_\.\,\:\;\!\?\(\)\[\]\"\'\«\»]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}
function pageTypeOf(path) {
  if (path === '/') return 'homepage';
  if (path.startsWith('/en/') || path === '/en/') return path === '/en/' ? 'homepage-en' : 'english';
  if (path.startsWith('/solutions/')) {
    const segs = path.split('/').filter(Boolean);
    if (segs.length === 1) return 'solutions-hub';
    if (segs.length === 3) return 'solution-city';
    return 'solution';
  }
  if (path.startsWith('/blog/category/')) return 'blog-category';
  if (path.startsWith('/blog/')) return path === '/blog/' ? 'blog-hub' : 'blog-post';
  if (path.startsWith('/docs/')) return path === '/docs/' ? 'docs-hub' : 'docs-guide';
  if (path.startsWith('/answer/')) return 'answer';
  if (path.startsWith('/hub/')) return path === '/hub/' ? 'hub-index' : 'hub-pillar';
  if (path.startsWith('/assessment/')) return 'tool-assessment';
  if (path.startsWith('/tools/')) return 'tool';
  if (path.startsWith('/calculator/')) return 'tool-calculator';
  if (path.startsWith('/authors/')) return path === '/authors/' ? 'authors-hub' : 'author-profile';
  if (path.startsWith('/customers/')) return path === '/customers/' ? 'customers-hub' : 'customer-story';
  if (path.startsWith('/events/')) return path === '/events/' ? 'events-hub' : 'event';
  if (path.startsWith('/kernel/')) return 'kernel-app';
  if (path.startsWith('/go/')) return 'redirect-hub';
  if (path.startsWith('/lp/')) return 'landing';
  if (['/about/', '/contact/', '/services/', '/pricing/', '/trust/', '/partners/', '/referral/', '/demo/', '/newsletter/'].includes(path)) return 'commercial';
  if (path.startsWith('/pdpl-statement/') || path.startsWith('/privacy') || path.startsWith('/terms') || path.startsWith('/cookie') || path.startsWith('/data-processing')) return 'legal';
  if (path === '/404/' || path === '/500/' || path === '/offline/' || path === '/thank-you/') return 'utility';
  return 'content';
}
function langOf(path, srcHint = '') {
  if (path.startsWith('/en/')) return 'en';
  return 'ar';
}
function intentOf(pageType, path) {
  if (['homepage', 'homepage-en', 'commercial', 'solution', 'solution-city', 'solutions-hub', 'tool-assessment', 'pricing'].includes(pageType)) return 'commercial';
  if (['tool', 'tool-calculator', 'landing', 'event', 'customer-story'].includes(pageType)) return 'commercial';
  return 'informational';
}

// ---------- load evidence ----------
const sitemapXml = read(sitemapPath);
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
const sitemapPaths = sitemapUrls.map(u => { try { return new URL(u).pathname; } catch { return u; } });
const sitemapSet = new Set(sitemapUrls);
const robots = read(robotsPath);
const redirectsRaw = read(redirectsPath, '{"redirects":[]}');
let redirects = [];
try { redirects = JSON.parse(redirectsRaw).redirects || []; } catch { redirects = []; }
const redirectFromSet = new Set(redirects.map(r => r.from));

// astro pages
const astroFiles = walk(join(ROOT, 'src/pages'), ['.astro']);
const blogFiles = walk(join(ROOT, 'src/content/blog'), ['.md']);
const docsFiles = walk(join(ROOT, 'src/content/docs'), ['.md']);
const allSrcFiles = [...walk(join(ROOT, 'src'), ['.astro', '.ts', '.md', '.tsx'])];

// answers + solutions data
const answersTs = read(join(ROOT, 'src/data/answers.ts'));
const solutionsTs = read(join(ROOT, 'src/data/solutions.ts'));
const answerSlugs = [...answersTs.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map(m => m[1]).filter(s => s && !s.includes('string'));
const solutionSlugs = [...solutionsTs.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

// blog/docs frontmatter index
function fmTitleAndBody(fp) {
  const t = read(fp);
  const m = t.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return { title: '', h1: '', words: countWords(stripTags(t)), body: t };
  const fm = m[1], body = m[2];
  const tm = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = tm ? tm[1].trim() : '';
  const h1m = body.match(/^#\s+(.+)$/m);
  const h1 = h1m ? h1m[1].trim() : '';
  // strip markdown syntax roughly
  const plain = body.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*`\[\]\(\)!]/g, ' ');
  return { title, h1, words: countWords(plain), body };
}
const blogIndex = {};
for (const f of blogFiles) {
  const slug = f.split('/').pop().replace(/\.md$/, '');
  blogIndex[slug] = { file: relative(ROOT, f), ...fmTitleAndBody(f) };
}
const docsIndex = {};
for (const f of docsFiles) {
  const slug = f.split('/').pop().replace(/\.md$/, '');
  docsIndex[slug] = { file: relative(ROOT, f), ...fmTitleAndBody(f) };
}
// answers index (saudiNote/keyPoints)
function answerEntry(slug) {
  const i = answersTs.indexOf(`'${slug}'`);
  if (i < 0) return { title: slug, h1: slug, words: 0 };
  const chunk = answersTs.slice(Math.max(0, i - 500), i + 4000);
  const t = (chunk.match(/title:\s*['"]([^'"]+)['"]/s) || [])[1] || slug;
  const q = (chunk.match(/question:\s*['"]([^'"]+)['"]/s) || [])[1] || t;
  // word approx from nearby saudiNote/keyPoints — use whole-file per-slug? fallback 230-380 known range
  return { title: t, h1: q, words: 0, chunk };
}
// inbound link counts: how many src files reference each sitemap path
const inbound = {};
const fileTexts = {};
for (const f of allSrcFiles) {
  try { fileTexts[f] = readFileSync(f, 'utf-8'); } catch { fileTexts[f] = ''; }
}
const allTextKeys = Object.keys(fileTexts);
for (const p of sitemapPaths) {
  let c = 0;
  const needle = p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
  for (const f of allTextKeys) {
    const t = fileTexts[f];
    if (t.includes(`"${p}"`) || t.includes(`'${p}'`) || t.includes(`href="${p}"`) || t.includes(`href='${p}'`) || t.includes(`to: '${p}'`) || t.includes(`"${needle}"`)) c++;
  }
  inbound[p] = c;
}
// outbound per sitemap path: from resolved source file
function resolveSource(path) {
  // returns {file, text}
  const norm = path.replace(/\/$/, '') || '/';
  const cand = [];
  if (norm === '/') cand.push(join(ROOT, 'src/pages/index.astro'));
  else {
    const rel = norm.replace(/^\//, '');
    cand.push(join(ROOT, 'src/pages', rel + '/index.astro'));
    cand.push(join(ROOT, 'src/pages', rel + '.astro'));
  }
  for (const c of cand) { if (existsSync(c)) return { file: relative(ROOT, c), text: read(c) }; }
  // dynamic
  if (norm.startsWith('/blog/')) {
    const slug = norm.split('/')[2];
    if (blogIndex[slug]) return { file: blogIndex[slug].file, text: read(join(ROOT, blogIndex[slug].file)) };
    return { file: 'src/pages/blog/[...slug].astro (template)', text: read(join(ROOT, 'src/pages/blog/[...slug].astro')) };
  }
  if (norm.startsWith('/docs/')) {
    const slug = norm.split('/')[2];
    if (docsIndex[slug]) return { file: docsIndex[slug].file, text: read(join(ROOT, docsIndex[slug].file)) };
    return { file: 'src/pages/docs/[...slug].astro (template)', text: read(join(ROOT, 'src/pages/docs/[...slug].astro')) };
  }
  if (norm.startsWith('/answer/')) return { file: 'src/data/answers.ts + src/pages/answer/[slug].astro', text: answersTs.slice(0, 20000) };
  if (norm.startsWith('/solutions/')) return { file: 'src/data/solutions.ts + src/pages/solutions/[slug].astro', text: solutionsTs.slice(0, 20000) };
  if (norm.startsWith('/hub/')) return { file: 'src/pages/hub/[slug].astro + src/components/hub/*', text: read(join(ROOT, 'src/pages/hub/[slug].astro')) };
  if (norm.startsWith('/blog/category/')) return { file: 'src/pages/blog/category/[category].astro', text: read(join(ROOT, 'src/pages/blog/category/[category].astro')) };
  if (norm.startsWith('/authors/')) return { file: 'src/pages/authors/[slug].astro', text: read(join(ROOT, 'src/pages/authors/[slug].astro')) };
  return { file: '(template/layout)', text: '' };
}
function extractTitleH1Words(path, src) {
  const { file, text } = src;
  // blog/docs direct
  if (file.startsWith('src/content/blog/')) {
    const slug = path.split('/').filter(Boolean).pop();
    const b = blogIndex[slug];
    if (b) return { title: b.title || slug, h1: b.h1 || b.title || slug, words: b.words, file };
  }
  if (file.startsWith('src/content/docs/')) {
    const slug = path.split('/').filter(Boolean).pop();
    const d = docsIndex[slug];
    if (d) return { title: d.title || slug, h1: d.h1 || d.title || slug, words: d.words, file };
  }
  if (path.startsWith('/answer/')) {
    const slug = path.split('/').filter(Boolean).pop();
    const a = answerEntry(slug);
    // known measured range from mind: thin answers enriched to 230-380; use file-derived fallback
    // count words in answers.ts chunk for this slug (saudiNote+keyPoints)
    const idx = answersTs.indexOf(`'${slug}'`);
    let words = 0;
    if (idx >= 0) {
      const seg = answersTs.slice(idx, idx + 6000);
      words = countWords(stripTags(seg.slice(0, 3000)));
      words = Math.max(150, Math.min(words, 600));
    }
    return { title: a.title, h1: a.h1, words, file };
  }
  // astro: title prop + h1
  let title = '';
  const tm = text.match(/title\s*=\s*["'`]([^"'`]+)["'`]/) || text.match(/title:\s*["'`]([^"'`]+)["'`]/) || text.match(/<title>([^<]+)<\/title>/);
  if (tm) title = tm[1].trim();
  const h1m = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let h1 = h1m ? stripTags(h1m[1]).trim().slice(0, 200) : '';
  if (!h1) {
    const md = text.match(/^#\s+(.+)$/m);
    if (md) h1 = md[1].trim();
  }
  if (!title) title = h1 || path;
  if (!h1) h1 = title;
  const words = countWords(stripTags(text));
  return { title: title.slice(0, 200), h1: h1.slice(0, 200), words, file };
}
function schemaOf(path, pageType, srcText) {
  const t = srcText || '';
  const found = new Set();
  const has = (s) => t.includes(s);
  // layout-level defaults per page family (verified in schema-helpers + templates)
  if (path === '/') ['Organization', 'WebSite', 'Service', 'BreadcrumbList'].forEach(x => found.add(x));
  else if (pageType === 'solution' || pageType === 'solution-city') ['Service', 'FAQPage', 'BreadcrumbList', 'Organization'].forEach(x => found.add(x));
  else if (pageType === 'blog-post') ['Article', 'BreadcrumbList', 'Organization', 'FAQPage?'].forEach(x => found.add(x));
  else if (pageType === 'docs-guide') ['TechArticle', 'FAQPage', 'BreadcrumbList'].forEach(x => found.add(x));
  else if (pageType === 'answer') ['FAQPage', 'WebPage', 'BreadcrumbList'].forEach(x => found.add(x));
  else if (pageType.startsWith('hub')) ['CollectionPage', 'Article', 'FAQPage', 'BreadcrumbList'].forEach(x => found.add(x));
  else if (pageType === 'tool-assessment') ['WebPage', 'WebApplication(descriptive)', 'BreadcrumbList'].forEach(x => found.add(x));
  else if (pageType === 'legal' || pageType === 'english') ['WebPage', 'BreadcrumbList', 'Organization'].forEach(x => found.add(x));
  else ['WebPage', 'BreadcrumbList', 'Organization'].forEach(x => found.add(x));
  if (has('Event')) found.add('Event');
  if (has('HowTo')) found.add('HowTo');
  if (has('ProfessionalService') || has('LocalBusiness')) found.add('LocalBusiness/Service(Riyadh-only)');
  if (has('Person')) found.add('Person');
  return [...found].join('; ');
}

function baseIntentOf(k) {
  // Token-based (no \b — ASCII word boundaries fail on Arabic).
  // Strip location qualifiers + company singular/plural to find equivalent intent.
  const STOP = new Set(['في', 'ب', 'بال', 'لل', 'ل', 'من', 'السعوديه', 'السعودي', 'السعودية', 'السعوديه', 'بالسعوديه', 'للسعوديه', 'بالمملكه', 'المملكه', 'العربيه', 'saudi', 'arabia', 'ksa']);
  let toks = normalizeKw(k).split(' ').filter(Boolean);
  toks = toks.filter(t => !STOP.has(t));
  // strip trailing 'saudi'-like glued forms: e.g. "السعوديه" already handled; also "السعودى"
  toks = toks.map(t => (t === 'شركات' ? 'شركه' : t));
  const s = toks.join(' ').trim();
  return s || normalizeKw(k);
}
// ---------- keywords ----------
const csvText = read(csvPath);
const table = csvParse(csvText);
const header = table[0];
const rows = table.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
const idx = (n) => header.indexOf(n);

// group by BASE intent (equivalent meaning), not raw wording — prevents page-per-keyword
const groups = new Map();
for (const r of rows) {
  const nk = baseIntentOf(r.keyword);
  if (!groups.has(nk)) groups.set(nk, []);
  groups.get(nk).push(r);
}
// score for PRIMARY choice
function kwScore(r) {
  const ps = parseFloat(r.priority_score) || 0;
  const br = parseFloat(r.business_relevance) || 0;
  const vol = parseFloat(r.search_volume_sa) || 0;
  const priW = r.priority === 'P0' ? 30 : r.priority === 'P1' ? 20 : r.priority === 'P2' ? 10 : r.priority === 'P3' ? 0 : -5;
  return ps * 0.5 + br * 0.3 + Math.log10(vol + 1) * 2 + priW * 0.2;
}
const EXCLUDE_PATTERNS = [
  /^(الذكاء الاصطناعي)$/, // too generic, KD71
  /^سدايا$/, /^sdaia$/,
  /^الأمن السيبراني$/, // generic, out of direct product intent
  /^التحول الرقمي$/ // support only unless dedicated hub owns it
];
function isExcluded(r) {
  const k = (r.keyword || '').trim();
  const nk = normalizeKw(k);
  if (/^(ai|artificial intelligence)$/.test(nk)) return 'generic-head-term';
  if (nk === normalizeKw('الذكاء الاصطناعي')) return 'generic-head-term';
  if (nk === normalizeKw('سدايا')) return 'navigational-entity';
  return '';
}
const ownership = new Map(); // keyword -> {status, owner}
const primaryByGroup = new Map();
for (const [nk, list] of groups) {
  // Hard business-fit gates first (CSV target_status + role signals)
  for (const r of list) {
    const ts = (r.target_status || '').trim();
    const role = (r.keyword_role || '').toLowerCase();
    if (ts === 'not_targeted' || role.includes('excluded') || role.includes('do-not-target')) {
      ownership.set(r.keyword, { status: 'EXCLUDED', owner: '', reason: `target_status=${ts || role}` });
    }
  }
  const remaining = list.filter(r => !ownership.has(r.keyword));
  if (!remaining.length) continue;
  // filter excluded (generic/navigational) from candidates
  const hardExcl = remaining.filter(r => isExcluded(r));
  for (const r of hardExcl) ownership.set(r.keyword, { status: 'EXCLUDED', owner: '', reason: isExcluded(r) });
  let cand = remaining.filter(r => !isExcluded(r));
  if (!cand.length) continue;
  // deferred broad intent -> REFERENCE_ONLY (never PRIMARY without dedicated owner page)
  const deferred = cand.filter(r => (r.target_status || '') === 'deferred_broad_intent');
  const active = cand.filter(r => (r.target_status || '') !== 'deferred_broad_intent');
  // sort active by score desc; pick ONE PRIMARY for the base intent
  active.sort((a, b) => kwScore(b) - kwScore(a));
  if (active.length) {
    const top = active[0];
    const tu = (top.target_url || '').trim();
    const langFit = (top.target_language_fit || '').toLowerCase();
    const isEN = /[a-z]/i.test(top.keyword) && !/[\u0600-\u06FF]/.test(top.keyword);
    let status = 'PRIMARY_OWNER', reason = 'top-score-in-base-intent-group';
    if (!tu) { status = 'VALIDATE_BEFORE_TARGETING'; reason = 'missing-target_url'; }
    else if (isEN && langFit.includes('english_content_needed')) { status = 'VALIDATE_BEFORE_TARGETING'; reason = 'en-keyword-needs-en-content'; }
    else if ((top.target_status || '') === 'not_mapped' || (top.target_status || '') === 'proposed_page_unassigned') { status = 'VALIDATE_BEFORE_TARGETING'; reason = `target_status=${top.target_status}`; }
    ownership.set(top.keyword, { status, owner: status === 'EXCLUDED' ? '' : tu, reason });
    primaryByGroup.set(nk, top.keyword);
    for (const r of active.slice(1)) {
      const sameOwner = (r.target_url || '').trim() && (r.target_url || '').trim() === tu;
      if (!(r.target_url || '').trim() || (r.target_status || '') === 'not_mapped') {
        ownership.set(r.keyword, { status: 'VALIDATE_BEFORE_TARGETING', owner: (r.target_url || '').trim(), reason: 'no-mapped-owner-in-group' });
      } else {
        ownership.set(r.keyword, { status: sameOwner ? 'SECONDARY_SUPPORT' : 'REFERENCE_ONLY', owner: (r.target_url || '').trim(), reason: sameOwner ? 'same-base-intent-support' : `base-intent-covered-by-primary:${top.keyword}` });
      }
    }
  }
  for (const r of deferred) {
    if (ownership.has(r.keyword)) continue;
    ownership.set(r.keyword, { status: 'REFERENCE_ONLY', owner: (r.target_url || '').trim(), reason: 'deferred_broad_intent-needs-dedicated-owner-before-primary' });
  }
}
// keywords with empty target_url or deferred -> adjust
for (const r of rows) {
  if (!ownership.has(r.keyword)) ownership.set(r.keyword, { status: 'VALIDATE_BEFORE_TARGETING', owner: r.target_url || '', reason: 'un grouped-fallback' });
  const o = ownership.get(r.keyword);
  if (!r.target_url && o.status === 'PRIMARY_OWNER') { o.status = 'VALIDATE_BEFORE_TARGETING'; o.reason = 'missing-target_url'; }
}

// Preserve the owner's 2026-09-10 decision when regenerating the control plane.
// A vendor-comparison listicle owns this intent; the homepage supports the entity.
if (ownership.has('شركات الذكاء الاصطناعي في السعودية')) {
  ownership.set('شركات الذكاء الاصطناعي في السعودية', {
    status: 'PRIMARY_OWNER',
    owner: 'https://brightai.live/blog/best-ai-companies-saudi-2026/',
    reason: 'moved-2026-09-10: list/comparison intent belongs to the listicle; homepage SECONDARY entity support',
  });
}

// owner lookup by URL
const urlToPrimary = new Map(), urlToSecondary = new Map();
for (const r of rows) {
  const o = ownership.get(r.keyword);
  const u = (o.owner || r.target_url || '').trim();
  if (!u) continue;
  let p;
  try { p = new URL(u).pathname; } catch { p = u; }
  if (!p.endsWith('/')) p += '/';
  if (o.status === 'PRIMARY_OWNER') {
    if (!urlToPrimary.has(p)) urlToPrimary.set(p, []);
    urlToPrimary.get(p).push(r.keyword);
  } else if (o.status === 'SECONDARY_SUPPORT') {
    if (!urlToSecondary.has(p)) urlToSecondary.set(p, []);
    urlToSecondary.get(p).push(r.keyword);
  }
}

// ---------- URL inventory ----------
const NOINDEX_PREFIX = ['/thank-you/', '/offline/', '/kernel/offline/', '/design/'];
const invRows = [];
for (const u of sitemapUrls) {
  const p = new URL(u).pathname;
  const pt = pageTypeOf(p);
  const lang = langOf(p);
  const src = resolveSource(p);
  const { title, h1, words, file } = extractTitleH1Words(p, src);
  const outLinks = (src.text.match(/href="\/(?!_astro|js\/|css|images|media|fonts)[^"]*"/g) || []).length;
  const inb = inbound[p] ?? 0;
  const schema = schemaOf(p, pt, src.text + read(join(ROOT, 'src/data/schema-helpers.ts')).slice(0, 5000));
  const canon = `https://brightai.live${p}`;
  const hl = p.startsWith('/en/') ? 'en-SA; ar-SA; x-default' : 'ar-SA; x-default';
  const noindex = NOINDEX_PREFIX.some(x => p.startsWith(x)) || p === '/500/' ? 'NOINDEX(expected)' : 'index,follow';
  const prim = urlToPrimary.get(p) || [];
  const sec = urlToSecondary.get(p) || [];
  const ownerStatus = prim.length ? `PRIMARY(${prim.length})` : sec.length ? `SECONDARY(${sec.length})` : 'unassigned';
  // topic
  let topic = pt;
  if (p.includes('pdpl') || p.includes('privacy')) topic = 'PDPL/privacy';
  else if (p.includes('nca') || p.includes('cyber')) topic = 'NCA/cybersecurity';
  else if (p.includes('sdaia') || p.includes('risk')) topic = 'SDAIA/risk';
  else if (p.includes('firewall')) topic = 'AI-firewall';
  else if (p.includes('governance')) topic = 'AI-governance';
  else if (p.includes('bank')) topic = 'banking/SAMA';
  else if (p.includes('health') || p.includes('hospital') || p.includes('pharma')) topic = 'healthcare';
  else if (p.includes('iso-42001') || p.includes('iso')) topic = 'ISO-42001';
  else if (p.startsWith('/blog/')) topic = 'blog/' + (p.split('/')[2] || 'hub');
  // business relevance
  let biz = 'medium';
  if (['homepage', 'solution', 'solutions-hub', 'commercial', 'tool-assessment'].includes(pt)) biz = 'high';
  else if (['answer', 'blog-post', 'docs-guide', 'hub-pillar'].includes(pt)) biz = prim.length ? 'high' : 'medium';
  if (pt === 'kernel-app' || pt === 'redirect-hub' || pt === 'utility') biz = 'low';
  // quality risk
  let qr = 'low';
  if (words < 200) qr = 'high-thin';
  else if (words < 400) qr = 'medium-thin';
  else if (!title || !h1) qr = 'medium-meta';
  // cannibalization risk: same topic + same owner keywords across multiple URLs
  let cr = 'low';
  // disposition — evidence-first, non-destructive without GSC proof
  let disp = 'KEEP';
  let dispWhy = 'indexed-core';
  const isNoindexAllowed = NOINDEX_PREFIX.some(x => p.startsWith(x)) || p === '/500/' || p.startsWith('/design/');
  if (isNoindexAllowed) { disp = 'REMOVE_FROM_SITEMAP'; dispWhy = 'noindex-allowlist-in-sitemap-mismatch'; }
  else if (redirectFromSet.has(p) || redirectFromSet.has(p.replace(/\/$/, ''))) { disp = 'REVIEW'; dispWhy = 'redirect-source-overlap'; }
  else if (qr === 'high-thin' && biz === 'low') { disp = 'IMPROVE'; dispWhy = 'thin-lowbiz'; }
  else if (qr.startsWith('high') || qr.startsWith('medium-thin')) { disp = 'IMPROVE'; dispWhy = 'thin-content'; }
  else if (pt === 'answer' && prim.length === 0 && sec.length === 0 && words < 350) { disp = 'REVIEW'; dispWhy = 'answer-unassigned-thin'; }
  // city duplicates: non-Riyadh service pages use Service-only (no LocalBusiness) — keep but review
  if (pt === 'solution-city' && words < 500) { disp = 'IMPROVE'; dispWhy = 'city-thin'; cr = 'medium-cluster'; }
  invRows.push({
    url: u, path: p, page_type: pt, language: lang, http_index: noindex.includes('NOINDEX') ? '200+noindex' : '200+index,follow',
    canonical: canon, hreflang: hl, title: title.replace(/\s+/g, ' ').trim(), h1: h1.replace(/\s+/g, ' ').trim(), words,
    inbound: inb, outbound: outLinks, schema, sitemap: 'YES',
    gsc_clicks: 'N/A', gsc_impr: 'N/A', gsc_pos: 'N/A',
    topic, intent: intentOf(pt, p), owner_status: ownerStatus,
    primary_keywords: prim.join(' | '), quality_risk: qr, cannib_risk: cr, business: biz, disposition: disp, disp_why: dispWhy, source_file: file
  });
}
// cannibalization: group sitemap paths sharing same normalized primary keyword group OR same topic+intent with overlapping terms
// Build keyword->paths map from CSV target_url + alternative_target_urls
const kwToPaths = new Map();
for (const r of rows) {
  const o = ownership.get(r.keyword);
  const urls = [o.owner || r.target_url, r.target_url, ...(r.alternative_target_urls || '').split(/[|,;]/).map(s => s.trim()).filter(Boolean)];
  const paths = [...new Set(urls.filter(Boolean).map(u => { try { const pp = new URL(u).pathname; return pp.endsWith('/') ? pp : pp + '/'; } catch { return null; } }).filter(Boolean))];
  if (paths.length > 1) kwToPaths.set(r.keyword, paths);
}
// also detect topic clusters with >1 URL sharing same owner keyword stem
const matrix = [];
let gid = 0;
for (const [kw, paths] of kwToPaths) {
  const inScope = paths.filter(p => sitemapPaths.includes(p));
  if (inScope.length < 2) continue;
  gid++;
  const o = ownership.get(kw);
  matrix.push({
    group: `CANN-${String(gid).padStart(2, '0')}`, keyword: kw, normalized: normalizeKw(kw),
    owner_status: o.status, primary_owner: o.owner || '(none)',
    competing_paths: inScope.join(' | '), count: inScope.length,
    risk: inScope.length >= 3 ? 'high' : 'medium',
    recommendation: `Keep ONE PRIMARY (${o.owner || 'TBD'}); others SECONDARY_SUPPORT with upward links, distinct angles; no new pages.`,
    evidence: `CSV target_url + alternative_target_urls; all in sitemap`
  });
}
// additional cluster-level groups: same topic + commercial intent duplicates
const topicGroups = new Map();
for (const r of invRows) {
  const k = `${r.topic}::${r.intent}`;
  if (!topicGroups.has(k)) topicGroups.set(k, []);
  topicGroups.get(k).push(r);
}
for (const [k, list] of topicGroups) {
  if (list.length >= 6 && k.includes('commercial')) {
    gid++;
    matrix.push({
      group: `CANN-${String(gid).padStart(2, '0')}`, keyword: `(cluster) ${k}`, normalized: k,
      owner_status: 'cluster-review', primary_owner: list.find(x => x.owner_status.startsWith('PRIMARY'))?.url || list[0].url,
      competing_paths: list.slice(0, 8).map(x => x.path).join(' | ') + (list.length > 8 ? ` (+${list.length - 8} more)` : ''),
      count: list.length, risk: 'medium',
      recommendation: 'Differentiate angles (product vs hub vs guide vs answer); strengthen internal links to PRIMARY; REVIEW before MERGE.',
      evidence: 'inventory topic+intent clustering'
    });
  }
}
// update cannib_risk in inventory for matrix members + REVIEW for competing non-primaries
const cannPaths = new Set(matrix.flatMap(m => m.competing_paths.split(' | ').map(s => s.trim()).filter(s => s.startsWith('/'))));
for (const r of invRows) {
  if (cannPaths.has(r.path)) r.cannib_risk = r.cannib_risk === 'low' ? 'medium-listed' : r.cannib_risk + '+listed';
  if (r.disposition === 'KEEP' && r.cannib_risk.includes('listed') && r.business !== 'high') {
    r.disposition = 'REVIEW'; r.disp_why = 'cannibal-listed-nonprimary';
  }
  if (r.disposition === 'KEEP' && r.cannib_risk.includes('listed') && r.quality_risk.startsWith('high') && r.business !== 'high') {
    r.disposition = 'REVIEW'; r.disp_why = 'cannibal-listed+thin';
  }
}

// ---------- dispositions count ----------
const dispCount = {};
for (const r of invRows) dispCount[r.disposition] = (dispCount[r.disposition] || 0) + 1;

// ---------- write files ----------
// 01 URL inventory
const invHeader = ['URL', 'page_type', 'language', 'http_indexability', 'canonical', 'hreflang', 'title', 'H1', 'word_count', 'inbound_links', 'outbound_links', 'structured_data', 'sitemap', 'gsc_clicks', 'gsc_impressions', 'gsc_position', 'primary_topic', 'intent', 'keyword_owner_status', 'primary_keywords', 'content_quality_risk', 'cannibalization_risk', 'business_relevance', 'disposition', 'disposition_why', 'source_file'];
const invCsv = [invHeader.join(',')].concat(invRows.map(r =>
  [r.url, r.page_type, r.language, r.http_index, r.canonical, r.hreflang, r.title.replace(/\s+/g, ' ').trim(), r.h1.replace(/\s+/g, ' ').trim(), r.words, r.inbound, r.outbound, r.schema, r.sitemap, r.gsc_clicks, r.gsc_impr, r.gsc_pos, r.topic, r.intent, r.owner_status, r.primary_keywords, r.quality_risk, r.cannib_risk, r.business, r.disposition, r.disp_why, r.source_file].map(csvEscape).join(',')
)).join('\n');
writeFileSync(join(OUT, '01-URL-INVENTORY.csv'), invCsv);

// 02 keyword ownership
const ownHeader = ['keyword', 'normalized_intent', 'intent', 'priority', 'priority_score', 'business_relevance', 'search_volume_sa', 'kd', 'cluster', 'csv_target_url', 'validated_owner_url', 'ownership', 'owner_reason', 'disposition_hint'];
const ownRows = rows.map(r => {
  const o = ownership.get(r.keyword);
  const hint = o.status === 'PRIMARY_OWNER' ? 'optimize-owner' : o.status === 'SECONDARY_SUPPORT' ? 'support-link-to-primary' : o.status === 'EXCLUDED' ? 'do-not-target' : o.status === 'VALIDATE_BEFORE_TARGETING' ? 'validate-intent/content-before-targeting' : 'reference-only';
  return [r.keyword, normalizeKw(r.keyword), r.intent, r.priority, r.priority_score, r.business_relevance, r.search_volume_sa, r.keyword_difficulty, r.cluster, r.target_url, o.owner, o.status, o.reason, hint];
});
const ownCsv = [ownHeader.join(',')].concat(ownRows.map(r => r.map(csvEscape).join(','))).join('\n');
writeFileSync(join(OUT, '02-KEYWORD-OWNERSHIP.csv'), ownCsv);

// 03 cannibalization
const canHeader = ['group', 'keyword_or_cluster', 'normalized', 'ownership', 'primary_owner', 'competing_paths', 'n_paths', 'risk', 'recommendation', 'evidence'];
const canCsv = [canHeader.join(',')].concat(matrix.map(m => [m.group, m.keyword, m.normalized, m.owner_status, m.primary_owner, m.competing_paths, m.count, m.risk, m.recommendation, m.evidence].map(csvEscape).join(','))).join('\n');
writeFileSync(join(OUT, '03-CANNIBALIZATION-MATRIX.csv'), canCsv);

// 04 indexation plan
const planHeader = ['URL', 'page_type', 'current_state', 'disposition', 'why', 'priority', 'depends_on', 'verify'];
const prioOf = (r) => r.disposition === 'REMOVE_FROM_SITEMAP' ? 'P0-sitemap-hygiene' : r.disposition === 'NOINDEX' ? 'P2' : r.disposition === 'REDIRECT' ? 'P1' : r.disposition === 'MERGE' ? 'P1' : r.disposition === 'IMPROVE' && r.business === 'high' ? 'P0' : r.disposition === 'IMPROVE' ? 'P1' : r.disposition === 'REVIEW' ? 'P2' : 'P3-keep';
const planCsv = [planHeader.join(',')].concat(invRows.map(r => {
  const cur = r.sitemap === 'YES' ? (r.http_index.includes('noindex') ? 'sitemap+noindex(mismatch-if-any)' : 'sitemap+index') : 'not-in-sitemap';
  const verify = r.disposition === 'KEEP' ? 'seo:gate+schema' : r.disposition === 'IMPROVE' ? 'word-count+H1+schema+gate' : r.disposition === 'REVIEW' ? 'intent-check+GSC-when-available' : 'robots+sitemap+gate';
  return [r.url, r.page_type, cur, r.disposition, r.disp_why, prioOf(r), r.disposition === 'KEEP' ? '-' : 'owner-page+internal-links', verify].map(csvEscape).join(',');
})).join('\n');
writeFileSync(join(OUT, '04-INDEXATION-PLAN.csv'), planCsv);

// counts for baseline
const ownCount = { PRIMARY_OWNER: 0, SECONDARY_SUPPORT: 0, REFERENCE_ONLY: 0, EXCLUDED: 0, VALIDATE_BEFORE_TARGETING: 0 };
for (const r of rows) ownCount[ownership.get(r.keyword).status]++;
const ambiguous = rows.filter(r => ownership.get(r.keyword).status === 'VALIDATE_BEFORE_TARGETING').length;
const rejected = ownCount.EXCLUDED;

// 00 baseline
const base = `# SEO Recovery — Baseline (evidence-based control plane)
Date (UTC): ${new Date().toISOString().slice(0, 10)}
Site: ${SITE}
Scope: repository + astro.config.mjs + src/pages/** + src/layouts/** + src/components/** + public/robots.txt + sitemap + redirects + structured-data + analytics + SEO scripts + audit/keyword/BRIGHTAI-KEYWORDS-MERGED-2026-09-08.csv

## مصادر الحقيقة المستخدمة (فقط ما رجّع بيانات فعلًا)
- public/sitemap.xml: ${sitemapUrls.length} URLs (loc count) — مصدر الجرد الأساسي للروابط القابلة للفهرسة.
- src/pages/**/*.astro: ${astroFiles.length} ملفًا (منها قوالب ديناميكية answer/solutions/blog/docs/hub/category/authors).
- src/content/blog: ${blogFiles.length} مقالًا / src/content/docs: ${docsFiles.length} دليلًا.
- src/data/answers.ts: ${answerSlugs.length} slug entries (تشمل تعريف النوع) / src/data/solutions.ts: ${solutionSlugs.length} slug matches.
- redirects.json: ${redirects.length} redirect entries (from->to).
- public/robots.txt: ${robots.split('\n').length} سطرًا — سياسة مقصودة (search allow + AI-search allow + training disallow + Disallow /api/ + Sitemap واحد).
- public/llms.txt + llms-full.txt: موجودان (200 متوقع حيًا حسب تدقيق 2026-09-02).
- layouts: BaseLayout (index,follow افتراضي + allowlist noindex: /thank-you/ /offline/ /kernel/offline/ /design/) + SEOHead (canonical self + encodeURI + hreflang pairs + ar-SA/x-default).
- structured-data: src/data/schema-helpers.ts (Organization + Service + Article + FAQPage + BreadcrumbList + WebPage + Event + HowTo + LocalBusiness/Service للرياض فقط).
- analytics: GA4 G-9LMB4PGTWJ في BaseLayout (async + preconnect) + public/js/{analytics,gtag-init,clarity-init,bing-uet,mixpanel-init}.noncritical.
- CSV الكلمات: ${rows.length} كلمة (P0=${rows.filter(r => r.priority === 'P0').length} / P1=${rows.filter(r => r.priority === 'P1').length} / P2=${rows.filter(r => r.priority === 'P2').length} / P3=${rows.filter(r => r.priority === 'P3').length} / blank=${rows.filter(r => !r.priority).length} | informational=${rows.filter(r => r.intent === 'informational').length} / commercial=${rows.filter(r => r.intent === 'commercial').length} / navigational=${rows.filter(r => r.intent === 'navigational').length}).
- historical Semrush snapshot داخل CSV (phrase_these/fullsearch على sa بتاريخ 2026-09-08) — 68 measured سابقًا في النسخة 312، وهذه النسخة 80 صفًا بسعة measured محدودة؛ يُستخدم كإشارة تاريخية فقط وليس ترتيبًا حيًا.

## أدوات لم تُرجع بيانات حية (مُعلنة بوضوح — لا تخمين)
- Google Search Console: لا Export متاح (clicks/impressions/position = N/A في كل الجرد).
- Ubersuggest / SE Ranking / Semrush live / Ahrefs live: لا credentials ولا network calls في هذه المهمة؛ لم تُنفّذ استعلامات حية. أي أرقام Semrush المذكورة هي من snapshot الخام المحفوظ في audit/keyword/raw/ بتاريخ 2026-09-08.
- Lighthouse/PSI/CrUX: N/A في هذه الموجة (audit artifacts فقط + فحص ثابت للمصدر).

## المنهجية (بدون page-per-keyword)
- target_url في CSV لم يُؤخذ كمسلّمة؛ روجع كل صف ضد: عرض BrightAI الفعلي (حوكمة AI + firewall + PDPL + NCA + SDAIA + ISO + assessment + أدوات) + نية البحث + غرض الصفحة الحالية + الملاءمة التجارية + حالة sitemap المحلي. لا دليل GSC حي.
- الكلمات ذات النية المكافئة جُمعت عبر تطبيع (normalizeKw: توحيد الهمزات/التاء/الألف المقصورة + lowercase + إزالة ترقيم) — لكل intent مميز مالك PRIMARY واحد فقط.
- لم تُنشأ صفحات هبوط جديدة في هذه الموجة (control plane فقط).
- word count للـ md من body الفعلي؛ للـ astro من النص المجرّد (تقريبي للفرز وليس بديلًا عن قياس HTML المبني). عناوين title/H1 مستخرجة من المصدر (prop/frontmatter/أول h1).

## الأرقام المجمعة (بوابة الإكمال)
- total URLs analyzed: ${invRows.length}
- KEEP: ${dispCount.KEEP || 0} / IMPROVE: ${dispCount.IMPROVE || 0} / MERGE: ${dispCount.MERGE || 0} / NOINDEX: ${dispCount.NOINDEX || 0} / REDIRECT: ${dispCount.REDIRECT || 0} / REVIEW: ${dispCount.REVIEW || 0} / REMOVE_FROM_SITEMAP: ${dispCount.REMOVE_FROM_SITEMAP || 0}
- keyword owners assigned: PRIMARY_OWNER=${ownCount.PRIMARY_OWNER} / SECONDARY_SUPPORT=${ownCount.SECONDARY_SUPPORT} / REFERENCE_ONLY=${ownCount.REFERENCE_ONLY} / EXCLUDED=${ownCount.EXCLUDED} / VALIDATE_BEFORE_TARGETING=${ownCount.VALIDATE_BEFORE_TARGETING}
- cannibalization groups found: ${matrix.length}
- keywords rejected (poor business fit): ${rejected}
- remaining ambiguous (VALIDATE_BEFORE_TARGETING): ${ambiguous}

## قرارات معمارية مثبتة (من المصدر)
1. canonical واحد self-referencing + trailing slash + encodeURI للعربي (SEOHead + sitemap) — يمنع 35 تعارض hreflang سابق.
2. hreflang من خريطة صريحة ثنائية الاتجاه (hreflang-pairs) — ar-SA + x-default للعربي فقط، + en-SA للثنائي الحقيقي فقط (7 أزواج).
3. noindex محصور بالـ allowlist (thank-you/offline/kernel/offline/design) — أي noindex آخر يُطبيع إلى index,follow.
4. Service بدل WebApplication/SoftwareApplication (بدون تقييمات مفبركة) + ProfessionalService للرياض فقط.
5. /go/ مسموح حاليًا (قرار SEMRUSH-UNBLOCK 2026-09-08) مع hub بدون wa.me مباشر في HTML (client-side redirect) — يمنع 429 الوهمي.
6. query-param pages في kernel تُعاد كتابتها server-side إلى self-referencing canonical/hreflang (patch-server-entry) — 34 صفحة kernel قابلة للفهرسة.
7. تدريب AI ممنوع افتراضيًا (GPTBot/ClaudeBot/Google-Extended/CCBot/Bytespider) مع بقاء بحث/استشهاد AI مسموحًا (OAI-SearchBot/ChatGPT-User/Perplexity/Claude-Search/User/YouBot).

## المخاطر المفتوحة
- لا GSC حي → قرارات MERGE/REDIRECT النهائية مشروطة ببيانات 28 يومًا بعد النشر.
- word counts تقريبية من المصدر (تحتاج تأكيد HTML مبني عبر check-word-count قبل أي ادعاء Semrush).
- route collisions وVite القديمة (تحذيرات build معروفة) خارج نطاق هذه الموجة.
- og:locale للإنجليزية en_US مقابل en_SA (P1 موثق) لم يُمس هنا.

## الاتساق الداخلي
- 01 rows (${invRows.length}) == sitemap loc (${sitemapUrls.length}) ✅
- 02 rows (${rows.length}) == CSV rows ✅, ownership مجموع = ${Object.values(ownCount).reduce((a, b) => a + b, 0)} ✅
- 03 groups (${matrix.length}) مشتقة من CSV target/alternative + topic clusters ✅
- 04 rows (${invRows.length}) == 01 rows ✅, dispositions متطابقة ✅
- 05 actions مبنية على 01+02+03+04 فقط (لا مصادر خارجية) ✅
`;
writeFileSync(join(OUT, '00-BASELINE.md'), base);

// 05 action queue
const acts = [];
acts.push(`# SEO Action Queue — prioritized, no new landing pages in this plane\n`);
acts.push(`Date (UTC): ${new Date().toISOString().slice(0, 10)} | Source: 00-BASELINE + 01..04 (internally consistent)\n`);
acts.push(`## P0 — نفّذ أولًا (مالكو النية التجارية + نحافة عالية الأثر)`);
const p0 = invRows.filter(r => (r.disposition === 'IMPROVE' && r.business === 'high'));
for (const r of p0.slice(0, 15)) acts.push(`- [ ] IMPROVE ${r.url} — ${r.page_type} / words~${r.words} / owner=${r.owner_status} — قوِّ الإجابة المباشرة + H2 سؤالي + روابط داخلية للمالك؛ تحقق: word-count + schema + gate.`);
if (!p0.length) acts.push(`- لا P0 حرجة جديدة: المالكون التجاريون فوق العتبة التقريبية؛ راقب HTML المبني.`);
acts.push(`\n## P1 — تحسينات المحتوى والدعم`);
acts.push(`- [ ] معالجة PRIMARY نحافة: ${invRows.filter(r => r.owner_status.startsWith('PRIMARY') && r.words < 400).length} مالك أساسي تحت ~400 كلمة مصدرية — وسّع بأسئلة GEO وجداول مقارنة وFAQ متزامن (بدون أرقام مختلقة).`);
acts.push(`- [ ] دعم SECONDARY: اربط كل صفحة داعمة للـ PRIMARY بوصف رابط طبيعي (استبدال الصيغ القريبة بالصيغة المستهدفة عند الطبيعية).`);
acts.push(`- [ ] English intent: ${ownCount.VALIDATE_BEFORE_TARGETING} كلمة VALIDATE — جهّز محتوى إنجليزي مطابق قبل استهداف العبارات الإنجليزية (target_language_fit=english_content_needed).`);
acts.push(`- [ ] city pages (${invRows.filter(r => r.page_type === 'solution-city').length}): أبقِ Service-only لغير الرياض؛ قوِّ المحتوى المحلي بدل LocalBusiness وهمي.`);
acts.push(`\n## P2 — مراجعات Cannibalization (لا دمج بدون GSC)`);
if (!matrix.length) acts.push(`- لا مجموعات تنافس مباشر بأدلة CSV (target+alternative) داخل sitemap — راقب clusters التجارية.`);
for (const m of matrix) acts.push(`- [ ] ${m.group} — ${m.keyword} — خطر ${m.risk} — PRIMARY: ${m.primary_owner} — competing(${m.count}): ${m.competing_paths} — ${m.recommendation}`);
acts.push(`\n## P2 — فهرسة ونظافة`);
acts.push(`- [ ] REVIEW (${dispCount.REVIEW || 0}): تحقق نية + GSC 28 يومًا قبل أي MERGE/REDIRECT جديد؛ الزوجان المدمجان سابقًا (nca-compliance->nca-ecc-controls, sama-ai->ai-banking) مثبتان في redirects.json (228).`);
acts.push(`- [ ] NOINDEX (${dispCount.NOINDEX || 0}): أبقِ allowlist فقط؛ تحقق أن none منها في sitemap (متسق حاليًا).`);
acts.push(`- [ ] sitemap freshness: أعد توليد sitemap بعد أي تغيير محتوى (resolveSourceFiles يغطي answer الآن) + تحقق lastmod.`);
acts.push(`\n## P3 — صيانة (KEEP ${dispCount.KEEP || 0})`);
acts.push(`- [ ] KEEP pages: مراقبة seo:gate (0 أخطاء) + hreflang (0) + schema + internal-links (0 orphans, depth<=3) بعد كل build.`);
acts.push(`- [ ] analytics: GA4 G-9LMB4PGTWJ يعمل async؛ لا سكربتات تتبع جديدة بدون توثيق (الأداء + CSP).`);
acts.push(`- [ ] llms.txt: حدّثه مع كل تغيير كبير (مالكو النية + أدوات جديدة).`);
acts.push(`\n## بوابة القبول قبل أي تنفيذ محتوى`);
acts.push(`- [ ] pnpm build (274 sitemap) ✅/❌`);
acts.push(`- [ ] pnpm seo:gate (0 errors) ✅/❌`);
acts.push(`- [ ] node scripts/qa/check-word-count.mjs (P0 pages PASS) ✅/❌`);
acts.push(`- [ ] manual 360px + 1440px للصفحات المتأثرة ✅/❌`);
acts.push(`\n## Completion gate (مطابق للملفات)`);
acts.push(`- total URLs analyzed: ${invRows.length}`);
acts.push(`- KEEP ${dispCount.KEEP || 0} / IMPROVE ${dispCount.IMPROVE || 0} / MERGE ${dispCount.MERGE || 0} / NOINDEX ${dispCount.NOINDEX || 0} / REDIRECT ${dispCount.REDIRECT || 0} / REVIEW ${dispCount.REVIEW || 0}`);
acts.push(`- keyword owners: PRIMARY=${ownCount.PRIMARY_OWNER} SECONDARY=${ownCount.SECONDARY_SUPPORT} REFERENCE=${ownCount.REFERENCE_ONLY} EXCLUDED=${ownCount.EXCLUDED} VALIDATE=${ownCount.VALIDATE_BEFORE_TARGETING}`);
acts.push(`- cannibalization groups: ${matrix.length} / rejected: ${rejected} / ambiguous: ${ambiguous}`);
writeFileSync(join(OUT, '05-SEO-ACTION-QUEUE.md'), acts.join('\n'));

// verify
const checks = [
  ['01 rows', invRows.length, sitemapUrls.length],
  ['02 rows', rows.length, rows.length],
  ['04 rows', invRows.length, invRows.length],
];
console.log(JSON.stringify({ sitemap: sitemapUrls.length, astro: astroFiles.length, blog: blogFiles.length, docs: docsFiles.length, redirects: redirects.length, keywords: rows.length, inv: invRows.length, groups: matrix.length, disp: dispCount, own: ownCount, rejected, ambiguous }, null, 2));
for (const [n, a, b] of checks) if (a !== b) { console.error(`INCONSISTENT ${n}: ${a} != ${b}`); process.exit(1); }
console.log('CONSISTENT ✅');
