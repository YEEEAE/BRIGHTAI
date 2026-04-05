const fs = require('fs');
const path = require('path');

// ======= الإعدادات الأساسية =======
const BASE_URL = 'https://brightai.site';
// المجلدات المستثناة لتفادي العبث في مسارات النظام والمكاتب
const IGNORED_DIRS = ['.git', 'node_modules', 'scripts', '.agents', '.gemini', 'dist', 'build', 'public'];

/**
 * دالة حساب وتكوين رابط الصفحة 
 */
function generateUrlPath(filePath, rootDir) {
  // استخراج المسار النسبي انطلاقاً من المجلد الرئيسي للمشروع
  let relativePath = path.relative(rootDir, filePath);
  let urlPath = relativePath.split(path.sep).join('/');
  
  // معالجة التوجيه (Routing): كل ما بداخل frontend/pages يظهر بالموقع بدون المسار نفسه
  if (urlPath.startsWith('frontend/pages/')) {
    urlPath = urlPath.replace('frontend/pages/', '');
  }
  
  return `/${urlPath}`;
}

/**
 * دالة البحث الشامل في جميع مجلدات المشروع (باستثناء المستثناة)
 */
function findHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORED_DIRS.includes(file)) continue;

    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findHtmlFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * حقن الوسوم فقط في حالة عدم وجودها
 */
function processHtmlFile(filePath, rootDir) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // شرط المستخدم: "اذا فيه لايضيف"
  if (fileContent.includes('hreflang=')) {
    console.log(`⏩ تم التخطي (يحتوي مسبقاً على السيو): ${path.relative(rootDir, filePath)}`);
    return;
  }

  const urlPath = generateUrlPath(filePath, rootDir);

  const originalUrl = `${BASE_URL}${urlPath}`;
  const enUrl = `${BASE_URL}/en${urlPath}`;

  const hreflangTags = `
    <!-- تحسينات SEO: hreflang (تمت إضافتها تلقائياً) -->
    <link rel="alternate" hreflang="ar-SA" href="${originalUrl}" />
    <link rel="alternate" hreflang="en-US" href="${enUrl}" />
    <link rel="alternate" hreflang="x-default" href="${originalUrl}" />
  `;

  // محاولة إضافة الكود قبل نهاية <head> مباشرًة
  if (fileContent.includes('</head>')) {
    const updatedContent = fileContent.replace('</head>', `${hreflangTags}\n</head>`);
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`✅ تمت الإضافة: ${path.relative(rootDir, filePath)}`);
  } else {
    console.warn(`⚠️ لم يتم العثور على <head> في: ${path.relative(rootDir, filePath)}`);
  }
}

function main() {
  const rootDir = process.cwd();
  console.log('🚀 جاري فحص *كافة* ملفات HTML في المشروع...');
  
  const htmlFiles = findHtmlFiles(rootDir);
  
  if (htmlFiles.length === 0) {
    console.log('لم يتم اكتشاف أي ملفات HTML.');
    return;
  }

  htmlFiles.forEach(file => {
    processHtmlFile(file, rootDir);
  });
  
  console.log('\\n🎉 اكتمل الفحص والإضافة بنجاح لتغطية الشمولية!');
}

main();
