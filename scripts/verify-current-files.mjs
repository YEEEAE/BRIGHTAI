import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

console.log('=== [BrightAI Verification] بدء فحص تطابق وجود الملفات الفعلية ===\n');

let failed = false;
const report = [];

function checkFileExists(relativePath, description) {
  const absolutePath = path.join(repoRoot, relativePath);
  const exists = fs.existsSync(absolutePath);
  if (exists) {
    console.log(`✓ [موجود] ${description}: ${relativePath}`);
    report.push({ file: relativePath, status: 'pass', description });
  } else {
    console.error(`✗ [مفقود] ${description}: ${relativePath}`);
    report.push({ file: relativePath, status: 'fail', description });
    failed = true;
  }
}

// 1. فحص ملفات الإعدادات والتحضير للـ Render
checkFileExists('render.yaml', 'ملف تكوين النشر على Render');
checkFileExists('sitemap.xml', 'خريطة الموقع الأساسية');
checkFileExists('frontend/server.js', 'ملف تشغيل خادم الواجهة الخلفية الرئيسي');

// 2. فحص صفحات Kernel الحيوية
const kernelPages = [
  'kernel/index.html',
  'kernel/chat.html',
  'kernel/audit.html',
  'kernel/approvals.html',
  'kernel/stats.html'
];

for (const page of kernelPages) {
  checkFileExists(page, `صفحة Kernel الأساسية (${path.basename(page)})`);
}

// 3. فحص ومراجعة كافة السكربتات المذكورة في package.json
console.log('\n--- التحقق من السكربتات البرمجية المحددة في package.json ---');

function verifyPackageScripts(packagePath) {
  const absolutePackagePath = path.join(repoRoot, packagePath);
  if (!fs.existsSync(absolutePackagePath)) {
    console.error(`✗ ملف package.json غير موجود في المسار: ${packagePath}`);
    failed = true;
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(absolutePackagePath, 'utf8'));
  const scripts = pkg.scripts || {};

  for (const [name, command] of Object.entries(scripts)) {
    // نبحث عن أي استدعاء لملفات node المحلية مثل node scripts/... أو node backend/...
    const nodeScriptRegex = /(?:node|bash)\s+([\w\-\.\/]+\.(?:js|mjs|cjs|sh))/g;
    let match;
    while ((match = nodeScriptRegex.exec(command)) !== null) {
      const scriptRelativePath = match[1];
      // في حال كان package.json في frontend، يكون المسار نسبياً لـ frontend
      const checkPath = packagePath.startsWith('frontend/')
        ? path.join('frontend', scriptRelativePath)
        : scriptRelativePath;

      // نتجاهل السكربتات المضمنة في node_modules أو الأوامر العامة
      if (!scriptRelativePath.includes('node_modules')) {
        checkFileExists(checkPath, `سكربت تشغيل (${name})`);
      }
    }
  }
}

verifyPackageScripts('package.json');
verifyPackageScripts('frontend/package.json');

console.log('\n======================================================');
if (failed) {
  console.error('✗ فشل التحقق! بعض الملفات أو السكربتات الأساسية مفقودة في المشروع.');
  process.exit(1);
} else {
  console.log('✅ نجح التحقق بالكامل! جميع الملفات والسكربتات متطابقة مع الأكواد الفعلية.');
  process.exit(0);
}
