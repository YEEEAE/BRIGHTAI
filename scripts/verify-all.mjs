#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
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
  const IGNORED_DIRS = [
    'node_modules', 
    '.git', 
    '.agents',
    '.next',
    '.render-static',
    'reports',
    'dist',
    'build',
    'coverage',
    'tmp'
  ];
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
let hasBrokenInternalLinks = false;

for (const file of allHtmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // فحص الروابط المكسورة أو القديمة
  const brokenPatterns = [
    /href=["']\/frontend\/pages\//gi,
    /href=["']\/backend\//gi,
    /href=["'].*\.onrender\.com/gi
  ];
  
  for (const pattern of brokenPatterns) {
    if (pattern.test(content)) {
      hasBrokenInternalLinks = true;
      errors.push({ type: 'Internal Link', file, issue: `Contains broken or old internal link pattern: ${pattern}` });
    }
  }
}

logStatus(!hasBrokenInternalLinks, 'لا توجد روابط داخلية مكسورة أو قديمة في ملفات HTML.');

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
    console.log(`⚠️ المجلد ${path.basename(dirPath)} غير موجود - تم التخطي.`);
    return true; // لا نعتبره خطأ إذا كان المجلد غير موجود
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
    const canonicalRegex = new RegExp(`<link[^>]+rel=["']canonical["'][^>]*href=["']${expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');

    if (!canonicalRegex.test(content)) {
      allValid = false;
      errors.push({ type: 'Canonical', file: filePath, issue: `Missing or incorrect canonical for ${slug}. Expected: ${expectedCanonical}` });
    }
  }
  return allValid;
}

// فحص المجلدات الرئيسية
const mainDirs = ['blog', 'kernel', 'demo', 'docs', 'about', 'services', 'pricing'];
let allCanonicalsValid = true;

for (const dir of mainDirs) {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    const isValid = checkCanonicals(dirPath, dir);
    if (!isValid) allCanonicalsValid = false;
  }
}

logStatus(allCanonicalsValid, 'جميع الملفات تحتوي على canonical tags صحيحة.');


// 3. فحص sitemap.xml
console.log('\n--- 3. فحص sitemap.xml ---');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
let sitemapValid = true;
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  
  const pagesWithSlash = ['about', 'blog'];
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


// 5. فحص البنية الأساسية للصفحات
console.log('\n--- 5. فحص البنية الأساسية للصفحات ---');
let structureValid = true;

for (const file of allHtmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // تخطي الصفحات الخاصة
  const basename = path.basename(file);
  if (['404.html', '500.html', 'offline.html'].includes(basename)) continue;
  if (file.includes('/components/') || file.includes('/templates/')) continue;
  
  // فحص العناصر الأساسية
  const hasTitle = /<title[^>]*>[\s\S]*?<\/title>/i.test(content);
  const hasMetaDescription = /<meta[^>]+name=["']description["'][^>]*>/i.test(content);
  const hasH1 = /<h1[^>]*>/i.test(content);
  
  if (!hasTitle || !hasMetaDescription || !hasH1) {
    structureValid = false;
    const missing = [];
    if (!hasTitle) missing.push('title');
    if (!hasMetaDescription) missing.push('meta description');
    if (!hasH1) missing.push('H1');
    errors.push({ 
      type: 'Structure', 
      file, 
      issue: `Missing essential elements: ${missing.join(', ')}` 
    });
  }
}

logStatus(structureValid, 'جميع الصفحات تحتوي على العناصر الأساسية (title, description, H1).');


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
