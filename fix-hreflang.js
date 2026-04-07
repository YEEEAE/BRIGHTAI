#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const projectRoot = __dirname;

console.log('🔧 Fixing hreflang and URL structure for Bright AI...\n');

// دالة للبحث عن جميع ملفات HTML في المجلد
function findHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            // تجاهل المجلدات المخفية و node_modules و .git
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                files.push(...findHtmlFiles(fullPath));
            }
        } else if (item.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

// البحث عن جميع ملفات HTML
console.log('🔍 البحث عن ملفات HTML...');
const htmlFiles = findHtmlFiles(projectRoot);
console.log(`📄 تم العثور على ${htmlFiles.length} ملف HTML\n`);

let totalFixed = 0;

// معالجة كل ملف
htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    const relativePath = path.relative(projectRoot, file);
    
    // 1. إصلاح الروابط التي تحتوي على /en/en/ (تكرار)
    if (content.includes('/en/en/')) {
        content = content.replace(/\/en\/en\//g, '/en/');
        console.log(`   ✅ إصلاح تكرار /en/en/ في: ${relativePath}`);
        modified = true;
    }
    
    // 2. إصلاح hreflang الخاطئة
    // البحث عن hreflang en-US وتصحيحها
    const hreflangEnPattern = /<link[^>]*rel="alternate"[^>]*hreflang="en-US"[^>]*href="([^"]*)"[^>]*>/g;
    const hreflangMatches = [...content.matchAll(hreflangEnPattern)];
    
    hreflangMatches.forEach(match => {
        const currentUrl = match[1];
        // إذا كان الرابط يحتوي على تكرار أو يشير لملف .html
        if (currentUrl.includes('/en/en/') || currentUrl.includes('docs.html')) {
            const correctUrl = currentUrl
                .replace(/\/en\/en\//g, '/en/')
                .replace(/docs\.html$/, '')
                .replace(/\/$/, '/');
            content = content.replace(match[0], match[0].replace(currentUrl, correctUrl));
            console.log(`   ✅ إصلاح hreflang en-US: ${currentUrl} → ${correctUrl}`);
            modified = true;
        }
    });
    
    // 3. إصلاح الروابط الداخلية التي تشير لـ docs.html
    if (content.includes('href="/en/docs/docs.html"')) {
        content = content.replace(/href="\/en\/docs\/docs\.html"/g, 'href="/en/docs/"');
        console.log(`   ✅ إصلاح رابط /en/docs/docs.html في: ${relativePath}`);
        modified = true;
    }
    
    // 4. إصلاح URLs في JSON-LD
    if (content.includes('"url":"https://brightai.site/docs.html"')) {
        content = content.replace(/"url":"https:\/\/brightai\.site\/docs\.html"/g, '"url":"https://brightai.site/en/docs/"');
        console.log(`   ✅ إصلاح URL في JSON-LD`);
        modified = true;
    }
    
    // 5. إصلاح canonical للملفات الإنجليزية
    if (file.includes('/en/') && content.includes('canonical')) {
        const canonicalPattern = /<link rel="canonical" href="([^"]*)" \/>/;
        const canonicalMatch = content.match(canonicalPattern);
        if (canonicalMatch) {
            const currentCanonical = canonicalMatch[1];
            if (currentCanonical.includes('docs.html') || currentCanonical.includes('/en/en/')) {
                const correctCanonical = currentCanonical
                    .replace(/\/en\/en\//g, '/en/')
                    .replace(/docs\.html$/, '');
                content = content.replace(canonicalMatch[0], `<link rel="canonical" href="${correctCanonical}" />`);
                console.log(`   ✅ إصلاح canonical: ${currentCanonical} → ${correctCanonical}`);
                modified = true;
            }
        }
    }
    
    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        totalFixed++;
    }
});

console.log(`\n🎉 تم الإصلاح! تم تحديث ${totalFixed} ملف`);

// التحقق من الملف المحدد en/docs/docs.html
const enDocsFile = path.join(projectRoot, 'en/docs/docs.html');
if (fs.existsSync(enDocsFile)) {
    console.log('\n� التحقق من en/docs/docs.html:');
    const content = fs.readFileSync(enDocsFile, 'utf8');
    
    // التحقق من canonical
    const canonicalMatch = content.match(/<link rel="canonical" href="([^"]*)" \/>/);
    if (canonicalMatch) {
        console.log(`   Canonical: ${canonicalMatch[1]}`);
    }
    
    // التحقق من hreflang
    const hreflangPattern = /<link[^>]*rel="alternate"[^>]*hreflang="([^"]*)"[^>]*href="([^"]*)"[^>]*>/g;
    const hreflangMatches = [...content.matchAll(hreflangPattern)];
    console.log('   Hreflang tags:');
    hreflangMatches.forEach(match => {
        console.log(`      ${match[1]}: ${match[2]}`);
    });
}

console.log('\n🌐 البنية الصحيحة للروابط:');
console.log('   - canonical: https://brightai.site/en/docs/');
console.log('   - hreflang en-US: https://brightai.site/en/docs/');
console.log('   - hreflang ar-SA: https://brightai.site/docs/');
console.log('   - hreflang x-default: https://brightai.site/docs/');
