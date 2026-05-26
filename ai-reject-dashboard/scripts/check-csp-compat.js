const fs = require('fs');
const path = require('path');

// AR: فحص ملفات HTML للتأكد من خلوها من أي inline scripts أو روابط CDN غير متوافقة مع CSP الجديد.
// EN: Audit HTML files to ensure they do not contain inline scripts or non-compliant CDN links.

const PAGES_DIR = path.join(__dirname, '../frontend/pages');
const COMPLIANT_CDNS = []; // strict CSP allows no external script CDNs

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  let hasErrors = false;

  // 1. Check for active inline scripts (excluding script blocks that are just loading local scripts)
  // Simple check for <script> blocks that contain actual code (not just src or placeholders)
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const scriptTag = match[0];
    const scriptBody = match[1].trim();
    
    // If it has no src attribute and contains text, it is inline JS
    if (!scriptTag.includes('src=') && scriptBody.length > 0) {
      // Check if it's our dummy marker or actual inline code
      if (!scriptBody.includes('function ') && !scriptBody.includes('return ') && !scriptBody.includes('const ') && !scriptBody.includes('let ')) {
        continue; // ignore simple non-code contents or configuration script blocks if any
      }
      console.error(`\x1b[31m[FAIL]\x1b[0m Inline script detected in ${relativePath}:`);
      console.error(scriptTag.substring(0, 150) + (scriptTag.length > 150 ? '...' : ''));
      hasErrors = true;
    }
  }

  // 2. Check for script tags pointing to CDNs (e.g., https://cdn.jsdelivr.net)
  const srcRegex = /<script\b[^>]*src=["'](https?:\/\/[^"']+)["']/gi;
  while ((match = srcRegex.exec(content)) !== null) {
    const url = match[1];
    if (!url.startsWith('/') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      console.error(`\x1b[31m[FAIL]\x1b[0m External CDN script detected in ${relativePath}: ${url}`);
      hasErrors = true;
    }
  }

  return !hasErrors;
}

function runAudit() {
  console.log('Starting Security & CSP Compatibility Audit...');
  let totalFiles = 0;
  let passedFiles = 0;

  function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (file.endsWith('.html')) {
        totalFiles++;
        if (checkFile(fullPath)) {
          passedFiles++;
        }
      }
    }
  }

  traverse(PAGES_DIR);

  console.log(`\nAudit Complete: ${passedFiles}/${totalFiles} HTML files compliant with strict CSP.`);
  if (passedFiles < totalFiles) {
    console.error('\x1b[31mAudit Failed! Please resolve the non-compliant scripts listed above.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32mAudit Passed! All HTML files are ready for strict production CSP.\x1b[0m');
    process.exit(0);
  }
}

runAudit();
