#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeRelPath, relPathToCanonical } from './seo-url-map.mjs';
import { validateSitemapContract, extractSitemapLocs, isSitemapIndex } from './sitemap-contract.mjs';
import { resolveClientBuildRoot } from './_build-output.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

// VERIFY-ALL-001 (2026-07-18): unify client build root resolution so
// pnpm verify:all reads 190 HTML / 189 sitemap URLs from the same
// canonical location as pnpm seo:all / performance:budget /
// redirects:check. The helper exits with a clear error if no build is
// present, instead of silently returning 0 files (which previously
// caused the script to "pass" with 0 broken links and 0 checked pages).
const clientBuild = resolveClientBuildRoot(rootDir);
if (!clientBuild.root) {
  console.error(`❌ تعذر تحديد client build root: ${clientBuild.reason}`);
  process.exit(1);
}
const staticHtmlRoot = clientBuild.root;

// REPORTS-SEC-01 — moved to top via the helper above.
//   `allHtmlFiles` initialization lives further below, AFTER
//   `getAllHtmlFiles` is declared, because JavaScript function
//   declarations hoist but `const` does not.


const errors = [];
let passedChecks = 0;
let totalChecks = 0;
const reportPath = path.join(reportsDir, 'verify-report.json');

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

// VERIFY-ALL-001 (2026-07-18): unified client build root via
//   _build-output.mjs. The previous inline ternary was deleted — the
//   helper now owns resolution for all 4 verification scripts.
const allHtmlFiles = getAllHtmlFiles(staticHtmlRoot);
const htmlFileCount = allHtmlFiles.length;

console.log(
  `--- 0. نطاق الفحص ---\n✅ Client root: ${path.relative(rootDir, staticHtmlRoot) || staticHtmlRoot} | Adapter: ${clientBuild.adapter} | ملفات HTML: ${htmlFileCount}\n`
);
// 1. فحص الروابط الداخلية
console.log('--- 1. فحص الروابط الداخلية ---');
let hasBrokenInternalLinks = false;

for (const file of allHtmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // فحص الروابط المكسورة أو القديمة
  const brokenPatterns = [
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
    const relPath = normalizeRelPath(path.relative(path.join(rootDir, "dist"), filePath));
    const expectedCanonical = relPathToCanonical(relPath, 'https://brightai.site');
    if (!expectedCanonical) continue;
    const canonicalRegex = new RegExp(`<link[^>]+rel=["']canonical["'][^>]*href=["']${expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');

    if (!canonicalRegex.test(content)) {
      allValid = false;
      errors.push({ type: 'Canonical', file: filePath, issue: `Missing or incorrect canonical for ${relPath}. Expected: ${expectedCanonical}` });
    }
  }
  return allValid;
}

// فحص المجلدات الرئيسية
const mainDirs = ['blog', 'kernel', 'demo', 'docs', 'about', 'services', 'pricing'];
let allCanonicalsValid = true;

for (const dir of mainDirs) {
  const dirPath = path.join(rootDir, "dist", dir);
  if (fs.existsSync(dirPath)) {
    const isValid = checkCanonicals(dirPath, dir);
    if (!isValid) allCanonicalsValid = false;
  }
}

logStatus(allCanonicalsValid, 'جميع الملفات تحتوي على canonical tags صحيحة.');


// Wrap top-level execution in an async IIFE so we can use `await` for the
// sitemap contract validator (validateSitemapContract is async because it
// recursively expands sitemapindex and reads page HTML for canonical checks).
async function main() {
// 3a. PRERUN: regenerate the sitemap so it is in its canonical (clean)
// state BEFORE validation. `npm run verify:all` historically ran the
// generator AFTER the validator, which meant the validator saw the
// @astrojs/sitemap output (with design + status pages) and failed. After
// IP-07 the generator also overwrites sitemap-index.xml to point at the
// clean sitemap.xml, so the validator sees the contract-conformant state.
console.log('\n--- 3a. توليد sitemap.xml الموحد ---');
try {
  const { execFileSync } = await import('node:child_process');
  execFileSync('node', ['scripts/generate-sitemap-all-pages.mjs'], {
    cwd: rootDir,
    stdio: 'inherit',
  });
} catch (err) {
  errors.push({
    type: 'Sitemap Generation Failed',
    issue: `generate-sitemap-all-pages.mjs threw: ${err?.message || err}`,
  });
}

console.log('\n--- 3. فحص sitemap (عقد IP-07) ---');
// 3. فحص sitemap — IP-07 + HIGH-05 + HIGH-06
//    Unified sitemap/indexing contract. Reads the sitemap-index.xml (single
//    source of truth) when present, otherwise falls back to the candidate
//    adapter-laid sitemaps. Validates each URL against the contract:
//      - status pages (404, 500, offline, error) must NOT appear
//      - design utilities (/design/*, /styleguide/*) must NOT appear
//      - dev/admin/api routes must NOT appear
//      - URLs must end with trailing slash
//      - duplicates are rejected
//    Also walks each URL against the matching HTML page in dist/ and
//    verifies its <link rel="canonical"> matches the sitemap URL.
//
//    Refs:
//      scripts/sitemap-contract.mjs   — pure validator module
//      scripts/sitemap-contract.test.mjs — unit tests
//      report/2026-07-15-sitemap-contract.md — design + astro.config.mjs
//                                               remediation plan
//      brain.md KI-054 — protected-file remediation pending approval
const sitemapCandidates = [
  path.join(rootDir, 'dist', 'client', 'sitemap-index.xml'),
  path.join(rootDir, 'dist', 'sitemap-index.xml'),
  path.join(rootDir, 'dist', 'client', 'sitemap-0.xml'),
  path.join(rootDir, 'dist', 'client', 'sitemap.xml'),
  path.join(rootDir, 'dist', 'sitemap.xml'),
];
let sitemapPath = sitemapCandidates.find((p) => fs.existsSync(p));
let sitemapValid = true;
if (sitemapPath) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const sitemapRel = path.relative(rootDir, sitemapPath);

  // 3a. Empty-stub guard (preserves the prior check)
  const hasAnyUrl = /<loc>https:\/\/brightai\.site\/[^<]+<\/loc>/.test(sitemapContent);
  if (!hasAnyUrl && !isSitemapIndex(sitemapContent)) {
    sitemapValid = false;
    errors.push({
      type: 'Sitemap Empty',
      issue: `Chosen sitemap (${sitemapRel}) contains no <loc> entries.`,
    });
  } else {
    // 3b. For sitemap-index, expand recursively so every leaf URL is checked.
    const fetchChildFromDist = async (childUrl) => {
      // childUrl is an absolute URL like https://brightai.site/sitemap-0.xml
      const childPathname = new URL(childUrl).pathname.replace(/^\//, '');
      // Try dist/client/ first (adapter-laid), then dist/
      const candidates = [
        path.join(rootDir, 'dist', 'client', childPathname),
        path.join(rootDir, 'dist', childPathname),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate, 'utf8');
        }
      }
      throw new Error(`child sitemap not found: ${childUrl}`);
    };

    // 3c. resolveLocalHtml: load each page from dist/ for canonical checks.
    const resolveLocalHtml = async (sitemapUrl) => {
      const pathname = new URL(sitemapUrl).pathname;
      const filePath = pathname === '/'
        ? path.join(staticHtmlRoot, 'index.html')
        : path.join(staticHtmlRoot, pathname, 'index.html');
      if (!fs.existsSync(filePath)) return null;
      return fs.readFileSync(filePath, 'utf8');
    };

    // 3d. Run the contract validation. Note: the async call is wrapped
    // in an IIFE because verify-all.mjs is currently synchronous top-level.
    let contractResult;
    try {
      contractResult = await validateSitemapContract(sitemapContent, {
        fetchChild: isSitemapIndex(sitemapContent) ? fetchChildFromDist : undefined,
        resolveLocalHtml,
      });
    } catch (err) {
      sitemapValid = false;
      errors.push({
        type: 'Sitemap Contract Error',
        issue: `validateSitemapContract threw: ${err?.message || err}`,
      });
      logStatus(false, 'Sitemap contract validation crashed.');
    }

    if (contractResult) {
      for (const violation of contractResult.errors) {
        sitemapValid = false;
        errors.push({
          type: `Sitemap ${violation.reason}`,
          file: sitemapRel,
          issue: `${violation.url} (${violation.pathname})`,
        });
      }
      for (const canonicalError of contractResult.canonicalErrors) {
        sitemapValid = false;
        errors.push({
          type: `Sitemap ${canonicalError.reason}`,
          file: sitemapRel,
          issue: `${canonicalError.url} — canonical: ${canonicalError.canonical || '(missing)'}, expected: ${canonicalError.expected}`,
        });
      }

      // 3e. Trailing-slash legacy check removed (IP-07). The contract
      // validator already enforces trailing slashes on every URL via
      // `requireTrailingSlash: true`. The old check was a no-op when the
      // sitemap was a sitemap-index (which contains only child sitemap URLs,
      // not page URLs).
    }
  }
} else {
  sitemapValid = false;
  errors.push({ type: 'Sitemap Missing', issue: 'sitemap.xml not found' });
}
logStatus(sitemapValid, 'Sitemap مطابق لعقد الفهرسة الموحد (status + design + canonical).');


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
  if (content.includes('http-equiv="refresh"') || content.includes('Redirecting to:')) continue;
  
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

return { errors, passedChecks, totalChecks, reportPath };
} // end of async function main()

// Top-level wrapper: run main(), print summary, then exit with the right code.
// This MUST happen after main() resolves — otherwise process.exit() races
// against the async work and sections 3, 4, 5 never run.
main()
  .then(({ errors, passedChecks, totalChecks, reportPath }) => {
    console.log(`\n============ ملخص التحقق ============`);
    console.log(`${passedChecks}/${totalChecks} فحص ناجح.`);
    console.log(`=====================================\n`);

    if (errors.length > 0) {
      fs.writeFileSync(reportPath, JSON.stringify(errors, null, 2), 'utf8');
      console.log(`⚠️ تم العثور على أخطاء! تمت كتابتها في ${reportPath}`);
      process.exit(1);
    } else {
      if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
      }
      console.log(`✅ كل شيء يبدو مثالياً، لا توجد أخطاء!`);
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error(`✗ verify-all.mjs crashed: ${err?.stack || err}`);
    process.exit(2);
  });
