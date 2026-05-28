import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const BASE_URL = 'https://brightai.site';
const TODAY = new Date().toISOString().split('T')[0];

console.log('=== [BrightAI Sitemap Generator] بدء توليد خريطة الموقع sitemap.xml ===\n');

// المجلدات والملفات المطلوب تجاهلها
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'backend',
  'scripts',
  '.agents',
  '.claude',
  'tmp',
  'reports',
  'offline',
  'login',
  'forgot-password',
  'reset-password',
  'permission-denied',
  'profile'
]);

const IGNORED_FILES = new Set([
  '404.html',
  '500.html',
  'error.html'
]);

const sitemapUrls = [];

function walkDirectory(dir, currentRelativePath = '') {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const relativeFilePath = path.join(currentRelativePath, file.name);

    if (file.isDirectory()) {
      if (IGNORED_DIRS.has(file.name) || file.name.startsWith('.')) {
        continue;
      }
      walkDirectory(path.join(dir, file.name), relativeFilePath);
    } else if (file.isFile() && file.name.endsWith('.html')) {
      if (IGNORED_FILES.has(file.name)) {
        continue;
      }

      // فحص المسار بحثاً عن كلمات مستبعدة
      const lowerPath = relativeFilePath.toLowerCase();
      let shouldIgnore = false;
      for (const ignoreWord of IGNORED_DIRS) {
        if (lowerPath.split(path.sep).includes(ignoreWord)) {
          shouldIgnore = true;
          break;
        }
      }
      if (shouldIgnore) continue;

      sitemapUrls.push(relativeFilePath);
    }
  }
}

walkDirectory(repoRoot);

// تحويل مسارات الملفات إلى مسارات URL متوافقة مع محركات البحث وسيو
const cleanUrls = sitemapUrls.map(filePath => {
  // توحيد الفواصل المائلة
  let urlPath = filePath.replace(/\\/g, '/');

  if (urlPath === 'index.html') {
    return '/';
  }

  if (urlPath.endsWith('/index.html')) {
    // عنكبوت البحث يستبدل /about/index.html بـ /about/
    return '/' + urlPath.slice(0, -10) + '/';
  }

  // تحويل ملفات HTML الأخرى مثل kernel/chat.html إلى /kernel/chat/
  if (urlPath.endsWith('.html')) {
    return '/' + urlPath.slice(0, -5) + '/';
  }

  return '/' + urlPath;
}).filter(url => {
  // التأكد من استبعاد أي مسارات مسجلة للملفات الحساسة
  const segments = url.split('/');
  return !segments.some(segment => IGNORED_DIRS.has(segment) || IGNORED_FILES.has(segment));
});

// إزالة التكرار إن وجد وترتيبها
const uniqueUrls = [...new Set(cleanUrls)].sort();

// إنشاء محتوى sitemap.xml
let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

for (const url of uniqueUrls) {
  const fullUrl = `${BASE_URL}${url}`;
  const priority = url === '/' ? '1.0' : (url.startsWith('/kernel/') ? '0.8' : '0.6');
  const changefreq = url === '/' ? 'daily' : 'weekly';

  xmlContent += `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
}

xmlContent += `</urlset>\n`;

const sitemapPath = path.join(repoRoot, 'sitemap.xml');
fs.writeFileSync(sitemapPath, xmlContent, 'utf8');

console.log(`✓ تم توليد ملف sitemap.xml بنجاح!`);
console.log(`✓ إجمالي المسارات المؤرشفة: ${uniqueUrls.length}`);
console.log(`✓ مسار الحفظ: ${sitemapPath}\n`);
uniqueUrls.forEach(url => console.log(`  - ${BASE_URL}${url}`));
console.log('\n======================================================');
