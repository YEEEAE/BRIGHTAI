import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const reportsDir = path.join(rootDir, 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const errors = [];
let passedChecks = 0;
let totalChecks = 0;

function logStatus(status, message) {
  totalChecks++;
  if (status) {
    console.log(`✓ ${message}`);
    passedChecks++;
  } else {
    console.log(`✗ ${message}`);
  }
}

// دالة لجلب جميع ملفات HTML في المشروع (باستثناء بعض المجلدات)
function getAllHtmlFiles(dir, fileList = []) {
  const IGNORED_DIRS = ['eng-abdrahman', 'node_modules', '.git', 'backup-sectors', 'reports'];
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORED_DIRS.includes(file)) continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allHtmlFiles = getAllHtmlFiles(rootDir);

// 1. فحص الروابط الداخلية
console.log('--- 1. فحص الروابط الداخلية ---');
let hasBloggerLinks = false;
let hasSectorsLinks = false;
let hasPrivacyLinks = false;

for (const file of allHtmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('href="/frontend/pages/blogger/')) {
    hasBloggerLinks = true;
    errors.push({ type: 'Internal Link', file, issue: 'Contains /frontend/pages/blogger/ link' });
  }
  if (content.includes('href="/frontend/pages/sectors/')) {
    hasSectorsLinks = true;
    errors.push({ type: 'Internal Link', file, issue: 'Contains /frontend/pages/sectors/ link' });
  }
  if (content.includes('href="/frontend/pages/privacy-cookies/')) {
    hasPrivacyLinks = true;
    errors.push({ type: 'Internal Link', file, issue: 'Contains /frontend/pages/privacy-cookies/ link' });
  }
}

logStatus(!hasBloggerLinks, 'لا يوجد href يحتوي /frontend/pages/blogger/ في أي ملف HTML.');
logStatus(!hasSectorsLinks, 'لا يوجد href يحتوي /frontend/pages/sectors/ في أي ملف HTML.');
logStatus(!hasPrivacyLinks, 'لا يوجد href يحتوي /frontend/pages/privacy-cookies/ في أي ملف HTML.');

// 2. فحص Canonicals
console.log('\n--- 2. فحص Canonicals ---');

function shouldSkip(filename) {
  if (filename.includes(' ')) return true;
  if (filename.includes('.doc')) return true;
  if (filename.includes('#U')) return true;
  if (/[^\x00-\x7F]/.test(filename)) return true;
  return false;
}

function checkCanonicals(dirPath, urlPrefix) {
  if (!fs.existsSync(dirPath)) {
    logStatus(false, `المجلد ${path.basename(dirPath)} غير موجود للتحقق منه.`);
    errors.push({ type: 'Directory Missing', issue: `${dirPath} is missing` });
    return false;
  }
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));
  let allValid = true;

  for (const file of files) {
    if (shouldSkip(file)) continue;
    
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const slug = file.replace('.html', '');
    const expectedCanonical = slug === 'index'
      ? `https://brightai.site/${urlPrefix}/`
      : `https://brightai.site/${urlPrefix}/${slug}/`;
    const canonicalRegex = new RegExp(`<link[^>]+rel=["']canonical["'][^>]*href=["']${expectedCanonical}["'][^>]*>`, 'i');
    const scopedCanonicalRegex = new RegExp(`<link[^>]+rel=["']canonical["'][^>]*href=["']https://brightai\\.site/${urlPrefix}/[^"']*["'][^>]*>`, 'i');

    if (!canonicalRegex.test(content) && !scopedCanonicalRegex.test(content)) {
      allValid = false;
      errors.push({ type: 'Canonical', file: filePath, issue: `Missing or incorrect canonical for ${slug}. Expected: ${expectedCanonical}` });
    }
  }
  return allValid;
}

const blogCanonicalsValid = checkCanonicals(path.join(rootDir, 'blog'), 'blog');
logStatus(blogCanonicalsValid, 'جميع ملفات المدونة الصالحة تحتوي على canonical الصحيح (blog).');

const sectorsCanonicalsValid = checkCanonicals(path.join(rootDir, 'sectors'), 'sectors');
logStatus(sectorsCanonicalsValid, 'جميع ملفات القطاعات الصالحة تحتوي على canonical الصحيح (sectors).');


// 3. فحص sitemap.xml
console.log('\n--- 3. فحص sitemap.xml ---');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
let sitemapValid = true;
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  
  const pagesWithSlash = ['about', 'ai-agent', 'blog', 'ai-bots'];
  for (const page of pagesWithSlash) {
    if (!sitemapContent.match(new RegExp(`https://brightai.site/${page}/<`, 'i'))) {
       sitemapValid = false;
       errors.push({ type: 'Sitemap Trailing Slash', issue: `${page}/ is missing its trailing slash.` });
    }
  }
} else {
  sitemapValid = false;
  errors.push({ type: 'Sitemap Missing', issue: 'sitemap.xml not found' });
}
logStatus(sitemapValid, 'Sitemap مطابق لقواعد trailing slash المحددة.');


// 4. فحص noindex للملفات المنقولة
console.log('\n--- 4. فحص noindex للملفات المنقولة ---');
let noindexValid = true;
for (const file of allHtmlFiles) {
  const basename = path.basename(file);
  // تجاهل مساحات العمل والمجلدات التي تحتوي على نسخ وغيرها
  if (basename.startsWith('تم نقل الصفحة') && !file.includes('backup')) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('noindex')) {
      noindexValid = false;
      errors.push({ type: 'NoIndex Missing', file, issue: `File starting with "تم نقل الصفحة" missing noindex meta tag.` });
    }
  }
}
logStatus(noindexValid, 'جميع ملفات (تم نقل الصفحة) تحتوي على وسم noindex.');


// 5. فحص روابط القطاعات
console.log('\n--- 5. فحص روابط القطاعات ---');
let sectorsLinksValid = true;
const sectorsDir = path.join(rootDir, 'sectors');
if (fs.existsSync(sectorsDir)) {
  const files = fs.readdirSync(sectorsDir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    if (file === 'index.html') continue;
    const content = fs.readFileSync(path.join(sectorsDir, file), 'utf8');
    // استخدمت كلاس related-content للتأكد، ولكنه قد يكون مختلفاً في الكود الذي تم حقنه. الكود الذي حقناه فيه class="related-content"
    if (!content.includes('related-content')) {
      sectorsLinksValid = false;
      errors.push({ type: 'Sector Links Missing', file: path.join('sectors', file), issue: 'Missing related-content section' });
    }
  }
} else {
  sectorsLinksValid = false;
}
logStatus(sectorsLinksValid, 'جميع ملفات القطاعات تحتوي على قسم المقالات ذات الصلة (related-content).');


// التقرير النهائي
console.log(`\n============ ملخص التحقق ============`);
console.log(`${passedChecks}/${totalChecks} فحص ناجح.`);
console.log(`=====================================\n`);

if (errors.length > 0) {
  const reportPath = path.join(reportsDir, 'verify-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(errors, null, 2), 'utf8');
  console.log(`⚠️ تم العثور على أخطاء! تمت كتابتها في ${reportPath}`);
  process.exit(1);
} else {
  console.log(`✅ كل شيء يبدو مثالياً، لا توجد أخطاء!`);
  process.exit(0);
}
