import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

console.log('=== [BrightAI Kernel Page Checker] فحص صفحات الكيرنل ومؤشرات السيو والأمان ===\n');

const kernelPages = [
  { file: 'kernel/index.html', canonical: 'https://brightai.site/kernel/' },
  { file: 'kernel/chat.html', canonical: 'https://brightai.site/kernel/chat/' },
  { file: 'kernel/audit.html', canonical: 'https://brightai.site/kernel/audit/' },
  { file: 'kernel/approvals.html', canonical: 'https://brightai.site/kernel/approvals/' },
  { file: 'kernel/stats.html', canonical: 'https://brightai.site/kernel/stats/' }
];

let failed = false;

for (const page of kernelPages) {
  const filePath = path.join(repoRoot, page.file);
  console.log(`\n--- فحص الصفحة: ${page.file} ---`);

  if (!fs.existsSync(filePath)) {
    console.error(`✗ [مفقود] الملف غير موجود: ${page.file}`);
    failed = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(content);

  // 1. التحقق من Canonical Link
  const canonicalHref = $('link[rel="canonical"]').attr('href');
  if (canonicalHref === page.canonical) {
    console.log(`✓ [Canonical] الرابط صحيح ومطابق: ${canonicalHref}`);
  } else {
    console.error(`✗ [Canonical] الرابط غير متطابق أو مفقود. المتوقع: ${page.canonical}، المستخرج: ${canonicalHref || 'لا يوجد'}`);
    failed = true;
  }

  // 2. التحقق من ربط ملفات CSS/JS الأساسية
  const hasCSS = $('link[rel="stylesheet"]').length > 0;
  const hasJS = $('script[src]').length > 0;
  
  if (hasCSS) console.log(`✓ [CSS] تم ربط ملفات الأنماط.`);
  else console.warn(`⚠️ [CSS] لم يتم العثور على أي ملف stylesheet خارجي.`);

  if (hasJS) console.log(`✓ [JS] تم ربط ملفات الجافاسكربت.`);
  else console.warn(`⚠️ [JS] لم يتم العثور على أي ملفات script خارجية.`);

  // 3. التحقق من استدعاءات API إلى /api/kernel/*
  const hasApiKernelCalls = /\/api\/kernel\//.test(content);
  if (hasApiKernelCalls) {
    console.log(`✓ [API] تحتوي الصفحة على استدعاءات لواجهة /api/kernel/*.`);
  } else {
    console.warn(`⚠️ [API] لم يتم العثور على أي إشارة لاستدعاءات /api/kernel/* في محتوى الأكواد.`);
  }

  // 4. التحقق من عدم استخدام X-Kernel-User-Id ثابت
  const hasFixedUserId = /X-Kernel-User-Id['"\s]+:['"\s]+dashboard-admin/i.test(content) ||
                         /['"]dashboard-admin['"]/i.test(content) && /X-Kernel-User-Id/i.test(content);
  if (hasFixedUserId) {
    console.error(`✗ [أمان] كود الصفحة يحتوي على X-Kernel-User-Id ثابت (dashboard-admin) وهو خطر أمني!`);
    failed = true;
  } else {
    console.log(`✓ [أمان] لا وجود لـ X-Kernel-User-Id ثابت.`);
  }

  // 5. فحص الوقاية من XSS (استخدام innerHTML بشكل مباشر مع بيانات API)
  const hasDirectInnerHTML = /\.innerHTML\s*=/i.test(content) && (content.includes('fetch(') || content.includes('$.') || content.includes('data'));
  if (hasDirectInnerHTML) {
    console.warn(`⚠️ [تحذير أمان] احتمال استخدام مباشر لـ innerHTML لعرض بيانات API. يفضل استخدام textContent أو المعالجة الآمنة للوقاية من XSS.`);
  } else {
    console.log(`✓ [أمان] لا توجد مؤشرات لاستخدام innerHTML بشكل غير آمن.`);
  }
}

console.log('\n======================================================');
if (failed) {
  console.error('✗ فشل تدقيق صفحات الكيرنل! يرجى إصلاح الأخطاء الحرجة المذكورة أعلاه.');
  process.exit(1);
} else {
  console.log('✅ نجح فحص صفحات الكيرنل بالكامل! جميع معايير السيو والأمان مطابقة ومتوافقة.');
  process.exit(0);
}
