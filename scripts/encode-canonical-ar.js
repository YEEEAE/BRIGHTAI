const fs = require('fs');
const path = require('path');

/**
 * 🚀 BrightAI - SEO Canonical Link Encoder (Arabic to Percent-Encoded)
 * 
 * هذا السكربت يقوم بالبحث في جميع ملفات المشروع عن روابط canonical
 * التي تحتوي على حروف عربية أو مسافات، ويقوم بتحويل هذه الأجزاء فقط 
 * لصيغة percent-encoded باستخدام `encodeURIComponent` مع المحافظة
 * التامة على بنية الرابط (/، :، .) دون إتلافها.
 */

// المسار الجذري للمشروع
const projectRoot = path.resolve(__dirname, '..');

// مجلدات أو ملفات يجب استثناؤها من البحث لتحسين الأداء
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.vercel'];

/**
 * دالة للبحث عن جميع ملفات HTML في المشروع بشكل تراجعي (Recursive)
 */
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

/**
 * الدالة الرئيسية لمعالجة الملفات
 */
function processCanonicalLinks() {
  console.log('⏳ جاري البحث عن ملفات HTML...');
  const htmlFiles = walkSync(projectRoot);
  console.log(`📄 تم العثور على ${htmlFiles.length} ملف HTML. جاري الفحص...`);

  let updatedCount = 0;

  // ريجكس للبحث عن وسم canonical يدعم الحالتين (href قبل rel أو العكس)
  const canonicalRegex = /<link\s+[^>]*?rel=["']canonical["'][^>]*?href=["']([^"']+)["'][^>]*>|<link\s+[^>]*?href=["']([^"']+)["'][^>]*?rel=["']canonical["'][^>]*>/gi;

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    const newContent = content.replace(canonicalRegex, (match, href1, href2) => {
      // استخراج قيمة الـ href المقروءة
      const originalHref = href1 || href2;
      
      // نتحقق مما إذا كان الرابط يحتوي على حروف خارج النطاق القياسي (ASCII القابل للطباعة)
      // هذا يشمل الحروف العربية والمسافات (المسافة هي ضمن \x00-\x20). 
      // \x21-\x7E تمثل الحروف الإنجليزية، الأرقام والرموز مثل / و : و .
      if (/[^\x21-\x7E]/.test(originalHref)) {
        
        // تحويل الأجزاء العربية والمسافات فقط باستخدام encodeURIComponent
        const encodedHref = originalHref.replace(/[^\x21-\x7E]+/g, (nonAsciiMatch) => {
          return encodeURIComponent(nonAsciiMatch);
        });

        if (encodedHref !== originalHref) {
          hasChanges = true;
          // تلوين وتنسيق المخرجات
          console.log('\n----------------------------------------');
          console.log(`📂 الملف: ${path.relative(projectRoot, filePath)}`);
          console.log(`🔴 قبل: ${originalHref}`);
          console.log(`🟢 بعد:  ${encodedHref}`);
          
          return match.replace(originalHref, encodedHref);
        }
      }
      return match;
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      updatedCount++;
    }
  }

  console.log('\n========================================');
  console.log(`🎉 اكتملت العملية! تم تحديث الروابط في ${updatedCount} ملف.`);
  console.log('========================================\n');
}

// تنفيذ السكربت
processCanonicalLinks();
