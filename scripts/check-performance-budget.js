const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const root = process.cwd();
const configPath = path.join(root, 'scripts', 'performance-budget.config.json');

if (!fs.existsSync(configPath)) {
  console.error('فشل: ملف إعداد ميزانية الأداء غير موجود.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function readSize(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    return { exists: false, bytes: 0 };
  }
  return { exists: true, bytes: fs.statSync(abs).size };
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} ك.ب`;
}

const failures = [];

for (const asset of config.assets || []) {
  const result = readSize(asset.path);
  if (!result.exists) {
    failures.push(`ملف غير موجود: ${asset.path}`);
    continue;
  }
  if (result.bytes > asset.maxBytes) {
    failures.push(
      `${asset.label}: ${asset.path} حجمه ${formatBytes(result.bytes)} وتجاوز الحد ${formatBytes(asset.maxBytes)}`
    );
  }
}

for (const group of config.pageGroups || []) {
  const matches = globSync(group.pattern, { cwd: root, nodir: true });
  if (matches.length === 0) {
    failures.push(`لا توجد ملفات مطابقة للنمط: ${group.pattern}`);
    continue;
  }
  for (const rel of matches) {
    const bytes = fs.statSync(path.join(root, rel)).size;
    if (bytes > group.maxBytes) {
      failures.push(
        `${group.label}: ${rel} حجمه ${formatBytes(bytes)} وتجاوز الحد ${formatBytes(group.maxBytes)}`
      );
    }
  }
}

for (const combo of config.combined || []) {
  let total = 0;
  let missing = false;
  for (const rel of combo.paths || []) {
    const result = readSize(rel);
    if (!result.exists) {
      failures.push(`ملف غير موجود ضمن ${combo.label}: ${rel}`);
      missing = true;
      break;
    }
    total += result.bytes;
  }
  if (!missing && total > combo.maxBytes) {
    failures.push(
      `${combo.label}: الحجم الإجمالي ${formatBytes(total)} وتجاوز الحد ${formatBytes(combo.maxBytes)}`
    );
  }
}

if (failures.length > 0) {
  console.error('فشل ميزانية الأداء:');
  for (const line of failures) {
    console.error(`- ${line}`);
  }
  process.exit(1);
}

console.log('نجاح: جميع حدود ميزانية الأداء ضمن الحدود المسموحة.');
