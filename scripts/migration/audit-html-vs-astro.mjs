#!/usr/bin/env node
/**
 * BrightAI Migration Audit — فحص اكتمال ترحيل HTML → Astro v2
 * 
 * التحسينات:
 * - يستثني محتوى <head> و <script> و <style> من المقارنة
 * - يركز على محتوى <body> فقط للنص الفعلي
 * - يضيف blog/docs/solutions/kernel dynamic routes
 * - يفحص الـ frontmatter للـ Markdown collections (blog, docs)
 * - يبلغ عن الروابط المكسورة بدقة أعلى
 *
 * Usage: node scripts/migration-audit/audit.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve, extname } from 'path';

const ROOT = resolve(import.meta.dirname, '../..');
const COMMIT = 'eaadccc7~1'; // commit قبل حذف ملفات HTML
const ASTRO_DIR = join(ROOT, 'src/pages');
const CONTENT_DIR = join(ROOT, 'src/content');
const REPORT_DIR = join(ROOT, 'scripts/migration-audit');
const REPORT_FILE = join(REPORT_DIR, 'AUDIT-REPORT.md');

// ─── 1. HTML files mapping ───
const HTML_PAGES = [
  // Static production pages
  ['index.html', 'index.astro'],
  ['about/index.html', 'about/index.astro'],
  ['contact/index.html', 'contact/index.astro'],
  ['demo/index.html', 'demo/index.astro'],
  ['pricing/index.html', 'pricing/index.astro'],
  ['services/index.html', 'services/index.astro'],
  ['trust/index.html', 'trust/index.astro'],
  ['sitemap/index.html', 'sitemap/index.astro'],
  ['offline/index.html', 'offline/index.astro'],
  ['404.html', '404.astro'],
  ['assessment/ai-governance-readiness/index.html', 'assessment/ai-governance-readiness/index.astro'],
  ['authors/nasser-alabdullah/index.html', 'authors/[slug].astro'],
  ['blog/index.html', 'blog/index.astro'],
  ['docs/index.html', 'docs/index.astro'],
  ['solutions/index.html', 'solutions/index.astro'],
  ['kernel/index.html', 'kernel/index.astro'],
  ['kernel/offline.html', 'kernel/offline.astro'],
  
  // Hub pages
  ['hub/index.html', 'hub/index.astro'],
  ['hub/ai-governance/index.html', 'hub/[slug].astro'],
  ['hub/compliance/index.html', 'hub/[slug].astro'],
  ['hub/solutions/index.html', 'hub/[slug].astro'],
  ['hub/use-cases/index.html', 'hub/[slug].astro'],
  
  // Legal pages (AR)
  ['terms/index.html', 'terms/index.astro'],
  ['privacy-policy/index.html', 'privacy-policy/index.astro'],
  ['cookie-policy/index.html', 'cookie-policy/index.astro'],
  ['data-processing-agreement/index.html', 'data-processing-agreement/index.astro'],
  ['pdpl-statement/index.html', 'pdpl-statement/index.astro'],
  ['privacy-cookies/index.html', 'privacy-cookies/index.astro'],
  
  // Legal pages (EN)
  ['en/cookie-policy/index.html', 'en/cookie-policy/index.astro'],
  ['en/data-processing-agreement/index.html', 'en/data-processing-agreement/index.astro'],
  ['en/pdpl-statement/index.html', 'en/pdpl-statement/index.astro'],
  ['en/privacy-policy/index.html', 'en/privacy-policy/index.astro'],
  ['en/terms/index.html', 'en/terms/index.astro'],
];

// Blog posts — dynamic content collection
const BLOG_POSTS = [
  'blog/ai-audit-trail-compliance-path',
  'blog/ai-audit-trail-saudi',
  'blog/ai-customer-data-protection-saudi',
  'blog/ai-ethics-saudi-responsible-ai',
  'blog/ai-firewall-why-you-need-it',
  'blog/ai-governance',
  'blog/ai-governance-saudi-arabia',
  'blog/ai-governance-vs-ai-safety-vs-ai-security',
  'blog/ai-red-teaming-security-testing',
  'blog/banking-ai-governance-sama-requirements',
  'blog/best-ai-governance-platforms-2026',
  'blog/healthcare-ai-governance-saudi-hospitals',
  'blog/hidden-ai-risks-saudi-organizations',
  'blog/iso-42001-saudi-implementation-guide',
  'blog/nca-ecc-ai-controls-guide',
  'blog/pdpl-ai-compliance-guide',
  'blog/pdpl-ai-safety',
  'blog/pdpl-and-ai-saudi',
  'blog/sdaia-generative-ai-guidelines-practical-compliance',
  'blog/shadow-ai-discovery-saudi-company',
  'blog/vision-2030-ai-governance-roadmap',
  'blog/what-is-ai-governance-saudi-companies',
];

// Docs — content collection
const DOCS_PAGES = [
  'docs/ai-audit-readiness',
  'docs/ai-audit-trail',
  'docs/ai-evidence-file',
  'docs/ai-firewall',
  'docs/ai-governance-platform',
  'docs/ai-governance-saudi-arabia',
  'docs/ai-risk-management',
  'docs/governance-application',
  'docs/human-approval-layer',
  'docs/kernel-approvals',
  'docs/kernel-audit-trail',
  'docs/kernel-chat',
  'docs/kernel-compliance',
  'docs/kernel-connectors',
  'docs/kernel-evidence',
  'docs/kernel-policies',
  'docs/kernel-reports',
  'docs/kernel-scenarios',
  'docs/kernel-stats',
  'docs/nca-ecc-ai-controls',
  'docs/nca-ecc-ai-controls-mapping',
  'docs/nca-ecc-ai-governance',
  'docs/nca-ecc-ai-guide',
  'docs/pdpl-ai-complete-guide',
  'docs/pdpl-ai-governance',
  'docs/pdpl-chatgpt-data-protection',
  'docs/sdaia-generative-ai-guidelines',
];

// Kernel pages — come from data
const KERNEL_PAGES = [
  'kernel/approvals.html',
  'kernel/audit.html',
  'kernel/chat.html',
  'kernel/compliance.html',
  'kernel/connectors.html',
  'kernel/evidence.html',
  'kernel/offline.html',
  'kernel/policies.html',
  'kernel/reports.html',
  'kernel/scenarios.html',
  'kernel/stats.html',
];

// Solutions pages
const SOLUTIONS_PAGES = [
  'solutions/ai-audit-trail/index.html',
  'solutions/ai-evidence-file/index.html',
  'solutions/ai-firewall/index.html',
  'solutions/ai-governance-platform/index.html',
  'solutions/ai-risk-classification/index.html',
  'solutions/ai-use-case-discovery/index.html',
  'solutions/continuous-ai-governance/index.html',
  'solutions/human-approval-layer/index.html',
  'solutions/policy-to-control-mapping/index.html',
  'solutions/banking-ai-governance/index.html',
  'solutions/government-ai-governance/index.html',
  'solutions/healthcare-ai-governance/index.html',
  'solutions/manufacturing-ai-governance/index.html',
  'solutions/banking-ai-governance/riyadh/index.html',
  'solutions/government-ai-governance/dammam/index.html',
  'solutions/healthcare-ai-governance/jeddah/index.html',
];

// ─── 2. Helper: استخراج نص body فقط من HTML ───
function extractBodyText(html) {
  // استخراج <body>...</body>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return '';
  let body = bodyMatch[1];
  
  // إزالة <script> blocks
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // إزالة <style> blocks
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // إزالة JSON-LD schema (type="application/ld+json")
  body = body.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  // إزالة <!-- comments -->
  body = body.replace(/<!--[\s\S]*?-->/g, '');
  
  return body;
}

/** إزالة كل وسوم HTML */
function stripTags(html) {
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** استخراج النص القابل للقراءة من HTML (body فقط بدون script/style) */
function extractReadableText(html) {
  const body = extractBodyText(html);
  return stripTags(body);
}

/** استخراج النص القابل للقراءة من Astro (إزالة أقسام --- frontmatter ---) */
function extractAstroReadableText(astroContent) {
  // إزالة frontmatter (--- ... ---)
  let content = astroContent.replace(/^---[\s\S]*?---\n?/, '');
  // إزالة <style> blocks
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // إزالة <script> blocks
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // إزالة <!-- comments -->
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  // إزالة الوسوم
  return stripTags(content);
}

/** استخراج الهيدر/فوتر المشترك من BaseLayout (للاستثناء من المقارنة) */
const COMMON_LAYOUT_PHRASES = [
  'جدار حماية الذكاء الاصطناعي، سجل تدقيق AI، طبقة الموافقة البشرية',
  'BrightAI | Saudi AI Safety OS',
  'AI Firewall',
  'للامتثال، الـ AI يصير شفافاً ومسؤولاً',
];

/** إزالة الجمل المتكررة من الـ layout المشترك */
function removeCommonLayoutPhrases(text) {
  let result = text;
  for (const phrase of COMMON_LAYOUT_PHRASES) {
    result = result.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }
  // إزالة أي أقسام فيها كلمات header/footer/nav شائعة
  const lines = result.split('\n').filter(line => {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.includes('سياسة الخصوصية') && trimmed.length < 50) return false;
    if (trimmed.includes('الشروط والأحكام') && trimmed.length < 50) return false;
    if (trimmed.includes('جميع الحقوق محفوظة')) return false;
    if (trimmed.includes('brightai.')) return false;
    return true;
  });
  return lines.join('\n');
}

// ─── 3. مقارنة المحتوى ───

/** استخراج الجمل الأساسية (أكثر من 25 حرف) */
function extractSentences(text) {
  return text.split(/[.۔!؟\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 25);
}

/** مقارنة ذكية — تبحث عن تطابق 60%+ من الكلمات المهمة */
function compareContent(htmlBodyText, astroText) {
  // إزالة الجمل المتكررة من الـ layout المشترك قبل المقارنة
  const htmlCleaned = removeCommonLayoutPhrases(htmlBodyText);
  const astroCleaned = removeCommonLayoutPhrases(astroText);
  const htmlSentences = extractSentences(htmlCleaned);
  const astroTextLower = astroCleaned.toLowerCase();
  
  const missing = [];
  let matched = 0;
  
  for (const sentence of htmlSentences) {
    const words = sentence.split(/\s+/).filter(w => w.length > 3);
    if (words.length === 0) continue;
    
    // تحقق من وجود 60%+ من الكلمات المهمة في Astro
    let foundCount = 0;
    for (const w of words) {
      if (astroTextLower.includes(w.toLowerCase())) foundCount++;
    }
    
    const ratio = foundCount / words.length;
    if (ratio >= 0.6) {
      matched++;
    } else {
      // احفظ أول 80 حرف من الجملة المفقودة
      missing.push(sentence.slice(0, 100));
    }
  }
  
  const coverage = htmlSentences.length > 0
    ? Math.round((matched / htmlSentences.length) * 100)
    : 100;
  
  return { coverage, missing, total: htmlSentences.length, matched };
}

/** استخراج الروابط من محتوى (href + src) */
function extractLinks(content) {
  const hrefRegex = /href=["']([^"']+)["']/g;
  const srcRegex = /src=["']([^"']+)["']/g;
  const links = [];
  let match;
  while ((match = hrefRegex.exec(content)) !== null) links.push(match[1]);
  while ((match = srcRegex.exec(content)) !== null) links.push(match[1]);
  return links;
}

/** فحص الروابط الداخلية — تجاهل icons.svg#xxx */
function checkInternalLinks(links, astroFiles) {
  const broken = [];
  const knownIcons = new Set();
  
  for (const href of links) {
    // تجاهل الروابط الخارجية والـ anchors
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('//')) continue;
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:')) continue;
    if (href.startsWith('/icons.svg')) continue; // SVG icon sprite
    
    let cleanHref = href.split('?')[0].split('#')[0];
    if (cleanHref.endsWith('/')) cleanHref = cleanHref.slice(0, -1);
    if (cleanHref.endsWith('.html')) cleanHref = cleanHref.replace('.html', '');
    
    // تحويل لمسار Astro
    const normalized = cleanHref.replace(/^\//, '');
    if (normalized === '' || normalized === '.') continue;
    
    // هل المسار موجود؟
    let exists = false;
    for (const af of astroFiles) {
      const afClean = af.replace(/\.astro$/, '').replace(/\/index$/, '').replace(/\/\[.*?\]$/, '');
      if (normalized === afClean || normalized.startsWith(afClean + '/')) {
        exists = true;
        break;
      }
    }
    
    if (!exists) {
      broken.push({ href, resolvedTarget: normalized, issue: 'missing_astro_target' });
    }
  }
  return broken;
}

/** فحص وجود أقسام رئيسية */
function checkSections(htmlBody, astroContent) {
  const notes = [];
  const checks = [
    { marker: 'hero', names: ['hero', 'Hero', 'split-hero'] },
    { marker: 'faq', names: ['faq', 'FAQ', 'Faq'] },
    { marker: 'cta', names: ['cta', 'CTA', 'cta-section'] },
    { marker: 'footer', names: ['footer', 'Footer'] },
    { marker: 'features', names: ['features', 'Features', 'solutions-grid'] },
    { marker: 'pricing', names: ['pricing', 'Pricing'] },
    { marker: 'stats', names: ['stats', 'Stats', 'statistics'] },
    { marker: 'testimonials', names: ['testimonials', 'Testimonials', 'trust-signals'] },
  ];
  
  for (const check of checks) {
    const htmlHas = check.names.some(n => htmlBody.toLowerCase().includes(n.toLowerCase()));
    const astroHas = check.names.some(n => astroContent.toLowerCase().includes(n.toLowerCase()));
    if (htmlHas && !astroHas) {
      notes.push(`⚠️ قسم ${check.marker} موجود في HTML لكن غير موجود في Astro`);
    }
  }
  return notes;
}

// ─── 4. Content collection readers ───

/** قراءة محتوى blog post من content collection */
function readBlogContent(slug) {
  // blog posts are in src/content/blog/<slug>.md
  const mdFile = join(CONTENT_DIR, 'blog', `${slug}.md`);
  if (!existsSync(mdFile)) return null;
  let content = readFileSync(mdFile, 'utf8');
  // إزالة frontmatter
  content = content.replace(/^---[\s\S]*?---\n?/, '');
  // إزالة JSX/HTML components
  content = content.replace(/<[^>]+>/g, ' ');
  return content;
}

/** قراءة محتوى docs من content collection */
function readDocContent(slug) {
  const mdFile = join(CONTENT_DIR, 'docs', `${slug}.md`);
  if (!existsSync(mdFile)) return null;
  let content = readFileSync(mdFile, 'utf8');
  content = content.replace(/^---[\s\S]*?---\n?/, '');
  content = content.replace(/<[^>]+>/g, ' ');
  return content;
}

// ─── 5. Main audit function ───

async function auditMigration() {
  console.log('🔍 BrightAI Migration Audit v2 — بدء الفحص المحسّن...\n');
  
  // الحصول على قائمة ملفات Astro الموجودة
  const astroFiles = execSync(`find ${ASTRO_DIR} -name "*.astro"`, { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map(f => f.replace(ASTRO_DIR + '/', ''));
  
  console.log(`📄 عدد صفحات Astro: ${astroFiles.length}`);
  
  const results = [];
  
  // ─── فحص الصفحات الأساسية ───
  for (const [htmlPath, astroRelPath] of HTML_PAGES) {
    const result = {
      htmlPath,
      astroPath: astroRelPath,
      status: 'unknown',
      htmlSize: 0,
      astroSize: 0,
      coverage: 0,
      missingSamples: [],
      brokenLinks: [],
      notes: [],
    };
    
    // استخراج HTML الأصلي من git
    try {
      const htmlContent = execSync(
        `cd ${ROOT} && git show ${COMMIT}:${htmlPath} 2>/dev/null || echo "NOT_FOUND"`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      if (htmlContent.includes('NOT_FOUND') || !htmlContent.trim()) {
        result.status = 'missing_html_source';
        result.notes.push('❌ ملف HTML الأصلي غير موجود');
        results.push(result);
        continue;
      }
      
      result.htmlSize = htmlContent.length;
      
      // استخراج النص القابل للقراءة من HTML (body فقط)
      const htmlReadable = extractReadableText(htmlContent);
      const htmlBody = extractBodyText(htmlContent);
      
      // البحث عن ملف Astro
      let astroFullPath = null;
      const possiblePath = join(ASTRO_DIR, astroRelPath);
      if (existsSync(possiblePath)) {
        astroFullPath = possiblePath;
      } else {
        for (const af of astroFiles) {
          if (af === astroRelPath || af.endsWith('/' + astroRelPath)) {
            astroFullPath = join(ASTRO_DIR, af);
            break;
          }
        }
      }
      
      if (!astroFullPath || !existsSync(astroFullPath)) {
        result.status = 'missing_astro_page';
        result.notes.push(`❌ صفحة Astro غير موجودة: ${astroRelPath}`);
        results.push(result);
        continue;
      }
      
      const astroContent = readFileSync(astroFullPath, 'utf8');
      result.astroSize = astroContent.length;
      
      // مقارنة المحتوى
      const astroReadable = extractAstroReadableText(astroContent);
      const comparison = compareContent(htmlReadable, astroReadable);
      result.coverage = comparison.coverage;
      result.missingSamples = comparison.missing.slice(0, 5);
      
      // فحص الأقسام
      const sectionNotes = checkSections(htmlBody, astroContent);
      result.notes.push(...sectionNotes);
      
      // فحص الروابط
      const links = extractLinks(astroContent);
      result.brokenLinks = checkInternalLinks(links, astroFiles);
      
      // تحديد الحالة
      if (result.coverage >= 85) {
        result.status = 'complete';
      } else if (result.coverage >= 50) {
        result.status = 'partial';
      } else if (result.coverage >= 15) {
        result.status = 'low_coverage';
      } else {
        result.status = 'missing_content';
      }
      
    } catch (e) {
      result.status = 'error';
      result.notes.push(`❌ خطأ: ${e.message}`);
    }
    
    results.push(result);
  }
  
  // ─── فحص Blog Posts ───
  console.log(`\n📝 فحص ${BLOG_POSTS.length} مقالة blog...`);
  for (const slug of BLOG_POSTS) {
    const htmlPath = `${slug}/index.html`;
    const slugName = slug.replace('blog/', '');
    const result = {
      htmlPath,
      astroPath: `content/blog/${slugName}.md`,
      status: 'unknown',
      htmlSize: 0,
      astroSize: 0,
      coverage: 0,
      missingSamples: [],
      brokenLinks: [],
      notes: [],
    };
    
    try {
      const htmlContent = execSync(
        `cd ${ROOT} && git show ${COMMIT}:${htmlPath} 2>/dev/null || echo "NOT_FOUND"`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      if (htmlContent.includes('NOT_FOUND')) {
        // بعض المقالات يمكن ما كانت موجودة بالـ HTML
        result.status = 'skipped_no_html';
        results.push(result);
        continue;
      }
      
      result.htmlSize = htmlContent.length;
      const htmlReadable = extractReadableText(htmlContent);
      
      // قراءة محتوى Markdown
      const mdContent = readBlogContent(slugName);
      if (!mdContent) {
        result.status = 'missing_md_source';
        result.notes.push('❌ ملف Markdown غير موجود');
        results.push(result);
        continue;
      }
      
      result.astroSize = mdContent.length;
      const comparison = compareContent(htmlReadable, mdContent);
      result.coverage = comparison.coverage;
      result.missingSamples = comparison.missing.slice(0, 5);
      
      // فحص روابط
      const links = extractLinks(mdContent);
      result.brokenLinks = checkInternalLinks(links, astroFiles);
      
      if (result.coverage >= 85) {
        result.status = 'complete';
      } else if (result.coverage >= 50) {
        result.status = 'partial';
      } else {
        result.status = 'low_coverage';
      }
      
    } catch (e) {
      result.status = 'error';
      result.notes.push(`❌ خطأ: ${e.message}`);
    }
    
    results.push(result);
  }
  
  // ─── فحص Docs ───
  console.log(`📚 فحص ${DOCS_PAGES.length} صفحة docs...`);
  for (const slug of DOCS_PAGES) {
    const htmlPath = `${slug}/index.html`;
    const slugName = slug.replace('docs/', '');
    const result = {
      htmlPath,
      astroPath: `content/docs/${slugName}.md`,
      status: 'unknown',
      htmlSize: 0,
      astroSize: 0,
      coverage: 0,
      missingSamples: [],
      brokenLinks: [],
      notes: [],
    };
    
    try {
      const htmlContent = execSync(
        `cd ${ROOT} && git show ${COMMIT}:${htmlPath} 2>/dev/null || echo "NOT_FOUND"`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      if (htmlContent.includes('NOT_FOUND')) {
        result.status = 'skipped_no_html';
        results.push(result);
        continue;
      }
      
      result.htmlSize = htmlContent.length;
      const htmlReadable = extractReadableText(htmlContent);
      
      const mdContent = readDocContent(slugName);
      if (!mdContent) {
        result.status = 'missing_md_source';
        result.notes.push('❌ ملف Markdown غير موجود');
        results.push(result);
        continue;
      }
      
      result.astroSize = mdContent.length;
      
      // فحص هل الـ MD فيه محتوى فعلي ولا frontmatter فقط؟
      const mdWords = mdContent.trim().split(/\s+/).length;
      if (mdWords < 30) {
        result.coverage = 0;
        result.status = 'frontmatter_only';
        result.notes.push('📄 الملف يحتوي على frontmatter فقط، لا يوجد محتوى مقال');
        results.push(result);
        continue;
      }
      
      const comparison = compareContent(htmlReadable, mdContent);
      result.coverage = comparison.coverage;
      result.missingSamples = comparison.missing.slice(0, 5);
      
      const links = extractLinks(mdContent);
      result.brokenLinks = checkInternalLinks(links, astroFiles);
      
      if (result.coverage >= 85) {
        result.status = 'complete';
      } else if (result.coverage >= 50) {
        result.status = 'partial';
      } else {
        result.status = 'low_coverage';
      }
      
    } catch (e) {
      result.status = 'error';
      result.notes.push(`❌ خطأ: ${e.message}`);
    }
    
    results.push(result);
  }
  
  // ─── فحص Kernel Pages ───
  console.log(`⚙️ فحص ${KERNEL_PAGES.length} صفحة kernel...`);
  for (const htmlPath of KERNEL_PAGES) {
    const slugName = htmlPath.replace('kernel/', '').replace('.html', '');
    const result = {
      htmlPath,
      astroPath: `kernel/[slug].astro (slug: ${slugName})`,
      status: 'unknown',
      htmlSize: 0,
      astroSize: 0,
      coverage: 0,
      missingSamples: [],
      brokenLinks: [],
      notes: [],
    };
    
    try {
      const htmlContent = execSync(
        `cd ${ROOT} && git show ${COMMIT}:${htmlPath} 2>/dev/null || echo "NOT_FOUND"`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      if (htmlContent.includes('NOT_FOUND')) {
        result.status = 'skipped_no_html';
        results.push(result);
        continue;
      }
      
      result.htmlSize = htmlContent.length;
      const htmlReadable = extractReadableText(htmlContent);
      
      // Kernel pages use dynamic route — check if data exists
      const kernelDataFiles = [
        join(ROOT, 'src/data', `kernel-${slugName}.ts`),
        join(ROOT, 'src/data', `kernel-${slugName}.json`),
        join(ROOT, 'src/data', `migratedKernelPages.ts`),
      ];
      
      let foundData = false;
      let astroContent = '';
      
      for (const df of kernelDataFiles) {
        if (existsSync(df)) {
          astroContent = readFileSync(df, 'utf8');
          foundData = true;
          break;
        }
      }
      
      if (!foundData) {
        result.status = 'missing_kernel_data';
        result.notes.push('❌ بيانات kernel غير موجودة (لا ts ولا json)');
      } else {
        result.astroSize = astroContent.length;
        const comparison = compareContent(htmlReadable, astroContent);
        result.coverage = comparison.coverage;
        result.missingSamples = comparison.missing.slice(0, 5);
        
        // فحص هل صفحة kernel موجودة في Astro
        const kernelAstro = join(ASTRO_DIR, 'kernel/[slug].astro');
        if (!existsSync(kernelAstro)) {
          result.notes.push('❌ مسار kernel/[slug].astro غير موجود');
        }
        
        if (result.coverage >= 85) {
          result.status = 'complete';
        } else if (result.coverage >= 50) {
          result.status = 'partial';
        } else {
          result.status = 'low_coverage';
        }
      }
      
    } catch (e) {
      result.status = 'error';
      result.notes.push(`❌ خطأ: ${e.message}`);
    }
    
    results.push(result);
  }
  
  // ─── فحص Solutions Pages ───
  console.log(`💡 فحص ${SOLUTIONS_PAGES.length} صفحة solutions...`);
  for (const htmlPath of SOLUTIONS_PAGES) {
    const result = {
      htmlPath,
      astroPath: 'solutions/[slug].astro أو [sector].astro أو [sector]/[city].astro',
      status: 'unknown',
      htmlSize: 0,
      astroSize: 0,
      coverage: 0,
      missingSamples: [],
      brokenLinks: [],
      notes: [],
    };
    
    try {
      const htmlContent = execSync(
        `cd ${ROOT} && git show ${COMMIT}:${htmlPath} 2>/dev/null || echo "NOT_FOUND"`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      if (htmlContent.includes('NOT_FOUND')) {
        result.status = 'skipped_no_html';
        results.push(result);
        continue;
      }
      
      result.htmlSize = htmlContent.length;
      const htmlReadable = extractReadableText(htmlContent);
      
      // Solutions use data files
      const solutionsData = join(ROOT, 'src/data/solutions.ts');
      let astroContent = '';
      if (existsSync(solutionsData)) {
        astroContent = readFileSync(solutionsData, 'utf8');
      }
      
      if (!astroContent) {
        result.status = 'missing_solutions_data';
        result.notes.push('❌ ملف data/solutions.ts غير موجود');
      } else {
        result.astroSize = astroContent.length;
        const comparison = compareContent(htmlReadable, astroContent);
        result.coverage = comparison.coverage;
        result.missingSamples = comparison.missing.slice(0, 5);
        
        // فحص مسارات Astro
        const parts = htmlPath.split('/');
        if (parts.length === 2) {
          // solutions/xxx.html — old flat structure, is there [slug].astro?
          if (!existsSync(join(ASTRO_DIR, 'solutions/[slug].astro'))) {
            result.notes.push('⚠️ solutions/[slug].astro غير موجود');
          }
        } else if (parts.length === 3) {
          // solutions/xxx/yyy — either [sector] or [slug] with index
          if (!existsSync(join(ASTRO_DIR, 'solutions/[sector].astro')) &&
              !existsSync(join(ASTRO_DIR, 'solutions/[slug].astro'))) {
            result.notes.push('⚠️ لا يوجد مسار ديناميكي للحلول');
          }
        } else if (parts.length === 4) {
          // solutions/xxx/yyy/zzz — [sector]/[city]
          if (!existsSync(join(ASTRO_DIR, 'solutions/[sector]/[city].astro'))) {
            result.notes.push('⚠️ solutions/[sector]/[city].astro غير موجود');
          }
        }
        
        if (result.coverage >= 85) {
          result.status = 'complete';
        } else if (result.coverage >= 50) {
          result.status = 'partial';
        } else {
          result.status = 'low_coverage';
        }
      }
      
    } catch (e) {
      result.status = 'error';
      result.notes.push(`❌ خطأ: ${e.message}`);
    }
    
    results.push(result);
  }
  
  // ─── توليد التقرير ───
  generateReport(results, astroFiles);
  
  console.log('\n✅ تم الانتهاء من فحص الترحيل المحسّن.');
}

function generateReport(results, astroFiles) {
  const complete = results.filter(r => r.status === 'complete');
  const partial = results.filter(r => r.status === 'partial');
  const lowCoverage = results.filter(r => r.status === 'low_coverage');
  const missingContent = results.filter(r => r.status === 'missing_content');
  const frontmatterOnly = results.filter(r => r.status === 'frontmatter_only');
  const missingPage = results.filter(r => r.status === 'missing_astro_page');
  const missingHtml = results.filter(r => r.status === 'missing_html_source');
  const missingData = results.filter(r => r.status === 'missing_kernel_data' || r.status === 'missing_solutions_data');
  const missingMd = results.filter(r => r.status === 'missing_md_source');
  const skipped = results.filter(r => r.status === 'skipped_no_html');
  const errors = results.filter(r => r.status === 'error');
  
  const totalPages = results.length;
  const successCount = complete.length + partial.length;
  const failCount = totalPages - successCount - skipped.length;
  
  let report = `# BrightAI Migration Audit Report v2

**Date:** ${new Date().toLocaleDateString('ar-SA')}
**Total Items Checked:** ${totalPages}
**Astro Pages Found:** ${astroFiles.length}

---

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Complete (≥85%) | ${complete.length} | ${Math.round(complete.length / totalPages * 100)}% |
| ⚠️ Partial (50-84%) | ${partial.length} | ${Math.round(partial.length / totalPages * 100)}% |
| 🔶 Low Coverage (15-49%) | ${lowCoverage.length} | ${Math.round(lowCoverage.length / totalPages * 100)}% |
| ❌ Missing Content (<15%) | ${missingContent.length} | ${Math.round(missingContent.length / totalPages * 100)}% |
| 📄 Frontmatter Only | ${frontmatterOnly.length} | ${Math.round(frontmatterOnly.length / totalPages * 100)}% |
| 🚫 Missing Astro Page | ${missingPage.length} | ${Math.round(missingPage.length / totalPages * 100)}% |
| 📂 Missing HTML Source | ${missingHtml.length} | ${Math.round(missingHtml.length / totalPages * 100)}% |
| 🔧 Missing Data | ${missingData.length} | ${Math.round(missingData.length / totalPages * 100)}% |
| 📝 Missing MD Source | ${missingMd.length} | ${Math.round(missingMd.length / totalPages * 100)}% |
| ⏭️ Skipped (no HTML) | ${skipped.length} | ${Math.round(skipped.length / totalPages * 100)}% |
| ❗ Errors | ${errors.length} | ${Math.round(errors.length / totalPages * 100)}% |

**Overall Success Rate (≥50% coverage):** ${Math.round(successCount / (totalPages - skipped.length) * 100)}%

---

## Detailed Results

`;
  
  // ترتيب النتائج — الأعلى تغطية أولاً
  const ordered = [
    ...complete.sort((a, b) => b.coverage - a.coverage),
    ...partial.sort((a, b) => b.coverage - a.coverage),
    ...lowCoverage.sort((a, b) => b.coverage - a.coverage),
    ...missingContent.sort((a, b) => b.coverage - a.coverage),
    ...frontmatterOnly,
    ...missingPage,
    ...missingHtml,
    ...missingData,
    ...missingMd,
    ...skipped,
    ...errors,
  ];
  
  for (const r of ordered) {
    const statusEmoji = r.status === 'complete' ? '✅' :
      r.status === 'partial' ? '⚠️' :
      r.status === 'low_coverage' ? '🔶' :
      r.status === 'missing_content' ? '❌' :
      r.status === 'frontmatter_only' ? '📄' :
      r.status === 'missing_astro_page' ? '🚫' :
      r.status === 'missing_html_source' ? '📂' :
      r.status === 'missing_kernel_data' ? '🔧' :
      r.status === 'missing_solutions_data' ? '🔧' :
      r.status === 'missing_md_source' ? '📝' :
      r.status === 'skipped_no_html' ? '⏭️' : '❗';
    
    const statusLabel = r.status === 'complete' ? '✅ Complete' :
      r.status === 'partial' ? '⚠️ Partial' :
      r.status === 'low_coverage' ? '🔶 Low' :
      r.status === 'missing_content' ? '❌ Missing' :
      r.status === 'frontmatter_only' ? '📄 Frontmatter Only' :
      r.status === 'missing_astro_page' ? '🚫 No Astro' :
      r.status === 'missing_html_source' ? '📂 No HTML' :
      r.status === 'missing_kernel_data' ? '🔧 No Kernel Data' :
      r.status === 'missing_solutions_data' ? '🔧 No Solutions Data' :
      r.status === 'missing_md_source' ? '📝 No MD' :
      r.status === 'skipped_no_html' ? '⏭️ Skipped' : '❗ Error';
    
    report += `### ${statusEmoji} ${r.htmlPath}
- **Status:** ${statusLabel}
`;
    if (r.coverage > 0) report += `- **Coverage:** ${r.coverage}%\n`;
    if (r.htmlSize) report += `- **HTML Size:** ${(r.htmlSize / 1024).toFixed(1)}KB\n`;
    if (r.astroSize) report += `- **Astro Size:** ${(r.astroSize / 1024).toFixed(1)}KB\n`;
    if (r.brokenLinks?.length > 0) {
      report += `- **Broken Links:** ${r.brokenLinks.length}\n`;
      for (const bl of r.brokenLinks.slice(0, 3)) {
        report += `  - \`${bl.href}\` → ${bl.issue}\n`;
      }
      if (r.brokenLinks.length > 3) {
        report += `  - ... and ${r.brokenLinks.length - 3} more\n`;
      }
    }
    if (r.missingSamples?.length > 0) {
      report += `- **Missing Samples:**\n`;
      for (const ms of r.missingSamples.slice(0, 2)) {
        report += `  - \`${ms.slice(0, 70)}...\`\n`;
      }
    }
    if (r.notes?.length > 0) {
      for (const n of r.notes) {
        report += `- ${n}\n`;
      }
    }
    report += '\n';
  }
  
  // ─── Recommendations ───
  report += `---

## Recommendations & Priority Actions

### Pages needing attention (sorted by priority):
\n`;
  
  const needsFix = [...frontmatterOnly, ...missingContent, ...lowCoverage, ...partial.filter(r => r.coverage < 85)];
  if (needsFix.length === 0) {
    report += '🎉 **All pages are fully migrated!** No content remediation needed.\n';
  } else {
    // Group by type
    const docsNeedingContent = needsFix.filter(r => r.astroPath?.startsWith('content/docs/'));
    const pagesNeedingWork = needsFix.filter(r => !r.astroPath?.startsWith('content/docs/') && !r.astroPath?.startsWith('content/blog/'));
    
    if (docsNeedingContent.length > 0) {
      report += '### 📚 Docs needing content migration (from HTML → Markdown):\n\n';
      for (const r of docsNeedingContent) {
        report += `- ${r.htmlPath} (coverage: ${r.coverage}%)\n`;
      }
      report += '\n';
    }
    
    if (pagesNeedingWork.length > 0) {
      report += '### 📄 Pages needing content remediation:\n\n';
      for (const r of pagesNeedingWork) {
        report += `- ${r.htmlPath} → ${r.astroPath} (coverage: ${r.coverage}%)\n`;
      }
      report += '\n';
    }
    
    report += `### Priority actions:

1. **FIRST — Copy content from HTML to Markdown** for the ${docsNeedingContent.length} docs that are frontmatter-only
2. **SECOND — Review wrapper pages** (legal, hub) and inline their HTML content
3. **THIRD — Fix broken internal links** in pages with high coverage but broken links
4. **FOURTH — Rebuild pages** with unified design system after content is verified
`;
  }
  
  // Save report
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_FILE, report, 'utf8');
  console.log(`📄 Report saved: ${REPORT_FILE}`);
}

// Run
auditMigration().catch(console.error);