import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

console.log('=== [BrightAI Render Readiness Checker] التحقق من جاهزية النشر على Render ===\n');

let failed = false;

// 1. التحقق من وجود الملفات الأساسية لـ Render والواجهة الخلفية
const renderYamlPath = path.join(repoRoot, 'render.yaml');
const backendPkgPath = path.join(repoRoot, 'frontend/package.json');
const backendLockPath = path.join(repoRoot, 'frontend/package-lock.json');

if (!fs.existsSync(renderYamlPath)) {
  console.error('✗ [render.yaml] ملف التكوين render.yaml غير موجود في جذر المشروع!');
  process.exit(1);
}

console.log('✓ [الملفات] ملف render.yaml موجود.');

if (!fs.existsSync(backendPkgPath)) {
  console.error('✗ [frontend] ملف frontend/package.json غير موجود!');
  failed = true;
} else {
  console.log('✓ [الملفات] ملف frontend/package.json موجود.');
}

if (!fs.existsSync(backendLockPath)) {
  console.warn('⚠️ [frontend] ملف frontend/package-lock.json غير موجود! يوصى بوجوده لضمان استقرار البناء.');
} else {
  console.log('✓ [الملفات] ملف frontend/package-lock.json موجود.');
}

// 2. قراءة وتحليل render.yaml بأسلوب معالجة خطوط النصوص لتقليل الاعتمادية على الحزم الخارجية
const renderYamlContent = fs.readFileSync(renderYamlPath, 'utf8');

// فحص وجود rootDir: frontend
const hasRootDirBackend = /rootDir:\s*frontend/i.test(renderYamlContent);
if (hasRootDirBackend) {
  console.log('✓ [render.yaml] الخاصية rootDir مضبوطة إلى frontend بشكل صحيح لخدمة الـ API.');
} else {
  console.warn('⚠️ [render.yaml] لم يتم العثور على rootDir: frontend لخدمات الـ API في render.yaml. يرجى التأكد من التكوين.');
}

// فحص وجود DATABASE_URL
const hasDatabaseUrl = /DATABASE_URL/i.test(renderYamlContent);
const hasFromDatabase = /fromDatabase:/i.test(renderYamlContent) || /connectionString/i.test(renderYamlContent);

if (hasDatabaseUrl && (hasFromDatabase || /value:/i.test(renderYamlContent))) {
  console.log('✓ [DATABASE_URL] المتغير البيئي DATABASE_URL معرف بشكل سليم في render.yaml.');
} else {
  console.error('✗ [DATABASE_URL] المتغير البيئي DATABASE_URL غير موجود أو غير مضبوط في render.yaml!');
  failed = true;
}

// 3. التحقق من توافق NODE_VERSION
const nodeVersionMatch = renderYamlContent.match(/key:\s*NODE_VERSION[\s\S]*?value:\s*['"]?(\d+)['"]?/i);
if (nodeVersionMatch) {
  const renderNodeVersion = parseInt(nodeVersionMatch[1], 10);
  console.log(`✓ [NODE_VERSION] إصدار Node في render.yaml هو: ${renderNodeVersion}`);

  // التحقق من توافقها مع engines في package.json الرئيسي
  const mainPkgPath = path.join(repoRoot, 'package.json');
  if (fs.existsSync(mainPkgPath)) {
    const mainPkg = JSON.parse(fs.readFileSync(mainPkgPath, 'utf8'));
    const requiredNode = mainPkg.engines?.node || '';
    console.log(`  - متطلبات المشروع في package.json: ${requiredNode}`);

    // محاكاة سريعة للتحقق من التوافق
    if (requiredNode.includes('22') && renderNodeVersion !== 22) {
      console.warn(`⚠️ [تعارض الإصدار] إصدار Node المطلوب في package.json هو 22، بينما في render.yaml هو ${renderNodeVersion}. يفضل تطابقهما.`);
    } else {
      console.log('✓ [التوافق] إصدارات Node متوافقة بين التكوين والملفات.');
    }
  }
} else {
  console.warn('⚠️ [NODE_VERSION] لم يتم العثور على متغير NODE_VERSION في render.yaml. قد يتم استخدام الإصدار الافتراضي على Render.');
}

console.log('\n======================================================');
if (failed) {
  console.error('✗ فشل التحقق من جاهزية Render! يرجى مراجعة وتعديل التكوينات المذكورة.');
  process.exit(1);
} else {
  console.log('✅ نجح فحص جاهزية Render بالكامل! المشروع مهيأ ومهيكل بطريقة ممتازة للنشر المباشر.');
  process.exit(0);
}
