import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'audit/seo-keyword-authority');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const files = (dir, extensions = []) => {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (!extensions.length || extensions.includes(path.extname(entry.name))) result.push(full);
    }
  };
  walk(dir);
  return result.sort();
};

const csvEscape = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = (headers, rows) => [headers.join(','), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(','))].join('\n') + '\n';
const rel = (file) => path.relative(root, file).split(path.sep).join('/');
const first = (text, regex) => text.match(regex)?.[1]?.trim() || '';
const count = (text, regex) => (text.match(regex) || []).length;
const titleFromFile = (text) => first(text, /<title>\s*([^<]+?)\s*<\/title>/i) || first(text, /title\s*[:=]\s*["'`]([^"'`]+)["'`]/i);
const h1FromFile = (text) => first(text, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
const descriptionFromFile = (text) => first(text, /(?:name|property)=["']description["'][^>]*content=["']([^"']*)["']/i) || first(text, /content=["']([^"']*)["'][^>]*(?:name|property)=["']description["']/i);
const routeFromFile = (file) => {
  const route = rel(file).replace(/^src\/pages/, '').replace(/\/index\.astro$/, '/').replace(/\.astro$/, '/');
  return route || '/';
};
const pageType = (route, file) => {
  if (route.startsWith('/api/')) return 'api';
  if (route.startsWith('/blog')) return 'blog';
  if (route.startsWith('/docs')) return 'docs';
  if (route.startsWith('/hub')) return 'hub';
  if (route.startsWith('/solutions')) return 'solution';
  if (route.startsWith('/en/')) return 'english';
  if (/terms|privacy|cookie|agreement|pdpl-statement/.test(route)) return 'legal';
  if (/author/.test(route)) return 'author';
  if (/tools|calculator|assessment/.test(route)) return 'tool';
  if (/design|offline|thank-you|go\//.test(route)) return 'utility';
  return file.includes('/pages/') ? 'page' : 'unknown';
};
const clusterFor = (route, text = '') => {
  const hay = `${route} ${text}`.toLowerCase();
  if (/pdpl|privacy|personal-data/.test(hay)) return 'pdpl-ai';
  if (/firewall|security|nca|cyber/.test(hay)) return 'ai-security';
  if (/risk|sdaia/.test(hay)) return 'ai-risk';
  if (/data-governance|ndmo/.test(hay)) return 'data-governance';
  if (/governance|responsible-ai|human-approval/.test(hay)) return 'ai-governance';
  if (/automation|chatbot|assistant/.test(hay)) return 'ai-automation';
  return 'supporting-entity';
};
const intentFor = (type, route) => {
  if (['solution', 'page'].includes(type) && /solutions|services|pricing|demo|contact/.test(route)) return 'commercial';
  if (['legal', 'utility', 'author'].includes(type)) return 'trust/navigation';
  return 'informational';
};
const ownerTypeFor = (url) => {
  if (!url) return '';
  if (/\/solutions\//.test(url)) return 'commercial_solution';
  if (/\/services\//.test(url)) return 'commercial_services';
  if (/\/docs\//.test(url)) return 'regulatory_or_documentation';
  if (/\/hub\//.test(url)) return 'educational_pillar';
  if (/\/blog\//.test(url)) return 'supporting_article';
  if (/brightai\.live\/$/.test(url)) return 'homepage';
  return 'supporting_page';
};

const astroFiles = files(path.join(root, 'src/pages'), ['.astro']);
const blogFiles = files(path.join(root, 'src/content/blog'), ['.md', '.mdx']);
const docsFiles = files(path.join(root, 'src/content/docs'), ['.md', '.mdx']);
const sitemapText = fs.existsSync(path.join(root, 'public/sitemap.xml')) ? read(path.join(root, 'public/sitemap.xml')) : '';
const sitemapUrls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const packageJson = JSON.parse(read(path.join(root, 'package.json')));
let head = '';
try { head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
let branch = '';
try { branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(); } catch {}
let status = '';
try { status = execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).trim() || 'clean/undetermined (fsmonitor may be unavailable)'; } catch { status = 'unavailable'; }

const astroRows = astroFiles.map((file) => {
  const text = read(file);
  const route = routeFromFile(file);
  const type = pageType(route, file);
  const isApi = type === 'api';
  const indexability = isApi || ['utility'].includes(type) ? 'not_indexable_or_internal' : 'candidate_indexable';
  const title = titleFromFile(text);
  const h1 = h1FromFile(text);
  const description = descriptionFromFile(text);
  const inbound = count(text, /href=["'][^"']+["']/gi);
  const generated = route.includes('[') ? 'dynamic_template' : route;
  return {
    astro_file: rel(file), generated_urls: generated, dynamic_or_static: route.includes('[') ? 'dynamic' : 'static',
    source_of_content: rel(file), language: route.startsWith('/en/') ? 'en' : 'ar', page_type: type,
    indexability, SEO_purpose: intentFor(type, route), topical_cluster: clusterFor(route, text), primary_intent: intentFor(type, route),
    primary_keyword: '', secondary_keywords: '', owner_or_support: type === 'solution' || route === '/' ? 'owner_candidate' : 'support',
    parent_pillar: clusterFor(route, text), inbound_internal_links: '', outbound_internal_links: String(inbound), schema: '',
    canonical: '', hreflang: '', content_quality: title && h1 ? 'needs_rendered_audit' : 'metadata_missing_or_template_only',
    GEO_readiness: 'needs_rendered_audit', cannibalization_risk: 'needs_keyword_map', recommended_action: isApi ? 'exclude_from_public_SEO' : 'review_and_map', implementation_status: 'inventoried',
    _route: route, _title: title, _h1: h1, _description: description,
  };
});

const blogRows = blogFiles.map((file) => {
  const text = read(file);
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const front = fm?.[1] || '';
  const getFm = (key) => first(front, new RegExp(`^${key}\\s*:\\s*["']?(.+?)["']?$`, 'mi'));
  const slug = path.basename(file).replace(/\.(md|mdx)$/, '');
  const body = text.replace(/^---[\s\S]*?---/, '').replace(/```[\s\S]*?```/g, '').replace(/[#>*_`\[\]()]/g, ' ');
  return {
    article_url: `/blog/${slug}/`, slug, source_file: rel(file), language: /^en[-_]/i.test(slug) || /locale:\s*en/i.test(front) ? 'en' : 'ar',
    title: getFm('title') || first(text, /^#\s+(.+)$/m), H1: first(text, /^#\s+(.+)$/m), meta_description: getFm('description') || '', category: getFm('category'), author: getFm('author'),
    publish_date: getFm('date') || getFm('published'), updated_date: getFm('updated') || getFm('lastUpdated'), indexability: 'candidate_indexable', canonical: '', primary_topic: clusterFor(slug, text), primary_keyword: '', secondary_keywords: '',
    search_intent: 'informational', funnel: 'top/mid', cluster: clusterFor(slug, text), current_rank: '', impressions: '', clicks: '', CTR: '', backlinks_if_available: '', inbound_internal_links: '', outbound_internal_links: '',
    word_count: body.trim().split(/\s+/).filter(Boolean).length, answer_capsules: count(text, /answer|خلاصة|باختصار|ما هو|ما هي/gi) > 0 ? 'present_or_possible' : 'needs_review', tables: /\n\|.+\|/.test(text) ? 'yes' : 'no', FAQ: /faq|الأسئلة الشائعة|سؤال/.test(text) ? 'present_or_possible' : 'needs_review',
    sources: /https?:\/\//.test(text) ? 'present' : 'needs_review', freshness_status: getFm('updated') ? 'updated_field_present' : 'needs_review', cannibalization_risk: 'needs_keyword_map', content_gap: 'needs_SERP_comparison', unique_angle: '', recommended_action: 'review_and_map', priority: 'P1/P2',
  };
});

const keywordFile = path.join(root, 'audit/keyword/BRIGHTAI-KEYWORDS-MERGED-2026-09-08.csv');
const rawCsv = read(keywordFile);
const parseCsv = (input) => {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < input.length; i++) { const c = input[i]; const n = input[i + 1];
    if (quoted && c === '"' && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (!quoted && c === ',') { row.push(cell); cell = ''; continue; }
    if (!quoted && c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; continue; }
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...data] = rows;
  return data.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ''])));
};
const keywords = parseCsv(rawCsv);
const ownerMap = new Map();
for (const row of keywords) {
  const key = row.keyword?.trim().toLowerCase();
  if (key && !ownerMap.has(key)) ownerMap.set(key, row.target_url || '');
}
const statusForKeyword = (row) => {
  if (/excluded|not_targeted/i.test(`${row.keyword_role} ${row.target_status} ${row.opportunity_type}`)) return 'EXCLUDED_INTENT';
  if (row.keyword_role === 'primary_candidate') return row.target_url ? 'TARGETED_PRIMARY' : 'NEEDS_NEW_CONTENT';
  if (row.keyword_role === 'secondary') return row.target_url ? 'TARGETED_SECONDARY' : 'SUPPORTING_CONTEXT';
  if (row.keyword_role === 'reference_only' || /broad-support/i.test(row.opportunity_type || '')) return 'SUPPORTING_CONTEXT';
  return row.target_url ? 'TARGETED_SECONDARY' : 'NEEDS_NEW_CONTENT';
};
const ownershipRows = keywords.map((row) => {
  const target = row.target_url || '';
  const status = statusForKeyword(row);
  return {
    keyword: row.keyword, cluster: row.cluster, language: row.language, intent: row.intent, funnel: row.funnel, business_relevance: row.business_relevance, priority: row.priority, priority_score: row.priority_score,
    search_volume_sa: row.search_volume_sa, keyword_difficulty: row.keyword_difficulty, current_rank: row.tracking_position, current_ranking_url: row.tracking_url, keyword_role: row.keyword_role,
    existing_target_url: target, final_owner_url: target, owner_type: ownerTypeFor(target), primary_or_secondary: status === 'TARGETED_PRIMARY' ? 'primary' : status === 'TARGETED_SECONDARY' ? 'secondary' : 'supporting', supporting_urls: row.alternative_target_urls,
    implementation_location: target ? 'existing_target_review' : 'new_content_decision', recommended_anchor: row.keyword, action: status, reason: row.notes || row.recommended_action, cannibalization_risk: target ? 'needs_content_and_SERP_check' : 'not_applicable',
  };
});
const coverageRows = keywords.map((row) => ({ keyword: row.keyword, original_role: row.keyword_role, original_target: row.target_url, final_action: statusForKeyword(row), final_owner: row.target_url, primary_or_secondary: statusForKeyword(row) === 'TARGETED_PRIMARY' ? 'primary' : statusForKeyword(row) === 'TARGETED_SECONDARY' ? 'secondary' : 'supporting', implementation: row.target_url ? 'existing page' : 'new-content review', status: statusForKeyword(row), reason: row.notes || row.recommended_action }));
const fileCoverage = astroRows.map((row) => ({ file: row.astro_file, type: row.page_type, route: row._route, reviewed: 'yes', content_source_checked: 'yes', SEO_checked: 'inventory_only', keywords_checked: 'pending_keyword_map', internal_links_checked: 'inventory_only', schema_checked: 'pending_rendered_audit', GEO_checked: 'pending_rendered_audit', action: row.recommended_action, changed: 'no', notes: 'Discovery baseline; no content rewrite in this wave.' }));

const publicHeaders = ['astro_file','generated_urls','dynamic_or_static','source_of_content','language','page_type','indexability','SEO_purpose','topical_cluster','primary_intent','primary_keyword','secondary_keywords','owner_or_support','parent_pillar','inbound_internal_links','outbound_internal_links','schema','canonical','hreflang','content_quality','GEO_readiness','cannibalization_risk','recommended_action','implementation_status'];
const blogHeaders = Object.keys(blogRows[0] || {}).filter((k) => !k.startsWith('_'));
const ownerHeaders = Object.keys(ownershipRows[0] || {});
fs.writeFileSync(path.join(outDir, 'ASTRO-PAGE-INVENTORY.csv'), csv(publicHeaders, astroRows));
fs.writeFileSync(path.join(outDir, 'BLOG-CONTENT-INVENTORY.csv'), csv(blogHeaders, blogRows));
fs.writeFileSync(path.join(outDir, '01-KEYWORD-OWNERSHIP-MAP.csv'), csv(ownerHeaders, ownershipRows));
fs.writeFileSync(path.join(outDir, '08-KEYWORD-COVERAGE-VERIFICATION.csv'), csv(Object.keys(coverageRows[0] || {}), coverageRows));
fs.writeFileSync(path.join(outDir, 'FILE-COVERAGE.csv'), csv(Object.keys(fileCoverage[0] || {}), fileCoverage));

const numeric = (value) => Number.parseFloat(value) || 0;
const keywordStats = {
  total: keywords.length,
  primary: keywords.filter((r) => r.keyword_role === 'primary_candidate').length,
  secondary: keywords.filter((r) => r.keyword_role === 'secondary').length,
  supporting: keywords.filter((r) => r.keyword_role === 'reference_only' || /broad-support/i.test(r.opportunity_type || '')).length,
  excluded: keywords.filter((r) => /excluded|not_targeted/i.test(`${r.keyword_role} ${r.target_status} ${r.opportunity_type}`)).length,
  ownerUrl: keywords.filter((r) => Boolean(r.target_url)).length,
};
const htmlCandidates = astroRows.filter((r) => !['api','utility'].includes(r.page_type));
const markdownWordCount = blogRows.reduce((sum, r) => sum + numeric(r.word_count), 0);
const baseline = [
  '# 00 — Current SEO Reality', '',
  `- Analysis date: ${new Date().toISOString()}`,
  `- Branch: ${branch || 'unavailable'}`,
  `- HEAD: ${head || 'unavailable'}`,
  `- Git status: ${status}`,
  `- Node: ${process.version}`,
  `- Package manager: pnpm (repository packageManager: ${packageJson.packageManager || 'not declared'})`, '',
  '## Inventory counts', '',
  '| Metric | Count | Evidence |', '|---|---:|---|',
  `| Astro files | ${astroFiles.length} | recursive src/pages/**/*.astro discovery |`,
  `| Candidate public Astro files | ${htmlCandidates.length} | excludes API and utility/internal templates |`,
  `| Static Astro templates | ${astroRows.filter((r) => r.dynamic_or_static === 'static').length} | source route shape |`,
  `| Dynamic Astro templates | ${astroRows.filter((r) => r.dynamic_or_static === 'dynamic').length} | source route shape |`,
  `| Sitemap URLs | ${sitemapUrls.length} | public/sitemap.xml |`,
  `| Blog articles | ${blogFiles.length} | recursive src/content/blog discovery |`,
  `| Docs sources | ${docsFiles.length} | recursive src/content/docs discovery |`,
  `| CSV keywords | ${keywordStats.total} | full CSV parse |`,
  `| Keywords with target URL | ${keywordStats.ownerUrl} | CSV target_url |`, '',
  '## Initial diagnostic boundary', '',
  'This is a source-level freeze. Rendered HTML fields (canonical, hreflang, final schema, generated dynamic instances, and live ranking data) remain separate validation work and are not inferred from source filenames. No content or route was rewritten during this baseline wave.', '',
  '## Known repository constraints', '',
  '- The repository mind records prior local SEO gates and repeatedly notes that live Search Console/CrUX/PSI evidence is unavailable from this environment.',
  '- target_url is preserved as the seed owner mapping; any future change must record old owner → new owner → reason.',
  '- Broad or excluded terms are not converted into doorway pages.', '',
  '## Content coverage', '',
  `- Blog source word count total: ${markdownWordCount.toLocaleString('en-US')} words (source Markdown approximation).`,
  '- Duplicate titles, duplicate descriptions, exact cannibalization, orphan URLs, and final indexability require rendered URL/link-graph analysis; this baseline marks them pending rather than guessing.',
].join('\n') + '\n';
fs.writeFileSync(path.join(outDir, '00-CURRENT-SEO-REALITY.md'), baseline);
const fullCoverage = `# FULL-PAGE-COVERAGE\n\n## Discovery\n\n- Total \\.astro files found: ${astroFiles.length}\n- Candidate public Astro files: ${htmlCandidates.length}\n- Static templates: ${astroRows.filter((r) => r.dynamic_or_static === 'static').length}\n- Dynamic templates: ${astroRows.filter((r) => r.dynamic_or_static === 'dynamic').length}\n- Generated sitemap URLs: ${sitemapUrls.length}\n- Blog articles: ${blogFiles.length}\n- Docs sources: ${docsFiles.length}\n- Reviewed in this baseline: ${astroFiles.length + blogFiles.length}\n- Optimized: 0 (baseline-only wave)\n- Keep-as-is: 0 (not yet adjudicated)\n- Revived: 0\n- Consolidated: 0\n- Retargeted: 0\n- Remaining for content/rendered adjudication: ${htmlCandidates.length + blogFiles.length}\n\n## Interpretation\n\nAll discoverable Astro and blog sources are inventoried. “Reviewed” here means discovered and represented in the audit artifacts; it does not claim that every rendered instance has been manually rewritten.\n`;
fs.writeFileSync(path.join(outDir, 'FULL-PAGE-COVERAGE.md'), fullCoverage);
const report = [
  '# SEO / GEO / Topical Authority — Initial Execution Report', '',
  '## Executive Summary', '',
  'تم تنفيذ موجة التجميد والجرد الكامل للمصادر قبل أي إعادة كتابة. شملت الموجة كل ملفات Astro القابلة للاكتشاف، كل مقالات المدونة، كامل ملف الكلمات، وخريطة ملكية أولية محافظة على target_url.', '',
  '## Numeric summary', '',
  `- CSV keywords: ${keywordStats.total}`,
  `- Primary candidates: ${keywordStats.primary}`,
  `- Secondary keywords: ${keywordStats.secondary}`,
  `- Supporting/reference terms: ${keywordStats.supporting}`,
  `- Excluded/not-targeted terms: ${keywordStats.excluded}`,
  `- Keywords with owner URL: ${keywordStats.ownerUrl}`,
  `- Astro files: ${astroFiles.length}`,
  `- Sitemap URLs available locally: ${sitemapUrls.length}`,
  `- Blog articles: ${blogFiles.length}`,
  `- Docs sources: ${docsFiles.length}`,
  '- Astro pages changed: 0', '- Blog pages changed: 0', '- New pages: 0', '',
  '## Artifacts created', '',
  '- 00-CURRENT-SEO-REALITY.md', '- ASTRO-PAGE-INVENTORY.csv', '- BLOG-CONTENT-INVENTORY.csv',
  '- 01-KEYWORD-OWNERSHIP-MAP.csv', '- 08-KEYWORD-COVERAGE-VERIFICATION.csv', '- FILE-COVERAGE.csv', '- FULL-PAGE-COVERAGE.md', '',
  '## Important limitations', '',
  '- هذا التقرير baseline ومصدره المحلي؛ ما يدّعي ترتيب Google أو فهرسة حيّة أو نتائج SERP لم تُسحب.',
  '- الحقول التي تحتاج HTML مولّد أو قياس حي وُسمت pending بدل تخمينها.',
  '- ما تم إنشاء صفحات جديدة أو تعديل محتوى في هذه الموجة، لذلك ما فيه ادعاء تحسن أو تصفير مشاكل.', '',
  '## Next execution wave', '',
  '1. تشغيل build محلي وإعادة فحص كل URLs المولّدة مع canonical/hreflang/schema/indexability.',
  '2. تدقيق ملكية الكلمات مقابل H1/title والمحتوى الفعلي، ثم توثيق التعارضات قبل أي تغيير.',
  '3. تنفيذ Wave 1 على الصفحات التجارية P0 فقط بعد التحقق من claims والروابط والمصادر.',
  '4. تشغيل البوابات الموجودة في package.json وتوثيق النتيجة الفعلية.',
].join('\n') + '\n';
fs.writeFileSync(path.join(outDir, 'FINAL-SEO-GEO-TOPICAL-AUTHORITY-REPORT.md'), report);
console.log(JSON.stringify({ astroFiles: astroFiles.length, blogFiles: blogFiles.length, docsFiles: docsFiles.length, sitemapUrls: sitemapUrls.length, keywords: keywords.length, outDir }, null, 2));
