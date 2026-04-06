const fs = require('fs');
const path = require('path');

/**
 * 🚀 BrightAI - Auto Inject Missing Canonical Links
 * 
 * هذا السكربت يقوم بفحص جميع ملفات المشروع:
 * 1. يتخطى الملف الذي يمتلك Canonical بالفعل.
 * 2. يبني مسار Canonical تلقائي بناءً على اسم الملف ومساره.
 * 3. يحول index.html إلى مسار رئيسي / مجلد.
 * 4. يضيف (Trailing Slash) للروابط تلقائياً.
 * 5. يشفر الحروف العربية (Percent-Encoding) كما في السكربت السابق.
 * 6. يزرع الوسم قبل إغلاق </head>.
 */

const projectRoot = path.resolve(__dirname, '..');
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.vercel'];

// دالة لجلب كل ملفات HTML في المشروع
function walkSync(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        walkSync(filePath, fileList);
      }
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// دالة لتشفير النصوص العربية في الرابط للحفاظ على سلامة الرابط
function safeEncodeArabicUrl(url) {
  return url.replace(/[^\x21-\x7E]+/g, (match) => {
    return encodeURIComponent(match);
  });
}

// الدالة الرئيسية للفحص والإضافة
function injectMissingCanonicals() {
  console.log('⏳ جاري الفحص بحثاً عن ملفات HTML تفقد وسم Canonical...');
  const htmlFiles = walkSync(projectRoot);
  let updatedCount = 0;

  // ريجكس للتأكد من عدم وجود canonical لتفادي التكرار
  const hasCanonicalRegex = /<link\s+[^>]*?rel=["']canonical["'][^>]*>/i;
  // ريجكس للعثور على نهاية الترويسة للزرع بداخلها
  const headCloseRegex = /<\/head>/i;

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // تجاهل الملف إذا كان يحتوي على كانونيكال مسبقاً
    if (hasCanonicalRegex.test(content)) {
      continue;
    }

    // استخراج مسار الملف نسبة إلى المشروع وتوحيد صيغة الشرطة المائلة
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    
    // إزالة امتداد .html
    let slug = relativePath.replace(/\.html$/i, '');

    // معالجة حالة ملفات النقطة الصفرية (index)
    if (slug.endsWith('/index')) {
      // إزالة كلمة index وترك الـ trailing slash
      slug = slug.substring(0, slug.length - 5); 
    } else if (slug === 'index') {
      // الصفحة الرئيسية للموقع
      slug = '';
    } else {
      // ملف عادي (مثل about) تتم إضافة trailing slash له
      slug = slug + '/';
    }

    // بناء الرابط النهائي
    let canonicalUrl = `https://brightai.site/${slug}`;
    
    // تشفير الحروف العربية في المسار إن وجدت
    canonicalUrl = safeEncodeArabicUrl(canonicalUrl);

    // زراعة الوسم داخل الملف
    if (headCloseRegex.test(content)) {
      const canonicalTag = `<link rel="canonical" href="${canonicalUrl}">`;
      
      // إضافة الوسم بسطر جديد ومسافة بادئة متناسبة مع الكود
      const newContent = content.replace(headCloseRegex, `    ${canonicalTag}\n</head>`);
      
      fs.writeFileSync(filePath, newContent, 'utf-8');
      
      console.log('\n----------------------------------------');
      console.log(`📂 الملف: ${relativePath}`);
      console.log(`➕ تمت الإضافة: ${canonicalUrl}`);
      
      updatedCount++;
    }
  }

  console.log('\n========================================');
  console.log(`🎉 اكتملت العملية! تم إضافة وسم Canonical لـ ${updatedCount} ملف.`);
  console.log('========================================\n');
}

injectMissingCanonicals();
