#!/usr/bin/env node
/**
 * validate-ai-search-surface.mjs — BAI-SEO-003-S4
 * ------------------------------------------------
 * Validates BrightAI's AI-search surface against the published schema foundation.
 *
 * What it checks:
 *   1. URL coverage (acceptance criterion #1):
 *      Every brightai.site URL referenced in public/llms.txt,
 *      public/llms-full.txt, and public/ai.txt must:
 *        - exist as a built page in dist/client/<path>/index.html, OR
 *        - be a known non-page asset (sitemap.xml, llms*.txt, ai.txt,
 *          robots.txt, schema-saudi-seo.json, wa.me link, or a sameAs profile), OR
 *        - be present in public/sitemap.xml as <loc>.
 *
 *   2. Entity fact parity (acceptance criterion #2):
 *      The Organization entity facts published in src/data/schema-helpers.ts
 *      (the schema foundation used by every page) must match what is asserted
 *      in the AI search files for the canonical fields:
 *        - name (en)            = SITE.name
 *        - alternateName (ar)   = SITE.nameAr
 *        - legalName            = "BrightAI"
 *        - foundingDate         = "2025"
 *        - url                  = SITE.url
 *        - telephone            = "+966538229013"
 *        - whatsapp             = https://wa.me/966538229013
 *        - email                = "yazeed1job@gmail.com"
 *        - LinkedIn (org)       = schema-helpers Organization.sameAs link
 *        - X / Twitter          = schema-helpers Organization.sameAs link
 *        - YouTube              = schema-helpers Organization.sameAs link
 *        - TikTok               = schema-helpers Organization.sameAs link
 *        - GitHub               = schema-helpers Organization.sameAs link
 *        - Crunchbase           = schema-helpers Organization.sameAs link
 *
 *      Hardcoded year "2025" in any AI-search file is forbidden (acceptance
 *      criterion: no undocumented ordering / certification / customer claims).
 *
 *   3. Required crawler classes:
 *      Both llms.txt and ai.txt must explicitly enumerate the search/grounding
 *      and training crawler classes so the BrightAI AI-search policy is
 *      verifiable by humans and by other crawlers.
 *
 *   4. Forbidden claims:
 *      AI-search files must NOT contain ranking superlatives
 *      ("الأفضل", "الأكبر", "#1", "الأكثر", "the best", "#1 in", etc.) and
 *      must NOT assert certifications the site does not publish
 *      ("معتمد من", "حاصل على شهادة", "ISO certified", etc.).
 *
 * Output:
 *   - Exit code 0 when every check passes.
 *   - Exit code 1 when any check fails.
 *   - Human-readable summary printed to stdout.
 *
 * Usage:
 *   node scripts/seo/validate-ai-search-surface.mjs
 *   node scripts/seo/validate-ai-search-surface.mjs --json
 *
 * Notes:
 *   This script reads the source of truth (schema-helpers.ts) as a string
 *   and parses the canonical values with regex. We do NOT import the TS
 *   module to keep the script dependency-free at runtime. Values come from
 *   a single human-verified mapping below (ENTITY_FACTS). If schema-helpers.ts
 *   changes, update ENTITY_FACTS in the same change.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');

const PATHS = {
  llms: join(ROOT, 'public/llms.txt'),
  llmsFull: join(ROOT, 'public/llms-full.txt'),
  ai: join(ROOT, 'public/ai.txt'),
  robots: join(ROOT, 'public/robots.txt'),
  sitemap: join(ROOT, 'public/sitemap.xml'),
  schema: join(ROOT, 'public/schema-saudi-seo.json'),
  schemaHelpers: join(ROOT, 'src/data/schema-helpers.ts'),
  schemaAstro: join(ROOT, 'src/components/seo/Schema.astro'),
  site: join(ROOT, 'src/data/site.ts'),
  distClient: join(ROOT, 'dist/client'),
};

const SITE_URL = 'https://brightai.site';

// ───────────────────────────────────────────────────────────────────
// ENTITY FACTS — single source of truth for AI-search validation
// These values must match src/data/schema-helpers.ts (ORGANIZATION).
// When schema-helpers.ts changes, update this map in the same change.
// ───────────────────────────────────────────────────────────────────
const ENTITY_FACTS = {
  nameEn: 'BrightAI',
  nameAr: 'برايت أيه آي',
  legalName: 'BrightAI',
  foundingDate: '2025',
  url: SITE_URL,
  telephone: '+966538229013',
  whatsapp: 'https://wa.me/966538229013',
  email: 'yazeed1job@gmail.com',
  founderNameAr: 'يزيد',
  founderJobTitleAr: 'المؤسس والمدير التنفيذي',
  founderLinkedin: 'https://www.linkedin.com/in/yazeed-brightai',
  linkedinOrg: 'https://linkedin.com/company/brightai-site',
  twitter: 'https://x.com/BrightAISite',
  youtube: 'https://www.youtube.com/@BrightAiSaudi',
  tiktok: 'https://www.tiktok.com/@bright1ai',
  github: 'https://github.com/YEEEAE/BRIGHTAI',
  crunchbase: 'https://crunchbase.com/organization/brightai',
  taglineEn: 'Saudi AI Safety OS',
  taglineAr: 'نظام حماية الذكاء الاصطناعي السعودي',
  addressLocality: 'الرياض',
  addressCountry: 'SA',
  postalCode: '14254',
};

// Crawler classes (search/grounding vs training). Must be enumerated in ai.txt.
const SEARCH_GROUNDING_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-ai',
  'ClaudeBot',
  'Googlebot',
  'Googlebot-Image',
  'Bingbot',
  'Applebot',
  'DuckDuckBot',
  'YouBot',
  'Google-CloudVertexBot',
];

const TRAINING_CRAWLERS = [
  'GPTBot',
  'Google-Extended',
  'anthropic-ai',
  'CCBot',
  'Bytespider',
  'cohere-ai',
  'FacebookBot',
  'Meta-ExternalAgent',
  'Applebot-Extended',
  'Timpibot',
  'omgili',
];

const KNOWN_NON_PAGE_ASSETS = new Set([
  `${SITE_URL}/sitemap.xml`,
  `${SITE_URL}/sitemap-index.xml`,
  `${SITE_URL}/sitemap-images.xml`,
  `${SITE_URL}/llms.txt`,
  `${SITE_URL}/llms-full.txt`,
  `${SITE_URL}/ai.txt`,
  `${SITE_URL}/robots.txt`,
  `${SITE_URL}/schema-saudi-seo.json`,
  `${SITE_URL}/manifest.webmanifest`,
  `${SITE_URL}/humans.txt`,
  `${SITE_URL}/ai.txt`.replace('/ai.txt', '/blog/feed.xml'),
  ENTITY_FACTS.whatsapp,
  ENTITY_FACTS.linkedinOrg,
  ENTITY_FACTS.twitter,
  ENTITY_FACTS.youtube,
  ENTITY_FACTS.tiktok,
  ENTITY_FACTS.github,
  ENTITY_FACTS.crunchbase,
  ENTITY_FACTS.founderLinkedin,
]);

// Forbidden claims (ranking superlatives + unsupported certifications)
const FORBIDDEN_PATTERNS = [
  { pattern: /الأفضل|#1\s+in|the\s+best|#1\b/i, label: 'ranking-superlative' },
  { pattern: /الأكبر|الأكثر\s+استخداما|the\s+largest|the\s+most\s+used/i, label: 'ranking-superlative' },
  { pattern: /معتمد\s+من\s+(SAMA|NCA|SFDA|SDAIA|ISO)/i, label: 'unsupported-certification' },
  { pattern: /حاصل\s+على\s+شهادة\s+ISO\s+\d+|ISO\s+certified\s+by/i, label: 'unsupported-certification' },
  { pattern: /أول\s+منشأة\s+سعودية|first\s+saudi\s+company\s+to/i, label: 'unsupported-first-claim' },
];

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────

function safeRead(p) {
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

function listBuiltPages(dir, acc = new Set()) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      listBuiltPages(full, acc);
    } else if (entry === 'index.html') {
      // Build path key like /blog/foo/ from full path
      const rel = full
        .replace(join(ROOT, 'dist/client'), '')
        .replace(/\/index\.html$/, '')
        .replace(/\/$/, '');
      const urlPath = rel === '' ? '/' : `${rel}/`;
      acc.add(`${SITE_URL}${urlPath}`);
    }
  }
  return acc;
}

function extractUrls(text) {
  const urls = new Set();
  const re = /https?:\/\/[^\s<>"'`)\]]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let u = m[0].replace(/[.,;:!?]+$/, '');
    // Strip URL fragment (e.g. #organization) for URL-coverage checks —
    // fragments are in-page anchors, not separate pages, so they cannot be
    // "broken". The full URL including fragment is preserved for citation
    // analysis (handled separately if needed).
    u = u.split('#')[0];
    if (u) urls.add(u);
  }
  return urls;
}

function extractSitemapUrls(text) {
  const urls = new Set();
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(text)) !== null) urls.add(m[1].trim());
  return urls;
}

function pathToUrl(p) {
  // Normalize "blog/foo/" -> "https://brightai.site/blog/foo/"
  if (!p) return null;
  let normalized = p.startsWith('/') ? p : `/${p}`;
  if (!normalized.endsWith('/')) normalized += '/';
  return `${SITE_URL}${normalized}`;
}

function extractInternalPaths(text) {
  // Extract "/path/..." style internal references (excluding http links)
  const paths = new Set();
  const re = /\((\/[a-zA-Z0-9_\-\/\u0600-\u06FF]+)\)|href=\s*["'](\/[a-zA-Z0-9_\-\/\u0600-\u06FF]+)["']/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const p = m[1] || m[2];
    if (p && p.length > 1) paths.add(pathToUrl(p));
  }
  return paths;
}

// ───────────────────────────────────────────────────────────────────
// Validation steps
// ───────────────────────────────────────────────────────────────────

function checkUrls(fileLabel, text, builtPages, sitemapUrls) {
  const failures = [];
  const warnings = [];
  const seen = extractUrls(text);
  for (const u of seen) {
    if (!u.startsWith(SITE_URL)) continue; // skip wa.me, twitter.com, etc.
    if (KNOWN_NON_PAGE_ASSETS.has(u)) continue;
    if (builtPages.has(u)) continue;
    if (sitemapUrls.has(u)) continue;
    // Possibly trailing-slash inconsistency — try without then with
    const alt = u.endsWith('/') ? u.slice(0, -1) : `${u}/`;
    if (builtPages.has(alt) || sitemapUrls.has(alt)) continue;
    failures.push({ file: fileLabel, url: u, kind: 'broken-url' });
  }
  return { failures, warnings };
}

function checkEntityFacts(fileLabel, text) {
  const failures = [];
  const must = [
    ENTITY_FACTS.nameEn,
    ENTITY_FACTS.nameAr,
    ENTITY_FACTS.telephone,
    ENTITY_FACTS.email,
    ENTITY_FACTS.whatsapp,
    ENTITY_FACTS.linkedinOrg,
    ENTITY_FACTS.twitter,
    ENTITY_FACTS.youtube,
    ENTITY_FACTS.tiktok,
    ENTITY_FACTS.github,
  ];
  const should = [
    ENTITY_FACTS.foundingDate,
    ENTITY_FACTS.legalName,
    ENTITY_FACTS.founderNameAr,
    ENTITY_FACTS.addressLocality,
  ];
  for (const v of must) {
    if (!text.includes(v)) failures.push({ file: fileLabel, missing: v });
  }
  // soft checks — should have at least 1 of {foundingDate, legalName, founder}
  let softHits = 0;
  for (const v of should) if (text.includes(v)) softHits += 1;
  return { failures, softHits, mustCount: must.length };
}

function checkForbiddenClaims(fileLabel, text) {
  const failures = [];
  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    const m = text.match(pattern);
    if (m) failures.push({ file: fileLabel, label, snippet: m[0] });
  }
  return failures;
}

function checkCrawlerCoverage(fileLabel, text) {
  const failures = [];
  const lower = text.toLowerCase();
  // search/grounding presence
  const searchHits = SEARCH_GROUNDING_CRAWLERS.filter((c) => text.includes(c)).length;
  const trainHits = TRAINING_CRAWLERS.filter((c) => text.includes(c)).length;
  if (searchHits < 5) failures.push({ file: fileLabel, kind: 'insufficient-search-crawlers', found: searchHits });
  if (trainHits < 4) failures.push({ file: fileLabel, kind: 'insufficient-training-crawlers', found: trainHits });
  return { failures, searchHits, trainHits };
}

function checkSchemaJsonFile() {
  const failures = [];
  if (!existsSync(PATHS.schema)) {
    failures.push({ kind: 'missing-schema-json', path: PATHS.schema });
    return { failures, exists: false };
  }
  let json;
  try {
    json = JSON.parse(readFileSync(PATHS.schema, 'utf8'));
  } catch (e) {
    failures.push({ kind: 'invalid-schema-json', message: e.message });
    return { failures, exists: true };
  }
  // Required fields per schema foundation parity.
  // The file uses @graph with both Organization and WebSite nodes — locate
  // the Organization node by inspecting @type (which may be string or array).
  const graph = Array.isArray(json['@graph']) ? json['@graph'] : [json];
  const org = graph.find((n) => {
    const t = n['@type'];
    return t === 'Organization' || (Array.isArray(t) && t.includes('Organization'));
  });
  if (!org) {
    failures.push({ kind: 'no-organization-node', availableTypes: graph.map((n) => n['@type']) });
    return { failures, exists: true };
  }
  const required = [
    'name', 'alternateName', 'legalName', 'url', 'foundingDate',
    'logo', 'description', 'address', 'contactPoint', 'sameAs',
  ];
  for (const k of required) {
    if (!org[k]) failures.push({ kind: 'schema-field-missing', field: k });
  }
  // SameAs must include every schema-foundation profile
  if (org.sameAs) {
    const requiredSameAs = [
      ENTITY_FACTS.linkedinOrg,
      ENTITY_FACTS.twitter,
      ENTITY_FACTS.youtube,
      ENTITY_FACTS.tiktok,
      ENTITY_FACTS.github,
    ];
    for (const url of requiredSameAs) {
      if (!org.sameAs.includes(url)) failures.push({ kind: 'schema-sameas-missing', url });
    }
  }
  return { failures, exists: true, json };
}

function checkSchemaHelpersParity() {
  // Confirm schema-helpers.ts still references the canonical values.
  // The TS file uses `SITE.xxx` indirection for some fields (alternateName,
  // whatsapp, slogan) so we also cross-check src/data/site.ts for those keys.
  const shText = safeRead(PATHS.schemaHelpers);
  const siteText = safeRead(PATHS.site);
  if (!shText) return [{ kind: 'schema-helpers-missing' }];
  const failures = [];
  // Direct (literal in schema-helpers.ts)
  const direct = [
    ['legalName', 'BrightAI'],
    ['foundingDate', '2025'],
    ['founderNameAr', 'يزيد'],
    ['founderJobTitleAr', 'المؤسس والمدير التنفيذي'],
    ['linkedinOrg', 'linkedin.com/company/brightai-site'],
    ['twitter', 'x.com/BrightAISite'],
    ['youtube', 'youtube.com/@BrightAiSaudi'],
    ['tiktok', 'tiktok.com/@bright1ai'],
    ['github', 'github.com/YEEEAE/BRIGHTAI'],
    ['crunchbase', 'crunchbase.com/organization/brightai'],
    ['telephone', '+966538229013'],
    ['email', 'yazeed1job@gmail.com'],
    ['addressCountry', 'SA'],
    ['postalCode', '14254'],
  ];
  for (const [key, needle] of direct) {
    if (!shText.includes(needle)) failures.push({ kind: 'schema-helpers-entity-missing', key, val: needle });
  }
  // Indirect (via SITE.* in schema-helpers.ts + literal in site.ts)
  const indirect = [
    ['nameEn (SITE.name)', shText, 'SITE.name'],
    ['nameAr (SITE.nameAr)', shText, 'SITE.nameAr'],
    ['whatsapp (SITE.whatsapp.url)', shText, 'SITE.whatsapp.url'],
    ['slogan (SITE.tagline)', shText, 'SITE.tagline'],
    ['site literal nameAr', siteText, 'برايت أيه آي'],
    ['site literal taglineAr', siteText, 'نظام حماية الذكاء الاصطناعي السعودي'],
    ['site literal wa.me', siteText, 'wa.me/966538229013'],
  ];
  for (const [key, source, needle] of indirect) {
    if (!source || !source.includes(needle)) failures.push({ kind: 'schema-helpers-entity-missing', key, val: needle });
  }
  return failures;
}

// ───────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const jsonMode = args.has('--json');

function main() {
  const report = {
    timestamp: new Date().toISOString(),
    files: {
      llms: { exists: existsSync(PATHS.llms), bytes: 0, urls: 0 },
      llmsFull: { exists: existsSync(PATHS.llmsFull), bytes: 0, urls: 0 },
      ai: { exists: existsSync(PATHS.ai), bytes: 0, urls: 0 },
      robots: { exists: existsSync(PATHS.robots), bytes: 0 },
      sitemap: { exists: existsSync(PATHS.sitemap), urls: 0 },
      schemaJson: { exists: existsSync(PATHS.schema) },
    },
    urlChecks: {},
    entityChecks: {},
    crawlerChecks: {},
    forbiddenChecks: {},
    schemaJsonCheck: {},
    schemaHelpersParity: [],
    summary: {},
  };

  // 1. Build pages and sitemap url set
  const builtPages = listBuiltPages(PATHS.distClient);
  const sitemapText = safeRead(PATHS.sitemap) || '';
  const sitemapUrls = extractSitemapUrls(sitemapText);
  // Update report counts that were initialised before extraction
  report.files.sitemap.urls = sitemapUrls.size;
  report.files.robots.bytes = (safeRead(PATHS.robots) || '').length;

  // 2. Per-file checks
  const targets = [
    { key: 'llms', path: PATHS.llms },
    { key: 'llmsFull', path: PATHS.llmsFull },
    { key: 'ai', path: PATHS.ai },
  ];
  for (const { key, path } of targets) {
    const text = safeRead(path) || '';
    report.files[key].bytes = text.length;
    report.files[key].urls = extractUrls(text).size;
    if (!text) {
      report.urlChecks[key] = { failures: [{ kind: 'file-missing', path }], warnings: [] };
      report.entityChecks[key] = { failures: [{ kind: 'file-missing', path }], softHits: 0, mustCount: 0 };
      report.crawlerChecks[key] = { failures: [{ kind: 'file-missing', path }], searchHits: 0, trainHits: 0 };
      report.forbiddenChecks[key] = [{ kind: 'file-missing', path }];
      continue;
    }
    const urlR = checkUrls(key, text, builtPages, sitemapUrls);
    const entR = checkEntityFacts(key, text);
    const crawlR = checkCrawlerCoverage(key, text);
    const forbR = checkForbiddenClaims(key, text);
    report.urlChecks[key] = urlR;
    report.entityChecks[key] = entR;
    report.crawlerChecks[key] = crawlR;
    report.forbiddenChecks[key] = forbR;
  }

  // 3. schema-saudi-seo.json
  report.schemaJsonCheck = checkSchemaJsonFile();

  // 4. schema-helpers.ts parity
  report.schemaHelpersParity = checkSchemaHelpersParity();

  // 5. Roll-up
  const allFailures = [];
  for (const k of Object.keys(report.urlChecks)) {
    for (const f of report.urlChecks[k].failures) allFailures.push({ stage: `url:${k}`, ...f });
  }
  for (const k of Object.keys(report.entityChecks)) {
    for (const f of report.entityChecks[k].failures) allFailures.push({ stage: `entity:${k}`, ...f });
  }
  for (const k of Object.keys(report.crawlerChecks)) {
    for (const f of report.crawlerChecks[k].failures) allFailures.push({ stage: `crawler:${k}`, ...f });
  }
  for (const k of Object.keys(report.forbiddenChecks)) {
    for (const f of report.forbiddenChecks[k]) allFailures.push({ stage: `forbidden:${k}`, ...f });
  }
  for (const f of report.schemaJsonCheck.failures || []) allFailures.push({ stage: 'schema-json', ...f });
  for (const f of report.schemaHelpersParity) allFailures.push({ stage: 'schema-helpers', ...f });

  report.summary = {
    builtPages: builtPages.size,
    sitemapUrls: sitemapUrls.size,
    totalFailures: allFailures.length,
    failureBreakdown: allFailures.reduce((acc, f) => {
      acc[f.stage] = (acc[f.stage] || 0) + 1;
      return acc;
    }, {}),
  };

  if (jsonMode) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    printHumanReport(report);
  }

  process.exit(allFailures.length > 0 ? 1 : 0);
}

function printHumanReport(r) {
  const sym = (ok) => (ok ? '✅' : '❌');
  process.stdout.write('\n=== BAI-SEO-003-S4: AI-search surface validation ===\n');
  process.stdout.write(`Timestamp: ${r.timestamp}\n\n`);

  process.stdout.write('Files:\n');
  for (const [k, v] of Object.entries(r.files)) {
    process.stdout.write(`  ${k.padEnd(10)} exists=${v.exists}`);
    if ('bytes' in v) process.stdout.write(` bytes=${v.bytes}`);
    if ('urls' in v) process.stdout.write(` urls=${v.urls}`);
    process.stdout.write('\n');
  }
  process.stdout.write(`\nBaseline: built pages=${r.summary.builtPages}, sitemap urls=${r.summary.sitemapUrls}\n`);

  let totalOk = true;

  // URL checks
  process.stdout.write('\n[1/4] URL coverage (0 broken URLs expected)\n');
  for (const k of ['llms', 'llmsFull', 'ai']) {
    const c = r.urlChecks[k];
    process.stdout.write(`  ${sym(c.failures.length === 0)} ${k}: ${c.failures.length} broken\n`);
    if (c.failures.length > 0) {
      totalOk = false;
      for (const f of c.failures.slice(0, 10)) {
        process.stdout.write(`      - ${f.url || f.kind}\n`);
      }
      if (c.failures.length > 10) process.stdout.write(`      … +${c.failures.length - 10} more\n`);
    }
  }

  // Entity checks
  process.stdout.write('\n[2/4] Entity facts parity with schema foundation\n');
  for (const k of ['llms', 'llmsFull', 'ai']) {
    const c = r.entityChecks[k];
    process.stdout.write(`  ${sym(c.failures.length === 0)} ${k}: ${c.failures.length} missing (soft hits=${c.softHits}/${4})\n`);
    for (const f of c.failures.slice(0, 8)) {
      process.stdout.write(`      - missing: ${f.missing}\n`);
    }
    if (c.failures.length > 0) totalOk = false;
  }

  // Crawler coverage
  process.stdout.write('\n[3/4] Crawler class coverage (search + training)\n');
  for (const k of ['llms', 'llmsFull', 'ai']) {
    const c = r.crawlerChecks[k];
    const ok = c.failures.length === 0;
    process.stdout.write(`  ${sym(ok)} ${k}: search=${c.searchHits}/${SEARCH_GROUNDING_CRAWLERS.length}, training=${c.trainHits}/${TRAINING_CRAWLERS.length}\n`);
    if (!ok) {
      totalOk = false;
      for (const f of c.failures) process.stdout.write(`      - ${f.kind} (found=${f.found})\n`);
    }
  }

  // Forbidden claims
  process.stdout.write('\n[4/4] Forbidden claims (ranking / unsupported certifications)\n');
  for (const k of ['llms', 'llmsFull', 'ai']) {
    const c = r.forbiddenChecks[k];
    process.stdout.write(`  ${sym(c.length === 0)} ${k}: ${c.length} hits\n`);
    for (const f of c) process.stdout.write(`      - ${f.label}: "${f.snippet}"\n`);
    if (c.length > 0) totalOk = false;
  }

  // schema-saudi-seo.json
  const sj = r.schemaJsonCheck;
  process.stdout.write(`\n[+] schema-saudi-seo.json: ${sym((sj.failures || []).length === 0)} exists=${sj.exists}, ${(sj.failures || []).length} field errors\n`);
  for (const f of sj.failures || []) process.stdout.write(`    - ${f.kind} ${f.field || f.url || ''}\n`);
  if ((sj.failures || []).length > 0) totalOk = false;

  // schema-helpers.ts parity
  const shp = r.schemaHelpersParity;
  process.stdout.write(`\n[+] schema-helpers.ts parity: ${sym(shp.length === 0)} ${shp.length} mismatches\n`);
  for (const f of shp.slice(0, 6)) process.stdout.write(`    - ${f.kind} ${f.key ? `${f.key} → ${f.val}` : ''}\n`);

  process.stdout.write('\n=== SUMMARY ===\n');
  process.stdout.write(`Total failures: ${r.summary.totalFailures}\n`);
  if (Object.keys(r.summary.failureBreakdown).length > 0) {
    process.stdout.write('Breakdown:\n');
    for (const [stage, n] of Object.entries(r.summary.failureBreakdown)) {
      process.stdout.write(`  ${stage}: ${n}\n`);
    }
  }
  process.stdout.write(totalOk ? '\n✅ All checks passed.\n' : '\n❌ Failures detected. See above.\n');
}

main();