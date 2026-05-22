/**
 * سكربت توليد تقرير SEO شامل بصيغة DOCX
 * يغطي: Technical SEO, Indexability, UX/UI, Saudi SEO
 * الموقع: brightai.site
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  PageBreak, TabStopType, TabStopPosition
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Helper functions ───

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 }, bidirectional: true, alignment: AlignmentType.RIGHT });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri', rightToLeft: true, ...opts })],
    spacing: { after: 100 },
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
  });
}

function boldPara(text) {
  return para(text, { bold: true, size: 24 });
}

function percentBar(label, pct) {
  const color = pct >= 80 ? '2E7D32' : pct >= 60 ? 'F57F17' : 'C62828';
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, font: 'Calibri', rightToLeft: true }),
      new TextRun({ text: `${pct}%`, bold: true, size: 26, color, font: 'Calibri' }),
    ],
    spacing: { after: 80 },
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri', rightToLeft: true })],
    bullet: { level: 0 },
    spacing: { after: 50 },
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
  });
}

const headerCell = (text) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: 'Calibri', color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
  shading: { fill: '0D47A1', type: ShadingType.CLEAR },
  width: { size: 1500, type: WidthType.DXA },
});

const cell = (text, shade) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text: text || '—', size: 18, font: 'Calibri', rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true })],
  ...(shade ? { shading: { fill: 'F5F5F5', type: ShadingType.CLEAR } } : {}),
  width: { size: 1500, type: WidthType.DXA },
});

const statusCell = (ok) => {
  const t = ok ? '✅' : '❌';
  const c = ok ? '2E7D32' : 'C62828';
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, color: c })], alignment: AlignmentType.CENTER })],
  });
};

function makeTable(headers, rows) {
  return new Table({
    rows: [
      new TableRow({ children: headers.map(h => headerCell(h)), tableHeader: true }),
      ...rows.map((r, i) => new TableRow({
        children: r.map(c => typeof c === 'boolean' ? statusCell(c) : cell(String(c), i % 2 === 1)),
      })),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── Data Collection ───

// Count demo pages
const demoDir = path.join(ROOT, 'demo');
const demoDirs = fs.readdirSync(demoDir).filter(f => fs.statSync(path.join(demoDir, f)).isDirectory() && f !== 'resources');
const demoPages = [];

for (const d of demoDirs) {
  const idx = path.join(demoDir, d, 'index.html');
  if (!fs.existsSync(idx)) continue;
  const html = fs.readFileSync(idx, 'utf8');

  const titleMatch = html.match(/<title>(.*?)<\/title>/s);
  const descMatch = html.match(/name="description"\s+content="(.*?)"/s) || html.match(/content="(.*?)"\s+.*?name="description"/s);
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const canonMatch = html.match(/rel="canonical"\s+href="(.*?)"/s) || html.match(/href="(.*?)"\s+rel="canonical"/s);
  const schemaCount = (html.match(/application\/ld\+json/g) || []).length;
  const hreflangEn = html.includes('hreflang="en-SA"') || html.includes('hreflang="en"');
  const hasCTA = html.includes('btn-primary') || html.includes('cta') || html.includes('احجز') || html.includes('جرّب');
  const wordCount = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
  const hasNoindex = html.includes('noindex');

  // Check if in sitemap
  const sitemapContent = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const inSitemap = sitemapContent.includes(`/demo/${d}/`);

  demoPages.push({
    name: d,
    url: `/demo/${d}/`,
    title: titleMatch ? titleMatch[1].substring(0, 60) : 'مفقود',
    desc: descMatch ? descMatch[1].substring(0, 60) + '...' : 'مفقود',
    h1: h1Match ? h1Match[1].replace(/<[^>]*>/g, '').substring(0, 40) : 'مفقود',
    canonical: canonMatch ? (canonMatch[1].includes(`/demo/${d}/`) ? 'ذاتي ✅' : 'خاطئ ❌') : 'مفقود ❌',
    schema: schemaCount > 0,
    hreflangEn,
    hasCTA,
    wordCount,
    hasNoindex,
    inSitemap,
  });
}

// Services pages
const servicesDir = path.join(ROOT, 'services');
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.html'));

// Blog pages
const blogDir = path.join(ROOT, 'blog');
const blogDirs = fs.existsSync(blogDir) ? fs.readdirSync(blogDir).filter(f => {
  const p = path.join(blogDir, f);
  return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'index.html'));
}) : [];

// EN pages
const enDir = path.join(ROOT, 'en');
const enPages = [];
function walkDir(dir, base = '') {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) walkDir(fp, base + '/' + f);
    else if (f.endsWith('.html')) enPages.push(base + '/' + f);
  }
}
walkDir(enDir);

// Sitemap analysis
const sitemapXml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const reportsInSitemap = sitemapUrls.filter(u => u.includes('/reports/'));
const index2InSitemap = sitemapUrls.filter(u => u.includes('index 2') || u.includes('index%202'));

// Sectors
const sectorsDir = path.join(ROOT, 'sectors');
const sectorFiles = fs.existsSync(sectorsDir) ? fs.readdirSync(sectorsDir).filter(f => f.endsWith('.html') || (fs.statSync(path.join(sectorsDir, f)).isDirectory())) : [];

// Locations
const locationsDir = path.join(ROOT, 'locations');
const locationDirs = fs.existsSync(locationsDir) ? fs.readdirSync(locationsDir).filter(f => fs.statSync(path.join(locationsDir, f)).isDirectory()) : [];

// ─── Calculate percentages ───

const totalPublicPages = demoPages.length + serviceFiles.length + blogDirs.length + sectorFiles.length + locationDirs.length + enPages.length + 15; // +15 for main pages
const pagesInSitemap = sitemapUrls.length;
const demoInSitemap = demoPages.filter(d => d.inSitemap).length;
const demoWithTitle = demoPages.filter(d => d.title !== 'مفقود').length;
const demoWithDesc = demoPages.filter(d => d.desc !== 'مفقود').length;
const demoWithCanonical = demoPages.filter(d => d.canonical.includes('✅')).length;
const demoWithSchema = demoPages.filter(d => d.schema).length;
const demoWithCTA = demoPages.filter(d => d.hasCTA).length;
const demoWithHreflangEn = demoPages.filter(d => d.hreflangEn).length;
const demoNoindex = demoPages.filter(d => d.hasNoindex).length;

const pctDemoInSitemap = Math.round((demoInSitemap / demoPages.length) * 100);
const pctDemoTitle = Math.round((demoWithTitle / demoPages.length) * 100);
const pctDemoDesc = Math.round((demoWithDesc / demoPages.length) * 100);
const pctDemoCanonical = Math.round((demoWithCanonical / demoPages.length) * 100);
const pctDemoSchema = Math.round((demoWithSchema / demoPages.length) * 100);
const pctDemoCTA = Math.round((demoWithCTA / demoPages.length) * 100);
const pctNoReportsInSitemap = Math.round(((sitemapUrls.length - reportsInSitemap.length) / sitemapUrls.length) * 100);

// Overall health
const checks = [
  demoNoindex === 0, // no noindex on demos
  pctDemoInSitemap >= 80,
  pctDemoTitle >= 90,
  pctDemoDesc >= 90,
  pctDemoCanonical >= 90,
  pctDemoSchema >= 80,
  pctDemoCTA >= 80,
  reportsInSitemap.length === 0,
  index2InSitemap.length === 0,
];
const passedChecks = checks.filter(Boolean).length;
const overallScore = Math.round((passedChecks / checks.length) * 100);

// ─── BUILD DOCUMENT ───

const sections = [];

// COVER PAGE
sections.push(
  new Paragraph({ spacing: { before: 2000 } }),
  new Paragraph({
    children: [new TextRun({ text: 'تقرير التدقيق الشامل', size: 56, bold: true, font: 'Calibri', color: '0D47A1', rightToLeft: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Technical SEO · Indexability · UX/UI · Saudi SEO', size: 28, font: 'Calibri', color: '455A64' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'brightai.site', size: 32, bold: true, font: 'Calibri', color: '1565C0' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }),
  new Paragraph({
    children: [new TextRun({ text: `التاريخ: ${new Date().toLocaleDateString('ar-SA')}`, size: 22, font: 'Calibri', rightToLeft: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'إعداد: Bright AI SEO Agent', size: 22, font: 'Calibri' })],
    alignment: AlignmentType.CENTER,
  }),
  pageBreak(),
);

// TABLE OF CONTENTS (manual)
sections.push(
  heading('فهرس المحتويات', HeadingLevel.HEADING_1),
  para('1. الملخص التنفيذي والنسب المئوية'),
  para('2. تدقيق خريطة الموقع (Sitemap Audit)'),
  para('3. تدقيق صفحات الديمو (Demo Pages Indexing Audit)'),
  para('4. سياسة السايت ماب (Fix Sitemap Policy)'),
  para('5. الصفحات المطلوبة المفقودة (Fix Missing Required Pages)'),
  para('6. الروابط المكررة والضعيفة (Fix Duplicate/Weak URLs)'),
  para('7. الأصول المكسورة (Fix Broken Assets)'),
  para('8. تدقيق Hreflang'),
  para('9. الربط الداخلي لتحقيق الفهرسة الكاملة'),
  para('10. قالب SEO لصفحات الديمو'),
  para('11. تحسين السيو السعودي (Saudi SEO Enhancement)'),
  para('12. تدقيق التصميم وتجربة المستخدم (Design & UX Audit)'),
  para('13. معايير القبول النهائية (Final Acceptance Criteria)'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 1: EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════
sections.push(
  heading('1. الملخص التنفيذي والنسب المئوية', HeadingLevel.HEADING_1),
  para(`هذا التقرير يقدم تحليلاً شاملاً لموقع Bright AI (brightai.site) من أربعة محاور: Technical SEO، قابلية الفهرسة (Indexability)، تجربة المستخدم (UX/UI)، والسيو السعودي (Saudi SEO). الهدف هو جعل كل الصفحات العامة بما فيها صفحات الديمو قابلة للفهرسة في Google.`),
  new Paragraph({ spacing: { after: 200 } }),
  boldPara('📊 النسب المئوية العامة:'),
  percentBar('الدرجة الإجمالية لصحة الموقع', overallScore),
  percentBar('صفحات الديمو في السايت ماب', pctDemoInSitemap),
  percentBar('صفحات ديمو بعنوان Title', pctDemoTitle),
  percentBar('صفحات ديمو بوصف Meta Description', pctDemoDesc),
  percentBar('صفحات ديمو بـ Canonical ذاتي', pctDemoCanonical),
  percentBar('صفحات ديمو بـ Schema', pctDemoSchema),
  percentBar('صفحات ديمو بـ CTA واضح', pctDemoCTA),
  percentBar('نظافة السايت ماب من /reports/', pctNoReportsInSitemap),
  percentBar('خلو الديمو من noindex', demoNoindex === 0 ? 100 : 0),
  new Paragraph({ spacing: { after: 200 } }),

  boldPara('📈 إحصائيات رئيسية:'),
  makeTable(
    ['المؤشر', 'القيمة', 'الحالة'],
    [
      ['إجمالي صفحات الموقع (HTML)', '316', '—'],
      ['إجمالي URLs في sitemap.xml', String(sitemapUrls.length), sitemapUrls.length > 150 ? '✅' : '⚠️'],
      ['صفحات الديمو', String(demoPages.length), '—'],
      ['ديمو في السايت ماب', `${demoInSitemap}/${demoPages.length}`, pctDemoInSitemap >= 90 ? '✅' : '⚠️'],
      ['ديمو بـ Title', `${demoWithTitle}/${demoPages.length}`, pctDemoTitle >= 90 ? '✅' : '❌'],
      ['ديمو بـ Schema', `${demoWithSchema}/${demoPages.length}`, pctDemoSchema >= 80 ? '✅' : '⚠️'],
      ['صفحات خدمات', String(serviceFiles.length), '—'],
      ['مقالات مدونة', String(blogDirs.length), '—'],
      ['صفحات إنجليزية', String(enPages.length), '—'],
      ['روابط /reports/ في السايت ماب', String(reportsInSitemap.length), reportsInSitemap.length === 0 ? '✅' : '❌'],
      ['روابط index 2 في السايت ماب', String(index2InSitemap.length), index2InSitemap.length === 0 ? '✅' : '❌'],
      ['روابط مكسورة', '28', '⚠️'],
      ['صفحات خارج السايت ماب', '110', '❌'],
      ['مشاكل Canonical', '2', '⚠️'],
      ['مشاكل Hreflang', '45', '❌'],
      ['مشاكل UI (عالية)', '28', '⚠️'],
      ['مشاكل UI (متوسطة)', '365', '⚠️'],
      ['ميزانية الأداء', 'ناجحة', '✅'],
    ]
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 2: SITEMAP AUDIT
// ═══════════════════════════════════════════════════
sections.push(
  heading('2. تدقيق خريطة الموقع (Sitemap Full Public Indexing Audit)', HeadingLevel.HEADING_1),
  para(`السايت ماب الحالي يحتوي ${sitemapUrls.length} رابط. تم اكتشاف مشاكل رئيسية:`),
  new Paragraph({ spacing: { after: 100 } }),

  boldPara('🔴 مشاكل حرجة:'),
  bullet(`${reportsInSitemap.length} رابط من /reports/keywords/ موجود في السايت ماب — يجب إزالتها فوراً`),
  bullet(`${index2InSitemap.length} رابط يحتوي "index 2" — روابط مكررة ضعيفة يجب حذفها`),
  bullet('110 صفحة عامة خارج السايت ماب — يجب إضافة الصفحات المؤهلة'),
  bullet('4 صفحات مهمة مفقودة من السايت ماب حسب فحص seo:qa'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📋 روابط /reports/keywords/ الموجودة خطأً في السايت ماب (41 رابط):'),
  para('هذه الروابط تشير إلى تقارير كلمات مفتاحية داخلية وليست صفحات عامة. الـ canonical الخاص بها يشير إلى صفحات /docs/ وهو دليل على أنها نسخ ثانوية يجب عدم فهرستها كمسارات مستقلة.'),
  new Paragraph({ spacing: { after: 100 } }),

  boldPara('الحل:'),
  bullet('إزالة جميع روابط /reports/keywords/ من sitemap.xml'),
  bullet('إزالة روابط index 2 من sitemap.xml'),
  bullet('إضافة الصفحات العامة المفقودة التالية:'),
  bullet('   /smart-medical-archive/'),
  bullet('   /tenders/ (أو ربطها بـ /demo/ai-tenders-analysis/)'),
  bullet('   /tenders/landing/'),
  bullet('   /tenders/compare/'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📊 حالة الأقسام في السايت ماب:'),
  makeTable(
    ['القسم', 'عدد الصفحات', 'في السايت ماب', 'النسبة', 'الحالة'],
    [
      ['الديمو /demo/', String(demoPages.length), String(demoInSitemap), pctDemoInSitemap + '%', pctDemoInSitemap >= 90 ? '✅' : '⚠️'],
      ['الخدمات /services/', String(serviceFiles.length), '31 (sitemap-services)', '100%', '✅'],
      ['المدونة /blog/', String(blogDirs.length), '79 (sitemap-blog)', '100%', '✅'],
      ['القطاعات /sectors/', String(sectorFiles.length), '~14', '~74%', '⚠️'],
      ['المواقع /locations/', String(locationDirs.length), '3', '100%', '✅'],
      ['الإنجليزي /en/', String(enPages.length), '~22', '~71%', '⚠️'],
      ['الأدلة /docs/', '41', '41', '100%', '✅'],
    ]
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 3: DEMO PAGES AUDIT
// ═══════════════════════════════════════════════════
sections.push(
  heading('3. تدقيق صفحات الديمو (Demo Pages Indexing Audit)', HeadingLevel.HEADING_1),
  para(`تم فحص ${demoPages.length} صفحة ديمو. جميع الصفحات تمثل نماذج تجريبية للعملاء ويجب فهرستها.`),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('✅ نقاط القوة:'),
  bullet(`لا توجد أي صفحة ديمو عليها noindex (${demoNoindex} صفحة)`),
  bullet(`${pctDemoTitle}% من صفحات الديمو لديها عنوان Title`),
  bullet(`${pctDemoSchema}% لديها Schema (JSON-LD)`),
  bullet(`${pctDemoCTA}% لديها CTA واضح`),
  bullet('جميع الصفحات لا يتم حظرها من robots.txt'),
  bullet('جميع الصفحات تفتح بروابط نظيفة'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('⚠️ نقاط تحتاج تحسين:'),
  bullet(`فقط ${demoWithHreflangEn} صفحة ديمو لديها hreflang en-SA — الباقي يفتقر للإشارة للنسخة الإنجليزية`),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📋 جدول تفصيلي لصفحات الديمو:'),
  makeTable(
    ['الصفحة', 'Title', 'H1', 'Canonical', 'Schema', 'CTA', 'كلمات', 'في Sitemap', 'فهرسة'],
    demoPages.map(d => [
      d.name,
      d.title !== 'مفقود' ? '✅' : '❌',
      d.h1 !== 'مفقود' ? '✅' : '❌',
      d.canonical.includes('✅') ? '✅' : '❌',
      d.schema ? '✅' : '❌',
      d.hasCTA ? '✅' : '❌',
      String(d.wordCount),
      d.inSitemap ? '✅' : '❌',
      !d.hasNoindex ? '✅ قابلة' : '❌ محجوبة',
    ])
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 4: SITEMAP POLICY FIX
// ═══════════════════════════════════════════════════
sections.push(
  heading('4. إصلاح سياسة السايت ماب (Fix Sitemap Policy)', HeadingLevel.HEADING_1),
  para('التعديلات المطلوبة على منطق توليد السايت ماب في generate-sitemap-all-pages.mjs:'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('✅ قواعد الإضافة (Include):'),
  bullet('شمول كل /demo/**/*.html العامة بما فيها الصفحات الفرعية مثل dashboard.html و compare.html'),
  bullet('تحويل روابط .html إلى canonical نظيفة: /demo/name/'),
  bullet('شمول كل صفحات الخدمات /services/*.html'),
  bullet('شمول كل صفحات القطاعات /sectors/'),
  bullet('شمول كل صفحات المواقع /locations/'),
  bullet('شمول كل صفحات المدونة /blog/'),
  bullet('شمول كل صفحات الأدلة /docs/'),
  bullet('شمول كل صفحات /en/ العامة'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('❌ قواعد الاستبعاد (Exclude):'),
  bullet('لا يضاف أي ملف من /reports/ أو /backend/ أو /.next/ أو /node_modules/'),
  bullet('لا يضاف ملف مكرر أو اسمه يحتوي مسافات (مثل index 2.html)'),
  bullet('لا يضاف صفحة redirect فقط'),
  bullet('لا يضاف URL canonical مختلف عن نفسه'),
  bullet('لا يضاف ملفات 404.html أو 500.html أو error.html'),
  bullet('لا يضاف ملفات API أو JSON أو JS/CSS المباشرة'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📊 التأثير المتوقع:'),
  makeTable(
    ['الإجراء', 'عدد الروابط', 'التأثير'],
    [
      ['إزالة /reports/keywords/', '41', 'تنظيف السايت ماب من صفحات غير عامة'],
      ['إزالة index 2 URLs', '2', 'إزالة روابط مكررة ضعيفة'],
      ['إضافة صفحات عامة مفقودة', '~15-20', 'تحسين تغطية الفهرسة'],
      ['الإجمالي بعد التعديل', '~170', 'سايت ماب نظيف ومركز'],
    ]
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 5: MISSING REQUIRED PAGES
// ═══════════════════════════════════════════════════
sections.push(
  heading('5. الصفحات المطلوبة المفقودة (Fix Missing Required Pages)', HeadingLevel.HEADING_1),
  para('فحص seo:qa أظهر 4 صفحات مطلوبة مفقودة من السايت ماب:'),
  new Paragraph({ spacing: { after: 150 } }),

  makeTable(
    ['الصفحة المفقودة', 'الحالة الحالية', 'الحل المقترح', 'الأولوية'],
    [
      ['/smart-medical-archive/', 'غير موجودة في السايت ماب لكن الديمو موجود', 'إنشاء صفحة landing في المسار /smart-medical-archive/ تشير للديمو، أو إضافة redirect 301 إلى /demo/smart-medical-archive/', 'عالية'],
      ['/tenders/', 'غير موجودة — المحتوى في /demo/ai-tenders-analysis/', 'إنشاء redirect 301 من /tenders/ إلى /demo/ai-tenders-analysis/ أو إنشاء صفحة landing مستقلة', 'عالية'],
      ['/tenders/landing/', 'غير موجودة — المحتوى في /demo/ai-tenders-analysis/landing/', 'redirect 301 إلى /demo/ai-tenders-analysis/landing/', 'متوسطة'],
      ['/tenders/compare/', 'غير موجودة — المحتوى في /demo/ai-tenders-analysis/compare/', 'redirect 301 إلى /demo/ai-tenders-analysis/compare/', 'متوسطة'],
    ]
  ),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('💡 ملاحظة:'),
  para('الصفحات الإنجليزية مثل /en/tenders/ موجودة بالفعل في المشروع والسايت ماب. المشكلة فقط في النسخة العربية.'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 6: DUPLICATE/WEAK URLs
// ═══════════════════════════════════════════════════
sections.push(
  heading('6. الروابط المكررة والضعيفة (Fix Duplicate & Weak URLs)', HeadingLevel.HEADING_1),
  para('تم اكتشاف ملفين بأسماء ضعيفة تحتوي مسافات:'),
  new Paragraph({ spacing: { after: 150 } }),

  makeTable(
    ['الملف', 'المشكلة', 'الحل', 'الأولوية'],
    [
      ['en/ai-bots/BrightProject/index 2.html', 'اسم ملف يحتوي مسافة → URL ضعيف', 'حذف الملف أو إعادة تسميته → إنشاء redirect 301 للنسخة الرسمية /en/ai-bots/BrightProject/', 'حرجة'],
      ['en/ai-bots/BrightSales/index 2.html', 'اسم ملف يحتوي مسافة → URL ضعيف', 'حذف الملف أو إعادة تسميته → إنشاء redirect 301 للنسخة الرسمية /en/ai-bots/BrightSales/', 'حرجة'],
    ]
  ),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('الحالة الحالية:'),
  bullet('الملفان موجودان في السايت ماب بروابط index 2/ — يجب إزالتهما'),
  bullet('الملفان يحتويان 4 مراجع مكسورة لـ /assets/images/logo.PNG لكل منهما'),
  bullet('canonical لكليهما يشير إلى النسخة الرسمية (صحيح) لكن وجودهما يسبب تشتيت'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('خطوات الإصلاح:'),
  bullet('1. حذف الملفين أو إعادة تسميتهما'),
  bullet('2. إزالة الروابط من sitemap.xml'),
  bullet('3. إضافة redirect 301 في _redirects إذا لزم'),
  bullet('4. التأكد أن النسخة الرسمية (index.html) هي الوحيدة المفهرسة'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 7: BROKEN ASSETS
// ═══════════════════════════════════════════════════
sections.push(
  heading('7. الأصول المكسورة (Fix Broken Assets)', HeadingLevel.HEADING_1),
  para('تم اكتشاف 28 مرجع مكسور في 9 ملفات:'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('🔴 المشكلة الأولى: /assets/images/logo.PNG (10 مراجع)'),
  para('الملف logo.PNG غير موجود. الملفات المتاحة هي: logo-new.PNG، logo.png، logo.webp، logo.avif'),
  bullet('الملفات المتأثرة: demo/smart-hiring-system/index.html (2 مرجع)'),
  bullet('الملفات المتأثرة: en/ai-bots/BrightProject/index 2.html (4 مراجع)'),
  bullet('الملفات المتأثرة: en/ai-bots/BrightSales/index 2.html (4 مراجع)'),
  boldPara('الحل: استبدال /assets/images/logo.PNG بـ /assets/images/logo-new.PNG أو /assets/images/logo.png'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('🔴 المشكلة الثانية: /assets/images/Gemini.png (18 مرجع)'),
  para('الملف غير موجود في assets/images/ لكنه موجود في blog/Gemini.png'),
  bullet('الملفات المتأثرة: جميع صفحات sectors EN (6 ملفات × 3 مراجع)'),
  boldPara('الحل: نقل blog/Gemini.png إلى assets/images/Gemini.png أو تحديث المراجع'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📊 ملخص الأصول:'),
  makeTable(
    ['الأصل المكسور', 'عدد المراجع', 'الملف الصحيح', 'الحل'],
    [
      ['/assets/images/logo.PNG', '10', '/assets/images/logo-new.PNG', 'تحديث المراجع في الملفات المتأثرة'],
      ['/assets/images/Gemini.png', '18', '/blog/Gemini.png', 'نقل الملف أو تحديث المسار'],
    ]
  ),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('توحيد og:image و twitter:image:'),
  para('جميع صفحات الديمو تستخدم /assets/images/logo-new.PNG كصورة og:image — وهو متسق. يُنصح بإنشاء صور og:image مخصصة لكل ديمو مستقبلاً.'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 8: HREFLANG AUDIT
// ═══════════════════════════════════════════════════
sections.push(
  heading('8. تدقيق Hreflang', HeadingLevel.HEADING_1),
  para('فحص html-seo-governor أظهر 45 صفحة بمشاكل hreflang (مفقود أو غير متطابق):'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📊 حالة Hreflang في صفحات الديمو:'),
  percentBar('ديمو مع hreflang ar-SA', Math.round((29 / demoPages.length) * 100)),
  percentBar('ديمو مع hreflang en-SA', Math.round((1 / demoPages.length) * 100)),
  percentBar('ديمو مع x-default', Math.round((29 / demoPages.length) * 100)),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('المطلوب لكل صفحة لها نسخة إنجليزية:'),
  bullet('hreflang="ar-SA" يشير للنسخة العربية'),
  bullet('hreflang="en-SA" يشير للنسخة الإنجليزية'),
  bullet('hreflang="x-default" يشير للنسخة الافتراضية (عادة العربية)'),
  bullet('كل نسخة يجب أن تشير للنسخة المقابلة بشكل reciprocal'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📋 صفحات الديمو بدون نسخة إنجليزية (ليس خطأ قاتل):'),
  para('معظم صفحات الديمو العربية ليس لها نسخة إنجليزية حالياً. هذا ليس خطأ تقني لكنه فرصة ضائعة.'),
  new Paragraph({ spacing: { after: 100 } }),

  boldPara('💡 التوصية:'),
  bullet('إنشاء نسخ إنجليزية للديموهات التجارية المهمة (smart-hiring-system, ai-tenders-analysis, data-analyzer, ocr-demo)'),
  bullet('إضافة hreflang متبادل بين النسختين العربية والإنجليزية'),
  bullet('إصلاح الـ 44 صفحة التي تفتقر لـ canonical حسب تقرير html-seo-governor'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 9: INTERNAL LINKING
// ═══════════════════════════════════════════════════
sections.push(
  heading('9. الربط الداخلي لتحقيق الفهرسة الكاملة', HeadingLevel.HEADING_1),
  para('تدقيق الروابط الداخلية أظهر: 6,693 رابط داخلي عبر 274 صفحة، 0 صفحة يتيمة.'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('✅ نقاط إيجابية:'),
  bullet('لا توجد صفحات يتيمة (orphan pages = 0)'),
  bullet('لا توجد روابط بدون href'),
  bullet('إجمالي الروابط الداخلية المكتشفة: 19,793'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('⚠️ مشاكل مكتشفة:'),
  bullet('110 صفحة عامة خارج السايت ماب'),
  bullet('2 مشكلة canonical'),
  bullet('4 مشاكل hash (#)'),
  bullet('1 صفحة في السايت ماب بدون روابط داخلية كافية'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📋 خطة الربط الداخلي المقترحة:'),
  makeTable(
    ['الصفحة المصدر', 'الهدف (ديمو/خدمة)', 'نص الربط', 'الموضع', 'الأولوية'],
    [
      ['/ (الرئيسية)', '/demo/', 'جرّب حلول Bright AI', 'Hero + Nav', 'حرجة'],
      ['/demo/', 'كل صفحات الديمو', 'كل نموذج تجريبي', 'قائمة الديموهات', 'حرجة'],
      ['/services/smart-hiring-system.html', '/demo/smart-hiring-system/', 'جرّب نظام التوظيف', 'CTA في الخدمة', 'عالية'],
      ['/services/ai-tenders-analysis.html', '/demo/ai-tenders-analysis/', 'جرّب تحليل المناقصات', 'CTA في الخدمة', 'عالية'],
      ['/demo/smart-hiring-system/', '/services/smart-hiring-system.html', 'صفحة الخدمة الرسمية', 'Nav + Footer', 'عالية'],
      ['/blog/ (مقالات ذات صلة)', '/demo/ و /services/', 'روابط سياقية', 'داخل المقال', 'متوسطة'],
      ['Footer (كل الصفحات)', 'أهم 5 ديموهات + خدمات', 'روابط ثابتة', 'الذيل', 'عالية'],
      ['Breadcrumbs (كل ديمو)', '/ → /demo/ → /demo/name/', 'تسلسل تنقلي', 'أعلى الصفحة', 'عالية'],
    ]
  ),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📊 الصفحات ذات الربط الداخلي المنخفض:'),
  makeTable(
    ['الصفحة', 'عدد الروابط الداخلية', 'الحالة', 'الحل'],
    [
      ['/smart-medical-archive/', '0', '❌ معزولة', 'إضافة روابط من /services/ و /demo/ و الرئيسية'],
      ['/tenders/', '0', '❌ معزولة', 'إنشاء الصفحة أو redirect + ربطها'],
      ['/tenders/landing/', '0', '❌ معزولة', 'ربطها من /tenders/ الرئيسية'],
      ['/tenders/compare/', '0', '❌ معزولة', 'ربطها من /tenders/ الرئيسية'],
    ]
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 10: DEMO PAGE SEO TEMPLATE
// ═══════════════════════════════════════════════════
sections.push(
  heading('10. قالب SEO لصفحات الديمو', HeadingLevel.HEADING_1),
  para('صفحة الديمو المثالية يجب أن تحتوي العناصر التالية بالترتيب:'),
  new Paragraph({ spacing: { after: 150 } }),

  makeTable(
    ['العنصر', 'الوصف', 'الحالة الحالية', 'الأولوية'],
    [
      ['Hero واضح', 'عنوان H1 + وصف مباشر + CTA', '✅ مطبق', 'حرجة'],
      ['وصف المشكلة', 'ماذا تحل هذه الأداة', '✅ مطبق', 'حرجة'],
      ['ماذا يفعل النموذج', 'شرح وظيفي واضح', '✅ مطبق', 'عالية'],
      ['مميزات النموذج', 'قائمة بالمميزات الرئيسية', '✅ مطبق', 'عالية'],
      ['حالات استخدام سعودية', 'أمثلة من السوق المحلي', '✅ مطبق', 'عالية'],
      ['لمن هذا النموذج', 'الفئة المستهدفة', '✅ مطبق', 'متوسطة'],
      ['خطوات التجربة', 'دليل استخدام خطوة بخطوة', '✅ مطبق', 'متوسطة'],
      ['صور أو فيديو', 'محتوى مرئي يشرح النموذج', '⚠️ جزئي (لوجو فقط)', 'عالية'],
      ['FAQ', 'أسئلة شائعة مع Schema', '✅ مطبق', 'عالية'],
      ['CTA', 'أزرار واتساب + احجز مكالمة', '✅ مطبق', 'حرجة'],
      ['روابط داخلية', 'ربط بالخدمة والمقالات', '✅ مطبق', 'عالية'],
      ['Schema مناسب', 'SoftwareApplication + Service + FAQ + BreadcrumbList', '✅ مطبق', 'عالية'],
      ['Breadcrumbs', 'الرئيسية → الديموهات → الديمو', '✅ مطبق (Schema)', 'متوسطة'],
      ['مقارنة قبل/بعد', 'قبل Bright AI / بعد Bright AI', '✅ مطبق', 'متوسطة'],
    ]
  ),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('💡 التقييم:'),
  para('قالب صفحات الديمو الحالي ممتاز ومتكامل. الصفحات تحتوي جميع العناصر المطلوبة للفهرسة والتحويل. التحسين الوحيد المقترح هو إضافة صور/فيديو مخصصة بدل الاكتفاء بشعار الشركة.'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 11: SAUDI SEO ENHANCEMENT
// ═══════════════════════════════════════════════════
sections.push(
  heading('11. تحسين السيو السعودي (Saudi SEO Enhancement)', HeadingLevel.HEADING_1),
  para('كلمات مفتاحية مقترحة لأهم صفحات الديمو في السوق السعودي:'),
  new Paragraph({ spacing: { after: 150 } }),

  makeTable(
    ['الديمو', 'الكلمة المفتاحية الرئيسية', 'كلمات ثانوية', 'نية البحث', 'العنوان المقترح'],
    [
      ['smart-hiring-system', 'نظام توظيف ذكي', 'أتمتة التوظيف، فلترة السير الذاتية بالذكاء الاصطناعي', 'تجارية', 'نظام توظيف ذكي بالذكاء الاصطناعي | Bright AI'],
      ['ai-tenders-analysis', 'تحليل المناقصات بالذكاء الاصطناعي', 'تحليل عروض المناقصات، مقارنة مناقصات', 'تجارية', 'تحليل المناقصات الذكي | Bright AI'],
      ['data-analyzer', 'تحليل بيانات للشركات السعودية', 'لوحة تحكم بيانات، تحليل ذكي', 'تجارية/معلوماتية', 'منصة تحليل البيانات الذكية | Bright AI'],
      ['smart-medical-archive', 'أرشفة طبية ذكية', 'أرشفة سجلات المرضى، إدارة الملفات الطبية', 'تجارية', 'أرشفة طبية ذكية بالذكاء الاصطناعي | Bright AI'],
      ['customer-service-automation', 'شات بوت عربي للشركات', 'أتمتة خدمة العملاء، روبوت محادثة عربي', 'تجارية', 'أتمتة خدمة العملاء | شات بوت عربي | Bright AI'],
      ['ocr-demo', 'استخراج نصوص من مستندات', 'OCR عربي، تحويل صور لنص', 'تجارية/معلوماتية', 'استخراج نصوص ذكي من المستندات | Bright AI'],
      ['custom-ai-agent', 'وكلاء ذكاء اصطناعي للشركات', 'وكيل AI مخصص، أتمتة العمليات', 'تجارية', 'وكيل ذكاء اصطناعي مخصص لشركتك | Bright AI'],
      ['ai-consulting', 'استشارة ذكاء اصطناعي', 'استشارات AI، حلول ذكاء اصطناعي', 'تجارية', 'استشارة ذكاء اصطناعي للشركات السعودية | Bright AI'],
      ['marketing-automation', 'أتمتة التسويق بالذكاء الاصطناعي', 'تسويق ذكي، حملات مؤتمتة', 'تجارية', 'أتمتة التسويق الذكي | Bright AI'],
      ['seo-ai-agent', 'وكيل سيو بالذكاء الاصطناعي', 'تحسين محركات البحث، SEO Agent', 'تجارية', 'وكيل SEO ذكي لتحسين موقعك | Bright AI'],
      ['hr-automation', 'أتمتة الموارد البشرية', 'HR ذكي، إدارة موظفين بالذكاء الاصطناعي', 'تجارية', 'أتمتة الموارد البشرية الذكية | Bright AI'],
      ['supply-chain-optimization', 'تحسين سلسلة الإمداد', 'لوجستيات ذكية، تحسين المخزون', 'تجارية', 'تحسين سلسلة الإمداد بالذكاء الاصطناعي | Bright AI'],
    ]
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 12: DESIGN & UX AUDIT
// ═══════════════════════════════════════════════════
sections.push(
  heading('12. تدقيق التصميم وتجربة المستخدم (Design & UX Audit)', HeadingLevel.HEADING_1),
  para(`تم اكتشاف 1,144 مشكلة UI: 28 عالية الخطورة، 365 متوسطة، 751 منخفضة.`),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📊 ملخص مشاكل التصميم:'),
  percentBar('المشاكل العالية (من إجمالي المشاكل)', Math.round((28 / 1144) * 100)),
  percentBar('المشاكل المتوسطة', Math.round((365 / 1144) * 100)),
  percentBar('المشاكل المنخفضة', Math.round((751 / 1144) * 100)),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('🔴 المشاكل العالية الخطورة (28):'),
  bullet('مشاكل RTL: استخدام left/right بدل logical properties (margin-inline-start/end)'),
  bullet('fixed/absolute positioning قد يتداخل مع عناصر UI على الجوال'),
  bullet('أحجام ثابتة (min-height: 50px) قد تقص النصوص العربية الطويلة'),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('📋 تدقيق صفحات الديمو والخدمات:'),
  makeTable(
    ['الصفحة', 'مشكلة بصرية', 'مشكلة UX', 'مشكلة جوال', 'مشكلة CTA', 'الحل', 'الأولوية'],
    [
      ['smart-hiring-system', 'logo.PNG مكسور', 'تنقل ممتاز', 'يحتاج فحص', 'CTA موجود', 'إصلاح logo.PNG', 'عالية'],
      ['ai-tenders-analysis', 'لا يوجد', 'صفحات فرعية كثيرة', 'يحتاج فحص', 'CTA موجود', 'تبسيط التنقل', 'متوسطة'],
      ['جميع الديمو', 'لوجو فقط كصورة', 'قالب موحد وواضح', 'RTL مدعوم', 'CTA واضح', 'إضافة screenshots', 'متوسطة'],
      ['sectors EN', 'Gemini.png مكسور', 'محتوى جيد', 'يحتاج فحص', 'CTA موجود', 'إصلاح مسار الصورة', 'عالية'],
      ['الخدمات', 'تصميم متسق', 'تنقل واضح', 'responsive', 'CTA واتساب', 'جيد', 'منخفضة'],
    ]
  ),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('💡 توصيات التصميم:'),
  bullet('إضافة لقطات شاشة (screenshots) مخصصة لكل ديمو بدل الاكتفاء بالشعار'),
  bullet('تحويل CSS من physical properties إلى logical properties للدعم الكامل لـ RTL'),
  bullet('استخدام min-height ديناميكي بدل القيم الثابتة'),
  bullet('إضافة شعارات عملاء/شركاء وأرقام إحصائية لزيادة الثقة'),
  bullet('تحسين سرعة تحميل الصور باستخدام WebP/AVIF'),
  bullet('إضافة breadcrumbs مرئية في أعلى كل صفحة ديمو'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════
// SECTION 13: FINAL ACCEPTANCE CRITERIA
// ═══════════════════════════════════════════════════
sections.push(
  heading('13. معايير القبول النهائية (Final Acceptance Criteria)', HeadingLevel.HEADING_1),
  para('الجدول التالي يوضح حالة كل معيار من معايير القبول:'),
  new Paragraph({ spacing: { after: 150 } }),

  makeTable(
    ['المعيار', 'الحالة الحالية', 'النتيجة', 'ملاحظات'],
    [
      ['sitemap.xml يحتوي كل الصفحات العامة المهمة', '110 صفحة مفقودة', '❌', 'يجب إضافة الصفحات العامة المؤهلة'],
      ['كل صفحات /demo/ العامة في sitemap', `${demoInSitemap}/${demoPages.length}`, demoInSitemap === demoPages.length ? '✅' : '⚠️', `${pctDemoInSitemap}% تغطية`],
      ['لا توجد /reports/keywords في sitemap', `${reportsInSitemap.length} رابط`, '❌', 'يجب إزالة 41 رابط'],
      ['لا توجد روابط index 2 في sitemap', `${index2InSitemap.length} رابط`, '❌', 'يجب إزالة رابطين'],
      ['لا توجد صفحات demo عليها noindex', '0 صفحة', '✅', 'ممتاز'],
      ['لا توجد صفحات demo محجوبة من robots.txt', 'لا يوجد حجب', '✅', 'robots.txt يسمح بـ /demo/'],
      ['كل صفحة demo لها canonical ذاتي', `${demoWithCanonical}/${demoPages.length}`, demoWithCanonical === demoPages.length ? '✅' : '⚠️', `${pctDemoCanonical}%`],
      ['كل صفحة demo لها title/meta/H1', `${demoWithTitle}/${demoPages.length}`, demoWithTitle === demoPages.length ? '✅' : '❌', `${pctDemoTitle}%`],
      ['كل صفحة demo مرتبطة داخلياً', 'جميعها مرتبطة', '✅', 'orphan = 0'],
      ['npm run seo:gate يمر بدون Critical Errors', '2 فئة مشاكل', '⚠️', 'مشاكل canonical وslug ضعيف'],
      ['لا توجد broken assets', '28 مرجع مكسور', '❌', 'logo.PNG + Gemini.png'],
      ['لا توجد broken internal links', '0 روابط مكسورة', '✅', 'ممتاز'],
      ['ميزانية الأداء', 'ناجحة', '✅', 'كل الحدود ضمن المسموح'],
    ]
  ),
  new Paragraph({ spacing: { after: 200 } }),

  boldPara('📊 الدرجة الإجمالية:'),
  percentBar('معايير القبول المحققة', Math.round((8 / 13) * 100)),
  new Paragraph({ spacing: { after: 150 } }),

  boldPara('🎯 الخطوات التالية (حسب الأولوية):'),
  new Paragraph({ spacing: { after: 50 } }),
  bullet('1. [حرجة] إزالة 41 رابط /reports/keywords/ و 2 رابط index 2 من sitemap.xml'),
  bullet('2. [حرجة] حذف أو إعادة تسمية ملفي index 2.html'),
  bullet('3. [عالية] إصلاح 28 مرجع أصل مكسور (logo.PNG + Gemini.png)'),
  bullet('4. [عالية] إضافة الصفحات العامة المفقودة للسايت ماب (~15-20 صفحة)'),
  bullet('5. [عالية] إنشاء redirects أو landing pages للمسارات المفقودة (/smart-medical-archive/, /tenders/)'),
  bullet('6. [عالية] إصلاح 45 مشكلة hreflang'),
  bullet('7. [متوسطة] إضافة صور og:image مخصصة لكل ديمو'),
  bullet('8. [متوسطة] تحويل CSS إلى logical properties لدعم RTL'),
  bullet('9. [متوسطة] إنشاء نسخ إنجليزية للديموهات التجارية المهمة'),
  bullet('10. [منخفضة] إضافة لقطات شاشة/فيديو لكل ديمو'),
);

// ═══════════════════════════════════════════════════
// CREATE THE DOCUMENT
// ═══════════════════════════════════════════════════

const doc = new Document({
  creator: 'Bright AI SEO Agent',
  title: 'تقرير التدقيق الشامل - Bright AI',
  description: 'Technical SEO, Indexability, UX/UI, Saudi SEO Audit Report',
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // Letter size
        margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
      },
    },
    children: sections,
  }],
});

const outPath = path.join(ROOT, 'reports', 'brightai-seo-audit-report.docx');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buf);
console.log(`✅ تم إنشاء التقرير: ${outPath}`);
console.log(`📊 حجم الملف: ${(buf.length / 1024).toFixed(1)} KB`);
console.log(`📄 عدد الصفحات التقديري: ~25 صفحة`);
